import express from "express";
const api=express.Router();
import authroutes from "./user.routes.js";
import categries from "./categories.routes.js";
import  products from "./product.routes.js";
import countries from "./countries.routes.js";
import states from "./states.routes.js";
import cities from "./cities.routes.js"
import contactsroutes from "./contact.routes.js";
api.use("/categories",categries)
api.use("/products",products)
api.use('/country',countries);
api.use("/city",cities)
api.use("/state",states)
api.use("/",authroutes);
api.use("/contacts",contactsroutes);

export default api;
