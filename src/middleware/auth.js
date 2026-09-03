import { decodeToken } from "../utility/util.js";
import { users } from "../db/schema/user.js";
import { db } from "../configuration/db.js";
import { eq, and, sql, isNull } from "drizzle-orm";

export const ensureAuth = (...userType) => {
  return async function(req, res, next) {
    // Allow guest access if no authorization header and Guest is permitted
    if (!req.headers.authorization && userType.includes("Guest")) {
      return next();
    }

    // Reject if no authorization header
    if (!req.headers.authorization) {
      return res.status(401).send({
        status: "error",
        message: "The request does not have an Authentication header."
      });
    }

    // Remove Bearer from string
    const token = req.headers.authorization.replace(/^Bearer\s+/, "");

    // Decode and validate token
    let payload;
    try {
      payload = decodeToken(token);
    } catch (err) {
      return res.status(401).send({
        status: "error",
        message: err.name === "TokenExpiredError" ? "Token Expired" : "Invalid Token"
      });
    }

    try {
      // Find user by ID with Drizzle - handle both string and int IDs
      const userId = parseInt(payload.id) || payload.id;

      const [user] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, userId),
            eq(users.status, "Active"),
            isNull(users.deletedAt)
          )
        )
        .limit(1);
      if (!user) {
        return res.status(404).send({
          status: "error",
          message: "Invalid User"
        });
      }

      // Initialize permission object (safety check)
      req.permission = req.permission || {};

      // Admin bypass or allowed user type
      if (
        user.userRole === "Admin" ||
        userType.includes(user.userRole) ||
        userType.includes("Guest")
      ) {
        req.user = payload;
        req.permission.global = true;

        // Check if user has global access for this module (non-Admin)
        if (
          user?.roleAccess?.split(",")?.includes(req.module + "-global") &&
          user.userRole !== "Admin"
        ) {
          req.permission.global = true;
        }

        return next();
      }

      // Check module permission
      const accessIDs = user.roleAccess ? user.roleAccess.split(",") : [];

      if (!accessIDs.includes(req.permission?.module)) {
        return res.status(403).send({
          status: "error",
          message: "Access Denied"
        });
      }

      // Set global permission flag
      if (accessIDs.includes(req.module + "-global")) {
        req.permission.global = true;
      } else {
        req.permission.global = false;
      }

      req.user = payload;
      return next();

    } catch (err) {
      console.error(err);
      return res.status(500).send({
        status: "error",
        message: "Server Error",
        result: err.message
      });
    }
  };
};

export const setModule = (module) => {
  return function(req, res, next) {
    req.module = module;

    switch (req.method) {
      case "GET":
        req.permission = { module: module + "-read" };
        break;
      case "POST":
        req.permission = { module: module + "-write" };
        break;
      case "PUT":
        req.permission = { module: module + "-write" };
        break;
      case "PATCH":
        req.permission = { module: module + "-all" };
        break;
      case "DELETE":
        req.permission = { module: module + "-all" };
        break;
      default:
        req.permission = { module: module + "-read" };
        break;
    }
    next();
  };
};