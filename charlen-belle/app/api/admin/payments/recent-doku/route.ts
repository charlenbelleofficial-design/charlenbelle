// app/api/payments/recent-doku/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Payment from '../../../../models/Payment';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth-config';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Find the most recent Doku payment for this user
    const payment = await Payment.findOne({
      user_id: session.user.id,
      payment_gateway: 'doku'
    })
    .sort({ created_at: -1 }) // Most recent first
    .populate('booking_id');

    if (!payment) {
      return NextResponse.json(
        { error: 'No recent Doku payment found' },
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
        doku_transaction_id: payment.doku_transaction_id,
        created_at: payment.created_at
      }
    });

  } catch (error: any) {
    console.error('Recent Doku payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}