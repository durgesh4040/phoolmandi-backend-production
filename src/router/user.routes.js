import express from "express";
import { login, register, test } from "../controller/userController.js";
const api=express.Router();
api.post("/register",register)
api.post("/login",login)
api.get("/test",test)
export default api;