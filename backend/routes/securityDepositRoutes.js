// backend/routes/securityDepositRoutes.js
const express = require('express');
const { verifyToken, checkRole } = require('../middleware/auth');
const User = require('../models/User');
const Room = require('../models/Room');
const SecurityDeposit = require('../models/SecurityDeposit');

const router = express.Router();

/**
 * GET ALL SECURITY DEPOSIT CLEARANCES (WARDEN & OWNER)
 * Lists all students who have left the hostel and are awaiting or received their security deposit refund
 */
router.get('/', verifyToken, checkRole(['warden', 'owner']), async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== 'all') {
      filter.refundStatus = status;
    }

    const deposits = await SecurityDeposit.find(filter)
      .populate('student', 'name username phone email aadharNumber roomNumber')
      .populate('refundDetails.refundedBy', 'name role')
      .sort({ vacatedAt: -1 });

    // Aggregate statistics
    const allRecords = await SecurityDeposit.find();
    const pendingRecords = allRecords.filter(d => d.refundStatus === 'pending_clearance');
    const refundedRecords = allRecords.filter(d => d.refundStatus === 'refunded');

    const totalPendingRefundAmount = pendingRecords.reduce((sum, d) => sum + (d.netRefundAmount || d.originalDepositAmount || 0), 0);
    const totalRefundedAmount = refundedRecords.reduce((sum, d) => sum + (d.netRefundAmount || 0), 0);
    const totalDeductionsAmount = refundedRecords.reduce((sum, d) => sum + (d.deductionAmount || 0), 0);

    res.json({
      deposits,
      stats: {
        totalDeposits: allRecords.length,
        pendingCount: pendingRecords.length,
        refundedCount: refundedRecords.length,
        totalPendingRefundAmount,
        totalRefundedAmount,
        totalDeductionsAmount
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: `You have encountered an error: ${error.message}. Please correct your details and try again.`, 
      error: error.message 
    });
  }
});

/**
 * INITIATE STUDENT CHECKOUT & MOVE TO SECURITY DEPOSIT LIST (WARDEN / OWNER)
 * When student leaves hostel:
 * 1. Deleted from room
 * 2. Room is freed & occupancy status updated
 * 3. Passed to Security Deposit Exchange list awaiting refund
 */
router.post('/checkout-student', verifyToken, checkRole(['warden', 'owner']), async (req, res) => {
  try {
    const { studentId, leaveReason, originalDepositAmount, deductionAmount, deductionReason, bankDetails } = req.body;

    if (!studentId) {
      return res.status(400).json({ 
        message: 'You have encountered an error: Student ID is required. Please correct your details and try again.' 
      });
    }

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ 
        message: 'You have encountered an error: Student not found. Please correct your details and try again.' 
      });
    }

    if (student.status === 'archived') {
      return res.status(400).json({ 
        message: 'You have encountered an error: Student is already archived. Please correct your details and try again.' 
      });
    }

    const wardenId = req.user.userId || req.user._id;
    const { depositRecord } = await student.leaveHostel(
      leaveReason || 'Checkout & Hostel Exit',
      wardenId,
      originalDepositAmount || 5000,
      bankDetails || {}
    );

    if (deductionAmount !== undefined) {
      depositRecord.deductionAmount = Number(deductionAmount) || 0;
      depositRecord.deductionReason = deductionReason || '';
      depositRecord.netRefundAmount = Math.max(0, depositRecord.originalDepositAmount - depositRecord.deductionAmount);
      await depositRecord.save();
    }

    res.json({
      message: `Student ${student.name} has vacated their room and passed to the Security Deposit Exchange list.`,
      depositRecord,
      student
    });
  } catch (error) {
    res.status(500).json({ 
      message: `You have encountered an error: ${error.message}. Please correct your details and try again.`, 
      error: error.message 
    });
  }
});

/**
 * STUDENT SELF-SERVICE CHECKOUT REQUEST
 * Student requests to vacate hostel and submit their bank/UPI details for security refund
 */
router.post('/student-request', verifyToken, checkRole(['student']), async (req, res) => {
  try {
    const { leaveReason, bankDetails } = req.body;

    const student = await User.findById(req.user.userId);
    if (!student) {
      return res.status(404).json({ 
        message: 'You have encountered an error: Student account not found. Please log in again.' 
      });
    }

    if (student.status === 'pending_security_refund') {
      return res.status(400).json({ 
        message: 'You have already submitted a hostel exit request. Your security deposit clearance is currently pending with the warden.' 
      });
    }

    const { depositRecord } = await student.leaveHostel(
      leaveReason || 'Student Requested Hostel Exit',
      null,
      5000,
      bankDetails || {}
    );

    res.json({
      message: 'Your hostel exit request has been submitted. Your room has been vacated and your security deposit refund is pending with the warden.',
      depositRecord
    });
  } catch (error) {
    res.status(500).json({ 
      message: `You have encountered an error: ${error.message}. Please correct your details and try again.`, 
      error: error.message 
    });
  }
});

/**
 * PROCESS & PASS SECURITY DEPOSIT REFUND (WARDEN / OWNER)
 * Marks security deposit as refunded back to the student, records payment transaction, and completes clearance
 */
router.put('/:id/refund', verifyToken, checkRole(['warden', 'owner']), async (req, res) => {
  try {
    const { deductionAmount, deductionReason, refundMode, transactionId, notes, roomKeyReturned, roomInspectionPassed } = req.body;

    if (!refundMode) {
      return res.status(400).json({ 
        message: 'You have encountered an error: Refund payment mode (UPI, Bank Transfer, or Cash) is required. Please correct your details and try again.' 
      });
    }

    if (['UPI', 'Bank Transfer'].includes(refundMode) && !transactionId) {
      return res.status(400).json({ 
        message: 'You have encountered an error: Transaction Reference / UTR ID is required for online refunds. Please correct your details and try again.' 
      });
    }

    const deposit = await SecurityDeposit.findById(req.params.id);
    if (!deposit) {
      return res.status(404).json({ 
        message: 'You have encountered an error: Security deposit record not found. Please correct your details and try again.' 
      });
    }

    if (deposit.refundStatus === 'refunded') {
      return res.status(400).json({ 
        message: 'This security deposit has already been refunded and cleared.' 
      });
    }

    // Apply deductions
    const deductions = Number(deductionAmount) || 0;
    deposit.deductionAmount = deductions;
    deposit.deductionReason = deductionReason || (deductions > 0 ? 'Room repair / maintenance deductions' : 'No deductions');
    deposit.netRefundAmount = Math.max(0, deposit.originalDepositAmount - deductions);

    // Apply checklist
    if (roomKeyReturned !== undefined) deposit.checklist.roomKeyReturned = Boolean(roomKeyReturned);
    if (roomInspectionPassed !== undefined) deposit.checklist.roomInspectionPassed = Boolean(roomInspectionPassed);

    // Settle refund
    deposit.refundStatus = 'refunded';
    deposit.refundDetails = {
      refundMode,
      transactionId: transactionId || 'CASH_SETTLED',
      refundedAt: new Date(),
      refundedBy: req.user.userId || req.user._id,
      refundedByName: req.user.name || 'Warden',
      notes: notes || 'Security deposit refunded back upon hostel exit'
    };

    await deposit.save();

    // Finalize student status to archived
    if (deposit.student) {
      await User.findByIdAndUpdate(deposit.student, {
        status: 'archived',
        isActive: false
      });
    }

    res.json({
      message: `Security deposit of ₹${deposit.netRefundAmount} successfully refunded via ${refundMode}. Clearance complete!`,
      deposit
    });
  } catch (error) {
    res.status(500).json({ 
      message: `You have encountered an error: ${error.message}. Please correct your details and try again.`, 
      error: error.message 
    });
  }
});

/**
 * STUDENT GET MY SECURITY DEPOSIT STATUS
 */
router.get('/my-status', verifyToken, checkRole(['student']), async (req, res) => {
  try {
    const deposit = await SecurityDeposit.findOne({ student: req.user.userId }).sort({ createdAt: -1 });
    res.json({ deposit });
  } catch (error) {
    res.status(500).json({ 
      message: `You have encountered an error: ${error.message}. Please correct your details and try again.`, 
      error: error.message 
    });
  }
});

module.exports = router;
