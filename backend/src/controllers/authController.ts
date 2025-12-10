import { Request, Response } from "express";
import User from "../models/User";
import { hashPassword, verifyPassword, createToken } from "../services/authService";

// Interface extension needed for the 'checkAuthStatus' function
// It expects 'userId' to be attached by the 'protect' middleware.
interface AuthenticatedRequest extends Request {
  userId?: string;
}

// Helper function to set the cookie securely
const setAuthCookie = (res: Response, token: string) => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // JWT best practice: Set the token in an HttpOnly cookie
    res.cookie('auth_token', token, {
        httpOnly: true, // Crucial: Prevents client-side JS access (XSS defense)
        secure: isProduction, // Send cookie only over HTTPS in production
        sameSite : isProduction ? 'none' : 'lax', // Helps mitigate CSRF attacks
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        path: '/', 
    });
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already exists" });

    const passwordHash = await hashPassword(password);
    const user = await User.create({ email, passwordHash, name });
    const token = createToken(user.id);
    
    // Set the token as an HTTP-only cookie
    setAuthCookie(res, token);
    
    // Only return the user data in the body, not the token
    res.json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return res.status(400).json({ message: "Invalid credentials" });
    console.log("Incoming cookies:", req.headers.cookie);

    const token = createToken(user.id);
    
    // Set the token as an HTTP-only cookie
    setAuthCookie(res, token);

    console.log("Cookie set in response headers:", {
      'Set-Cookie': res.getHeader('Set-Cookie')
    });
    
    res.json({ 
      message: "Login successful",
      userId: user.id 
    });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Invalid credentials" });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite : process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/', 
  });
  
  res.json({ message: "Logout successful" });
};
/**
 * Checks the authentication status using the token verified by the 'protect' middleware.
 * This is the API used by the client's app/page.tsx to check if the user is logged in.
 */
export const checkAuthStatus = async (req: AuthenticatedRequest, res: Response) => {
    // If this function executes, it means the 'protect' middleware successfully
    // verified the cookie and the user is authenticated.
     const user = await User.findById(req.userId);
    res.json({ 
        message: "Authenticated", 
        // We can optionally return the userId attached by the middleware
        userId: req.userId,
        username: user?.name
    });
};
