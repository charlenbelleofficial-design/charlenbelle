// app/api/payments/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Payment from '../../../../models/Payment';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth-config';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const paymentId = params.id;

    // Find payment
    const payment = await Payment.findById(paymentId)
      .populate('booking_id')
      .populate('user_id');

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Check if user owns this payment
    if (payment.user_id._id.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Return payment status
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
        created_at: payment.created_at,
        updated_at: payment.updated_at
      }
    });

  } catch (error: any) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}