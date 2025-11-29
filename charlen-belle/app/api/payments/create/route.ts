// app/api/payments/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Payment from '../../../models/Payment';
import Booking from '../../../models/Booking';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth-config';
import { createPaymentTransaction, getPaymentGateway, isPaymentGatewayConfigured } from '../../../lib/payment';
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

    // Check if payment gateway is configured
    if (!isPaymentGatewayConfigured()) {
      const gateway = getPaymentGateway();
      console.error(`Payment gateway ${gateway} is not configured`);
      return NextResponse.json(
        { error: `Konfigurasi pembayaran ${gateway.toUpperCase()} belum siap. Periksa environment variables.` },
        { status: 503 }
      );
    }

    await connectDB();

    const { booking_id, payment_method, amount } = await req.json();

    console.log('Payment request received:', {
      booking_id,
      payment_method,
      amount,
      user: session.user.email
    });

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

    // Check if booking is already paid - USE THE NEW FIELD
    if (booking.payment_status === 'paid') {
      return NextResponse.json(
        { error: 'Booking sudah dibayar' },
        { status: 400 }
      );
    }

    // Check if booking status allows payment
    if (booking.status !== 'pending') {
      return NextResponse.json(
        { error: 'Booking sudah diproses' },
        { status: 400 }
      );
    }
    
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

    const gateway = getPaymentGateway();
    console.log(`Using payment gateway: ${gateway}`);

    // Generate unique order ID
    const orderId = `BOOKING-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    // Create payment record first
    const payment = await Payment.create({
      booking_id,
      user_id: session.user.id,
      amount,
      payment_method,
      payment_gateway: gateway,
       ...(gateway === 'doku' 
        ? { 
            doku_order_id: orderId,          // ← ADD THIS LINE
            doku_transaction_id: orderId     // ← KEEP THIS LINE
          }
        : { 
            midtrans_order_id: orderId,      // ← ADD THIS FOR CONSISTENCY
            midtrans_transaction_id: orderId 
          }
      ),
      status: 'pending',
      created_at: new Date()
    });

    console.log('Payment record created:', {
      payment_id: payment._id,
      order_id: orderId,
      gateway: gateway
    });

    try {
      const customerDetails = {
        id: session.user.id,
        name: session.user.name || 'Customer',
        email: session.user.email || '',
        phone: booking.user_id.phone_number || '081234567890'
      };

      console.log('Customer details:', {
        id: customerDetails.id,
        name: customerDetails.name,
        email: customerDetails.email,
        phone: customerDetails.phone
      });

      // Define frontend URLs for redirects
      const frontendUrls = {
        success: `${process.env.NEXT_PUBLIC_SITE_URL}/user/dashboard/bookings/payment/success`,
        error: `${process.env.NEXT_PUBLIC_SITE_URL}/user/dashboard/bookings/payment/error`,
        pending: `${process.env.NEXT_PUBLIC_SITE_URL}/user/dashboard/bookings/payment/pending`
      };

      console.log('Creating transaction with gateway:', gateway);

      // Create transaction using unified payment library
      const transaction = await createPaymentTransaction(
        orderId, 
        amount, 
        customerDetails,
        frontendUrls
      );

      console.log('Transaction created successfully:', {
        has_token: !!transaction.token,
        has_redirect_url: !!transaction.redirect_url
      });

      // Update payment with gateway-specific data
      if (gateway === 'doku') {
        payment.doku_redirect_url = transaction.redirect_url;
        payment.doku_token_id = transaction.token;
        payment.doku_session_id = transaction.session_id;
        
        // Store gateway response for debugging
        payment.gateway_response = {
          token: transaction.token,
          redirect_url: transaction.redirect_url,
          session_id: transaction.session_id
        };
      } else {
        payment.midtrans_redirect_url = transaction.redirect_url;
        payment.gateway_response = {
          token: transaction.token,
          redirect_url: transaction.redirect_url
        };
      }
      
      await payment.save();

      console.log('Payment updated with transaction data');

      return NextResponse.json({
        success: true,
        message: 'Payment initiated',
        payment_id: payment._id,
        payment_token: transaction.token,
        redirect_url: transaction.redirect_url,
        gateway: gateway
      }, { status: 201 });

    } catch (gatewayError: any) {
      // Update payment status to failed
      payment.status = 'failed';
      payment.error_message = gatewayError.message;
      await payment.save();

      console.error(`${gateway.toUpperCase()} transaction failed:`, {
        message: gatewayError.message,
        stack: gatewayError.stack
      });
      
      return NextResponse.json(
        { 
          error: `Gagal memproses pembayaran melalui ${gateway.toUpperCase()}`,
          details: gatewayError.message || `Pastikan konfigurasi ${gateway.toUpperCase()} sudah benar`
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Create payment error:', {
      message: error.message,
      stack: error.stack
    });
    return NextResponse.json(
      { error: 'Terjadi kesalahan server', details: error.message },
      { status: 500 }
    );
  }
}