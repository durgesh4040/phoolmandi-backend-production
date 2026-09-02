import express from "express";
import { createContacts, updateContacts, deleteContacts, getAllContacts, getContactById } from "../controller/contacts.controller.js";
import { ensureAuth, setModule } from "../middleware/auth.js"
const api = express.Router();
setModule("Contacts");
api.post("/", createContacts)
api.get("/", ensureAuth("Admin"), getAllContacts)
api.get("/:id", ensureAuth("Admin"), getContactById)
api.put("/:id", ensureAuth("Admin"), updateContacts)
api.delete("/:id", ensureAuth("Admin"), deleteContacts)
export default api;