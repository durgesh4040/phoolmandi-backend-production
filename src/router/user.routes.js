import express from "express";
import { login, register, test,getAllUser, getUser} from "../controller/user.controller.js";
import {ensureAuth,setModule} from "../middleware/auth.js"
const api=express.Router();
api.post("/",register)
api.post("/login",login)
api.get("/",getAllUser)
api.get("/:id",getUser)
api.get("/test",test)
export default api;