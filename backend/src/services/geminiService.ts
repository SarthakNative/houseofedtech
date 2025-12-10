// app/services/geminiService.ts (updated)
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("ERROR: GEMINI_API_KEY environment variable not found.");
  throw new Error("GEMINI_API_KEY is not set.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "your-api-key");

export interface FormField {
  name: string;
  label: string;
  type: "text" | "email" | "number" | "textarea" | "select" | "checkbox" | "radio" | "file" | "date";
  required: boolean;
  options?: string[]; // For select, radio fields
  placeholder?: string;
  accept?: string; // For file fields - e.g., "image/*", ".pdf,.doc"
  multiple?: boolean; // For file fields - allow multiple files
}

export interface FormSchema {
  title: string;
  description?: string;
  fields: FormField[];
}

export class GeminiFormService {
  private model;

  constructor() {
    this.model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    });
  }

  async generateFormSchema(prompt: string, title?: string): Promise<FormSchema> {
    const systemPrompt = `You are a form schema generator. Convert the user's natural language description into a structured JSON form schema.

IMPORTANT: Return ONLY valid JSON, no other text.

JSON Structure:
{
  "title": "Form Title",
  "description": "Optional form description",
  "fields": [
    {
      "name": "fieldName",
      "label": "Field Label",
      "type": "text|email|number|textarea|select|checkbox|radio|file|date",
      "required": true/false,
      "options": ["option1", "option2"], // only for select/radio types
      "accept": "image/*,.pdf", // for file fields - accepted file types
      "multiple": true/false // for file fields - allow multiple files
    }
  ]
}

Field Types:
- "text": Short text input
- "email": Email input with validation
- "number": Numeric input
- "textarea": Long text input
- "select": Dropdown selection
- "checkbox": Multiple selection
- "radio": Single selection
- "file": File upload - use when user mentions uploads, documents, images, files
- "date": Date picker

File Upload Guidelines:
- When user mentions "photo", "image", "picture" → set type: "file", accept: "image/*"
- When user mentions "document", "PDF", "file" → set type: "file", accept: ".pdf,.doc,.docx"
- When user mentions "multiple files" or "multiple images" → set multiple: true
- For resume uploads → set accept: ".pdf,.doc,.docx,.txt"
- For profile pictures → set accept: "image/*", multiple: false

Examples:

User: "I need a job application form with name, email, resume upload, and cover letter"
Output: {
  "title": "Job Application Form",
  "fields": [
    { "name": "name", "label": "Full Name", "type": "text", "required": true },
    { "name": "email", "label": "Email Address", "type": "email", "required": true },
    { "name": "resume", "label": "Upload Resume", "type": "file", "required": true, "accept": ".pdf,.doc,.docx,.txt", "multiple": false },
    { "name": "coverLetter", "label": "Cover Letter", "type": "textarea", "required": false }
  ]
}

User: "Create a property listing form with address, price, and multiple photos"
Output: {
  "title": "Property Listing Form",
  "fields": [
    { "name": "address", "label": "Property Address", "type": "text", "required": true },
    { "name": "price", "label": "Price", "type": "number", "required": true },
    { "name": "photos", "label": "Property Photos", "type": "file", "required": true, "accept": "image/*", "multiple": true }
  ]
}

Now generate schema for: "${prompt}"`;

    try {
      const result = await this.model.generateContent(systemPrompt);
      const response = await result.response;
      const text = response.text();
      
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      const schema: FormSchema = JSON.parse(cleanText);
      
      if (title) {
        schema.title = title;
      }
      
      return schema;
    } catch (error) {
      console.error("Gemini API error:", error);
      throw new Error("Failed to generate form schema");
    }
  }
}

export const geminiFormService = new GeminiFormService();