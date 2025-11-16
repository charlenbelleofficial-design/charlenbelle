// app/models/WalkinTransaction.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IWalkinTransaction extends Document {
  kasir_id: mongoose.Types.ObjectId;
  customer_name: string;
  payment_method: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed';
  created_at: Date;
  paid_at?: Date;
}

const WalkinTransactionSchema: Schema = new Schema({
  kasir_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  customer_name: { type: String, required: true },
  payment_method: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  created_at: { type: Date, default: Date.now },
  paid_at: { type: Date }
});

export default mongoose.models.WalkinTransaction || mongoose.model<IWalkinTransaction>('WalkinTransaction', WalkinTransactionSchema);
