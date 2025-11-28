// app/api/webhooks/doku/manual-test/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Payment from '../../../../models/Payment';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { payment_id, status } = await req.json();
    
    if (!payment_id || !status) {
      return NextResponse.json(
        { error: 'payment_id and status are required' },
        { status: 400 }
      );
    }

    const payment = await Payment.findById(payment_id);
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Update payment status
    payment.status = status;
    if (status === 'paid') {
      payment.paid_at = new Date();
    }
    payment.updated_at = new Date();
    
    await payment.save();

    console.log('🧪 [MANUAL TEST] Payment status updated:', {
      paymentId: payment._id,
      newStatus: status
    });

    return NextResponse.json({
      success: true,
      message: 'Payment status updated manually',
      payment: {
        _id: payment._id,
        status: payment.status,
        paid_at: payment.paid_at
      }
    });

  } catch (error: any) {
    console.error('Manual test error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}