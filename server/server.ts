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
  origin: function(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    const allowedOrigins = [process.env.CLIENT_URL];
    if (process.env.NODE_ENV !== 'production') {
      allowedOrigins.push(process.env.CLIENT_URL || "https://nerdc-journals.vercel.app");
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  exposedHeaders: ["Set-Cookie"], 
};

app.use(cookieParser());
app.use(express.json());
app.use(cors(corsOptions));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Debug middleware for cookies
app.use((req, res, next) => {
  console.log(`Request cookies: ${JSON.stringify(req.cookies)}`);
  
  // Store the original setHeader method
  const originalSetHeader = res.setHeader;
  
  // Override setHeader method to log cookie settings
  res.setHeader = function(name, value) {
    if (name === 'Set-Cookie') {
      console.log(`Setting cookie: ${value}`);
    }
    return originalSetHeader.apply(this, [name, value] as any);
  };
  
  next();
});

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
