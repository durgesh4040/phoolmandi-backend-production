import express from "express";
import { login, register, test,getAllUser} from "../controller/user.controller.js";
const api=express.Router();
api.post("/",register)
api.post("/login",login)
api.get("/",getAllUser)
api.get("/test",test)
export default api;