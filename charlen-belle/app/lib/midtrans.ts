const midtransClient = require('midtrans-client');

export const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

export async function createTransaction(orderId: string, amount: number, customerDetails: any) {
  const parameter = {
    transaction_details: {
      order_id: orderId,
      gross_amount: amount
    },
    customer_details: customerDetails,
    enabled_payments: ['qris', 'credit_card', 'bca_va', 'bni_va', 'bri_va', 'gopay', 'shopeepay'],
    credit_card: {
      secure: true
    }
  };

  try {
    const transaction = await snap.createTransaction(parameter);
    return {
      token: transaction.token,
      redirect_url: transaction.redirect_url
    };
  } catch (error) {
    console.error('Midtrans error:', error);
    throw error;
  }
}