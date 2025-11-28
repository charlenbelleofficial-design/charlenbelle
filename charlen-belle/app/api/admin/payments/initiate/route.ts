// app/api/admin/payments/initiate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Payment from '../../../../models/Payment';
import Booking from '../../../../models/Booking';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth-config';
import { createPaymentTransaction, getPaymentGateway, isPaymentGatewayConfigured } from '../../../../lib/payment';
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

    // Check if payment gateway is configured
    if (!isPaymentGatewayConfigured()) {
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

    const gateway = getPaymentGateway();

    // Check if booking already has a pending or paid payment
    const existingPayment = await Payment.findOne({ booking_id });
    if (existingPayment) {
      if (existingPayment.status === 'paid') {
        return NextResponse.json(
          { error: 'Booking sudah dibayar' },
          { status: 400 }
        );
      }
      
      // Return existing payment URL based on gateway
      if (existingPayment.status === 'pending') {
        const redirectUrl = gateway === 'doku' 
          ? existingPayment.doku_redirect_url 
          : existingPayment.midtrans_redirect_url;
          
        if (redirectUrl) {
          return NextResponse.json({
            success: true,
            message: 'Payment already initiated',
            payment_id: existingPayment._id, // ✅ Use existingPayment, not payment
            order_id: existingPayment.doku_transaction_id || existingPayment.midtrans_transaction_id, // ✅ Use existing payment's transaction ID
            redirect_url: redirectUrl, // ✅ Use the redirectUrl we defined above
            gateway: gateway
          });
        }
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
          payment_gateway: gateway,
          ...(gateway === 'doku' 
            ? { 
                doku_transaction_id: orderId,
                doku_order_id: orderId // ✅ Also store in doku_order_id field
              }
            : { 
                midtrans_transaction_id: orderId,
                midtrans_order_id: orderId
              }
          ),
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
        payment_method: `${gateway}_admin`,
        payment_gateway: gateway,
        ...(gateway === 'doku' 
          ? { 
              doku_transaction_id: orderId,
              doku_order_id: orderId // ✅ Also store in doku_order_id field
            }
          : { 
              midtrans_transaction_id: orderId,
              midtrans_order_id: orderId
            }
        ),
        status: 'pending',
        created_at: new Date()
      });
    }

    try {
      const customerDetails = {
        id: booking.user_id._id.toString(),
        name: booking.user_id.name || 'Customer',
        email: booking.user_id.email || '',
        phone: booking.user_id.phone_number || '081234567890'
      };

      // Define frontend URLs for redirects
      const frontendUrls = {
        success: `${process.env.NEXT_PUBLIC_SITE_URL}/user/dashboard/bookings/payment/success`,
        error: `${process.env.NEXT_PUBLIC_SITE_URL}/user/dashboard/bookings/payment/error`,
        pending: `${process.env.NEXT_PUBLIC_SITE_URL}/user/dashboard/bookings/payment/pending`
      };

      // Create transaction using unified payment library
      const transaction = await createPaymentTransaction(
        orderId, 
        booking.total_amount, 
        customerDetails,
        frontendUrls
      );

      // Update payment with gateway-specific data
      if (gateway === 'doku') {
        payment.doku_redirect_url = transaction.redirect_url;
        payment.doku_token_id = transaction.token;
        
        // Only assign session_id if it exists
        if ('session_id' in transaction) {
          payment.doku_session_id = transaction.session_id;
        }
      } else {
        payment.midtrans_redirect_url = transaction.redirect_url;
      }
      
      await payment.save();

      return NextResponse.json({
        success: true,
        message: 'Payment initiated',
        payment_id: payment._id,
        order_id: orderId, // ✅ ADD THIS LINE - return the order ID
        redirect_url: transaction.redirect_url,
        gateway: gateway
      }, { status: 201 });

    } catch (gatewayError: any) {
      // Update payment status to failed
      payment.status = 'failed';
      payment.error_message = gatewayError.message;
      await payment.save();

      console.error(`${gateway.toUpperCase()} transaction failed:`, gatewayError);
      
      return NextResponse.json(
        { 
          error: `Gagal memproses pembayaran melalui ${gateway.toUpperCase()}`,
          details: gatewayError.message || `Pastikan konfigurasi ${gateway.toUpperCase()} sudah benar`
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