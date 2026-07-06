const express = require('express');
const { verifyToken } = require('../middleware/auth');
const User = require('../models/User');
const { processAIRequest } = require('../utils/aiRouter');
const rateLimit = require('express-rate-limit');

// Rate limiting middleware specifically for AI to prevent billing abuse
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 AI requests per windowMs
  message: { message: 'Too many AI requests from this IP, please try again after 15 minutes.' }
});

const router = express.Router();

/**
 * POST /api/ai/chat
 * Main endpoint for the AI Copilot (Warden, Owner, Student)
 */
router.post('/chat', verifyToken, aiLimiter, async (req, res) => {
  try {
    const { prompt, sessionId } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    // Fetch user with role
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const aiResponse = await processAIRequest(prompt, user, sessionId || 'default-session');

    res.json({ reply: aiResponse });
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ message: 'Error processing AI request', error: error.message });
  }
});

const { checkRole } = require('../middleware/auth');
const { generateMonthlyReport, generatePredictions } = require('../utils/aiAnalyticsService');

/**
 * GET /api/ai/insights
 * Returns predictive analytics
 */
router.get('/insights', verifyToken, checkRole(['owner']), async (req, res) => {
  try {
    const predictions = await generatePredictions();
    res.json(predictions || {});
  } catch (error) {
    res.status(500).json({ message: 'Error fetching insights', error: error.message });
  }
});

/**
 * GET /api/ai/reports/monthly
 * Generates automated executive report
 */
router.get('/reports/monthly', verifyToken, checkRole(['owner']), async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7); // Default YYYY-MM
    const report = await generateMonthlyReport(month);
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Error generating report', error: error.message });
  }
});

const { sendSmartPaymentReminders } = require('../utils/aiNotificationService');

/**
 * POST /api/ai/notifications/remind-fees
 * Triggers AI to write and send personalized emails
 */
router.post('/notifications/remind-fees', verifyToken, checkRole(['warden', 'owner']), async (req, res) => {
  try {
    const result = await sendSmartPaymentReminders();
    res.json({ message: `Successfully sent ${result.count} smart reminders.` });
  } catch (error) {
    res.status(500).json({ message: 'Error sending reminders', error: error.message });
  }
});

const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
const Room = require('../models/Room');
const aiClient = require('../utils/geminiClient');

/**
 * GET /api/ai/reports/warden-summary
 * Generates an HTML report for the warden
 */
router.get('/reports/warden-summary', verifyToken, checkRole(['warden', 'owner']), async (req, res) => {
  try {
    const complaints = await Complaint.find().populate('student', 'name');
    const rooms = await Room.find();
    
    const openComplaints = complaints.filter(c => c.status !== 'resolved');
    const vacantRooms = rooms.filter(r => r.status === 'vacant').length;

    const dataSnapshot = `
      Active Complaints: ${openComplaints.length}
      Vacant Rooms: ${vacantRooms}
      High Priority Issues: ${openComplaints.filter(c => c.priority === 'high').length}
    `;

    const prompt = `
      You are the AI Warden Copilot for StayTrack Hostel.
      Write a beautifully formatted HTML report summarizing the current operational status.
      Use standard HTML tags like <h1>, <h2>, <ul>, <li>, <p>, <strong>.
      Include a section for Predictive Maintenance based on the complaints.
      Do not include \`\`\`html code block markers, just the raw HTML.
      Data snapshot:
      ${dataSnapshot}
    `;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    res.send(response.text.replace(/\`\`\`html/g, '').replace(/\`\`\`/g, ''));
  } catch (error) {
    res.status(500).json({ message: 'Error generating report', error: error.message });
  }
});

module.exports = router;
