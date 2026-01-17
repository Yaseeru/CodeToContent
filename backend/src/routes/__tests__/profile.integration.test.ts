import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../../index';
import { User } from '../../models/User';
import { VoiceArchetype } from '../../models/VoiceArchetype';
import { AuthService } from '../../services/AuthService';
import { ArchetypeManagementService } from '../../services/ArchetypeManagementService';

describe('Profile API Integration Tests', () => {
     let mongoServer: MongoMemoryServer;
     let authService: AuthService;
     let testUser: any;
     let testToken: string;
     let archetypeService: ArchetypeManagementService;

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
          archetypeService = new ArchetypeManagementService();
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
          await VoiceArchetype.deleteMany({});

          // Create test user
          testUser = await User.create({
               githubId: '12345',
               username: 'testuser',
               accessToken: 'test-github-token',
               avatarUrl: 'https://example.com/avatar.jpg',
          });

          // Generate JWT for test user
          testToken = authService.generateJWT(testUser);

          // Initialize default archetypes
          await archetypeService.initializeDefaultArchetypes();
     });

     describe('POST /api/profile/analyze-text', () => {
          it('should return 401 without authentication', async () => {
               const response = await request(app)
                    .post('/api/profile/analyze-text')
                    .send({ text: 'Sample text for analysis' })
                    .expect(401);

               expect(response.body).toHaveProperty('error');
               expect(response.body.message).toContain('not authenticated');
          });

          it('should return 400 when neither text nor file is provided', async () => {
               const response = await request(app)
                    .post('/api/profile/analyze-text')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({})
                    .expect(400);

               expect(response.body).toHaveProperty('error');
               expect(response.body.message).toContain('Either text or file upload is required');
          });

          it('should return 400 when text is too short', async () => {
               const shortText = 'This is too short';

               const response = await request(app)
                    .post('/api/profile/analyze-text')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({ text: shortText })
                    .expect(400);

               expect(response.body).toHaveProperty('error');
               expect(response.body.message).toContain('300 characters');
          });

          it('should return 400 for unsupported file format', async () => {
               const response = await request(app)
                    .post('/api/profile/analyze-text')
                    .set('Authorization', `Bearer ${testToken}`)
                    .attach('file', Buffer.from('test content'), {
                         filename: 'test.docx',
                         contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    })
                    .expect(400);

               expect(response.body).toHaveProperty('error');
               expect(response.body.message).toContain('Invalid file type');
          });

          it('should return 500 when Gemini API key is not configured', async () => {
               // Temporarily remove API key
               const originalKey = process.env.GEMINI_API_KEY;
               delete process.env.GEMINI_API_KEY;

               const longText = 'A'.repeat(300);

               const response = await request(app)
                    .post('/api/profile/analyze-text')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({ text: longText })
                    .expect(500);

               expect(response.body).toHaveProperty('error');
               expect(response.body.message).toContain('Gemini API key not configured');

               // Restore API key
               if (originalKey) {
                    process.env.GEMINI_API_KEY = originalKey;
               }
          });
     });

     describe('GET /api/profile/style', () => {
          it('should return 401 without authentication', async () => {
               const response = await request(app)
                    .get('/api/profile/style')
                    .expect(401);

               expect(response.body).toHaveProperty('error');
               expect(response.body.message).toContain('not authenticated');
          });

          it('should return 404 when user has no style profile', async () => {
               const response = await request(app)
                    .get('/api/profile/style')
                    .set('Authorization', `Bearer ${testToken}`)
                    .expect(404);

               expect(response.body).toHaveProperty('error');
               expect(response.body.message).toContain('no style profile');
          });

          it('should return profile with evolution score when profile exists', async () => {
               // Create a style profile for the user
               testUser.styleProfile = {
                    voiceType: 'professional',
                    tone: {
                         formality: 7,
                         enthusiasm: 5,
                         directness: 6,
                         humor: 3,
                         emotionality: 4,
                    },
                    writingTraits: {
                         avgSentenceLength: 15,
                         usesQuestionsOften: false,
                         usesEmojis: false,
                         emojiFrequency: 0,
                         usesBulletPoints: true,
                         usesShortParagraphs: true,
                         usesHooks: false,
                    },
                    structurePreferences: {
                         introStyle: 'statement',
                         bodyStyle: 'analysis',
                         endingStyle: 'summary',
                    },
                    vocabularyLevel: 'advanced',
                    commonPhrases: ['in conclusion', 'furthermore'],
                    bannedPhrases: ['literally', 'basically'],
                    samplePosts: ['Sample post 1', 'Sample post 2'],
                    learningIterations: 0,
                    lastUpdated: new Date(),
                    profileSource: 'manual',
               };
               await testUser.save();

               const response = await request(app)
                    .get('/api/profile/style')
                    .set('Authorization', `Bearer ${testToken}`)
                    .expect(200);

               expect(response.body).toHaveProperty('profile');
               expect(response.body).toHaveProperty('evolutionScore');
               expect(response.body).toHaveProperty('voiceStrength');
               expect(response.body.profile.voiceType).toBe('professional');
               expect(response.body.evolutionScore).toBeGreaterThanOrEqual(0);
               expect(response.body.evolutionScore).toBeLessThanOrEqual(100);
          });
     });

     describe('PUT /api/profile/style', () => {
          beforeEach(async () => {
               // Create a style profile for the user
               testUser.styleProfile = {
                    voiceType: 'professional',
                    tone: {
                         formality: 7,
                         enthusiasm: 5,
                         directness: 6,
                         humor: 3,
                         emotionality: 4,
                    },
                    writingTraits: {
                         avgSentenceLength: 15,
                         usesQuestionsOften: false,
                         usesEmojis: false,
                         emojiFrequency: 0,
                         usesBulletPoints: true,
                         usesShortParagraphs: true,
                         usesHooks: false,
                    },
                    structurePreferences: {
                         introStyle: 'statement',
                         bodyStyle: 'analysis',
                         endingStyle: 'summary',
                    },
                    vocabularyLevel: 'advanced',
                    commonPhrases: ['in conclusion', 'furthermore'],
                    bannedPhrases: ['literally', 'basically'],
                    samplePosts: ['Sample post 1', 'Sample post 2'],
                    learningIterations: 0,
                    lastUpdated: new Date(),
                    profileSource: 'manual',
               };
               await testUser.save();
          });

          it('should return 401 without authentication', async () => {
               const response = await request(app)
                    .put('/api/profile/style')
                    .send({ tone: { formality: 8 } })
                    .expect(401);

               expect(response.body).toHaveProperty('error');
               expect(response.body.message).toContain('not authenticated');
          });

          it('should return 404 when user has no style profile', async () => {
               // Create a new user without profile
               const newUser = await User.create({
                    githubId: '99999',
                    username: 'newuser',
                    accessToken: 'test-token',
                    avatarUrl: 'https://example.com/avatar.jpg',
               });
               const newToken = authService.generateJWT(newUser);

               const response = await request(app)
                    .put('/api/profile/style')
                    .set('Authorization', `Bearer ${newToken}`)
                    .send({ tone: { formality: 8 } })
                    .expect(404);

               expect(response.body).toHaveProperty('error');
               expect(response.body.message).toContain('no style profile to update');
          });

          it('should return 400 for invalid tone metric value', async () => {
               const response = await request(app)
                    .put('/api/profile/style')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({ tone: { formality: 15 } })
                    .expect(400);

               expect(response.body).toHaveProperty('error');
               expect(response.body.message).toContain('must be a number between 1 and 10');
          });

          it('should return 400 for invalid emoji frequency', async () => {
               const response = await request(app)
                    .put('/api/profile/style')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({ writingTraits: { emojiFrequency: 10 } })
                    .expect(400);

               expect(response.body).toHaveProperty('error');
               expect(response.body.message).toContain('must be a number between 0 and 5');
          });

          it('should return 400 for invalid voice strength', async () => {
               const response = await request(app)
                    .put('/api/profile/style')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({ voiceStrength: 150 })
                    .expect(400);

               expect(response.body).toHaveProperty('error');
               expect(response.body.message).toContain('must be a number between 0 and 100');
          });

          it('should successfully update profile with valid data', async () => {
               const response = await request(app)
                    .put('/api/profile/style')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({
                         tone: { formality: 9, enthusiasm: 7 },
                         voiceStrength: 90,
                         commonPhrases: ['updated phrase'],
                    })
                    .expect(200);

               expect(response.body).toHaveProperty('message');
               expect(response.body.message).toContain('updated successfully');
               expect(response.body.profile.tone.formality).toBe(9);
               expect(response.body.profile.tone.enthusiasm).toBe(7);
               expect(response.body.voiceStrength).toBe(90);
               expect(response.body.profile.commonPhrases).toContain('updated phrase');
          });

          it('should save manual overrides when updating profile', async () => {
               await request(app)
                    .put('/api/profile/style')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({
                         tone: { formality: 9 },
                         writingTraits: { avgSentenceLength: 20 },
                    })
                    .expect(200);

               // Verify manual overrides were saved
               const updatedUser = await User.findById(testUser._id);
               expect(updatedUser?.manualOverrides).toBeDefined();
               expect(updatedUser?.manualOverrides?.tone?.formality).toBe(9);
               expect(updatedUser?.manualOverrides?.writingTraits?.avgSentenceLength).toBe(20);
          });
     });

     describe('POST /api/profile/reset', () => {
          beforeEach(async () => {
               // Create a style profile for the user
               testUser.styleProfile = {
                    voiceType: 'professional',
                    tone: {
                         formality: 7,
                         enthusiasm: 5,
                         directness: 6,
                         humor: 3,
                         emotionality: 4,
                    },
                    writingTraits: {
                         avgSentenceLength: 15,
                         usesQuestionsOften: false,
                         usesEmojis: false,
                         emojiFrequency: 0,
                         usesBulletPoints: true,
                         usesShortParagraphs: true,
                         usesHooks: false,
                    },
                    structurePreferences: {
                         introStyle: 'statement',
                         bodyStyle: 'analysis',
                         endingStyle: 'summary',
                    },
                    vocabularyLevel: 'advanced',
                    commonPhrases: ['in conclusion'],
                    bannedPhrases: ['literally'],
                    samplePosts: ['Sample post'],
                    learningIterations: 5,
                    lastUpdated: new Date(),
                    profileSource: 'manual',
               };
               testUser.manualOverrides = {
                    tone: { formality: 7 },
               };
               testUser.voiceStrength = 90;
               await testUser.save();
          });

          it('should return 401 without authentication', async () => {
               const response = await request(app)
                    .post('/api/profile/reset')
                    .expect(401);

               expect(response.body).toHaveProperty('error');
               expect(response.body.message).toContain('not authenticated');
          });

          it('should successfully reset profile to defaults', async () => {
               const response = await request(app)
                    .post('/api/profile/reset')
                    .set('Authorization', `Bearer ${testToken}`)
                    .expect(200);

               expect(response.body).toHaveProperty('message');
               expect(response.body.message).toContain('reset successfully');

               // Verify profile was cleared
               const updatedUser = await User.findById(testUser._id);
               expect(updatedUser?.styleProfile).toBeUndefined();
               expect(updatedUser?.manualOverrides).toBeUndefined();
               expect(updatedUser?.voiceStrength).toBe(80);
          });
     });

     describe('GET /api/profile/archetypes', () => {
          it('should return 401 without authentication', async () => {
               const response = await request(app)
                    .get('/api/profile/archetypes')
                    .expect(401);

               expect(response.body).toHaveProperty('error');
               expect(response.body.message).toContain('not authenticated');
          });

          it('should return list of archetypes', async () => {
               const response = await request(app)
                    .get('/api/profile/archetypes')
                    .set('Authorization', `Bearer ${testToken}`)
                    .expect(200);

               expect(response.body).toHaveProperty('archetypes');
               expect(Array.isArray(response.body.archetypes)).toBe(true);
               expect(response.body.archetypes.length).toBeGreaterThan(0);

               // Verify archetype structure
               const archetype = response.body.archetypes[0];
               expect(archetype).toHaveProperty('id');
               expect(archetype).toHaveProperty('name');
               expect(archetype).toHaveProperty('description');
               expect(archetype).toHaveProperty('category');
               expect(archetype).toHaveProperty('usageCount');
               expect(archetype).toHaveProperty('isDefault');
          });

          it('should include default archetypes', async () => {
               const response = await request(app)
                    .get('/api/profile/archetypes')
                    .set('Authorization', `Bearer ${testToken}`)
                    .expect(200);

               const archetypeNames = response.body.archetypes.map((a: any) => a.name);
               expect(archetypeNames).toContain('Tech Twitter Influencer');
               expect(archetypeNames).toContain('LinkedIn Thought Leader');
               expect(archetypeNames).toContain('Meme Lord');
               expect(archetypeNames).toContain('Academic Researcher');
          });
     });

     describe('POST /api/profile/apply-archetype', () => {
          let archetypeId: string;

          beforeEach(async () => {
               // Get an archetype ID
               const archetypes = await VoiceArchetype.find({ isDefault: true }).limit(1);
               archetypeId = archetypes[0]._id.toString();
          });

          it('should return 401 without authentication', async () => {
               const response = await request(app)
                    .post('/api/profile/apply-archetype')
                    .send({ archetypeId })
                    .expect(401);

               expect(response.body).toHaveProperty('error');
               expect(response.body.message).toContain('not authenticated');
          });

          it('should return 400 when archetypeId is missing', async () => {
               const response = await request(app)
                    .post('/api/profile/apply-archetype')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({})
                    .expect(400);

               expect(response.body).toHaveProperty('error');
               expect(response.body.message).toContain('archetypeId is required');
          });

          it('should return 400 for invalid archetypeId format', async () => {
               const response = await request(app)
                    .post('/api/profile/apply-archetype')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({ archetypeId: 'invalid-id' })
                    .expect(400);

               expect(response.body).toHaveProperty('error');
               expect(response.body.message).toContain('Invalid archetypeId format');
          });

          it('should return 404 for non-existent archetype', async () => {
               const fakeId = new mongoose.Types.ObjectId().toString();

               const response = await request(app)
                    .post('/api/profile/apply-archetype')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({ archetypeId: fakeId })
                    .expect(404);

               expect(response.body).toHaveProperty('error');
               expect(response.body.message).toContain('not found');
          });

          it('should successfully apply archetype to user profile', async () => {
               const response = await request(app)
                    .post('/api/profile/apply-archetype')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({ archetypeId })
                    .expect(200);

               expect(response.body).toHaveProperty('message');
               expect(response.body.message).toContain('applied successfully');
               expect(response.body).toHaveProperty('profile');
               expect(response.body).toHaveProperty('evolutionScore');

               // Verify profile was created
               const updatedUser = await User.findById(testUser._id);
               expect(updatedUser?.styleProfile).toBeDefined();
               expect(updatedUser?.styleProfile?.archetypeBase).toBe(archetypeId);
          });

          it('should increment archetype usage count', async () => {
               const archetype = await VoiceArchetype.findById(archetypeId);
               const initialCount = archetype?.usageCount || 0;

               await request(app)
                    .post('/api/profile/apply-archetype')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({ archetypeId })
                    .expect(200);

               const updatedArchetype = await VoiceArchetype.findById(archetypeId);
               expect(updatedArchetype?.usageCount).toBe(initialCount + 1);
          });
     });

     describe('GET /api/profile/analytics', () => {
          it('should return 401 without authentication', async () => {
               const response = await request(app)
                    .get('/api/profile/analytics')
                    .expect(401);

               expect(response.body).toHaveProperty('error');
               expect(response.body.message).toContain('not authenticated');
          });

          it('should return 404 when user has no style profile', async () => {
               const response = await request(app)
                    .get('/api/profile/analytics')
                    .set('Authorization', `Bearer ${testToken}`)
                    .expect(404);

               expect(response.body).toHaveProperty('error');
               expect(response.body.message).toContain('no style profile');
          });

          it('should return analytics when profile exists', async () => {
               // Create a style profile for the user
               testUser.styleProfile = {
                    voiceType: 'professional',
                    tone: {
                         formality: 7,
                         enthusiasm: 5,
                         directness: 6,
                         humor: 3,
                         emotionality: 4,
                    },
                    writingTraits: {
                         avgSentenceLength: 15,
                         usesQuestionsOften: false,
                         usesEmojis: false,
                         emojiFrequency: 0,
                         usesBulletPoints: true,
                         usesShortParagraphs: true,
                         usesHooks: false,
                    },
                    structurePreferences: {
                         introStyle: 'statement',
                         bodyStyle: 'analysis',
                         endingStyle: 'summary',
                    },
                    vocabularyLevel: 'advanced',
                    commonPhrases: ['in conclusion', 'furthermore'],
                    bannedPhrases: ['literally', 'basically'],
                    samplePosts: ['Sample post 1', 'Sample post 2'],
                    learningIterations: 5,
                    lastUpdated: new Date(),
                    profileSource: 'manual',
               };
               await testUser.save();

               const response = await request(app)
                    .get('/api/profile/analytics')
                    .set('Authorization', `Bearer ${testToken}`)
                    .expect(200);

               expect(response.body).toHaveProperty('analytics');
               expect(response.body.analytics).toHaveProperty('evolutionScore');
               expect(response.body.analytics).toHaveProperty('learningIterations');
               expect(response.body.analytics).toHaveProperty('toneDistribution');
               expect(response.body.analytics).toHaveProperty('commonPhrases');
               expect(response.body.analytics).toHaveProperty('bannedPhrases');
               expect(response.body.analytics).toHaveProperty('writingTraitsSummary');
          });
     });

     describe('GET /api/profile/evolution-timeline', () => {
          it('should return 401 without authentication', async () => {
               const response = await request(app)
                    .get('/api/profile/evolution-timeline')
                    .expect(401);

               expect(response.body).toHaveProperty('error');
               expect(response.body.message).toContain('not authenticated');
          });

          it('should return 404 when user has no style profile', async () => {
               const response = await request(app)
                    .get('/api/profile/evolution-timeline')
                    .set('Authorization', `Bearer ${testToken}`)
                    .expect(404);

               expect(response.body).toHaveProperty('error');
               expect(response.body.message).toContain('no style profile');
          });

          it('should return timeline when profile exists', async () => {
               // Create a style profile for the user
               testUser.styleProfile = {
                    voiceType: 'professional',
                    tone: {
                         formality: 7,
                         enthusiasm: 5,
                         directness: 6,
                         humor: 3,
                         emotionality: 4,
                    },
                    writingTraits: {
                         avgSentenceLength: 15,
                         usesQuestionsOften: false,
                         usesEmojis: false,
                         emojiFrequency: 0,
                         usesBulletPoints: true,
                         usesShortParagraphs: true,
                         usesHooks: false,
                    },
                    structurePreferences: {
                         introStyle: 'statement',
                         bodyStyle: 'analysis',
                         endingStyle: 'summary',
                    },
                    vocabularyLevel: 'advanced',
                    commonPhrases: ['in conclusion'],
                    bannedPhrases: ['literally'],
                    samplePosts: ['Sample post'],
                    learningIterations: 5,
                    lastUpdated: new Date(),
                    profileSource: 'manual',
               };
               await testUser.save();

               const response = await request(app)
                    .get('/api/profile/evolution-timeline')
                    .set('Authorization', `Bearer ${testToken}`)
                    .expect(200);

               expect(response.body).toHaveProperty('timeline');
               expect(Array.isArray(response.body.timeline)).toBe(true);
          });
     });

     describe('Authentication Requirements', () => {
          const endpoints = [
               { method: 'post', path: '/api/profile/analyze-text' },
               { method: 'get', path: '/api/profile/style' },
               { method: 'put', path: '/api/profile/style' },
               { method: 'post', path: '/api/profile/reset' },
               { method: 'get', path: '/api/profile/archetypes' },
               { method: 'post', path: '/api/profile/apply-archetype' },
               { method: 'get', path: '/api/profile/analytics' },
               { method: 'get', path: '/api/profile/evolution-timeline' },
          ];

          endpoints.forEach(({ method, path }) => {
               it(`should require authentication for ${method.toUpperCase()} ${path}`, async () => {
                    const req = request(app)[method as 'get' | 'post' | 'put'](path);

                    const response = await req.expect(401);

                    expect(response.body).toHaveProperty('error');
               });
          });
     });
});
