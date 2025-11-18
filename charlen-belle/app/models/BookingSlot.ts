// app/models/BookingSlot.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBookingSlot extends Document {
  date: Date;
  start_time: string;
  end_time: string;
  doctor_id: mongoose.Types.ObjectId; // Changed to required
  therapist_id: mongoose.Types.ObjectId; // Changed to required
  is_available: boolean;
  booking_id?: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const BookingSlotSchema: Schema = new Schema({
  date: { type: Date, required: true },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
  doctor_id: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Added required
  therapist_id: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Added required
  is_available: { type: Boolean, default: true },
  booking_id: { type: Schema.Types.ObjectId, ref: 'Booking' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Add indexes for better performance
BookingSlotSchema.index({ date: 1, is_available: 1 });
BookingSlotSchema.index({ date: 1, start_time: 1 });
BookingSlotSchema.index({ doctor_id: 1 });
BookingSlotSchema.index({ therapist_id: 1 });

const BookingSlot: Model<IBookingSlot> = 
  mongoose.models.BookingSlot || mongoose.model<IBookingSlot>('BookingSlot', BookingSlotSchema);

export default BookingSlot;