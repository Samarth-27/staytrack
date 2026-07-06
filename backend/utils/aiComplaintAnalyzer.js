// backend/utils/aiComplaintAnalyzer.js
const aiClient = require('./geminiClient');
const Complaint = require('../models/Complaint');

const analyzeComplaint = async (complaintId, title, description) => {
  if (!aiClient) return;

  try {
    const prompt = `
      You are an AI Hostel Manager. Analyze the following student complaint:
      Title: "${title}"
      Description: "${description}"

      Provide your analysis in EXACT JSON format with the following keys:
      - severity (string: 'low', 'medium', 'high', 'critical')
      - suggestedStaff (string: e.g., 'Electrician', 'Plumber', 'Cleaning Staff', 'Warden')
      - estimatedResolutionTime (string: e.g., '2-4 hours', '1-2 days')
      - confidenceScore (number: 0-100)

      Do not include any markdown formatting or extra text, just the raw JSON.
    `;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const aiResult = JSON.parse(response.text);

    await Complaint.findByIdAndUpdate(complaintId, {
      aiAnalysis: {
        severity: aiResult.severity,
        suggestedStaff: aiResult.suggestedStaff,
        estimatedResolutionTime: aiResult.estimatedResolutionTime,
        confidenceScore: aiResult.confidenceScore
      }
    });

    console.log(`✅ AI successfully analyzed complaint ${complaintId}`);
  } catch (error) {
    console.error('❌ AI Complaint Analysis failed:', error);
  }
};

module.exports = analyzeComplaint;
