import mongoose, { Document, Schema } from 'mongoose';

export enum FeeStatus {
  PENDING = 'Pending',
  PAID = 'Paid',
  OVERDUE = 'Overdue',
}

export interface IFee extends Document {
  studentId: mongoose.Types.ObjectId;
  month: string; // e.g. "2026-07"
  amountDue: number;
  dueDate: Date;
  status: FeeStatus;
}

const FeeSchema: Schema = new Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    month: {
      type: String,
      required: true, // ISO YYYY-MM format recommended
    },
    amountDue: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(FeeStatus),
      default: FeeStatus.PENDING,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
FeeSchema.index({ studentId: 1, month: 1 }, { unique: true });
FeeSchema.index({ status: 1 });
FeeSchema.index({ dueDate: 1 });

export const Fee = mongoose.model<IFee>('Fee', FeeSchema);
