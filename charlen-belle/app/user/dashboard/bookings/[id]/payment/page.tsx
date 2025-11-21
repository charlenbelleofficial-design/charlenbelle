// app/user/dashboard/bookings/[id]/payment/page.tsx
'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '../../../../../components/ui/buttons';
import { formatCurrency } from '../../../../../lib/utils';
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
      const total =
        data.booking.treatments?.reduce(
          (sum: number, t: any) => sum + t.price,
          0
        ) || 0;
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
            onSuccess: function (result: any) {
              toast.success('Pembayaran berhasil!');
              router.push(
                `/user/dashboard/bookings/payment/success?payment_id=${data.payment_id}`
              );
            },
            onPending: function (result: any) {
              toast('Menunggu pembayaran...', {
                icon: '⏳',
                style: { background: '#F3F4F6', color: '#111827' }
              });
              router.push(`/user/dashboard/bookings/payment/pending?order_id=${data.order_id}`);
            },
            onError: function (result: any) {
              toast.error('Pembayaran gagal');
            },
            onClose: function () {
              toast('Pembayaran dibatalkan...', {
                icon: 'ℹ️',
                style: { background: '#F3F4F6', color: '#111827' }
              });
            }
          });
        }
      } else {
        // For manual payments
        toast.success('Mohon lakukan pembayaran di kasir');
        router.push(`/user/dashboard/bookings/${bookingId}`);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
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
    <>
      <Script
        src={`https://app.${
          process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
            ? ''
            : 'sandbox.'
        }midtrans.com/snap/snap.js`}
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
      />

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

        {/* Payment Method */}
        <div className="bg-[#FFFDF9] rounded-2xl border border-[#E1D4C0] shadow-sm p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-[#3B2A1E] mb-4">
            Metode Pembayaran
          </h2>
          <div className="space-y-3">
            <PaymentMethodOption
              value="midtrans_qris"
              selected={paymentMethod}
              onChange={setPaymentMethod}
              label="QRIS"
              description="Bayar cepat dengan QRIS"
              iconLabel="QR"
            />
            <PaymentMethodOption
              value="midtrans_cc"
              selected={paymentMethod}
              onChange={setPaymentMethod}
              label="Kartu Kredit/Debit"
              description="Visa, Mastercard, JCB"
              iconLabel="CC"
            />
            <PaymentMethodOption
              value="midtrans_va"
              selected={paymentMethod}
              onChange={setPaymentMethod}
              label="Virtual Account"
              description="BCA, BNI, BRI, Mandiri"
              iconLabel="VA"
            />
            <PaymentMethodOption
              value="manual_cash"
              selected={paymentMethod}
              onChange={setPaymentMethod}
              label="Tunai di Kasir"
              description="Bayar langsung di klinik"
              iconLabel="CA"
            />
          </div>
        </div>

        <Button
          onClick={handlePayment}
          disabled={isLoading}
          className="w-full rounded-xl bg-[#6C3FD1] hover:bg-[#5b34b3] border-none"
          size="lg"
        >
          {isLoading
            ? 'Memproses...'
            : `Bayar ${formatCurrency(totalAmount)}`}
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
      <span className="h-10 w-10 rounded-xl bg-[#E6D8C2] flex items-center justify-center text-[11px] font-semibold text-[#3B2A1E]">
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
