// app/api/payments/debug/route.ts - TEMPORARY DEBUG ENDPOINT
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Payment from '../../../models/Payment';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const payments = await Payment.find({})
      .select('_id booking_id status amount payment_gateway doku_order_id doku_transaction_id midtrans_order_id created_at')
      .sort({ created_at: -1 })
      .limit(10)
      .populate('booking_id', '_id user_id');

    console.log('🔍 [DEBUG] All payments:', JSON.stringify(payments, null, 2));

    return NextResponse.json({
      success: true,
      payments: payments.map(p => ({
        _id: p._id,
        booking_id: p.booking_id?._id,
        status: p.status,
        amount: p.amount,
        payment_gateway: p.payment_gateway,
        doku_order_id: p.doku_order_id,
        doku_transaction_id: p.doku_transaction_id,
        midtrans_order_id: p.midtrans_order_id,
        created_at: p.created_at
      }))
    });

  } catch (error: any) {
    console.error('❌ [DEBUG] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}