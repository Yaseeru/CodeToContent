import request from 'supertest';
import express, { Express, Request, Response } from 'express';
import { validateSaveEdits } from '../validation';

/**
 * Unit tests for validateSaveEdits middleware
 * Tests validation rules for /api/content/:id/save-edits endpoint
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4 (thread editing validation)
 */
describe('validateSaveEdits Middleware', () => {
     let app: Express;

     beforeEach(() => {
          // Create a minimal Express app for testing validation
          app = express();
          app.use(express.json());

          // Test route that uses the validation middleware
          app.post('/api/content/:id/save-edits', validateSaveEdits, (req: Request, res: Response) => {
               res.status(200).json({ success: true });
          });
     });

     describe('Content ID Validation', () => {
          it('should reject invalid MongoDB ObjectId', async () => {
               const response = await request(app)
                    .post('/api/content/invalid-id/save-edits')
                    .send({ editedText: 'This is valid edited text' });

               expect(response.status).toBe(400);
               expect(response.body.error).toBe('Validation failed');
               expect(response.body.details).toEqual(
                    expect.arrayContaining([
                         expect.objectContaining({
                              field: 'id',
                              message: 'Content ID must be a valid MongoDB ObjectId'
                         })
                    ])
               );
          });

          it('should accept valid MongoDB ObjectId', async () => {
               const validId = '507f1f77bcf86cd799439011';
               const response = await request(app)
                    .post(`/api/content/${validId}/save-edits`)
                    .send({ editedText: 'This is valid edited text' });

               expect(response.status).toBe(200);
          });
     });

     describe('Mutual Exclusivity: editedText OR editedTweets', () => {
          const validId = '507f1f77bcf86cd799439011';

          it('should reject when neither editedText nor editedTweets is provided', async () => {
               const response = await request(app)
                    .post(`/api/content/${validId}/save-edits`)
                    .send({});

               expect(response.status).toBe(400);
               expect(response.body.error).toBe('Validation failed');
               expect(response.body.details).toEqual(
                    expect.arrayContaining([
                         expect.objectContaining({
                              message: 'Either editedText or editedTweets must be provided'
                         })
                    ])
               );
          });

          it('should reject when both editedText and editedTweets are provided', async () => {
               const response = await request(app)
                    .post(`/api/content/${validId}/save-edits`)
                    .send({
                         editedText: 'Some text',
                         editedTweets: [{ position: 1, text: 'Tweet text' }]
                    });

               expect(response.status).toBe(400);
               expect(response.body.error).toBe('Validation failed');
               expect(response.body.details).toEqual(
                    expect.arrayContaining([
                         expect.objectContaining({
                              message: 'Cannot provide both editedText and editedTweets - use only one'
                         })
                    ])
               );
          });
     });

     describe('Single Post Validation (editedText)', () => {
          const validId = '507f1f77bcf86cd799439011';

          it('should accept valid editedText', async () => {
               const response = await request(app)
                    .post(`/api/content/${validId}/save-edits`)
                    .send({ editedText: 'This is a valid edited text with enough characters' });

               expect(response.status).toBe(200);
          });

          it('should reject editedText that is too short', async () => {
               const response = await request(app)
                    .post(`/api/content/${validId}/save-edits`)
                    .send({ editedText: 'Short' });

               expect(response.status).toBe(400);
               expect(response.body.details).toEqual(
                    expect.arrayContaining([
                         expect.objectContaining({
                              field: 'editedText',
                              message: 'editedText must be at least 10 characters'
                         })
                    ])
               );
          });

          it('should reject non-string editedText', async () => {
               const response = await request(app)
                    .post(`/api/content/${validId}/save-edits`)
                    .send({ editedText: 12345 });

               expect(response.status).toBe(400);
               expect(response.body.details).toEqual(
                    expect.arrayContaining([
                         expect.objectContaining({
                              field: 'editedText',
                              message: 'editedText must be a string'
                         })
                    ])
               );
          });
     });

     describe('Thread Validation (editedTweets)', () => {
          const validId = '507f1f77bcf86cd799439011';

          it('should accept valid editedTweets array', async () => {
               const response = await request(app)
                    .post(`/api/content/${validId}/save-edits`)
                    .send({
                         editedTweets: [
                              { position: 1, text: 'First tweet with valid content' },
                              { position: 2, text: 'Second tweet with valid content' },
                              { position: 3, text: 'Third tweet with valid content' }
                         ]
                    });

               expect(response.status).toBe(200);
          });

          it('should reject empty editedTweets array', async () => {
               const response = await request(app)
                    .post(`/api/content/${validId}/save-edits`)
                    .send({ editedTweets: [] });

               expect(response.status).toBe(400);
               expect(response.body.details).toEqual(
                    expect.arrayContaining([
                         expect.objectContaining({
                              field: 'editedTweets',
                              message: 'editedTweets must be a non-empty array'
                         })
                    ])
               );
          });

          it('should reject non-array editedTweets', async () => {
               const response = await request(app)
                    .post(`/api/content/${validId}/save-edits`)
                    .send({ editedTweets: 'not an array' });

               expect(response.status).toBe(400);
               expect(response.body.details).toEqual(
                    expect.arrayContaining([
                         expect.objectContaining({
                              field: 'editedTweets',
                              message: 'editedTweets must be a non-empty array'
                         })
                    ])
               );
          });
     });

     describe('Tweet Position Validation', () => {
          const validId = '507f1f77bcf86cd799439011';

          it('should accept positive integer positions', async () => {
               const response = await request(app)
                    .post(`/api/content/${validId}/save-edits`)
                    .send({
                         editedTweets: [
                              { position: 1, text: 'Tweet at position 1' },
                              { position: 5, text: 'Tweet at position 5' }
                         ]
                    });

               expect(response.status).toBe(200);
          });

          it('should reject zero or negative positions', async () => {
               const response = await request(app)
                    .post(`/api/content/${validId}/save-edits`)
                    .send({
                         editedTweets: [
                              { position: 0, text: 'Tweet at position 0' }
                         ]
                    });

               expect(response.status).toBe(400);
               expect(response.body.details).toEqual(
                    expect.arrayContaining([
                         expect.objectContaining({
                              message: 'Each tweet position must be a positive integer'
                         })
                    ])
               );
          });

          it('should reject non-integer positions', async () => {
               const response = await request(app)
                    .post(`/api/content/${validId}/save-edits`)
                    .send({
                         editedTweets: [
                              { position: 1.5, text: 'Tweet at position 1.5' }
                         ]
                    });

               expect(response.status).toBe(400);
               expect(response.body.details).toEqual(
                    expect.arrayContaining([
                         expect.objectContaining({
                              message: 'Each tweet position must be a positive integer'
                         })
                    ])
               );
          });

          it('should reject missing position field', async () => {
               const response = await request(app)
                    .post(`/api/content/${validId}/save-edits`)
                    .send({
                         editedTweets: [
                              { text: 'Tweet without position' }
                         ]
                    });

               expect(response.status).toBe(400);
          });
     });

     describe('Tweet Text Validation', () => {
          const validId = '507f1f77bcf86cd799439011';

          it('should accept tweet text up to 280 characters', async () => {
               const text280 = 'a'.repeat(280);
               const response = await request(app)
                    .post(`/api/content/${validId}/save-edits`)
                    .send({
                         editedTweets: [
                              { position: 1, text: text280 }
                         ]
                    });

               expect(response.status).toBe(200);
          });

          it('should reject tweet text exceeding 280 characters', async () => {
               const text281 = 'a'.repeat(281);
               const response = await request(app)
                    .post(`/api/content/${validId}/save-edits`)
                    .send({
                         editedTweets: [
                              { position: 1, text: text281 }
                         ]
                    });

               expect(response.status).toBe(400);
               expect(response.body.details).toEqual(
                    expect.arrayContaining([
                         expect.objectContaining({
                              message: 'Each tweet must be 280 characters or less'
                         })
                    ])
               );
          });

          it('should reject empty tweet text', async () => {
               const response = await request(app)
                    .post(`/api/content/${validId}/save-edits`)
                    .send({
                         editedTweets: [
                              { position: 1, text: '' }
                         ]
                    });

               expect(response.status).toBe(400);
               expect(response.body.details).toEqual(
                    expect.arrayContaining([
                         expect.objectContaining({
                              message: 'Each tweet text must not be empty'
                         })
                    ])
               );
          });

          it('should reject non-string tweet text', async () => {
               const response = await request(app)
                    .post(`/api/content/${validId}/save-edits`)
                    .send({
                         editedTweets: [
                              { position: 1, text: 12345 }
                         ]
                    });

               expect(response.status).toBe(400);
               expect(response.body.details).toEqual(
                    expect.arrayContaining([
                         expect.objectContaining({
                              message: 'Each tweet text must be a string'
                         })
                    ])
               );
          });

          it('should reject missing text field', async () => {
               const response = await request(app)
                    .post(`/api/content/${validId}/save-edits`)
                    .send({
                         editedTweets: [
                              { position: 1 }
                         ]
                    });

               expect(response.status).toBe(400);
          });
     });

     describe('Multiple Tweet Validation', () => {
          const validId = '507f1f77bcf86cd799439011';

          it('should validate all tweets in array', async () => {
               const response = await request(app)
                    .post(`/api/content/${validId}/save-edits`)
                    .send({
                         editedTweets: [
                              { position: 1, text: 'Valid first tweet' },
                              { position: 2, text: 'a'.repeat(281) }, // Invalid: too long
                              { position: 3, text: 'Valid third tweet' }
                         ]
                    });

               expect(response.status).toBe(400);
               expect(response.body.details).toEqual(
                    expect.arrayContaining([
                         expect.objectContaining({
                              message: 'Each tweet must be 280 characters or less'
                         })
                    ])
               );
          });

          it('should accept multiple valid tweets', async () => {
               const response = await request(app)
                    .post(`/api/content/${validId}/save-edits`)
                    .send({
                         editedTweets: [
                              { position: 1, text: 'First tweet in the thread' },
                              { position: 2, text: 'Second tweet in the thread' },
                              { position: 3, text: 'Third tweet in the thread' },
                              { position: 4, text: 'Fourth tweet in the thread' },
                              { position: 5, text: 'Fifth tweet in the thread' }
                         ]
                    });

               expect(response.status).toBe(200);
          });
     });

     describe('Optional deltas field', () => {
          const validId = '507f1f77bcf86cd799439011';

          it('should accept valid deltas array', async () => {
               const response = await request(app)
                    .post(`/api/content/${validId}/save-edits`)
                    .send({
                         editedText: 'Valid edited text',
                         deltas: [{ type: 'tone', value: 'more casual' }]
                    });

               expect(response.status).toBe(200);
          });

          it('should accept missing deltas field', async () => {
               const response = await request(app)
                    .post(`/api/content/${validId}/save-edits`)
                    .send({
                         editedText: 'Valid edited text'
                    });

               expect(response.status).toBe(200);
          });

          it('should reject non-array deltas', async () => {
               const response = await request(app)
                    .post(`/api/content/${validId}/save-edits`)
                    .send({
                         editedText: 'Valid edited text',
                         deltas: 'not an array'
                    });

               expect(response.status).toBe(400);
               expect(response.body.details).toEqual(
                    expect.arrayContaining([
                         expect.objectContaining({
                              field: 'deltas',
                              message: 'deltas must be an array'
                         })
                    ])
               );
          });
     });
});
