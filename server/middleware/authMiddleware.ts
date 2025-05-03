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
    // Check for token in multiple places with fallbacks
    const authHeader = req.headers.authorization;
    const headerToken = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format
    const accessHeaderToken = req.headers['access-token'] as string;
    const cookieToken = req.cookies?.accessToken;
    
    // Use token from any available source
    const token = headerToken || accessHeaderToken || cookieToken;

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
      return;
    }
    
    try {
      // Verify the token
      const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as any;
      
      // Check token type
      if (decoded.tokenType !== "access") {
        res.status(401).json({
          success: false,
          message: "Invalid token type"
        });
        return;
      }
      
      // Set the user in request for use in route handlers
      req.user = {
        id: decoded.id,
        role: decoded.role,
        email: decoded.email || ''
      };
      
      next();
    } catch (jwtError) {
      console.error('JWT Verification failed:', jwtError);
      
      if (jwtError instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          message: 'Token expired, please refresh'
        });
        return;
      }
      
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication service error'
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
    // Check for token in multiple places with fallbacks
    const authHeader = req.headers.authorization;
    const headerToken = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format
    const accessHeaderToken = req.headers['access-token'] as string;
    const cookieToken = req.cookies?.accessToken;
    
    // Use token from any available source
    const token = headerToken || accessHeaderToken || cookieToken;
    
    if (token) {
      try {
        // Verify the token
        const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as any;
        
        // Only set user if token is valid and correct type
        if (decoded.tokenType === "access") {
          // Set the user in request for use in route handlers
          req.user = {
            id: decoded.id,
            role: decoded.role,
            email: decoded.email || ''
          };
        }
      } catch (jwtError) {
        // If token verification fails, proceed without authentication
        console.log('Optional auth: Token verification failed, continuing as unauthenticated');
      }
    }
    
    next();
  } catch (error) {
    // If any error occurs, proceed without authentication
    console.error('Optional authentication error:', error);
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
        console.log('Authorization failed: No user in request');
        res.status(401).json({
          success: false,
          message: 'Access denied. Not authenticated.'
        });
        return;
      }
      
      // Normalize user role from token for comparison
      const userRole = req.user.role;
      console.log(`Authorization check: User role=${userRole}, Required roles=[${roles.join(', ')}]`);
      
      // Check if role is in the allowed roles list with flexible comparison
      const isAuthorized = roles.some(role => {
        // Case-insensitive string comparison if needed
        if (typeof userRole === 'string' && typeof role === 'string') {
          return userRole.toUpperCase() === role.toString().toUpperCase();
        }
        return userRole === role;
      });
      
      if (!isAuthorized) {
        console.log(`Authorization failed: User role=${userRole} not in allowed roles=[${roles.join(', ')}]`);
        res.status(403).json({
          success: false,
          message: 'Access denied. Not authorized.',
          debug: { 
            userRole,
            requiredRoles: roles
          }
        });
        return;
      }
      
      console.log('Authorization successful');
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