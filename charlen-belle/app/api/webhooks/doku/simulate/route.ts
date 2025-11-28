// app/api/webhooks/doku/simulate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Payment from '../../../../models/Payment';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { payment_id, status = 'SUCCESS' } = await req.json();
    
    if (!payment_id) {
      return NextResponse.json(
        { error: 'payment_id is required' },
        { status: 400 }
      );
    }

    // Find the payment to get the order ID
    const payment = await Payment.findById(payment_id);
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    console.log('🧪 [SIMULATOR] Found payment:', {
      paymentId: payment._id,
      dokuOrderId: payment.doku_order_id,
      currentStatus: payment.status
    });

    // Create a realistic Doku notification payload
    const dokuNotification = {
      order: {
        invoice_number: payment.doku_order_id || `BOOKING-${payment._id}`,
        amount: payment.amount
      },
      transaction: {
        status: status,
        date: new Date().toISOString(),
        original_request_id: `req-${Date.now()}`
      },
      service: {
        id: "VIRTUAL_ACCOUNT"
      },
      acquirer: {
        id: "BCA"
      },
      channel: {
        id: "VIRTUAL_ACCOUNT_BCA"
      },
      virtual_account_info: {
        virtual_account_number: "1234567890"
      },
      additional_info: {
        origin: {
          product: "CHECKOUT",
          system: "doku-simulator",
          apiFormat: "JOKUL",
          source: "simulator"
        }
      }
    };

    console.log('🧪 [SIMULATOR] Sending simulated notification:', dokuNotification);

    // Send the simulated notification to your own webhook
    const webhookResponse = await fetch(
      `${process.env.NEXTAUTH_URL || 'https://charlenbelle-git-doku-payment-charlenbelles-projects.vercel.app'}/api/webhooks/doku`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Request-Id': `sim-req-${Date.now()}`,
          'Request-Timestamp': new Date().toISOString(),
          'Client-Id': process.env.DOKU_CLIENT_ID!,
          'Signature': 'simulated-signature-for-testing'
        },
        body: JSON.stringify(dokuNotification)
      }
    );

    const webhookResult = await webhookResponse.text();
    
    console.log('🧪 [SIMULATOR] Webhook response:', {
      status: webhookResponse.status,
      body: webhookResult
    });

    return NextResponse.json({
      success: true,
      message: 'Simulation completed',
      notification_sent: dokuNotification,
      webhook_response: {
        status: webhookResponse.status,
        body: webhookResult
      }
    });

  } catch (error: any) {
    console.error('Simulation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}