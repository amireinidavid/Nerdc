import { Request, Response, NextFunction } from "express";
import { UserRole } from "../generated/prisma";

/**
 * Middleware to authorize users based on their roles
 * @param roles Array of allowed roles
 */
export const authorizeRoles = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // @ts-ignore - User is added by the authentication middleware
      const userRole = req.user?.role;

      if (!userRole) {
        res.status(401).json({
          success: false,
          message: "Unauthorized - User role not found",
        });
        return;
      }

      if (!roles.includes(userRole)) {
        res.status(403).json({
          success: false,
          message: "Forbidden - You don't have permission to access this resource",
        });
        return;
      }

      next();
    } catch (error) {
      console.error("Authorization error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error during authorization",
        error: (error as Error).message,
      });
    }
  };
}; 