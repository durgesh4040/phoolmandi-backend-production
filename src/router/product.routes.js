import express from "express";
import {
    createProducts,
    getAllProducts,
    getAllProductsById,
    updateProducts,
    deleteProducts
} from "../controller/product.controller.js";
import {ensureAuth,setModule} from "../middleware/auth.js"
const api=express.Router();
api.post("/",createProducts)
api.get("/",getAllProducts)
api.get("/:id",getAllProductsById)
api.put("/:id",updateProducts)
api.delete("/:id",deleteProducts)
export default api;