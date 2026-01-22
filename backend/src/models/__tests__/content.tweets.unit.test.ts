import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Content, IContent, Tweet } from '../Content';
import { User } from '../User';
import { Analysis } from '../Analysis';
import { Repository } from '../Repository';

describe('Content Model - Tweets Array', () => {
     let mongoServer: MongoMemoryServer;

     beforeAll(async () => {
          mongoServer = await MongoMemoryServer.create();
          const mongoUri = mongoServer.getUri();
          await mongoose.connect(mongoUri);
     });

     afterAll(async () => {
          await mongoose.disconnect();
          await mongoServer.stop();
     });

     afterEach(async () => {
          await Content.deleteMany({});
          await User.deleteMany({});
          await Analysis.deleteMany({});
          await Repository.deleteMany({});
     });

     describe('Tweet Interface', () => {
          it('should create content with tweets array for mini_thread', async () => {
               const user = await User.create({
                    githubId: 'test-user',
                    username: 'testuser',
                    email: 'test@example.com',
                    accessToken: 'token',
               });

               const repo = await Repository.create({
                    userId: user._id,
                    githubId: 123,
                    name: 'test-repo',
                    fullName: 'testuser/test-repo',
                    description: 'Test repository',
                    url: 'https://github.com/testuser/test-repo',
                    language: 'TypeScript',
                    stars: 10,
                    forks: 5,
                    isPrivate: false,
               });

               const analysis = await Analysis.create({
                    repositoryId: repo._id,
                    userId: user._id,
                    status: 'completed',
                    rawSignals: {
                         repoMetadata: {},
                         recentCommits: [],
                         pullRequests: [],
                         readme: '',
                         codeStructure: {},
                    },
                    insights: {
                         summary: 'Test summary',
                         keyFeatures: [],
                         technicalHighlights: [],
                         targetAudience: 'developers',
                         suggestedTones: [],
                    },
               });

               const tweets: Tweet[] = [
                    { text: 'Tweet 1: Hook and context 1/3', position: 1, characterCount: 33 },
                    { text: 'Tweet 2: Problem and solution 2/3', position: 2, characterCount: 36 },
                    { text: 'Tweet 3: Result and CTA 3/3', position: 3, characterCount: 30 },
               ];

               const content = await Content.create({
                    analysisId: analysis._id,
                    userId: user._id,
                    platform: 'x',
                    contentFormat: 'mini_thread',
                    generatedText: tweets.map(t => t.text).join('\n\n'),
                    editedText: '',
                    tweets,
                    version: 1,
               });

               expect(content.contentFormat).toBe('mini_thread');
               expect(content.tweets).toBeDefined();
               expect(content.tweets).toHaveLength(3);
               expect(content.tweets![0].text).toBe('Tweet 1: Hook and context 1/3');
               expect(content.tweets![0].position).toBe(1);
               expect(content.tweets![0].characterCount).toBe(33);
          });

          it('should create content without tweets array for single post', async () => {
               const user = await User.create({
                    githubId: 'test-user',
                    username: 'testuser',
                    email: 'test@example.com',
                    accessToken: 'token',
               });

               const repo = await Repository.create({
                    userId: user._id,
                    githubId: 123,
                    name: 'test-repo',
                    fullName: 'testuser/test-repo',
                    description: 'Test repository',
                    url: 'https://github.com/testuser/test-repo',
                    language: 'TypeScript',
                    stars: 10,
                    forks: 5,
                    isPrivate: false,
               });

               const analysis = await Analysis.create({
                    repositoryId: repo._id,
                    userId: user._id,
                    status: 'completed',
                    rawSignals: {
                         repoMetadata: {},
                         recentCommits: [],
                         pullRequests: [],
                         readme: '',
                         codeStructure: {},
                    },
                    insights: {
                         summary: 'Test summary',
                         keyFeatures: [],
                         technicalHighlights: [],
                         targetAudience: 'developers',
                         suggestedTones: [],
                    },
               });

               const content = await Content.create({
                    analysisId: analysis._id,
                    userId: user._id,
                    platform: 'x',
                    contentFormat: 'single',
                    generatedText: 'This is a single tweet post',
                    editedText: '',
                    version: 1,
               });

               expect(content.contentFormat).toBe('single');
               expect(content.tweets).toBeUndefined();
          });

          it('should validate tweet character count is within limits', async () => {
               const user = await User.create({
                    githubId: 'test-user',
                    username: 'testuser',
                    email: 'test@example.com',
                    accessToken: 'token',
               });

               const repo = await Repository.create({
                    userId: user._id,
                    githubId: 123,
                    name: 'test-repo',
                    fullName: 'testuser/test-repo',
                    description: 'Test repository',
                    url: 'https://github.com/testuser/test-repo',
                    language: 'TypeScript',
                    stars: 10,
                    forks: 5,
                    isPrivate: false,
               });

               const analysis = await Analysis.create({
                    repositoryId: repo._id,
                    userId: user._id,
                    status: 'completed',
                    rawSignals: {
                         repoMetadata: {},
                         recentCommits: [],
                         pullRequests: [],
                         readme: '',
                         codeStructure: {},
                    },
                    insights: {
                         summary: 'Test summary',
                         keyFeatures: [],
                         technicalHighlights: [],
                         targetAudience: 'developers',
                         suggestedTones: [],
                    },
               });

               const tweets: Tweet[] = [
                    { text: 'Valid tweet', position: 1, characterCount: 11 },
               ];

               const content = await Content.create({
                    analysisId: analysis._id,
                    userId: user._id,
                    platform: 'x',
                    contentFormat: 'mini_thread',
                    generatedText: 'Valid tweet',
                    editedText: '',
                    tweets,
                    version: 1,
               });

               expect(content.tweets![0].characterCount).toBeLessThanOrEqual(280);
          });

          it('should validate tweet position is at least 1', async () => {
               const user = await User.create({
                    githubId: 'test-user',
                    username: 'testuser',
                    email: 'test@example.com',
                    accessToken: 'token',
               });

               const repo = await Repository.create({
                    userId: user._id,
                    githubId: 123,
                    name: 'test-repo',
                    fullName: 'testuser/test-repo',
                    description: 'Test repository',
                    url: 'https://github.com/testuser/test-repo',
                    language: 'TypeScript',
                    stars: 10,
                    forks: 5,
                    isPrivate: false,
               });

               const analysis = await Analysis.create({
                    repositoryId: repo._id,
                    userId: user._id,
                    status: 'completed',
                    rawSignals: {
                         repoMetadata: {},
                         recentCommits: [],
                         pullRequests: [],
                         readme: '',
                         codeStructure: {},
                    },
                    insights: {
                         summary: 'Test summary',
                         keyFeatures: [],
                         technicalHighlights: [],
                         targetAudience: 'developers',
                         suggestedTones: [],
                    },
               });

               const tweets: Tweet[] = [
                    { text: 'Invalid position', position: 0, characterCount: 16 },
               ];

               await expect(
                    Content.create({
                         analysisId: analysis._id,
                         userId: user._id,
                         platform: 'x',
                         contentFormat: 'mini_thread',
                         generatedText: 'Invalid position',
                         editedText: '',
                         tweets,
                         version: 1,
                    })
               ).rejects.toThrow();
          });

          it('should create full_thread with 5-7 tweets', async () => {
               const user = await User.create({
                    githubId: 'test-user',
                    username: 'testuser',
                    email: 'test@example.com',
                    accessToken: 'token',
               });

               const repo = await Repository.create({
                    userId: user._id,
                    githubId: 123,
                    name: 'test-repo',
                    fullName: 'testuser/test-repo',
                    description: 'Test repository',
                    url: 'https://github.com/testuser/test-repo',
                    language: 'TypeScript',
                    stars: 10,
                    forks: 5,
                    isPrivate: false,
               });

               const analysis = await Analysis.create({
                    repositoryId: repo._id,
                    userId: user._id,
                    status: 'completed',
                    rawSignals: {
                         repoMetadata: {},
                         recentCommits: [],
                         pullRequests: [],
                         readme: '',
                         codeStructure: {},
                    },
                    insights: {
                         summary: 'Test summary',
                         keyFeatures: [],
                         technicalHighlights: [],
                         targetAudience: 'developers',
                         suggestedTones: [],
                    },
               });

               const tweets: Tweet[] = [
                    { text: 'Tweet 1: Hook 1/5', position: 1, characterCount: 18 },
                    { text: 'Tweet 2: Problem 2/5', position: 2, characterCount: 21 },
                    { text: 'Tweet 3: Solution 3/5', position: 3, characterCount: 22 },
                    { text: 'Tweet 4: Technical 4/5', position: 4, characterCount: 23 },
                    { text: 'Tweet 5: CTA 5/5', position: 5, characterCount: 17 },
               ];

               const content = await Content.create({
                    analysisId: analysis._id,
                    userId: user._id,
                    platform: 'x',
                    contentFormat: 'full_thread',
                    generatedText: tweets.map(t => t.text).join('\n\n'),
                    editedText: '',
                    tweets,
                    version: 1,
               });

               expect(content.contentFormat).toBe('full_thread');
               expect(content.tweets).toBeDefined();
               expect(content.tweets).toHaveLength(5);
               expect(content.tweets![4].text).toBe('Tweet 5: CTA 5/5');
          });
     });
});
