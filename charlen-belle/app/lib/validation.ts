import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  email: z.string().email('Format email tidak valid'),
  password: z.string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/[A-Z]/, 'Password harus mengandung huruf besar')
    .regex(/[a-z]/, 'Password harus mengandung huruf kecil')
    .regex(/[0-9]/, 'Password harus mengandung angka'),
  phone_number: z.string().regex(/^(\+62|62|0)[0-9]{9,12}$/, 'Format nomor telepon tidak valid').optional()
});

export const bookingSchema = z.object({
  slot_id: z.string().min(1, 'Slot ID wajib diisi'),
  type: z.enum(['consultation', 'treatment']),
  notes: z.string().max(500).optional()
});

export const paymentSchema = z.object({
  booking_id: z.string().min(1),
  payment_method: z.enum([
    'midtrans_qris',
    'midtrans_cc',
    'midtrans_va',
    'manual_cash',
    'manual_edc',
    'manual_transfer'
  ]),
  amount: z.number().positive('Jumlah harus positif')
});

export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; error?: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Validasi gagal' };
  }
}