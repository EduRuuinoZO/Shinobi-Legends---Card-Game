import mongoose, { Schema, Document } from 'mongoose';

export interface ICard extends Document {
  id: string;
  userId: string;
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
  awakened: boolean;
  equipment: {
    Weapon: any | null;
    Armor: any | null;
    Helmet: any | null;
    Boots: any | null;
    Scroll: any | null;
    Ring: any | null;
  };
}

const CardSchema = new Schema<ICard>({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
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
    Weapon: { type: Schema.Types.Mixed, default: null },
    Armor: { type: Schema.Types.Mixed, default: null },
    Helmet: { type: Schema.Types.Mixed, default: null },
    Boots: { type: Schema.Types.Mixed, default: null },
    Scroll: { type: Schema.Types.Mixed, default: null },
    Ring: { type: Schema.Types.Mixed, default: null }
  }
}, { timestamps: true });

export default mongoose.model<ICard>('Card', CardSchema);
