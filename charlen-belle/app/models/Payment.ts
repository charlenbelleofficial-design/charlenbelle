import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  booking_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  amount: number;
  payment_method: string;
  midtrans_transaction_id?: string;
  midtrans_redirect_url?: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  paid_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const PaymentSchema: Schema = new Schema({
  booking_id: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  payment_method: { type: String, required: true },
  midtrans_transaction_id: { type: String },
  midtrans_redirect_url: { type: String },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paid_at: { type: Date },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);