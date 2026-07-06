// backend/models/Complaint.js
const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  // References
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  
  // Issue Details
  title: { type: String, required: true },
  description: { type: String, required: true },
  
  // Classification
  category: { 
    type: String, 
    enum: ['maintenance', 'cleanliness', 'utilities', 'other'],
    required: true 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  
  // Status Workflow
  status: { 
    type: String, 
    enum: ['open', 'in-progress', 'resolved'],
    default: 'open'
  },
  
  // Warden Response
  wardenResponse: { type: String },
  
  // AI Analysis Data
  aiAnalysis: {
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
    suggestedStaff: { type: String },
    estimatedResolutionTime: { type: String }, // e.g., "2-4 hours", "1-2 days"
    confidenceScore: { type: Number, min: 0, max: 100 }
  },

  // Tracking
  createdAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date }
});

module.exports = mongoose.model('Complaint', complaintSchema);
