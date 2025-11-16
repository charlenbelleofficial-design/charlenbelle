// app/api/payments/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Payment from '../../../models/Payment';
import Booking from '../../../models/Booking';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth-config';
import { createTransaction } from '../../../lib/midtrans';
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

    // Check if Midtrans is configured
    if (!process.env.MIDTRANS_SERVER_KEY || !process.env.MIDTRANS_CLIENT_KEY) {
      return NextResponse.json(
        { error: 'Konfigurasi pembayaran belum siap' },
        { status: 503 }
      );
    }

    await connectDB();

    const { booking_id, payment_method, amount } = await req.json();

    // Validate required fields
    if (!booking_id || !payment_method || !amount) {
      return NextResponse.json(
        { error: 'Data pembayaran tidak lengkap' },
        { status: 400 }
      );
    }

    // Verify booking exists and belongs to user
    const booking = await Booking.findById(booking_id).populate('user_id');
    
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check if booking belongs to current user
    if (booking.user_id._id.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Akses ditolak' },
        { status: 403 }
      );
    }

    // Check if booking is already paid
    if (booking.status !== 'pending') {
      return NextResponse.json(
        { error: 'Booking sudah diproses' },
        { status: 400 }
      );
    }

    // Generate unique order ID
    const orderId = `BOOKING-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    // Create payment record first
    const payment = await Payment.create({
      booking_id,
      user_id: session.user.id,
      amount,
      payment_method,
      status: 'pending',
      midtrans_transaction_id: orderId,
      created_at: new Date()
    });

    try {
      // For Midtrans payments
      if (payment_method.startsWith('midtrans_')) {
        const customerDetails = {
          first_name: session.user.name || 'Customer',
          email: session.user.email || '',
          phone: booking.user_id.phone_number || '081234567890'
        };

        // Define frontend URLs for Midtrans redirects
        const frontendUrls = {
          success: `${process.env.NEXT_PUBLIC_SITE_URL}/user/dashboard/bookings/payment/success`,
          error: `${process.env.NEXT_PUBLIC_SITE_URL}/user/dashboard/bookings/payment/error`,
          pending: `${process.env.NEXT_PUBLIC_SITE_URL}/user/dashboard/bookings/payment/pending`
        };

        // Pass the URLs to createTransaction function
        const transaction = await createTransaction(
          orderId, 
          amount, 
          customerDetails,
          frontendUrls // Add this parameter
        );

        // Update payment with Midtrans data
        payment.midtrans_redirect_url = transaction.redirect_url;
        await payment.save();

        return NextResponse.json({
          success: true,
          message: 'Payment initiated',
          payment_id: payment._id, // Make sure this is included
          payment_token: transaction.token,
          redirect_url: transaction.redirect_url,
        }, { status: 201 });
      }

      // For manual payments
      return NextResponse.json({
        success: true,
        message: 'Payment created for manual processing',
        payment_id: payment._id
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
    console.error('Create payment error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}