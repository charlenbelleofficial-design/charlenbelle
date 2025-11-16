// app/user/dashboard/bookings/payment/error/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function PaymentErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorData, setErrorData] = useState<any>(null);

  const orderId = searchParams.get('order_id');
  const transactionStatus = searchParams.get('transaction_status');
  const statusCode = searchParams.get('status_code');

  useEffect(() => {
    if (orderId) {
      // You can fetch payment details here if needed
      setErrorData({
        orderId,
        transactionStatus,
        statusCode
      });
    }
    
    toast.error('Pembayaran gagal atau dibatalkan');
  }, [orderId, transactionStatus, statusCode]);

  const getErrorMessage = () => {
    switch (transactionStatus) {
      case 'cancel':
        return 'Pembayaran dibatalkan';
      case 'deny':
        return 'Pembayaran ditolak';
      case 'expire':
        return 'Pembayaran telah kedaluwarsa';
      case 'failure':
        return 'Terjadi kegagalan dalam pembayaran';
      default:
        return 'Pembayaran tidak berhasil';
    }
  };

  const getErrorDescription = () => {
    switch (transactionStatus) {
      case 'cancel':
        return 'Anda membatalkan proses pembayaran.';
      case 'deny':
        return 'Pembayaran Anda ditolak oleh penyedia pembayaran.';
      case 'expire':
        return 'Waktu pembayaran telah habis. Silakan coba lagi.';
      case 'failure':
        return 'Terjadi kesalahan teknis saat memproses pembayaran.';
      default:
        return 'Silakan coba lagi atau gunakan metode pembayaran lain.';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Error Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{getErrorMessage()}</h1>
          <p className="text-gray-600">{getErrorDescription()}</p>
        </div>

        {/* Error Details */}
        {errorData && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Detail Transaksi</h2>
            <div className="space-y-3">
              {errorData.orderId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID</span>
                  <span className="font-medium">{errorData.orderId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                  {transactionStatus || 'Gagal'}
                </span>
              </div>
              {errorData.statusCode && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Kode Status</span>
                  <span className="font-medium">{errorData.statusCode}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Troubleshooting Tips */}
        <div className="bg-yellow-50 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-3">Tips Penyelesaian</h3>
          <ul className="space-y-2 text-yellow-800">
            <li className="flex items-center">
              <span className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center mr-3 text-sm">✓</span>
              Pastikan saldo atau limit kartu mencukupi
            </li>
            <li className="flex items-center">
              <span className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center mr-3 text-sm">✓</span>
              Coba metode pembayaran yang berbeda
            </li>
            <li className="flex items-center">
              <span className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center mr-3 text-sm">✓</span>
              Periksa koneksi internet Anda
            </li>
            <li className="flex items-center">
              <span className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center mr-3 text-sm">✓</span>
              Hubungi bank untuk informasi lebih lanjut
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link
            href="/user/dashboard"
            className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 rounded-lg text-center hover:bg-gray-50 transition-colors"
          >
            Kembali ke Dashboard
          </Link>
          <Link
            href="/user/treatments"
            className="flex-1 bg-purple-600 text-white py-3 rounded-lg text-center hover:bg-purple-700 transition-colors"
          >
            Coba Lagi
          </Link>
        </div>

        {/* Support Info */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Masih mengalami masalah? Hubungi kami di:</p>
          <p className="font-medium">WhatsApp: +62 812-3456-7890 | Email: support@charlenebelle.com</p>
        </div>
      </div>
    </div>
  );
}