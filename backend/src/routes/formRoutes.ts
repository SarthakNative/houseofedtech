// routes/formRoutes.ts
import express from "express";
import { protect } from "../middlewares/authMiddleware";
import { generateForm, getForm, getUserForms, submitForm } from "../controllers/formController";

const router = express.Router();

router.post("/generate", protect, generateForm);
router.get("/", protect, getUserForms); // Get user's forms
router.get("/:id", getForm); // Get specific form (public)
router.post("/:id/submit", submitForm); // Submit to form (public)

export default router;