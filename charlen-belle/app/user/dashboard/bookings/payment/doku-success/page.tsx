// app/user/dashboard/bookings/payment/doku-success/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency } from '../../../../../lib/utils';
import toast from 'react-hot-toast';

export default function DokuPaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const orderId = searchParams.get('order_id');
  const transactionId = searchParams.get('transaction_id');
  const status = searchParams.get('status');

  useEffect(() => {
    if (orderId || transactionId) {
      verifyDokuPayment();
    } else {
      toast.error('Data pembayaran tidak valid');
      router.push('/user/dashboard/bookings');
    }
  }, [orderId, transactionId]);

  const verifyDokuPayment = async () => {
    try {
      // Find payment by order ID or transaction ID
      const response = await fetch(`/api/payments/doku/verify?order_id=${orderId}&transaction_id=${transactionId}`);
      const data = await response.json();

      if (data.success) {
        setPaymentData(data.payment);
        toast.success('Pembayaran berhasil!');
      } else {
        toast.error('Gagal memverifikasi pembayaran');
      }
    } catch (error) {
      console.error('Error verifying Doku payment:', error);
      toast.error('Terjadi kesalahan saat memverifikasi pembayaran');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-8 sm:py-10 px-4 sm:px-6">
        <div className="bg-[#FFFDF9] border border-[#E1D4C0] rounded-2xl p-8 shadow-sm text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4" />
          <p className="text-sm text-[#A18F76]">Memverifikasi pembayaran...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 sm:py-10 px-4 sm:px-6">
      {/* Success Header */}
      <div className="bg-[#FFFDF9] border border-[#E1D4C0] rounded-2xl p-6 sm:p-8 shadow-sm text-center mb-6">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-[#3B2A1E] mb-2">
          Pembayaran Berhasil!
        </h1>
        <p className="text-sm text-[#A18F76]">
          Terima kasih telah melakukan pembayaran melalui DOKU.
        </p>
      </div>

      {/* Payment Details */}
      <div className="bg-[#FFFDF9] border border-[#E1D4C0] rounded-2xl p-5 sm:p-6 shadow-sm mb-6 text-sm">
        <h2 className="text-sm font-semibold text-[#3B2A1E] mb-4">
          Detail Pembayaran DOKU
        </h2>
        <div className="space-y-3">
          {orderId && (
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <span className="text-[#A18F76]">Order ID</span>
              <span className="font-semibold text-[#3B2A1E] break-all sm:text-right">
                {orderId}
              </span>
            </div>
          )}
          {transactionId && (
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <span className="text-[#A18F76]">Transaction ID</span>
              <span className="font-semibold text-[#3B2A1E] break-all sm:text-right">
                {transactionId}
              </span>
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-[#A18F76]">Status</span>
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium self-start sm:self-auto">
              Berhasil
            </span>
          </div>
          {paymentData && (
            <>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-[#A18F76]">Total Pembayaran</span>
                <span className="font-semibold text-[#2F855A] sm:text-right">
                  {formatCurrency(paymentData.amount)}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-[#A18F76]">Metode Pembayaran</span>
                <span className="font-semibold text-[#3B2A1E] capitalize sm:text-right">
                  {paymentData.payment_method}
                </span>
              </div>
              {paymentData.paid_at && (
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span className="text-[#A18F76]">Waktu Pembayaran</span>
                  <span className="font-semibold text-[#3B2A1E] sm:text-right">
                    {new Date(paymentData.paid_at).toLocaleString('id-ID')}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-[#E3F2FD] border border-[#C9E0FA] rounded-2xl p-5 sm:p-6 mb-6 text-sm">
        <h3 className="text-sm font-semibold text-[#1E4E8C] mb-3">
          Langkah Selanjutnya
        </h3>
        <ul className="space-y-2 text-[#1E4E8C]">
          <li className="flex items-center">
            <span className="w-5 h-5 bg-[#D8E7FF] rounded-full flex items-center justify-center mr-3 text-[11px]">
              1
            </span>
            Tunggu konfirmasi dari klinik
          </li>
          <li className="flex items-center">
            <span className="w-5 h-5 bg-[#D8E7FF] rounded-full flex items-center justify-center mr-3 text-[11px]">
              2
            </span>
            Datang sesuai jadwal booking
          </li>
          <li className="flex items-center">
            <span className="w-5 h-5 bg-[#D8E7FF] rounded-full flex items-center justify-center mr-3 text-[11px]">
              3
            </span>
            Bawa bukti pembayaran jika diperlukan
          </li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <Link
          href="/user/dashboard"
          className="w-full sm:flex-1 bg-[#FFFDF9] border border-[#E1D4C0] text-[#7E6A52] py-3 rounded-xl text-center text-sm font-medium hover:bg-[#FBF6EA] transition-colors"
        >
          Kembali ke Dashboard
        </Link>
        {paymentData?.booking_id && (
          <Link
            href={`/user/dashboard/bookings/${paymentData.booking_id}`}
            className="w-full sm:flex-1 bg-[#2F855A] text-white py-3 rounded-xl text-center text-sm font-medium hover:bg-[#276749] transition-colors"
          >
            Lihat Detail Booking
          </Link>
        )}
      </div>

      {/* Support Info */}
      <div className="text-center mt-6 text-xs text-[#A18F76]">
        <p>Butuh bantuan? Hubungi kami di:</p>
        <p className="font-semibold">WhatsApp: +62 812-3456-7890</p>
      </div>
    </div>
  );
}