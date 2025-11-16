// app/api/test-midtrans/route.ts
import { NextResponse } from 'next/server';
import { snap } from '../../lib/midtrans';

export async function GET() {
  try {
    // Test connection by creating a simple transaction
    const parameter = {
      transaction_details: {
        order_id: `TEST-${Date.now()}`,
        gross_amount: 10000
      },
      customer_details: {
        first_name: 'Test',
        email: 'test@example.com'
      }
    };

    const transaction = await snap.createTransaction(parameter);
    
    return NextResponse.json({
      success: true,
      message: 'Midtrans configuration is correct',
      transaction: {
        token: transaction.token ? 'Received' : 'Missing',
        redirect_url: transaction.redirect_url ? 'Received' : 'Missing'
      }
    });
  } catch (error: any) {
    console.error('Midtrans test error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Midtrans configuration error',
      details: {
        message: error.message,
        httpStatusCode: error.httpStatusCode,
        apiResponse: error.ApiResponse
      }
    }, { status: 500 });
  }
}