// app/models/WalkinTransactionItem.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IWalkinTransactionItem extends Document {
  transaction_id: mongoose.Types.ObjectId;
  treatment_id: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
}

const WalkinTransactionItemSchema: Schema = new Schema({
  transaction_id: { type: Schema.Types.ObjectId, ref: 'WalkinTransaction', required: true },
  treatment_id: { type: Schema.Types.ObjectId, ref: 'Treatment', required: true },
  quantity: { type: Number, default: 1 },
  price: { type: Number, required: true }
});

export default mongoose.models.WalkinTransactionItem || mongoose.model<IWalkinTransactionItem>('WalkinTransactionItem', WalkinTransactionItemSchema);
