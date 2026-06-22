import express from "express";
const api=express.Router();
import authroutes from "./user.routes.js";
import categries from "./categories.routes.js";
// api.use("/live",liveroutes);
// api.use("/seller",selleroutes);
api.use("/categories",categries)
api.use("/",authroutes);
export default api;
