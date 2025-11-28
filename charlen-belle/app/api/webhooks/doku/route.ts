// app/api/webhooks/doku/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Payment from '../../../models/Payment';
import Booking from '../../../models/Booking';
import { verifyDokuSignature } from '../../../lib/doku';

export async function POST(req: NextRequest) {
  let notification: any = null;
  
  try {
    await connectDB();

    // Get all headers for debugging
    const headers = {
      'Request-Id': req.headers.get('Request-Id') || '',
      'Request-Timestamp': req.headers.get('Request-Timestamp') || '',
      'Signature': req.headers.get('Signature') || '',
      'Client-Id': req.headers.get('Client-Id') || '',
      'Content-Type': req.headers.get('Content-Type') || '',
      'User-Agent': req.headers.get('User-Agent') || '',
    };

    // Get request body as text
    const body = await req.text();
    
    console.log('🔔 [WEBHOOK] DOKU Webhook Received');
    console.log('📨 [WEBHOOK] DOKU Notification received - START');
    console.log('🔧 [WEBHOOK] Headers:', headers);
    console.log('📦 [WEBHOOK] Body length:', body.length);
    console.log('📦 [WEBHOOK] Raw Body:', body);

    // Try to parse notification
    try {
      notification = body ? JSON.parse(body) : {};
      console.log('📊 [WEBHOOK] Parsed notification:', JSON.stringify(notification, null, 2));
    } catch (parseError) {
      console.error('❌ [WEBHOOK] Error parsing notification body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    // Check if this is a test notification from Doku simulator
    const isTestNotification = headers['User-Agent']?.includes('Doku') || 
                              notification.additional_info?.origin?.system?.includes('simulator');
    
    if (isTestNotification) {
      console.log('🧪 [WEBHOOK] This appears to be a test notification from Doku');
    }

    // Verify signature (skip for empty body or test notifications)
    if (body && headers.Signature) {
      const requestTarget = '/api/webhooks/doku';
      const isValid = verifyDokuSignature(
        requestTarget,
        headers['Request-Id'],
        headers['Request-Timestamp'],
        body,
        headers.Signature
      );

      if (!isValid) {
        console.error('❌ [WEBHOOK] Invalid DOKU signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
      console.log('✅ [WEBHOOK] Signature verified successfully');
    } else {
      console.log('⚠️ [WEBHOOK] Skipping signature verification (empty body or no signature)');
    }

    // Extract notification data with multiple possible field locations
    const invoiceNumber = notification.order?.invoice_number || 
                         notification.invoice_number ||
                         notification.transaction?.invoice_number;

    const transactionStatus = notification.transaction?.status || 
                             notification.status ||
                             notification.transaction_status;

    const amount = notification.order?.amount || 
                  notification.transaction?.amount || 
                  notification.amount;

    // Add notification type detection
    const notificationType = notification.event || notification.type;
    console.log('🎯 [WEBHOOK] Notification Type:', notificationType);

    console.log('🔍 [WEBHOOK] Extracted data:', {
      invoiceNumber,
      transactionStatus,
      amount,
      notificationType,
      rawTransactionStatus: notification.transaction?.status,
      rawOrder: notification.order,
      rawTransaction: notification.transaction
    });

    if (!invoiceNumber) {
      console.error('❌ [WEBHOOK] Missing invoice number in notification');
      console.error('🔍 [WEBHOOK] Available fields:', Object.keys(notification));
      return NextResponse.json(
        { error: 'Invalid notification data - missing invoice number' },
        { status: 400 }
      );
    }

    // Enhanced payment search with better logging
    console.log('🔍 [WEBHOOK] Searching for payment with invoice:', invoiceNumber);
    
    const payment = await Payment.findOne({
      $or: [
        { doku_order_id: invoiceNumber },           // Search by Doku order ID
        { doku_transaction_id: invoiceNumber },     // Search by Doku transaction ID  
        { midtrans_order_id: invoiceNumber }        // Fallback for Midtrans
      ]
    }).populate('booking_id');

    if (!payment) {
      console.error('❌ [WEBHOOK] Payment not found for invoice:', invoiceNumber);
      
      // Log all payments for debugging
      const allPayments = await Payment.find({}).select('doku_order_id doku_transaction_id midtrans_order_id').limit(10);
      console.log('🔍 [WEBHOOK] Recent payments for debugging:', allPayments);
      
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
      amount: payment.amount,
      dokuOrderId: payment.doku_order_id,
      dokuTransactionId: payment.doku_transaction_id
    });

    // ENHANCED STATUS MAPPING FOR DOKU WITH NOTIFICATION TYPE HANDLING
    let newPaymentStatus: 'pending' | 'paid' | 'failed' | 'expired' = 'pending';
    let updateBooking = false;
    let errorMessage = '';

    // Handle different Doku event types first
    switch (notificationType) {
      case 'payment.finished':
      case 'PAYMENT_FINISHED':
      case 'payment.success':
        newPaymentStatus = 'paid';
        payment.paid_at = new Date();
        updateBooking = true;
        console.log('💰 [WEBHOOK] Payment finished successfully (event-based)');
        break;
        
      case 'payment.failed':
      case 'PAYMENT_FAILED':
        newPaymentStatus = 'failed';
        errorMessage = 'Payment failed via DOKU webhook event';
        payment.error_message = errorMessage;
        console.log('❌ [WEBHOOK] Payment failed (event-based)');
        break;
        
      case 'payment.expired':
      case 'PAYMENT_EXPIRED':
        newPaymentStatus = 'expired';
        errorMessage = 'Payment expired via DOKU webhook event';
        payment.error_message = errorMessage;
        console.log('⏰ [WEBHOOK] Payment expired (event-based)');
        break;
        
      default:
        // Fallback to transaction status checking for backward compatibility
        const status = (transactionStatus || '').toUpperCase();
        console.log('🔄 [WEBHOOK] Processing status (fallback):', status);

        switch (status) {
          case 'SUCCESS':
          case 'COMPLETED':
          case 'SETTLEMENT':
            newPaymentStatus = 'paid';
            payment.paid_at = new Date();
            updateBooking = true;
            console.log('💰 [WEBHOOK] Payment marked as PAID (status-based)');
            break;

          case 'FAILED':
          case 'FAILURE':
          case 'DENY':
            newPaymentStatus = 'failed';
            errorMessage = notification.transaction?.message || notification.error_message || 'Payment failed via DOKU';
            payment.error_message = errorMessage;
            console.log('❌ [WEBHOOK] Payment marked as FAILED (status-based):', errorMessage);
            break;

          case 'EXPIRED':
          case 'EXPIRE':
            newPaymentStatus = 'expired';
            errorMessage = 'Payment expired via DOKU';
            payment.error_message = errorMessage;
            console.log('⏰ [WEBHOOK] Payment marked as EXPIRED (status-based)');
            break;

          case 'PENDING':
          case 'CHALLENGE':
          default:
            newPaymentStatus = 'pending';
            console.log('⏳ [WEBHOOK] Payment remains PENDING (status-based)');
            break;
        }
        break;
    }

    // Update payment
    payment.status = newPaymentStatus;
    payment.notification_data = notification;
    payment.updated_at = new Date();
    
    // Store additional Doku data with enhanced information
    payment.gateway_response = {
      ...payment.gateway_response,
      doku_service_type: notification.service?.id,
      doku_channel_type: notification.channel?.id,
      doku_notification_type: notificationType,
      doku_notification_received: new Date(),
      is_test: isTestNotification,
      raw_notification: notification // Store complete notification for debugging
    };

    await payment.save();
    console.log('✅ [WEBHOOK] Payment saved with new status:', newPaymentStatus);

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
        
        // Also update any related data if needed
        if (payment.booking_id.slot_id) {
          console.log('📅 [WEBHOOK] Booking slot confirmed:', payment.booking_id.slot_id);
        }
      } catch (bookingError) {
        console.error('❌ [WEBHOOK] Error updating booking:', bookingError);
        // Don't fail the webhook if booking update fails
      }
    }

    console.log('✅ [WEBHOOK] Processing completed successfully');
    console.log('📊 [WEBHOOK] Final Result:', {
      paymentId: payment._id,
      newStatus: newPaymentStatus,
      bookingUpdated: updateBooking,
      notificationType: notificationType,
      isTest: isTestNotification
    });
    console.log('📨 [WEBHOOK] DOKU Notification received - END');

    // Return success response to DOKU
    return NextResponse.json({
      success: true,
      message: 'Notification processed successfully',
      payment_id: payment._id,
      status: newPaymentStatus,
      booking_updated: updateBooking,
      is_test: isTestNotification,
      processed_at: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('💥 [WEBHOOK] DOKU notification error:', {
      message: error.message,
      stack: error.stack,
      notification: notification,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}