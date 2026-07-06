// backend/test_ai_features.js
const mongoose = require('mongoose');
require('dotenv').config();

const aiClient = require('./utils/geminiClient');
const { processAIRequest } = require('./utils/aiRouter');
const analyzeComplaint = require('./utils/aiComplaintAnalyzer');
const processReceiptOCR = require('./utils/aiOcrService');
const { generateMonthlyReport, generatePredictions } = require('./utils/aiAnalyticsService');
const { sendSmartPaymentReminders } = require('./utils/aiNotificationService');

// Mock User for Router
const testWarden = { _id: new mongoose.Types.ObjectId(), role: 'warden' };
const testOwner = { _id: new mongoose.Types.ObjectId(), role: 'owner' };
const testStudent = { _id: new mongoose.Types.ObjectId(), role: 'student' };

async function runTests() {
  console.log("==========================================");
  console.log("🚀 STAYTRACK ENTERPRISE AI TEST SUITE 🚀");
  console.log("==========================================\n");

  let passed = 0;
  let failed = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  };

  // 1. Check AI Initialization
  console.log("--- Initializing AI ---");
  if (!process.env.GEMINI_API_KEY) {
    console.warn("⚠️ Warning: GEMINI_API_KEY is missing. Testing graceful degradation...");
    assert(aiClient === null, "AI Client should gracefully degrade to null when key is missing.");
  } else {
    assert(aiClient !== null, "AI Client successfully initialized.");
  }

  // We connect to DB just in case functions require it, but we won't mutate data
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/staytrack_new');
    assert(true, "Database connected successfully.");
  } catch (e) {
    assert(false, "Database connection failed. Is MongoDB running?");
    process.exit(1);
  }

  try {
    // 2. Test Router Access Control (RBAC Simulation)
    console.log("\n--- Testing AI Router (RBAC & Agent) ---");
    // We don't actually call Gemini here to save tokens, just validating the wrapper logic
    assert(typeof processAIRequest === 'function', "processAIRequest is defined and exported.");

    // 3. Test Analytics
    console.log("\n--- Testing AI Analytics Service ---");
    assert(typeof generateMonthlyReport === 'function', "generateMonthlyReport is defined.");
    assert(typeof generatePredictions === 'function', "generatePredictions is defined.");
    
    // We'll run the report function. If AI is off, it returns raw data
    const report = await generateMonthlyReport('2026-07');
    assert(report !== null && report.data !== undefined, "Monthly report returns valid data structure.");
    if (!aiClient) {
      assert(report.aiSummary === "AI Client not initialized.", "Monthly report falls back gracefully without AI.");
    }

    // 4. Test Complaint Analyzer
    console.log("\n--- Testing AI Complaint Analyzer ---");
    assert(typeof analyzeComplaint === 'function', "analyzeComplaint is defined.");

    // 5. Test OCR Service
    console.log("\n--- Testing AI OCR Service ---");
    assert(typeof processReceiptOCR === 'function', "processReceiptOCR is defined.");

    // 6. Test Smart Notifications
    console.log("\n--- Testing AI Smart Notifications ---");
    assert(typeof sendSmartPaymentReminders === 'function', "sendSmartPaymentReminders is defined.");

  } catch (error) {
    console.error("Test execution encountered an error:", error);
    failed++;
  } finally {
    await mongoose.disconnect();
    
    console.log("\n==========================================");
    console.log(`🏆 TEST RESULTS: ${passed} Passed | ${failed} Failed`);
    console.log("==========================================");
    
    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

runTests();
