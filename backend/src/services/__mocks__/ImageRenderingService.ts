// Mock for ImageRenderingService to avoid ESM module issues in tests
export class ImageRenderingService {
     async initialize(): Promise<void> {
          return Promise.resolve();
     }

     async renderCodeToImage(): Promise<Buffer> {
          return Buffer.from('mock-image-data');
     }

     async cleanup(): Promise<void> {
          return Promise.resolve();
     }
}
