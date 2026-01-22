// Mock for VisualSnapshotService to avoid ESM module issues in tests
export class VisualSnapshotService {
     async initialize(): Promise<void> {
          return Promise.resolve();
     }

     async generateSnapshotsForRepository(): Promise<any[]> {
          return Promise.resolve([]);
     }

     async getSnapshotsForRepository(): Promise<any[]> {
          return Promise.resolve([]);
     }

     async cleanup(): Promise<void> {
          return Promise.resolve();
     }
}
