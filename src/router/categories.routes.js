import express from "express";
import {createcategories,getAllCategories, getCategoriesById,updateCategories,deleteCategory} from "../controller/categories.controller.js";
import {ensureAuth,setModule} from "../middleware/auth.js"
const api=express.Router();
setModule("Categories")
api.post("/",ensureAuth("Admin"),createcategories)
api.get("/",getAllCategories)
api.get("/:id",getCategoriesById)
api.put("/:id",ensureAuth("Admin"),updateCategories)
api.delete("/:id",ensureAuth("Admin"),deleteCategory)
export default api;