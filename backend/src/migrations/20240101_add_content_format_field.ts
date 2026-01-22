/**
 * Migration: Add contentFormat field to existing Content documents
 * 
 * This migration adds the contentFormat field with value 'single' to all existing
 * Content documents that don't have this field. This ensures backward compatibility
 * with the multi-format X content engine feature.
 * 
 * Run: ts-node src/migrations/20240101_add_content_format_field.ts
 */

import mongoose from 'mongoose';
import { Content } from '../models/Content';
import { connectDatabase } from '../config/database';

interface MigrationStats {
     totalDocuments: number;
     documentsUpdated: number;
     documentsSkipped: number;
     errors: number;
}

/**
 * Execute the migration
 */
async function migrate(): Promise<MigrationStats> {
     const stats: MigrationStats = {
          totalDocuments: 0,
          documentsUpdated: 0,
          documentsSkipped: 0,
          errors: 0,
     };

     try {
          console.log('Starting migration: Add contentFormat field to Content documents');
          console.log('Connecting to database...');

          await connectDatabase();
          console.log('Database connected successfully');

          // Find all Content documents that don't have contentFormat field
          const contents = await Content.find({
               contentFormat: { $exists: false }
          });

          stats.totalDocuments = contents.length;
          console.log(`Found ${stats.totalDocuments} documents without contentFormat field`);

          if (stats.totalDocuments === 0) {
               console.log('No documents to migrate. All documents already have contentFormat field.');
               return stats;
          }

          // Update each document
          for (const content of contents) {
               try {
                    // Set contentFormat to 'single' for existing records
                    content.contentFormat = 'single';

                    // Ensure tweets field is undefined for single posts (backward compatibility)
                    if (content.tweets) {
                         content.tweets = undefined;
                    }

                    await content.save();
                    stats.documentsUpdated++;

                    if (stats.documentsUpdated % 100 === 0) {
                         console.log(`Progress: ${stats.documentsUpdated}/${stats.totalDocuments} documents updated`);
                    }
               } catch (error) {
                    stats.errors++;
                    console.error(`Error updating document ${content._id}:`, error);
               }
          }

          console.log('\nMigration completed successfully!');
          console.log('Statistics:');
          console.log(`  Total documents found: ${stats.totalDocuments}`);
          console.log(`  Documents updated: ${stats.documentsUpdated}`);
          console.log(`  Documents skipped: ${stats.documentsSkipped}`);
          console.log(`  Errors: ${stats.errors}`);

          return stats;
     } catch (error) {
          console.error('Migration failed:', error);
          throw error;
     }
}

/**
 * Rollback the migration
 * Removes the contentFormat field from all documents
 */
async function rollback(): Promise<void> {
     try {
          console.log('Starting rollback: Remove contentFormat field from Content documents');
          console.log('Connecting to database...');

          await connectDatabase();
          console.log('Database connected successfully');

          // Remove contentFormat field from all documents
          const result = await Content.updateMany(
               {},
               { $unset: { contentFormat: '' } }
          );

          console.log(`Rollback completed. Modified ${result.modifiedCount} documents.`);
     } catch (error) {
          console.error('Rollback failed:', error);
          throw error;
     }
}

/**
 * Verify migration results
 */
async function verify(): Promise<void> {
     try {
          console.log('Verifying migration...');

          await connectDatabase();

          // Count documents with contentFormat
          const withFormat = await Content.countDocuments({
               contentFormat: { $exists: true }
          });

          // Count documents without contentFormat
          const withoutFormat = await Content.countDocuments({
               contentFormat: { $exists: false }
          });

          // Count by format type
          const singleCount = await Content.countDocuments({ contentFormat: 'single' });
          const miniThreadCount = await Content.countDocuments({ contentFormat: 'mini_thread' });
          const fullThreadCount = await Content.countDocuments({ contentFormat: 'full_thread' });

          console.log('\nVerification Results:');
          console.log(`  Documents with contentFormat: ${withFormat}`);
          console.log(`  Documents without contentFormat: ${withoutFormat}`);
          console.log(`  Single posts: ${singleCount}`);
          console.log(`  Mini threads: ${miniThreadCount}`);
          console.log(`  Full threads: ${fullThreadCount}`);

          if (withoutFormat > 0) {
               console.warn(`\n⚠️  Warning: ${withoutFormat} documents still missing contentFormat field`);
          } else {
               console.log('\n✓ All documents have contentFormat field');
          }
     } catch (error) {
          console.error('Verification failed:', error);
          throw error;
     }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
     const command = process.argv[2] || 'migrate';

     try {
          switch (command) {
               case 'migrate':
                    await migrate();
                    await verify();
                    break;

               case 'rollback':
                    await rollback();
                    await verify();
                    break;

               case 'verify':
                    await verify();
                    break;

               default:
                    console.error(`Unknown command: ${command}`);
                    console.log('Usage: ts-node src/migrations/20240101_add_content_format_field.ts [migrate|rollback|verify]');
                    process.exit(1);
          }

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

export { migrate, rollback, verify };
