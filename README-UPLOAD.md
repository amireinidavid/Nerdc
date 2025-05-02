# File Upload Configuration

This project supports two methods for file uploads:

1. **Local File Storage** (default, works without additional setup)
2. **UploadThing** (cloud storage, requires API credentials)

## Local File Storage

The local file storage solution is enabled by default and requires no additional setup. Files are stored in the `uploads/` directory in your project root.

## Setting Up UploadThing

To use UploadThing for cloud file uploads, follow these steps:

1. **Create an UploadThing account**:
   - Go to [https://uploadthing.com](https://uploadthing.com) and sign up
   - Create a new project

2. **Get your API credentials**:
   - In your UploadThing dashboard, navigate to the API Keys section
   - Copy your App ID and Secret Key

3. **Set environment variables**:
   Create a `.env` file in your project root with the following:

   ```
   # UploadThing credentials
   UPLOADTHING_APP_ID=your_app_id_here
   UPLOADTHING_SECRET=your_secret_key_here
   
   # Public URL for file access (set this to your domain in production)
   PUBLIC_URL=http://localhost:3000
   ```

4. **Install required packages**:
   ```bash
   npm install uploadthing @uploadthing/react
   ```

5. **Restart your server**:
   The application will automatically detect the UploadThing credentials and use cloud storage.

## File Upload Configuration Files

- `server/utils/fileStorage.ts`: Local file storage implementation
- `server/utils/uploadThingConfig.ts`: UploadThing cloud storage implementation

## Usage in Your Code

Both implementations provide the same interface, so you can import and use either one:

```typescript
// Import from fileStorage for local storage
import { uploadDocument, uploadThumbnail, getSecureUrl } from "../utils/fileStorage";

// OR import from uploadThingConfig for cloud storage
import { uploadDocument, uploadThumbnail, getSecureUrl } from "../utils/uploadThingConfig";
```

## Important Note

If you plan to use UploadThing in production, make sure to add proper authentication and security measures by customizing the middleware functions in the `uploadThingConfig.ts` file. 