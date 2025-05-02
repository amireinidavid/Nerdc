import express from "express";
import { authenticateUser } from "../middleware/authMiddleware";
import { 
  getProfile, 
  completeProfile, 
  updateProfile, 
  toggleResearcherStatus,
  getAllUsers,
  getUserById,
  adminUpdateUser
} from "../controllers/profileController";
import { authorizeRoles } from "../middleware/authorizationMiddleware";
import { UserRole } from "../generated/prisma";

const router = express.Router();

// User routes - require authentication
router.get("/me", authenticateUser, getProfile);
router.post("/complete", authenticateUser, completeProfile);
router.put("/update", authenticateUser, updateProfile);
router.put("/toggle-researcher", authenticateUser, toggleResearcherStatus);

// Admin routes - require admin role
router.get("/users", authenticateUser, authorizeRoles([UserRole.ADMIN]), getAllUsers);
router.get("/users/:id", authenticateUser, authorizeRoles([UserRole.ADMIN]), getUserById);
router.put("/users/:id", authenticateUser, authorizeRoles([UserRole.ADMIN]), adminUpdateUser);

export default router; 