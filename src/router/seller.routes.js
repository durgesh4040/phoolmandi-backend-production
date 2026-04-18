import express from "express";
import { sellerRegistration } from "../controller/sellerController.js";
const api=express.Router();
api.post("/",sellerRegistration);

export default api;