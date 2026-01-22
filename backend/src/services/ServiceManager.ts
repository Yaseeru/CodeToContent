import { VisualSnapshotService } from './VisualSnapshotService';
import { CacheService } from './CacheService';
import { IStorageService, LocalStorageService, CloudStorageService } from './StorageService';
import { LoggerService, LogLevel } from './LoggerService';
import { SNAPSHOT_CONFIG } from '../config/constants';

/**
 * Singleton service manager for managing long-lived services
 * that require initialization and cleanup (e.g., VisualSnapshotService with Puppeteer)
 */
export class ServiceManager {
     private static instance: ServiceManager | null = null;
     private visualSnapshotService: VisualSnapshotService | null = null;
     private storageService: IStorageService | null = null;
     private logger: LoggerService;
     private isInitialized = false;

     private constructor() {
          this.logger = LoggerService.getInstance();
     }

     /**
      * Get the singleton instance
      */
     static getInstance(): ServiceManager {
          if (!ServiceManager.instance) {
               ServiceManager.instance = new ServiceManager();
          }
          return ServiceManager.instance;
     }

     /**
      * Initialize all managed services
      */
     async initialize(): Promise<void> {
          if (this.isInitialized) {
               this.logger.log(LogLevel.WARN, 'ServiceManager already initialized');
               return;
          }

          try {
               this.logger.log(LogLevel.INFO, 'Initializing ServiceManager');

               // Initialize VisualSnapshotService
               const geminiApiKey = process.env.GEMINI_API_KEY;
               if (!geminiApiKey) {
                    throw new Error('GEMINI_API_KEY not found in environment variables');
               }

               const cacheService = new CacheService();
               const storageService = this.createStorageService();
               this.storageService = storageService;

               this.visualSnapshotService = new VisualSnapshotService(
                    geminiApiKey,
                    cacheService,
                    storageService
               );

               await this.visualSnapshotService.initialize();

               this.isInitialized = true;
               this.logger.log(LogLevel.INFO, 'ServiceManager initialized successfully');
          } catch (error) {
               this.logger.log(LogLevel.ERROR, 'Failed to initialize ServiceManager', {
                    error: error instanceof Error ? error.message : String(error)
               });
               throw new Error('Failed to initialize ServiceManager');
          }
     }

     /**
      * Create storage service based on environment configuration
      * Supports 'local' and 's3' storage types
      */
     private createStorageService(): IStorageService {
          const storageType = process.env.SNAPSHOT_STORAGE_TYPE || SNAPSHOT_CONFIG.DEFAULT_STORAGE_TYPE;

          this.logger.log(LogLevel.INFO, `Creating storage service: ${storageType}`);

          if (storageType === 's3') {
               // S3 Cloud Storage
               const bucket = process.env.AWS_S3_BUCKET;
               const region = process.env.AWS_S3_REGION;
               const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
               const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

               if (!bucket || !region || !accessKeyId || !secretAccessKey) {
                    throw new Error(
                         'S3 storage requires AWS_S3_BUCKET, AWS_S3_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY environment variables'
                    );
               }

               const signedUrlExpiration = process.env.AWS_S3_SIGNED_URL_EXPIRATION
                    ? parseInt(process.env.AWS_S3_SIGNED_URL_EXPIRATION, 10)
                    : SNAPSHOT_CONFIG.S3_SIGNED_URL_EXPIRATION_SECONDS;

               return new CloudStorageService(bucket, region, accessKeyId, secretAccessKey, signedUrlExpiration);
          } else if (storageType === 'local') {
               // Local File System Storage
               const storagePath = process.env.SNAPSHOT_STORAGE_PATH || SNAPSHOT_CONFIG.DEFAULT_STORAGE_PATH;
               const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`;

               return new LocalStorageService(storagePath, baseUrl);
          } else {
               throw new Error(
                    `Unsupported storage type: ${storageType}. Supported types: 'local', 's3'`
               );
          }
     }

     /**
      * Cleanup all managed services
      */
     async cleanup(): Promise<void> {
          if (!this.isInitialized) {
               return;
          }

          try {
               this.logger.log(LogLevel.INFO, 'Cleaning up ServiceManager');

               if (this.visualSnapshotService) {
                    await this.visualSnapshotService.cleanup();
                    this.visualSnapshotService = null;
               }

               this.storageService = null;

               this.isInitialized = false;
               this.logger.log(LogLevel.INFO, 'ServiceManager cleanup complete');
          } catch (error) {
               this.logger.log(LogLevel.ERROR, 'Error during ServiceManager cleanup', {
                    error: error instanceof Error ? error.message : String(error)
               });
          }
     }

     /**
      * Get the VisualSnapshotService instance
      * @throws Error if service is not initialized
      */
     getVisualSnapshotService(): VisualSnapshotService {
          if (!this.visualSnapshotService || !this.isInitialized) {
               throw new Error('VisualSnapshotService not initialized. Call ServiceManager.initialize() first.');
          }
          return this.visualSnapshotService;
     }

     /**
      * Get the StorageService instance
      * @throws Error if service is not initialized
      */
     getStorageService(): IStorageService {
          if (!this.storageService || !this.isInitialized) {
               throw new Error('StorageService not initialized. Call ServiceManager.initialize() first.');
          }
          return this.storageService;
     }

     /**
      * Check if services are initialized
      */
     isReady(): boolean {
          return this.isInitialized;
     }
}
