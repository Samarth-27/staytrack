// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import Models
const User = require('./models/User');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const ownerRoutes = require('./routes/ownerRoutes');
const wardenRoutes = require('./routes/wardenRoutes');
const studentRoutes = require('./routes/studentRoutes');
const wardenExtendedRoutes = require('./routes/wardenExtendedRoutes');
const aiRoutes = require('./routes/aiRoutes');
const pollRoutes = require('./routes/pollRoutes');
const securityDepositRoutes = require('./routes/securityDepositRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl) or any Vercel / localhost deployment
    if (!origin || !process.env.FRONTEND_URL || origin === process.env.FRONTEND_URL || origin.endsWith('.vercel.app') || origin.includes('localhost')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ============ ROUTE MOUNTING ============

// Authentication Routes (Login, Register, Init)
app.use('/api/auth', authRoutes);

// Owner Routes (Dashboard, Complaints, Payments, Pending Students)
app.use('/api/owner', ownerRoutes);

// Warden Routes (Students, Rooms, Complaints, Payments)
app.use('/api/warden', wardenRoutes);

// Student Routes (Profile, Complaints, Payments)
app.use('/api/student', studentRoutes);

// Extended Features (Archival, Password Mgmt, Reports)
app.use('/api', wardenExtendedRoutes);

// AI Chat Routes
app.use('/api/ai', aiRoutes);

// Service Polls & Maintenance Updates (Plumber, Electrician, AC, Rent notices)
app.use('/api/polls', pollRoutes);

// Security Deposit Exchange & Clearance System (Hostel Exit & Refund Settlement)
app.use('/api/security-deposits', securityDepositRoutes);

// ============ ERROR HANDLING ============
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  const detail = err.message || 'Internal server error';
  res.status(err.status || 500).json({ 
    message: `You have encountered an error: ${detail}. Please correct your details and try again.`, 
    error: detail 
  });
});

// ============ AUTO SEED FUNCTION ============
async function autoSeedUsers() {
  try {
    const seedData = [
      { username: 'owner', role: 'owner', name: 'StayTrack Owner', password: 'owner@123' },
      { username: 'warden', role: 'warden', name: 'StayTrack Warden', password: 'warden@123' },
      { username: 'student', role: 'student', name: 'Demo Student', password: 'student@123', roomNumber: 101 }
    ];

    for (const data of seedData) {
      const exists = await User.findOne({ username: data.username });
      if (!exists) {
        const user = new User(data);
        await user.save();
        console.log(`🌱 Auto-seeded default account: ${data.username} (${data.role})`);
      }
    }
  } catch (err) {
    console.error('⚠️ Warning: Auto-seed encountered an issue:', err.message);
  }
}

// ============ SERVER START ============
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/staytrack';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Database connected successfully');
    await autoSeedUsers();

    app.listen(PORT, () => {
      console.log(`
      ╔════════════════════════════════════════╗
      ║  🏢 STAYTRACK BACKEND RUNNING         ║
      ║  📍 http://localhost:${PORT}             ║
      ║  📚 Health: GET /api/health           ║
      ╚════════════════════════════════════════╝
      `);
    });
  })
  .catch(err => {
    console.error('❌ Database connection error:', err);
  });
