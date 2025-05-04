import express from "express";
import { 
  addToCart, 
  clearCart, 
  getCheckoutInfo, 
  getUserCart, 
  removeFromCart 
} from "../controllers/cartController";
import { authenticate } from "../middleware/authMiddleware";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get user's active cart
router.get("/", (req, res, next) => {
  getUserCart(req, res, next);
});

// Add a journal to cart
router.post("/add", (req, res, next) => {
  addToCart(req, res, next);
});

// Remove a journal from cart
router.delete("/item/:cartItemId", (req, res, next) => {
  removeFromCart(req, res, next);
});

// Clear cart
router.delete("/clear", (req, res, next) => {
  clearCart(req, res, next);
});

// Get checkout information for payment
router.get("/checkout", (req, res, next) => {
  getCheckoutInfo(req, res, next);
});

export default router; 