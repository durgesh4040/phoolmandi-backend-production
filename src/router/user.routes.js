import express from "express";
import { login, register, test, getUser,getAllUsers} from "../controller/user.controller.js";
import {ensureAuth,setModule} from "../middleware/auth.js"
const api=express.Router();
api.post("/",register)
api.post("/login",login)
api.get("/",getAllUsers)
api.get("/:id",getUser)
api.get("/test",test)
export default api;