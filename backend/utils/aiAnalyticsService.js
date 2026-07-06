// backend/utils/aiAnalyticsService.js
const aiClient = require('./geminiClient');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
const Room = require('../models/Room');
const User = require('../models/User');

const generateMonthlyReport = async (month) => {
  // Gather raw data
  const paymentStats = await Payment.aggregate([
    { $match: { month } },
    { $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$amount" }
      }
    }
  ]);

  let totalRevenue = 0;
  let pendingCount = 0;

  paymentStats.forEach(stat => {
    if (stat._id === 'paid') {
      totalRevenue += stat.totalAmount;
    } else {
      pendingCount += stat.count;
    }
  });

  const complaintStats = await Complaint.aggregate([
    { $match: { 
        createdAt: { 
          $gte: new Date(`${month}-01`), 
          $lt: new Date(`${month}-31T23:59:59.999Z`) 
        } 
      } 
    },
    { $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    }
  ]);

  let complaintsResolved = 0;
  let complaintsOpen = 0;

  complaintStats.forEach(stat => {
    if (stat._id === 'resolved') {
      complaintsResolved += stat.count;
    } else {
      complaintsOpen += stat.count;
    }
  });
  const totalComplaints = complaintsResolved + complaintsOpen;

  const totalRooms = await Room.countDocuments();
  const occupiedRooms = await Room.countDocuments({ status: 'occupied' });
  const occupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : 0;

  const rawData = {
    month,
    revenue: totalRevenue,
    pendingFees: pendingCount,
    occupancyRate: `${occupancyRate}%`,
    complaints: {
      total: totalComplaints,
      resolved: complaintsResolved,
      open: complaintsOpen
    }
  };

  if (!aiClient) return { data: rawData, aiSummary: "AI Client not initialized." };

  const prompt = `
    You are an AI Hostel Manager. I will provide you with the raw metrics for the month of ${month}.
    Please write a 2-3 paragraph Executive Summary highlighting the key takeaways.
    Then, provide 3 actionable suggestions to improve operations, revenue collection, or student satisfaction.
    
    Data:
    - Revenue Collected: Rs ${totalRevenue}
    - Pending Fee Invoices: ${pendingCount}
    - Occupancy Rate: ${occupancyRate}%
    - Total Complaints: ${totalComplaints} (Resolved: ${complaintsResolved}, Open: ${complaintsOpen})
  `;

  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return { data: rawData, aiSummary: response.text };
  } catch (error) {
    console.error('Error generating AI report:', error);
    return { data: rawData, aiSummary: "Error generating AI summary." };
  }
};

const generatePredictions = async () => {
  if (!aiClient) return null;

  // For predictive analytics, we aggregate complaints from the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const categoriesAggr = await Complaint.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    { $group: { _id: "$category", count: { $sum: 1 } } }
  ]);
  
  const categories = categoriesAggr.reduce((acc, curr) => {
    acc[curr._id] = curr.count;
    return acc;
  }, {});

  const prompt = `
    You are an AI Hostel Analyst. 
    Recent 30 complaints breakdown by category: ${JSON.stringify(categories)}.
    
    Based on this data, provide EXACT JSON containing:
    - topComplaintCategory (string)
    - maintenancePrediction (string, a short sentence predicting what needs attention soon)
    - revenueForecastingTrend (string, e.g., 'Stable', 'Upward', 'Downward' based on general knowledge of hostel cycles)
    
    Return ONLY JSON without markdown.
  `;

  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error('Error generating AI predictions:', error);
    return null;
  }
};

module.exports = {
  generateMonthlyReport,
  generatePredictions
};
