import express from "express";
import {createcategories,getAllCategories, getCategoriesById,updateCategories,deleteCategory} from "../controller/categories.controller.js";
import {ensureAuth,setModule} from "../middleware/auth.js"
const api=express.Router();
api.post("/",createcategories)
api.get("/",getAllCategories)
api.get("/:id",getCategoriesById)
api.put("/:id",updateCategories)
api.delete("/:id",deleteCategory)
export default api;