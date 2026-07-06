// backend/utils/aiNotificationService.js
const nodemailer = require('nodemailer');
const aiClient = require('./geminiClient');
const Payment = require('../models/Payment');
const User = require('../models/User');
require('dotenv').config({ path: '../.env' });

// Configure NodeMailer transporter (Assuming Gmail for standard usage)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'test@example.com',
    pass: process.env.EMAIL_PASS || 'password'
  }
});

/**
 * Generates an AI-personalized email and sends it to students with pending fees.
 */
const sendSmartPaymentReminders = async () => {
  if (!aiClient) throw new Error('AI Client not initialized');

  try {
    const pendingPayments = await Payment.find({ status: { $in: ['pending', 'overdue'] } })
      .populate('student', 'name email roomNumber')
      .limit(10); // Limit batch size for safety

    let sentCount = 0;

    for (const payment of pendingPayments) {
      if (!payment.student || !payment.student.email) continue;

      const prompt = `
        You are the Warden of Sanmati Bhavan Hostel.
        Write a brief, polite, but firm personalized email reminder to ${payment.student.name} (Room ${payment.student.roomNumber || 'Unknown'}).
        They have a pending fee of Rs ${payment.amount} for the month of ${payment.month}.
        Remind them that late fees of Rs 100/day apply after the 5th of the month.
        Keep the email under 5 sentences. Use a professional and encouraging tone.
      `;

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      const emailContent = response.text;

      // In a real production scenario with valid credentials, this will send the email.
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await transporter.sendMail({
          from: `"Sanmati Bhavan Hostel" <${process.env.EMAIL_USER}>`,
          to: payment.student.email,
          subject: `Action Required: Pending Hostel Fee for ${payment.month}`,
          text: emailContent
        });
      } else {
        // If no credentials, just log it (Mock mode)
        console.log(`[MOCK EMAIL to ${payment.student.email}]:\n${emailContent}\n`);
      }
      
      sentCount++;
    }

    return { success: true, count: sentCount };
  } catch (error) {
    console.error('Error sending smart reminders:', error);
    throw error;
  }
};

module.exports = {
  sendSmartPaymentReminders
};
