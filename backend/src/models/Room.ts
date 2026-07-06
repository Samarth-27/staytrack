import mongoose, { Document, Schema } from 'mongoose';

export enum RoomType {
  AC = 'AC',
  NON_AC = 'Non-AC',
}

export enum RoomStatus {
  AVAILABLE = 'Available',
  FULL = 'Full',
  MAINTENANCE = 'Maintenance',
}

export interface IRoom extends Document {
  roomNumber: string;
  capacity: number;
  occupants: mongoose.Types.ObjectId[];
  type: RoomType;
  status: RoomStatus;
}

const RoomSchema: Schema = new Schema(
  {
    roomNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    occupants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
    type: {
      type: String,
      enum: Object.values(RoomType),
      default: RoomType.NON_AC,
    },
    status: {
      type: String,
      enum: Object.values(RoomStatus),
      default: RoomStatus.AVAILABLE,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
RoomSchema.index({ roomNumber: 1 });
RoomSchema.index({ status: 1 });
RoomSchema.index({ type: 1 });

export const Room = mongoose.model<IRoom>('Room', RoomSchema);
