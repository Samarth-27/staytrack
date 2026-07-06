// backend/utils/geminiClient.js
const { GoogleGenAI } = require('@google/genai');

// We expect GEMINI_API_KEY to be set in .env
let aiClient = null;

try {
  if (process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    console.log('✅ Gemini Client Initialized');
  } else {
    console.warn('⚠️ GEMINI_API_KEY is missing. AI features will not work.');
  }
} catch (error) {
  console.error('❌ Failed to initialize Gemini Client', error);
}

module.exports = aiClient;
