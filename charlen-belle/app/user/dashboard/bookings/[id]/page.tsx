// app/user/dashboard/bookings/[id]/page.tsx
'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency, formatDate } from '../../../../lib/utils';
import toast from 'react-hot-toast';

type Booking = {
  _id: string;
  user_id: { _id: string; name: string; email: string };
  slot_id: { 
    _id: string; 
    date: string; 
    start_time: string; 
    end_time: string;
    doctor_id?: { _id: string; name: string };
    therapist_id?: { _id: string; name: string };
  };
  type: string;
  status: 'pending' | 'confirmed' | 'completed' | 'canceled';
  notes?: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
};

type BookingTreatment = {
  _id: string;
  treatment_id: { _id: string; name: string; base_price: number };
  quantity: number;
  price: number;
};

export default function BookingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [treatments, setTreatments] = useState<BookingTreatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [currentPaymentId, setCurrentPaymentId] = useState('');

  useEffect(() => {
    if (id) {
      fetchBookingDetail();
    }
  }, [id]);

  async function fetchBookingDetail() {
    try {
      setLoading(true);
      
      // Fetch booking details
      const bookingRes = await fetch(`/api/bookings/${id}`);
      if (!bookingRes.ok) {
        throw new Error('Booking tidak ditemukan');
      }
      const bookingData = await bookingRes.json();
      setBooking(bookingData.booking);

      // Fetch booking treatments
      const treatmentsRes = await fetch(`/api/booking-treatments?booking_id=${id}`);
      if (treatmentsRes.ok) {
        const treatmentsData = await treatmentsRes.json();
        setTreatments(treatmentsData.items || []);
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
      toast.error('Gagal memuat detail booking');
    } finally {
      setLoading(false);
    }
  }

  const handlePayment = async () => {
    if (!booking) return;
    
    setIsProcessingPayment(true);
    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: booking._id,
          payment_method: 'midtrans_qris',
          amount: booking.total_amount
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal memproses pembayaran');
      }

      // Store payment ID for verification
      if (data.payment_id) {
        localStorage.setItem('current_payment_id', data.payment_id);
        setCurrentPaymentId(data.payment_id);
      }

      // For Midtrans payments - Show in modal instead of new tab
      if (data.redirect_url) {
        setPaymentUrl(data.redirect_url);
        setShowPaymentModal(true);
        
        // Start checking payment status
        const checkInterval = setInterval(async () => {
          try {
            const statusResponse = await fetch(`/api/payments/${data.payment_id}/status`);
            const statusData = await statusResponse.json();
            
            if (statusData.success && statusData.payment.status === 'paid') {
              clearInterval(checkInterval);
              toast.success('Pembayaran berhasil!');
              fetchBookingDetail(); // Refresh booking data
              setShowPaymentModal(false);
              
              // Redirect to success page
              router.push(`/user/dashboard/bookings/payment/success?payment_id=${data.payment_id}`);
            }
          } catch (error) {
            console.error('Status check error:', error);
          }
        }, 5000); // Check every 5 seconds

        // Stop checking after 10 minutes
        setTimeout(() => clearInterval(checkInterval), 10 * 60 * 1000);
      } else {
        toast.success('Mohon lakukan pembayaran di kasir');
        router.push(`/user/dashboard/bookings/${booking._id}`);
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Terjadi kesalahan saat memproses pembayaran');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Close modal when clicking outside or pressing ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowPaymentModal(false);
      }
    };

    if (showPaymentModal) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showPaymentModal]);

  if (loading) {
    return (
      <div className="min-h-screen py-12 bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 shadow">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600">Memuat detail booking...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen py-12 bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 shadow">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking Tidak Ditemukan</h2>
            <p className="text-gray-600 mb-6">Booking yang Anda cari tidak ditemukan atau mungkin telah dihapus.</p>
            <button 
              onClick={() => router.push('/user/dashboard')}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Dikonfirmasi';
      case 'pending': return 'Menunggu Konfirmasi';
      case 'completed': return 'Selesai';
      case 'canceled': return 'Dibatalkan';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Pembayaran</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                Silakan selesaikan pembayaran Anda di halaman berikut. Status akan diperbarui otomatis.
              </p>
              
              {/* Payment iframe */}
              <div className="border rounded-lg overflow-hidden">
                <iframe
                  src={paymentUrl}
                  className="w-full h-96 border-0"
                  title="Midtrans Payment"
                  sandbox="allow-scripts allow-same-origin allow-forms"
                />
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Tips:</strong> Setelah menyelesaikan pembayaran, halaman ini akan otomatis menutup dan mengarahkan Anda ke halaman konfirmasi.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - KEEP YOUR EXISTING CODE BELOW */}
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl p-8 shadow mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Detail Booking</h1>
              <p className="text-gray-600">ID: {booking._id}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
              {getStatusText(booking.status)}
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Booking Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Informasi Booking</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Tanggal</p>
                  <p className="font-medium">{formatDate(booking.slot_id.date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Waktu</p>
                  <p className="font-medium">{booking.slot_id.start_time} - {booking.slot_id.end_time}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Jenis</p>
                  <p className="font-medium capitalize">{booking.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Dibuat Pada</p>
                  <p className="font-medium">{formatDate(booking.created_at)}</p>
                </div>
              </div>
            </div>

            {/* Staff Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Staff</h3>
              <div className="space-y-3">
                {booking.slot_id.doctor_id && (
                  <div>
                    <p className="text-sm text-gray-600">Dokter</p>
                    <p className="font-medium">{booking.slot_id.doctor_id.name}</p>
                  </div>
                )}
                {booking.slot_id.therapist_id && (
                  <div>
                    <p className="text-sm text-gray-600">Therapist</p>
                    <p className="font-medium">{booking.slot_id.therapist_id.name}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {booking.notes && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Catatan</h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{booking.notes}</p>
            </div>
          )}
        </div>

        {/* Treatments List */}
        <div className="bg-white rounded-2xl p-8 shadow mb-6">
          <h3 className="text-lg font-semibold mb-4">Treatment yang Dipilih</h3>
          <div className="space-y-4">
            {treatments.map((item) => (
              <div key={item._id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{item.treatment_id.name}</p>
                  <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(item.price)}</p>
                  <p className="text-sm text-gray-600">Total: {formatCurrency(item.price * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total Amount */}
        <div className="bg-white rounded-2xl p-8 shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Total Pembayaran</h3>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(booking.total_amount)}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button 
            onClick={() => router.push('/user/dashboard')}
            className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Kembali ke Dashboard
          </button>
          {booking.status === 'pending' && (
            <button 
              onClick={handlePayment}
              disabled={isProcessingPayment}
              className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-purple-400 disabled:cursor-not-allowed"
            >
              {isProcessingPayment ? 'Memproses...' : 'Bayar Sekarang'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}