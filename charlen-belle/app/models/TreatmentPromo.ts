// app/models/TreatmentPromo.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ITreatmentPromo extends Document {
  treatment_id: mongoose.Types.ObjectId;
  promo_id: mongoose.Types.ObjectId;
}

const TreatmentPromoSchema: Schema = new Schema({
  treatment_id: { type: Schema.Types.ObjectId, ref: 'Treatment', required: true },
  promo_id: { type: Schema.Types.ObjectId, ref: 'Promo', required: true }
});

export default mongoose.models.TreatmentPromo || mongoose.model<ITreatmentPromo>('TreatmentPromo', TreatmentPromoSchema);
