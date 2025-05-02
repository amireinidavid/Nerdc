import { Request, Response } from "express";
import { PrismaClient, UserRole, ReviewStatus, Prisma } from "../generated/prisma";
import { validateJournalData } from "../validators/journalValidator";
import { uploadDocument, uploadThumbnail, getSecureUrl } from "../utils/CloudinaryConfig";
import { isAuthorized } from "../middleware/authMiddleware";

const prisma = new PrismaClient();

// Create a new journal (initially as draft)
export const createJournal = async (req: Request, res: Response): Promise<void> => {
  try {
    // Log the request body and files for debugging
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized - Please login to submit a journal",
      });
      return;
    }

    // Get user and check if they're an author
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== UserRole.AUTHOR) {
      res.status(403).json({
        success: false,
        message: "Only authors can create journals",
      });
      return;
    }

    // Validate journal data
    const { error, data } = validateJournalData(req.body);
    if (error) {
      console.log('Validation errors:', error);
      res.status(400).json({
        success: false,
        message: "Invalid journal data",
        errors: error,
      });
      return;
    }

    // Check if DOI already exists if provided
    if (data.doi && data.doi.trim() !== "") {
      const existingJournal = await prisma.journal.findUnique({
        where: { doi: data.doi.trim() }
      });
      
      if (existingJournal) {
        res.status(400).json({
          success: false,
          message: "A journal with this DOI already exists",
        });
        return;
      }
    }
    
    // Parse categoryId properly
    let categoryId = typeof data.categoryId === 'string' 
      ? parseInt(data.categoryId) 
      : data.categoryId;
    
    // Check if category exists
    let categoryExists = await prisma.category.findUnique({
      where: { id: categoryId }
    });
    
    // In development mode, create the category if it doesn't exist
    if (!categoryExists && process.env.NODE_ENV === 'development') {
      console.log(`Category ${categoryId} doesn't exist. Creating it in development mode.`);
      categoryExists = await prisma.category.create({
        data: {
          id: categoryId,
          name: `Auto-created category ${categoryId}`,
          description: 'Automatically created for development',
        }
      });
    } else if (!categoryExists) {
      res.status(400).json({
        success: false,
        message: "Selected category does not exist",
      });
      return;
    }

    // Handle file upload for PDF and thumbnail if provided
    let pdfUrl = data.pdfUrl || "";
    let thumbnailUrl = data.thumbnailUrl || null;

    // Handle file uploads if files are included in the request
    if (req.files) {
      try {
        if (req.file) {
          // If using multer middleware (single file upload)
          pdfUrl = await uploadDocument(req.file);
        } else if (Array.isArray(req.files)) {
          // If using multer middleware (multiple files upload)
          const pdfFile = req.files.find(file => file.fieldname === 'pdf');
          const thumbnailFile = req.files.find(file => file.fieldname === 'thumbnail');
          
          if (pdfFile) {
            pdfUrl = await uploadDocument(pdfFile);
          }
          
          if (thumbnailFile) {
            thumbnailUrl = await uploadThumbnail(thumbnailFile);
          }
        } else {
          // If using express-fileupload
          const files = req.files as any;
          if (files.pdf) {
            pdfUrl = await uploadDocument(files.pdf);
          }
          if (files.thumbnail) {
            thumbnailUrl = await uploadThumbnail(files.thumbnail);
          }
        }
      } catch (uploadError) {
        console.error("Error uploading files:", uploadError);
        
        // If Cloudinary is not configured, use a local fallback URL for testing
        if (process.env.NODE_ENV === 'development') {
          console.log("Using fallback URL for development");
          pdfUrl = `/uploads/test-document.pdf`;
          if (req.files && !Array.isArray(req.files) && (req.files as any).thumbnail) {
            thumbnailUrl = `/uploads/test-thumbnail.jpg`;
          }
        } else {
          res.status(500).json({
            success: false,
            message: "Failed to upload files. Check your Cloudinary configuration.",
            error: uploadError instanceof Error ? uploadError.message : "Unknown upload error",
          });
          return;
        }
      }
    }

    // Parse tags properly
    let tagConnections;
    if (data.tags && Array.isArray(data.tags) && data.tags.length > 0) {
      console.log('Processing tags:', data.tags);
      
      // Convert all tag identifiers to numbers
      const tagIds = data.tags.map((tag: string | number) => {
        if (typeof tag === 'string') {
          return parseInt(tag, 10);
        }
        return tag;
      }).filter((id: number) => !isNaN(id));
      
      console.log('Parsed tag IDs:', tagIds);
      
      if (tagIds.length > 0) {
        // In development mode, check if tags exist and create missing ones
        if (process.env.NODE_ENV === 'development') {
          for (const tagId of tagIds) {
            const tagExists = await prisma.tag.findUnique({
              where: { id: tagId }
            });
            
            if (!tagExists) {
              console.log(`Tag ${tagId} doesn't exist. Creating it in development mode.`);
              await prisma.tag.create({
                data: {
                  id: tagId,
                  name: `Auto-created tag ${tagId}`,
                }
              });
            }
          }
        }
        
        tagConnections = {
          create: tagIds.map((tagId: number) => ({
            tag: { connect: { id: tagId } },
          })),
        };
      }
    }

    // Prepare journal creation data
    const journalData: any = {
      title: data.title,
      abstract: data.abstract,
      content: data.content || "",
      pdfUrl: pdfUrl,
      thumbnailUrl: thumbnailUrl,
      publicationDate: new Date(),
      isPublished: false,
      reviewStatus: ReviewStatus.UNDER_REVIEW,
      pageCount: data.pageCount || null,
      author: {
        connect: { id: userId },
      },
      category: {
        connect: { id: categoryId },
      },
      // Connect tags if provided
      tags: tagConnections,
    };
    
    // Only add doi if it's a non-empty string
    if (data.doi && data.doi.trim() !== "") {
      journalData.doi = data.doi.trim();
    }

    // Create the journal
    const journal = await prisma.journal.create({
      data: journalData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            institution: true,
          },
        },
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    console.log('Journal created successfully:', journal.id);
    
    res.status(201).json({
      success: true,
      message: "Journal created successfully. It will be reviewed by the admin before it is published.",
      data: journal,
    });
    return;
  } catch (error) {
    console.error("Error creating journal:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create journal",
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return;
  }
};

// Get all journals with filtering and visibility control
export const getJournals = async (req: Request, res: Response):Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    // Parse query parameters
    const { 
      page = 1, 
      limit = 10,
      category,
      status,
      search,
      authorId,
      tags,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const pageSize = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * pageSize;

    // Build filters
    let whereClause: Prisma.JournalWhereInput = {};

    // If not admin or author, only show published journals
    if (!userRole || (userRole !== UserRole.ADMIN && userRole !== UserRole.AUTHOR)) {
      whereClause = {
        ...whereClause,
        isPublished: true,
        reviewStatus: ReviewStatus.PUBLISHED,
      };
    } else if (userRole === UserRole.AUTHOR && authorId !== userId) {
      // Authors can see their own drafts and all published
      whereClause = {
        ...whereClause,
        OR: [
          { authorId: userId },
          { 
            isPublished: true,
            reviewStatus: ReviewStatus.PUBLISHED
          }
        ]
      };
    }

    // Apply additional filters
    if (category) {
      whereClause.categoryId = parseInt(category as string, 10);
    }

    if (status && (userRole === UserRole.ADMIN || 
                  (userRole === UserRole.AUTHOR && authorId === userId))) {
      whereClause.reviewStatus = status as ReviewStatus;
    }

    if (authorId) {
      whereClause.authorId = parseInt(authorId as string, 10);
    }

    if (search) {
      const searchTerm = search as string;
      whereClause.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { abstract: { contains: searchTerm, mode: 'insensitive' } },
        { content: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    if (tags) {
      const tagArray = Array.isArray(tags) 
        ? tags.map(tag => parseInt(tag as string, 10))
        : [parseInt(tags as string, 10)];
      
      whereClause.tags = {
        some: {
          tagId: {
            in: tagArray
          }
        }
      };
    }

    // Determine sort direction
    const orderBy = {
      [sortBy as string]: sortOrder === "asc" ? "asc" : "desc"
    };

    // Get total count for pagination
    const totalCount = await prisma.journal.count({ where: whereClause });

    // Get journals
    const journals = await prisma.journal.findMany({
      where: whereClause,
      skip,
      take: pageSize,
      orderBy,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            institution: true,
          },
        },
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

     res.status(200).json({
      success: true,
      data: journals,
      pagination: {
        total: totalCount,
        page: pageNumber,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
        hasMore: pageNumber < Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error("Error getting journals:", error);
     res.status(500).json({
      success: false,
      message: "Failed to get journals",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get a journal by ID with visibility control
export const getJournalById = async (req: Request, res: Response):Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const journalId = parseInt(id, 10);
    if (isNaN(journalId)) {
       res.status(400).json({
        success: false,
        message: "Invalid journal ID",
      });
      return;
    }

    const journal = await prisma.journal.findUnique({
      where: { id: journalId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            institution: true,
            bio: true,
            profileImage: true,
          },
        },
        reviewer: userRole === UserRole.ADMIN ? {
          select: {
            id: true,
            name: true,
          }
        } : undefined,
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
        comments: {
          where: {
            parentId: null,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profileImage: true,
              },
            },
            replies: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    profileImage: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!journal) {
       res.status(404).json({
        success: false,
        message: "Journal not found",
      });
      return;
    }

    // Check visibility
    const isAuthor = userId && journal.authorId === userId;
    const isAdmin = userRole === UserRole.ADMIN;
    const isPublished = journal.isPublished && journal.reviewStatus === ReviewStatus.PUBLISHED;

    // Allow access if user is admin, author, or the journal is published
    if (!isPublished && !isAuthor && !isAdmin) {
      res.status(403).json({
        success: false,
        message: "You don't have permission to view this journal",
      });
      return;
    }

    // Increment view count if not the author viewing
    if (!isAuthor) {
      await prisma.journal.update({
        where: { id: journalId },
        data: { viewCount: { increment: 1 } },
      });
    }

     res.status(200).json({
      success: true,
      data: journal,
    });
  } catch (error) {
    console.error("Error getting journal by ID:", error);
     res.status(500).json({
      success: false,
      message: "Failed to get journal",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Update a journal (authors can only update their drafts)
export const updateJournal = async (req: Request, res: Response):Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const journalId = parseInt(id, 10);
    if (isNaN(journalId)) {
       res.status(400).json({
        success: false,
        message: "Invalid journal ID",
      });
    }

    // Find the journal
    const journal = await prisma.journal.findUnique({
      where: { id: journalId },
    });

    if (!journal) {
       res.status(404).json({
        success: false,
        message: "Journal not found",
      });
    }

    // Check permissions
    const isAuthor = userId && journal?.authorId === userId;
    const isAdmin = userRole === UserRole.ADMIN;

    if (!isAuthor && !isAdmin) {
       res.status(403).json({
        success: false,
        message: "You don't have permission to update this journal",
      });
    }

    // Authors can only update drafts
    if (isAuthor && !isAdmin && journal?.reviewStatus !== ReviewStatus.DRAFT) {
       res.status(403).json({
        success: false,
        message: "You can only update journals that are in draft status",
      });
    }

    // Validate journal data
    const { error, data } = validateJournalData(req.body);
    if (error) {
       res.status(400).json({
        success: false,
        message: "Invalid journal data",
        errors: error,
      });
    }

    // Handle file upload for PDF and thumbnail if provided
    let pdfUrl = data.pdfUrl || journal?.pdfUrl;
    let thumbnailUrl = data.thumbnailUrl || journal?.thumbnailUrl;

    if (req.files) {
      const files = req.files as any;
      if (files.pdf) {
        pdfUrl = await uploadDocument(files.pdf);
      }
      if (files.thumbnail) {
        thumbnailUrl = await uploadThumbnail(files.thumbnail);
      }
    }

    // Update the journal
    const updatedJournal = await prisma.journal.update({
      where: { id: journalId },
      data: {
        title: data.title,
        abstract: data.abstract,
        content: data.content,
        pdfUrl: pdfUrl,
        thumbnailUrl: thumbnailUrl,
        doi: data.doi,
        pageCount: data.pageCount || journal?.pageCount,
        categoryId: data.categoryId,
        // Admins can update review status directly
        ...(isAdmin && data.reviewStatus ? { reviewStatus: data.reviewStatus } : {}),
        ...(isAdmin && data.isPublished !== undefined ? { isPublished: data.isPublished } : {}),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            institution: true,
          },
        },
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // Update tags if provided
    if (data.tags) {
      // Delete existing tag connections
      await prisma.tagsOnJournals.deleteMany({
        where: { journalId },
      });

      // Add new tag connections
      if (data.tags.length > 0) {
        await Promise.all(
          data.tags.map((tagId: number) =>
            prisma.tagsOnJournals.create({
              data: {
                journalId,
                tagId,
              },
            })
          )
        );
      }
    }

     res.status(200).json({
      success: true,
      message: "Journal updated successfully",
      data: updatedJournal,
    });
  } catch (error) {
    console.error("Error updating journal:", error);
     res.status(500).json({
      success: false,
      message: "Failed to update journal",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Delete a journal
export const deleteJournal = async (req: Request, res: Response):Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const journalId = parseInt(id, 10);
    if (isNaN(journalId)) {
       res.status(400).json({
        success: false,
        message: "Invalid journal ID",
      });
    }

    // Find the journal
    const journal = await prisma.journal.findUnique({
      where: { id: journalId },
    });

    if (!journal) {
       res.status(404).json({
        success: false,
        message: "Journal not found",
      });
    }

    // Check permissions
    const isAuthor = userId && journal?.authorId === userId;
    const isAdmin = userRole === UserRole.ADMIN;

    if (!isAuthor && !isAdmin) {
       res.status(403).json({
        success: false,
        message: "You don't have permission to delete this journal",
      });
    }

    // Authors can only delete drafts
    if (isAuthor && !isAdmin && journal?.reviewStatus !== ReviewStatus.DRAFT) {
       res.status(403).json({
        success: false,
        message: "You can only delete journals that are in draft status",
      });
    }

    // Delete related records first
    await prisma.tagsOnJournals.deleteMany({
      where: { journalId },
    });

    await prisma.comment.deleteMany({
      where: { journalId },
    });

    await prisma.download.deleteMany({
      where: { journalId },
    });

    await prisma.savedJournal.deleteMany({
      where: { journalId },
    });

    // Delete the journal
    await prisma.journal.delete({
      where: { id: journalId },
    });

     res.status(200).json({
      success: true,
      message: "Journal deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting journal:", error);
     res.status(500).json({
      success: false,
      message: "Failed to delete journal",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Submit a journal for review
export const submitForReview = async (req: Request, res: Response):Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const journalId = parseInt(id, 10);
    if (isNaN(journalId)) {
       res.status(400).json({
        success: false,
        message: "Invalid journal ID",
      });
    }

    // Find the journal
    const journal = await prisma.journal.findUnique({
      where: { id: journalId },
    });

    if (!journal) {
       res.status(404).json({
        success: false,
        message: "Journal not found",
      });
    }

    // Check if the user is the author
    if (journal?.authorId !== userId) {
       res.status(403).json({
        success: false,
        message: "You can only submit your own journals for review",
      });
    }

    // Check if the journal is in draft status
    if (journal?.reviewStatus !== ReviewStatus.DRAFT) {
       res.status(400).json({
        success: false,
        message: "Only journals in draft status can be submitted for review",
      });
    }

    // Update the journal status
    const updatedJournal = await prisma.journal.update({
      where: { id: journalId },
      data: {
        reviewStatus: ReviewStatus.UNDER_REVIEW,
      },
    });

    // TODO: Notify administrators about the new submission

     res.status(200).json({
      success: true,
      message: "Journal submitted for review successfully",
      data: updatedJournal,
    });
  } catch (error) {
    console.error("Error submitting journal for review:", error);
     res.status(500).json({
      success: false,
      message: "Failed to submit journal for review",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Review a journal (admin only)
export const reviewJournal = async (req: Request, res: Response):Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const journalId = parseInt(id, 10);
    if (isNaN(journalId)) {
       res.status(400).json({
        success: false,
        message: "Invalid journal ID",
      });
    }

    // Check if user is admin
    if (userRole !== UserRole.ADMIN) {
       res.status(403).json({
        success: false,
        message: "Only administrators can review journals",
      });
    }

    // Validate review data
    const { reviewStatus, reviewNotes, isPublished, price } = req.body;

    if (!reviewStatus || !Object.values(ReviewStatus).includes(reviewStatus)) {
       res.status(400).json({
        success: false,
        message: "Invalid review status",
      });
    }

    // Validate price if provided
    let priceValue = null;
    if (price !== undefined) {
      if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
        res.status(400).json({
          success: false,
          message: "Price must be a valid non-negative number",
        });
        return;
      }
      priceValue = parseFloat(price);
    }

    // Find the journal
    const journal = await prisma.journal.findUnique({
      where: { id: journalId },
    });

    if (!journal) {
       res.status(404).json({
        success: false,
        message: "Journal not found",
      });
    }

    // Update the journal with review information
    const updatedJournal = await prisma.journal.update({
      where: { id: journalId },
      data: {
        reviewStatus,
        reviewNotes: reviewNotes || null,
        reviewerId: userId,
        reviewDate: new Date(),
        isPublished: reviewStatus === ReviewStatus.PUBLISHED ? true : (isPublished ?? false),
        publicationDate: reviewStatus === ReviewStatus.PUBLISHED ? new Date() : journal?.publicationDate,
        price: priceValue, // Add price to the update
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // TODO: Notify the author about the review result

     res.status(200).json({
      success: true,
      message: "Journal reviewed successfully",
      data: updatedJournal,
    });
  } catch (error) {
    console.error("Error reviewing journal:", error);
     res.status(500).json({
      success: false,
      message: "Failed to review journal",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get journals pending review (admin only)
export const getPendingReviews = async (req: Request, res: Response):Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Check if user is admin
    if (userRole !== UserRole.ADMIN) {
       res.status(403).json({
        success: false,
        message: "Only administrators can access pending reviews",
      });
    }

    // Parse query parameters
    const { page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page as string, 10);
    const pageSize = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * pageSize;

    // Get journals under review
    const totalCount = await prisma.journal.count({
      where: { reviewStatus: ReviewStatus.UNDER_REVIEW },
    });

    const pendingJournals = await prisma.journal.findMany({
      where: { reviewStatus: ReviewStatus.UNDER_REVIEW },
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            institution: true,
          },
        },
        category: true,
      },
    });

     res.status(200).json({
      success: true,
      data: pendingJournals,
      pagination: {
        total: totalCount,
        page: pageNumber,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
        hasMore: pageNumber < Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error("Error getting pending reviews:", error);
     res.status(500).json({
      success: false,
      message: "Failed to get pending reviews",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get user's journals
export const getUserJournals = async (req: Request, res: Response):Promise<void> => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized - Please login to view your journals",
      });
      return;
    }

    // Parse query parameters
    const { page = 1, limit = 10, status } = req.query;
    const pageNumber = parseInt(page as string, 10);
    const pageSize = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * pageSize;

    // Build filter
    let whereClause: Prisma.JournalWhereInput = { authorId: userId };
    
    if (status) {
      whereClause.reviewStatus = status as ReviewStatus;
    }

    // Get total count for pagination
    const totalCount = await prisma.journal.count({ where: whereClause });

    // Get user's journals WITH AUTHOR INCLUDED
    const journals = await prisma.journal.findMany({
      where: whereClause,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            institution: true,
            profileImage: true
          }
        },
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: journals,
      pagination: {
        total: totalCount,
        page: pageNumber,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
        hasMore: pageNumber < Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error("Error getting user journals:", error);
     res.status(500).json({
      success: false,
      message: "Failed to get your journals",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Save a journal for later reading
export const saveJournal = async (req: Request, res: Response):Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
       res.status(401).json({
        success: false,
        message: "Unauthorized - Please login to save journals",
      });
    }

    const journalId = parseInt(id, 10);
    if (isNaN(journalId)) {
       res.status(400).json({
        success: false,
        message: "Invalid journal ID",
      });
    }

    // Check if journal exists and is published
    const journal = await prisma.journal.findUnique({
      where: { 
        id: journalId,
        isPublished: true,
        reviewStatus: ReviewStatus.PUBLISHED,
      },
    });

    if (!journal) {
       res.status(404).json({
        success: false,
        message: "Journal not found or not available for saving",
      });
    }

    // Check if already saved
    const existingSave = await prisma.savedJournal.findFirst({
      where: {
        userId,
        journalId,
      },
    });

    if (existingSave) {
       res.status(400).json({
        success: false,
        message: "Journal already saved",
      });
    }

    // Save the journal
    await prisma.savedJournal.create({
      data: {
        userId: userId as number,
        journalId,
      },
    });

     res.status(200).json({
      success: true,
      message: "Journal saved successfully",
    });
  } catch (error) {
    console.error("Error saving journal:", error);
     res.status(500).json({
      success: false,
      message: "Failed to save journal",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Unsave a journal
export const unsaveJournal = async (req: Request, res: Response):Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
       res.status(401).json({
        success: false,
        message: "Unauthorized - Please login to manage saved journals",
      });
    }

    const journalId = parseInt(id, 10);
    if (isNaN(journalId)) {
       res.status(400).json({
        success: false,
        message: "Invalid journal ID",
      });
    }

    // Delete the saved journal entry
    await prisma.savedJournal.deleteMany({
      where: {
        userId,
        journalId,
      },
    });

     res.status(200).json({
      success: true,
      message: "Journal removed from saved items",
    });
  } catch (error) {
    console.error("Error unsaving journal:", error);
     res.status(500).json({
      success: false,
      message: "Failed to remove journal from saved items",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get user's saved journals
export const getSavedJournals = async (req: Request, res: Response):Promise<void> => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
       res.status(401).json({
        success: false,
        message: "Unauthorized - Please login to view saved journals",
      });
    }

    // Parse query parameters
    const { page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page as string, 10);
    const pageSize = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * pageSize;

    // Get total count for pagination
    const totalCount = await prisma.savedJournal.count({
      where: { userId },
    });

    // Get saved journals
    const savedJournals = await prisma.savedJournal.findMany({
      where: { userId },
      skip,
      take: pageSize,
      orderBy: { savedAt: "desc" },
      include: {
        journal: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                institution: true,
              },
            },
            category: true,
            tags: {
              include: {
                tag: true,
              },
            },
          },
        },
      },
    });

     res.status(200).json({
      success: true,
      data: savedJournals,
      pagination: {
        total: totalCount,
        page: pageNumber,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
        hasMore: pageNumber < Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error("Error getting saved journals:", error);
     res.status(500).json({
      success: false,
      message: "Failed to get saved journals",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Record a journal download
export const downloadJournal = async (req: Request, res: Response):Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
       res.status(401).json({
        success: false,
        message: "Unauthorized - Please login to download journals",
      });
    }

    const journalId = parseInt(id, 10);
    if (isNaN(journalId)) {
       res.status(400).json({
        success: false,
        message: "Invalid journal ID",
      });
    }

    // Check if journal exists and is published
    const journal = await prisma.journal.findUnique({
      where: { 
        id: journalId,
        isPublished: true,
        reviewStatus: ReviewStatus.PUBLISHED,
      },
    });

    if (!journal) {
       res.status(404).json({
        success: false,
        message: "Journal not found or not available for download",
      });
    }

    // Record the download
    await prisma.download.create({
      data: {
        userId: userId as number,
        journalId,
        ipAddress: req.ip || null,
      },
    });

    //  the PDF URL for download
     res.status(200).json({
      success: true,
      message: "Download recorded successfully",
      data: {
        downloadUrl: journal?.pdfUrl || "",
      },
    });
  } catch (error) {
    console.error("Error recording download:", error);
     res.status(500).json({
      success: false,
      message: "Failed to record download",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Add comment to a journal
export const addComment = async (req: Request, res: Response):Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
       res.status(401).json({
        success: false,
        message: "Unauthorized - Please login to comment",
      });
    }

    const journalId = parseInt(id, 10);
    if (isNaN(journalId)) {
       res.status(400).json({
        success: false,
        message: "Invalid journal ID",
      });
    }

    // Validate comment data
    const { content, parentId } = req.body;

    if (!content || content.trim() === "") {
       res.status(400).json({
        success: false,
        message: "Comment content is required",
      });
    }

    // Check if journal exists and is published
    const journal = await prisma.journal.findUnique({
      where: { 
        id: journalId,
        isPublished: true,
        reviewStatus: ReviewStatus.PUBLISHED,
      },
    });

    if (!journal) {
       res.status(404).json({
        success: false,
        message: "Journal not found or not available for commenting",
      });
    }

    // If this is a reply, check if parent comment exists
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parseInt(parentId as string, 10) },
      });

      if (!parentComment || parentComment.journalId !== journalId) {
         res.status(404).json({
          success: false,
          message: "Parent comment not found",
        });
      }
    }

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        content,
        userId: userId as number,
        journalId,
        parentId: parentId ? parseInt(parentId as string, 10) : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });

     res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: comment,
    });
  } catch (error) {
    console.error("Error adding comment:", error);
     res.status(500).json({
      success: false,
      message: "Failed to add comment",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get journal statistics (for admins)
export const getJournalStats = async (req: Request, res: Response):Promise<void> => {
  try {
    const userRole = req.user?.role;

    // Check if user is admin
    if (userRole !== UserRole.ADMIN) {
       res.status(403).json({
        success: false,
        message: "Only administrators can access journal statistics",
      });
    }

    // Get counts by status
    const statusCounts = await prisma.journal.groupBy({
      by: ['reviewStatus'],
      _count: true,
    });

    // Get total journals
    const totalJournals = await prisma.journal.count();

    // Get total published journals
    const publishedJournals = await prisma.journal.count({
      where: { isPublished: true },
    });

    // Get total downloads
    const totalDownloads = await prisma.download.count();

    // Get most viewed journals
    const mostViewed = await prisma.journal.findMany({
      where: { isPublished: true },
      take: 5,
      orderBy: { viewCount: 'desc' },
      select: {
        id: true,
        title: true,
        viewCount: true,
        _count: {
          select: { downloads: true }
        },
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Get recent submissions
    const recentSubmissions = await prisma.journal.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30)),
        },
      },
    });

     res.status(200).json({
      success: true,
      data: {
        totalJournals,
        publishedJournals,
        totalDownloads,
        statusCounts,
        mostViewed,
        recentSubmissions,
      },
    });
  } catch (error) {
    console.error("Error getting journal statistics:", error);
     res.status(500).json({
      success: false,
      message: "Failed to get journal statistics",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// View journal PDF
export const viewJournalPDF = async (req: Request, res: Response):Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    const journalId = parseInt(id, 10);
    if (isNaN(journalId)) {
      res.status(400).json({
        success: false,
        message: "Invalid journal ID",
      });
      return;
    }

    // Check if journal exists and is published or if user is the author or admin
    const journal = await prisma.journal.findUnique({
      where: { id: journalId },
      select: {
        id: true,
        pdfUrl: true,
        isPublished: true,
        reviewStatus: true,
        authorId: true,
      },
    });

    if (!journal) {
      res.status(404).json({
        success: false,
        message: "Journal not found",
      });
      return;
    }

    // Check visibility permissions
    const isAuthor = userId && journal.authorId === userId;
    const isAdmin = req.user?.role === UserRole.ADMIN;
    const isPublished = journal.isPublished && journal.reviewStatus === ReviewStatus.PUBLISHED;

    if (!isPublished && !isAuthor && !isAdmin) {
      res.status(403).json({
        success: false,
        message: "You don't have permission to view this PDF",
      });
      return;
    }

    if (!journal.pdfUrl) {
      res.status(404).json({
        success: false,
        message: "PDF not available for this journal",
      });
      return;
    }

    // Return the PDF URL for viewing in browser
    res.status(200).json({
      success: true,
      data: {
        pdfUrl: journal.pdfUrl,
      },
    });
  } catch (error) {
    console.error("Error viewing journal PDF:", error);
    res.status(500).json({
      success: false,
      message: "Failed to access PDF",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
