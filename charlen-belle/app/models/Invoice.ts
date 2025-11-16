// app/models/Invoice.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoice extends Document {
  payment_id: mongoose.Types.ObjectId;
  invoice_number: string;
  invoice_url?: string;
  email_sent: boolean;
  created_at: Date;
}

const InvoiceSchema: Schema = new Schema({
  payment_id: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
  invoice_number: { type: String, required: true, unique: true },
  invoice_url: { type: String },
  email_sent: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);
