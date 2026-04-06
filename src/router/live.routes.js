import express from "express";
import upload from "../utility/storage.js";
import { liveFlowerGet, liveflowerSave } from "../controller/liveController.controller.js";

const router = express.Router();

router.post("/save", upload.single("image"), liveflowerSave);
router.get("/get",liveFlowerGet);

export default router;
