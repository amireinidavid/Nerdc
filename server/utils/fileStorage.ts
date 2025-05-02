import { randomUUID } from 'crypto';
import * as path from 'path';
import * as fs from 'fs';

// Define types for our file upload
interface FileUpload {
  name: string;
  mimetype: string;
  data: Buffer;
  size: number;
  mv: (path: string) => Promise<void>;
}

/**
 * Upload file to local storage
 * Note: In a production environment, you would likely use a cloud storage service
 * like AWS S3, Google Cloud Storage, or Azure Blob Storage instead
 */
export const uploadToStorage = async (file: FileUpload, directory: string): Promise<string> => {
  try {
    // Create a unique filename to prevent collisions
    const fileExtension = path.extname(file.name);
    const fileName = `${randomUUID()}${fileExtension}`;
    
    // Make sure the upload directory exists
    const uploadDir = path.join(process.cwd(), 'uploads', directory);
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Define the file path
    const filePath = path.join(uploadDir, fileName);
    
    // Move the file to the destination
    await file.mv(filePath);
    
    // Return the relative URL to the file
    return `/uploads/${directory}/${fileName}`;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('File upload failed');
  }
};

/**
 * Delete file from storage
 */
export const deleteFromStorage = async (fileUrl: string): Promise<boolean> => {
  try {
    // Extract the file path from the URL
    const filePath = path.join(process.cwd(), fileUrl);
    
    // Check if file exists
    if (fs.existsSync(filePath)) {
      // Delete the file
      fs.unlinkSync(filePath);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('File deletion failed');
  }
};

/**
 * Get file size in human-readable format
 */
export const getFileSize = (size: number): string => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let fileSize = size;
  let unitIndex = 0;
  
  while (fileSize >= 1024 && unitIndex < units.length - 1) {
    fileSize /= 1024;
    unitIndex++;
  }
  
  return `${fileSize.toFixed(2)} ${units[unitIndex]}`;
}; 