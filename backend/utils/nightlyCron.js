const cron = require('node-cron');
const aiClient = require('./geminiClient');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
const Room = require('../models/Room');

const generateProactiveBriefing = async () => {
  if (!aiClient) return;

  try {
    console.log("🔄 Generating Proactive AI Executive Briefing...");

    const payments = await Payment.find();
    const complaints = await Complaint.find();
    const rooms = await Room.find();

    const pendingFees = payments.filter(p => p.status === 'pending').length;
    const totalCollected = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
    const activeComplaints = complaints.filter(c => c.status !== 'resolved').length;
    const vacantRooms = rooms.filter(r => r.status === 'vacant').length;

    const dataSnapshot = `
      Today's Data:
      Pending Payments: ${pendingFees}
      Revenue Collected: Rs ${totalCollected}
      Active Complaints: ${activeComplaints}
      Vacant Rooms: ${vacantRooms}
    `;

    const prompt = `
      You are the Proactive AI Analyst for StayTrack Hostel.
      Review the data snapshot below and generate a short, 3-sentence "Good morning" alert for the Owner.
      Point out any anomalies (like high pending fees or too many vacant rooms) and offer to take action (like sending reminders).
      Do not hallucinate. Use only the data provided.
      Data:
      ${dataSnapshot}
    `;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    const aiMessage = response.text;
    console.log("\n🚨 [AI PROACTIVE ALERT GENERATED]\n");
    console.log(aiMessage);
    console.log("\n------------------------------------\n");

    return aiMessage;
  } catch (error) {
    console.error("Failed to generate proactive briefing:", error.message);
  }
};

// Schedule it to run at 8:00 AM every morning
const startNightlyCron = () => {
  cron.schedule('0 8 * * *', () => {
    generateProactiveBriefing();
  });
  console.log("⏱️ Proactive AI Cron Job Scheduled (Runs daily at 8:00 AM)");
};

module.exports = { startNightlyCron, generateProactiveBriefing };
