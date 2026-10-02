// backend/routes/studentRoutes.js
const express = require('express');
const { verifyToken, checkRole } = require('../middleware/auth');
const User = require('../models/User');
const Room = require('../models/Room');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
const { generateMissingPayments } = require('../utils/paymentGenerator');

const router = express.Router();

/**
 * UPDATE PRESENCE STATUS
 * Student can mark if they are in the hostel or at home
 */
router.put('/presence', verifyToken, checkRole(['student']), async (req, res) => {
  try {
    const { presenceStatus } = req.body;
    if (!['in_hostel', 'on_leave'].includes(presenceStatus)) {
      return res.status(400).json({ message: 'Invalid presence status' });
    }
    
    const student = await User.findByIdAndUpdate(
      req.user.userId,
      { presenceStatus },
      { new: true }
    );
    res.json({ message: 'Presence status updated', presenceStatus: student.presenceStatus });
  } catch (error) {
    res.status(500).json({ message: 'Error updating presence status', error: error.message });
  }
});

/**
 * GET STUDENT PROFILE
 * Returns student info and room details with roommates
 */
router.get('/profile', verifyToken, checkRole(['student']), async (req, res) => {
  try {
    const student = await User.findById(req.user.userId).select('-password');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    let room = null;
    if (student.roomNumber) {
      room = await Room.findOne({ roomNumber: student.roomNumber }).populate('students', '-password');
    }
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
    if (!title || !description || !category) {
      return res.status(400).json({ 
        message: 'You have encountered an error: Title, description, or category is missing. Please correct your details and submit again.' 
      });
    }

    const student = await User.findById(req.user.userId);
    if (!student) {
      return res.status(404).json({ message: 'You have encountered an error: Student account not found. Please log in again.' });
    }

    let room = null;
    if (student.roomNumber) {
      room = await Room.findOne({ roomNumber: student.roomNumber });
    }

    if (!room) {
      return res.status(400).json({ 
        message: 'You have encountered an error: No valid room assigned. Please contact the warden to allocate your room details before submitting complaints.' 
      });
    }

    const complaint = new Complaint({
      student: req.user.userId,
      room: room._id,
      title,
      description,
      category,
      priority: priority || 'medium'
    });

    await complaint.save();

    // Trigger AI Analysis asynchronously
    const analyzeComplaint = require('../utils/aiComplaintAnalyzer');
    analyzeComplaint(complaint._id, title, description).catch(err => console.error('AI Analysis trigger error:', err));

    res.status(201).json({ message: 'Complaint submitted', complaint });
  } catch (error) {
    res.status(500).json({ message: `You have encountered an error: ${error.message}. Please correct your details and try again.`, error: error.message });
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
    res.status(500).json({ message: `You have encountered an error: ${error.message}. Please correct your details and try again.`, error: error.message });
  }
});

/**
 * MAKE PAYMENT
 * Student pays monthly rent (Rs 3500)
 */
router.post('/payment', verifyToken, checkRole(['student']), async (req, res) => {
  try {
    const { month, messMode, rentMode, messTransactionId, messScreenshotUrl, rentTransactionId, rentScreenshotUrl, screenshotUrl } = req.body;

    const monthRegex = /^\d{4}-\d{2}$/;
    if (!month || !monthRegex.test(month)) {
      return res.status(400).json({ message: 'You have encountered an error: Invalid month format. Please correct your details to use YYYY-MM.' });
    }

    const currentMonthStr = new Date().toISOString().slice(0, 7);
    if (month > currentMonthStr) {
      return res.status(400).json({ message: 'You have encountered an error: Cannot submit payments for future months. Please correct your month selection.' });
    }
    
    if (messMode === 'online' && !messTransactionId && !messScreenshotUrl) {
      return res.status(400).json({ message: 'You have encountered an error: Transaction ID or screenshot is required for online mess payment. Please correct your details and upload proof.' });
    }
    if (rentMode === 'online' && !rentTransactionId && !rentScreenshotUrl) {
      return res.status(400).json({ message: 'You have encountered an error: Transaction ID or screenshot is required for online rent payment. Please correct your details and upload proof.' });
    }

    const student = await User.findById(req.user.userId);
    let room = null;
    if (student.roomNumber) {
      room = await Room.findOne({ roomNumber: student.roomNumber });
    }
    const roomId = room ? room._id : null;

    let payment = await Payment.findOne({ student: req.user.userId, month });
    
    const onlineAmount = (messMode === 'online' ? 5000 : 0) + (rentMode === 'online' ? 3500 : 0);
    const cashAmount = (messMode === 'cash' ? 5000 : 0) + (rentMode === 'cash' ? 3500 : 0);
    const hasScreenshot = !!(messScreenshotUrl || rentScreenshotUrl);

    if (payment) {
      if (payment.status === 'paid') {
        return res.status(400).json({ message: 'Payment for this month has already been verified and paid.' });
      }
      payment.status = 'pending_verification';
      payment.messTransactionId = messTransactionId;
      payment.messScreenshotUrl = messScreenshotUrl;
      payment.rentTransactionId = rentTransactionId;
      payment.rentScreenshotUrl = rentScreenshotUrl;
      payment.onlineAmount = onlineAmount;
      payment.cashAmount = cashAmount;
      payment.amount = onlineAmount + cashAmount;
      payment.hasScreenshot = hasScreenshot;
      await payment.save();
    } else {
      payment = new Payment({
        student: req.user.userId,
        room: roomId,
        month,
        status: 'pending_verification',
        messTransactionId,
        messScreenshotUrl,
        rentTransactionId,
        rentScreenshotUrl,
        onlineAmount,
        cashAmount,
        amount: onlineAmount + cashAmount,
        hasScreenshot
      });
      await payment.save();
    }

    const ocrUrl = messScreenshotUrl || rentScreenshotUrl || screenshotUrl;
    if (ocrUrl) {
      const processReceiptOCR = require('../utils/aiOcrService');
      processReceiptOCR(payment._id, ocrUrl).catch(err => console.error('AI OCR trigger error:', err));
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
    await generateMissingPayments();

    const payments = await Payment.find({ student: req.user.userId })
      .select('-screenshotUrl')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payments', error: error.message });
  }
});

module.exports = router;
