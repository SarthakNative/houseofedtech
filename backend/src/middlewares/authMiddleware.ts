import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../services/authService";
import express from "express";
import cookieParser from 'cookie-parser';

const app = express();
app.use(cookieParser());
interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const protect = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Check if cookies object exists
  if (!req.cookies) {
    console.error("Cookies object is undefined - cookie-parser middleware might be missing");
    return res.status(500).json({ 
      message: "Server configuration error: cookies not available" 
    });
  }

  // 1. Get the token from the HTTP-only cookie
  const token = req.cookies.auth_token; 

  if (!token) {
    console.log("No auth_token cookie found in request");
    return res.status(401).json({ 
      message: "Access denied. No authentication token provided." 
    });
  }

  try {
    // 2. Verify the token
    const payload = verifyToken(token); 

    if (!payload || !payload.userId) {
      console.log("Token verification failed - invalid payload");
      return res.status(401).json({ message: "Invalid or expired token." });
    }

    // 3. Token is valid: Attach the user ID to the request
    req.userId = payload.userId;

    // 4. Continue to the next controller/middleware
    next();

  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};