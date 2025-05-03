import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { promisify } from 'util';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dqdvwe2v3",
  api_key: process.env.CLOUDINARY_API_KEY || "368943645241426",
  api_secret: process.env.CLOUDINARY_API_SECRET || "18KfpRLIqwfsSKSt9Q4FYeOAM_A",
  secure: true,
});

// Initialize with fallback values if needed
if (!process.env.CLOUDINARY_CLOUD_NAME) {
  console.warn('CLOUDINARY_CLOUD_NAME environment variable is not set');
}

if (!process.env.CLOUDINARY_API_KEY) {
  console.warn('CLOUDINARY_API_KEY environment variable is not set');
}

if (!process.env.CLOUDINARY_API_SECRET) {
  console.warn('CLOUDINARY_API_SECRET environment variable is not set');
}

/**
 * Save file to temp directory and return the path
 */
const saveTempFile = async (file: any): Promise<string> => {
  const tempDir = os.tmpdir();
  const tempFilePath = path.join(tempDir, `${uuidv4()}-${file.name || 'upload'}`);

  if (Buffer.isBuffer(file.data)) {
    await fs.promises.writeFile(tempFilePath, file.data);
  } else if (file.path) {
    return file.path;
  } else if (file.stream) {
    const writeStream = fs.createWriteStream(tempFilePath);
    await new Promise((resolve, reject) => {
      file.stream.pipe(writeStream)
        .on('finish', resolve)
        .on('error', reject);
    });
  } else {
    throw new Error('Unsupported file format');
  }
  return tempFilePath;
};

/**
 * Upload a file to Cloudinary
 * @param filePath - Path to the file
 * @param folder - Cloudinary folder
 * @param resourceType - 'image' or 'raw' (for PDF)
 * @returns Cloudinary upload result
 */
const uploadToCloudinary = async (
  filePath: string,
  folder: string,
  resourceType: 'image' | 'raw',
  publicId?: string,
): Promise<{ url: string; public_id: string; }> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      filePath,
      {
        folder,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: false,
        overwrite: true,
        public_id: publicId,
        format: resourceType === 'raw' ? 'pdf' : undefined,
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Cloudinary upload failed'));
        } else {
          resolve({ url: result.secure_url, public_id: result.public_id });
        }
      },
    );
  });
};

/**
 * Helper to check if Cloudinary is configured
 */
export const isCloudinaryConfigured = () => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

/**
 * Upload a document to Cloudinary
 * @param file - File object from multer, express-fileupload, etc.
 * @returns The URL of the uploaded document
 */
export const uploadDocument = async (file: any): Promise<string> => {
  console.log('Starting document upload to Cloudinary...');
  
  try {
    if (!isCloudinaryConfigured()) {
      console.warn('Cloudinary not configured. Using fallback URL for document');
      return `/uploads/test-document.pdf`;
    }
    
    // Different handling based on the file object structure
    if (file.tempFilePath) {
      // express-fileupload object
      console.log(`Uploading from temp file path: ${file.tempFilePath}`);
      
      // Verify the file exists before uploading
      try {
        await promisify(fs.access)(file.tempFilePath, fs.constants.R_OK);
      } catch (err: any) {
        console.error(`Cannot access temp file at ${file.tempFilePath}:`, err);
        throw new Error(`Temp file not accessible: ${err.message}`);
      }
      
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        resource_type: 'raw',
        folder: 'journals/documents',
        public_id: `${Date.now()}-${file.name.split('.')[0]}`,
      });
      
      console.log('Document uploaded to Cloudinary successfully');
      return result.secure_url;
    } else if (file.path) {
      // multer object
      console.log(`Uploading from path: ${file.path}`);
      
      // Verify the file exists before uploading
      try {
        await promisify(fs.access)(file.path, fs.constants.R_OK);
      } catch (err: any) {
        console.error(`Cannot access file at ${file.path}:`, err);
        throw new Error(`File not accessible: ${err.message}`);
      }
      
      const result = await cloudinary.uploader.upload(file.path, {
        resource_type: 'raw',
        folder: 'journals/documents',
        public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
      });
      
      console.log('Document uploaded to Cloudinary successfully');
      return result.secure_url;
    } else {
      throw new Error('Unsupported file object structure');
    }
  } catch (error) {
    console.error('Error uploading document to Cloudinary:', error);
    throw error;
  }
};

/**
 * Upload a thumbnail image to Cloudinary
 * @param file - File object from multer, express-fileupload, etc.
 * @returns The URL of the uploaded image
 */
export const uploadThumbnail = async (file: any): Promise<string> => {
  console.log('Starting thumbnail upload to Cloudinary...');
  
  try {
    if (!isCloudinaryConfigured()) {
      console.warn('Cloudinary not configured. Using fallback URL for thumbnail');
      return `/uploads/test-thumbnail.jpg`;
    }
    
    // Different handling based on the file object structure
    if (file.tempFilePath) {
      // express-fileupload object
      console.log(`Uploading from temp file path: ${file.tempFilePath}`);
      
      // Verify the file exists before uploading
      try {
        await promisify(fs.access)(file.tempFilePath, fs.constants.R_OK);
      } catch (err: any) {
        console.error(`Cannot access temp file at ${file.tempFilePath}:`, err);
        throw new Error(`Temp file not accessible: ${err.message}`);
      }
      
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: 'journals/thumbnails',
        public_id: `${Date.now()}-${file.name.split('.')[0]}`,
        transformation: [
          { width: 300, height: 400, crop: 'fill', gravity: 'auto' }
        ]
      });
      
      console.log('Thumbnail uploaded to Cloudinary successfully');
      return result.secure_url;
    } else if (file.path) {
      // multer object
      console.log(`Uploading from path: ${file.path}`);
      
      // Verify the file exists before uploading
      try {
        await promisify(fs.access)(file.path, fs.constants.R_OK);
      } catch (err: any) {
        console.error(`Cannot access file at ${file.path}:`, err);
        throw new Error(`File not accessible: ${err.message}`);
      }
      
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'journals/thumbnails',
        public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
        transformation: [
          { width: 300, height: 400, crop: 'fill', gravity: 'auto' }
        ]
      });
      
      console.log('Thumbnail uploaded to Cloudinary successfully');
      return result.secure_url;
    } else {
      throw new Error('Unsupported file object structure');
    }
  } catch (error) {
    console.error('Error uploading thumbnail to Cloudinary:', error);
    throw error;
  }
};

/**
 * Get a secure URL for a Cloudinary file (just returns the secure_url)
 * @param url - The Cloudinary secure_url
 * @returns The same URL (Cloudinary already provides secure URLs)
 */
export const getSecureUrl = (url: string): string => url;

export default { uploadDocument, uploadThumbnail, getSecureUrl };
