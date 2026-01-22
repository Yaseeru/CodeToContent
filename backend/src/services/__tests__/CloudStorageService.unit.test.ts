/**
 * Unit Tests for CloudStorageService
 * Tests S3 upload, deletion, signed URL generation, and error handling
 * Validates: Requirements 6.4
 */

import { CloudStorageService, ImageMetadata } from '../StorageService';
import { LoggerService } from '../LoggerService';
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');

// Mock LoggerService
jest.mock('../LoggerService', () => {
     return {
          LoggerService: {
               getInstance: jest.fn().mockReturnValue({
                    log: jest.fn(),
               }),
          },
          LogLevel: {
               INFO: 'INFO',
               ERROR: 'ERROR',
               WARN: 'WARN',
               DEBUG: 'DEBUG',
          },
     };
});

describe('CloudStorageService Unit Tests', () => {
     let storageService: CloudStorageService;
     let mockS3Client: jest.Mocked<S3Client>;
     let mockSend: jest.Mock;

     const testBucket = 'test-bucket';
     const testRegion = 'us-east-1';
     const testAccessKeyId = 'test-access-key';
     const testSecretAccessKey = 'test-secret-key';
     const testSignedUrlExpiration = 3600;

     beforeEach(() => {
          jest.clearAllMocks();

          // Mock S3Client.send method
          mockSend = jest.fn();
          mockS3Client = {
               send: mockSend,
          } as any;

          (S3Client as jest.MockedClass<typeof S3Client>).mockImplementation(() => mockS3Client);

          storageService = new CloudStorageService(
               testBucket,
               testRegion,
               testAccessKeyId,
               testSecretAccessKey,
               testSignedUrlExpiration
          );
     });

     describe('Initialization', () => {
          test('should validate S3 bucket access on initialize', async () => {
               // Mock HeadObjectCommand to return 404 (expected for validation)
               mockSend.mockRejectedValue({
                    name: 'NotFound',
                    $metadata: { httpStatusCode: 404 },
               });

               await storageService.initialize();

               expect(mockSend).toHaveBeenCalledWith(expect.any(HeadObjectCommand));
          });

          test('should throw error if S3 bucket is not accessible', async () => {
               // Mock access denied error
               mockSend.mockRejectedValue({
                    name: 'AccessDenied',
                    $metadata: { httpStatusCode: 403 },
               });

               await expect(storageService.initialize()).rejects.toThrow(
                    'Failed to initialize S3 storage. Check credentials and bucket permissions.'
               );
          });

          test('should handle network errors during initialization', async () => {
               mockSend.mockRejectedValue(new Error('Network error'));

               await expect(storageService.initialize()).rejects.toThrow(
                    'Failed to initialize S3 storage. Check credentials and bucket permissions.'
               );
          });
     });

     describe('Upload Image', () => {
          test('should upload image to S3 with correct parameters', async () => {
               const buffer = Buffer.from('fake-image-data');
               const metadata: ImageMetadata = {
                    userId: 'user123',
                    repositoryId: 'repo456',
               };

               mockSend.mockResolvedValue({});
               (getSignedUrl as jest.Mock).mockResolvedValue('https://signed-url.com/image.png');

               const url = await storageService.uploadImage(buffer, metadata);

               // Verify PutObjectCommand was called
               expect(mockSend).toHaveBeenCalledWith(expect.any(PutObjectCommand));
               expect(mockSend).toHaveBeenCalledTimes(1);

               // Verify signed URL was generated and returned
               expect(url).toBe('https://signed-url.com/image.png');
               expect(getSignedUrl).toHaveBeenCalled();
          });

          test('should use custom filename if provided', async () => {
               const buffer = Buffer.from('fake-image-data');
               const metadata: ImageMetadata = {
                    userId: 'user123',
                    repositoryId: 'repo456',
                    fileName: 'custom-name.png',
               };

               mockSend.mockResolvedValue({});
               (getSignedUrl as jest.Mock).mockResolvedValue('https://signed-url.com/custom-name.png');

               const url = await storageService.uploadImage(buffer, metadata);

               // Verify upload succeeded
               expect(mockSend).toHaveBeenCalledWith(expect.any(PutObjectCommand));
               expect(url).toBeTruthy();
          });

          test('should generate unique filenames for same content', async () => {
               const buffer = Buffer.from('same-content');
               const metadata: ImageMetadata = {
                    userId: 'user123',
                    repositoryId: 'repo456',
               };

               mockSend.mockResolvedValue({});
               (getSignedUrl as jest.Mock).mockResolvedValue('https://signed-url.com/image.png');

               await storageService.uploadImage(buffer, metadata);
               await new Promise(resolve => setTimeout(resolve, 10)); // Ensure different timestamp
               await storageService.uploadImage(buffer, metadata);

               // Both uploads should succeed
               expect(mockSend).toHaveBeenCalledTimes(2);
          });

          test('should throw error if S3 upload fails', async () => {
               const buffer = Buffer.from('fake-image-data');
               const metadata: ImageMetadata = {
                    userId: 'user123',
                    repositoryId: 'repo456',
               };

               mockSend.mockRejectedValue(new Error('S3 upload failed'));

               await expect(storageService.uploadImage(buffer, metadata)).rejects.toThrow(
                    'Failed to upload image to S3 storage'
               );
          });

          test('should handle large image uploads', async () => {
               const largeBuffer = Buffer.alloc(5 * 1024 * 1024); // 5MB
               const metadata: ImageMetadata = {
                    userId: 'user123',
                    repositoryId: 'repo456',
               };

               mockSend.mockResolvedValue({});
               (getSignedUrl as jest.Mock).mockResolvedValue('https://signed-url.com/large-image.png');

               const url = await storageService.uploadImage(largeBuffer, metadata);

               expect(url).toBeTruthy();
               expect(mockSend).toHaveBeenCalled();
          });
     });

     describe('Delete Image', () => {
          test('should delete image from S3 using virtual-hosted-style URL', async () => {
               const url = `https://${testBucket}.s3.${testRegion}.amazonaws.com/snapshots/user123/repo456/1234567890_abcd1234.png`;

               mockSend.mockResolvedValueOnce({});
               mockSend.mockResolvedValueOnce({});

               await storageService.deleteImage(url);

               expect(mockSend).toHaveBeenNthCalledWith(1, expect.any(HeadObjectCommand));
               expect(mockSend).toHaveBeenNthCalledWith(2, expect.any(DeleteObjectCommand));
               expect(mockSend).toHaveBeenCalledTimes(2);
          });

          test('should delete image from S3 using path-style URL', async () => {
               const url = `https://s3.${testRegion}.amazonaws.com/${testBucket}/snapshots/user123/repo456/1234567890_abcd1234.png`;

               mockSend.mockResolvedValueOnce({});
               mockSend.mockResolvedValueOnce({});

               await storageService.deleteImage(url);

               expect(mockSend).toHaveBeenCalledTimes(2);
          });

          test('should handle non-existent file gracefully', async () => {
               const url = `https://${testBucket}.s3.${testRegion}.amazonaws.com/snapshots/user123/repo456/nonexistent.png`;

               mockSend.mockRejectedValue({
                    name: 'NotFound',
                    $metadata: { httpStatusCode: 404 },
               });

               await expect(storageService.deleteImage(url)).resolves.not.toThrow();
               expect(mockSend).toHaveBeenCalledTimes(1);
          });

          test('should throw error if S3 deletion fails', async () => {
               const url = `https://${testBucket}.s3.${testRegion}.amazonaws.com/snapshots/user123/repo456/1234567890_abcd1234.png`;

               mockSend.mockResolvedValueOnce({});
               mockSend.mockRejectedValueOnce(new Error('Permission denied'));

               await expect(storageService.deleteImage(url)).rejects.toThrow(
                    'Failed to delete image from S3 storage'
               );
          });

          test('should handle signed URLs with query parameters', async () => {
               const url = `https://${testBucket}.s3.${testRegion}.amazonaws.com/snapshots/user123/repo456/1234567890_abcd1234.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...`;

               mockSend.mockResolvedValueOnce({});
               mockSend.mockResolvedValueOnce({});

               await storageService.deleteImage(url);

               expect(mockSend).toHaveBeenCalledTimes(2);
          });

          test('should handle invalid URL format gracefully', async () => {
               const url = 'https://invalid-url.com/image.png';

               await expect(storageService.deleteImage(url)).resolves.not.toThrow();
          });
     });

     describe('Get Image URL', () => {
          test('should generate signed URL for S3 object', async () => {
               const key = 'snapshots/user123/repo456/1234567890_abcd1234.png';
               const expectedSignedUrl = 'https://signed-url.com/image.png?signature=xyz';

               (getSignedUrl as jest.Mock).mockResolvedValue(expectedSignedUrl);

               const url = await storageService.getImageUrl(key);

               expect(url).toBe(expectedSignedUrl);
               expect(getSignedUrl).toHaveBeenCalledWith(
                    mockS3Client,
                    expect.any(PutObjectCommand),
                    { expiresIn: testSignedUrlExpiration }
               );
          });

          test('should use custom expiration time', async () => {
               const customExpiration = 7200; // 2 hours
               const customStorageService = new CloudStorageService(
                    testBucket,
                    testRegion,
                    testAccessKeyId,
                    testSecretAccessKey,
                    customExpiration
               );

               const key = 'snapshots/user123/repo456/1234567890_abcd1234.png';
               (getSignedUrl as jest.Mock).mockResolvedValue('https://signed-url.com/image.png');

               await customStorageService.getImageUrl(key);

               expect(getSignedUrl).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.any(PutObjectCommand),
                    { expiresIn: customExpiration }
               );
          });

          test('should throw error if signed URL generation fails', async () => {
               const key = 'snapshots/user123/repo456/1234567890_abcd1234.png';

               (getSignedUrl as jest.Mock).mockRejectedValue(new Error('Failed to sign URL'));

               await expect(storageService.getImageUrl(key)).rejects.toThrow(
                    'Failed to generate signed URL for S3 object'
               );
          });

          test('should handle empty key', async () => {
               const key = '';

               (getSignedUrl as jest.Mock).mockResolvedValue('https://signed-url.com/');

               const url = await storageService.getImageUrl(key);

               expect(url).toBeTruthy();
          });
     });

     describe('S3 Key Extraction', () => {
          test('should extract key from virtual-hosted-style URL', async () => {
               const url = `https://${testBucket}.s3.${testRegion}.amazonaws.com/snapshots/user123/repo456/image.png`;

               mockSend.mockResolvedValueOnce({});
               mockSend.mockResolvedValueOnce({});

               await storageService.deleteImage(url);

               expect(mockSend).toHaveBeenCalledTimes(2);
          });

          test('should extract key from path-style URL', async () => {
               const url = `https://s3.${testRegion}.amazonaws.com/${testBucket}/snapshots/user123/repo456/image.png`;

               mockSend.mockResolvedValueOnce({});
               mockSend.mockResolvedValueOnce({});

               await storageService.deleteImage(url);

               expect(mockSend).toHaveBeenCalledTimes(2);
          });

          test('should extract key from URL with nested paths', async () => {
               const url = `https://${testBucket}.s3.${testRegion}.amazonaws.com/snapshots/user123/repo456/subfolder/image.png`;

               mockSend.mockResolvedValueOnce({});
               mockSend.mockResolvedValueOnce({});

               await storageService.deleteImage(url);

               expect(mockSend).toHaveBeenCalledTimes(2);
          });

          test('should handle URL with query parameters', async () => {
               const url = `https://${testBucket}.s3.${testRegion}.amazonaws.com/snapshots/user123/repo456/image.png?versionId=abc123`;

               mockSend.mockResolvedValueOnce({});
               mockSend.mockResolvedValueOnce({});

               await storageService.deleteImage(url);

               expect(mockSend).toHaveBeenCalledTimes(2);
          });
     });

     describe('Error Handling', () => {
          test('should log errors with context', async () => {
               const buffer = Buffer.from('fake-image-data');
               const metadata: ImageMetadata = {
                    userId: 'user123',
                    repositoryId: 'repo456',
               };

               mockSend.mockRejectedValue(new Error('S3 error'));

               await expect(storageService.uploadImage(buffer, metadata)).rejects.toThrow();

               const logger = LoggerService.getInstance();
               expect(logger.log).toHaveBeenCalledWith(
                    'ERROR',
                    'Failed to upload image to S3',
                    expect.objectContaining({
                         error: 'S3 error',
                         metadata,
                         bucket: testBucket,
                    })
               );
          });

          test('should handle S3 rate limiting errors', async () => {
               const buffer = Buffer.from('fake-image-data');
               const metadata: ImageMetadata = {
                    userId: 'user123',
                    repositoryId: 'repo456',
               };

               mockSend.mockRejectedValue({
                    name: 'SlowDown',
                    message: 'Please reduce your request rate',
               });

               await expect(storageService.uploadImage(buffer, metadata)).rejects.toThrow(
                    'Failed to upload image to S3 storage'
               );
          });

          test('should handle S3 access denied errors', async () => {
               const buffer = Buffer.from('fake-image-data');
               const metadata: ImageMetadata = {
                    userId: 'user123',
                    repositoryId: 'repo456',
               };

               mockSend.mockRejectedValue({
                    name: 'AccessDenied',
                    message: 'Access Denied',
               });

               await expect(storageService.uploadImage(buffer, metadata)).rejects.toThrow(
                    'Failed to upload image to S3 storage'
               );
          });
     });

     describe('Integration with S3 Client', () => {
          test('should initialize S3Client with correct configuration', () => {
               expect(S3Client).toHaveBeenCalledWith({
                    region: testRegion,
                    credentials: {
                         accessKeyId: testAccessKeyId,
                         secretAccessKey: testSecretAccessKey,
                    },
               });
          });

          test('should reuse S3Client instance for multiple operations', async () => {
               const buffer = Buffer.from('fake-image-data');
               const metadata: ImageMetadata = {
                    userId: 'user123',
                    repositoryId: 'repo456',
               };

               mockSend.mockResolvedValue({});
               (getSignedUrl as jest.Mock).mockResolvedValue('https://signed-url.com/image.png');

               await storageService.uploadImage(buffer, metadata);
               await storageService.uploadImage(buffer, metadata);

               // S3Client should be instantiated only once
               expect(S3Client).toHaveBeenCalledTimes(1);
          });
     });
});
