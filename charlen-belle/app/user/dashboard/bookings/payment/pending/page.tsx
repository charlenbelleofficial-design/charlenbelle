'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency } from '../../../../../lib/utils';

export default function PaymentPendingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentData, setPaymentData] = useState<any>(null);

  const orderId = searchParams.get('order_id');
  const transactionStatus = searchParams.get('transaction_status');

  useEffect(() => {
    if (orderId) {
      // Fetch payment details
      fetchPaymentDetails();
    }
  }, [orderId]);

  const fetchPaymentDetails = async () => {
    try {
      const response = await fetch(`/api/payments/verify?order_id=${orderId}`);
      const data = await response.json();
      if (data.success) {
        setPaymentData(data.payment);
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 sm:py-10 px-4 sm:px-6">
      {/* Pending Header */}
      <div className="bg-[#FFFDF9] border border-[#E1D4C0] rounded-2xl p-6 sm:p-8 shadow-sm text-center mb-6">
        <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-[#3B2A1E] mb-2">
          Menunggu Pembayaran
        </h1>
        <p className="text-sm text-[#A18F76]">
          Silakan selesaikan pembayaran Anda.
        </p>
      </div>

      {/* Payment Details */}
      <div className="bg-[#FFFDF9] border border-[#E1D4C0] rounded-2xl p-5 sm:p-6 shadow-sm mb-6 text-sm">
        <h2 className="text-sm font-semibold text-[#3B2A1E] mb-4">
          Detail Transaksi
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-[#A18F76]">Status</span>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium self-start sm:self-auto">
              Menunggu
            </span>
          </div>
          {paymentData && (
            <>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-[#A18F76]">Total</span>
                <span className="font-semibold text-[#6C3FD1] sm:text-right">
                  {formatCurrency(paymentData.amount)}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-[#A18F76]">Metode</span>
                <span className="font-semibold text-[#3B2A1E] capitalize sm:text-right">
                  {paymentData.payment_method?.replace('midtrans_', '')}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-[#E3F2FD] border border-[#C9E0FA] rounded-2xl p-5 sm:p-6 mb-6 text-sm">
        <h3 className="text-sm font-semibold text-[#1E4E8C] mb-3">
          Instruksi Pembayaran
        </h3>
        <div className="space-y-2 text-[#1E4E8C]">
          <p>Bergantung pada metode pembayaran yang Anda pilih:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>Virtual Account:</strong> Transfer ke nomor VA yang
              diberikan
            </li>
            <li>
              <strong>QRIS:</strong> Scan QR code dengan aplikasi e-wallet
            </li>
            <li>
              <strong>E-wallet:</strong> Selesaikan di aplikasi GoPay/ShopeePay
            </li>
            <li>
              <strong>Credit Card:</strong> Ikuti instruksi 3D Secure
            </li>
          </ul>
          <p className="text-xs mt-3">
            Pembayaran akan diproses otomatis dalam beberapa menit.
          </p>
        </div>
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
            className="w-full sm:flex-1 bg-[#6C3FD1] text-white py-3 rounded-xl text-center text-sm font-medium hover:bg-[#5b34b3] transition-colors"
          >
            Lihat Booking
          </Link>
        )}
      </div>

      {/* Auto Refresh Notice */}
      <div className="text-center mt-6 text-xs text-[#A18F76]">
        <p>Halaman ini akan diperbarui otomatis ketika pembayaran berhasil.</p>
      </div>
    </div>
  );
}
