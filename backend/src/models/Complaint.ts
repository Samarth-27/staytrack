import mongoose, { Document, Schema } from 'mongoose';

export enum ComplaintCategory {
  ELECTRICAL = 'Electrical',
  PLUMBING = 'Plumbing',
  CLEANING = 'Cleaning',
  INTERNET = 'Internet',
  OTHER = 'Other',
}

export enum ComplaintUrgency {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical',
}

export enum ComplaintStatus {
  RAISED = 'Raised',
  ASSIGNED = 'Assigned',
  IN_PROGRESS = 'In Progress',
  RESOLVED = 'Resolved',
}

export interface IComplaint extends Document {
  studentId: mongoose.Types.ObjectId;
  roomId?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: ComplaintCategory;
  urgency: ComplaintUrgency;
  images: string[];
  status: ComplaintStatus;
  assignedTo?: string; // e.g. name of maintenance staff
  aiSummary?: string;  // AI Generated summary of issue
}

const ComplaintSchema: Schema = new Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: Object.values(ComplaintCategory),
      default: ComplaintCategory.OTHER,
    },
    urgency: {
      type: String,
      enum: Object.values(ComplaintUrgency),
      default: ComplaintUrgency.LOW,
    },
    images: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: Object.values(ComplaintStatus),
      default: ComplaintStatus.RAISED,
    },
    assignedTo: {
      type: String,
    },
    aiSummary: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ComplaintSchema.index({ studentId: 1 });
ComplaintSchema.index({ status: 1 });
ComplaintSchema.index({ category: 1 });
ComplaintSchema.index({ urgency: 1 });

export const Complaint = mongoose.model<IComplaint>('Complaint', ComplaintSchema);
