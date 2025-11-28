// app/api/payments/verify-doku/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Payment from '../../../models/Payment';
import Booking from '../../../models/Booking';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { order_id, transaction_id } = await req.json();

    if (!order_id && !transaction_id) {
      return NextResponse.json(
        { error: 'Order ID or Transaction ID required' },
        { status: 400 }
      );
    }

    // Find payment by order ID or transaction ID
    const payment = await Payment.findOne({
      $or: [
        { doku_order_id: order_id },
        { doku_transaction_id: transaction_id || order_id },
        { midtrans_order_id: order_id }
      ]
    }).populate('booking_id');

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // If payment is already paid, return success
    if (payment.status === 'paid') {
      return NextResponse.json({
        success: true,
        payment: {
          _id: payment._id,
          status: payment.status,
          amount: payment.amount,
          payment_method: payment.payment_method,
          paid_at: payment.paid_at,
          booking_id: payment.booking_id?._id
        }
      });
    }

    // For pending payments, we can't check status directly with Doku
    // We rely on webhooks, but we can return the current status
    return NextResponse.json({
      success: true,
      payment: {
        _id: payment._id,
        status: payment.status,
        amount: payment.amount,
        payment_method: payment.payment_method,
        paid_at: payment.paid_at,
        booking_id: payment.booking_id?._id
      },
      message: payment.status === 'pending' 
        ? 'Payment is still being processed' 
        : 'Payment status retrieved'
    });

  } catch (error: any) {
    console.error('Doku payment verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}