import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { PrismaClient } from "./generated/prisma";
import authRoutes from "./routes/authroutes";
import profileRoutes from "./routes/profileRoutes";
import journalRoutes from "./routes/journalRoutes";
import cartRoutes from "./routes/cartRoutes";

// Create temp directory for file uploads if it doesn't exist
const tempDir = '/tmp';
try {
  if (!fs.existsSync(tempDir)) {
    console.log(`Creating temp directory: ${tempDir}`);
    fs.mkdirSync(tempDir, { recursive: true });
  }
} catch (error) {
  console.error(`Error creating temp directory: ${error}`);
}

export const prisma = new PrismaClient();
const app = express();

const corsOptions = {
  origin: function(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    // Hardcode the allowed origins to ensure they work in production
    const allowedOrigins = [
      'https://nerdc-journal.vercel.app',
      'https://nerdc-journals.vercel.app',
      'http://localhost:3000'
    ];
    
    console.log('Request origin:', origin);
    
    // More permissive CORS check - allow if origin contains our domain names
    if (allowedOrigins.some(allowed => origin.includes(allowed.replace('https://', '').replace('http://', '')))) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie", "Access-Token", "Refresh-Token"],
  exposedHeaders: ["Set-Cookie", "Access-Token", "Refresh-Token"], 
};

app.use(cookieParser());
app.use(express.json());
app.use(cors(corsOptions));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Debug middleware for request info
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log(`Request headers: ${JSON.stringify(req.headers)}`);
    console.log(`Request body: ${JSON.stringify(req.body)}`);
    
    // Log file upload information
    if (req.files) {
      try {
        const fileInfo = Array.isArray(req.files) 
          ? req.files.map(f => ({ name: f.originalname, size: f.size, mimetype: f.mimetype }))
          : Object.keys(req.files).map(key => {
              const file = (req.files as any)[key];
              return { name: file.name, size: file.size, mimetype: file.mimetype };
            });
        console.log(`Request files: ${JSON.stringify(fileInfo)}`);
      } catch (err) {
        console.error('Error logging file info:', err);
      }
    }
  }
  
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
app.use("/api/cart", cartRoutes);

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
    console.error('Server error:', err);
    
    // Log detailed error information
    console.error({
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      headers: req.headers,
      body: req.body
    });
    
    // Send appropriate error response
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Something went wrong!",
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
);

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});

// Catch uncaught exceptions to prevent server crashes
process.on('uncaughtException', (error: any) => {
  console.error('Uncaught Exception:', error);
  if (error instanceof Error && 'code' in error && error.code === 'ENOENT' && 'syscall' in error && error.syscall === 'mkdir') {
    console.error('Directory creation error - ensure /tmp is writeable in deployment environment');
  }
  // For production, we want to log this but not crash
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit();
});

export default app;
