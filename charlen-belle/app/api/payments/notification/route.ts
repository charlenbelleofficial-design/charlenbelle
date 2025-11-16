// app/api/payments/notification/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Payment from '../../../models/Payment';
import Booking from '../../../models/Booking';
import BookingSlot from '../../../models/BookingSlot';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const notification = await req.json();
    console.log('Midtrans notification received:', notification);

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
      console.error('Invalid signature:', { received: notification.signature_key, calculated: signatureKey });
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 403 }
      );
    }

    await connectDB();

    const payment = await Payment.findOne({ 
      midtrans_transaction_id: orderId 
    }).populate('booking_id');

    if (!payment) {
      console.error('Payment not found for order:', orderId);
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    console.log('Payment found:', payment._id, 'Current status:', payment.status);

    // Update payment status based on Midtrans notification
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;

    if (transactionStatus === 'capture') {
      if (fraudStatus === 'challenge') {
        // Payment is challenged, need manual review
        payment.status = 'challenged';
        console.log('Payment challenged:', orderId);
      } else if (fraudStatus === 'accept') {
        // Payment successful
        payment.status = 'paid';
        payment.paid_at = new Date();
        payment.midtrans_response = notification;
        
        // Update booking status
        await Booking.findByIdAndUpdate(payment.booking_id, {
          status: 'confirmed',
          updated_at: new Date()
        });
        
        console.log('Payment successful, booking confirmed:', payment.booking_id);
      }
    } else if (transactionStatus === 'settlement') {
      // Payment settled
      payment.status = 'paid';
      payment.paid_at = new Date();
      payment.midtrans_response = notification;
      
      // Update booking status
      await Booking.findByIdAndUpdate(payment.booking_id, {
        status: 'confirmed',
        updated_at: new Date()
      });
      
      console.log('Payment settled, booking confirmed:', payment.booking_id);
    } else if (transactionStatus === 'pending') {
      payment.status = 'pending';
      console.log('Payment pending:', orderId);
    } else if (transactionStatus === 'deny' ||
               transactionStatus === 'cancel' ||
               transactionStatus === 'expire') {
      payment.status = 'failed';
      payment.midtrans_response = notification;
      
      // Optionally free up the booking slot if payment fails
      // await BookingSlot.findByIdAndUpdate(booking.slot_id, { is_available: true });
      
      console.log('Payment failed:', orderId, transactionStatus);
    }

    await payment.save();
    console.log('Payment status updated to:', payment.status);

    return NextResponse.json({ message: 'OK' }, { status: 200 });

  } catch (error) {
    console.error('Payment notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}