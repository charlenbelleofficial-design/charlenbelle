import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Payment from '@/models/Payment';
import Booking from '@/models/Booking';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const notification = await req.json();

    // Verify signature
    const serverKey = process.env.MIDTRANS_SERVER_KEY!;
    const orderId = notification.order_id;
    const statusCode = notification.status_code;
    const grossAmount = notification.gross_amount;
    
    const signatureKey = crypto
      .createHash('sha512')
      .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
      .digest('hex');

    if (signatureKey !== notification.signature_key) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 403 }
      );
    }

    await connectDB();

    const payment = await Payment.findOne({ 
      midtrans_transaction_id: orderId 
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Update payment status based on Midtrans notification
    if (notification.transaction_status === 'capture' || 
        notification.transaction_status === 'settlement') {
      payment.status = 'paid';
      payment.paid_at = new Date();
      await payment.save();

      // Update booking status
      await Booking.findByIdAndUpdate(payment.booking_id, {
        status: 'confirmed'
      });

      // TODO: Send email confirmation
    } else if (notification.transaction_status === 'deny' ||
               notification.transaction_status === 'cancel' ||
               notification.transaction_status === 'expire') {
      payment.status = 'failed';
      await payment.save();
    }

    return NextResponse.json({ message: 'OK' }, { status: 200 });

  } catch (error) {
    console.error('Payment notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}