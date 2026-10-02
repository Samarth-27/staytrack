// backend/routes/pollRoutes.js
const express = require('express');
const router = express.Router();
const Poll = require('../models/Poll');
const User = require('../models/User');
const { verifyToken, checkRole } = require('../middleware/auth');

/**
 * GET ACTIVE POLLS
 * Accessible by students, wardens, owners
 */
router.get('/active', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const polls = await Poll.find({ status: 'active' }).sort({ createdAt: -1 });

    const formattedPolls = polls.map(poll => {
      const pollObj = poll.toObject();
      const userResponse = poll.responses.find(r => r.student && r.student.toString() === userId.toString());
      
      // Calculate summary stats
      const totalResponses = poll.responses.length;
      const optionCounts = {};
      (poll.options || []).forEach(opt => { optionCounts[opt] = 0; });
      poll.responses.forEach(r => {
        optionCounts[r.selectedOption] = (optionCounts[r.selectedOption] || 0) + 1;
      });

      return {
        ...pollObj,
        totalResponses,
        optionCounts,
        hasResponded: !!userResponse,
        myResponse: userResponse ? {
          selectedOption: userResponse.selectedOption,
          issueDetails: userResponse.issueDetails,
          respondedAt: userResponse.respondedAt
        } : null
      };
    });

    res.json(formattedPolls);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching active polls', error: error.message });
  }
});

/**
 * GET ALL POLLS (Historical & Active)
 * For Warden and Owner management
 */
router.get('/all', verifyToken, checkRole(['warden', 'owner']), async (req, res) => {
  try {
    const polls = await Poll.find().sort({ createdAt: -1 });

    const formattedPolls = polls.map(poll => {
      const pollObj = poll.toObject();
      const totalResponses = poll.responses.length;
      const optionCounts = {};
      (poll.options || []).forEach(opt => { optionCounts[opt] = 0; });
      
      // Filter for rooms that requested service (e.g. selected an option starting with 'Yes' or not 'No')
      const roomsNeedingService = poll.responses
        .filter(r => r.selectedOption.toLowerCase().startsWith('yes'))
        .map(r => ({
          roomNumber: r.roomNumber || 'Unassigned',
          studentName: r.studentName,
          issueDetails: r.issueDetails || 'Needs inspection',
          respondedAt: r.respondedAt
        }))
        .sort((a, b) => (Number(a.roomNumber) || 0) - (Number(b.roomNumber) || 0));

      poll.responses.forEach(r => {
        optionCounts[r.selectedOption] = (optionCounts[r.selectedOption] || 0) + 1;
      });

      return {
        ...pollObj,
        totalResponses,
        optionCounts,
        roomsNeedingService
      };
    });

    res.json(formattedPolls);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all polls', error: error.message });
  }
});

/**
 * CREATE A NEW POLL / SERVICE ANNOUNCEMENT
 * Warden or Owner creates a poll (e.g. Plumber, Electrician, AC repair)
 */
router.post('/', verifyToken, checkRole(['warden', 'owner']), async (req, res) => {
  try {
    const { title, category, description, scheduledDate, options } = req.body;
    const userId = req.user.userId || req.user._id;

    if (!title) {
      return res.status(400).json({ message: 'Poll title is required' });
    }

    const poll = new Poll({
      title,
      category: category || 'general',
      description: description || '',
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      createdBy: userId,
      options: (Array.isArray(options) && options.length > 0) 
        ? options 
        : ['Yes (Need repair)', 'No (All good)'],
      status: 'active'
    });

    await poll.save();
    res.status(201).json({ message: 'Poll announcement created successfully', poll });
  } catch (error) {
    res.status(500).json({ message: 'Error creating poll', error: error.message });
  }
});

/**
 * SUBMIT VOTE / RESPONSE
 * Student casts their vote and provides issue details if repair is needed
 */
router.post('/:id/vote', verifyToken, checkRole(['student']), async (req, res) => {
  try {
    const { selectedOption, issueDetails } = req.body;
    const userId = req.user.userId || req.user._id;

    if (!selectedOption) {
      return res.status(400).json({ message: 'Please select an option' });
    }

    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    if (poll.status === 'closed') {
      return res.status(400).json({ message: 'This poll has ended and is now closed' });
    }

    const student = await User.findById(userId);
    if (!student) {
      return res.status(404).json({ message: 'Student account not found' });
    }

    // Check if student already responded
    const existingIndex = poll.responses.findIndex(
      r => r.student && r.student.toString() === userId.toString()
    );

    const responseData = {
      student: userId,
      studentName: student.name,
      roomNumber: student.roomNumber,
      selectedOption,
      issueDetails: issueDetails ? issueDetails.trim() : '',
      respondedAt: new Date()
    };

    if (existingIndex > -1) {
      poll.responses[existingIndex] = responseData;
    } else {
      poll.responses.push(responseData);
    }

    await poll.save();
    res.json({ message: 'Your response has been recorded successfully', poll });
  } catch (error) {
    res.status(500).json({ message: 'Error recording vote', error: error.message });
  }
});

/**
 * CLOSE OR REOPEN A POLL
 * Warden/Owner can toggle status between active and closed
 */
router.put('/:id/status', verifyToken, checkRole(['warden', 'owner']), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'closed'].includes(status)) {
      return res.status(400).json({ message: 'Status must be active or closed' });
    }

    const poll = await Poll.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!poll) return res.status(404).json({ message: 'Poll not found' });
    res.json({ message: `Poll marked as ${status}`, poll });
  } catch (error) {
    res.status(500).json({ message: 'Error updating poll status', error: error.message });
  }
});

/**
 * DELETE POLL
 */
router.delete('/:id', verifyToken, checkRole(['warden', 'owner']), async (req, res) => {
  try {
    const poll = await Poll.findByIdAndDelete(req.params.id);
    if (!poll) return res.status(404).json({ message: 'Poll not found' });
    res.json({ message: 'Poll deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting poll', error: error.message });
  }
});

module.exports = router;
