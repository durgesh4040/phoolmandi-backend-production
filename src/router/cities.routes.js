
import express from 'express'
import { createCity, deleteCity, getCities, getCityById, getCityByStateId, updateCity, updateCityStatus } from "../controller/cities.controller.js";
import {ensureAuth,setModule} from "../middleware/auth.js"
const api=express.Router();
api.use(setModule('City'));
api.post("/", ensureAuth("Admin"),createCity);
api.get("/", getCities);
api.get(
  "/:id",
  getCityById
);
api.patch(
  "/:id",
  ensureAuth("Admin"),
  updateCityStatus
);
api.put(
  "/:id",
  ensureAuth("Admin"),
  updateCity
);
api.delete(
  "/:id",
  ensureAuth("Admin"),
  deleteCity
);
api.get("/state/:stateId",getCityByStateId);
export default api;