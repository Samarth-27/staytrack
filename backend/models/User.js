// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Info
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  phone: { type: String },
  
  // Authentication
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  
  // Role & Assignment
  role: { 
    type: String, 
    enum: ['owner', 'warden', 'student'], 
    required: true 
  },
  roomNumber: { type: Number, sparse: true }, // Only for students
  
  // Status
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  presenceStatus: { type: String, enum: ['in_hostel', 'on_leave'], default: 'in_hostel' },
  
  // Status & Archival / Clearance
  status: { type: String, enum: ['active', 'pending_security_refund', 'archived'], default: 'active' },
  archivedDetails: {
    reason: { type: String },
    archivedAt: { type: Date },
    archivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },

  // ================= Comprehensive Student Profile & KYC =================
  // Identity & KYC
  aadharNumber: { type: String },
  dob: { type: String },
  gender: { type: String, enum: ['Male', 'Female', 'Other', ''] },
  bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''] },

  // Academic & Current Study Status
  studyStatus: { 
    type: String, 
    enum: [
      'Pursuing Degree', 
      'Internship / Job', 
      'Preparing for Competitive Exams', 
      'Distance / Online Learning', 
      'Completed / Other', 
      ''
    ] 
  },
  collegeName: { type: String },
  course: { type: String },
  branch: { type: String },
  currentYear: { type: String },
  enrollmentNumber: { type: String },

  // Parents & Guardian Details
  fatherName: { type: String },
  fatherPhone: { type: String },
  motherName: { type: String },
  motherPhone: { type: String },
  guardianName: { type: String },
  guardianRelation: { type: String },
  guardianPhone: { type: String },
  guardianEmail: { type: String },

  // Emergency Contact Details
  emergencyContactName: { type: String },
  emergencyContactRelation: { type: String },
  emergencyContactPhone: { type: String },

  // Permanent & Communication Address
  permanentAddress: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },

  // Living, Dietary & Vehicle Preferences
  foodPreference: { type: String, enum: ['Veg', 'Non-Veg', 'Jain', 'Eggetarian', ''] },
  vehicleNumber: { type: String },
  medicalConditions: { type: String },

  // Profile Tracking & Audit
  profileCompleted: { type: Boolean, default: false },
  profileCompletionPercentage: { type: Number, default: 0 },
  profileUpdatedAt: { type: Date }
});

// Calculate Profile Completion Percentage
userSchema.methods.calculateProfileCompletion = function() {
  const fields = [
    this.name,
    this.phone,
    this.aadharNumber,
    this.dob,
    this.gender,
    this.bloodGroup,
    this.studyStatus,
    this.collegeName,
    this.course,
    this.currentYear,
    this.fatherName || this.guardianName,
    this.fatherPhone || this.guardianPhone,
    this.emergencyContactName,
    this.emergencyContactPhone,
    this.permanentAddress,
    this.city,
    this.state,
    this.pincode,
    this.foodPreference
  ];

  const filledCount = fields.filter(val => val && String(val).trim().length > 0).length;
  const percentage = Math.round((filledCount / fields.length) * 100);
  this.profileCompletionPercentage = percentage;
  this.profileCompleted = percentage >= 80;
  return percentage;
};

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;

  this.password = await bcrypt.hash(this.password, 10);
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Method when student leaves the hostel:
// 1. Delete student from room assignment
// 2. Free up room and update room occupancy status
// 3. Move student to security deposit clearance/exchange list
userSchema.methods.leaveHostel = async function(reason, wardenId, originalDepositAmount, bankDetails) {
  const oldRoomNumber = this.roomNumber;
  
  this.status = 'pending_security_refund';
  this.isActive = false;
  this.presenceStatus = 'on_leave';
  this.roomNumber = undefined; // Deleted from the room
  
  this.archivedDetails = {
    reason: reason || 'Hostel Exit / Vacated',
    archivedAt: new Date(),
    archivedBy: wardenId
  };

  const savedUser = await this.save();

  // Update Room occupancy status
  if (oldRoomNumber) {
    const Room = mongoose.model('Room');
    const room = await Room.findOne({ roomNumber: oldRoomNumber });
    if (room) {
      const User = mongoose.model('User');
      const occupants = await User.countDocuments({ roomNumber: oldRoomNumber, status: 'active' });
      room.status = occupants >= room.capacity ? 'occupied' : 'vacant';
      await room.save();
    }
  }

  // Create Security Deposit Clearance Entry
  const SecurityDeposit = mongoose.model('SecurityDeposit');
  let depositRecord = await SecurityDeposit.findOne({ student: this._id, refundStatus: 'pending_clearance' });
  if (!depositRecord) {
    depositRecord = new SecurityDeposit({
      student: this._id,
      studentName: this.name,
      studentUsername: this.username,
      studentPhone: this.phone || '',
      vacatedRoomNumber: oldRoomNumber,
      leaveReason: reason || 'Vacated Hostel',
      originalDepositAmount: Number(originalDepositAmount) || 5000,
      netRefundAmount: Number(originalDepositAmount) || 5000,
      studentBankDetails: bankDetails || {},
      refundStatus: 'pending_clearance'
    });
    await depositRecord.save();
  }

  return { student: savedUser, depositRecord };
};

// Method to archive student
userSchema.methods.archiveStudent = async function(reason, wardenId) {
  const oldRoomNumber = this.roomNumber;
  
  this.status = 'archived';
  this.isActive = false;
  this.roomNumber = undefined; // Free up the room
  this.archivedDetails = {
    reason: reason,
    archivedAt: new Date(),
    archivedBy: wardenId
  };
  const savedUser = await this.save();
  
  // Update the Room status directly if needed
  if (oldRoomNumber) {
    const Room = mongoose.model('Room');
    const room = await Room.findOne({ roomNumber: oldRoomNumber });
    if (room) {
      const User = mongoose.model('User');
      const occupants = await User.countDocuments({ roomNumber: oldRoomNumber, status: 'active' });
      room.status = occupants >= room.capacity ? 'occupied' : 'vacant';
      await room.save();
    }
  }

  // Ensure SecurityDeposit entry exists
  try {
    const SecurityDeposit = mongoose.model('SecurityDeposit');
    let depositRecord = await SecurityDeposit.findOne({ student: this._id });
    if (!depositRecord) {
      depositRecord = new SecurityDeposit({
        student: this._id,
        studentName: this.name,
        studentUsername: this.username,
        studentPhone: this.phone || '',
        vacatedRoomNumber: oldRoomNumber,
        leaveReason: reason || 'Archived / Checked Out',
        originalDepositAmount: 5000,
        netRefundAmount: 5000,
        refundStatus: 'pending_clearance'
      });
      await depositRecord.save();
    }
  } catch (err) {
    console.error('Error auto-creating security deposit on archive:', err);
  }
  
  return savedUser;
};

// Method to reactivate student
userSchema.methods.reactivateStudent = async function() {
  this.status = 'active';
  this.isActive = true;
  this.archivedDetails = undefined;
  return await this.save();
};

module.exports = mongoose.model('User', userSchema);
