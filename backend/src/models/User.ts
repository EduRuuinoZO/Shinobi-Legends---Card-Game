import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  gold: number;
  squad: string[]; // Card IDs
  lastDailyClaimAt: Date | null;
  highestFloor: number;
  lastTowerReset: Date | null;
  pvpPoints: number;
  pvpWins: number;
  pvpLosses: number;
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true, index: true },
  gold: { type: Number, default: 1000 },
  squad: { type: [String], default: [] },
  lastDailyClaimAt: { type: Date, default: null },
  highestFloor: { type: Number, default: 1 },
  lastTowerReset: { type: Date, default: null },
  pvpPoints: { type: Number, default: 0, index: true },
  pvpWins: { type: Number, default: 0 },
  pvpLosses: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
