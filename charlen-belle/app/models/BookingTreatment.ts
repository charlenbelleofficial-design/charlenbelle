// app/models/BookingTreatment.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IBookingTreatment extends Document {
  booking_id: mongoose.Types.ObjectId;
  treatment_id: mongoose.Types.ObjectId;
  quantity: number;
  price: number; // The actual price charged (with promo if applied)
  original_price?: number; // Original base price for reference
  promo_applied?: {
    promo_id: mongoose.Types.ObjectId;
    promo_name: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
  };
  created_at: Date;
  updated_at: Date;
}

const BookingTreatmentSchema: Schema = new Schema({
  booking_id: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
  treatment_id: { type: Schema.Types.ObjectId, ref: 'Treatment', required: true },
  quantity: { type: Number, required: true, default: 1 },
  price: { type: Number, required: true }, // Final price charged
  original_price: { type: Number }, // Store original price for historical reference
  promo_applied: {
    promo_id: { type: Schema.Types.ObjectId, ref: 'Promo' },
    promo_name: { type: String },
    discount_type: { type: String, enum: ['percentage', 'fixed'] },
    discount_value: { type: Number }
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export default mongoose.models.BookingTreatment || 
  mongoose.model<IBookingTreatment>('BookingTreatment', BookingTreatmentSchema);