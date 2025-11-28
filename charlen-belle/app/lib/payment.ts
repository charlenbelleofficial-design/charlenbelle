// lib/payment.ts
import { DokuPayment, DokuCustomer } from './doku';
import { createTransaction } from './midtrans';

export interface PaymentTransactionResponse {
  token: string;
  redirect_url: string;
  session_id?: string;
}

export interface CustomerDetails {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface FrontendUrls {
  success: string;
  error: string;
  pending: string;
}

export function getPaymentGateway(): string {
  return process.env.PAYMENT_GATEWAY || 'midtrans';
}

export function isPaymentGatewayConfigured(): boolean {
  const gateway = getPaymentGateway();
  
  if (gateway === 'doku') {
    return !!(process.env.DOKU_CLIENT_ID && process.env.DOKU_SECRET_KEY);
  } else {
    return !!(process.env.MIDTRANS_SERVER_KEY && process.env.MIDTRANS_CLIENT_KEY);
  }
}

export async function createPaymentTransaction(
  orderId: string,
  amount: number,
  customerDetails: CustomerDetails,
  frontendUrls: FrontendUrls
): Promise<PaymentTransactionResponse> {
  const gateway = getPaymentGateway();
  
  console.log(`Creating payment with gateway: ${gateway}`);

  if (gateway === 'doku') {
    // Validate Doku configuration
    if (!process.env.DOKU_CLIENT_ID || !process.env.DOKU_SECRET_KEY) {
      throw new Error('DOKU configuration is incomplete. Check DOKU_CLIENT_ID and DOKU_SECRET_KEY.');
    }

    console.log('DOKU Configuration:', {
      clientId: process.env.DOKU_CLIENT_ID ? 'Set' : 'Missing',
      secretKey: process.env.DOKU_SECRET_KEY ? 'Set' : 'Missing',
      isProduction: process.env.DOKU_IS_PRODUCTION === 'true',
      apiUrl: process.env.DOKU_IS_PRODUCTION === 'true' 
        ? 'https://api.doku.com/checkout/v1/payment'
        : 'https://api-sandbox.doku.com/checkout/v1/payment'
    });

    const dokuPayment = new DokuPayment({
      clientId: process.env.DOKU_CLIENT_ID,
      secretKey: process.env.DOKU_SECRET_KEY,
      isProduction: process.env.DOKU_IS_PRODUCTION === 'true',
      apiUrl: process.env.DOKU_IS_PRODUCTION === 'true' 
        ? 'https://api.doku.com/checkout/v1/payment'
        : 'https://api-sandbox.doku.com/checkout/v1/payment'
    });

    const dokuCustomer: DokuCustomer = {
      id: customerDetails.id,
      name: customerDetails.name,
      email: customerDetails.email,
      phone: customerDetails.phone
    };

    return await dokuPayment.createTransaction(orderId, amount, dokuCustomer, frontendUrls);
  } else {
    // Midtrans fallback
    if (!process.env.MIDTRANS_SERVER_KEY) {
      throw new Error('Midtrans configuration is incomplete.');
    }
    
    return await createTransaction(orderId, amount, customerDetails);
  }
}