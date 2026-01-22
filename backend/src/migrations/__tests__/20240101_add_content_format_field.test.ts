/**
 * Tests for contentFormat migration
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Content } from '../../models/Content';
import { migrate, rollback, verify } from '../20240101_add_content_format_field';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
     // Create in-memory MongoDB instance
     mongoServer = await MongoMemoryServer.create();
     const mongoUri = mongoServer.getUri();

     await mongoose.connect(mongoUri);
});

afterAll(async () => {
     await mongoose.disconnect();
     await mongoServer.stop();
});

beforeEach(async () => {
     // Clear the Content collection before each test
     await Content.deleteMany({});
});

describe('Content Format Migration', () => {
     describe('migrate', () => {
          it('should add contentFormat field to documents without it', async () => {
               // Create test documents without contentFormat field
               const testDocs = [
                    {
                         analysisId: new mongoose.Types.ObjectId(),
                         userId: new mongoose.Types.ObjectId(),
                         platform: 'x',
                         generatedText: 'Test content 1',
                         editedText: '',
                         version: 1,
                    },
                    {
                         analysisId: new mongoose.Types.ObjectId(),
                         userId: new mongoose.Types.ObjectId(),
                         platform: 'x',
                         generatedText: 'Test content 2',
                         editedText: '',
                         version: 1,
                    },
               ];

               // Insert documents directly to bypass schema defaults
               await Content.collection.insertMany(testDocs);

               // Verify documents don't have contentFormat
               const beforeCount = await Content.countDocuments({
                    contentFormat: { $exists: false }
               });
               expect(beforeCount).toBe(2);

               // Run migration
               const stats = await migrate();

               // Verify migration results
               expect(stats.totalDocuments).toBe(2);
               expect(stats.documentsUpdated).toBe(2);
               expect(stats.errors).toBe(0);

               // Verify all documents now have contentFormat='single'
               const afterCount = await Content.countDocuments({
                    contentFormat: 'single'
               });
               expect(afterCount).toBe(2);

               // Verify no documents without contentFormat
               const missingCount = await Content.countDocuments({
                    contentFormat: { $exists: false }
               });
               expect(missingCount).toBe(0);
          });

          it('should skip documents that already have contentFormat', async () => {
               // Create documents with contentFormat already set
               await Content.create([
                    {
                         analysisId: new mongoose.Types.ObjectId(),
                         userId: new mongoose.Types.ObjectId(),
                         platform: 'x',
                         contentFormat: 'single',
                         generatedText: 'Test content 1',
                         editedText: '',
                         version: 1,
                    },
                    {
                         analysisId: new mongoose.Types.ObjectId(),
                         userId: new mongoose.Types.ObjectId(),
                         platform: 'x',
                         contentFormat: 'mini_thread',
                         generatedText: 'Test content 2',
                         editedText: '',
                         version: 1,
                         tweets: [
                              { text: 'Tweet 1', position: 1, characterCount: 7 },
                              { text: 'Tweet 2', position: 2, characterCount: 7 },
                              { text: 'Tweet 3', position: 3, characterCount: 7 },
                         ],
                    },
               ]);

               // Run migration
               const stats = await migrate();

               // Should find no documents to migrate
               expect(stats.totalDocuments).toBe(0);
               expect(stats.documentsUpdated).toBe(0);
          });

          it('should remove tweets field from single posts during migration', async () => {
               // Create a document with tweets field (shouldn't happen, but test edge case)
               const doc = {
                    analysisId: new mongoose.Types.ObjectId(),
                    userId: new mongoose.Types.ObjectId(),
                    platform: 'x',
                    generatedText: 'Test content',
                    editedText: '',
                    version: 1,
                    tweets: [
                         { text: 'Tweet 1', position: 1, characterCount: 7 },
                    ],
               };

               await Content.collection.insertOne(doc);

               // Run migration
               await migrate();

               // Verify tweets field is removed
               const updated = await Content.findOne({ _id: doc._id });
               expect(updated?.contentFormat).toBe('single');
               expect(updated?.tweets).toBeUndefined();
          });

          it('should handle large number of documents', async () => {
               // Create 150 test documents
               const testDocs = Array.from({ length: 150 }, (_, i) => ({
                    analysisId: new mongoose.Types.ObjectId(),
                    userId: new mongoose.Types.ObjectId(),
                    platform: 'x',
                    generatedText: `Test content ${i}`,
                    editedText: '',
                    version: 1,
               }));

               await Content.collection.insertMany(testDocs);

               // Run migration
               const stats = await migrate();

               // Verify all documents were updated
               expect(stats.totalDocuments).toBe(150);
               expect(stats.documentsUpdated).toBe(150);
               expect(stats.errors).toBe(0);

               // Verify all have contentFormat
               const count = await Content.countDocuments({ contentFormat: 'single' });
               expect(count).toBe(150);
          });
     });

     describe('rollback', () => {
          it('should remove contentFormat field from all documents', async () => {
               // Create documents with contentFormat
               await Content.create([
                    {
                         analysisId: new mongoose.Types.ObjectId(),
                         userId: new mongoose.Types.ObjectId(),
                         platform: 'x',
                         contentFormat: 'single',
                         generatedText: 'Test content 1',
                         editedText: '',
                         version: 1,
                    },
                    {
                         analysisId: new mongoose.Types.ObjectId(),
                         userId: new mongoose.Types.ObjectId(),
                         platform: 'x',
                         contentFormat: 'mini_thread',
                         generatedText: 'Test content 2',
                         editedText: '',
                         version: 1,
                         tweets: [
                              { text: 'Tweet 1', position: 1, characterCount: 7 },
                              { text: 'Tweet 2', position: 2, characterCount: 7 },
                              { text: 'Tweet 3', position: 3, characterCount: 7 },
                         ],
                    },
               ]);

               // Verify documents have contentFormat
               const beforeCount = await Content.countDocuments({
                    contentFormat: { $exists: true }
               });
               expect(beforeCount).toBe(2);

               // Run rollback
               await rollback();

               // Verify contentFormat field is removed
               const afterCount = await Content.countDocuments({
                    contentFormat: { $exists: true }
               });
               expect(afterCount).toBe(0);
          });
     });

     describe('verify', () => {
          it('should correctly count documents with and without contentFormat', async () => {
               // Create mix of documents
               await Content.create([
                    {
                         analysisId: new mongoose.Types.ObjectId(),
                         userId: new mongoose.Types.ObjectId(),
                         platform: 'x',
                         contentFormat: 'single',
                         generatedText: 'Test content 1',
                         editedText: '',
                         version: 1,
                    },
                    {
                         analysisId: new mongoose.Types.ObjectId(),
                         userId: new mongoose.Types.ObjectId(),
                         platform: 'x',
                         contentFormat: 'mini_thread',
                         generatedText: 'Test content 2',
                         editedText: '',
                         version: 1,
                         tweets: [
                              { text: 'Tweet 1', position: 1, characterCount: 7 },
                              { text: 'Tweet 2', position: 2, characterCount: 7 },
                              { text: 'Tweet 3', position: 3, characterCount: 7 },
                         ],
                    },
               ]);

               // Insert one without contentFormat
               await Content.collection.insertOne({
                    analysisId: new mongoose.Types.ObjectId(),
                    userId: new mongoose.Types.ObjectId(),
                    platform: 'x',
                    generatedText: 'Test content 3',
                    editedText: '',
                    version: 1,
               });

               // Verify counts
               const withFormat = await Content.countDocuments({
                    contentFormat: { $exists: true }
               });
               const withoutFormat = await Content.countDocuments({
                    contentFormat: { $exists: false }
               });

               expect(withFormat).toBe(2);
               expect(withoutFormat).toBe(1);

               // Run verify (should not throw)
               await expect(verify()).resolves.not.toThrow();
          });
     });

     describe('idempotency', () => {
          it('should be safe to run migration multiple times', async () => {
               // Create test documents
               const testDocs = [
                    {
                         analysisId: new mongoose.Types.ObjectId(),
                         userId: new mongoose.Types.ObjectId(),
                         platform: 'x',
                         generatedText: 'Test content 1',
                         editedText: '',
                         version: 1,
                    },
                    {
                         analysisId: new mongoose.Types.ObjectId(),
                         userId: new mongoose.Types.ObjectId(),
                         platform: 'x',
                         generatedText: 'Test content 2',
                         editedText: '',
                         version: 1,
                    },
               ];

               await Content.collection.insertMany(testDocs);

               // Run migration first time
               const stats1 = await migrate();
               expect(stats1.documentsUpdated).toBe(2);

               // Run migration second time
               const stats2 = await migrate();
               expect(stats2.documentsUpdated).toBe(0); // No documents to update

               // Verify all documents still have contentFormat
               const count = await Content.countDocuments({ contentFormat: 'single' });
               expect(count).toBe(2);
          });
     });
});
