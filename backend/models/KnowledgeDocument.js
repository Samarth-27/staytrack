// backend/models/KnowledgeDocument.js
const mongoose = require('mongoose');

const knowledgeDocumentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, enum: ['policy', 'fee', 'complaint', 'faq', 'other'], default: 'other' },
  // Optional embedding array if we choose to store vector embeddings directly in MongoDB
  embedding: { type: [Number], index: '2dsphere' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

knowledgeDocumentSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('KnowledgeDocument', knowledgeDocumentSchema);
