// app/api/admin/payments/status/route.ts
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
        { error: 'Silakan login terlebih dahulu' },
        { status: 401 }
      );
    }

    // Check if user has permission (admin, superadmin, kasir)
    const allowedRoles = ['admin', 'superadmin', 'kasir'];
    const userRole = session.user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
    return NextResponse.json(
        { error: 'Akses ditolak' },
        { status: 403 }
    );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get('booking_id');

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID diperlukan' },
        { status: 400 }
      );
    }

    const payment = await Payment.findOne({ booking_id: bookingId });

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
        midtrans_transaction_id: payment.midtrans_transaction_id,
        midtrans_redirect_url: payment.midtrans_redirect_url
      }
    });

  } catch (error) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}