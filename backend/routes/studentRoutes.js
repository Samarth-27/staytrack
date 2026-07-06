// backend/routes/studentRoutes.js
const express = require('express');
const { verifyToken, checkRole } = require('../middleware/auth');
const User = require('../models/User');
const Room = require('../models/Room');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');

const router = express.Router();

/**
 * GET STUDENT PROFILE
 * Returns student info and room details with roommates
 */
router.get('/profile', verifyToken, checkRole(['student']), async (req, res) => {
  try {
    const student = await User.findById(req.user.userId).select('-password');
    const room = await Room.findOne({ roomNumber: student.roomNumber }).populate('students', '-password');
    res.json({ student, room });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

/**
 * SUBMIT COMPLAINT
 * Student can submit complaints about room/utilities
 */
router.post('/complaint', verifyToken, checkRole(['student']), async (req, res) => {
  try {
    const { title, description, category, priority } = req.body;
    const student = await User.findById(req.user.userId);
    const room = await Room.findOne({ roomNumber: student.roomNumber });

    const complaint = new Complaint({
      student: req.user.userId,
      room: room._id,
      title,
      description,
      category,
      priority
    });

    await complaint.save();

    // Trigger AI Analysis asynchronously
    const analyzeComplaint = require('../utils/aiComplaintAnalyzer');
    analyzeComplaint(complaint._id, title, description).catch(err => console.error('AI Analysis trigger error:', err));

    res.status(201).json({ message: 'Complaint submitted', complaint });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting complaint', error: error.message });
  }
});

/**
 * GET MY COMPLAINTS
 * Student can view their own complaints
 */
router.get('/complaints', verifyToken, checkRole(['student']), async (req, res) => {
  try {
    const complaints = await Complaint.find({ student: req.user.userId })
      .populate('room', 'roomNumber')
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching complaints', error: error.message });
  }
});

/**
 * MAKE PAYMENT
 * Student pays monthly rent (Rs 3500)
 */
router.post('/payment', verifyToken, checkRole(['student']), async (req, res) => {
  try {
    const { month, transactionId, onlineAmount, cashAmount, screenshotUrl } = req.body;
    
    if (Number(onlineAmount) > 0 && !transactionId && !screenshotUrl) {
      return res.status(400).json({ message: 'Transaction ID or screenshot is required for online payments' });
    }

    const student = await User.findById(req.user.userId);
    
    let room = null;
    if (student.roomNumber) {
      room = await Room.findOne({ roomNumber: student.roomNumber });
    }

    // Ensure room exists, otherwise just omit room or fail
    const roomId = room ? room._id : null;

    // Try to find existing payment for this month, otherwise create one
    let payment = await Payment.findOne({ student: req.user.userId, month });
    
    if (payment) {
      payment.status = 'pending_verification'; // Changed from 'paid' to require Warden approval
      payment.transactionId = transactionId;
      payment.onlineAmount = onlineAmount || 0;
      payment.cashAmount = cashAmount || 0;
      payment.amount = (Number(onlineAmount) || 0) + (Number(cashAmount) || 0);
      payment.screenshotUrl = screenshotUrl;
      payment.hasScreenshot = !!screenshotUrl;
      await payment.save();
    } else {
      payment = new Payment({
        student: req.user.userId,
        room: roomId,
        month,
        status: 'pending_verification', // Require Warden approval
        transactionId,
        onlineAmount: onlineAmount || 0,
        cashAmount: cashAmount || 0,
        amount: (Number(onlineAmount) || 0) + (Number(cashAmount) || 0),
        screenshotUrl,
        hasScreenshot: !!screenshotUrl
      });
      await payment.save();
    }

    // Trigger AI OCR asynchronously if a screenshot was provided
    if (screenshotUrl) {
      const processReceiptOCR = require('../utils/aiOcrService');
      processReceiptOCR(payment._id, screenshotUrl).catch(err => console.error('AI OCR trigger error:', err));
    }

    res.json({ message: 'Payment recorded', payment });
  } catch (error) {
    res.status(500).json({ message: 'Error processing payment', error: error.message });
  }
});

/**
 * GET MY PAYMENT HISTORY
 * Student can view all their payments
 */
router.get('/payments', verifyToken, checkRole(['student']), async (req, res) => {
  try {
    // Auto-generate missing payments from student's joined month up to current month
    const student = await User.findById(req.user.userId);
    const room = student.roomNumber ? await Room.findOne({ roomNumber: student.roomNumber }) : null;
    
    let current = new Date(student.createdAt);
    current.setDate(1); // Start of month
    const now = new Date();
    
    while (current <= now) {
      const monthStr = current.toISOString().slice(0, 7);
      const existing = await Payment.findOne({ student: student._id, month: monthStr });
      if (!existing) {
        await new Payment({
          student: student._id,
          room: room ? room._id : null,
          month: monthStr,
          status: 'pending'
        }).save();
      }
      current.setMonth(current.getMonth() + 1);
    }

    const payments = await Payment.find({ student: req.user.userId })
      .select('-screenshotUrl')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payments', error: error.message });
  }
});

module.exports = router;
