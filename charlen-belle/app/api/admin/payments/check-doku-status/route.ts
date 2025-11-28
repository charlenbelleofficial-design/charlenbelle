// app/api/admin/payments/check-doku-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Payment from '../../../../models/Payment';
import Booking from '../../../../models/Booking';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get('booking_id');

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID required' },
        { status: 400 }
      );
    }

    await connectDB();

    const payment = await Payment.findOne({ booking_id: bookingId });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // For Doku, we primarily rely on webhooks
    // This endpoint just returns the current status from our database
    return NextResponse.json({
      success: true,
      payment: {
        _id: payment._id,
        status: payment.status,
        amount: payment.amount,
        payment_method: payment.payment_method,
        paid_at: payment.paid_at,
        doku_order_id: payment.doku_order_id,
        doku_transaction_id: payment.doku_transaction_id
      },
      message: 'Payment status retrieved from database'
    });

  } catch (error: any) {
    console.error('Doku status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}