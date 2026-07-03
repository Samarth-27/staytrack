// backend/models/Room.js
const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  // Room Info
  roomNumber: { type: Number, required: true, unique: true },
  capacity: { type: Number, default: 2 }, // Each room has 2 students
  
  // Occupants
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // Financial
  rentAmount: { type: Number, default: 3500 }, // Rs 3500/month
  
  // Status
  status: { 
    type: String, 
    enum: ['vacant', 'occupied', 'maintenance'], 
    default: 'vacant' 
  },
  
  // Tracking
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Room', roomSchema);
