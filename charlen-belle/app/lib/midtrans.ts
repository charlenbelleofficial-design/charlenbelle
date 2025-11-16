// app/lib/midtrans.ts
const midtransClient = require('midtrans-client');

export const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

export async function createTransaction(
  orderId: string, 
  amount: number, 
  customerDetails: any,
  callbacks?: { // Add this parameter
    success?: string;
    error?: string;
    pending?: string;
  }
) {
  const parameter: any = {
    transaction_details: {
      order_id: orderId,
      gross_amount: amount
    },
    customer_details: customerDetails,
    credit_card: {
      secure: true
    },
    // Specify available payment methods
    enabled_payments: [
      'credit_card',
      'bca_va', 
      'bni_va',
      'bri_va',
      'qris',
      'gopay',
      'shopeepay',
      'cstore'
    ],
    // Set expiry time
    expiry: {
      unit: 'minutes',
      duration: 60
    }
  };

  // Add callback URLs if provided
  if (callbacks) {
    parameter.callbacks = {
      finish: callbacks.success,
      error: callbacks.error,
      pending: callbacks.pending
    };
  }

  try {
    console.log('Creating Midtrans transaction with parameters:', {
      orderId,
      amount,
      callbacks: callbacks ? 'Provided' : 'Not provided'
    });

    const transaction = await snap.createTransaction(parameter);
    
    console.log('Midtrans transaction created:', {
      token: transaction.token ? 'Received' : 'Missing',
      redirect_url: transaction.redirect_url
    });

    return {
      token: transaction.token,
      redirect_url: transaction.redirect_url
    };
  } catch (error: any) {
    console.error('Midtrans API Error:', {
      message: error.message,
      httpStatusCode: error.httpStatusCode,
      apiResponse: error.ApiResponse
    });
    
    throw new Error('Gagal membuat transaksi pembayaran: ' + error.message);
  }
}