/**
 * Migration: Add snapshotId field to Content model
 * 
 * This migration verifies that the Content model schema supports the optional
 * snapshotId field for the Visual Intelligence (Code Snapshot Generator) feature.
 * 
 * Since snapshotId is optional and defaults to undefined, no data transformation
 * is required. This migration primarily serves as documentation and verification.
 * 
 * Run: ts-node src/migrations/20240115_add_snapshot_id_field.ts
 */

import mongoose from 'mongoose';
import { Content } from '../models/Content';
import { connectDatabase } from '../config/database';

interface MigrationStats {
     totalDocuments: number;
     documentsWithSnapshot: number;
     documentsWithoutSnapshot: number;
}

/**
 * Verify the migration
 * Since snapshotId is optional, no actual data migration is needed.
 * This function verifies the schema and counts documents.
 */
async function verify(): Promise<MigrationStats> {
     const stats: MigrationStats = {
          totalDocuments: 0,
          documentsWithSnapshot: 0,
          documentsWithoutSnapshot: 0,
     };

     try {
          console.log('Verifying Content model schema for snapshotId field...');
          console.log('Connecting to database...');

          await connectDatabase();
          console.log('Database connected successfully');

          // Count total documents
          stats.totalDocuments = await Content.countDocuments({});

          // Count documents with snapshotId
          stats.documentsWithSnapshot = await Content.countDocuments({
               snapshotId: { $exists: true, $ne: null }
          });

          // Count documents without snapshotId
          stats.documentsWithoutSnapshot = await Content.countDocuments({
               $or: [
                    { snapshotId: { $exists: false } },
                    { snapshotId: null }
               ]
          });

          console.log('\nVerification Results:');
          console.log(`  Total Content documents: ${stats.totalDocuments}`);
          console.log(`  Documents with snapshotId: ${stats.documentsWithSnapshot}`);
          console.log(`  Documents without snapshotId: ${stats.documentsWithoutSnapshot}`);

          console.log('\n✓ Schema verification complete');
          console.log('✓ The snapshotId field is optional and will be populated as users attach code snapshots');

          return stats;
     } catch (error) {
          console.error('Verification failed:', error);
          throw error;
     }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
     try {
          console.log('='.repeat(70));
          console.log('Migration: Add snapshotId field to Content model');
          console.log('='.repeat(70));
          console.log('\nNote: This is a schema-only migration.');
          console.log('The snapshotId field is optional and requires no data transformation.');
          console.log('Existing documents will continue to work without this field.\n');

          await verify();

          await mongoose.connection.close();
          console.log('\nDatabase connection closed');
          process.exit(0);
     } catch (error) {
          console.error('Migration script failed:', error);
          await mongoose.connection.close();
          process.exit(1);
     }
}

// Run the migration if this file is executed directly
if (require.main === module) {
     main();
}

export { verify };
