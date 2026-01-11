import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { connectDatabase } from './config/database';
import authRoutes from './routes/auth';
import repositoryRoutes from './routes/repositories';
import contentRoutes from './routes/content';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
     origin: process.env.FRONTEND_URL || 'http://localhost:3000',
     credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
     res.json({ status: 'ok', message: 'CodeToContent API is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/repositories', repositoryRoutes);
app.use('/api/content', contentRoutes);

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
     const frontendPath = path.join(__dirname, '../../frontend/dist');
     app.use(express.static(frontendPath));

     // Serve index.html for all other routes (SPA fallback)
     app.get('*', (req, res) => {
          res.sendFile(path.join(frontendPath, 'index.html'));
     });
}

// Start server
const startServer = async () => {
     try {
          await connectDatabase();

          app.listen(PORT, () => {
               console.log(`Backend server running on port ${PORT}`);
          });
     } catch (error) {
          console.error('Failed to start server:', error);
          process.exit(1);
     }
};

startServer();

export default app;
