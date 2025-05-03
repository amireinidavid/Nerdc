import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name:  "dqdvwe2v3",
  api_key:"368943645241426",
  api_secret: "18KfpRLIqwfsSKSt9Q4FYeOAM_A",
  secure: true,
});

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
 * Upload a PDF document to Cloudinary
 * @param file - File object from multer, express-fileupload, etc.
 * @returns The URL of the uploaded PDF
 */
export const uploadDocument = async (file: any): Promise<string> => {
  let tempFilePath: string | undefined;
  let fileName: string = '';
  try {
    if (file.tempFilePath && file.size > 0) {
      tempFilePath = file.tempFilePath;
      fileName = file.name || file.originalname || 'document.pdf';
    } else if (file.data && file.data.length > 0) {
      fileName = file.name || file.originalname || 'document.pdf';
      // Ensure fileName ends with .pdf
      if (!fileName.toLowerCase().endsWith('.pdf')) fileName += '.pdf';
      tempFilePath = path.join(os.tmpdir(), `${uuidv4()}-${fileName}`);
      await fs.promises.writeFile(tempFilePath, file.data);
    } else {
      throw new Error('File is empty or missing');
    }
    if (!tempFilePath) throw new Error('Temp file path not set');
    // Remove extension from public_id so Cloudinary doesn't add .tmp
    const publicId = path.parse(fileName).name;
    // Always use 'raw' for PDFs
    const { url } = await uploadToCloudinary(tempFilePath, 'pdfs', 'raw', publicId);
    if (tempFilePath !== file.tempFilePath) {
      await fs.promises.unlink(tempFilePath).catch(() => {});
    }
    return url;
  } catch (error) {
    if (tempFilePath && tempFilePath !== file.tempFilePath) {
      await fs.promises.unlink(tempFilePath).catch(() => {});
    }
    throw error;
  }
};

/**
 * Upload a thumbnail image to Cloudinary
 * @param file - File object from multer, express-fileupload, etc.
 * @returns The URL of the uploaded image
 */
export const uploadThumbnail = async (file: any): Promise<string> => {
  let tempFilePath: string | undefined;
  try {
    if (file.tempFilePath && file.size > 0) {
      tempFilePath = file.tempFilePath;
    } else if (file.data && file.data.length > 0) {
      tempFilePath = path.join(os.tmpdir(), `${uuidv4()}-${file.name || 'upload.jpg'}`);
      await fs.promises.writeFile(tempFilePath, file.data);
    } else {
      throw new Error('File is empty or missing');
    }
    if (!tempFilePath) throw new Error('Temp file path not set');
    const { url } = await uploadToCloudinary(tempFilePath, 'thumbnails', 'image');
    if (tempFilePath !== file.tempFilePath) {
      await fs.promises.unlink(tempFilePath).catch(() => {});
    }
    return url;
  } catch (error) {
    if (tempFilePath && tempFilePath !== file.tempFilePath) {
      await fs.promises.unlink(tempFilePath).catch(() => {});
    }
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