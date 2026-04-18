import express from "express";
import { login, register, test } from "../controller/user.controller.js";
const api=express.Router();
api.post("/",register)
api.post("/login",login)
api.get("/")
api.get("/test",test)
export default api;