import { User, IUser, StyleProfile, ProfileVersion } from '../models/User';

export class ProfileVersioningService {
     private static readonly MAX_VERSIONS = 10;

     /**
      * Store a version snapshot before updating the profile
      * @param userId - The user ID
      * @param source - The source of the update ('manual', 'feedback', 'archetype', 'rollback')
      * @returns Promise<void>
      */
     static async createVersionSnapshot(
          userId: string,
          source: 'manual' | 'feedback' | 'archetype' | 'rollback'
     ): Promise<void> {
          const user = await User.findById(userId);
          if (!user || !user.styleProfile) {
               return; // No profile to snapshot
          }

          const version: ProfileVersion = {
               profile: JSON.parse(JSON.stringify(user.styleProfile)), // Deep copy
               timestamp: new Date(),
               source,
               learningIterations: user.styleProfile.learningIterations,
          };

          // Add the new version
          user.profileVersions.push(version);

          // Prune old versions (keep last 10)
          if (user.profileVersions.length > this.MAX_VERSIONS) {
               user.profileVersions = user.profileVersions.slice(-this.MAX_VERSIONS);
          }

          await user.save();
     }

     /**
      * Rollback to a previous version
      * @param userId - The user ID
      * @param versionIndex - The index of the version to rollback to (0 = oldest, -1 = most recent)
      * @returns Promise<StyleProfile | null> - The restored profile or null if not found
      */
     static async rollbackToVersion(
          userId: string,
          versionIndex: number
     ): Promise<StyleProfile | null> {
          const user = await User.findById(userId);
          if (!user || user.profileVersions.length === 0) {
               return null;
          }

          // Handle negative indices (e.g., -1 for last version)
          const actualIndex = versionIndex < 0
               ? user.profileVersions.length + versionIndex
               : versionIndex;

          if (actualIndex < 0 || actualIndex >= user.profileVersions.length) {
               throw new Error('Invalid version index');
          }

          const targetVersion = user.profileVersions[actualIndex];

          // Create a snapshot of the current profile before rollback
          if (user.styleProfile) {
               await this.createVersionSnapshot(userId, 'rollback');
          }

          // Restore the profile from the version
          user.styleProfile = JSON.parse(JSON.stringify(targetVersion.profile)); // Deep copy
          if (user.styleProfile) {
               user.styleProfile.lastUpdated = new Date();
          }

          await user.save();

          return user.styleProfile || null;
     }

     /**
      * Get all profile versions for a user
      * @param userId - The user ID
      * @returns Promise<ProfileVersion[]> - Array of profile versions
      */
     static async getVersionHistory(userId: string): Promise<ProfileVersion[]> {
          const user = await User.findById(userId);
          if (!user) {
               return [];
          }

          return user.profileVersions;
     }

     /**
      * Get a specific version without rolling back
      * @param userId - The user ID
      * @param versionIndex - The index of the version to retrieve
      * @returns Promise<ProfileVersion | null> - The version or null if not found
      */
     static async getVersion(
          userId: string,
          versionIndex: number
     ): Promise<ProfileVersion | null> {
          const user = await User.findById(userId);
          if (!user || user.profileVersions.length === 0) {
               return null;
          }

          // Handle negative indices
          const actualIndex = versionIndex < 0
               ? user.profileVersions.length + versionIndex
               : versionIndex;

          if (actualIndex < 0 || actualIndex >= user.profileVersions.length) {
               return null;
          }

          return user.profileVersions[actualIndex];
     }

     /**
      * Prune old versions (keep last N versions)
      * @param userId - The user ID
      * @param maxVersions - Maximum number of versions to keep (default: 10)
      * @returns Promise<number> - Number of versions pruned
      */
     static async pruneVersions(
          userId: string,
          maxVersions: number = this.MAX_VERSIONS
     ): Promise<number> {
          const user = await User.findById(userId);
          if (!user || user.profileVersions.length <= maxVersions) {
               return 0;
          }

          const originalCount = user.profileVersions.length;
          user.profileVersions = user.profileVersions.slice(-maxVersions);
          await user.save();

          return originalCount - user.profileVersions.length;
     }

     /**
      * Delete all versions for a user
      * @param userId - The user ID
      * @returns Promise<number> - Number of versions deleted
      */
     static async clearVersionHistory(userId: string): Promise<number> {
          const user = await User.findById(userId);
          if (!user) {
               return 0;
          }

          const count = user.profileVersions.length;
          user.profileVersions = [];
          await user.save();

          return count;
     }
}
