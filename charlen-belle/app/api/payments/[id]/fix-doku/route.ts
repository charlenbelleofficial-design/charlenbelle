// app/api/payments/[id]/fix-doku/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Payment from '../../../../models/Payment';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const payment = await Payment.findById(id);
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    console.log('🔧 [FIX] Current payment data:', {
      doku_order_id: payment.doku_order_id,
      doku_transaction_id: payment.doku_transaction_id,
      status: payment.status
    });

    // Set doku_order_id to match doku_transaction_id
    if (payment.doku_transaction_id && !payment.doku_order_id) {
      payment.doku_order_id = payment.doku_transaction_id;
      await payment.save();
      console.log('✅ [FIX] Payment fixed - doku_order_id added');
    } else {
      console.log('ℹ️ [FIX] No fix needed - doku_order_id already exists');
    }

    return NextResponse.json({
      success: true,
      message: 'Payment fixed - doku_order_id added',
      payment: {
        _id: payment._id,
        doku_order_id: payment.doku_order_id,
        doku_transaction_id: payment.doku_transaction_id,
        status: payment.status
      }
    });

  } catch (error: any) {
    console.error('Fix error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}