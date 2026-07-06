// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import Routes
const authRoutes = require('./routes/authRoutes');
const ownerRoutes = require('./routes/ownerRoutes');
const wardenRoutes = require('./routes/wardenRoutes');
const studentRoutes = require('./routes/studentRoutes');
const wardenExtendedRoutes = require('./routes/wardenExtendedRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database Connection
mongoose.connect(
  process.env.MONGO_URI || 'mongodb://localhost:27017/staytrack'
)
.then(() => console.log('✅ Database connected'))
.catch(err => console.log('❌ Database error:', err));

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
const aiRoutes = require('./routes/aiRoutes');
app.use('/api/ai', aiRoutes);

// ============ ERROR HANDLING ============
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Server error', error: err.message });
});

// ============ SERVER START ============
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║  🏢 STAYTRACK BACKEND RUNNING         ║
  ║  📍 http://localhost:${PORT}             ║
  ║  📚 Init: POST /api/auth/init         ║
  ╚════════════════════════════════════════╝
  `);
});
