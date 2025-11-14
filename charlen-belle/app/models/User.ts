import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  phone_number?: string;
  role: 'customer' | 'kasir' | 'admin' | 'superadmin' | 'doctor';
  profile_picture?: string;
  created_at: Date;
  updated_at: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  phone_number: { type: String },
  role: {
    type: String,
    enum: ['customer', 'kasir', 'admin', 'superadmin', 'doctor'],
    default: 'customer'
  },
  profile_picture: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);