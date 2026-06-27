import express from "express";
import {
    createProducts,
    getAllProducts,
    getAllProductsById,
    updateProducts,
    deleteProducts
} from "../controller/product.controller.js";
import {ensureAuth,setModule} from "../middleware/auth.js"
import { validationMessageLocale } from "../utility/validationMessageLocale.js";
import multer from "multer";
import fs from 'fs';       
import path from 'path'; 
const api=express.Router();
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    fs.mkdirSync(global.config.productImageUploadPath, { recursive: true });
    return cb(null, global.config.productImageUploadPath)
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
      /pdf|jpeg|jpg|png/.test(file.mimetype) &&
      /\.(pdf|jpg|jpeg|png)$/i.test(file.originalname);
    if (ok) return cb(null, true);
    return cb(
      new Error(
        validationMessageLocale(req.headers, "invalidFileType")
      )
    );
  },
}
)
api.post("/",upload.single('productImage'),createProducts)
api.get("/",getAllProducts)
api.get("/:id",getAllProductsById)
api.put("/:id",updateProducts)
api.delete("/:id",deleteProducts)
export default api;