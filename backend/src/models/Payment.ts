import mongoose, { Document, Schema } from 'mongoose';

export enum PaymentMethod {
  ONLINE = 'Online',
  OFFLINE = 'Offline',
  UPI = 'UPI',
}

export enum PaymentStatus {
  PENDING_VERIFICATION = 'Pending Verification',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

export interface IPayment extends Document {
  feeId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  amountPaid: number;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  receiptUrl?: string;
  status: PaymentStatus;
  ocrData?: any;
}

const PaymentSchema: Schema = new Schema(
  {
    feeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fee',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    amountPaid: {
      type: Number,
      required: true,
      min: 1,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },
    referenceNumber: {
      type: String, // UTR or Txn ID
    },
    receiptUrl: {
      type: String, // Cloudinary URL
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING_VERIFICATION,
    },
    ocrData: {
      type: Schema.Types.Mixed, // AI Extracted Details
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
PaymentSchema.index({ feeId: 1 });
PaymentSchema.index({ studentId: 1 });
PaymentSchema.index({ status: 1 });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
