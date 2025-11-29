// app/models/Booking.ts - MAKE SURE THIS IS UPDATED
import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  user_id: mongoose.Types.ObjectId;
  slot_id: mongoose.Types.ObjectId;
  type: 'consultation' | 'treatment';
  status: 'pending' | 'confirmed' | 'completed' | 'canceled';
  confirmed_by?: mongoose.Types.ObjectId;
  notes?: string;
  total_amount?: number;
  
  // NEW: Payment status field - MAKE SURE THIS EXISTS
  payment_status: 'paid' | 'unpaid';
  
  // Consultation notes
  consultation_notes?: {
    diagnosis?: string;
    recommendations?: string;
    notes?: string;
    added_by: mongoose.Types.ObjectId;
    added_at: Date;
  }[];
  
  // Track if booking can be edited (not paid yet)
  is_editable: boolean;
  
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
  total_amount: { type: Number, default: 0 },
  
  // NEW: Payment status field - MAKE SURE THIS EXISTS
  payment_status: {
    type: String,
    enum: ['paid', 'unpaid'],
    default: 'unpaid'
  },
  
  // Consultation notes array
  consultation_notes: [{
    diagnosis: { type: String },
    recommendations: { type: String },
    notes: { type: String },
    added_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    added_at: { type: Date, default: Date.now }
  }],
  
  // Editable until paid
  is_editable: { type: Boolean, default: true },
  
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export default mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);