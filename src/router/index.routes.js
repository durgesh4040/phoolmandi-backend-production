import express from "express";
const api=express.Router();
import liveroutes from "./live.routes.js";
import selleroutes from "./seller.routes.js";
import authroutes from "./user.routes.js";
api.use("/live",liveroutes);
api.use("/seller",selleroutes);
api.use("/auth",authroutes);
export default api;
