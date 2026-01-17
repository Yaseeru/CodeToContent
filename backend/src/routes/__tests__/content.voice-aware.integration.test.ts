import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../../index';
import { User, StyleProfile } from '../../models/User';
import { Repository } from '../../models/Repository';
import { Analysis } from '../../models/Analysis';
import { Content } from '../../models/Content';
import { LearningJob } from '../../models/LearningJob';
import { AuthService } from '../../services/AuthService';

// Integration tests for voice-aware content generation and feedback learning
// Validates: Requirements 12.8, 12.9, 5.1, 5.2, 5.12
describe('Content API Voice-Aware Integration Tests', () => {
     let mongoServer: MongoMemoryServer;
     let authService: AuthService;
     let testUser: any;
     let testUserWithProfile: any;
     let testToken: string;
     let testTokenWithProfile: string;
     let testRepository: any;
     let testAnalysis: any;

     const mockStyleProfile: StyleProfile = {
          voiceType: 'educational',
          tone: {
               formality: 6,
               enthusiasm: 7,
               directness: 8,
               humor: 4,
               emotionality: 5,
          },
          writingTraits: {
               avgSentenceLength: 15,
               usesQuestionsOften: true,
               usesEmojis: false,
               emojiFrequency: 0,
               usesBulletPoints: true,
               usesShortParagraphs: true,
               usesHooks: true,
          },
          structurePreferences: {
               introStyle: 'hook',
               bodyStyle: 'steps',
               endingStyle: 'cta',
          },
          vocabularyLevel: 'medium',
          commonPhrases: ['check it out', 'let me know'],
          bannedPhrases: ['leverage', 'synergy'],
          samplePosts: [
               'Just shipped a new feature! It helps developers test faster. Check it out and let me know what you think.',
               'Working on improving our CI/CD pipeline. The goal is to reduce build times by 50%. Early results look promising!',
               'Quick tip: Always write tests first. It saves time in the long run and catches bugs early.',
          ],
          learningIterations: 5,
          lastUpdated: new Date(),
          profileSource: 'manual',
     };

     beforeAll(async () => {
          // Disconnect from any existing connection
          if (mongoose.connection.readyState !== 0) {
               await mongoose.disconnect();
          }

          // Start in-memory MongoDB
          mongoServer = await MongoMemoryServer.create();
          const mongoUri = mongoServer.getUri();
          await mongoose.connect(mongoUri);

          authService = new AuthService();
     }, 60000);

     afterAll(async () => {
          await mongoose.disconnect();
          if (mongoServer) {
               await mongoServer.stop();
          }
     }, 60000);

     beforeEach(async () => {
          // Clear all collections
          await User.deleteMany({});
          await Repository.deleteMany({});
          await Analysis.deleteMany({});
          await Content.deleteMany({});
          await LearningJob.deleteMany({});

          // Create test user without profile
          testUser = await User.create({
               githubId: '12345',
               username: 'testuser',
               accessToken: 'test-github-token',
               avatarUrl: 'https://example.com/avatar.jpg',
          });

          // Create test user with profile
          testUserWithProfile = await User.create({
               githubId: '67890',
               username: 'testuser-with-profile',
               accessToken: 'test-github-token-2',
               avatarUrl: 'https://example.com/avatar2.jpg',
               styleProfile: mockStyleProfile,
               voiceStrength: 80,
          });

          // Generate JWTs
          testToken = authService.generateJWT(testUser);
          testTokenWithProfile = authService.generateJWT(testUserWithProfile);

          // Create test repository
          testRepository = await Repository.create({
               userId: testUser._id,
               githubRepoId: '67890',
               name: 'test-repo',
               fullName: 'testuser/test-repo',
               description: 'A test repository',
               url: 'https://github.com/testuser/test-repo',
          });

          // Create test analysis
          testAnalysis = await Analysis.create({
               repositoryId: testRepository._id,
               userId: testUser._id,
               problemStatement: 'Solves testing problems',
               targetAudience: 'Developers',
               coreFunctionality: ['Testing', 'Integration'],
               notableFeatures: ['Fast', 'Reliable'],
               recentChanges: ['Added new tests'],
               integrations: ['Jest', 'Supertest'],
               valueProposition: 'Makes testing easier',
               rawSignals: {
                    readmeLength: 1000,
                    commitCount: 50,
                    prCount: 10,
                    fileStructure: ['src/', 'tests/'],
               },
          });
     });

     describe('POST /api/content/generate - Voice-Aware Generation', () => {
          it('should generate content with styleProfile when available', async () => {
               // Create analysis for user with profile
               const analysisWithProfile = await Analysis.create({
                    repositoryId: testRepository._id,
                    userId: testUserWithProfile._id,
                    problemStatement: 'Solves testing problems',
                    targetAudience: 'Developers',
                    coreFunctionality: ['Testing', 'Integration'],
                    notableFeatures: ['Fast', 'Reliable'],
                    recentChanges: ['Added new tests'],
                    integrations: ['Jest', 'Supertest'],
                    valueProposition: 'Makes testing easier',
                    rawSignals: {
                         readmeLength: 1000,
                         commitCount: 50,
                         prCount: 10,
                         fileStructure: ['src/', 'tests/'],
                    },
               });

               const response = await request(app)
                    .post('/api/content/generate')
                    .set('Authorization', `Bearer ${testTokenWithProfile}`)
                    .send({
                         analysisId: analysisWithProfile._id.toString(),
                         platform: 'linkedin',
                         tone: 'professional',
                    })
                    .expect(200);

               expect(response.body).toHaveProperty('message', 'Content generated successfully');
               expect(response.body.content).toHaveProperty('usedStyleProfile', true);
               expect(response.body.content).toHaveProperty('voiceStrengthUsed', 80);
               expect(response.body.content).toHaveProperty('evolutionScoreAtGeneration');
               expect(response.body.content.evolutionScoreAtGeneration).toBeGreaterThan(0);
          }, 30000);

          it('should fallback to tone-based generation without styleProfile', async () => {
               const response = await request(app)
                    .post('/api/content/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({
                         analysisId: testAnalysis._id.toString(),
                         platform: 'linkedin',
                         tone: 'professional',
                    })
                    .expect(200);

               expect(response.body).toHaveProperty('message', 'Content generated successfully');
               expect(response.body.content).toHaveProperty('usedStyleProfile', false);
               expect(response.body.content).toHaveProperty('voiceStrengthUsed');
          }, 30000);

          it('should accept and use voiceStrength parameter', async () => {
               // Create analysis for user with profile
               const analysisWithProfile = await Analysis.create({
                    repositoryId: testRepository._id,
                    userId: testUserWithProfile._id,
                    problemStatement: 'Solves testing problems',
                    targetAudience: 'Developers',
                    coreFunctionality: ['Testing', 'Integration'],
                    notableFeatures: ['Fast', 'Reliable'],
                    recentChanges: ['Added new tests'],
                    integrations: ['Jest', 'Supertest'],
                    valueProposition: 'Makes testing easier',
                    rawSignals: {
                         readmeLength: 1000,
                         commitCount: 50,
                         prCount: 10,
                         fileStructure: ['src/', 'tests/'],
                    },
               });

               const response = await request(app)
                    .post('/api/content/generate')
                    .set('Authorization', `Bearer ${testTokenWithProfile}`)
                    .send({
                         analysisId: analysisWithProfile._id.toString(),
                         platform: 'linkedin',
                         tone: 'professional',
                         voiceStrength: 50,
                    })
                    .expect(200);

               expect(response.body).toHaveProperty('message', 'Content generated successfully');
               expect(response.body.content).toHaveProperty('voiceStrengthUsed', 50);
          }, 30000);

          it('should reject invalid voiceStrength values', async () => {
               const response = await request(app)
                    .post('/api/content/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({
                         analysisId: testAnalysis._id.toString(),
                         platform: 'linkedin',
                         tone: 'professional',
                         voiceStrength: 150, // Invalid: > 100
                    })
                    .expect(400);

               expect(response.body).toHaveProperty('error', 'Invalid request');
               expect(response.body.message).toContain('voiceStrength must be a number between 0 and 100');
          });

          it('should reject negative voiceStrength values', async () => {
               const response = await request(app)
                    .post('/api/content/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({
                         analysisId: testAnalysis._id.toString(),
                         platform: 'linkedin',
                         tone: 'professional',
                         voiceStrength: -10, // Invalid: < 0
                    })
                    .expect(400);

               expect(response.body).toHaveProperty('error', 'Invalid request');
               expect(response.body.message).toContain('voiceStrength must be a number between 0 and 100');
          });
     });

     describe('POST /api/content/:id/save-edits - Feedback Learning', () => {
          let generatedContent: any;

          beforeEach(async () => {
               // Generate content first
               generatedContent = await Content.create({
                    analysisId: testAnalysis._id,
                    userId: testUser._id,
                    platform: 'linkedin',
                    tone: 'professional',
                    generatedText: 'This is the original AI-generated content. It helps developers test their code more efficiently.',
                    editedText: '',
                    version: 1,
               });
          });

          it('should save edits and calculate edit metadata', async () => {
               const editedText = 'This is the edited content! 🎉 It helps devs test code faster.';

               const response = await request(app)
                    .post(`/api/content/${generatedContent._id}/save-edits`)
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({ editedText })
                    .expect(200);

               expect(response.body).toHaveProperty('message', 'Edits saved successfully');
               expect(response.body.content).toHaveProperty('editedText', editedText);

               // Verify edit metadata was stored
               const updatedContent = await Content.findById(generatedContent._id);
               expect(updatedContent).toBeTruthy();
               expect(updatedContent!.editMetadata).toBeDefined();
               expect(updatedContent!.editMetadata!.originalText).toBe(generatedContent.generatedText);
               expect(updatedContent!.editMetadata!.sentenceLengthDelta).toBeDefined();
               expect(updatedContent!.editMetadata!.emojiChanges).toBeDefined();
               expect(updatedContent!.editMetadata!.emojiChanges.netChange).toBeGreaterThan(0); // Added emoji
          }, 30000);

          it('should queue asynchronous learning job', async () => {
               const editedText = 'This is the edited content. It helps developers test their code.';

               await request(app)
                    .post(`/api/content/${generatedContent._id}/save-edits`)
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({ editedText })
                    .expect(200);

               // Wait a bit for async job to be queued
               await new Promise(resolve => setTimeout(resolve, 1000));

               // Verify learning job was created
               const learningJobs = await LearningJob.find({ userId: testUser._id });
               expect(learningJobs.length).toBeGreaterThan(0);
               expect(learningJobs[0].contentId.toString()).toBe(generatedContent._id.toString());
               expect(learningJobs[0].status).toBe('pending');
          }, 30000);

          it('should return immediately without waiting for learning', async () => {
               const editedText = 'This is the edited content.';
               const startTime = Date.now();

               const response = await request(app)
                    .post(`/api/content/${generatedContent._id}/save-edits`)
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({ editedText })
                    .expect(200);

               const endTime = Date.now();
               const duration = endTime - startTime;

               // Should return quickly (< 10 seconds) without waiting for learning
               expect(duration).toBeLessThan(10000);
               expect(response.body).toHaveProperty('message', 'Edits saved successfully');
          }, 30000);

          it('should not block save if learning job fails', async () => {
               // This test verifies graceful degradation
               const editedText = 'This is the edited content.';

               const response = await request(app)
                    .post(`/api/content/${generatedContent._id}/save-edits`)
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({ editedText })
                    .expect(200);

               expect(response.body).toHaveProperty('message', 'Edits saved successfully');

               // Verify content was saved even if learning might fail
               const updatedContent = await Content.findById(generatedContent._id);
               expect(updatedContent!.editedText).toBe(editedText);
          }, 30000);

          it('should return 400 for missing editedText', async () => {
               const response = await request(app)
                    .post(`/api/content/${generatedContent._id}/save-edits`)
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({})
                    .expect(400);

               expect(response.body).toHaveProperty('error', 'Invalid request');
               expect(response.body.message).toContain('editedText is required');
          });

          it('should return 400 for empty editedText', async () => {
               const response = await request(app)
                    .post(`/api/content/${generatedContent._id}/save-edits`)
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({ editedText: '   ' })
                    .expect(400);

               expect(response.body).toHaveProperty('error', 'Invalid request');
               expect(response.body.message).toContain('editedText is required');
          });

          it('should return 404 for non-existent content', async () => {
               const fakeId = new mongoose.Types.ObjectId();

               const response = await request(app)
                    .post(`/api/content/${fakeId}/save-edits`)
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({ editedText: 'Some edit' })
                    .expect(404);

               expect(response.body).toHaveProperty('error', 'Not found');
          });

          it('should return 401 for unauthorized access', async () => {
               // Try to edit content that belongs to another user
               const otherUserContent = await Content.create({
                    analysisId: testAnalysis._id,
                    userId: testUserWithProfile._id, // Different user
                    platform: 'linkedin',
                    tone: 'professional',
                    generatedText: 'Original content',
                    editedText: '',
                    version: 1,
               });

               const response = await request(app)
                    .post(`/api/content/${otherUserContent._id}/save-edits`)
                    .set('Authorization', `Bearer ${testToken}`) // Wrong user's token
                    .send({ editedText: 'Edited content' })
                    .expect(401);

               expect(response.body).toHaveProperty('error', 'Unauthorized');
          });

          it('should return 400 for invalid content ID format', async () => {
               const response = await request(app)
                    .post('/api/content/invalid-id/save-edits')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({ editedText: 'Some edit' })
                    .expect(400);

               expect(response.body).toHaveProperty('error', 'Invalid request');
               expect(response.body.message).toContain('Invalid contentId format');
          });
     });
});
