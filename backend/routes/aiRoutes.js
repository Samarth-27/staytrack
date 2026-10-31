const express = require('express');
const { verifyToken, checkRole } = require('../middleware/auth');
const User = require('../models/User');
const { processAIRequest } = require('../utils/aiRouter');
const rateLimit = require('express-rate-limit');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
const Room = require('../models/Room');
const aiClientInstance = require('../utils/groqClient');

// Rate limiting middleware specifically for AI to prevent billing abuse
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 AI requests per windowMs
  message: { message: 'Too many AI requests from this IP, please try again after 15 minutes.' }
});

const router = express.Router();

/**
 * GET /api/ai/models
 * Diagnostic endpoint: lists all models permitted and active on the current Groq API key
 */
router.get('/models', async (req, res) => {
  try {
    if (!aiClientInstance || !aiClientInstance.raw) {
      return res.status(503).json({
        success: false,
        message: 'Groq client is not initialized. Please ensure GROQ_API_KEY is configured in your environment.'
      });
    }

    const list = await aiClientInstance.raw.models.list();
    const models = (list?.data || []).map(m => m.id);
    return res.json({
      success: true,
      count: models.length,
      availableModels: models
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      statusCode: err.status || 500
    });
  }
});

router.use((req, res, next) => {
  if (!aiClientInstance || !aiClientInstance.raw) {
    return res.status(503).json({ message: 'AI features are currently disabled because the server is missing the GROQ_API_KEY configuration.' });
  }
  next();
});

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

    const user = await User.findById(req.user.userId || req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Call Central Agent Router
    const aiResponse = await processAIRequest(prompt, user, sessionId || user._id.toString());
    
    res.json({ reply: aiResponse, response: aiResponse });
  } catch (error) {
    console.error('Error in /api/ai/chat:', error);
    res.status(500).json({ 
      message: 'You have encountered an error: ' + error.message,
      error: error.message 
    });
  }
});

/**
 * GET /api/ai/memory/:sessionId
 * Retrieves past conversation memory for the session
 */
router.get('/memory/:sessionId', verifyToken, async (req, res) => {
  try {
    const { getSessionMemory } = require('../utils/aiMemoryService');
    const memory = await getSessionMemory(req.user.userId || req.user._id, req.params.sessionId);
    res.json({ history: memory });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving memory', error: error.message });
  }
});

/**
 * DELETE /api/ai/memory/:sessionId
 * Clears conversation history for the session
 */
router.delete('/memory/:sessionId', verifyToken, async (req, res) => {
  try {
    const AIMemory = require('../models/AIMemory');
    await AIMemory.findOneAndDelete({ 
      user: req.user.userId || req.user._id, 
      sessionId: req.params.sessionId 
    });
    res.json({ message: 'Conversation memory cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Error clearing memory', error: error.message });
  }
});

/**
 * GET /api/ai/analytics/dashboard
 * Aggregates statistics and generates executive AI summary
 */
router.get('/analytics/dashboard', verifyToken, checkRole(['owner']), async (req, res) => {
  try {
    const { generateExecutiveSummary } = require('../utils/aiAnalyticsService');
    const summary = await generateExecutiveSummary();
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Error generating executive summary', error: error.message });
  }
});

/**
 * GET /api/ai/analytics/predictions
 * Runs predictive analysis on maintenance issues and revenue
 */
router.get('/analytics/predictions', verifyToken, checkRole(['owner', 'warden']), async (req, res) => {
  try {
    const { generatePredictions } = require('../utils/aiAnalyticsService');
    const predictions = await generatePredictions();
    res.json(predictions);
  } catch (error) {
    res.status(500).json({ message: 'Error generating predictions', error: error.message });
  }
});

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

    const response = await aiClientInstance.models.generateContent({
      contents: prompt
    });

    res.send(response.text.replace(/\`\`\`html/g, '').replace(/\`\`\`/g, ''));
  } catch (error) {
    res.status(500).json({ message: 'Error generating report', error: error.message });
  }
});

module.exports = router;
