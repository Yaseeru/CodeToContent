/**
 * Snapshot Routes Validation Tests
 * Tests validation middleware and rate limiting for snapshot endpoints
 * Task 7.5: Add request validation middleware
 */

import request from 'supertest';
import express, { Express } from 'express';
import snapshotsRouter from '../snapshots';
import { authenticateToken } from '../../middleware/auth';
import jwt from 'jsonwebtoken';

// Mock the ServiceManager to avoid dependencies
jest.mock('../../services/ServiceManager');
jest.mock('../../models/User');
jest.mock('../../models/Repository');
jest.mock('../../models/CodeSnapshot');

describe('Snapshot Routes - Validation Middleware', () => {
     let app: Express;
     let validToken: string;

     beforeAll(() => {
          // Create Express app for testing
          app = express();
          app.use(express.json());
          app.use('/api/snapshots', snapshotsRouter);

          // Generate a valid JWT token for testing
          validToken = jwt.sign(
               { userId: '507f1f77bcf86cd799439011' },
               process.env.JWT_SECRET || 'test-secret',
               { expiresIn: '1h' }
          );
     });

     describe('POST /api/snapshots/generate - Validation', () => {
          it('should reject request without repositoryId', async () => {
               const response = await request(app)
                    .post('/api/snapshots/generate')
                    .set('Authorization', `Bearer ${validToken}`)
                    .send({});

               expect(response.status).toBe(400);
               expect(response.body.error).toBe('Validation failed');
               expect(response.body.details).toEqual(
                    expect.arrayContaining([
                         expect.objectContaining({
                              field: 'repositoryId',
                              message: 'repositoryId is required',
                         }),
                    ])
               );
          });

          it('should reject request with invalid repositoryId format', async () => {
               const response = await request(app)
                    .post('/api/snapshots/generate')
                    .set('Authorization', `Bearer ${validToken}`)
                    .send({ repositoryId: 'invalid-id' });

               expect(response.status).toBe(400);
               expect(response.body.error).toBe('Validation failed');
               expect(response.body.details).toEqual(
                    expect.arrayContaining([
                         expect.objectContaining({
                              field: 'repositoryId',
                              message: 'repositoryId must be a valid MongoDB ObjectId',
                         }),
                    ])
               );
          });

          it('should accept request with valid repositoryId format', async () => {
               const validRepositoryId = '507f1f77bcf86cd799439011';

               // This will fail at the service level (mocked), but validation should pass
               const response = await request(app)
                    .post('/api/snapshots/generate')
                    .set('Authorization', `Bearer ${validToken}`)
                    .send({ repositoryId: validRepositoryId });

               // Should not be a validation error (400)
               // Will be 401, 404, or 500 depending on mocked service behavior
               expect(response.status).not.toBe(400);
          });
     });

     describe('GET /api/snapshots/:repositoryId - Validation', () => {
          it('should reject request with invalid repositoryId parameter', async () => {
               const response = await request(app)
                    .get('/api/snapshots/invalid-id')
                    .set('Authorization', `Bearer ${validToken}`);

               expect(response.status).toBe(400);
               expect(response.body.error).toBe('Validation failed');
               expect(response.body.details).toEqual(
                    expect.arrayContaining([
                         expect.objectContaining({
                              field: 'repositoryId',
                              message: 'repositoryId must be a valid MongoDB ObjectId',
                         }),
                    ])
               );
          });

          it('should accept request with valid repositoryId parameter', async () => {
               const validRepositoryId = '507f1f77bcf86cd799439011';

               const response = await request(app)
                    .get(`/api/snapshots/${validRepositoryId}`)
                    .set('Authorization', `Bearer ${validToken}`);

               // Should not be a validation error (400)
               expect(response.status).not.toBe(400);
          });
     });

     describe('GET /api/snapshots/snapshot/:snapshotId - Validation', () => {
          it('should reject request with invalid snapshotId parameter', async () => {
               const response = await request(app)
                    .get('/api/snapshots/snapshot/invalid-id')
                    .set('Authorization', `Bearer ${validToken}`);

               expect(response.status).toBe(400);
               expect(response.body.error).toBe('Validation failed');
               expect(response.body.details).toEqual(
                    expect.arrayContaining([
                         expect.objectContaining({
                              field: 'snapshotId',
                              message: 'snapshotId must be a valid MongoDB ObjectId',
                         }),
                    ])
               );
          });

          it('should accept request with valid snapshotId parameter', async () => {
               const validSnapshotId = '507f1f77bcf86cd799439011';

               const response = await request(app)
                    .get(`/api/snapshots/snapshot/${validSnapshotId}`)
                    .set('Authorization', `Bearer ${validToken}`);

               // Should not be a validation error (400)
               expect(response.status).not.toBe(400);
          });
     });

     describe('DELETE /api/snapshots/:snapshotId - Validation', () => {
          it('should reject request with invalid snapshotId parameter', async () => {
               const response = await request(app)
                    .delete('/api/snapshots/invalid-id')
                    .set('Authorization', `Bearer ${validToken}`);

               expect(response.status).toBe(400);
               expect(response.body.error).toBe('Validation failed');
               expect(response.body.details).toEqual(
                    expect.arrayContaining([
                         expect.objectContaining({
                              field: 'snapshotId',
                              message: 'snapshotId must be a valid MongoDB ObjectId',
                         }),
                    ])
               );
          });

          it('should accept request with valid snapshotId parameter', async () => {
               const validSnapshotId = '507f1f77bcf86cd799439011';

               const response = await request(app)
                    .delete(`/api/snapshots/${validSnapshotId}`)
                    .set('Authorization', `Bearer ${validToken}`);

               // Should not be a validation error (400)
               expect(response.status).not.toBe(400);
          });
     });
});
