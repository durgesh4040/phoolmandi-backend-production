import express from 'express';
const api = express.Router();
import {ensureAuth,setModule} from "../middleware/auth.js"
import { createCountry, deleteCountry, getCountries, getCountryById, updateCountry, updateCountryStatus } from "../controller/countries.controller.js";
api.get("/",getCountries);
api.post("/", ensureAuth("Admin"),createCountry);
api.get(
  "/:id",
  getCountryById
);
api.patch(
  "/:id",
  ensureAuth("Admin"),
  updateCountryStatus
);
api.put(
  "/:id",
  ensureAuth("Admin"),
  updateCountry
);
api.delete(
  "/:id",
  ensureAuth("Admin"),
  deleteCountry
);
export default api;