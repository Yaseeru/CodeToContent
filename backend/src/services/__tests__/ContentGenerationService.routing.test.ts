import { ContentGenerationService } from '../ContentGenerationService';
import { Content } from '../../models/Content';
import { Analysis } from '../../models/Analysis';
import { User } from '../../models/User';

// Mock dependencies
jest.mock('../../models/Content');
jest.mock('../../models/Analysis');
jest.mock('../../models/User');
jest.mock('../LoggerService');

describe('ContentGenerationService - Routing Logic', () => {
     let service: ContentGenerationService;
     const mockApiKey = 'test-api-key';

     beforeEach(() => {
          service = new ContentGenerationService(mockApiKey);
          jest.clearAllMocks();
     });

     describe('generateContent routing', () => {
          it('should route to generateSinglePost when format is "single"', async () => {
               // Mock the private method by spying on the service
               const generateSinglePostSpy = jest.spyOn(service as any, 'generateSinglePost');
               generateSinglePostSpy.mockResolvedValue({ contentFormat: 'single' });

               const params = {
                    analysisId: 'test-analysis-id',
                    userId: 'test-user-id',
                    platform: 'x' as const,
                    format: 'single' as const,
               };

               await service.generateContent(params);

               expect(generateSinglePostSpy).toHaveBeenCalledWith(params);
               expect(generateSinglePostSpy).toHaveBeenCalledTimes(1);
          });

          it('should route to generateSinglePost when format is undefined (default)', async () => {
               const generateSinglePostSpy = jest.spyOn(service as any, 'generateSinglePost');
               generateSinglePostSpy.mockResolvedValue({ contentFormat: 'single' });

               const params = {
                    analysisId: 'test-analysis-id',
                    userId: 'test-user-id',
                    platform: 'x' as const,
                    // format is undefined - should default to 'single'
               };

               await service.generateContent(params);

               expect(generateSinglePostSpy).toHaveBeenCalledWith(params);
               expect(generateSinglePostSpy).toHaveBeenCalledTimes(1);
          });

          it('should route to generateMiniThread when format is "mini_thread"', async () => {
               const generateMiniThreadSpy = jest.spyOn(service as any, 'generateMiniThread');
               generateMiniThreadSpy.mockResolvedValue({ contentFormat: 'mini_thread' });

               const params = {
                    analysisId: 'test-analysis-id',
                    userId: 'test-user-id',
                    platform: 'x' as const,
                    format: 'mini_thread' as const,
               };

               await service.generateContent(params);

               expect(generateMiniThreadSpy).toHaveBeenCalledWith(params);
               expect(generateMiniThreadSpy).toHaveBeenCalledTimes(1);
          });

          it('should route to generateFullThread when format is "full_thread"', async () => {
               const generateFullThreadSpy = jest.spyOn(service as any, 'generateFullThread');
               generateFullThreadSpy.mockResolvedValue({ contentFormat: 'full_thread' });

               const params = {
                    analysisId: 'test-analysis-id',
                    userId: 'test-user-id',
                    platform: 'x' as const,
                    format: 'full_thread' as const,
               };

               await service.generateContent(params);

               expect(generateFullThreadSpy).toHaveBeenCalledWith(params);
               expect(generateFullThreadSpy).toHaveBeenCalledTimes(1);
          });

          it('should throw error for invalid format', async () => {
               const params = {
                    analysisId: 'test-analysis-id',
                    userId: 'test-user-id',
                    platform: 'x' as const,
                    format: 'invalid_format' as any,
               };

               await expect(service.generateContent(params)).rejects.toThrow(
                    'Invalid content format: invalid_format'
               );
          });
     });


});
