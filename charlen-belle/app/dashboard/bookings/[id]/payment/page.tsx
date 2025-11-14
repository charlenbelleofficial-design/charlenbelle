'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '../../../../components/ui/buttons';
import { formatCurrency } from '../../../../lib/utils';
import toast from 'react-hot-toast';
import Script from 'next/script';

declare global {
  interface Window {
    snap: any;
  }
}

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const bookingId = params.id;
    

  const [booking, setBooking] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('midtrans_qris');
  const [isLoading, setIsLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`);
      const data = await response.json();
      setBooking(data.booking);
      
      // Calculate total amount
      const total = data.booking.treatments?.reduce((sum: number, t: any) => sum + t.price, 0) || 0;
      setTotalAmount(total);
    } catch (error) {
      toast.error('Gagal memuat detail booking');
    }
  };

  const handlePayment = async () => {
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
        throw new Error(data.error);
      }

      // For Midtrans payments
      if (paymentMethod.startsWith('midtrans_')) {
        if (window.snap) {
          window.snap.pay(data.payment_token, {
            onSuccess: function(result: any) {
              toast.success('Pembayaran berhasil!');
              router.push(`/dashboard/bookings/${bookingId}/success`);
            },
            onPending: function(result: any) {
              toast('Menunggu pembayaran...', {
                icon: '⏳',
                style: { background: '#F3F4F6', color: '#111827' }, // gray info style
              });
              router.push(`/dashboard/bookings/${bookingId}`);
            },
            onError: function(result: any) {
              toast.error('Pembayaran gagal');
            },
            onClose: function() {
              
              toast('Pembayaran dibatalkan...', {
                icon: 'ℹ️',
                style: { background: '#F3F4F6', color: '#111827' },
              });

            }
          });
        }
      } else {
        // For manual payments
        toast.success('Mohon lakukan pembayaran di kasir');
        router.push(`/dashboard/bookings/${bookingId}`);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <>
      <Script
        src={`https://app.${process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true' ? '' : 'sandbox.'}midtrans.com/snap/snap.js`}
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
      />

      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pembayaran</h1>
          <p className="text-gray-600">Selesaikan pembayaran untuk melanjutkan</p>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Ringkasan Pesanan</h2>
          <div className="space-y-3">
            {booking.treatments?.map((treatment: any, index: number) => (
              <div key={index} className="flex justify-between items-center py-2 border-b">
                <div>
                  <p className="font-medium">{treatment.name}</p>
                  <p className="text-sm text-gray-500">Qty: {treatment.quantity}</p>
                </div>
                <p className="font-semibold">{formatCurrency(treatment.price)}</p>
              </div>
            ))}
            <div className="flex justify-between items-center pt-4 text-lg font-bold">
              <span>Total</span>
              <span className="text-purple-600">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Metode Pembayaran</h2>
          <div className="space-y-3">
            <PaymentMethodOption
              value="midtrans_qris"
              selected={paymentMethod}
              onChange={setPaymentMethod}
              label="QRIS"
              description="Bayar dengan QRIS"
              icon="📱"
            />
            <PaymentMethodOption
              value="midtrans_cc"
              selected={paymentMethod}
              onChange={setPaymentMethod}
              label="Kartu Kredit/Debit"
              description="Visa, Mastercard, JCB"
              icon="💳"
            />
            <PaymentMethodOption
              value="midtrans_va"
              selected={paymentMethod}
              onChange={setPaymentMethod}
              label="Virtual Account"
              description="BCA, BNI, BRI, Mandiri"
              icon="🏦"
            />
            <PaymentMethodOption
              value="manual_cash"
              selected={paymentMethod}
              onChange={setPaymentMethod}
              label="Tunai di Kasir"
              description="Bayar langsung di tempat"
              icon="💵"
            />
          </div>
        </div>

        <Button
          onClick={handlePayment}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? 'Memproses...' : `Bayar ${formatCurrency(totalAmount)}`}
        </Button>
      </div>
    </>
  );
}

function PaymentMethodOption({
  value,
  selected,
  onChange,
  label,
  description,
  icon
}: {
  value: string;
  selected: string;
  onChange: (value: string) => void;
  label: string;
  description: string;
  icon: string;
}) {
  return (
    <button
      onClick={() => onChange(value)}
      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
        selected === value
          ? 'border-purple-600 bg-purple-50'
          : 'border-gray-200 hover:border-purple-300'
      }`}
    >
      <span className="text-3xl">{icon}</span>
      <div className="flex-1 text-left">
        <p className="font-semibold text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <div className={`w-5 h-5 rounded-full border-2 ${
        selected === value
          ? 'border-purple-600 bg-purple-600'
          : 'border-gray-300'
      }`}>
        {selected === value && (
          <div className="w-full h-full flex items-center justify-center text-white text-xs">
            ✓
          </div>
        )}
      </div>
    </button>
  );
}