import { Router } from 'express';
import * as JournalController from '../controllers/JournalController';
import { authenticate, optionalAuthenticate, authorize } from '../middleware/authMiddleware';
import { UserRole } from '../generated/prisma';
import fileUpload from 'express-fileupload';
import path from 'path';
import fs from 'fs';

const router = Router();

// Ensure /tmp directory exists for Vercel serverless environment
const tempDir = '/tmp';
try {
  if (!fs.existsSync(tempDir)) {
    console.log(`Creating temp directory: ${tempDir}`);
    fs.mkdirSync(tempDir, { recursive: true });
  }
} catch (error) {
  console.error(`Error creating temp directory: ${error}`);
}

// Configure file upload middleware
const fileUploadMiddleware = fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
  createParentPath: true,
  abortOnLimit: true,
  useTempFiles: true,
  tempFileDir: tempDir, // Use absolute path to system temp directory
  debug: process.env.NODE_ENV !== 'production', // Enable debug in development
  preserveExtension: true, // Preserve file extensions
  uploadTimeout: 60000, // 60 seconds upload timeout
  parseNested: true,
  safeFileNames: true
});

// Public routes (with optional authentication)
router.get('/public', JournalController.getPublishedJournals);
router.get('/get', optionalAuthenticate, JournalController.getJournals);
router.get('/get/:id', optionalAuthenticate, JournalController.getJournalById);
router.get('/get/:id/view-pdf', optionalAuthenticate, JournalController.viewJournalPDF);

// Diagnostic endpoint to check authentication status
router.get('/check-auth', authenticate, JournalController.checkUserStatus);

// Protected routes for all authenticated users
router.get('/saved', authenticate, JournalController.getSavedJournals);
router.post('/save/:id', authenticate, JournalController.saveJournal);
router.delete('/save/:id', authenticate, JournalController.unsaveJournal);
router.post('/download/:id', authenticate, JournalController.downloadJournal);
router.post('/comment/:id', authenticate, JournalController.addComment);

// Author routes (for authors only)
router.get('/my-journals', authenticate, authorize([UserRole.AUTHOR, UserRole.ADMIN]), JournalController.getUserJournals);
router.post('/', authenticate, authorize([UserRole.AUTHOR]), fileUploadMiddleware, JournalController.createJournal);
router.put('/update/:id', authenticate, fileUploadMiddleware, JournalController.updateJournal); // Permission check is in controller
router.delete('/delete/:id', authenticate, JournalController.deleteJournal); // Permission check is in controller
router.post('/submit/:id', authenticate, authorize([UserRole.AUTHOR]), JournalController.submitForReview);

// Admin routes
router.get('/pending-reviews', authenticate, authorize([UserRole.ADMIN]), JournalController.getPendingReviews);
router.post('/review/:id/review', authenticate, authorize([UserRole.ADMIN]), JournalController.reviewJournal);
router.get('/journal-stats', authenticate, authorize([UserRole.ADMIN]), JournalController.getJournalStats);

export default router; 