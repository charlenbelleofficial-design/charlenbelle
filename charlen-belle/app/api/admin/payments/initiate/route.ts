// app/api/admin/payments/initiate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Payment from '../../../../models/Payment';
import Booking from '../../../../models/Booking';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth-config';
import { createTransaction } from '../../../../lib/midtrans';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
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

    // Check if Midtrans is configured
    if (!process.env.MIDTRANS_SERVER_KEY || !process.env.MIDTRANS_CLIENT_KEY) {
      return NextResponse.json(
        { error: 'Konfigurasi pembayaran belum siap' },
        { status: 503 }
      );
    }

    await connectDB();

    const { booking_id } = await req.json();

    if (!booking_id) {
      return NextResponse.json(
        { error: 'Booking ID diperlukan' },
        { status: 400 }
      );
    }

    // Verify booking exists
    const booking = await Booking.findById(booking_id).populate('user_id');
    
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check if booking already has a pending or paid payment
    const existingPayment = await Payment.findOne({ booking_id });
    if (existingPayment) {
      if (existingPayment.status === 'paid') {
        return NextResponse.json(
          { error: 'Booking sudah dibayar' },
          { status: 400 }
        );
      }
      
      if (existingPayment.status === 'pending' && existingPayment.midtrans_redirect_url) {
        // Return existing payment URL
        return NextResponse.json({
          success: true,
          message: 'Payment already initiated',
          redirect_url: existingPayment.midtrans_redirect_url,
          payment_id: existingPayment._id
        });
      }
    }

    // Generate unique order ID
    const orderId = `ADMIN-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    // Create or update payment record
    let payment;
    if (existingPayment) {
      payment = await Payment.findByIdAndUpdate(
        existingPayment._id,
        {
          midtrans_transaction_id: orderId,
          status: 'pending',
          updated_at: new Date()
        },
        { new: true }
      );
    } else {
      payment = await Payment.create({
        booking_id,
        user_id: booking.user_id._id,
        amount: booking.total_amount,
        payment_method: 'midtrans_admin',
        status: 'pending',
        midtrans_transaction_id: orderId,
        created_at: new Date()
      });
    }

    try {
      const customerDetails = {
        first_name: booking.user_id.name || 'Customer',
        email: booking.user_id.email || '',
        phone: booking.user_id.phone_number || '081234567890'
      };

      // Define frontend URLs for Midtrans redirects
      const frontendUrls = {
        success: `${process.env.NEXT_PUBLIC_SITE_URL}/user/dashboard/bookings/payment/success`,
        error: `${process.env.NEXT_PUBLIC_SITE_URL}/user/dashboard/bookings/payment/error`,
        pending: `${process.env.NEXT_PUBLIC_SITE_URL}/user/dashboard/bookings/payment/pending`
      };

      // Create Midtrans transaction
      const transaction = await createTransaction(
        orderId, 
        booking.total_amount, 
        customerDetails,
        frontendUrls
      );

      // Update payment with Midtrans data
      payment.midtrans_redirect_url = transaction.redirect_url;
      await payment.save();

      return NextResponse.json({
        success: true,
        message: 'Payment initiated',
        payment_id: payment._id,
        redirect_url: transaction.redirect_url,
      }, { status: 201 });

    } catch (midtransError: any) {
      // Update payment status to failed
      payment.status = 'failed';
      payment.error_message = midtransError.message;
      await payment.save();

      console.error('Midtrans transaction failed:', midtransError);
      
      return NextResponse.json(
        { 
          error: 'Gagal memproses pembayaran melalui Midtrans',
          details: midtransError.message || 'Pastikan konfigurasi Midtrans sudah benar'
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Admin payment initiation error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}