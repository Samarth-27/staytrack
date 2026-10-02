const mongoose = require('mongoose');

const securityDepositSchema = new mongoose.Schema({
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  studentName: { type: String, required: true },
  studentUsername: { type: String },
  studentPhone: { type: String },
  vacatedRoomNumber: { type: Number },
  vacatedAt: { type: Date, default: Date.now },
  leaveReason: { type: String, default: 'Vacated Hostel' },

  // Financials
  originalDepositAmount: { type: Number, default: 5000 },
  deductionAmount: { type: Number, default: 0 },
  deductionReason: { type: String, default: '' },
  netRefundAmount: { type: Number, default: 5000 },

  // Clearance Status
  refundStatus: { 
    type: String, 
    enum: ['pending_clearance', 'refunded'], 
    default: 'pending_clearance' 
  },

  // Bank / UPI details for refund
  studentBankDetails: {
    upiId: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    accountHolderName: { type: String }
  },

  // Warden Refund Settlement Execution
  refundDetails: {
    refundMode: { type: String, enum: ['UPI', 'Bank Transfer', 'Cash', 'Other', ''] },
    transactionId: { type: String },
    refundedAt: { type: Date },
    refundedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    refundedByName: { type: String },
    notes: { type: String }
  },

  // Room Inspection Checklist
  checklist: {
    roomKeyReturned: { type: Boolean, default: false },
    roomInspectionPassed: { type: Boolean, default: false },
    duesCleared: { type: Boolean, default: true }
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Calculate net refund amount before saving
securityDepositSchema.pre('save', function() {
  const original = Number(this.originalDepositAmount) || 0;
  const deduction = Number(this.deductionAmount) || 0;
  this.netRefundAmount = Math.max(0, original - deduction);
  this.updatedAt = new Date();
});

module.exports = mongoose.model('SecurityDeposit', securityDepositSchema);
