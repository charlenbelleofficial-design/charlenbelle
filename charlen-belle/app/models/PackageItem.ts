// app/models/PackageItem.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IPackageItem extends Document {
  package_id: mongoose.Types.ObjectId;
  treatment_id: mongoose.Types.ObjectId;
  quantity: number;
}

const PackageItemSchema: Schema = new Schema({
  package_id: { type: Schema.Types.ObjectId, ref: 'Package', required: true },
  treatment_id: { type: Schema.Types.ObjectId, ref: 'Treatment', required: true },
  quantity: { type: Number, default: 1 }
});

export default mongoose.models.PackageItem || mongoose.model<IPackageItem>('PackageItem', PackageItemSchema);