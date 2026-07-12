import express from "express";
import { login, register, test, getUser,getAllUsers,sendOtp} from "../controller/user.controller.js";
import {ensureAuth,setModule} from "../middleware/auth.js"
const api=express.Router();
setModule("Users")
api.post("/",register)
api.post("/login",login)
api.get("/",ensureAuth("Admin"),getAllUsers)
api.get("/:id",getUser)
api.get("/test",test)
api.post("/send-otp",sendOtp)
export default api;