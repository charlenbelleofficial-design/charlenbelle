import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  user_id: mongoose.Types.ObjectId;
  slot_id: mongoose.Types.ObjectId;
  type: 'consultation' | 'treatment';
  status: 'pending' | 'confirmed' | 'completed' | 'canceled';
  confirmed_by?: mongoose.Types.ObjectId;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

const BookingSchema: Schema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  slot_id: { type: Schema.Types.ObjectId, ref: 'BookingSlot', required: true },
  type: { type: String, enum: ['consultation', 'treatment'], required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'canceled'],
    default: 'pending'
  },
  confirmed_by: { type: Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export default mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);