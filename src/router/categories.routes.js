import express from "express";
import {createcategories,getAllCategories, getCategoriesById,updateCategories,deleteCategory} from "../controller/categories.controller.js";
import {ensureAuth,setModule} from "../middleware/auth.js"
import multer from "multer";
import fs from "fs";

setModule("Categories")
const api=express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    fs.mkdirSync(global.config.categoryImageUploadPath, { recursive: true });
    return cb(null, global.config.categoryImageUploadPath)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const originalName = file.originalname
      .substring(0, file.originalname.lastIndexOf('.')) 
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')       
      .replace(/[^\w\-]/g, '')   
      .substring(0, 30);           
    const ext = file.originalname.substring(file.originalname.lastIndexOf('.'));
    const filename = `${uniqueSuffix}-${originalName}${ext}`;
    cb(null, filename);
  }
});
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const ok =
      /pdf|jpeg|jpg|png|webp|octet-stream/.test(file.mimetype) &&
      /\.(pdf|jpg|jpeg|png|webp)$/i.test(file.originalname);
    if (ok) return cb(null, true);
    return cb(
      new Error(`Invalid file type. Mimetype: ${file.mimetype}, Name: ${file.originalname}. Only PDF, JPEG, JPG, PNG, and WEBP are allowed.`)
    );
  },
});

api.post("/",upload.single('categoryImage'),ensureAuth("Admin"),createcategories)
api.get("/",getAllCategories)
api.get("/:id",getCategoriesById)
api.put("/:id",upload.single('categoryImage'),ensureAuth("Admin"),updateCategories)
api.delete("/:id",ensureAuth("Admin"),deleteCategory)
export default api;