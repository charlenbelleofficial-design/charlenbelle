// app/user/dashboard/bookings/payment/success/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency } from '../../../../../lib/utils';
import toast from 'react-hot-toast';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  const orderId = searchParams.get('order_id');
  const paymentId = searchParams.get('payment_id');

  useEffect(() => {
    // Check if we have a payment ID from localStorage (set during payment creation)
    const storedPaymentId = localStorage.getItem('current_payment_id');
    const paymentIdToCheck = paymentId || storedPaymentId;

    if (paymentIdToCheck) {
      verifyPayment(paymentIdToCheck);
    } else if (orderId) {
      // Fallback: try to find payment by order ID
      findPaymentByOrderId(orderId);
    } else {
      toast.error('Data pembayaran tidak valid');
      router.push('/user/dashboard/bookings');
    }
  }, [orderId, paymentId]);

  const findPaymentByOrderId = async (orderId: string) => {
    try {
      const response = await fetch(`/api/payments/find?order_id=${orderId}`);
      const data = await response.json();
      
      if (data.success && data.payment) {
        verifyPayment(data.payment._id);
      } else {
        setLoading(false);
        toast.error('Pembayaran tidak ditemukan');
      }
    } catch (error) {
      console.error('Error finding payment:', error);
      setLoading(false);
    }
  };

  const verifyPayment = async (paymentId: string) => {
    try {
      console.log('Verifying payment:', paymentId);
      const response = await fetch(`/api/payments/${paymentId}/status`);
      const data = await response.json();

      if (data.success) {
        setPaymentData(data.payment);
        
        if (data.payment.status === 'paid') {
          setIsVerified(true);
          toast.success('Pembayaran berhasil dikonfirmasi!');
          // Clear stored payment ID
          localStorage.removeItem('current_payment_id');
        } else {
          // Payment not yet confirmed, start polling
          startPaymentPolling(paymentId);
        }
      } else {
        toast.error('Gagal memverifikasi pembayaran');
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Terjadi kesalahan saat memverifikasi pembayaran');
    } finally {
      setLoading(false);
    }
  };

  const startPaymentPolling = (paymentId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/payments/${paymentId}/status`);
        const data = await response.json();
        
        if (data.success && data.payment.status === 'paid') {
          setPaymentData(data.payment);
          setIsVerified(true);
          toast.success('Pembayaran berhasil dikonfirmasi!');
          localStorage.removeItem('current_payment_id');
          clearInterval(pollInterval);
          
          // Redirect to bookings after 3 seconds
          setTimeout(() => {
            router.push('/user/dashboard/bookings');
          }, 3000);
        }
        
        // Stop polling after 10 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
        }, 10 * 60 * 1000);
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000); // Check every 5 seconds
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
          <p className="text-gray-600">Memverifikasi pembayaran...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {isVerified ? (
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isVerified ? 'Pembayaran Berhasil!' : 'Menunggu Konfirmasi'}
          </h1>
          <p className="text-gray-600">
            {isVerified ? 'Terima kasih telah melakukan pembayaran' : 'Sedang memverifikasi pembayaran Anda...'}
          </p>
        </div>

        {/* Payment Details */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Detail Pembayaran</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Order ID</span>
              <span className="font-medium">{paymentData?.midtrans_transaction_id || orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                isVerified 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {isVerified ? 'Berhasil' : 'Menunggu'}
              </span>
            </div>
            {paymentData && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Pembayaran</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(paymentData.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Metode Pembayaran</span>
                  <span className="font-medium capitalize">
                    {paymentData.payment_method?.replace('midtrans_', '')}
                  </span>
                </div>
                {paymentData.paid_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Waktu Pembayaran</span>
                    <span className="font-medium">
                      {new Date(paymentData.paid_at).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {isVerified ? (
          <>
            {/* Next Steps */}
            <div className="bg-blue-50 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Langkah Selanjutnya</h3>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-center">
                  <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 text-sm">1</span>
                  Tunggu konfirmasi dari klinik
                </li>
                <li className="flex items-center">
                  <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 text-sm">2</span>
                  Datang sesuai jadwal booking
                </li>
                <li className="flex items-center">
                  <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 text-sm">3</span>
                  Bawa bukti pembayaran jika diperlukan
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
              {paymentData?.booking_id && (
                <Link
                  href={`/user/dashboard/bookings/${paymentData.booking_id}`}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg text-center hover:bg-green-700 transition-colors"
                >
                  Lihat Detail Booking
                </Link>
              )}
            </div>
          </>
        ) : (
          /* Waiting for confirmation */
          <div className="bg-yellow-50 rounded-2xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-3">Menunggu Konfirmasi</h3>
            <p className="text-yellow-800">
              Pembayaran Anda sedang diproses. Halaman ini akan diperbarui otomatis 
              ketika pembayaran berhasil dikonfirmasi.
            </p>
          </div>
        )}

        {/* Support Info */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Butuh bantuan? Hubungi kami di:</p>
          <p className="font-medium">WhatsApp: +62 812-3456-7890</p>
        </div>
      </div>
    </div>
  );
}