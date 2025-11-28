// app/api/webhooks/doku/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Payment from '../../../models/Payment';
import Booking from '../../../models/Booking';
import { verifyDokuSignature } from '../../../lib/doku';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Get headers
    const requestId = req.headers.get('Request-Id') || '';
    const requestTimestamp = req.headers.get('Request-Timestamp') || '';
    const signature = req.headers.get('Signature') || '';
    const clientId = req.headers.get('Client-Id') || '';

    // Get request body as text
    const body = await req.text();
    
    console.log('📨 [WEBHOOK] DOKU Notification received:', {
      requestId,
      requestTimestamp,
      clientId,
      signature: signature.substring(0, 50) + '...',
      bodyLength: body.length
    });

    let notification;
    try {
      notification = JSON.parse(body);
      console.log('📊 [WEBHOOK] Notification data:', JSON.stringify(notification, null, 2));
    } catch (parseError) {
      console.error('❌ [WEBHOOK] Error parsing notification body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    // Verify signature - FIXED: Don't pass clientId from headers
    const requestTarget = '/api/webhooks/doku';
    const isValid = verifyDokuSignature(
      requestTarget,
      requestId,
      requestTimestamp,
      body,
      signature
      // Removed: clientId parameter
    );

    if (!isValid) {
      console.error('❌ [WEBHOOK] Invalid DOKU signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Extract notification data with enhanced logging
    const invoiceNumber = notification.order?.invoice_number;
    const transactionStatus = notification.transaction?.status;
    const amount = notification.transaction?.amount;
    const serviceType = notification.service?.id;
    const channelType = notification.channel?.id;

    console.log('🔍 [WEBHOOK] Processing notification:', {
      invoiceNumber,
      transactionStatus,
      amount,
      serviceType,
      channelType,
      notificationType: serviceType === 'VIRTUAL_ACCOUNT' ? 'Virtual Account' : 
                       serviceType === 'CREDIT_CARD' ? 'Credit Card' : 
                       serviceType === 'QRIS' ? 'QRIS' : 'Other'
    });

    if (!invoiceNumber) {
      console.error('❌ [WEBHOOK] Missing invoice number');
      return NextResponse.json(
        { error: 'Invalid notification data - missing invoice number' },
        { status: 400 }
      );
    }

    // Enhanced payment search with multiple fields
    const payment = await Payment.findOne({
      $or: [
        { doku_order_id: invoiceNumber }, // Search by Doku order ID
        { doku_transaction_id: invoiceNumber }, // Search by Doku transaction ID
        { midtrans_order_id: invoiceNumber } // Fallback for Midtrans
      ]
    }).populate('booking_id');

    if (!payment) {
      console.error('❌ [WEBHOOK] Payment not found for invoice:', invoiceNumber);
      console.error('🔍 [WEBHOOK] Searched fields: doku_order_id, doku_transaction_id, midtrans_order_id');
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    console.log('✅ [WEBHOOK] Payment found:', {
      paymentId: payment._id,
      currentStatus: payment.status,
      bookingId: payment.booking_id?._id,
      paymentGateway: payment.payment_gateway,
      amount: payment.amount
    });

    // Update payment status based on DOKU status
    let newPaymentStatus: 'pending' | 'paid' | 'failed' | 'expired' = 'pending';
    let updateBooking = false;
    let errorMessage = '';

    switch (transactionStatus?.toUpperCase()) {
      case 'SUCCESS':
        newPaymentStatus = 'paid';
        payment.paid_at = new Date();
        updateBooking = true;
        console.log('💰 [WEBHOOK] Payment marked as PAID');
        break;

      case 'FAILED':
        newPaymentStatus = 'failed';
        errorMessage = notification.transaction?.message || 'Payment failed via DOKU';
        payment.error_message = errorMessage;
        console.log('❌ [WEBHOOK] Payment marked as FAILED:', errorMessage);
        break;

      case 'EXPIRED':
        newPaymentStatus = 'expired';
        errorMessage = 'Payment expired via DOKU';
        payment.error_message = errorMessage;
        console.log('⏰ [WEBHOOK] Payment marked as EXPIRED');
        break;

      case 'PENDING':
      default:
        newPaymentStatus = 'pending';
        console.log('⏳ [WEBHOOK] Payment remains PENDING');
        break;
    }

    // Update payment with enhanced data
    payment.status = newPaymentStatus;
    payment.notification_data = notification; // Store full notification data
    payment.updated_at = new Date();
    
    // Store Doku-specific data if available
    if (serviceType) {
      payment.gateway_response = {
        ...payment.gateway_response,
        doku_service_type: serviceType,
        doku_channel_type: channelType,
        processed_at: new Date()
      };
    }

    await payment.save();

    // Update booking status if payment is successful
    if (updateBooking && payment.booking_id) {
      try {
        await Booking.findByIdAndUpdate(
          payment.booking_id._id, 
          {
            status: 'confirmed',
            updated_at: new Date()
          }
        );
        console.log('✅ [WEBHOOK] Booking status updated to confirmed');
      } catch (bookingError) {
        console.error('❌ [WEBHOOK] Error updating booking:', bookingError);
      }
    }

    console.log('✅ [WEBHOOK] Payment updated successfully:', {
      paymentId: payment._id,
      newStatus: newPaymentStatus,
      invoiceNumber,
      bookingUpdated: updateBooking
    });

    // Return success response to DOKU (HTTP 200)
    return NextResponse.json({
      success: true,
      message: 'Notification processed successfully',
      payment_id: payment._id,
      status: newPaymentStatus,
      booking_updated: updateBooking
    });

  } catch (error: any) {
    console.error('💥 [WEBHOOK] DOKU notification error:', {
      message: error.message,
      stack: error.stack
    });
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    );
  }
}