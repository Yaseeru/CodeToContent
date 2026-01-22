import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { LoggerService, LogLevel } from './LoggerService';

/**
 * Metadata for image storage
 */
export interface ImageMetadata {
     userId: string;
     repositoryId: string;
     fileName?: string;
}

/**
 * Interface for storage service implementations
 * Supports multiple storage backends (local, S3, etc.)
 */
export interface IStorageService {
     /**
      * Upload an image buffer to storage
      * @param buffer - Image data as Buffer
      * @param metadata - Metadata about the image
      * @returns URL to access the stored image
      */
     uploadImage(buffer: Buffer, metadata: ImageMetadata): Promise<string>;

     /**
      * Delete an image from storage
      * @param url - URL of the image to delete
      */
     deleteImage(url: string): Promise<void>;

     /**
      * Get the full URL for an image
      * @param key - Storage key/path for the image
      * @returns Full URL to access the image
      */
     getImageUrl(key: string): Promise<string>;
}

/**
 * Local file system storage implementation for development
 * Stores images in backend/uploads/snapshots directory
 */
export class LocalStorageService implements IStorageService {
     private baseDir: string;
     private baseUrl: string;
     private logger: LoggerService;

     constructor(baseDir: string = 'uploads/snapshots', baseUrl: string = 'http://localhost:3001') {
          this.baseDir = baseDir;
          this.baseUrl = baseUrl;
          this.logger = LoggerService.getInstance();
     }

     /**
      * Initialize storage directory
      * Creates the directory structure if it doesn't exist
      */
     async initialize(): Promise<void> {
          try {
               await fs.mkdir(this.baseDir, { recursive: true });
               this.logger.log(LogLevel.INFO, 'LocalStorageService initialized', {
                    baseDir: this.baseDir
               });
          } catch (error) {
               this.logger.log(LogLevel.ERROR, 'Failed to initialize storage directory', {
                    error: error instanceof Error ? error.message : String(error),
                    baseDir: this.baseDir
               });
               throw new Error('Failed to initialize storage directory');
          }
     }

     /**
      * Upload an image to local file system
      * Generates unique filename: {userId}/{repositoryId}/{timestamp}_{hash}.png
      */
     async uploadImage(buffer: Buffer, metadata: ImageMetadata): Promise<string> {
          try {
               // Generate unique filename
               const timestamp = Date.now();
               const hash = crypto.createHash('md5').update(buffer).digest('hex').substring(0, 8);
               const fileName = metadata.fileName || `${timestamp}_${hash}.png`;

               // Create user/repository directory structure
               const userDir = path.join(this.baseDir, metadata.userId);
               const repoDir = path.join(userDir, metadata.repositoryId);
               await fs.mkdir(repoDir, { recursive: true });

               // Full file path
               const filePath = path.join(repoDir, fileName);

               // Write file
               await fs.writeFile(filePath, buffer);

               // Generate URL
               const relativePath = path.join('snapshots', metadata.userId, metadata.repositoryId, fileName);
               const url = `${this.baseUrl}/uploads/${relativePath.replace(/\\/g, '/')}`;

               this.logger.log(LogLevel.INFO, 'Image uploaded successfully', {
                    url,
                    sizeInKB: (buffer.length / 1024).toFixed(2)
               });

               return url;
          } catch (error) {
               this.logger.log(LogLevel.ERROR, 'Failed to upload image', {
                    error: error instanceof Error ? error.message : String(error),
                    metadata
               });
               throw new Error('Failed to upload image to storage');
          }
     }

     /**
      * Delete an image from local file system
      * Extracts file path from URL and removes the file
      */
     async deleteImage(url: string): Promise<void> {
          try {
               // Extract relative path from URL
               // URL format: http://localhost:3001/uploads/snapshots/{userId}/{repositoryId}/{fileName}
               const urlObj = new URL(url);
               const relativePath = urlObj.pathname.replace('/uploads/', '');
               const filePath = path.join('uploads', relativePath);

               // Check if file exists
               try {
                    await fs.access(filePath);
               } catch {
                    this.logger.log(LogLevel.WARN, 'File not found for deletion', { url, filePath });
                    return; // File doesn't exist, nothing to delete
               }

               // Delete file
               await fs.unlink(filePath);

               this.logger.log(LogLevel.INFO, 'Image deleted successfully', { url });
          } catch (error) {
               this.logger.log(LogLevel.ERROR, 'Failed to delete image', {
                    error: error instanceof Error ? error.message : String(error),
                    url
               });
               throw new Error('Failed to delete image from storage');
          }
     }

     /**
      * Get full URL for an image key
      * For local storage, constructs URL from base URL and key
      */
     async getImageUrl(key: string): Promise<string> {
          const url = `${this.baseUrl}/uploads/snapshots/${key}`;
          return url;
     }
}

/**
 * AWS S3 cloud storage implementation for production
 * Stores images in S3 bucket with signed URLs for secure access
 */
export class CloudStorageService implements IStorageService {
     private s3Client: S3Client;
     private bucket: string;
     private region: string;
     private logger: LoggerService;
     private signedUrlExpiration: number; // Expiration time in seconds

     constructor(
          bucket: string,
          region: string,
          accessKeyId: string,
          secretAccessKey: string,
          signedUrlExpiration: number = 3600 // Default 1 hour
     ) {
          this.bucket = bucket;
          this.region = region;
          this.signedUrlExpiration = signedUrlExpiration;
          this.logger = LoggerService.getInstance();

          // Initialize S3 client
          this.s3Client = new S3Client({
               region: this.region,
               credentials: {
                    accessKeyId,
                    secretAccessKey
               }
          });
     }

     /**
      * Initialize S3 storage
      * Validates bucket access by checking if bucket exists
      */
     async initialize(): Promise<void> {
          try {
               // Test bucket access by attempting to head a non-existent object
               // This validates credentials and bucket permissions
               const testKey = 'test-access-validation';
               const command = new HeadObjectCommand({
                    Bucket: this.bucket,
                    Key: testKey
               });

               try {
                    await this.s3Client.send(command);
               } catch (error: any) {
                    // 404 is expected (object doesn't exist), but it confirms bucket access
                    if (error.name !== 'NotFound' && error.$metadata?.httpStatusCode !== 404) {
                         throw error;
                    }
               }

               this.logger.log(LogLevel.INFO, 'CloudStorageService initialized', {
                    bucket: this.bucket,
                    region: this.region
               });
          } catch (error) {
               this.logger.log(LogLevel.ERROR, 'Failed to initialize S3 storage', {
                    error: error instanceof Error ? error.message : String(error),
                    bucket: this.bucket,
                    region: this.region
               });
               throw new Error('Failed to initialize S3 storage. Check credentials and bucket permissions.');
          }
     }

     /**
      * Upload an image to S3
      * Generates unique S3 key: snapshots/{userId}/{repositoryId}/{timestamp}_{hash}.png
      */
     async uploadImage(buffer: Buffer, metadata: ImageMetadata): Promise<string> {
          try {
               // Generate unique filename
               const timestamp = Date.now();
               const hash = crypto.createHash('md5').update(buffer).digest('hex').substring(0, 8);
               const fileName = metadata.fileName || `${timestamp}_${hash}.png`;

               // Generate S3 key with directory structure
               const s3Key = `snapshots/${metadata.userId}/${metadata.repositoryId}/${fileName}`;

               // Upload to S3
               const command = new PutObjectCommand({
                    Bucket: this.bucket,
                    Key: s3Key,
                    Body: buffer,
                    ContentType: 'image/png',
                    // Set cache control for CDN optimization
                    CacheControl: 'public, max-age=31536000', // 1 year
                    // Add metadata for tracking
                    Metadata: {
                         userId: metadata.userId,
                         repositoryId: metadata.repositoryId,
                         uploadedAt: new Date().toISOString()
                    }
               });

               await this.s3Client.send(command);

               // Generate signed URL for secure access
               const url = await this.getImageUrl(s3Key);

               this.logger.log(LogLevel.INFO, 'Image uploaded to S3 successfully', {
                    s3Key,
                    bucket: this.bucket,
                    sizeInKB: (buffer.length / 1024).toFixed(2)
               });

               return url;
          } catch (error) {
               this.logger.log(LogLevel.ERROR, 'Failed to upload image to S3', {
                    error: error instanceof Error ? error.message : String(error),
                    metadata,
                    bucket: this.bucket
               });
               throw new Error('Failed to upload image to S3 storage');
          }
     }

     /**
      * Delete an image from S3
      * Extracts S3 key from signed URL and removes the object
      */
     async deleteImage(url: string): Promise<void> {
          try {
               // Extract S3 key from URL
               // Signed URL format: https://{bucket}.s3.{region}.amazonaws.com/{key}?...
               // or: https://s3.{region}.amazonaws.com/{bucket}/{key}?...
               const s3Key = this.extractS3KeyFromUrl(url);

               if (!s3Key) {
                    this.logger.log(LogLevel.WARN, 'Could not extract S3 key from URL', { url });
                    return;
               }

               // Check if object exists
               try {
                    const headCommand = new HeadObjectCommand({
                         Bucket: this.bucket,
                         Key: s3Key
                    });
                    await this.s3Client.send(headCommand);
               } catch (error: any) {
                    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
                         this.logger.log(LogLevel.WARN, 'S3 object not found for deletion', { s3Key, url });
                         return; // Object doesn't exist, nothing to delete
                    }
                    throw error;
               }

               // Delete object
               const deleteCommand = new DeleteObjectCommand({
                    Bucket: this.bucket,
                    Key: s3Key
               });

               await this.s3Client.send(deleteCommand);

               this.logger.log(LogLevel.INFO, 'Image deleted from S3 successfully', { s3Key, bucket: this.bucket });
          } catch (error) {
               this.logger.log(LogLevel.ERROR, 'Failed to delete image from S3', {
                    error: error instanceof Error ? error.message : String(error),
                    url,
                    bucket: this.bucket
               });
               throw new Error('Failed to delete image from S3 storage');
          }
     }

     /**
      * Get signed URL for an S3 object
      * Generates a pre-signed URL that expires after configured time
      */
     async getImageUrl(key: string): Promise<string> {
          try {
               const command = new PutObjectCommand({
                    Bucket: this.bucket,
                    Key: key
               });

               // Generate signed URL with expiration
               const signedUrl = await getSignedUrl(this.s3Client, command, {
                    expiresIn: this.signedUrlExpiration
               });

               return signedUrl;
          } catch (error) {
               this.logger.log(LogLevel.ERROR, 'Failed to generate signed URL', {
                    error: error instanceof Error ? error.message : String(error),
                    key,
                    bucket: this.bucket
               });
               throw new Error('Failed to generate signed URL for S3 object');
          }
     }

     /**
      * Extract S3 key from signed URL
      * Handles both virtual-hosted-style and path-style URLs
      */
     private extractS3KeyFromUrl(url: string): string | null {
          try {
               const urlObj = new URL(url);
               const hostname = urlObj.hostname;
               const pathname = urlObj.pathname;

               // Virtual-hosted-style URL: https://{bucket}.s3.{region}.amazonaws.com/{key}
               if (hostname.startsWith(`${this.bucket}.s3.`)) {
                    return pathname.substring(1); // Remove leading slash
               }

               // Path-style URL: https://s3.{region}.amazonaws.com/{bucket}/{key}
               if (hostname.startsWith('s3.')) {
                    const parts = pathname.split('/').filter(p => p.length > 0);
                    if (parts.length > 1 && parts[0] === this.bucket) {
                         return parts.slice(1).join('/');
                    }
               }

               // If URL doesn't match expected patterns, try to extract key from pathname
               // Assume key starts with 'snapshots/'
               const snapshotsIndex = pathname.indexOf('snapshots/');
               if (snapshotsIndex !== -1) {
                    return pathname.substring(snapshotsIndex);
               }

               return null;
          } catch (error) {
               this.logger.log(LogLevel.ERROR, 'Failed to parse S3 URL', {
                    error: error instanceof Error ? error.message : String(error),
                    url
               });
               return null;
          }
     }
}
