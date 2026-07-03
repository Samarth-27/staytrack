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
  
  // Tracking
  createdAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date }
});

module.exports = mongoose.model('Complaint', complaintSchema);
