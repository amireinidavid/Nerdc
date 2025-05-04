import { PrismaClient, UserRole } from "../generated/prisma";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { CookieOptions } from "express";

const prisma = new PrismaClient();

// Environment variables with fallbacks
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "davidinikayiza";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "davidinikayiza";
const ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || "15m";
const REFRESH_TOKEN_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES || "7d";
const NODE_ENV = process.env.NODE_ENV || "development";
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || "localhost";

// Cookie configuration
const cookieConfig: CookieOptions = {
  httpOnly: true,
  secure: NODE_ENV === "production",
  sameSite: NODE_ENV === "production" ? "none" : "lax",
  domain: undefined, // Remove domain restriction which can cause issues
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};

// Store for invalidated tokens (would use Redis in production)
const tokenBlacklist = new Set<string>();

// Helper function to generate tokens
export const generateTokens = (userId: number, role: UserRole) => {
  // Short-lived access token
  const accessToken = jwt.sign(
    { id: userId, role, tokenType: "access" },
    JWT_ACCESS_SECRET as jwt.Secret,
    { expiresIn: ACCESS_TOKEN_EXPIRES } as SignOptions
  );

  // Generate unique jti (JWT ID) for the refresh token
  const jti = uuidv4();
  
  // Longer-lived refresh token
  const refreshToken = jwt.sign(
    { id: userId, role, tokenType: "refresh", jti },
    JWT_REFRESH_SECRET as jwt.Secret,
    { expiresIn: REFRESH_TOKEN_EXPIRES } as SignOptions
  );

  return { accessToken, refreshToken, jti };
};

// Helper function to set auth cookies
export const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  console.log("Setting cookies with config:", {
    environment: NODE_ENV,
    secure: NODE_ENV === "production",
    sameSite: NODE_ENV === "production" ? "none" : "lax"
  });
  
  // Set cookies with proper configuration
  res.cookie("accessToken", accessToken, cookieConfig);
  res.cookie("refreshToken", refreshToken, {
    ...cookieConfig,
    // Refresh token has longer expiry
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  
  // Always include tokens in response headers for hybrid approach
  res.setHeader("Access-Token", accessToken);
  res.setHeader("Refresh-Token", refreshToken);
  
  // Include headers in Access-Control-Expose-Headers
  const exposedHeaders = res.getHeader('Access-Control-Expose-Headers') || '';
  // Convert to string to safely check includes (handles string, number, or string[] return types)
  const exposedHeadersStr = typeof exposedHeaders === 'string' 
    ? exposedHeaders 
    : Array.isArray(exposedHeaders) 
      ? exposedHeaders.join(', ') 
      : String(exposedHeaders);

  if (!exposedHeadersStr.includes('Access-Token')) {
    res.setHeader('Access-Control-Expose-Headers', 
      exposedHeadersStr ? `${exposedHeadersStr}, Access-Token, Refresh-Token` : 'Access-Token, Refresh-Token');
  }
};

// Helper function to clear auth cookies
export const clearAuthCookies = (res: Response) => {
  res.cookie("accessToken", "", { ...cookieConfig, maxAge: 0 });
  res.cookie("refreshToken", "", { ...cookieConfig, maxAge: 0 });
};

// Register new user
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { email, password, name, institution, bio } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        institution,
        bio,
        role: UserRole.USER, // Default role
        // Set profile as incomplete (using string until Prisma generate is run)
        profileStatus: "INCOMPLETE",
      },
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(newUser.id, newUser.role);

    // Set cookies
    setAuthCookies(res, accessToken, refreshToken);

    // Return new user without password
    const { password: _, ...userWithoutPassword } = newUser;

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: userWithoutPassword,
        requiresProfileCompletion: true, // Flag to indicate profile needs completion
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Error registering user",
      error: (error as Error).message,
    });
  }
};

// Login user
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
      return;
    }

    // Check if user exists
    let userRecord;
    try {
      userRecord = await prisma.user.findUnique({
        where: { email },
      });
    } catch (dbError) {
      console.error("Database connection error during login:", dbError);
      res.status(503).json({
        success: false,
        message: "Database service unavailable. Please try again later.",
        error: "service_unavailable"
      });
      return;
    }

    if (!userRecord) {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
      return;
    }

    // At this point, userRecord is definitely not null
    const user = userRecord; // Non-null assertion

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
      return;
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    // Set cookies
    setAuthCookies(res, accessToken, refreshToken);

    // User without password
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: userWithoutPassword,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    // Check if this is a Prisma database connection error
    const err = error as any;
    if (err.constructor?.name === 'PrismaClientInitializationError' || 
        err.message?.includes("Can't reach database server")) {
      res.status(503).json({
        success: false,
        message: "Database service unavailable. Please try again later.",
        error: "service_unavailable"
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: "Error logging in",
      error: (error as Error).message,
    });
  }
};

// Logout user
export const logoutUser = async (req: Request, res: Response) => {
  try {
    // Get the refresh token from cookie
    const refreshToken = req.cookies.refreshToken;
    
    // If token exists, add it to blacklist
    if (refreshToken) {
      try {
        // Verify token to get its ID (jti)
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET as jwt.Secret) as any;
        
        // Add to blacklist
        if (decoded.jti) {
          tokenBlacklist.add(decoded.jti);
          
          // In production, you would store this in Redis with expiry matching token
          // redisClient.setex(`blacklist:${decoded.jti}`, tokenExpiryInSeconds, 'true');
        }
      } catch (error) {
        // Token may be invalid, continue with logout anyway
        console.log("Error blacklisting token:", error);
      }
    }

    // Clear cookies
    clearAuthCookies(res);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Error logging out",
      error: (error as Error).message,
    });
  }
};

// Refresh tokens
export const refreshTokens = async (req: Request, res: Response) => {
  try {
    // Check for refresh token in cookies OR headers OR request body
    const refreshToken = req.cookies.refreshToken || 
                        req.headers['refresh-token'] as string || 
                        req.body.refreshToken;

    if (!refreshToken) {
      // Don't send an error response for missing token, just return a specific status
      // that the client can handle silently
      clearAuthCookies(res);
      return res.status(204).end(); // No content - client should handle silently
    }

    // Verify refresh token
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET as jwt.Secret);
    } catch (error) {
      console.error("Token verification failed:", error);
      clearAuthCookies(res);
      return res.status(204).end(); // No content - client should handle silently  
    }

    // Check token type
    if (decoded.tokenType !== "refresh") {
      clearAuthCookies(res);
      return res.status(204).end(); // No content - client should handle silently
    }

    // Check if token is blacklisted
    if (decoded.jti && tokenBlacklist.has(decoded.jti)) {
      clearAuthCookies(res);
      return res.status(204).end(); // No content - client should handle silently
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      clearAuthCookies(res);
      return res.status(204).end(); // No content - client should handle silently
    }

    // Add current token to blacklist ONLY after verifying everything is valid
    if (decoded.jti) {
      tokenBlacklist.add(decoded.jti);
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      user.id, 
      user.role
    );

    // Set new cookies
    setAuthCookies(res, accessToken, newRefreshToken);

    // Return success with minimal user info
    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        userId: user.id,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    clearAuthCookies(res);
    return res.status(204).end(); // No content - client should handle silently
  }
};

// Get current user profile
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    // @ts-ignore - We'll add the user property in auth middleware
    const userId = req.user?.id;

    if (!userId) {
       return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          subscriptions: {
            include: {
              plan: true,
            },
            where: {
              status: "ACTIVE",
            },
          },
        },
      });
    } catch (dbError) {
      console.error("Database connection error in getCurrentUser:", dbError);
      return res.status(503).json({
        success: false,
        message: "Database service unavailable. Please try again later.",
        error: "service_unavailable"
      });
    }

    if (!user) {
      clearAuthCookies(res);
       return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error("Get user error:", error);
    
    // Check if this is a Prisma database connection error
    const err = error as any;
    if (err.constructor?.name === 'PrismaClientInitializationError' || 
        err.message?.includes("Can't reach database server")) {
      return res.status(503).json({
        success: false,
        message: "Database service unavailable. Please try again later.",
        error: "service_unavailable"
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Error fetching user",
      error: (error as Error).message,
    });
  }
};

// Update user profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    // @ts-ignore - We'll add the user property in auth middleware
    const userId = req.user?.id;

    if (!userId) {
       return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { name, bio, institution, profileImage } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        bio,
        institution,
        profileImage,
      },
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = updatedUser;

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: (error as Error).message,
    });
  }
};

// Change password
export const changePassword = async (req: Request, res: Response) => {
  try {
    // @ts-ignore - We'll add the user property in auth middleware
    const userId = req.user?.id;

    if (!userId) {
       return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
       return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
       return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    // Invalidate all sessions by clearing cookies
    clearAuthCookies(res);

    res.status(200).json({
      success: true,
      message: "Password changed successfully. Please login again with your new password.",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Error changing password",
      error: (error as Error).message,
    });
  }
};

// Request password reset
export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if the user exists or not for security reasons
      return res.status(200).json({
        success: true,
        message: "If a user with that email exists, a password reset link has been sent",
      });
    }

    // Generate random reset token
    const resetTokenId = uuidv4();
    
    // Generate reset token
    const resetToken = jwt.sign(
      { id: user.id, action: "reset-password", jti: resetTokenId },
      JWT_ACCESS_SECRET as jwt.Secret,
      { expiresIn: "1h" } as SignOptions
    );

    // In a real application, you would:
    // 1. Store the token hash in the database with user ID and expiry
    // 2. Send an email with a reset link containing this token
    
    res.status(200).json({
      success: true,
      message: "If a user with that email exists, a password reset link has been sent",
      // Only include token in development for testing
      ...(NODE_ENV === "development" && { resetToken }),
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    res.status(500).json({
      success: false,
      message: "Error requesting password reset",
      error: (error as Error).message,
    });
  }
};

// Reset password with token
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required",
      });
    }

    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_ACCESS_SECRET as jwt.Secret);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    if (!decoded || decoded.action !== "reset-password") {
      return res.status(401).json({
        success: false,
        message: "Invalid token purpose",
      });
    }

    // In production, you would verify this token against a stored record
    // and check if it's been used already

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await prisma.user.update({
      where: { id: decoded.id },
      data: {
        password: hashedPassword,
      },
    });

    // After password reset, invalidate all existing sessions
    if (decoded.jti) {
      tokenBlacklist.add(decoded.jti);
    }

    res.status(200).json({
      success: true,
      message: "Password has been reset successfully. Please login with your new password.",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({
      success: false,
      message: "Error resetting password",
      error: (error as Error).message,
    });
  }
};

// Admin: Create author account
export const createAuthorAccount = async (req: Request, res: Response) => {
  try {
    // @ts-ignore - We'll add the user property in auth middleware
    const adminId = req.user?.id;
    // @ts-ignore
    const role = req.user?.role;

    if (!adminId || role !== UserRole.ADMIN) {
       return res.status(403).json({
        success: false,
        message: "Forbidden: Only admins can create author accounts",
      });
    }

    const { email, password, name, institution, bio } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
         return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create author
    const newAuthor = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        institution,
        bio,
        role: UserRole.AUTHOR,
      },
    });

    // Return new author without password
    const { password: _, ...authorWithoutPassword } = newAuthor;

    res.status(201).json({
      success: true,
      message: "Author account created successfully",
      data: authorWithoutPassword,
    });
  } catch (error) {
    console.error("Create author error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating author account",
      error: (error as Error).message,
    });
  }
};