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
  const [verificationAttempts, setVerificationAttempts] = useState(0);

  useEffect(() => {
    verifyDokuPayment();
  }, []);

  const verifyDokuPayment = async () => {
    try {
      setLoading(true);
      
      // Get order_id from URL or sessionStorage
      let orderId = searchParams.get('order_id') || searchParams.get('invoice_number');
      const transactionId = searchParams.get('transaction_id');
      
      console.log('🔍 [SUCCESS PAGE] URL Parameters:', {
        orderId,
        transactionId,
        allParams: Object.fromEntries(searchParams.entries())
      });

      // Fallback: check sessionStorage
      if (!orderId) {
        orderId = sessionStorage.getItem('current_payment_id');
        console.log('🔍 [SUCCESS PAGE] Using payment_id from sessionStorage:', orderId);
      }

      if (!orderId && !transactionId) {
        console.error('❌ [SUCCESS PAGE] Missing both order_id and transaction_id');
        
        // Try to find recent payment
        const recentPayment = await findRecentPayment();
        if (recentPayment) {
          console.log('✅ [SUCCESS PAGE] Found recent payment:', recentPayment);
          setPaymentData(recentPayment);
          if (recentPayment.status === 'paid') {
            toast.success('Pembayaran berhasil!');
          }
          setLoading(false);
          return;
        }
        
        toast.error('Data pembayaran tidak valid. Silakan cek dashboard untuk status terbaru.');
        setTimeout(() => router.push('/user/dashboard/bookings'), 3000);
        setLoading(false);
        return;
      }

      console.log('🔍 [SUCCESS PAGE] Calling verify API with:', {
        order_id: orderId,
        transaction_id: transactionId
      });

      // Verify payment with backend
      const verifyResponse = await fetch('/api/payments/verify-doku', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: orderId,
          transaction_id: transactionId
        }),
      });

      const data = await verifyResponse.json();
      console.log('📨 [SUCCESS PAGE] Verify API response:', data);

      if (data.success) {
        setPaymentData(data.payment);
        
        if (data.payment.status === 'paid') {
          toast.success('Pembayaran berhasil diverifikasi!');
          // Clear session storage
          sessionStorage.removeItem('current_payment_id');
          sessionStorage.removeItem('current_booking_id');
        } else if (data.payment.status === 'pending') {
          // Retry verification if still pending
          if (verificationAttempts < 5) {
            console.log(`🔄 [SUCCESS PAGE] Retrying verification (${verificationAttempts + 1}/5)`);
            setTimeout(() => {
              setVerificationAttempts(prev => prev + 1);
              verifyDokuPayment();
            }, 3000); // Retry after 3 seconds
          } else {
            console.log('⏰ [SUCCESS PAGE] Max retries reached');
            toast('Pembayaran masih diproses. Status akan diperbarui otomatis.', {
              icon: '⏳',
            });
          }
        }
      } else {
        console.error('❌ [SUCCESS PAGE] Verify API error:', data.error);
        toast.error('Gagal memverifikasi pembayaran: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ [SUCCESS PAGE] Error verifying Doku payment:', error);
      toast.error('Terjadi kesalahan saat memverifikasi pembayaran');
    } finally {
      setLoading(false);
    }
  };

  const findRecentPayment = async () => {
    try {
      const response = await fetch('/api/payments/recent-doku');
      const data = await response.json();
      
      if (data.success && data.payment) {
        return data.payment;
      }
    } catch (error) {
      console.error('Error finding recent payment:', error);
    }
    return null;
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-8 sm:py-10 px-4 sm:px-6">
        <div className="bg-[#FFFDF9] border border-[#E1D4C0] rounded-2xl p-8 shadow-sm text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4" />
          <h2 className="text-lg font-semibold text-[#3B2A1E] mb-2">Memverifikasi Pembayaran</h2>
          <p className="text-sm text-[#A18F76]">
            {verificationAttempts > 0 
              ? `Memeriksa status... (${verificationAttempts}/5)`
              : 'Memverifikasi pembayaran Anda...'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 sm:py-10 px-4 sm:px-6">
      {/* Success Header */}
      <div className="bg-[#FFFDF9] border border-[#E1D4C0] rounded-2xl p-6 sm:p-8 shadow-sm text-center mb-6">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          {paymentData?.status === 'paid' ? (
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
          ) : (
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
          )}
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-[#3B2A1E] mb-2">
          {paymentData?.status === 'paid' ? 'Pembayaran Berhasil!' : 'Pembayaran Diproses'}
        </h1>
        <p className="text-sm text-[#A18F76]">
          {paymentData?.status === 'paid' 
            ? 'Terima kasih telah melakukan pembayaran melalui DOKU.'
            : 'Pembayaran Anda sedang diproses. Status akan diperbarui otomatis.'
          }
        </p>
      </div>

      {/* Payment Details */}
      {paymentData && (
        <div className="bg-[#FFFDF9] border border-[#E1D4C0] rounded-2xl p-5 sm:p-6 shadow-sm mb-6 text-sm">
          <h2 className="text-sm font-semibold text-[#3B2A1E] mb-4">
            Detail Pembayaran DOKU
          </h2>
          <div className="space-y-3">
            {paymentData.doku_order_id && (
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-[#A18F76]">Order ID</span>
                <span className="font-semibold text-[#3B2A1E] break-all sm:text-right">
                  {paymentData.doku_order_id}
                </span>
              </div>
            )}
            {paymentData.doku_transaction_id && (
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-[#A18F76]">Transaction ID</span>
                <span className="font-semibold text-[#3B2A1E] break-all sm:text-right">
                  {paymentData.doku_transaction_id}
                </span>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <span className="text-[#A18F76]">Status</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium self-start sm:self-auto ${
                paymentData.status === 'paid' 
                  ? 'bg-green-100 text-green-800'
                  : paymentData.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {paymentData.status === 'paid' ? 'Berhasil' : 
                 paymentData.status === 'pending' ? 'Diproses' : 'Gagal'}
              </span>
            </div>
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
          </div>
        </div>
      )}

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
          href="/user/dashboard/bookings"
          className="w-full sm:flex-1 bg-[#FFFDF9] border border-[#E1D4C0] text-[#7E6A52] py-3 rounded-xl text-center text-sm font-medium hover:bg-[#FBF6EA] transition-colors"
        >
          Kembali ke Daftar Booking
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