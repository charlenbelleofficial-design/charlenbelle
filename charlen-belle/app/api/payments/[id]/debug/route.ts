// app/api/payments/[id]/debug/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Payment from '../../../../models/Payment';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const payment = await Payment.findById(params.id);
    
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
        payment_gateway: payment.payment_gateway,
        doku_order_id: payment.doku_order_id,
        doku_transaction_id: payment.doku_transaction_id,
        doku_redirect_url: payment.doku_redirect_url,
        created_at: payment.created_at,
        updated_at: payment.updated_at,
        paid_at: payment.paid_at
      }
    });

  } catch (error: any) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}