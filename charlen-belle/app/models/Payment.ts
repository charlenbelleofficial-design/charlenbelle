// app/models/Payment.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  booking_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  amount: number;
  payment_method: string;
  payment_gateway: 'midtrans' | 'doku';
  
  // Midtrans fields
  midtrans_transaction_id?: string;
  midtrans_redirect_url?: string;
  midtrans_order_id?: string;
  
  // DOKU fields
  doku_transaction_id?: string;
  doku_redirect_url?: string;
  doku_session_id?: string;
  doku_token_id?: string;
  
  // Payment status
  status: 'pending' | 'paid' | 'failed' | 'expired' | 'refunded';
  paid_at?: Date;
  error_message?: string;
  
  // Additional fields for better tracking
  gateway_response?: any; // Store raw response from gateway
  notification_data?: any; // Store webhook notification data
  
  created_at: Date;
  updated_at: Date;
}

const PaymentSchema: Schema = new Schema({
  booking_id: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  payment_method: { type: String, required: true },
  payment_gateway: { 
    type: String, 
    enum: ['midtrans', 'doku'], 
    required: true 
  },
  
  // Midtrans fields
  midtrans_transaction_id: { type: String },
  midtrans_redirect_url: { type: String },
  midtrans_order_id: { type: String },
  
  // DOKU fields
  doku_order_id: { type: String }, // Add this field
  doku_transaction_id: { type: String },
  doku_redirect_url: { type: String },
  doku_session_id: { type: String },
  doku_token_id: { type: String },
  
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'expired', 'refunded'],
    default: 'pending'
  },
  paid_at: { type: Date },
  error_message: { type: String },
  
  // Additional tracking
  gateway_response: { type: Schema.Types.Mixed },
  notification_data: { type: Schema.Types.Mixed },
  
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Index for faster queries
PaymentSchema.index({ doku_transaction_id: 1 });
PaymentSchema.index({ midtrans_order_id: 1 });
PaymentSchema.index({ booking_id: 1 });
PaymentSchema.index({ status: 1 });

export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);