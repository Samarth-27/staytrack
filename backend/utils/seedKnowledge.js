// backend/utils/seedKnowledge.js
const mongoose = require('mongoose');
const KnowledgeDocument = require('../models/KnowledgeDocument');
require('dotenv').config({ path: '../.env' });

const seedData = [
  {
    title: 'Hostel Entry and Exit Policy',
    category: 'policy',
    content: 'Students must enter the hostel before 10:00 PM. Any late entry requires prior written permission from the Warden. Night outs are only permitted with parental consent and 24-hour prior notice.'
  },
  {
    title: 'Fee Payment Guidelines',
    category: 'fee',
    content: 'Monthly rent is Rs 3500. Payments are due by the 5th of every month. A late fee of Rs 100 per day will be charged for payments made after the 5th. All online payments must be accompanied by a valid UTR number and screenshot.'
  },
  {
    title: 'Complaint Resolution SLA',
    category: 'complaint',
    content: 'Critical complaints (e.g., major water leaks, total power failure) will be resolved within 4 hours. High priority complaints within 24 hours. Medium and low priority complaints will be addressed within 2-3 business days.'
  },
  {
    title: 'Room Cleaning Schedule',
    category: 'faq',
    content: 'Rooms are cleaned twice a week on Tuesdays and Fridays between 10:00 AM and 1:00 PM. Students must ensure their valuables are secured during this time.'
  }
];

const seedKnowledge = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/staytrack');
    
    // Ensure text index exists for searching
    await KnowledgeDocument.collection.createIndex({ title: 'text', content: 'text' });

    // Clear existing to avoid duplicates during dev
    await KnowledgeDocument.deleteMany({});
    
    // Insert new data
    await KnowledgeDocument.insertMany(seedData);
    
    console.log('✅ Knowledge Base seeded successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding Knowledge Base:', error);
    process.exit(1);
  }
};

seedKnowledge();
