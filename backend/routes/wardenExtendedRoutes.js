// backend/routes/wardenExtendedRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
const { verifyToken, checkRole } = require('../middleware/auth');
const { 
  generateSecurePassword, 
  generatePaymentReport, 
  generateStudentRoster, 
  generateComplaintReport 
} = require('../utils/helpers');

// 1. STUDENT ARCHIVAL SYSTEM

// Archive a student
router.post('/warden/archive-student/:id', verifyToken, checkRole(['warden', 'owner']), async (req, res) => {
  try {
    const { reason } = req.body;
    const student = await User.findOne({ _id: req.params.id, role: 'student' });
    
    if (!student) return res.status(404).json({ message: 'Student not found' });
    if (student.status === 'archived') return res.status(400).json({ message: 'Already archived' });
    
    // Check pending payments (schema field is 'student', not 'studentId')
    const pendingPayments = await Payment.countDocuments({ student: student._id, status: 'pending' });
    if (pendingPayments > 0) {
      return res.status(400).json({ message: `Cannot archive: Student has ${pendingPayments} pending payments.` });
    }
    
    // Check open complaints (schema field is 'student', status can be 'open', 'in-progress', or 'in_progress')
    const openComplaints = await Complaint.countDocuments({ 
      student: student._id, 
      status: { $in: ['open', 'in-progress', 'in_progress'] } 
    });
    if (openComplaints > 0) {
      return res.status(400).json({ message: `Cannot archive: Student has ${openComplaints} open complaints.` });
    }
    
    // Archive
    const wardenId = req.user ? (req.user.userId || req.user._id) : null;
    await student.archiveStudent(reason || 'Checkout', wardenId);
    res.json({ message: 'Student archived successfully', student });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reactivate a student
router.put('/warden/reactivate-student/:id', verifyToken, checkRole(['warden', 'owner']), async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: 'student' });
    
    if (!student) return res.status(404).json({ message: 'Student not found' });
    if (student.status !== 'archived') return res.status(400).json({ message: 'Student is not archived' });
    
    await student.reactivateStudent();
    res.json({ message: 'Student reactivated successfully', student });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// 2. PASSWORD MANAGEMENT SYSTEM

// Individual password reset by Warden
router.put('/warden/reset-password/:id', verifyToken, checkRole(['warden', 'owner']), async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: 'student' });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    
    const newPassword = generateSecurePassword();
    student.password = newPassword;
    await student.save();
    
    res.json({ 
      message: 'Password reset successfully', 
      credentials: { username: student.username, newPassword } 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Bulk password reset by Warden
router.post('/warden/bulk-reset-passwords', verifyToken, checkRole(['warden', 'owner']), async (req, res) => {
  try {
    const { studentIds } = req.body;
    if (!studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({ message: 'Please provide an array of studentIds' });
    }
    
    const students = await User.find({ _id: { $in: studentIds }, role: 'student' });
    const results = [];
    
    for (let student of students) {
      const newPassword = generateSecurePassword();
      student.password = newPassword;
      await student.save();
      results.push({ username: student.username, name: student.name, newPassword });
    }
    
    res.json({ message: 'Passwords reset successfully', credentials: results });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Student change password
router.put('/student/change-password', verifyToken, checkRole(['student']), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user ? (req.user.userId || req.user._id) : null;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    
    const student = await User.findById(userId);
    if (!student) return res.status(404).json({ message: 'User not found' });
    
    const isMatch = await student.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    
    student.password = newPassword;
    await student.save();
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// 3. ADVANCED REPORTING & ANALYTICS

router.get('/warden/report/payments', verifyToken, checkRole(['warden', 'owner']), async (req, res) => {
  try {
    const payments = await Payment.find().populate('student', 'name email _id');
    const reportData = generatePaymentReport(payments);
    
    // Stats
    const totalAmount = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
    const pendingAmount = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
    
    res.json({ 
      data: reportData, 
      stats: { totalCollected: totalAmount, totalPending: pendingAmount }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/warden/report/students', verifyToken, checkRole(['warden', 'owner']), async (req, res) => {
  try {
    const status = req.query.status || 'active';
    const query = { role: 'student' };
    if (status !== 'all') {
      query.status = status;
    }
    
    const students = await User.find(query);
    const reportData = generateStudentRoster(students);
    
    res.json({ data: reportData, stats: { total: students.length } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/warden/report/complaints', verifyToken, checkRole(['warden', 'owner']), async (req, res) => {
  try {
    const complaints = await Complaint.find().populate('student', 'name roomNumber');
    const reportData = generateComplaintReport(complaints);
    
    const stats = {
      total: complaints.length,
      open: complaints.filter(c => c.status === 'open').length,
      inProgress: complaints.filter(c => ['in-progress', 'in_progress'].includes(c.status)).length,
      resolved: complaints.filter(c => c.status === 'resolved').length
    };
    
    res.json({ data: reportData, stats });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/warden/report/revenue', verifyToken, checkRole(['warden', 'owner']), async (req, res) => {
  try {
    const payments = await Payment.find({ status: 'paid' });
    
    // Group by YYYY-MM
    const monthlyRevenue = payments.reduce((acc, curr) => {
      const key = curr.month;
      acc[key] = (acc[key] || 0) + curr.amount;
      return acc;
    }, {});
    
    const totalRevenue = Object.values(monthlyRevenue).reduce((sum, val) => sum + val, 0);
    
    res.json({
      data: monthlyRevenue,
      stats: { totalRevenue }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Route to display image without bloated JSON payloads
router.get('/payment/:id/screenshot', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).send('Payment not found.');

    const { type } = req.query; // ?type=mess or ?type=rent
    let targetScreenshot = payment.screenshotUrl; // fallback

    if (type === 'mess' && payment.messScreenshotUrl) {
      targetScreenshot = payment.messScreenshotUrl;
    } else if (type === 'rent' && payment.rentScreenshotUrl) {
      targetScreenshot = payment.rentScreenshotUrl;
    } else if (!type) {
      targetScreenshot = payment.messScreenshotUrl || payment.rentScreenshotUrl || payment.screenshotUrl;
    }

    if (!targetScreenshot) {
      return res.status(404).send('No screenshot available for this payment.');
    }
    
    // Check if it's a base64 image
    if (targetScreenshot.startsWith('data:image')) {
      const parts = targetScreenshot.split(';');
      const mime = parts[0].split(':')[1];
      const data = parts[1].split(',')[1];
      
      const imgBuffer = Buffer.from(data, 'base64');
      res.writeHead(200, {
        'Content-Type': mime,
        'Content-Length': imgBuffer.length
      });
      return res.end(imgBuffer);
    }
    
    // Otherwise it's a normal URL, just redirect or send an HTML tag
    res.send(`<img src="${targetScreenshot}" style="max-width: 100%; height: auto;" />`);
  } catch (error) {
    res.status(500).send('Error loading screenshot: ' + error.message);
  }
});

module.exports = router;

