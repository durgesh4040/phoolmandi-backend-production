import express from "express";
import { sellerRegistration } from "../controller/sellerController.js";
import auth from "../model/"
const api=express.Router();
api.post("/",sellerRegistration);

export default api;