// backend/models/Poll.js
const mongoose = require('mongoose');

const pollResponseSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  roomNumber: { type: Number },
  selectedOption: { type: String, required: true },
  issueDetails: { type: String, default: '' },
  respondedAt: { type: Date, default: Date.now }
});

const pollSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['plumber', 'electrician', 'carpenter', 'ac_repair', 'cleaning', 'payment_reminder', 'general'],
    default: 'general' 
  },
  description: { type: String, default: '' },
  scheduledDate: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  options: { 
    type: [String], 
    default: ['Yes (Need repair)', 'No (All good)'] 
  },
  responses: [pollResponseSchema],
  status: { 
    type: String, 
    enum: ['active', 'closed'], 
    default: 'active' 
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Poll', pollSchema);
