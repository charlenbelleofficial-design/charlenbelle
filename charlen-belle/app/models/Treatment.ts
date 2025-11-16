// app/models/Treatment.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ITreatment extends Document {
  name: string;
  description?: string;
  duration_minutes: number;
  base_price: number;
  category_id?: mongoose.Types.ObjectId;
  requires_confirmation: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const TreatmentSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  duration_minutes: { type: Number, required: true },
  base_price: { type: Number, required: true },
  category_id: { type: Schema.Types.ObjectId, ref: 'TreatmentCategory' },
  requires_confirmation: { type: Boolean, default: false },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export default mongoose.models.Treatment || mongoose.model<ITreatment>('Treatment', TreatmentSchema);
