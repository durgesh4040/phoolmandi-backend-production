import { Router } from "express";
import { login, register, test } from "../controller/userController.js";
const router=Router();

router.post("/auth/register",register)
router.post("/auth/login",login)
router.get("/test",test)

export default router;