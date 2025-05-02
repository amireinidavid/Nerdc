import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "../generated/prisma";
import { PrismaClient } from "../generated/prisma";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "davidinikayiza";
const prisma = new PrismaClient();

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role: UserRole;
        email: string;
      };
    }
  }
}

/**
 * Authentication middleware to validate JWT token
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format

    if (!token) {
      // Also check for token in cookies
      const cookieToken = req.cookies?.accessToken;
      if (!cookieToken) {
         res.status(401).json({
          success: false,
          message: 'Access denied. No token provided.'
        });
      }
    }
    
    // Use either the header token or cookie token
    const actualToken = token || req.cookies?.accessToken;
    
    // Verify the token
    const decoded = jwt.verify(actualToken, JWT_ACCESS_SECRET) as any;
    
    // Set the user in request for use in route handlers
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email
    };
    
    next();
  } catch (error) {
     res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

/**
 * Optional authentication middleware
 * If a token is provided, it will be verified and the user will be set in the request
 * But if no token is provided, the request will continue without authentication
 */
export const optionalAuthenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format
    
    // Also check for token in cookies
    const cookieToken = req.cookies?.accessToken;
    
    // Use either the header token or cookie token
    const actualToken = token || cookieToken;
    
    if (actualToken) {
      // Verify the token
      const decoded = jwt.verify(actualToken, JWT_ACCESS_SECRET) as any;
      
      // Set the user in request for use in route handlers
      req.user = {
        id: decoded.id,
        role: decoded.role,
        email: decoded.email
      };
    }
    
    next();
  } catch (error) {
    // If token verification fails, proceed without authentication
    next();
  }
};

/**
 * Authorization middleware to check user role
 */
export const authorize = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Access denied. Not authenticated.'
        });
        return;
      }
      
      if (!roles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          message: 'Access denied. Not authorized.'
        });
        return;
      }
      
      next();
    } catch(error) {
      console.error(`Error checking authorization: ${error}`);
      next(error);
    }
  };
};

/**
 * Check if user is authorized for a specific resource
 * This is a utility function, not middleware
 */
export const isAuthorized = async (userId: number, resourceId: number, resourceType: string): Promise<boolean> => {
  try {
    switch (resourceType) {
      case 'journal':
        // Check if user is the author of the journal
        const journal = await prisma.journal.findUnique({
          where: { id: resourceId },
          select: { authorId: true }
        });
        return journal?.authorId === userId;
        
      case 'comment':
        // Check if user is the author of the comment
        const comment = await prisma.comment.findUnique({
          where: { id: resourceId },
          select: { userId: true }
        });
        return comment?.userId === userId;
        
      default:
        return false;
    }
  } catch (error) {
    console.error(`Error checking authorization: ${error}`);
    return false;
  }
};

export const authenticateUser = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    // Get token from cookies, authorization header, or custom headers
    // This allows for both browser cookie auth and fallback header-based auth for Vercel
    const token = req.cookies.accessToken || 
      req.headers["access-token"] as string ||
      (req.headers.authorization?.startsWith("Bearer") 
        ? req.headers.authorization.split(" ")[1] 
        : null);

    if (!token) {
      console.log("No token found in request");
      res.status(401).json({
        success: false,
        message: "Access denied. No token provided."
      });
      return;
    }

    console.log("Token found, verifying...");

    // Verify token
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as any;

    // Check token type
    if (decoded.tokenType !== "access") {
      console.log("Invalid token type:", decoded.tokenType);
      res.status(401).json({
        success: false,
        message: "Invalid token type"
      });
      return;
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      console.log("User not found for ID:", decoded.id);
      res.status(401).json({
        success: false,
        message: "User not found"
      });
      return;
    }

    console.log("User authenticated:", user.id);

    // Add user to request object
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: "Invalid token"
      });
      return;
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: "Token expired"
      });
      return;
    }

    console.error("Authentication error:", error);
    res.status(500).json({
      success: false,
      message: "Authentication error",
      error: (error as Error).message
    });
  }
};

export const authorizeRoles = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to access this resource",
      });
    }

    next();
  };
}; 