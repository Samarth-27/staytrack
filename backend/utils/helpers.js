// backend/utils/helpers.js
const crypto = require('crypto');
const nodemailer = require('nodemailer');

exports.generateSecurePassword = () => {
  const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  
  let password = '';
  // Ensure at least one of each type
  password += letters[Math.floor(Math.random() * letters.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  const allChars = letters + numbers + symbols;
  for (let i = 3; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle password
  return password.split('').sort(() => 0.5 - Math.random()).join('');
};

exports.sendEmail = async (to, subject, text, html) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('Email not configured. Skipping email send.');
      return false;
    }
    
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@staytrack.com',
      to,
      subject,
      text,
      html
    });
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
};

exports.sendCredentialsEmail = async (user, password) => {
  const subject = 'Your StayTrack Credentials';
  const text = `Hello ${user.name},\n\nYour account has been created/updated.\nUsername: ${user.username}\nPassword: ${password}\n\nPlease change your password after logging in.`;
  return await exports.sendEmail(user.email, subject, text);
};

exports.sendPasswordResetEmail = async (user, password) => {
  const subject = 'StayTrack Password Reset';
  const text = `Hello ${user.name},\n\nYour password has been reset.\nNew Password: ${password}\n\nPlease login and change it immediately.`;
  return await exports.sendEmail(user.email, subject, text);
};

exports.formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};

exports.formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN');
};

exports.generatePaymentReport = (payments) => {
  return payments.map(p => ({
    studentId: p.student?._id,
    studentName: p.student?.name,
    amount: p.amount,
    month: p.month,
    status: p.status,
    date: p.paidDate ? exports.formatDate(p.paidDate) : 'N/A'
  }));
};

exports.generateStudentRoster = (students) => {
  return students.map(s => ({
    id: s._id,
    name: s.name,
    username: s.username,
    email: s.email,
    phone: s.phone,
    room: s.roomNumber || 'Unassigned',
    joined: exports.formatDate(s.createdAt)
  }));
};

exports.generateComplaintReport = (complaints) => {
  return complaints.map(c => ({
    id: c._id,
    student: c.student?.name,
    room: c.room?.roomNumber || c.student?.roomNumber,
    category: c.category,
    status: c.status,
    created: exports.formatDate(c.createdAt),
    description: c.description
  }));
};
