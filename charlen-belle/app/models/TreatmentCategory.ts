// app/models/TreatmentCategory.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ITreatmentCategory extends Document {
  name: string;
  description?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const TreatmentCategorySchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export default mongoose.models.TreatmentCategory ||
  mongoose.model<ITreatmentCategory>('TreatmentCategory', TreatmentCategorySchema);
