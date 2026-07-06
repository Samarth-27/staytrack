// backend/models/AIMemory.js
const mongoose = require('mongoose');

const aiMemorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: String, required: true }, // To group conversations
  messages: [{
    role: { type: String, enum: ['system', 'user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  lastUpdatedAt: { type: Date, default: Date.now }
});

aiMemorySchema.pre('save', function() {
  this.lastUpdatedAt = Date.now();
});

module.exports = mongoose.model('AIMemory', aiMemorySchema);
