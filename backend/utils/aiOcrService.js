// backend/utils/aiOcrService.js
const aiClient = require('./geminiClient');
const Payment = require('../models/Payment');

/**
 * Perform OCR on a payment receipt using Gemini Vision capabilities
 * @param {string} paymentId - ID of the payment record
 * @param {string} screenshotUrl - Base64 data URI or image URL
 */
const processReceiptOCR = async (paymentId, screenshotUrl) => {
  if (!aiClient || !screenshotUrl) return;

  try {
    let inlineData = null;

    // Handle Base64 Data URI
    if (screenshotUrl.startsWith('data:image')) {
      const matches = screenshotUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        inlineData = {
          mimeType: matches[1],
          data: matches[2]
        };
      }
    } 
    // Note: If it's a public URL, we'd normally fetch it and convert to base64 here.
    // For simplicity, we assume it's either base64 or we skip if not supported without fetch.

    if (!inlineData) {
      console.log(`⚠️ OCR skipped for payment ${paymentId}: Unsupported image format.`);
      return;
    }

    const prompt = `
      Analyze this payment receipt screenshot. Extract the following information and return it STRICTLY as JSON without markdown:
      - utr (string, the transaction ID or UTR number)
      - extractedAmount (number, the payment amount)
      - bankName (string, the bank or payment app name like GPay, PhonePe, SBI, etc.)
      - date (string, ISO date format if possible)
      - confidenceScore (number, 0-100 indicating how clear and certain you are)
    `;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [ { text: prompt }, { inlineData } ] }
      ],
      config: {
        responseMimeType: "application/json",
      }
    });

    const cleanedText = response.text ? response.text.replace(/```json/g, '').replace(/```/g, '').trim() : '{}';
    const ocrData = JSON.parse(cleanedText);

    let parsedDate = null;
    if (ocrData.date) {
      const d = new Date(ocrData.date);
      if (!isNaN(d.getTime())) {
        parsedDate = d;
      }
    }

    const confidence = Number(ocrData.confidenceScore) || 0;
    const amount = Number(ocrData.extractedAmount) || 0;
    const verifiedByAI = confidence > 80 && amount > 0;

    await Payment.findByIdAndUpdate(paymentId, {
      ocrDetails: {
        utr: ocrData.utr || null,
        extractedAmount: amount,
        bankName: ocrData.bankName || null,
        date: parsedDate,
        confidenceScore: confidence,
        verifiedByAI
      }
    });

    console.log(`✅ AI successfully performed OCR on payment ${paymentId}`);
  } catch (error) {
    console.error('❌ AI OCR processing failed:', error);
  }
};

module.exports = processReceiptOCR;
