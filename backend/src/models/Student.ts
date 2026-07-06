import mongoose, { Document, Schema } from 'mongoose';

export enum StudentStatus {
  ACTIVE = 'Active',
  ARCHIVED = 'Archived',
}

export interface IStudent extends Document {
  userId: mongoose.Types.ObjectId;
  hostelId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  guardianName: string;
  guardianPhone: string;
  roomId?: mongoose.Types.ObjectId;
  bedNumber?: string;
  dateOfAdmission: Date;
  status: StudentStatus;
}

const StudentSchema: Schema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    hostelId: {
      type: String,
      required: true,
      unique: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    guardianName: {
      type: String,
      required: true,
    },
    guardianPhone: {
      type: String,
      required: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
    },
    bedNumber: {
      type: String,
    },
    dateOfAdmission: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: Object.values(StudentStatus),
      default: StudentStatus.ACTIVE,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
StudentSchema.index({ hostelId: 1 });
StudentSchema.index({ roomId: 1 });
StudentSchema.index({ status: 1 });

export const Student = mongoose.model<IStudent>('Student', StudentSchema);
