import { Router } from "express";
import { sellerRegistration } from "../controller/sellerController.js";
const router=Router();

router.post("/auth/seller/register",sellerRegistration);

export default router;