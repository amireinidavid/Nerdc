import express, { RequestHandler } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshTokens,
  getCurrentUser,
  updateProfile,
  changePassword,
  requestPasswordReset,
  resetPassword,
  createAuthorAccount,
} from "../controllers/authController";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware";
import { UserRole } from "../generated/prisma";

const router = express.Router();

// Public routes
router.post("/register", registerUser as unknown as RequestHandler);
router.post("/login", loginUser as unknown as RequestHandler);
router.post("/logout", logoutUser as unknown as RequestHandler);
router.post("/refresh-token", refreshTokens as unknown as RequestHandler);
router.post("/request-password-reset", requestPasswordReset as unknown as RequestHandler);
router.post("/reset-password", resetPassword as unknown as RequestHandler);

// Protected routes
router.get("/me", authenticate as unknown as RequestHandler, getCurrentUser as unknown as RequestHandler);
router.put("/update-profile", authenticate as unknown as RequestHandler, updateProfile as unknown as RequestHandler);
router.post("/change-password", authenticate as unknown as RequestHandler, changePassword as unknown as RequestHandler);

// Admin only routes
router.post(
  "/create-author",
  authenticate as unknown as RequestHandler,
  authorizeRoles(UserRole.ADMIN) as unknown as RequestHandler,
  createAuthorAccount as unknown as RequestHandler
);

export default router;