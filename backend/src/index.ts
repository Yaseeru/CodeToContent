import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';

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
