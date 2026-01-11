import mongoose from 'mongoose';
import { ContentGenerationService } from '../ContentGenerationService';
import { Analysis } from '../../models/Analysis';
import { User } from '../../models/User';
import { Repository } from '../../models/Repository';
import { Content } from '../../models/Content';

// Unit tests for content refinement
// Validates: Requirements 6.3, 6.4
describe('ContentGenerationService Refinement Unit Tests', () => {
     let contentService: ContentGenerationService;

     beforeAll(() => {
          process.env.GEMINI_API_KEY = 'test_gemini_api_key';
          contentService = new ContentGenerationService(process.env.GEMINI_API_KEY);
     });

     describe('Content Refinement', () => {
          test('should produce shorter content when "shorter" refinement is requested', async () => {
               // Create test user
               const user = new User({
                    githubId: 'github_test_user',
                    username: 'testuser',
                    accessToken: 'test_token',
                    avatarUrl: 'https://example.com/avatar.png',
               });
               await user.save();

               // Create test repository
               const repository = new Repository({
                    userId: user._id,
                    githubRepoId: 'repo_test',
                    name: 'test-repo',
                    fullName: 'owner/test-repo',
                    description: 'Test repository',
                    url: 'https://github.com/owner/test-repo',
               });
               await repository.save();

               // Create analysis
               const analysis = new Analysis({
                    repositoryId: repository._id,
                    userId: user._id,
                    problemStatement: 'Solving a complex problem',
                    targetAudience: 'Developers',
                    coreFunctionality: ['Feature 1', 'Feature 2'],
                    notableFeatures: ['Notable 1'],
                    recentChanges: ['Change 1'],
                    integrations: ['API 1'],
                    valueProposition: 'Great value',
                    rawSignals: {
                         readmeLength: 100,
                         commitCount: 10,
                         prCount: 5,
                         fileStructure: ['README.md'],
                    },
               });
               await analysis.save();

               // Create initial content with longer text
               const originalText =
                    'This is a comprehensive and detailed explanation of the repository that contains multiple sentences and provides extensive information about the project, its features, and its benefits. It goes into great detail about various aspects of the implementation.';
               const initialContent = new Content({
                    analysisId: analysis._id,
                    userId: user._id,
                    platform: 'linkedin',
                    tone: 'Professional',
                    generatedText: originalText,
                    editedText: '',
                    version: 1,
               });
               await initialContent.save();

               // Mock Gemini API to return shorter content
               const shorterText = 'This is a concise explanation of the repository and its key features.';
               const callGeminiSpy = jest
                    .spyOn(contentService as any, 'callGeminiAPI')
                    .mockResolvedValue(shorterText);

               try {
                    // Refine content with "shorter" instruction
                    const refinedContent = await contentService.refineContent({
                         contentId: initialContent._id.toString(),
                         userId: user._id.toString(),
                         instruction: 'shorter',
                    });

                    // Verify the refined content is shorter
                    expect(refinedContent.generatedText.length).toBeLessThan(originalText.length);
                    expect(refinedContent.generatedText).toBe(shorterText);

                    // Verify the prompt included "shorter" guidance
                    const callArgs = callGeminiSpy.mock.calls[0][0];
                    expect(callArgs).toContain('shorter');
                    expect(callArgs).toContain('30-50% reduction');
               } finally {
                    callGeminiSpy.mockRestore();
               }
          });

          test('should maintain meaning when "clearer" refinement is requested', async () => {
               // Create test user
               const user = new User({
                    githubId: 'github_test_user_2',
                    username: 'testuser2',
                    accessToken: 'test_token',
                    avatarUrl: 'https://example.com/avatar.png',
               });
               await user.save();

               // Create test repository
               const repository = new Repository({
                    userId: user._id,
                    githubRepoId: 'repo_test_2',
                    name: 'test-repo-2',
                    fullName: 'owner/test-repo-2',
                    description: 'Test repository',
                    url: 'https://github.com/owner/test-repo-2',
               });
               await repository.save();

               // Create analysis
               const analysis = new Analysis({
                    repositoryId: repository._id,
                    userId: user._id,
                    problemStatement: 'Solving a complex problem',
                    targetAudience: 'Developers',
                    coreFunctionality: ['Feature 1', 'Feature 2'],
                    notableFeatures: ['Notable 1'],
                    recentChanges: ['Change 1'],
                    integrations: ['API 1'],
                    valueProposition: 'Great value',
                    rawSignals: {
                         readmeLength: 100,
                         commitCount: 10,
                         prCount: 5,
                         fileStructure: ['README.md'],
                    },
               });
               await analysis.save();

               // Create initial content with complex wording
               const originalText =
                    'The repository facilitates the implementation of sophisticated algorithmic solutions through a comprehensive framework.';
               const initialContent = new Content({
                    analysisId: analysis._id,
                    userId: user._id,
                    platform: 'x',
                    tone: 'Professional',
                    generatedText: originalText,
                    editedText: '',
                    version: 1,
               });
               await initialContent.save();

               // Mock Gemini API to return clearer content with similar length
               const clearerText = 'The repository helps implement advanced algorithms through a complete framework.';
               const callGeminiSpy = jest
                    .spyOn(contentService as any, 'callGeminiAPI')
                    .mockResolvedValue(clearerText);

               try {
                    // Refine content with "clearer" instruction
                    const refinedContent = await contentService.refineContent({
                         contentId: initialContent._id.toString(),
                         userId: user._id.toString(),
                         instruction: 'clearer',
                    });

                    // Verify the refined content maintains similar length (clearer doesn't mean shorter)
                    const lengthDifference = Math.abs(refinedContent.generatedText.length - originalText.length);
                    const lengthChangePercentage = (lengthDifference / originalText.length) * 100;
                    expect(lengthChangePercentage).toBeLessThan(40); // Less than 40% change in length

                    // Verify the prompt included "clearer" guidance
                    const callArgs = callGeminiSpy.mock.calls[0][0];
                    expect(callArgs).toContain('clearer');
                    expect(callArgs).toContain('easier to understand');
                    expect(callArgs).toContain('Maintain the same general length');

                    // Verify core meaning is preserved (both mention repository, algorithms, framework)
                    expect(refinedContent.generatedText.toLowerCase()).toContain('repository');
                    expect(refinedContent.generatedText.toLowerCase()).toContain('algorithm');
                    expect(refinedContent.generatedText.toLowerCase()).toContain('framework');
               } finally {
                    callGeminiSpy.mockRestore();
               }
          });

          test('should increment version number when refining content', async () => {
               // Create test user
               const user = new User({
                    githubId: 'github_test_user_3',
                    username: 'testuser3',
                    accessToken: 'test_token',
                    avatarUrl: 'https://example.com/avatar.png',
               });
               await user.save();

               // Create test repository
               const repository = new Repository({
                    userId: user._id,
                    githubRepoId: 'repo_test_3',
                    name: 'test-repo-3',
                    fullName: 'owner/test-repo-3',
                    description: 'Test repository',
                    url: 'https://github.com/owner/test-repo-3',
               });
               await repository.save();

               // Create analysis
               const analysis = new Analysis({
                    repositoryId: repository._id,
                    userId: user._id,
                    problemStatement: 'Solving a complex problem',
                    targetAudience: 'Developers',
                    coreFunctionality: ['Feature 1', 'Feature 2'],
                    notableFeatures: ['Notable 1'],
                    recentChanges: ['Change 1'],
                    integrations: ['API 1'],
                    valueProposition: 'Great value',
                    rawSignals: {
                         readmeLength: 100,
                         commitCount: 10,
                         prCount: 5,
                         fileStructure: ['README.md'],
                    },
               });
               await analysis.save();

               // Create initial content with version 1
               const originalText = 'Original content for version testing.';
               const initialContent = new Content({
                    analysisId: analysis._id,
                    userId: user._id,
                    platform: 'linkedin',
                    tone: 'Casual',
                    generatedText: originalText,
                    editedText: '',
                    version: 1,
               });
               await initialContent.save();

               // Mock Gemini API
               const refinedText = 'Refined content for version testing.';
               const callGeminiSpy = jest
                    .spyOn(contentService as any, 'callGeminiAPI')
                    .mockResolvedValue(refinedText);

               try {
                    // Refine content
                    const refinedContent = await contentService.refineContent({
                         contentId: initialContent._id.toString(),
                         userId: user._id.toString(),
                         instruction: 'more engaging',
                    });

                    // Verify version incremented
                    expect(refinedContent.version).toBe(initialContent.version + 1);
                    expect(refinedContent.version).toBe(2);

                    // Verify it's a new document
                    expect(refinedContent._id.toString()).not.toBe(initialContent._id.toString());

                    // Verify it references the same analysis and user
                    expect(refinedContent.analysisId.toString()).toBe(initialContent.analysisId.toString());
                    expect(refinedContent.userId.toString()).toBe(initialContent.userId.toString());

                    // Verify platform and tone are preserved
                    expect(refinedContent.platform).toBe(initialContent.platform);
                    expect(refinedContent.tone).toBe(initialContent.tone);

                    // Refine again to test multiple increments
                    const secondRefinedText = 'Second refined content.';
                    callGeminiSpy.mockResolvedValue(secondRefinedText);

                    const secondRefinedContent = await contentService.refineContent({
                         contentId: refinedContent._id.toString(),
                         userId: user._id.toString(),
                         instruction: 'shorter',
                    });

                    // Verify version incremented again
                    expect(secondRefinedContent.version).toBe(refinedContent.version + 1);
                    expect(secondRefinedContent.version).toBe(3);
               } finally {
                    callGeminiSpy.mockRestore();
               }
          });

          test('should use editedText if available, otherwise generatedText for refinement', async () => {
               // Create test user
               const user = new User({
                    githubId: 'github_test_user_4',
                    username: 'testuser4',
                    accessToken: 'test_token',
                    avatarUrl: 'https://example.com/avatar.png',
               });
               await user.save();

               // Create test repository
               const repository = new Repository({
                    userId: user._id,
                    githubRepoId: 'repo_test_4',
                    name: 'test-repo-4',
                    fullName: 'owner/test-repo-4',
                    description: 'Test repository',
                    url: 'https://github.com/owner/test-repo-4',
               });
               await repository.save();

               // Create analysis
               const analysis = new Analysis({
                    repositoryId: repository._id,
                    userId: user._id,
                    problemStatement: 'Solving a complex problem',
                    targetAudience: 'Developers',
                    coreFunctionality: ['Feature 1'],
                    notableFeatures: [],
                    recentChanges: [],
                    integrations: [],
                    valueProposition: 'Great value',
                    rawSignals: {
                         readmeLength: 100,
                         commitCount: 10,
                         prCount: 5,
                         fileStructure: ['README.md'],
                    },
               });
               await analysis.save();

               // Create content with both generatedText and editedText
               const generatedText = 'Original generated content.';
               const editedText = 'User edited this content manually.';
               const contentWithEdit = new Content({
                    analysisId: analysis._id,
                    userId: user._id,
                    platform: 'x',
                    tone: 'Casual',
                    generatedText: generatedText,
                    editedText: editedText,
                    version: 1,
               });
               await contentWithEdit.save();

               // Mock Gemini API
               const refinedText = 'Refined from edited text.';
               const callGeminiSpy = jest
                    .spyOn(contentService as any, 'callGeminiAPI')
                    .mockResolvedValue(refinedText);

               try {
                    // Refine content
                    await contentService.refineContent({
                         contentId: contentWithEdit._id.toString(),
                         userId: user._id.toString(),
                         instruction: 'shorter',
                    });

                    // Verify the prompt used editedText (not generatedText)
                    const callArgs = callGeminiSpy.mock.calls[0][0];
                    expect(callArgs).toContain(editedText);
                    expect(callArgs).not.toContain(generatedText);
               } finally {
                    callGeminiSpy.mockRestore();
               }
          });
     });
});
