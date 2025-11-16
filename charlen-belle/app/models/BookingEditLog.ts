// app/models/BookingEditLog.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IBookingEditLog extends Document {
  booking_id: mongoose.Types.ObjectId;
  edited_by: mongoose.Types.ObjectId;
  action: 'added_treatment' | 'removed_treatment' | 'updated_treatment' | 'added_consultation_note' | 'updated_booking';
  details: {
    treatment_id?: mongoose.Types.ObjectId;
    treatment_name?: string;
    quantity?: number;
    price?: number;
    consultation_note?: string;
    previous_total?: number;
    new_total?: number;
  };
  created_at: Date;
}

const BookingEditLogSchema: Schema = new Schema({
  booking_id: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
  edited_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: {
    type: String,
    enum: ['added_treatment', 'removed_treatment', 'updated_treatment', 'added_consultation_note', 'updated_booking'],
    required: true
  },
  details: {
    treatment_id: { type: Schema.Types.ObjectId, ref: 'Treatment' },
    treatment_name: { type: String },
    quantity: { type: Number },
    price: { type: Number },
    consultation_note: { type: String },
    previous_total: { type: Number },
    new_total: { type: Number }
  },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.models.BookingEditLog || mongoose.model<IBookingEditLog>('BookingEditLog', BookingEditLogSchema);