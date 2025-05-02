import { UserRole } from "../generated/prisma";

// Extend Express Request interface to include user property
declare namespace Express {
  export interface Request {
    user?: {
      id: number;
      email: string;
      role: UserRole;
    };
  }
} 