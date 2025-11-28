// app/api/payments/verify-doku/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Payment from '../../../models/Payment';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { order_id, transaction_id } = await req.json();

    console.log('🔍 [VERIFY] Looking for payment with:', {
      order_id,
      transaction_id
    });

    if (!order_id && !transaction_id) {
      return NextResponse.json(
        { error: 'Order ID or Transaction ID required' },
        { status: 400 }
      );
    }

    // Search for payment by multiple fields
    const payment = await Payment.findOne({
      $or: [
        { doku_order_id: order_id },
        { doku_transaction_id: order_id },
        { midtrans_order_id: order_id },
        { doku_transaction_id: transaction_id },
        { _id: order_id } // Also try searching by payment ID
      ]
    }).populate('booking_id');

    if (!payment) {
      console.error('❌ [VERIFY] Payment not found for:', { order_id, transaction_id });
      
      // Log available payments for debugging
      const recentPayments = await Payment.find({})
        .select('doku_order_id doku_transaction_id midtrans_order_id status')
        .sort({ created_at: -1 })
        .limit(5);
      console.log('📋 [VERIFY] Recent payments:', recentPayments);
      
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    console.log('✅ [VERIFY] Payment found:', {
      paymentId: payment._id,
      status: payment.status,
      dokuOrderId: payment.doku_order_id,
      dokuTransactionId: payment.doku_transaction_id,
      amount: payment.amount
    });

    return NextResponse.json({
      success: true,
      payment: {
        _id: payment._id,
        status: payment.status,
        amount: payment.amount,
        payment_method: payment.payment_method,
        payment_gateway: payment.payment_gateway,
        paid_at: payment.paid_at,
        booking_id: payment.booking_id?._id,
        doku_order_id: payment.doku_order_id,
        doku_transaction_id: payment.doku_transaction_id,
        created_at: payment.created_at
      }
    });

  } catch (error: any) {
    console.error('❌ [VERIFY] Doku payment verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}