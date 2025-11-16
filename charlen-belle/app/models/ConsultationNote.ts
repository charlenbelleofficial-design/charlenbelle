// app/models/ConsultationNote.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IConsultationNote extends Document {
  booking_id: mongoose.Types.ObjectId;
  doctor_id: mongoose.Types.ObjectId;
  diagnosis?: string;
  recommended_treatments?: string;
  created_at: Date;
}

const ConsultationNoteSchema: Schema = new Schema({
  booking_id: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
  doctor_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  diagnosis: { type: String },
  recommended_treatments: { type: String },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.models.ConsultationNote || mongoose.model<IConsultationNote>('ConsultationNote', ConsultationNoteSchema);
