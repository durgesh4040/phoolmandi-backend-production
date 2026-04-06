import { Router } from "express";
import { login, register, test } from "../controller/userController.js";
const router=Router();

router.post("/register",register)
router.post("/login",login)
router.get("/test",test)

export default router;