// backend/routes/ownerRoutes.js
const express = require('express');
const { verifyToken, checkRole } = require('../middleware/auth');
const User = require('../models/User');
const Room = require('../models/Room');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
const { generateMissingPayments } = require('../utils/paymentGenerator');

const router = express.Router();

/**
 * OWNER DASHBOARD OVERVIEW
 * Returns: Total students, rooms, payments, complaints, pending amount
 */
router.get('/dashboard', verifyToken, checkRole(['owner']), async (req, res) => {
  try {
    await generateMissingPayments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalRooms = await Room.countDocuments();
    const occupiedRooms = await Room.countDocuments({ status: 'occupied' });
    const pendingPayments = await Payment.countDocuments({ status: 'pending' });
    const paidPayments = await Payment.countDocuments({ status: 'paid' });
    const openComplaints = await Complaint.countDocuments({ status: 'open' });
    
    const totalPending = await Payment.aggregate([
      { $match: { status: 'pending' } },
      { $group: { _id: null, total: { $sum: { $add: ["$amount", { $ifNull: ["$penaltyAmount", 0] }] } } } }
    ]);

    const studentsInMess = await User.countDocuments({ role: 'student', status: 'active', presenceStatus: 'in_hostel' });

    res.json({
      totalStudents,
      studentsInMess,
      totalRooms,
      occupiedRooms,
      vacantRooms: totalRooms - occupiedRooms,
      pendingPayments,
      paidPayments,
      openComplaints,
      totalPendingAmount: totalPending[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard', error: error.message });
  }
});

/**
 * GET ALL COMPLAINTS
 * Owner can see all complaints from all students
 */
router.get('/complaints', verifyToken, checkRole(['owner']), async (req, res) => {
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
 * GET ALL PAYMENTS
 * Owner can see all payment records
 */
router.get('/payments', verifyToken, checkRole(['owner']), async (req, res) => {
  try {
    await generateMissingPayments();
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
 * GET PENDING STUDENTS REPORT
 * Shows students with pending payments - critical for owner
 */
router.get('/pending-students', verifyToken, checkRole(['owner']), async (req, res) => {
  try {
    await generateMissingPayments();

    const pendingPayments = await Payment.find({ status: 'pending' })
      .populate('student', 'name phone roomNumber')
      .populate('room', 'roomNumber')
      .select('-screenshotUrl')
      .sort({ createdAt: -1 });
    res.json(pendingPayments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending students', error: error.message });
  }
});

module.exports = router;
