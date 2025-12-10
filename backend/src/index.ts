import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import * as dotenv from "dotenv";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoutes";
import formRoutes from "./routes/formRoutes";
import submissionRoutes from "./routes/submissionRoutes";

dotenv.config();

const app = express();
app.use(cookieParser());

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_ORIGIN,
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept'
  ],
  exposedHeaders: ['Set-Cookie']
};

// Apply CORS globally
app.use(cors(corsOptions));

// Middleware to parse JSON bodies
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/submissions", submissionRoutes);

// Health check route
app.get("/", (_, res) => res.send("Sarthak's API for HouseOfEdTech is running ✅"));

// ✅ FIXED: Connect to MongoDB without deprecated options
mongoose.connect(process.env.MONGODB_URI || "")
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch(err => console.error("❌ DB error:", err));

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));