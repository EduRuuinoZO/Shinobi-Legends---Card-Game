import mongoose, { Schema, Document } from 'mongoose';

export interface IEquipmentItem {
  id: string;
  name: string;
  type: 'Weapon' | 'Armor' | 'Helmet' | 'Boots' | 'Scroll' | 'Ring';
  rarity: 'Rare' | 'Epic' | 'Legendary' | 'SSR' | 'UR';
  stars: number;
  rankSymbol: string;
  atkBonus: number;
  hpBonus: number;
  level: number;
  evolutionPoints: number;
  toObject?(): any; // Método do Mongoose para subdocuments
}

export interface ICard {
  id: string;
  name: string;
  element: 'Fire' | 'Wind' | 'Lightning' | 'Earth' | 'Water';
  image: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'SSR' | 'UR';
  atk: number;
  hp: number;
  maxHp: number;
  level: number;
  xp: number;
  stars: number;
  evolutionPoints: number;
  awakened?: boolean;
  equipment: {
    Weapon: IEquipmentItem | null;
    Armor: IEquipmentItem | null;
    Helmet: IEquipmentItem | null;
    Boots: IEquipmentItem | null;
    Scroll: IEquipmentItem | null;
    Ring: IEquipmentItem | null;
  };
  toObject?(): any; // Método do Mongoose para subdocuments
}

export interface IUser extends Document {
  username: string;
  gold: number;
  inventory: ICard[];
  squad: string[];
  lastDailyClaimAt: Date | null;
  highestFloor: number;
  lastTowerReset: Date | null;
  pvpPoints: number;
  pvpWins: number;
  pvpLosses: number;
  equipmentInventory: IEquipmentItem[];
  battleHistory: Array<{
    type: string;
    result: string;
    date: Date;
    details: string;
  }>;
}

const EquipmentItemSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['Weapon', 'Armor', 'Helmet', 'Boots', 'Scroll', 'Ring'], required: true },
  rarity: { type: String, enum: ['Rare', 'Epic', 'Legendary', 'SSR', 'UR'], required: true },
  stars: { type: Number, default: 0 },
  rankSymbol: { type: String, default: '⭐' },
  atkBonus: { type: Number, default: 0 },
  hpBonus: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  evolutionPoints: { type: Number, default: 0 }
}, { _id: false });

const CardSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  element: { type: String, enum: ['Fire', 'Wind', 'Lightning', 'Earth', 'Water'], required: true },
  image: { type: String, required: true },
  rarity: { type: String, enum: ['Common', 'Rare', 'Epic', 'Legendary', 'SSR', 'UR'], required: true },
  atk: { type: Number, required: true },
  hp: { type: Number, required: true },
  maxHp: { type: Number, required: true },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  stars: { type: Number, default: 0 },
  evolutionPoints: { type: Number, default: 0 },
  awakened: { type: Boolean, default: false },
  equipment: {
    Weapon: { type: EquipmentItemSchema, default: null },
    Armor: { type: EquipmentItemSchema, default: null },
    Helmet: { type: EquipmentItemSchema, default: null },
    Boots: { type: EquipmentItemSchema, default: null },
    Scroll: { type: EquipmentItemSchema, default: null },
    Ring: { type: EquipmentItemSchema, default: null }
  }
}, { _id: false });

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  gold: { type: Number, default: 1000 },
  inventory: { type: [CardSchema], default: [] },
  squad: { type: [String], default: [] },
  lastDailyClaimAt: { type: Date, default: null },
  highestFloor: { type: Number, default: 1 },
  lastTowerReset: { type: Date, default: null },
  pvpPoints: { type: Number, default: 0 },
  pvpWins: { type: Number, default: 0 },
  pvpLosses: { type: Number, default: 0 },
  equipmentInventory: { type: [EquipmentItemSchema], default: [] },
  battleHistory: { type: [{
    type: { type: String },
    result: String,
    date: { type: Date, default: Date.now },
    details: String
  }], default: [] }
});

export default mongoose.model<IUser>('User', UserSchema);