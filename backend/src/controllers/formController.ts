// controllers/formController.ts
import { Request, Response } from "express";
import Form from "../models/Form";
import { geminiFormService } from "../services/geminiService";

interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const generateForm = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { prompt, title } = req.body;
    const userId = req.userId;

    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required" });
    }

    // Generate actual schema using Gemini
    const schema = await geminiFormService.generateFormSchema(prompt, title);
    console.log(schema);
    const form = await Form.create({ 
      title: schema.title, 
      description: schema.description,
      owner: userId, 
      schema,
      submissions: []
    });

    res.json(form);
  } catch (error: unknown) {
    
    console.error("Form generation error:", error);
    
    if (error instanceof Error && error.message.includes("Failed to generate form schema")) {
      return res.status(500).json({ 
        message: "AI service unavailable. Please try again later." 
      });
    }
    
    res.status(500).json({ message: "Failed to generate form" });
  }
};

export const getForm = async (req: Request, res: Response) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).json({ message: "Form not found" });
    res.json(form);
  } catch (error) {
    console.error("Get form error:", error);
    res.status(500).json({ message: "Failed to fetch form" });
  }
};

export const getUserForms = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const forms = await Form.find({ owner: userId })
      .select("title schema submissions createdAt")
      .sort({ createdAt: -1 });
    
    res.json({ forms });
  } catch (error) {
    console.error("Get user forms error:", error);
    res.status(500).json({ message: "Failed to fetch forms" });
  }
};

export const submitForm = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const submissionData = req.body;

    const form = await Form.findByIdAndUpdate(
      id,
      {
        $push: {
          submissions: {
            data: submissionData,
            submittedAt: new Date()
          }
        }
      },
      { new: true }
    );

    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    res.json({ message: "Submission saved successfully" });
  } catch (error) {
    console.error("Form submission error:", error);
    res.status(500).json({ message: "Failed to save submission" });
  }
};