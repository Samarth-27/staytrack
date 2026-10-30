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
 * Clean and truncate transaction reference strings so they never overflow tables or cards
 */
export const cleanReferenceString = (raw, maxLen = 24) => {
  if (!raw || typeof raw !== 'string') return 'N/A';
  const trimmed = raw.trim();
  if (trimmed.length === 0) return 'N/A';
  if (trimmed.length > maxLen) {
    return trimmed.slice(0, maxLen - 2) + '...';
  }
  return trimmed;
};

/**
 * Generates an institutional-grade PDF Fee Receipt for StayTrack Hostel Students.
 * Features strict layout bounds, automatic text wrapping, and zero-overflow containers.
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
  
  // Format College/Hostel unit neatly
  const rawCollege = student.collegeName || studentInfo.collegeName || '';
  const college = (!rawCollege || rawCollege.toLowerCase() === 'idk' || rawCollege.toLowerCase() === 'n/a')
    ? 'StayTrack Resident Community'
    : rawCollege;

  const monthLabel = formatMonthName(payment.month);
  const paidDateFormatted = formatReceiptDate(payment.paidDate || payment.updatedAt || new Date());
  const generationTimestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  // 1. TOP HEADER BANNER (Vercel-style Dark Navy Theme)
  doc.setFillColor(15, 23, 42); // #0F172A
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Vibrant Electric Blue Accent Bar
  doc.setFillColor(37, 99, 235); // #2563EB
  doc.rect(0, 0, pageWidth, 4, 'F');

  // Institution Brand Name & Subtext
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('STAYTRACK HOSTEL RESIDENCES', 14, 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text('Smart Campus Residence & Automated Accommodation Management', 14, 23);
  doc.text('Contact: finance@staytrack.campus  |  Helpline: +91 98765 43210', 14, 29);
  doc.text('Campus Hostel Premises  |  Affiliated Student Residential Community', 14, 35);

  // Header Right Receipt Info Badge
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.roundedRect(pageWidth - 78, 9, 64, 26, 2, 2, 'F');
  
  doc.setTextColor(52, 211, 153); // Emerald Green
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('OFFICIAL FEE RECEIPT', pageWidth - 46, 15, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(226, 232, 240);
  doc.text(`NO: ${receiptNumber}`, pageWidth - 46, 21, { align: 'center' });
  doc.text(`ISSUED: ${paidDateFormatted}`, pageWidth - 46, 26, { align: 'center' });
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(52, 211, 153);
  doc.text('[ PAID & VERIFIED ]', pageWidth - 46, 31, { align: 'center' });

  // 2. STUDENT & BILLING PARTICULARS (Balanced Two-Column Card with Strict Bounds)
  const cardStartY = 48;
  const cardHeight = 44;
  const cardWidth = pageWidth - 28; // 182mm
  const midX = pageWidth / 2; // 105mm

  doc.setFillColor(248, 250, 252); // #F8FAFC
  doc.setDrawColor(226, 232, 240); // #E2E8F0
  doc.roundedRect(14, cardStartY, cardWidth, cardHeight, 2, 2, 'FD');

  // Vertical Center Divider Line
  doc.setDrawColor(203, 213, 225);
  doc.line(midX, cardStartY + 4, midX, cardStartY + cardHeight - 4);

  // Card Column Titles
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('STUDENT ALLOTMENT DETAILS', 20, cardStartY + 7);
  doc.text('BILLING & PERIOD SUMMARY', midX + 8, cardStartY + 7);

  // Left Column Boundaries (x=20 to x=101, max value width: 48mm)
  const leftLabelX = 20;
  const leftValX = 52;
  const maxLeftValWidth = midX - leftValX - 4; // 49mm safe bound

  const drawStudentItem = (label, value, y) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(label, leftLabelX, y);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(String(value), leftValX, y, { maxWidth: maxLeftValWidth });
  };

  drawStudentItem('Student Name:', studentName, cardStartY + 14);
  drawStudentItem('Room Number:', `Room ${roomNumber}`, cardStartY + 21);
  drawStudentItem('Enrollment / ID:', rollOrEnrollment, cardStartY + 28);
  drawStudentItem('Contact Phone:', phone, cardStartY + 34);
  drawStudentItem('Email Address:', email, cardStartY + 40);

  // Right Column Boundaries (x=113 to x=194, max value width: 45mm)
  const rightLabelX = midX + 8;
  const rightValX = rightLabelX + 36;
  const maxRightValWidth = (pageWidth - 14) - rightValX - 4; // 42mm safe bound

  const drawBillingItem = (label, value, y, isGreen = false) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(label, rightLabelX, y);

    doc.setFont('helvetica', 'bold');
    if (isGreen) {
      doc.setTextColor(5, 150, 105);
    } else {
      doc.setTextColor(15, 23, 42);
    }
    doc.text(String(value), rightValX, y, { maxWidth: maxRightValWidth });
  };

  drawBillingItem('Billing Month:', monthLabel, cardStartY + 14);
  drawBillingItem('Payment Date:', paidDateFormatted, cardStartY + 21);
  drawBillingItem('Hostel / Unit:', college, cardStartY + 28);
  drawBillingItem('Payment Mode:', Number(payment.onlineAmount) > 0 && Number(payment.cashAmount) > 0 ? 'Online / Cash Split' : Number(payment.cashAmount) > 0 ? 'Cash Handover' : 'Online (UPI/Bank)', cardStartY + 34);
  drawBillingItem('Settlement Status:', 'Verified & Cleared', cardStartY + 40, true);

  // 3. ITEMIZED BREAKDOWN TABLE
  const rentAmount = 3500;
  const messAmount = 5000;
  const penaltyAmount = Number(payment.penaltyAmount) || 0;
  const totalPaid = (payment.amount || 8500) + penaltyAmount;

  const onlineAmt = Number(payment.onlineAmount) || 0;
  const cashAmt = Number(payment.cashAmount) || 0;

  let rentModeStr = 'Paid Online';
  let messModeStr = 'Paid Online';
  if (onlineAmt > 0 && cashAmt > 0) {
    rentModeStr = 'Online / Cash Split';
    messModeStr = 'Online / Cash Split';
  } else if (cashAmt > 0 && onlineAmt === 0) {
    rentModeStr = 'Cash to Warden';
    messModeStr = 'Cash to Warden';
  }

  // Sanitize reference IDs so long descriptions or notices don't break table column widths
  const rawRentTxn = payment.rentTransactionId || payment.transactionId || (cashAmt > 0 && onlineAmt === 0 ? 'Cash Handover' : 'Verified');
  const rawMessTxn = payment.messTransactionId || payment.transactionId || (cashAmt > 0 && onlineAmt === 0 ? 'Cash Handover' : 'Verified');
  
  const rentTxn = cleanReferenceString(rawRentTxn, 22);
  const messTxn = cleanReferenceString(rawMessTxn, 22);

  const tableBody = [
    [
      '1',
      'Hostel Accommodation & Room Rent\nStandard residential suite & campus utility infrastructure.',
      rentModeStr,
      rentTxn,
      formatReceiptCurrency(rentAmount)
    ],
    [
      '2',
      'Hostel Mess & Dining Facility Charges\nNutritious daily meals & dining hall subscription.',
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
    styles: {
      overflow: 'linebreak',
      cellPadding: 3.5
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left'
    },
    bodyStyles: {
      textColor: [30, 41, 59],
      fontSize: 8
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
      1: { cellWidth: 76 },
      2: { cellWidth: 30 },
      3: { cellWidth: 38 },
      4: { cellWidth: 28, halign: 'right' }
    },
    margin: { left: 14, right: 14 }
  });

  const finalY = doc.lastAutoTable.finalY + 8;

  // 4. UNIFIED SETTLEMENT & OFFICIAL STAMP CONTAINER (Zero text-bleed layout)
  const auditContainerHeight = 32;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, finalY, cardWidth, auditContainerHeight, 2, 2, 'FD');

  // Left Side: Audit Trail Text (Width: ~124mm, bounded with maxWidth)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('PAYMENT SETTLEMENT & AUDIT TRAIL', 20, finalY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);

  const onlineDesc = onlineAmt > 0 ? `Rs. ${onlineAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'Rs. 0.00';
  const cashDesc = cashAmt > 0 ? `Rs. ${cashAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'Rs. 0.00';

  const maxAuditTextWidth = 118; // Strict right cutoff before stamp divider
  doc.text(`• Online Paid Amount: ${onlineDesc}  |  Cash Paid to Warden: ${cashDesc}`, 20, finalY + 13, { maxWidth: maxAuditTextWidth });
  doc.text(`• Rent Reference / UTR: ${rentTxn}  |  Mess Reference: ${messTxn}`, 20, finalY + 19, { maxWidth: maxAuditTextWidth });
  doc.text(`• AI OCR & Warden Reconciliation: Reconciled into StayTrack Master Ledger`, 20, finalY + 25, { maxWidth: maxAuditTextWidth });

  // Vertical Divider before Stamp
  doc.setDrawColor(226, 232, 240);
  doc.line(144, finalY + 4, 144, finalY + auditContainerHeight - 4);

  // Right Side: Official Verification Stamp Box
  const stampBoxX = 148;
  const stampBoxWidth = (pageWidth - 14) - stampBoxX - 4; // 196 - 148 - 4 = 44mm
  const stampBoxHeight = auditContainerHeight - 8; // 24mm

  doc.setDrawColor(16, 185, 129); // Emerald border
  doc.setLineWidth(0.6);
  doc.setFillColor(236, 253, 245); // Mint background
  doc.roundedRect(stampBoxX, finalY + 4, stampBoxWidth, stampBoxHeight, 2, 2, 'FD');

  const stampCenterX = stampBoxX + (stampBoxWidth / 2);
  doc.setTextColor(5, 150, 105);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('PAID & VERIFIED', stampCenterX, finalY + 11, { align: 'center' });
  
  doc.setFontSize(6.5);
  doc.setTextColor(16, 185, 129);
  doc.text('[ OFFICIAL ELECTRONIC STAMP ]', stampCenterX, finalY + 16, { align: 'center' });
  
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('STAYTRACK HMS DESK', stampCenterX, finalY + 21, { align: 'center' });

  // 5. BOTTOM LEGAL & COMPLIANCE NOTICE
  const bottomY = 265;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, bottomY - 3, pageWidth - 14, bottomY - 3);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('TERMS & IMPORTANT INSTRUCTIONS:', 14, bottomY + 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('1. This document serves as the official fee receipt for semester clearance, security deposit refund, and room occupancy verification.', 14, bottomY + 6, { maxWidth: cardWidth });
  doc.text('2. Payments once recorded are subject to hostel bye-laws and regulations. Please retain this receipt for future administrative reference.', 14, bottomY + 10, { maxWidth: cardWidth });
  doc.text('3. This is an electronically generated and authenticated certificate. No physical signature or rubber stamp is required.', 14, bottomY + 14, { maxWidth: cardWidth });

  // System Generation Meta
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(160, 174, 192);
  doc.text(`Generated on ${generationTimestamp}  |  StayTrack Hostels Inc.  |  Document Ref: ${receiptNumber}`, 14, 285, { maxWidth: cardWidth });

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
