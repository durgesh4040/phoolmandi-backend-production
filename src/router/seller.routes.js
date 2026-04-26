import express from "express";
import { sellerRegistration } from "../controller/sellerController.js";
import {ensureAuth,setModule} from "../middleware/auth.js"
const api=express.Router();
api.post("/",sellerRegistration);

export default api;