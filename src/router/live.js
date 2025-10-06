import express from "express";
import upload from "../utility/storage.js";
import { liveFlowerGet, liveflowerSave } from "../controller/liveController.js";

const router = express.Router();

router.post("/live/save", upload.single("image"), liveflowerSave);
router.get("/live/get",liveFlowerGet);

export default router;
