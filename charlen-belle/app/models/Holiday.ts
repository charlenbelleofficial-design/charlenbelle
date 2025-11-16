import mongoose, { Schema, Document } from 'mongoose';

export interface IHoliday extends Document {
  date: Date;
  name: string;
  description?: string;
  is_recurring: boolean;
  created_at: Date;
  updated_at: Date;
}

const HolidaySchema: Schema = new Schema({
  date: { type: Date, required: true },
  name: { type: String, required: true },
  description: { type: String },
  is_recurring: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Add index for date queries
HolidaySchema.index({ date: 1 });

export default mongoose.models.Holiday || mongoose.model<IHoliday>('Holiday', HolidaySchema);