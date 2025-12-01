// app/api/bookings/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Booking from '../../../models/Booking';
import Payment from '../../../models/Payment'; // ← ADD THIS IMPORT
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth-config';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const booking = await Booking.findById(id)
      .populate('user_id', 'name email')
      .populate({
        path: 'slot_id',
        populate: [
          { path: 'doctor_id', select: 'name' },
          { path: 'therapist_id', select: 'name' }
        ]
      });

    if (!booking) {
      return NextResponse.json({ error: 'Booking tidak ditemukan' }, { status: 404 });
    }

    // Check if the booking belongs to the current user (unless admin)
    if (booking.user_id._id.toString() !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    // Get payment status - Use imported Payment model
    const payment = await Payment.findOne({ 
      booking_id: id 
    }).sort({ created_at: -1 });

    const payment_status = payment ? payment.status : 'unpaid';

    const bookingWithPayment = {
      ...booking.toObject(),
      payment_status: payment_status === 'paid' ? 'paid' : 'unpaid'
    };

    return NextResponse.json({ booking: bookingWithPayment });

  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}