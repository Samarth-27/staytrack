import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Format Year-Month (e.g., '2026-10') into a human-readable string ('October 2026')
 */
export const formatMonthName = (monthStr) => {
  if (!monthStr || typeof monthStr !== 'string') return 'N/A';
  const parts = monthStr.split('-');
  if (parts.length < 2) return monthStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const date = new Date(Date.UTC(year, month, 1));
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
};

/**
 * Format currency amount for standard PDF fonts (Rs. X,XXX.XX)
 */
export const formatReceiptCurrency = (amount) => {
  const num = Number(amount) || 0;
  return `Rs. ${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Format a Date object or ISO string to standard Indian notation DD/MM/YYYY
 */
export const formatReceiptDate = (dateVal) => {
  if (!dateVal) return 'N/A';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return 'N/A';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Generates an institutional-grade PDF Fee Receipt for StayTrack Hostel Students.
 * 
 * @param {Object} payment - Payment record from the backend
 * @param {Object} studentInfo - Student profile or current user details
 * @param {Object} options - { action: 'download' | 'preview' | 'none' }
 * @returns {Object} { doc, fileName, receiptNumber, blobUrl }
 */
export const generateFeeReceiptPDF = (payment, studentInfo = {}, options = { action: 'download' }) => {
  if (!payment) {
    throw new Error('Payment information is required to generate receipt');
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const rawId = payment._id ? String(payment._id) : '000000';
  const cleanMonth = (payment.month || '202601').replace('-', '');
  const receiptNumber = `ST-REC-${cleanMonth}-${rawId.slice(-6).toUpperCase()}`;

  // Resolve Student Info
  const student = payment.student && typeof payment.student === 'object' ? payment.student : {};
  const studentName = student.name || studentInfo.name || payment.studentName || 'Student Resident';
  const roomNumber = payment.room?.roomNumber || student.roomNumber || studentInfo.roomNumber || 'Assigned';
  const rollOrEnrollment = student.enrollmentNumber || student.rollNumber || studentInfo.enrollmentNumber || studentInfo.rollNumber || `STU-${rawId.slice(-6).toUpperCase()}`;
  const phone = student.phone || studentInfo.phone || 'N/A';
  const email = student.email || studentInfo.email || 'N/A';
  const college = student.collegeName || studentInfo.collegeName || 'StayTrack Campus Partner';

  const monthLabel = formatMonthName(payment.month);
  const paidDateFormatted = formatReceiptDate(payment.paidDate || payment.updatedAt || new Date());
  const generationTimestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  // 1. TOP HEADER BANNER (Vercel/Modern Slate Navy Theme)
  doc.setFillColor(15, 23, 42); // #0F172A
  doc.rect(0, 0, pageWidth, 44, 'F');

  // Vibrant Blue Top Border Accent
  doc.setFillColor(37, 99, 235); // #2563EB
  doc.rect(0, 0, pageWidth, 4, 'F');

  // Institution Brand Name & Subtext
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('STAYTRACK HOSTEL RESIDENCES', 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text('Smart Campus Residence & Automated Accommodation Management', 14, 25);
  doc.text('Contact: finance@staytrack.campus  |  Helpline: +91 98765 43210', 14, 31);
  doc.text('Campus Hostel Premises  |  Affiliated Student Residential Community', 14, 37);

  // Header Right Receipt Info Badge
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.roundedRect(pageWidth - 78, 10, 64, 28, 2, 2, 'F');
  
  doc.setTextColor(52, 211, 153); // Emerald Green
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('OFFICIAL FEE RECEIPT', pageWidth - 46, 17, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(226, 232, 240);
  doc.text(`NO: ${receiptNumber}`, pageWidth - 46, 23, { align: 'center' });
  doc.text(`ISSUED: ${paidDateFormatted}`, pageWidth - 46, 28, { align: 'center' });
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(52, 211, 153);
  doc.text('[ PAID & VERIFIED ]', pageWidth - 46, 34, { align: 'center' });

  // 2. STUDENT & BILLING PARTICULARS (Two-Column Card)
  const cardStartY = 50;
  const cardHeight = 44;
  doc.setFillColor(248, 250, 252); // #F8FAFC
  doc.setDrawColor(226, 232, 240); // #E2E8F0
  doc.roundedRect(14, cardStartY, pageWidth - 28, cardHeight, 2, 2, 'FD');

  // Divider Line
  doc.setDrawColor(203, 213, 225);
  doc.line(pageWidth / 2, cardStartY + 5, pageWidth / 2, cardStartY + cardHeight - 5);

  // Card Column Titles
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('STUDENT ALLOTMENT DETAILS', 20, cardStartY + 8);
  doc.text('BILLING & PERIOD SUMMARY', pageWidth / 2 + 8, cardStartY + 8);

  // Left Column Content
  const drawStudentRow = (label, value, y) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(label, 20, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(String(value), 56, y);
  };

  drawStudentRow('Student Name:', studentName, cardStartY + 16);
  drawStudentRow('Room Number:', `Room ${roomNumber}`, cardStartY + 23);
  drawStudentRow('Enrollment / ID:', rollOrEnrollment, cardStartY + 30);
  drawStudentRow('Contact & Email:', `${phone} | ${email}`, cardStartY + 37);

  // Right Column Content
  const rightColX = pageWidth / 2 + 8;
  const drawBillingRow = (label, value, y, isGreen = false) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(label, rightColX, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(isGreen ? 5 : 15, isGreen ? 150 : 23, isGreen ? 105 : 42);
    doc.text(String(value), rightColX + 42, y);
  };

  drawBillingRow('Billing Month:', monthLabel, cardStartY + 16);
  drawBillingRow('Payment Date:', paidDateFormatted, cardStartY + 23);
  drawBillingRow('Hostel / Unit:', college, cardStartY + 30);
  drawBillingRow('Settlement Status:', 'Verified & Cleared', cardStartY + 37, true);

  // 3. ITEMIZED BREAKDOWN TABLE
  const rentAmount = 3500;
  const messAmount = 5000;
  const penaltyAmount = Number(payment.penaltyAmount) || 0;
  const totalPaid = (payment.amount || 8500) + penaltyAmount;

  // Derive mode strings
  const onlineAmt = Number(payment.onlineAmount) || 0;
  const cashAmt = Number(payment.cashAmount) || 0;
  
  let rentModeStr = 'Paid';
  let messModeStr = 'Paid';
  if (onlineAmt > 0 && cashAmt > 0) {
    rentModeStr = 'Online / Cash Split';
    messModeStr = 'Online / Cash Split';
  } else if (onlineAmt > 0) {
    rentModeStr = 'Online (UPI/Bank)';
    messModeStr = 'Online (UPI/Bank)';
  } else if (cashAmt > 0) {
    rentModeStr = 'Cash (To Warden)';
    messModeStr = 'Cash (To Warden)';
  }

  const rentTxn = payment.rentTransactionId || payment.transactionId || (cashAmt > 0 && onlineAmt === 0 ? 'Handover Cash' : 'Verified');
  const messTxn = payment.messTransactionId || payment.transactionId || (cashAmt > 0 && onlineAmt === 0 ? 'Handover Cash' : 'Verified');

  const tableBody = [
    [
      '1',
      'Hostel Accommodation & Room Rent\nStandard double/single sharing residential suite & utility infrastructure.',
      rentModeStr,
      rentTxn,
      formatReceiptCurrency(rentAmount)
    ],
    [
      '2',
      'Hostel Mess & Dining Facility Charges\nNutritious breakfast, lunch, evening tea & dinner subscription.',
      messModeStr,
      messTxn,
      formatReceiptCurrency(messAmount)
    ]
  ];

  if (penaltyAmount > 0) {
    tableBody.push([
      '3',
      'Late Payment Surcharge / Penalty\nFee payment processed past the 8th calendar grace period.',
      'Settled',
      'Penalty clearance',
      formatReceiptCurrency(penaltyAmount)
    ]);
  }

  const tableFoot = [
    ['', '', '', 'Subtotal Amount:', formatReceiptCurrency(8500)],
    ...(penaltyAmount > 0 ? [['', '', '', 'Late Surcharge:', formatReceiptCurrency(penaltyAmount)]] : []),
    ['', '', '', 'TOTAL AMOUNT PAID:', formatReceiptCurrency(totalPaid)]
  ];

  autoTable(doc, {
    startY: cardStartY + cardHeight + 8,
    head: [['#', 'Fee Component & Description', 'Payment Mode', 'Reference / UTR ID', 'Amount (INR)']],
    body: tableBody,
    foot: tableFoot,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left'
    },
    bodyStyles: {
      textColor: [30, 41, 59],
      fontSize: 8,
      cellPadding: 4
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'right'
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 74 },
      2: { cellWidth: 32 },
      3: { cellWidth: 38 },
      4: { cellWidth: 28, halign: 'right' }
    },
    margin: { left: 14, right: 14 }
  });

  const finalY = doc.lastAutoTable.finalY + 8;

  // 4. SETTLEMENT & AUDIT TRAIL BOX
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, finalY, pageWidth - 80, 28, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('PAYMENT SETTLEMENT & AUDIT TRAIL', 20, finalY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  
  const onlineDesc = onlineAmt > 0 ? `Rs. ${onlineAmt.toLocaleString('en-IN')}` : 'Rs. 0.00';
  const cashDesc = cashAmt > 0 ? `Rs. ${cashAmt.toLocaleString('en-IN')}` : 'Rs. 0.00';

  doc.text(`• Online Paid Amount: ${onlineDesc}  |  Cash Paid to Warden: ${cashDesc}`, 20, finalY + 12);
  doc.text(`• Mess Reference: ${messTxn}  |  Rent Reference: ${rentTxn}`, 20, finalY + 17);
  doc.text(`• AI OCR & Warden Clearance: Verified and reconciled into the master ledger`, 20, finalY + 22);

  // 5. OFFICIAL "PAID & VERIFIED" STAMP BADGE (Right of Audit Trail)
  const stampX = pageWidth - 62;
  doc.setDrawColor(16, 185, 129); // Emerald border
  doc.setLineWidth(0.8);
  doc.setFillColor(236, 253, 245); // Mint light bg
  doc.roundedRect(stampX, finalY, 48, 28, 2, 2, 'FD');

  doc.setTextColor(5, 150, 105);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('PAID & VERIFIED', stampX + 24, finalY + 10, { align: 'center' });
  
  doc.setFontSize(7);
  doc.setTextColor(16, 185, 129);
  doc.text('[ OFFICIAL ELECTRONIC STAMP ]', stampX + 24, finalY + 15, { align: 'center' });
  doc.setFontSize(7.5);
  doc.setTextColor(5, 150, 105);
  doc.text('STAYTRACK HMS DESK', stampX + 24, finalY + 22, { align: 'center' });

  // 6. BOTTOM LEGAL & VERIFICATION NOTICE
  const bottomY = 270;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, bottomY - 3, pageWidth - 14, bottomY - 3);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('TERMS & IMPORTANT INSTRUCTIONS:', 14, bottomY + 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('1. This document serves as the official fee receipt for semester clearance, security deposit refund, and room occupancy verification.', 14, bottomY + 6);
  doc.text('2. Payments once recorded are subject to hostel bye-laws and regulations. Please retain this receipt for future administrative reference.', 14, bottomY + 10);
  doc.text('3. This is an electronically generated and authenticated certificate. No physical signature or rubber stamp is required.', 14, bottomY + 14);

  // System Generation Meta
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(160, 174, 192);
  doc.text(`Generated on ${generationTimestamp}  |  StayTrack Hostels Inc.  |  Document Ref: ${receiptNumber}`, 14, 288);

  const sanitizedName = studentName.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `StayTrack_Fee_Receipt_${payment.month || 'record'}_${sanitizedName}.pdf`;

  let blobUrl = null;
  if (options.action === 'preview' || options.action === 'download') {
    try {
      const blob = doc.output('blob');
      blobUrl = URL.createObjectURL(blob);
    } catch (e) {
      console.warn('Could not create Blob URL:', e);
    }
  }

  if (options.action === 'download') {
    doc.save(fileName);
  }

  return { doc, fileName, receiptNumber, blobUrl };
};

