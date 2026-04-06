import { Router } from "express";
import { sellerRegistration } from "../controller/sellerController.js";
const router=Router();

router.post("/register",sellerRegistration);

export default router;