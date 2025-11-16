// app/models/Promo.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IPromo extends Document {
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  start_date?: Date | string;
  end_date?: string;
  is_active: boolean;
  created_at: Date;
  // Add these fields to track which treatments this promo applies to
  applicable_treatments: mongoose.Types.ObjectId[];
  is_global: boolean; // If true, applies to all treatments
}

const PromoSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  discount_type: { type: String, enum: ['percentage', 'fixed'], required: true },
  discount_value: { type: Number, required: true },
  start_date: { type: Date },
  end_date: { type: Date },
  is_active: { type: Boolean, default: true },
  applicable_treatments: [{ type: Schema.Types.ObjectId, ref: 'Treatment' }],
  is_global: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.models.Promo || mongoose.model<IPromo>('Promo', PromoSchema);