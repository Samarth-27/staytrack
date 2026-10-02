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

    // Compute completion if not already computed
    if (student.profileCompletionPercentage === undefined || student.profileCompletionPercentage === 0) {
      student.calculateProfileCompletion();
      await student.save();
    }

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
 * UPDATE STUDENT PROFILE (KYC, STUDY STATUS & ACADEMICS)
 * Student updates comprehensive details: Aadhaar, Study Status, College, Guardians, Address, etc.
 */
router.put('/profile', verifyToken, checkRole(['student']), async (req, res) => {
  try {
    const student = await User.findById(req.user.userId);
    if (!student) {
      return res.status(404).json({ 
        message: 'You have encountered an error: Student account not found. Please correct your details and try again.' 
      });
    }

    const {
      name,
      phone,
      email,
      aadharNumber,
      dob,
      gender,
      bloodGroup,
      studyStatus,
      collegeName,
      course,
      branch,
      currentYear,
      enrollmentNumber,
      fatherName,
      fatherPhone,
      motherName,
      motherPhone,
      guardianName,
      guardianRelation,
      guardianPhone,
      guardianEmail,
      emergencyContactName,
      emergencyContactRelation,
      emergencyContactPhone,
      permanentAddress,
      city,
      state,
      pincode,
      foodPreference,
      vehicleNumber,
      medicalConditions
    } = req.body;

    // Aadhaar Validation: If provided, must be 12 digits
    if (aadharNumber !== undefined && aadharNumber !== null && String(aadharNumber).trim() !== '') {
      const cleanAadhar = String(aadharNumber).replace(/[\s-]/g, '');
      if (!/^\d{12}$/.test(cleanAadhar)) {
        return res.status(400).json({ 
          message: 'You have encountered an error: Aadhaar number must be a valid 12-digit number. Please correct your details and try again.' 
        });
      }
      student.aadharNumber = cleanAadhar;
    }

    // Phone Validation: If provided, must be 10 digits
    if (phone !== undefined && phone !== null && String(phone).trim() !== '') {
      const cleanPhone = String(phone).replace(/[\s-]/g, '');
      if (!/^\d{10}$/.test(cleanPhone)) {
        return res.status(400).json({ 
          message: 'You have encountered an error: Phone number must be a valid 10-digit number. Please correct your details and try again.' 
        });
      }
      student.phone = cleanPhone;
    }

    // Guardian Phone Validation: If provided, must be 10 digits
    if (guardianPhone !== undefined && guardianPhone !== null && String(guardianPhone).trim() !== '') {
      const cleanGPhone = String(guardianPhone).replace(/[\s-]/g, '');
      if (!/^\d{10}$/.test(cleanGPhone)) {
        return res.status(400).json({ 
          message: 'You have encountered an error: Guardian phone number must be a valid 10-digit number. Please correct your details and try again.' 
        });
      }
      student.guardianPhone = cleanGPhone;
    }

    // Emergency Contact Phone Validation: If provided, must be 10 digits
    if (emergencyContactPhone !== undefined && emergencyContactPhone !== null && String(emergencyContactPhone).trim() !== '') {
      const cleanEPhone = String(emergencyContactPhone).replace(/[\s-]/g, '');
      if (!/^\d{10}$/.test(cleanEPhone)) {
        return res.status(400).json({ 
          message: 'You have encountered an error: Emergency contact phone number must be a valid 10-digit number. Please correct your details and try again.' 
        });
      }
      student.emergencyContactPhone = cleanEPhone;
    }

    // Pincode Validation: If provided, must be 6 digits
    if (pincode !== undefined && pincode !== null && String(pincode).trim() !== '') {
      const cleanPin = String(pincode).replace(/\s/g, '');
      if (!/^\d{6}$/.test(cleanPin)) {
        return res.status(400).json({ 
          message: 'You have encountered an error: PIN code must be a valid 6-digit number. Please correct your details and try again.' 
        });
      }
      student.pincode = cleanPin;
    }

    // Basic & Personal
    if (name && name.trim()) student.name = name.trim();
    if (email !== undefined) student.email = email.trim();
    if (dob !== undefined) student.dob = dob;
    if (gender !== undefined) student.gender = gender;
    if (bloodGroup !== undefined) student.bloodGroup = bloodGroup;

    // Academic & Study Status
    if (studyStatus !== undefined) student.studyStatus = studyStatus;
    if (collegeName !== undefined) student.collegeName = collegeName.trim();
    if (course !== undefined) student.course = course.trim();
    if (branch !== undefined) student.branch = branch.trim();
    if (currentYear !== undefined) student.currentYear = currentYear;
    if (enrollmentNumber !== undefined) student.enrollmentNumber = enrollmentNumber.trim();

    // Parents & Guardian
    if (fatherName !== undefined) student.fatherName = fatherName.trim();
    if (fatherPhone !== undefined) student.fatherPhone = fatherPhone.trim();
    if (motherName !== undefined) student.motherName = motherName.trim();
    if (motherPhone !== undefined) student.motherPhone = motherPhone.trim();
    if (guardianName !== undefined) student.guardianName = guardianName.trim();
    if (guardianRelation !== undefined) student.guardianRelation = guardianRelation.trim();
    if (guardianEmail !== undefined) student.guardianEmail = guardianEmail.trim();

    // Emergency Contact
    if (emergencyContactName !== undefined) student.emergencyContactName = emergencyContactName.trim();
    if (emergencyContactRelation !== undefined) student.emergencyContactRelation = emergencyContactRelation.trim();

    // Address
    if (permanentAddress !== undefined) student.permanentAddress = permanentAddress.trim();
    if (city !== undefined) student.city = city.trim();
    if (state !== undefined) student.state = state.trim();

    // Hostel Preferences
    if (foodPreference !== undefined) student.foodPreference = foodPreference;
    if (vehicleNumber !== undefined) student.vehicleNumber = vehicleNumber.trim();
    if (medicalConditions !== undefined) student.medicalConditions = medicalConditions.trim();

    // Calculate Completion
    student.calculateProfileCompletion();
    student.profileUpdatedAt = new Date();

    await student.save();

    const updatedProfile = await User.findById(student._id).select('-password');
    let room = null;
    if (updatedProfile.roomNumber) {
      room = await Room.findOne({ roomNumber: updatedProfile.roomNumber }).populate('students', '-password');
    }

    res.json({
      message: 'Student profile updated successfully',
      student: updatedProfile,
      room
    });
  } catch (error) {
    res.status(500).json({ 
      message: `You have encountered an error: ${error.message}. Please correct your details and try again.`, 
      error: error.message 
    });
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
