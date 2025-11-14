import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Payment from '@/models/Payment';
import Booking from '@/models/Booking';
import { getServerSession } from 'next-auth';
import { createTransaction } from '@/lib/midtrans';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Silakan login terlebih dahulu' },
        { status: 401 }
      );
    }

    await connectDB();

    const { booking_id, payment_method, amount } = await req.json();

    // Verify booking exists and belongs to user
    const booking = await Booking.findById(booking_id).populate('user_id');
    
    if (!booking || booking.user_id._id.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Booking tidak ditemukan' },
        { status: 404 }
      );
    }

    // Generate unique order ID
    const orderId = `ORDER-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    // Create payment record
    const payment = await Payment.create({
      booking_id,
      user_id: session.user.id,
      amount,
      payment_method,
      status: 'pending'
    });

    // For Midtrans payments
    if (payment_method.startsWith('midtrans_')) {
      const customerDetails = {
        first_name: session.user.name,
        email: session.user.email,
        phone: booking.user_id.phone_number || ''
      };

      const transaction = await createTransaction(orderId, amount, customerDetails);

      // Update payment with Midtrans data
      payment.midtrans_transaction_id = orderId;
      payment.midtrans_redirect_url = transaction.redirect_url;
      await payment.save();

      return NextResponse.json({
        message: 'Payment initiated',
        payment_token: transaction.token,
        redirect_url: transaction.redirect_url
      }, { status: 201 });
    }

    // For manual payments (cash, EDC)
    return NextResponse.json({
      message: 'Payment created',
      payment_id: payment._id
    }, { status: 201 });

  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}