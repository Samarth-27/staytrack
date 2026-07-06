// backend/models/Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // References
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: false },
  
  // Amount Info
  amount: { type: Number, default: 8500 }, // Total (e.g. 8500)
  onlineAmount: { type: Number, default: 0 },
  cashAmount: { type: Number, default: 0 },
  month: { type: String, required: true }, // Format: "2024-01"
  
  // Status
  status: { 
    type: String, 
    enum: ['pending', 'pending_verification', 'paid', 'overdue'],
    default: 'pending' 
  },
  
  // Transaction Details
  transactionId: { type: String },
  screenshotUrl: { type: String }, // Can store a URL or Base64 string
  hasScreenshot: { type: Boolean, default: false },
  paidDate: { type: Date },
  dueDate: { type: Date },
  
  // OCR AI Data
  ocrDetails: {
    utr: { type: String },
    extractedAmount: { type: Number },
    bankName: { type: String },
    date: { type: Date },
    verifiedByAI: { type: Boolean, default: false },
    confidenceScore: { type: Number }
  },

  // Tracking
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);
