import express from "express";
import { register, login, logout, checkAuthStatus } from "../controllers/authController";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get('/status', protect, checkAuthStatus);
// Add this to your authRoutes temporarily
router.get('/debug-cookies', (req, res) => {
  console.log('All cookies received:', req.cookies);
  console.log('Auth token cookie:', req.cookies?.auth_token);
  console.log('Request headers:', req.headers);
  
  res.json({
    cookies: req.cookies,
    authToken: req.cookies?.auth_token,
    headers: req.headers
  });
});

export default router;