// middlewares/formOwnershipMiddleware.ts
import { Request, Response, NextFunction } from "express";
import Form, { IForm } from "../models/Form";

interface AuthenticatedRequest extends Request {
  userId?: string;
  form?: IForm;
}

export const checkFormOwnership = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const formId = req.params.id;
    const userId = req.userId;

    const form = await Form.findById(formId);
    
    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    if (form.owner.toString() !== userId) {
      return res.status(403).json({ 
        message: "Unauthorized: You can only modify your own forms" 
      });
    }

    // Attach form to request for use in controller
    req.form = form;
    next();
  } catch (error) {
    console.error("Form ownership check error:", error);
    res.status(500).json({ message: "Server error during authorization check" });
  }
};