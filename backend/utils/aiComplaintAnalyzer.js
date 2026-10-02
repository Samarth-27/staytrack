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

    const cleanedText = response.text ? response.text.replace(/```json/g, '').replace(/```/g, '').trim() : '{}';
    const aiResult = JSON.parse(cleanedText);

    const validSeverities = ['low', 'medium', 'high', 'critical'];
    const normalizedSeverity = (aiResult.severity || '').toLowerCase();
    const severity = validSeverities.includes(normalizedSeverity) ? normalizedSeverity : 'medium';

    await Complaint.findByIdAndUpdate(complaintId, {
      aiAnalysis: {
        severity,
        suggestedStaff: aiResult.suggestedStaff || 'Staff',
        estimatedResolutionTime: aiResult.estimatedResolutionTime || '24-48 hours',
        confidenceScore: Number(aiResult.confidenceScore) || 85
      }
    });

    console.log(`✅ AI successfully analyzed complaint ${complaintId}`);
  } catch (error) {
    console.error('❌ AI Complaint Analysis failed:', error);
  }
};

module.exports = analyzeComplaint;
