// backend/routes/authRoutes.js
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

/**
 * LOGIN ROUTE
 * Takes username & password, returns JWT token
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.status === 'archived') {
      return res.status(403).json({ message: 'Account suspended. Please contact the warden.' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'staytrack-secret-2024',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        roomNumber: user.roomNumber
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Login error', error: error.message });
  }
});

/**
 * REGISTER ROUTE
 * Creates new user account (student/warden/owner)
 */
router.post('/register', async (req, res) => {
  try {
    const { name, username, password, role, phone, roomNumber } = req.body;

    if (!name || !username || !password || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (role !== 'student') {
      return res.status(403).json({ message: 'Unauthorized: Can only register as student' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const user = new User({
      name,
      username,
      password,
      role,
      phone,
      roomNumber: role === 'student' ? roomNumber : null
    });

    await user.save();
    res.status(201).json({ message: 'User created successfully', userId: user._id });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

/**
 * SYSTEM INITIALIZATION
 * Creates default owner and warden (run once)
 */
router.post('/init', async (req, res) => {
  try {
    const existingOwner = await User.findOne({ role: 'owner' });
    if (existingOwner) {
      return res.json({ message: 'System already initialized' });
    }

    const owner = new User({
      name: 'StayTrack Owner',
      username: 'owner',
      password: 'owner@123',
      role: 'owner',
      phone: '9999999999'
    });

    const warden = new User({
      name: 'StayTrack Warden',
      username: 'warden',
      password: 'warden@123',
      role: 'warden',
      phone: '9999999998'
    });

    await owner.save();
    await warden.save();

    res.json({
      message: 'System initialized successfully',
      credentials: {
        owner: { username: 'owner', password: 'owner@123' },
        warden: { username: 'warden', password: 'warden@123' }
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error initializing system', error: error.message });
  }
});

/**
 * CHANGE PASSWORD
 * Allows any logged-in user to change their password safely
 */
const { verifyToken } = require('../middleware/auth');
router.put('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId);
    
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
