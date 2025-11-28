// lib/doku.ts
import crypto from 'crypto';

export interface DokuConfig {
  clientId: string;
  secretKey: string;
  isProduction: boolean;
  apiUrl: string;
}

export interface DokuCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface DokuTransactionResponse {
  token: string;
  redirect_url: string;
  session_id?: string;
  order_id?: string; // Added
}

export interface DokuPaymentRequest {
  order: {
    amount: number;
    invoice_number: string;
    currency?: string;
    callback_url?: string;
    callback_url_cancel?: string;
    callback_url_result?: string;
    language?: string;
    auto_redirect?: boolean;
    disable_retry_payment?: boolean;
  };
  payment?: {
    payment_due_date?: number;
    payment_method_types?: string[];
  };
  customer?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address?: string;
    country?: string;
  };
}

export class DokuPayment {
  private config: DokuConfig;

  constructor(config: DokuConfig) {
    this.config = config;
  }

  private generateSignature(
    clientId: string, 
    requestId: string, 
    requestTimestamp: string, 
    requestTarget: string, 
    requestBody: string = ''
  ): string {
    try {
      console.log('🔐 [SIGNATURE] Starting signature generation...');

      // Step 1: Clean request body - remove \r characters (Windows issue)
      const cleanBody = requestBody ? requestBody.replace(/\r/g, '') : '';
      
      // Step 2: Calculate Digest (Base64 encoded SHA-256 hash)
      let digest = '';
      if (cleanBody) {
        const hash = crypto.createHash('sha256');
        hash.update(cleanBody);
        const hashBuffer = hash.digest();
        digest = hashBuffer.toString('base64');
        console.log('📦 [SIGNATURE] Digest (Base64):', digest);
      }

      // Step 3: Prepare signature components dengan format yang benar
      // Format: Component1\nComponent2\nComponent3\nComponent4\nDigest
      const signatureComponents = [
        `Client-Id:${clientId}`,
        `Request-Id:${requestId}`,
        `Request-Timestamp:${requestTimestamp}`,
        `Request-Target:${requestTarget}`,
        `Digest:${digest}`
      ];

      // Step 4: Create signature string dengan newline characters
      const signatureString = signatureComponents.join('\n');
      console.log('📝 [SIGNATURE] Signature String:', signatureString);
      console.log('📏 [SIGNATURE] Signature String Length:', signatureString.length);

      // Step 5: Generate HMAC SHA256 signature
      console.log('🔑 [SIGNATURE] Using Secret Key:', this.config.secretKey ? 'Set' : 'Missing');
      
      const hmac = crypto.createHmac('sha256', this.config.secretKey);
      hmac.update(signatureString);
      const signatureBase64 = hmac.digest('base64');

      const finalSignature = `HMACSHA256=${signatureBase64}`;
      console.log('✅ [SIGNATURE] Final Signature:', finalSignature);

      return finalSignature;

    } catch (error) {
      console.error('❌ [SIGNATURE] Error generating signature:', error);
      throw error;
    }
  }

  private getCurrentUTCTimestamp(): string {
    const now = new Date();
    // Format: YYYY-MM-DDTHH:mm:ssZ (ISO 8601 without milliseconds)
    const utcTimestamp = now.toISOString().split('.')[0] + 'Z';
    console.log('🕒 [TIMESTAMP] UTC Timestamp:', utcTimestamp);
    return utcTimestamp;
  }

  private generateRequestId(): string {
    const requestId = crypto.randomUUID();
    console.log('🆔 [REQUEST] Request ID:', requestId);
    return requestId;
  }

  // Add request body validation
  private validateRequestBody(requestBody: DokuPaymentRequest): void {
    if (!requestBody.order.amount || requestBody.order.amount <= 0) {
      throw new Error('Invalid amount: Amount must be greater than 0');
    }
    if (!requestBody.order.invoice_number) {
      throw new Error('Invoice number is required');
    }
    if (!requestBody.customer?.id || !requestBody.customer?.name) {
      throw new Error('Customer information (id and name) is required');
    }
    if (!requestBody.customer.email || !requestBody.customer.phone) {
      throw new Error('Customer email and phone are required');
    }
  }

  async createTransaction(
    orderId: string,
    amount: number,
    customer: DokuCustomer,
    frontendUrls: { success: string; error: string; pending: string }
  ): Promise<DokuTransactionResponse> {
    try {
      console.log('🚀 [DOKU] Starting transaction creation...');
      
      // Validate and get base URL
      const getBaseUrl = () => {
        // Priority: Use provided frontendUrls, then environment variable, then fallback
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                        process.env.VERCEL_URL || 
                        'http://localhost:3000';
        
        // Ensure the URL has protocol
        if (baseUrl.startsWith('http')) {
            return baseUrl;
        }
        return `https://${baseUrl}`;
      };

      const baseUrl = getBaseUrl();
      console.log('🌐 [DOKU] Base URL:', baseUrl);

      // Validate URLs
      const successUrl = frontendUrls.success || `${baseUrl}/user/dashboard/bookings/payment/doku-success`;
      const errorUrl = frontendUrls.error || `${baseUrl}/user/dashboard/bookings/payment/error`;
      const pendingUrl = frontendUrls.pending || `${baseUrl}/user/dashboard/bookings/payment/pending`;

      console.log('🔗 [DOKU] Callback URLs:', {
        success: successUrl,
        error: errorUrl,
        pending: pendingUrl
      });

      const requestId = this.generateRequestId();
      const requestTimestamp = this.getCurrentUTCTimestamp();
      const requestTarget = '/checkout/v1/payment';

      // Prepare request body
      const requestBody: DokuPaymentRequest = {
        order: {
            amount: amount,
            invoice_number: orderId,
            currency: 'IDR',
            callback_url: `${baseUrl}/user/dashboard/bookings/payment/doku-success?order_id=${orderId}`,
            callback_url_cancel: `${baseUrl}/user/dashboard/bookings/payment/error?order_id=${orderId}`,
            callback_url_result: `${baseUrl}/user/dashboard/bookings/payment/doku-success?order_id=${orderId}`,
            language: 'ID',
            auto_redirect: true,
            disable_retry_payment: false
        },
        payment: {
          payment_due_date: 60,
          payment_method_types: [
            'VIRTUAL_ACCOUNT_BCA',
            'VIRTUAL_ACCOUNT_BANK_MANDIRI',
            'VIRTUAL_ACCOUNT_BRI', 
            'VIRTUAL_ACCOUNT_BNI',
            'CREDIT_CARD',
            'QRIS',
            'EMONEY_OVO',
            'EMONEY_SHOPEEPAY'
          ]
        },
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          country: 'ID'
        }
      };

      // Validate request body
      this.validateRequestBody(requestBody);

      const bodyString = JSON.stringify(requestBody);
      console.log('📄 [REQUEST] Request Body:', bodyString);

      // Generate signature dengan format yang benar
      const signature = this.generateSignature(
        this.config.clientId,
        requestId,
        requestTimestamp,
        requestTarget,
        bodyString
      );

      console.log('📋 [HEADERS] Request Headers:', {
        'Client-Id': this.config.clientId,
        'Request-Id': requestId,
        'Request-Timestamp': requestTimestamp,
        'Signature': signature,
        'Content-Type': 'application/json'
      });

      // Make API request
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Client-Id': this.config.clientId,
          'Request-Id': requestId,
          'Request-Timestamp': requestTimestamp,
          'Signature': signature
        },
        body: bodyString
      });

      const responseText = await response.text();
      console.log('📨 [RESPONSE] Status:', response.status);
      console.log('📨 [RESPONSE] Body:', responseText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { error: responseText };
        }
        
        console.error('❌ [ERROR] DOKU API Error:', {
          status: response.status,
          data: errorData
        });

        // Enhanced error handling for specific Doku errors
        if (response.status === 400) {
          if (errorData.error?.code === 'invalid_signature') {
            console.error('🔍 [DEBUG] Signature verification failed');
            console.error('🔍 [DEBUG] Please double-check:');
            console.error('🔍 [DEBUG] 1. Client ID:', this.config.clientId);
            console.error('🔍 [DEBUG] 2. Secret Key length:', this.config.secretKey?.length);
            console.error('🔍 [DEBUG] 3. Environment:', this.config.isProduction ? 'Production' : 'Sandbox');
          } else if (errorData.error?.code === 'invalid_client_id') {
            console.error('🔍 [DEBUG] Invalid Client ID');
          } else if (errorData.error?.code === 'invalid_amount') {
            console.error('🔍 [DEBUG] Invalid amount format');
          } else if (errorData.error?.code === 'invalid_customer') {
            console.error('🔍 [DEBUG] Invalid customer data');
          }
        }

        throw new Error(`DOKU API Error: ${errorData.error?.message || response.statusText}`);
      }

      const data = JSON.parse(responseText);
      console.log('📨 [RESPONSE] Full Response:', JSON.stringify(data, null, 2));

      // Enhanced response parsing for different Doku response formats
      if (data.response && (data.response.payment || data.response.order)) {
        const paymentData = data.response.payment || {};
        const orderData = data.response.order || {};
        
        console.log('✅ [SUCCESS] DOKU Transaction Created');
        console.log('🔗 [SUCCESS] Redirect URL:', paymentData.url);
        console.log('🎫 [SUCCESS] Token:', paymentData.token_id);
        console.log('📋 [SUCCESS] Order ID:', orderData.invoice_number);
        
        return {
          token: paymentData.token_id,
          redirect_url: paymentData.url,
          session_id: orderData.session_id,
          order_id: orderData.invoice_number
        };
      } else if (data.payment) {
        // Alternative response format
        console.log('✅ [SUCCESS] DOKU Transaction Created (Alternative Format)');
        return {
          token: data.payment.token_id,
          redirect_url: data.payment.url,
          session_id: data.order?.session_id,
          order_id: data.order?.invoice_number
        };
      } else {
        console.error('❌ [ERROR] Unexpected DOKU Response Format:', data);
        throw new Error('Invalid response format from DOKU API');
      }

    } catch (error: any) {
      console.error('💥 [FATAL] DOKU Transaction Error:', error.message);
      throw new Error(`Failed to create DOKU payment: ${error.message}`);
    }
  }
}

// Fixed webhook signature verification
export function verifyDokuSignature(
  requestTarget: string,
  requestId: string,
  requestTimestamp: string,
  requestBody: string,
  signature: string
): boolean {
  try {
    console.log('🔐 [WEBHOOK] Verifying DOKU signature...');

    // Use YOUR client ID from environment, not from headers
    const yourClientId = process.env.DOKU_CLIENT_ID!;
    
    if (!yourClientId) {
      console.error('❌ [WEBHOOK] DOKU_CLIENT_ID not found in environment');
      return false;
    }

    // Clean request body
    const cleanBody = requestBody.replace(/\r/g, '');
    
    // Calculate Digest
    const hash = crypto.createHash('sha256');
    hash.update(cleanBody);
    const digest = hash.digest().toString('base64');

    // Prepare signature components - use YOUR client ID
    const signatureComponents = [
      `Client-Id:${yourClientId}`, // Use your configured client ID
      `Request-Id:${requestId}`,
      `Request-Timestamp:${requestTimestamp}`,
      `Request-Target:${requestTarget}`,
      `Digest:${digest}`
    ];

    // Create signature string
    const signatureString = signatureComponents.join('\n');
    console.log('📝 [WEBHOOK] Signature String:', signatureString);

    // Generate expected signature
    const secretKey = process.env.DOKU_SECRET_KEY || '';
    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(signatureString);
    const expectedSignature = `HMACSHA256=${hmac.digest('base64')}`;

    console.log('🔍 [WEBHOOK] Signature Comparison:');
    console.log('🔍 [WEBHOOK] Received:', signature);
    console.log('🔍 [WEBHOOK] Expected:', expectedSignature);

    const isValid = signature === expectedSignature;
    console.log('✅ [WEBHOOK] Signature valid:', isValid);

    return isValid;

  } catch (error) {
    console.error('❌ [WEBHOOK] Error verifying signature:', error);
    return false;
  }
}

// Tambahkan juga fungsi untuk mendapatkan payment status
export async function getDokuPaymentStatus(orderId: string): Promise<any> {
  try {
    const config = {
      clientId: process.env.DOKU_CLIENT_ID!,
      secretKey: process.env.DOKU_SECRET_KEY!,
      isProduction: process.env.DOKU_IS_PRODUCTION === 'true',
      apiUrl: process.env.DOKU_IS_PRODUCTION === 'true' 
        ? 'https://api.doku.com/checkout/v1/payment'
        : 'https://api-sandbox.doku.com/checkout/v1/payment'
    };

    const dokuPayment = new DokuPayment(config);
    
    // Note: Doku biasanya tidak menyediakan API untuk check status
    // Kita bergantung pada webhook untuk update status
    console.log('ℹ️ [STATUS] Doku relies on webhook for status updates');
    
    return { status: 'pending' }; // Default status
    
  } catch (error) {
    console.error('❌ [STATUS] Error checking Doku payment status:', error);
    throw error;
  }
}