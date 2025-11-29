// app/user/dashboard/bookings/[id]/payment/page.tsx
'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../../../../components/ui/buttons';
import { formatCurrency } from '../../../../../lib/utils';
import toast from 'react-hot-toast';

// Declare DOKU Checkout function globally
declare global {
  interface Window {
    loadJokulCheckout: (url: string) => void;
  }
}

export default function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: bookingId } = use(params);
  const router = useRouter();

  const [booking, setBooking] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('online_payment');
  const [isLoading, setIsLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isDokuScriptLoaded, setIsDokuScriptLoaded] = useState(false);

  useEffect(() => {
    fetchBookingDetails();
    loadDokuScript();
  }, [bookingId]);

  // Load DOKU Checkout Script dynamically
  const loadDokuScript = () => {
    // Check if script is already loaded by checking for the actual function implementation
    if (isDokuScriptLoaded) {
      return;
    }

    // Additional check: if the function exists and seems to be properly implemented
    if (typeof window.loadJokulCheckout === 'function') {
      // Test if it's not just the declared function but actually implemented
      try {
        // Set a flag to indicate script is loaded
        setIsDokuScriptLoaded(true);
        return;
      } catch (error) {
        // Continue to load the script if there's an error
        console.log('DOKU function exists but may not be properly implemented, loading script...');
      }
    }

    const script = document.createElement('script');
    const isDokuProduction = process.env.NEXT_PUBLIC_DOKU_IS_PRODUCTION === 'true';
    
    script.src = isDokuProduction
      ? 'https://jokul.doku.com/jokul-checkout-js/v1/jokul-checkout-1.0.0.js'
      : 'https://sandbox.doku.com/jokul-checkout-js/v1/jokul-checkout-1.0.0.js';
    
    script.async = true;
    script.onload = () => {
      console.log('✅ DOKU Checkout script loaded');
      setIsDokuScriptLoaded(true);
    };
    script.onerror = () => {
      console.error('❌ Failed to load DOKU Checkout script');
      toast.error('Gagal memuat sistem pembayaran');
    };

    document.body.appendChild(script);
  };

  const fetchBookingDetails = async () => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`);
      const data = await response.json();
      setBooking(data.booking);
      
      const total = data.booking.treatments?.reduce(
        (sum: number, t: any) => sum + t.price,
        0
      ) || 0;
      setTotalAmount(total);
    } catch (error) {
      toast.error('Gagal memuat detail booking');
    }
  };

  const handlePayment = async () => {
    if (!booking) return;
    
    // Check if DOKU script is loaded for online payments
    const paymentGateway = process.env.NEXT_PUBLIC_PAYMENT_GATEWAY || 'midtrans';
    if (paymentGateway === 'doku' && paymentMethod === 'online_payment' && !isDokuScriptLoaded) {
      toast.error('Sistem pembayaran belum siap. Mohon tunggu...');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          payment_method: paymentMethod,
          amount: totalAmount
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Gagal memproses pembayaran');
      }

      console.log('💳 Payment response:', data);

      // Store order_id in sessionStorage for later verification
      if (data.payment_id) {
        sessionStorage.setItem('current_payment_id', data.payment_id);
        sessionStorage.setItem('current_booking_id', bookingId);
      }

      // Handle based on payment gateway
      if (data.gateway === 'doku') {
        if (data.redirect_url) {
          console.log('🔗 Opening DOKU Checkout:', data.redirect_url);
          
          // Use DOKU Checkout JS for modal popup
          if (window.loadJokulCheckout && isDokuScriptLoaded) {
            window.loadJokulCheckout(data.redirect_url);
            
            // Start polling for payment status
            startPaymentStatusPolling(data.payment_id);
          } else {
            // Fallback: redirect to payment URL
            console.warn('⚠️ DOKU Checkout script not loaded, using redirect fallback');
            window.location.href = data.redirect_url;
          }
        } else {
          throw new Error('URL pembayaran tidak tersedia');
        }
      } else if (data.gateway === 'midtrans') {
        // Midtrans handling (if you still support it)
        toast.success('Memproses pembayaran...');
        // Add midtrans snap handling here if needed
      } else {
        // Manual payment
        toast.success('Mohon lakukan pembayaran di kasir');
        router.push(`/user/dashboard/bookings/${bookingId}`);
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Terjadi kesalahan saat memproses pembayaran');
    } finally {
      setIsLoading(false);
    }
  };

  // Poll payment status after opening DOKU Checkout
  const startPaymentStatusPolling = (paymentId: string) => {
    let pollCount = 0;
    const maxPolls = 120; // Poll for 10 minutes (120 * 5 seconds)

    const pollInterval = setInterval(async () => {
      pollCount++;
      
      try {
        const response = await fetch(`/api/payments/${paymentId}/status`);
        const data = await response.json();
        
        if (data.success && data.payment.status === 'paid') {
          clearInterval(pollInterval);
          console.log('✅ Payment confirmed!');
          toast.success('Pembayaran berhasil!');
          
          // Redirect to success page
          router.push(`/user/dashboard/bookings/payment/doku-success?order_id=${data.payment.doku_order_id}`);
        } else if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
          console.log('⏰ Polling timeout');
        }
      } catch (error) {
        console.error('Status check error:', error);
      }
    }, 5000); // Check every 5 seconds

    // Clean up on unmount
    return () => clearInterval(pollInterval);
  };

  if (!booking) {
    return (
      <div className="max-w-3xl mx-auto mt-10 px-4">
        <div className="bg-[#FFFDF9] border border-[#E1D4C0] rounded-2xl p-8 shadow-sm flex flex-col items-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#6C3FD1]" />
          <p className="mt-4 text-sm text-[#A18F76]">Memuat data pembayaran...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 mt-4 px-4">
      <div>
        <p className="text-xs text-[#A18F76] mb-1">Pembayaran Booking</p>
        <h1 className="text-xl sm:text-2xl font-semibold text-[#3B2A1E] mb-1">
          Selesaikan Pembayaran
        </h1>
        <p className="text-sm text-[#A18F76]">
          Pilih metode pembayaran yang Anda inginkan.
        </p>
      </div>

      {/* Order Summary */}
      <div className="bg-[#FFFDF9] rounded-2xl border border-[#E1D4C0] shadow-sm p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-[#3B2A1E] mb-4">
          Ringkasan Pesanan
        </h2>
        <div className="space-y-3 text-sm">
          {booking.treatments?.map((treatment: any, index: number) => (
            <div
              key={index}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 border-b border-[#F1E5D1]"
            >
              <div>
                <p className="font-semibold text-[#3B2A1E]">
                  {treatment.name}
                </p>
                <p className="text-xs text-[#A18F76]">
                  Qty: {treatment.quantity}
                </p>
              </div>
              <p className="font-semibold text-[#3B2A1E] sm:text-right">
                {formatCurrency(treatment.price)}
              </p>
            </div>
          ))}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 text-base font-bold gap-1">
            <span className="text-[#3B2A1E]">Total</span>
            <span className="text-[#6C3FD1]">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="bg-[#FFFDF9] rounded-2xl border border-[#E1D4C0] shadow-sm p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-[#3B2A1E] mb-4">
          Metode Pembayaran
        </h2>
        <div className="space-y-3">
          <PaymentMethodOption
            value="online_payment"
            selected={paymentMethod}
            onChange={setPaymentMethod}
            label="Pembayaran Online"
            description="Virtual Account, E-Wallet, Credit Card, QRIS"
            iconLabel="💳"
          />
          <PaymentMethodOption
            value="manual_cash"
            selected={paymentMethod}
            onChange={setPaymentMethod}
            label="Tunai di Kasir"
            description="Bayar langsung di klinik"
            iconLabel="💵"
          />
        </div>
      </div>

      {/* Payment Button */}
      <Button
        onClick={handlePayment}
        disabled={isLoading || (paymentMethod === 'online_payment' && !isDokuScriptLoaded)}
        className="w-full rounded-xl bg-[#6C3FD1] hover:bg-[#5b34b3] border-none"
        size="lg"
      >
        {isLoading
          ? 'Memproses...'
          : !isDokuScriptLoaded && paymentMethod === 'online_payment'
          ? 'Memuat sistem pembayaran...'
          : `Bayar ${formatCurrency(totalAmount)}`}
      </Button>

      {/* Info Notice */}
      {paymentMethod === 'online_payment' && (
        <div className="bg-[#E3F2FD] border border-[#C9E0FA] rounded-xl p-4 text-xs text-[#1E4E8C]">
          <p className="font-semibold mb-1">ℹ️ Informasi Pembayaran</p>
          <p>
            Setelah klik tombol bayar, jendela pembayaran akan muncul. 
            Pilih metode pembayaran favorit Anda dan selesaikan pembayaran.
          </p>
        </div>
      )}
    </div>
  );
}

function PaymentMethodOption({
  value,
  selected,
  onChange,
  label,
  description,
  iconLabel
}: {
  value: string;
  selected: string;
  onChange: (value: string) => void;
  label: string;
  description: string;
  iconLabel: string;
}) {
  const isActive = selected === value;

  return (
    <button
      onClick={() => onChange(value)}
      className={`w-full flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl border-2 transition-all text-left ${
        isActive
          ? 'border-[#6C3FD1] bg-[#F4EDFF]'
          : 'border-[#E1D4C0] bg-[#FFFDF9] hover:border-[#C89B4B]'
      }`}
    >
      <span className="h-10 w-10 rounded-xl bg-[#E6D8C2] flex items-center justify-center text-xl">
        {iconLabel}
      </span>
      <div className="flex-1">
        <p className="font-semibold text-sm text-[#3B2A1E]">{label}</p>
        <p className="text-xs text-[#A18F76]">{description}</p>
      </div>
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center self-start sm:self-auto ${
          isActive ? 'border-[#6C3FD1] bg-[#6C3FD1]' : 'border-[#D0C3AD]'
        }`}
      >
        {isActive && (
          <svg
            className="w-3 h-3 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              d="M5 13l4 4L19 7"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    </button>
  );
}