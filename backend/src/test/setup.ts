import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Use test database
const TEST_DB_URI = process.env.MONGODB_URI?.replace('CodeToContent', 'CodeToContent_Test') || 'mongodb://localhost:27017/CodeToContent_Test';

// Setup before all tests
beforeAll(async () => {
     await mongoose.connect(TEST_DB_URI);
}, 60000); // 60 second timeout for MongoDB connection

// Cleanup after all tests
afterAll(async () => {
     // Clean up test database
     const collections = mongoose.connection.collections;
     for (const key in collections) {
          await collections[key].deleteMany({});
     }
     await mongoose.disconnect();
}, 60000);

// Clear database between tests
afterEach(async () => {
     const collections = mongoose.connection.collections;
     for (const key in collections) {
          await collections[key].deleteMany({});
     }
});
