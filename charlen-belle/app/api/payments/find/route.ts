// app/api/payments/find/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Payment from '../../../models/Payment';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth-config';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Silakan login terlebih dahulu' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('order_id');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID diperlukan' },
        { status: 400 }
      );
    }

    const payment = await Payment.findOne({ 
      midtrans_transaction_id: orderId,
      user_id: session.user.id 
    }).populate('booking_id');

    if (!payment) {
      return NextResponse.json(
        { error: 'Pembayaran tidak ditemukan' },
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
        midtrans_transaction_id: payment.midtrans_transaction_id
      }
    });

  } catch (error) {
    console.error('Find payment error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}