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
      setErrorData({
        orderId,
        transactionStatus,
        statusCode,
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
    <div className="max-w-2xl mx-auto py-8 sm:py-10 px-4 sm:px-6">
      {/* Error Header */}
      <div className="bg-[#FFFDF9] border border-[#E1D4C0] rounded-2xl p-6 sm:p-8 shadow-sm text-center mb-6">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-[#3B2A1E] mb-2">
          {getErrorMessage()}
        </h1>
        <p className="text-sm text-[#A18F76]">{getErrorDescription()}</p>
      </div>

      {/* Error Details */}
      {errorData && (
        <div className="bg-[#FFFDF9] border border-[#E1D4C0] rounded-2xl p-5 sm:p-6 shadow-sm mb-6 text-sm">
          <h2 className="text-sm font-semibold text-[#3B2A1E] mb-4">
            Detail Transaksi
          </h2>
          <div className="space-y-3">
            {errorData.orderId && (
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-[#A18F76]">Order ID</span>
                <span className="font-semibold text-[#3B2A1E] break-all sm:text-right">
                  {errorData.orderId}
                </span>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <span className="text-[#A18F76]">Status</span>
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium self-start sm:self-auto">
                {transactionStatus || 'Gagal'}
              </span>
            </div>
            {errorData.statusCode && (
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-[#A18F76]">Kode Status</span>
                <span className="font-semibold text-[#3B2A1E] sm:text-right">
                  {errorData.statusCode}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Troubleshooting Tips */}
      <div className="bg-[#FFF7E0] border border-[#F1E0B8] rounded-2xl p-5 sm:p-6 mb-6 text-sm">
        <h3 className="text-sm font-semibold text-[#8B5E34] mb-3">
          Tips Penyelesaian
        </h3>
        <ul className="space-y-2 text-[#7E6A52]">
          <li className="flex items-center">
            <span className="w-5 h-5 bg-[#FFECC4] rounded-full flex items-center justify-center mr-3 text-[10px]">
              ✓
            </span>
            Pastikan saldo atau limit kartu mencukupi
          </li>
          <li className="flex items-center">
            <span className="w-5 h-5 bg-[#FFECC4] rounded-full flex items-center justify-center mr-3 text-[10px]">
              ✓
            </span>
            Coba metode pembayaran yang berbeda
          </li>
          <li className="flex items-center">
            <span className="w-5 h-5 bg-[#FFECC4] rounded-full flex items-center justify-center mr-3 text-[10px]">
              ✓
            </span>
            Periksa koneksi internet Anda
          </li>
          <li className="flex items-center">
            <span className="w-5 h-5 bg-[#FFECC4] rounded-full flex items-center justify-center mr-3 text-[10px]">
              ✓
            </span>
            Hubungi bank untuk informasi lebih lanjut
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
        <Link
          href="/user/treatments"
          className="w-full sm:flex-1 bg-[#6C3FD1] text-white py-3 rounded-xl text-center text-sm font-medium hover:bg-[#5b34b3] transition-colors"
        >
          Coba Lagi
        </Link>
      </div>

      {/* Support Info */}
      <div className="text-center mt-6 text-xs text-[#A18F76]">
        <p>Masih mengalami masalah? Hubungi kami di:</p>
        <p className="font-semibold">
          WhatsApp: +62 812-3456-7890 · Email: support@charlenebelle.com
        </p>
      </div>
    </div>
  );
}
