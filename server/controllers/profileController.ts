import { PrismaClient, UserRole } from "../generated/prisma";
import { Request, Response } from "express";

const prisma = new PrismaClient();

// Interface for the response with optional tokens
interface UserResponse {
  id: number;
  email: string;
  name: string | null;
  role: UserRole;
  profileStatus: string;
  [key: string]: any; // Allow additional properties like tokens
}

/**
 * Get current user's profile
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
      error: (error as Error).message,
    });
  }
};

/**
 * Complete user profile after registration
 */
export const completeProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    // Get basic profile fields that all users should provide
    const { 
      name, 
      phone,
      address,
      city,
      state,
      country,
      postalCode,
      bio,
      // If user wants to be a researcher, they'll provide these fields
      isResearcher,
      institution,
      department,
      position,
      researchInterests,
      academicDegrees,
      orcidId,
      website,
      linkedinUrl,
      twitterHandle,
    } = req.body;

    // Basic validation - name is required for all users
    if (!name) {
      res.status(400).json({
        success: false,
        message: "Name is required",
      });
      return;
    }

    // If user is a researcher, validate researcher-specific fields
    if (isResearcher) {
      if (!institution || !department || !position) {
        res.status(400).json({
          success: false,
          message: "Institution, department, and position are required for researchers",
        });
        return;
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        phone,
        address,
        city,
        state,
        country,
        postalCode,
        bio,
        // Only update researcher fields if the user is a researcher
        ...(isResearcher && {
          role: UserRole.AUTHOR, // Upgrade to AUTHOR role for researchers
          institution,
          department,
          position,
          researchInterests,
          academicDegrees,
          orcidId,
          website,
          linkedinUrl,
          twitterHandle,
        }),
        // Mark profile as complete
        profileStatus: "COMPLETE",
      },
    });

    // Return updated user without password
    const { password: _, ...userWithoutPassword } = updatedUser;

    // Generate new tokens if the user's role was changed to AUTHOR
    if (isResearcher) {
      // Import the function to generate tokens and set cookies
      const { generateTokens, setAuthCookies } = require('../controllers/authController');
      
      // Generate new tokens with the updated role
      const { accessToken, refreshToken } = generateTokens(updatedUser.id, updatedUser.role);
      
      // Set the new cookies
      setAuthCookies(res, accessToken, refreshToken);
      
      // Also include the tokens in the response body for frontend to update
      const responseWithTokens = {
        ...userWithoutPassword,
        tokens: {
          accessToken,
          refreshToken
        }
      };
      
      res.status(200).json({
        success: true,
        message: "Profile completed successfully",
        data: responseWithTokens,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Profile completed successfully",
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error("Complete profile error:", error);
    res.status(500).json({
      success: false,
      message: "Error completing profile",
      error: (error as Error).message,
    });
  }
};

/**
 * Update existing user profile
 */
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    // Get current user to check role
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Extract fields from request body
    const {
      name,
      bio,
      phone,
      address,
      city,
      state,
      country,
      postalCode,
      profileImage,
      website,
      linkedinUrl,
      twitterHandle,
    } = req.body;

    // Extract researcher-specific fields if user is an AUTHOR
    const researcherFields = currentUser.role === UserRole.AUTHOR ? {
      institution: req.body.institution,
      department: req.body.department,
      position: req.body.position,
      researchInterests: req.body.researchInterests,
      academicDegrees: req.body.academicDegrees,
      orcidId: req.body.orcidId,
      googleScholarId: req.body.googleScholarId,
      researchGateUrl: req.body.researchGateUrl,
      publicationsCount: req.body.publicationsCount ? parseInt(req.body.publicationsCount) : undefined,
      citationsCount: req.body.citationsCount ? parseInt(req.body.citationsCount) : undefined,
      hIndex: req.body.hIndex ? parseInt(req.body.hIndex) : undefined,
    } : {};

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        bio,
        phone,
        address,
        city,
        state,
        country,
        postalCode,
        profileImage,
        website,
        linkedinUrl,
        twitterHandle,
        ...researcherFields,
      },
    });

    // Return updated user without password
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

/**
 * Toggle user between regular USER and AUTHOR (researcher) roles
 */
export const toggleResearcherStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    // Get current user to check role
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Toggle role between USER and AUTHOR
    const newRole = currentUser.role === UserRole.USER ? UserRole.AUTHOR : UserRole.USER;

    // Require additional fields when becoming a researcher
    if (newRole === UserRole.AUTHOR) {
      const { 
        institution, 
        department, 
        position,
        researchInterests,
      } = req.body;

      if (!institution || !department || !position) {
        res.status(400).json({
          success: false,
          message: "Institution, department, and position are required to become a researcher",
        });
        return;
      }

      // Update user with researcher fields
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          role: UserRole.AUTHOR,
          institution,
          department,
          position,
          researchInterests,
        },
      });

      // Return updated user without password
      const { password: _, ...userWithoutPassword } = updatedUser;

      // Generate new tokens with the updated role (AUTHOR)
      const { generateTokens, setAuthCookies } = require('../controllers/authController');
      const { accessToken, refreshToken } = generateTokens(updatedUser.id, updatedUser.role);
      
      // Set the new cookies
      setAuthCookies(res, accessToken, refreshToken);
      
      // Also include the tokens in the response body for frontend to update
      const responseWithTokens = {
        ...userWithoutPassword,
        tokens: {
          accessToken,
          refreshToken
        }
      };
      
      res.status(200).json({
        success: true,
        message: "Profile updated to researcher status",
        data: responseWithTokens,
      });
    } else {
      // Downgrade to regular user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          role: UserRole.USER,
        },
      });

      // Return updated user without password
      const { password: _, ...userWithoutPassword } = updatedUser;

      // Generate new tokens with the updated role (USER)
      const { generateTokens, setAuthCookies } = require('../controllers/authController');
      const { accessToken, refreshToken } = generateTokens(updatedUser.id, updatedUser.role);
      
      // Set the new cookies
      setAuthCookies(res, accessToken, refreshToken);
      
      // Also include the tokens in the response body for frontend to update
      const responseWithTokens = {
        ...userWithoutPassword,
        tokens: {
          accessToken,
          refreshToken
        }
      };

      res.status(200).json({
        success: true,
        message: "Profile updated to regular user status",
        data: responseWithTokens,
      });
    }
  } catch (error) {
    console.error("Toggle researcher status error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating researcher status",
      error: (error as Error).message,
    });
  }
};

/**
 * Admin endpoint to get all users
 */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (!userId || role !== UserRole.ADMIN) {
      res.status(403).json({
        success: false,
        message: "Forbidden: Only admins can access this endpoint",
      });
      return;
    }

    // Pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Optional filters
    const role_filter = req.query.role as string;
    const profile_status = req.query.profileStatus as string;
    const search = req.query.search as string;

    // Build where clause based on filters
    const whereClause: any = {};
    if (role_filter) {
      whereClause.role = role_filter;
    }
    if (profile_status) {
      whereClause.profileStatus = profile_status;
    }
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { institution: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get users with pagination
    const users = await prisma.user.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        profileStatus: true,
        institution: true,
        createdAt: true,
        updatedAt: true,
        // Don't include password
      },
    });

    // Get total count for pagination
    const totalUsers = await prisma.user.count({
      where: whereClause,
    });

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total: totalUsers,
          page,
          limit,
          pages: Math.ceil(totalUsers / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: (error as Error).message,
    });
  }
};

/**
 * Admin endpoint to get a specific user by ID
 */
export const getUserById = async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.id;
    const role = req.user?.role;

    if (!adminId || role !== UserRole.ADMIN) {
      res.status(403).json({
        success: false,
        message: "Forbidden: Only admins can access this endpoint",
      });
      return;
    }

    const userId = parseInt(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user",
      error: (error as Error).message,
    });
  }
};

/**
 * Admin endpoint to update a user's profile
 */
export const adminUpdateUser = async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.id;
    const role = req.user?.role;

    if (!adminId || role !== UserRole.ADMIN) {
      res.status(403).json({
        success: false,
        message: "Forbidden: Only admins can access this endpoint",
      });
      return;
    }

    const userId = parseInt(req.params.id);
    const {
      name,
      email,
      role: newRole,
      profileStatus,
      // Include other fields as needed
    } = req.body;

    // Validate role change
    if (newRole && !Object.values(UserRole).includes(newRole)) {
      res.status(400).json({
        success: false,
        message: "Invalid role specified",
      });
      return;
    }

    // Validate profile status change
    const validStatuses = ["INCOMPLETE", "COMPLETE"];
    if (profileStatus && !validStatuses.includes(profileStatus)) {
      res.status(400).json({
        success: false,
        message: "Invalid profile status specified",
      });
      return;
    }

    // Check if email is unique if it's being changed
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          id: { not: userId },
        },
      });

      if (existingUser) {
        res.status(400).json({
          success: false,
          message: "Email is already in use by another user",
        });
        return;
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        role: newRole as UserRole,
        profileStatus,
        // Include other fields as needed
      },
    });

    // Return updated user without password
    const { password: _, ...userWithoutPassword } = updatedUser;

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error("Admin update user error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user",
      error: (error as Error).message,
    });
  }
};

/**
 * Admin endpoint to create a new user
 */
export const createUser = async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.id;
    const adminRole = req.user?.role;

    if (!adminId || adminRole !== UserRole.ADMIN) {
      res.status(403).json({
        success: false,
        message: "Forbidden: Only admins can access this endpoint",
      });
      return;
    }

    const {
      name,
      email,
      password,
      role,
      profileStatus,
      institution,
      department,
      position,
      phone,
      country,
      state,
      city,
      // Additional fields optional
    } = req.body;

    // Basic validation
    if (!name || !email || !password || !role) {
      res.status(400).json({
        success: false,
        message: "Name, email, password, and role are required",
      });
      return;
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "Email already in use",
      });
      return;
    }

    // Validate role
    if (!Object.values(UserRole).includes(role)) {
      res.status(400).json({
        success: false,
        message: "Invalid role specified",
      });
      return;
    }

    // Validate profile status
    const validStatuses = ["INCOMPLETE", "COMPLETE"];
    if (profileStatus && !validStatuses.includes(profileStatus)) {
      res.status(400).json({
        success: false,
        message: "Invalid profile status specified",
      });
      return;
    }

    // Additional validation for author role
    if (role === UserRole.AUTHOR && (!institution || !department || !position)) {
      res.status(400).json({
        success: false,
        message: "Institution, department, and position are required for authors",
      });
      return;
    }

    // Import bcrypt for password hashing
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        profileStatus: profileStatus || "INCOMPLETE",
        institution,
        department,
        position,
        phone,
        country,
        state,
        city,
      },
    });

    // Return created user without password
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating user",
      error: (error as Error).message,
    });
  }
};
