import mongoose, { Schema, Document } from 'mongoose';

export interface IEquipmentItem extends Document {
  id: string; // custom UUID or string id
  userId: string; // owner username or userId
  name: string;
  type: 'Weapon' | 'Armor' | 'Helmet' | 'Boots' | 'Scroll' | 'Ring';
  rarity: 'Rare' | 'Epic' | 'Legendary' | 'SSR' | 'UR';
  stars: number;
  rankSymbol: string;
  atkBonus: number;
  hpBonus: number;
  level: number;
  evolutionPoints: number;
  equippedCardId: string | null;
}

const EquipmentSchema = new Schema<IEquipmentItem>({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['Weapon', 'Armor', 'Helmet', 'Boots', 'Scroll', 'Ring'], required: true },
  rarity: { type: String, enum: ['Rare', 'Epic', 'Legendary', 'SSR', 'UR'], required: true },
  stars: { type: Number, default: 0 },
  rankSymbol: { type: String, default: '⭐' },
  atkBonus: { type: Number, default: 0 },
  hpBonus: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  evolutionPoints: { type: Number, default: 0 },
  equippedCardId: { type: String, default: null, index: true }
}, { timestamps: true });

export default mongoose.model<IEquipmentItem>('Equipment', EquipmentSchema);
