// app/models/Package.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IPackage extends Document {
  name: string;
  description?: string;
  base_price: number;
  is_active: boolean;
  created_at: Date;
}

const PackageSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  base_price: { type: Number, required: true },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.models.Package || mongoose.model<IPackage>('Package', PackageSchema);