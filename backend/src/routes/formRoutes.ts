// routes/formRoutes.ts
import express from "express";
import { protect } from "../middlewares/authMiddleware";
import { deleteForm, generateForm, getForm, getUserForms, submitForm, updateForm } from "../controllers/formController";
import { checkFormOwnership } from "../middlewares/formOwnershipMiddleware";

const router = express.Router();

router.post("/generate", protect, generateForm);
router.get("/", protect, getUserForms); // Get user's forms
router.get("/:id", getForm); // Get specific form (public)
router.post("/:id/submit", submitForm); // Submit to form (public)
router.put("/:id", protect, checkFormOwnership, updateForm);
router.delete("/:id", protect, checkFormOwnership, deleteForm);

export default router;