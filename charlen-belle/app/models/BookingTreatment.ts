// app/models/BookingTreatment.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IBookingTreatment extends Document {
  booking_id: mongoose.Types.ObjectId;
  treatment_id: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
}

const BookingTreatmentSchema: Schema = new Schema({
  booking_id: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
  treatment_id: { type: Schema.Types.ObjectId, ref: 'Treatment', required: true },
  quantity: { type: Number, default: 1 },
  price: { type: Number, required: true }
});

export default mongoose.models.BookingTreatment || mongoose.model<IBookingTreatment>('BookingTreatment', BookingTreatmentSchema);
