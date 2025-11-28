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
  const [paymentGateway, setPaymentGateway] = useState<'midtrans' | 'doku'>('midtrans');

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
          payment_method: 'online_payment',
          amount: booking.total_amount
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Gagal memproses pembayaran');
      }

      // Store payment ID for verification
      if (data.payment_id) {
        localStorage.setItem('current_payment_id', data.payment_id);
        setCurrentPaymentId(data.payment_id);
      }

      // Set gateway type
      setPaymentGateway(data.gateway || 'midtrans');

      // Show payment modal with redirect URL
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

  const getGatewayTitle = () => {
    return paymentGateway === 'doku' ? 'DOKU' : 'Midtrans';
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-[#FFFDF9] border border-[#E1D4C0] rounded-2xl p-8 shadow-sm text-center mt-10">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#6C3FD1]" />
          <p className="mt-4 text-sm text-[#A18F76]">Memuat detail booking...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-[#FFFDF9] border border-[#E1D4C0] rounded-2xl p-8 shadow-sm text-center mt-10">
          <h2 className="text-2xl font-semibold text-[#3B2A1E] mb-3">Booking Tidak Ditemukan</h2>
          <p className="text-sm text-[#A18F76] mb-6">
            Booking yang Anda cari tidak ditemukan atau mungkin telah dihapus.
          </p>
          <button 
            onClick={() => router.push('/user/dashboard')}
            className="inline-flex items-center gap-2 rounded-xl bg-[#C89B4B] text-white px-6 py-2.5 text-sm font-medium hover:bg-[#b48735] transition-colors"
          >
            <span>Kembali ke Dashboard</span>
          </button>
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
    <>
      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-[#FFFDF9] rounded-2xl border border-[#E1D4C0] shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E1D4C0] bg-[#FBF6EA]">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-[#E6D8C2] flex items-center justify-center">
                  <svg className="h-4 w-4 text-[#3B2A1E]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 2v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm12 7H5v10h14V9z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-[#3B2A1E]">
                  Pembayaran via {getGatewayTitle()}
                </h3>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-[#A18F76] hover:text-[#3B2A1E] transition-colors p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-5">
              <p className="text-xs text-[#A18F76] mb-4">
                Silakan selesaikan pembayaran Anda di halaman berikut. Status akan diperbarui otomatis.
              </p>
              
              {/* Payment iframe */}
              <div className="border border-[#E1D4C0] rounded-xl overflow-hidden bg-white">
                <iframe
                  src={paymentUrl}
                  className="w-full h-[60vh] sm:h-96 border-0"
                  title={`${getGatewayTitle()} Payment`}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
                />
              </div>
              
              <div className="mt-4 p-3 bg-[#E3F2FD] rounded-xl">
                <p className="text-xs text-[#1E4E8C]">
                  <strong>Tips:</strong> Setelah menyelesaikan pembayaran, halaman ini akan otomatis menutup dan mengarahkan Anda ke halaman konfirmasi.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="bg-[#FFFDF9] border border-[#E1D4C0] rounded-2xl p-5 sm:p-6 shadow-sm mt-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <p className="text-xs text-[#A18F76] mb-1">Detail Booking</p>
              <h1 className="text-xl sm:text-2xl font-semibold text-[#3B2A1E]">Booking Treatment</h1>
              <p className="text-xs text-[#A18F76] mt-1 break-all">ID: {booking._id}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium self-start sm:self-auto ${getStatusColor(booking.status)}`}>
              {getStatusText(booking.status)}
            </span>
          </div>

          <div className="grid gap-5 sm:gap-6 md:grid-cols-2">
            {/* Booking Information */}
            <div>
              <h3 className="text-sm font-semibold text-[#3B2A1E] mb-3">Informasi Booking</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-[#A18F76]">Tanggal</p>
                  <p className="font-semibold text-[#3B2A1E]">
                    {formatDate(booking.slot_id.date)}
                  </p>
                </div>
                <div>
                  <p className="text-[#A18F76]">Waktu</p>
                  <p className="font-semibold text-[#3B2A1E]">
                    {booking.slot_id.start_time} - {booking.slot_id.end_time}
                  </p>
                </div>
                <div>
                  <p className="text-[#A18F76]">Jenis</p>
                  <p className="font-semibold text-[#3B2A1E] capitalize">
                    {booking.type}
                  </p>
                </div>
                <div>
                  <p className="text-[#A18F76]">Dibuat Pada</p>
                  <p className="font-semibold text-[#3B2A1E]">
                    {formatDate(booking.created_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Staff Information */}
            <div>
              <h3 className="text-sm font-semibold text-[#3B2A1E] mb-3">Staff</h3>
              <div className="space-y-2 text-sm">
                {booking.slot_id.doctor_id && (
                  <div>
                    <p className="text-[#A18F76]">Dokter</p>
                    <p className="font-semibold text-[#3B2A1E]">
                      {booking.slot_id.doctor_id.name}
                    </p>
                  </div>
                )}
                {booking.slot_id.therapist_id && (
                  <div>
                    <p className="text-[#A18F76]">Therapist</p>
                    <p className="font-semibold text-[#3B2A1E]">
                      {booking.slot_id.therapist_id.name}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {booking.notes && (
            <div className="mt-5">
              <h3 className="text-sm font-semibold text-[#3B2A1E] mb-2">Catatan</h3>
              <p className="text-sm text-[#3B2A1E] bg-[#FBF6EA] border border-[#E1D4C0] p-3 rounded-xl">
                {booking.notes}
              </p>
            </div>
          )}
        </div>

        {/* Treatments List */}
        <div className="bg-[#FFFDF9] border border-[#E1D4C0] rounded-2xl p-5 sm:p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-[#3B2A1E] mb-4">Treatment yang Dipilih</h3>
          {treatments.length === 0 ? (
            <p className="text-sm text-[#A18F76]">Tidak ada treatment yang tercatat.</p>
          ) : (
            <div className="space-y-3">
              {treatments.map((item) => (
                <div
                  key={item._id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-4 rounded-xl border border-[#E1D4C0] bg-[#FBF6EA]"
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#3B2A1E]">
                      {item.treatment_id.name}
                    </p>
                    <p className="text-xs text-[#A18F76] mt-1">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-left sm:text-right text-xs">
                    <p className="font-semibold text-[#3B2A1E]">
                      {formatCurrency(item.price)}
                    </p>
                    <p className="text-[#A18F76] mt-1">
                      Total:{' '}
                      <span className="font-semibold text-[#3B2A1E]">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total Amount + Actions */}
        <div className="bg-[#FFFDF9] border border-[#E1D4C0] rounded-2xl p-5 sm:p-6 shadow-sm mb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-[#3B2A1E]">
                Total Pembayaran
              </h3>
              <p className="text-2xl font-bold text-[#6C3FD1] mt-1">
                {formatCurrency(booking.total_amount)}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <button 
                onClick={() => router.push('/user/dashboard/bookings')}
                className="w-full sm:w-auto rounded-xl border border-[#E1D4C0] text-[#7E6A52] py-2.5 px-4 text-sm font-medium hover:bg-[#FBF6EA] transition-colors"
              >
                Kembali ke Booking
              </button>
              {booking.status === 'pending' && (
                <button 
                  onClick={handlePayment}
                  disabled={isProcessingPayment}
                  className="w-full sm:w-auto rounded-xl bg-[#6C3FD1] text-white py-2.5 px-4 text-sm font-medium hover:bg-[#5b34b3] disabled:bg-[#A68FEA] disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessingPayment ? 'Memproses...' : 'Bayar Sekarang'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}