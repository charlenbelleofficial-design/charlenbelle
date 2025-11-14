import mongoose, { Schema, Document } from 'mongoose';

export interface IBookingSlot extends Document {
  date: Date;
  start_time: string;
  end_time: string;
  doctor_id?: mongoose.Types.ObjectId;
  therapist_id?: mongoose.Types.ObjectId;
  is_available: boolean;
}

const BookingSlotSchema: Schema = new Schema({
  date: { type: Date, required: true },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
  doctor_id: { type: Schema.Types.ObjectId, ref: 'User' },
  therapist_id: { type: Schema.Types.ObjectId, ref: 'User' },
  is_available: { type: Boolean, default: true }
});

export default mongoose.models.BookingSlot || mongoose.model<IBookingSlot>('BookingSlot', BookingSlotSchema);