// app/models/SalesReport.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ISalesReport extends Document {
  generated_by: mongoose.Types.ObjectId;
  total_sales: number;
  total_transactions: number;
  start_date?: Date;
  end_date?: Date;
  created_at: Date;
}

const SalesReportSchema: Schema = new Schema({
  generated_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  total_sales: { type: Number, required: true },
  total_transactions: { type: Number, required: true },
  start_date: { type: Date },
  end_date: { type: Date },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.models.SalesReport || mongoose.model<ISalesReport>('SalesReport', SalesReportSchema);
