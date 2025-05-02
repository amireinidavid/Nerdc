import { Request } from 'express';
import { FileArray, UploadedFile } from 'express-fileupload';

// Extend Express Request interface to include file upload properties
declare global {
  namespace Express {
    interface Request {
      files?: FileArray;
      file?: Multer.File;
    }
    
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      }
    }
  }
} 