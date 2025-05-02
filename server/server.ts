import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { PrismaClient } from "./generated/prisma";
import authRoutes from "./routes/authroutes";
import profileRoutes from "./routes/profileRoutes";
import journalRoutes from "./routes/journalRoutes";

export const prisma = new PrismaClient();
const app = express();

const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:3000", // Add your client URLs here
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  exposedHeaders: ["set-cookie"],
};

app.use(cookieParser());
app.use(express.json());
app.use(cors(corsOptions));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Root route for health check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "NERDC Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/journals", journalRoutes);

// API health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Nerdc Server running on port ${PORT}`);
});

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({
      success: false,
      error: "Something went wrong!",
    });
  }
);

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit();
});

export default app;
