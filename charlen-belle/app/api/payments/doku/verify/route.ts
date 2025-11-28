// app/api/payments/doku/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Payment from '../../../../models/Payment';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('order_id');
    const transactionId = searchParams.get('transaction_id');

    if (!orderId && !transactionId) {
      return NextResponse.json(
        { error: 'Order ID or Transaction ID required' },
        { status: 400 }
      );
    }

    // Find payment by order ID or transaction ID
    const payment = await Payment.findOne({
      $or: [
        { doku_order_id: orderId },
        { doku_transaction_id: transactionId },
        { midtrans_order_id: orderId } // Fallback
      ]
    }).populate('booking_id');

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      payment: {
        _id: payment._id,
        status: payment.status,
        amount: payment.amount,
        payment_method: payment.payment_method,
        paid_at: payment.paid_at,
        booking_id: payment.booking_id?._id,
        doku_order_id: payment.doku_order_id,
        doku_transaction_id: payment.doku_transaction_id
      }
    });

  } catch (error: any) {
    console.error('Error verifying Doku payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}