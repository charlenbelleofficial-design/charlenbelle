// app/user/dashboard/bookings/payment/pending/page.tsx
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
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Pending Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Menunggu Pembayaran</h1>
          <p className="text-gray-600">Silakan selesaikan pembayaran Anda</p>
        </div>

        {/* Payment Details */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Detail Transaksi</h2>
          <div className="space-y-3">
            {orderId && (
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID</span>
                <span className="font-medium">{orderId}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                Menunggu
              </span>
            </div>
            {paymentData && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total</span>
                  <span className="font-medium text-purple-600">
                    {formatCurrency(paymentData.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Metode</span>
                  <span className="font-medium capitalize">
                    {paymentData.payment_method?.replace('midtrans_', '')}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Instruksi Pembayaran</h3>
          <div className="space-y-3 text-blue-800">
            <p>Bergantung pada metode pembayaran yang Anda pilih:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Virtual Account:</strong> Transfer ke nomor VA yang diberikan</li>
              <li><strong>QRIS:</strong> Scan QR code dengan aplikasi e-wallet</li>
              <li><strong>E-wallet:</strong> Selesaikan di aplikasi GoPay/ShopeePay</li>
              <li><strong>Credit Card:</strong> Ikuti instruksi 3D Secure</li>
            </ul>
            <p className="text-sm mt-3">Pembayaran akan diproses otomatis dalam beberapa menit.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link
            href="/user/dashboard"
            className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 rounded-lg text-center hover:bg-gray-50 transition-colors"
          >
            Kembali ke Dashboard
          </Link>
          {paymentData?.booking_id && (
            <Link
              href={`/user/dashboard/bookings/${paymentData.booking_id}`}
              className="flex-1 bg-purple-600 text-white py-3 rounded-lg text-center hover:bg-purple-700 transition-colors"
            >
              Lihat Booking
            </Link>
          )}
        </div>

        {/* Auto Refresh Notice */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>Halaman ini akan diperbarui otomatis ketika pembayaran berhasil</p>
        </div>
      </div>
    </div>
  );
}