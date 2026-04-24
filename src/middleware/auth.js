import { decodeToken } from '../utils/jwt';
import userModel from '../model/userModel';
export const ensureAuth = (...userType) => {
  return function(req, res, next){
  if (!req.headers.authorization && userType.includes("Guest")) {
    return next();
  }   
  if (!req.headers.authorization) {
    return res
      .status(401)
      .send({ status:"error", message: "The request does not have an Authentication header." });
  }

  // Remove Bearer from string
  const token = req.headers.authorization.replace(/^Bearer\s+/, "");

  try {
    var payload = decodeToken(token);
    if (payload.expiresIn < Math.floor(new Date().getTime() / 1000)) {
      return res.status(401).send({ status:"error", message: "Token Expired" });
    }
  } catch (err) {
    return res.status(401).send({ status:"error", message: "Invalid Token" });
  }

  userModel.findOne({
       _id: payload.id,
       status: 'Active'
 })
 .then((user)=>{
    if (!user) {
        return res.status(404).send({ status:"error", message: "Invalid User" });
    }
    
    if(user.user_type === "Admin" || userType.includes(user.user_type) || userType.includes('Guest')){
      req.user = payload;
      console.log("req.permission",req.permission)
      req.permission.global =true
      if (
        user?.Role?.accessIDs?.split(",")?.includes(req.module + "-global") &&
        user.user_type !== "Admin"
      ) {
        req.permission.global = true;
      }
      return next();
    }

    if (!user.Role?.accessIDs.split(",").includes(req.permission.module)) {
      return res
        .status(403)
        .send({ status: "error", message: "Access Denied" });
    }

    if (user.Role.accessIDs.split(",").includes(req.module + "-global")) {
      req.permission.global = true;
    } else {
      req.permission.global = false;
    }
    req.user = payload;
    return next();
 })
 .catch((err)=>{
  console.log(err)
  res.status(500).send({ status:"error", message: "Server Error", result:err })
 })

};
};

 
export const setModule = (module) => {
  return function(req, res, next){
    req.module = module;

    switch (req.method) {
      case 'GET':
        req.permission = { module: module+'-read' };
        break;
    
      case 'POST':
        req.permission = { module: module+'-write' };
        break;

      case 'PUT':
        req.permission = { module: module+'-write' };
        break;

      case 'PATCH':
        req.permission = { module: module+'-all' };
        break;

      case 'DELETE':
        req.permission = { module: module+'-all' };
        break;
      default:
        break;
    }
    next();
  }
}