// app/admin/transactions/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Snackbar, SnackbarType } from '../../components/ui/snackbar';
import { formatCurrency, formatDate } from '../../lib/utils';

interface User {
  _id: string;
  name: string;
  email: string;
  phone_number?: string;
}

interface Booking {
  _id: string;
  user_id: { _id: string; name: string; email: string; phone_number?: string };
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
  treatments?: any[];
  payment?: {
    _id: string;
    status: string;
    payment_method: string;
    amount: number;
    midtrans_redirect_url?: string;
    created_at: string;
  };
}

interface SnackbarState {
  isVisible: boolean;
  message: string;
  type: SnackbarType;
}

// Payment Modal Component
function PaymentModal({ booking, onClose, onPaymentSuccess }: any) {
  const [paymentUrl, setPaymentUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const initiatePayment = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/payments/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking_id: booking._id })
        });

        const data = await response.json();
        
        if (data.success && data.redirect_url) {
          setPaymentUrl(data.redirect_url);
        } else {
          throw new Error(data.error || 'Gagal memproses pembayaran');
        }
      } catch (error) {
        console.error('Error initiating payment:', error);
        setError(`Gagal memproses pembayaran: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    initiatePayment();
  }, [booking._id]);

  const handleIframeLoad = () => {
    // You can add loading state handling here if needed
  };

  const handleIframeError = () => {
    setError('Gagal memuat halaman pembayaran');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              Proses Pembayaran - {booking.user_id.name}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            Total: {formatCurrency(booking.total_amount)}
          </p>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
              <p className="text-gray-600">Mempersiapkan pembayaran...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">❌</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Gagal Memuat Pembayaran</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={onClose}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Tutup
              </button>
            </div>
          ) : paymentUrl ? (
            <div className="w-full h-[500px]">
              <iframe
                src={paymentUrl}
                className="w-full h-full border-0 rounded-lg"
                title="Midtrans Payment"
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </div>
          ) : null}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Setelah pembayaran selesai, tutup popup ini dan refresh halaman untuk melihat status terbaru.
            </p>
            <button
              onClick={onClose}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminTransactionsPage() {
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('unpaid'); // unpaid, all, paid
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    isVisible: false,
    message: '',
    type: 'info'
  });

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  const showSnackbar = (message: string, type: SnackbarType = 'info') => {
    setSnackbar({
      isVisible: true,
      message,
      type
    });
  };

  const hideSnackbar = () => {
    setSnackbar(prev => ({ ...prev, isVisible: false }));
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('payment_status', filter);

      const response = await fetch(`/api/admin/transactions?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setBookings(data.bookings || []);
      } else {
        throw new Error(data.error || 'Failed to fetch transactions');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      showSnackbar('Gagal memuat data transaksi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInitiatePayment = async (booking: Booking) => {
    setSelectedBooking(booking);
    setShowPaymentModal(true);
  };

  const handlePaymentModalClose = () => {
    setShowPaymentModal(false);
    setSelectedBooking(null);
    // Refresh transactions after payment modal closes
    setTimeout(() => {
      fetchTransactions();
    }, 2000);
  };

  const checkPaymentStatus = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/admin/payments/status?booking_id=${bookingId}`);
      const data = await response.json();
      
      if (data.success) {
        showSnackbar(`Status pembayaran: ${data.payment.status}`, 'info');
        fetchTransactions(); // Refresh data
      } else {
        throw new Error(data.error || 'Gagal memeriksa status pembayaran');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      showSnackbar('Gagal memeriksa status pembayaran', 'error');
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Lunas';
      case 'pending': return 'Menunggu';
      case 'failed': return 'Gagal';
      default: return status;
    }
  };

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBookingStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Dikonfirmasi';
      case 'pending': return 'Menunggu';
      case 'completed': return 'Selesai';
      case 'canceled': return 'Dibatalkan';
      default: return status;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Transaksi</h1>
          <p className="text-gray-600 mt-2">Kelola pembayaran booking pelanggan</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter Status Pembayaran:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
          >
            <option value="unpaid">Belum Bayar</option>
            <option value="paid">Sudah Bayar</option>
            <option value="all">Semua</option>
          </select>
          
          <button
            onClick={fetchTransactions}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <p className="mt-2 text-gray-600">Memuat data transaksi...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💳</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {filter === 'unpaid' ? 'Tidak ada transaksi belum bayar' : 'Tidak ada transaksi'}
            </h3>
            <p className="text-gray-600">
              {filter === 'unpaid' 
                ? 'Semua booking sudah lunas' 
                : 'Tidak ada transaksi yang sesuai dengan filter yang dipilih.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-hidden">
            {bookings.map((booking) => (
              <TransactionCard
                key={booking._id}
                booking={booking}
                onInitiatePayment={() => handleInitiatePayment(booking)}
                onCheckStatus={checkPaymentStatus}
                processingPayment={processingPayment === booking._id}
                currentUserRole={session?.user?.role}
              />
            ))}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedBooking && (
        <PaymentModal
          booking={selectedBooking}
          onClose={handlePaymentModalClose}
          onPaymentSuccess={fetchTransactions}
        />
      )}

      {/* Snackbar Component */}
      <Snackbar
        message={snackbar.message}
        type={snackbar.type}
        isVisible={snackbar.isVisible}
        onClose={hideSnackbar}
        duration={snackbar.type === 'error' ? 7000 : 5000}
        position="top-center"
      />
    </div>
  );
}

function TransactionCard({ 
  booking, 
  onInitiatePayment, 
  onCheckStatus, 
  processingPayment,
  currentUserRole 
}: any) {
  const canProcessPayment = ['admin', 'superadmin', 'kasir'].includes(currentUserRole || '');
  const hasPayment = booking.payment;
  const isPaid = hasPayment && booking.payment.status === 'paid';
  const isPending = hasPayment && booking.payment.status === 'pending';

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <div className="p-6 hover:bg-gray-50 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getBookingStatusColor(booking.status)}`}>
                {getBookingStatusText(booking.status)}
              </span>
              
              {hasPayment && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(booking.payment.status)}`}>
                  {getPaymentStatusText(booking.payment.status)}
                </span>
              )}
              
              <span className="text-sm text-gray-500">
                ID: {booking._id.slice(-8)}
              </span>
            </div>
            
            <div className="grid md:grid-cols-4 gap-4 mb-3">
              <div>
                <p className="text-sm text-gray-600">Pelanggan</p>
                <p className="font-medium">{booking.user_id.name}</p>
                <p className="text-sm text-gray-500">{booking.user_id.email}</p>
                {booking.user_id.phone_number && (
                  <p className="text-sm text-gray-500">{booking.user_id.phone_number}</p>
                )}
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Tanggal & Waktu</p>
                <p className="font-medium">
                  {formatDate(booking.slot_id.date)} • {booking.slot_id.start_time}
                </p>
                <p className="text-sm text-gray-500">
                  {booking.slot_id.doctor_id?.name && `Dokter: ${booking.slot_id.doctor_id.name}`}
                  {booking.slot_id.therapist_id?.name && `Therapist: ${booking.slot_id.therapist_id.name}`}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Treatment</p>
                <p className="font-medium">
                  {booking.treatments && booking.treatments.length > 0 
                    ? `${booking.treatments.length} treatment` 
                    : booking.type === 'consultation' ? 'Konsultasi' : 'Treatment'
                  }
                </p>
                <p className="text-sm text-gray-500">
                  Total: {formatCurrency(booking.total_amount)}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Pembayaran</p>
                {hasPayment ? (
                  <>
                    <p className="font-medium">{formatCurrency(booking.payment.amount)}</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(booking.payment.created_at)}
                    </p>
                  </>
                ) : (
                  <p className="text-yellow-600 font-medium">Belum ada pembayaran</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {canProcessPayment && (
                <>
                  {!hasPayment && (
                    <button
                      onClick={onInitiatePayment}
                      disabled={processingPayment}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {processingPayment ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Memproses...
                        </>
                      ) : (
                        '💳 Proses Pembayaran'
                      )}
                    </button>
                  )}
                  
                  {isPending && (
                    <button
                      onClick={() => onCheckStatus(booking._id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      🔍 Cek Status
                    </button>
                  )}
                  
                  {hasPayment && booking.payment.midtrans_redirect_url && (
                    <button
                      onClick={onInitiatePayment}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      🔗 Buka Pembayaran
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getPaymentStatusColor(status: string) {
  switch (status) {
    case 'paid': return 'bg-green-100 text-green-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'failed': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getPaymentStatusText(status: string) {
  switch (status) {
    case 'paid': return 'Lunas';
    case 'pending': return 'Menunggu';
    case 'failed': return 'Gagal';
    default: return status;
  }
}

function getBookingStatusColor(status: string) {
  switch (status) {
    case 'confirmed': return 'bg-green-100 text-green-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'completed': return 'bg-blue-100 text-blue-800';
    case 'canceled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getBookingStatusText(status: string) {
  switch (status) {
    case 'confirmed': return 'Dikonfirmasi';
    case 'pending': return 'Menunggu';
    case 'completed': return 'Selesai';
    case 'canceled': return 'Dibatalkan';
    default: return status;
  }
}