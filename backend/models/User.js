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
  
  // Archival Data
  status: { type: String, enum: ['active', 'archived'], default: 'active' },
  archivedDetails: {
    reason: { type: String },
    archivedAt: { type: Date },
    archivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }
});

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;

  this.password = await bcrypt.hash(this.password, 10);
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
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
      const occupants = await User.countDocuments({ roomNumber: oldRoomNumber, status: { $ne: 'archived' } });
      room.status = occupants >= room.capacity ? 'occupied' : 'vacant';
      await room.save();
    }
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
