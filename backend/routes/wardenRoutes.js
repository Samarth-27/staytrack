// backend/routes/wardenRoutes.js
const express = require('express');
const { verifyToken, checkRole } = require('../middleware/auth');
const User = require('../models/User');
const Room = require('../models/Room');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');

const router = express.Router();

/**
 * GET ALL STUDENTS
 * Warden can see all students to manage them
 */
router.get('/students', verifyToken, checkRole(['warden']), async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password');
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
});

/**
 * ASSIGN STUDENT TO ROOM
 * Warden assigns student to room (max 2 per room)
 */
router.post('/assign-room', verifyToken, checkRole(['warden']), async (req, res) => {
  try {
    const { studentId, roomNumber } = req.body;

    let room = await Room.findOne({ roomNumber });
    if (!room) {
      room = new Room({ roomNumber });
    }

    // We no longer push to room.students since occupancy is dynamic based on User collection.
    // We just check if the room would be full.
    const occupants = await User.countDocuments({ roomNumber, status: { $ne: 'archived' } });
    if (occupants >= room.capacity) {
      return res.status(400).json({ message: 'Room is full' });
    }

    if (occupants + 1 >= room.capacity) {
      room.status = 'occupied';
    } else {
      room.status = 'vacant';
    }
    await room.save();

    await User.findByIdAndUpdate(studentId, { roomNumber });

    res.json({ message: 'Student assigned to room', room });
  } catch (error) {
    res.status(500).json({ message: 'Error assigning room', error: error.message });
  }
});

/**
 * GET ALL ROOMS
 * Warden can see all rooms with their occupants
 */
router.get('/rooms', verifyToken, checkRole(['warden', 'owner']), async (req, res) => {
  try {
    const rooms = await Room.find().lean();
    const students = await User.find({ role: 'student', status: { $ne: 'archived' } }).select('-password').lean();
    
    const roomsWithOccupants = rooms.map(r => {
      const occupants = students.filter(s => s.roomNumber === r.roomNumber);
      return {
        ...r,
        students: occupants,
        status: occupants.length >= r.capacity ? 'occupied' : 'vacant'
      };
    });
    
    res.json(roomsWithOccupants);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching rooms', error: error.message });
  }
});

/**
 * GET ALL COMPLAINTS
 * Warden can see all complaints to handle them
 */
router.get('/complaints', verifyToken, checkRole(['warden']), async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate('student', 'name roomNumber')
      .populate('room', 'roomNumber')
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching complaints', error: error.message });
  }
});

/**
 * UPDATE COMPLAINT STATUS
 * Warden updates: open → in-progress → resolved
 */
router.put('/complaint/:id', verifyToken, checkRole(['warden']), async (req, res) => {
  try {
    const { status, wardenResponse } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status, wardenResponse, resolvedAt: status === 'resolved' ? Date.now() : null },
      { new: true }
    );
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Error updating complaint', error: error.message });
  }
});

/**
 * GET ALL PAYMENTS
 * Warden tracks student payments
 */
router.get('/payments', verifyToken, checkRole(['warden']), async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('student', 'name roomNumber')
      .populate('room', 'roomNumber')
      .select('-screenshotUrl')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payments', error: error.message });
  }
});

/**
 * MARK PAYMENT AS PAID
 * Warden confirms when student pays
 */
router.put('/payment/:id', verifyToken, checkRole(['warden']), async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { status: 'paid', paidDate: Date.now() },
      { new: true }
    );
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Error updating payment', error: error.message });
  }
});

/**
 * REJECT PAYMENT
 * Warden rejects a fake or incorrect payment proof
 */
router.put('/payment/:id/reject', verifyToken, checkRole(['warden']), async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'pending', 
        screenshotUrl: null, 
        hasScreenshot: false, 
        transactionId: null 
      },
      { new: true }
    );
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting payment', error: error.message });
  }
});

module.exports = router;
