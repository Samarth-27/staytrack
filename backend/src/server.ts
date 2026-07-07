import express, { Application, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import authRoutes from './routes/authRoutes';
import wardenRoutes from './routes/wardenRoutes';

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/warden', wardenRoutes);

// Basic Route for Testing
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'success', message: 'StayTrack V2 AI API is running.' });
});

// 404 Handler (Catch-all)
app.use((req: Request, res: Response) => {
  res.status(404).json({ status: 'error', message: 'Route not found.' });
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ status: 'error', message: 'Internal Server Error' });
});

// Database Connection & Server Start
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/staytrack-v2';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    app.listen(PORT, () => {
      console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    // process.exit(1); removed so nodemon doesn't crash loop
  });
