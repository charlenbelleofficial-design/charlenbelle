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

  async createTransaction(
    orderId: string,
    amount: number,
    customer: DokuCustomer,
    frontendUrls: { success: string; error: string; pending: string }
  ): Promise<DokuTransactionResponse> {
    try {
      console.log('🚀 [DOKU] Starting transaction creation...');
      console.log('🌐 [DOKU] API URL:', this.config.apiUrl);
      console.log('🔑 [DOKU] Client ID:', this.config.clientId);

      const requestId = this.generateRequestId();
      const requestTimestamp = this.getCurrentUTCTimestamp();
      const requestTarget = '/checkout/v1/payment';

      // Prepare request body sesuai dokumentasi Doku Checkout
      const requestBody: DokuPaymentRequest = {
        order: {
          amount: amount,
          invoice_number: orderId,
          currency: 'IDR',
          callback_url: frontendUrls.success,
          callback_url_cancel: frontendUrls.error,
          callback_url_result: frontendUrls.success,
          language: 'ID',
          auto_redirect: true,
          disable_retry_payment: false
        },
        payment: {
          payment_due_date: 60, // 60 minutes
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

        // Check for specific signature errors
        if (response.status === 400 && errorData.error?.code === 'invalid_signature') {
          console.error('🔍 [DEBUG] Signature verification failed');
          console.error('🔍 [DEBUG] Please double-check:');
          console.error('🔍 [DEBUG] 1. Client ID:', this.config.clientId);
          console.error('🔍 [DEBUG] 2. Secret Key length:', this.config.secretKey?.length);
          console.error('🔍 [DEBUG] 3. Environment:', this.config.isProduction ? 'Production' : 'Sandbox');
        }

        throw new Error(`DOKU API Error: ${errorData.error?.message || response.statusText}`);
      }

      const data = JSON.parse(responseText);
      
      if (data.response && data.response.payment) {
        console.log('✅ [SUCCESS] DOKU Transaction Created');
        console.log('🔗 [SUCCESS] Redirect URL:', data.response.payment.url);
        console.log('🎫 [SUCCESS] Token:', data.response.payment.token_id);
        
        return {
          token: data.response.payment.token_id,
          redirect_url: data.response.payment.url,
          session_id: data.response.order.session_id
        };
      } else {
        console.error('❌ [ERROR] Invalid DOKU Response Format:', data);
        throw new Error('Invalid response format from DOKU API');
      }

    } catch (error: any) {
      console.error('💥 [FATAL] DOKU Transaction Error:', error.message);
      throw new Error(`Failed to create DOKU payment: ${error.message}`);
    }
  }
}

// Tambahkan fungsi ini di lib/doku.ts (setelah class DokuPayment)

export function verifyDokuSignature(
  requestTarget: string,
  requestId: string,
  requestTimestamp: string,
  requestBody: string,
  signature: string,
  clientId: string
): boolean {
  try {
    console.log('🔐 [WEBHOOK] Verifying DOKU signature...');

    // Clean request body
    const cleanBody = requestBody.replace(/\r/g, '');
    
    // Calculate Digest
    const hash = crypto.createHash('sha256');
    hash.update(cleanBody);
    const digest = hash.digest().toString('base64');

    // Prepare signature components
    const signatureComponents = [
      `Client-Id:${clientId}`,
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