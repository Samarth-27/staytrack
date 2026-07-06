import mongoose, { Document, Schema } from 'mongoose';

export enum UserRole {
  STUDENT = 'Student',
  WARDEN = 'Warden',
  OWNER = 'Owner'
}

export interface IUser extends Document {
  username: string;
  passwordHash: string;
  role: UserRole;
  isFirstLogin: boolean;
  isActive: boolean;
  lastLogin?: Date;
}

const UserSchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
    },
    isFirstLogin: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
UserSchema.index({ username: 1 });
UserSchema.index({ role: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
