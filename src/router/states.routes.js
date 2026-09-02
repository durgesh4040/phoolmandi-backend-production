import { createState, deleteState, getStateById, getStates, getStatesByCountryId, updateState, updateStateStatus } from "../controller/states.controller.js";
import express from 'express'
import { setModule, ensureAuth } from "../middleware/auth.js";
const api = express.Router();
api.use(setModule('State'));
api.post("/", ensureAuth("Admin"), createState);
api.get(
    "/",
    getStates
);
api.get(
    "/:id",
    ensureAuth("Admin"),
    getStateById
);
api.patch(
    "/:id",
    ensureAuth("Admin"),
    updateStateStatus
);
api.put(
    "/:id",
    ensureAuth("Admin"),
    updateState
);
api.delete(
    "/:id",
    ensureAuth("Admin"),
    deleteState
);
api.get("/country/:countryId", getStatesByCountryId);
export default api;