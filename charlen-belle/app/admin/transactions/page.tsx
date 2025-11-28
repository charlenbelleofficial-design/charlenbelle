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
    payment_gateway: 'midtrans' | 'doku';
    amount: number;
    midtrans_redirect_url?: string;
    doku_redirect_url?: string;
    created_at: string;
  };
}

interface SnackbarState {
  isVisible: boolean;
  message: string;
  type: SnackbarType;
}

// Icons remain the same...
const IconCreditCard = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth={1.6} />
    <path d="M3 9h18" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
    <rect x="7" y="12" width="4" height="2" rx="0.5" fill="currentColor" />
  </svg>
);

const IconFilter = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
  </svg>
);

const IconRefresh = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M5 8a7 7 0 0 1 11-2l1 1" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19 8V4h-4" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19 16a7 7 0 0 1-11 2l-1-1" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 16v4h4" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconClose = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
  </svg>
);

const IconSearch = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth={1.8} />
    <path d="M16 16l4 4" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
  </svg>
);

const IconLoader = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth={1.6} opacity={0.25} />
    <path d="M20 12a8 8 0 0 0-8-8" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
  </svg>
);

// Payment Modal Component
function PaymentModal({ booking, onClose, onPaymentSuccess }: any) {
  const [paymentUrl, setPaymentUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gateway, setGateway] = useState<'midtrans' | 'doku'>('midtrans');

  useEffect(() => {
    const initiatePayment = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/payments/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking_id: booking._id }),
        });

        const data = await response.json();

        if (data.success && data.redirect_url) {
          setPaymentUrl(data.redirect_url);
          setGateway(data.gateway || 'midtrans');
        } else {
          throw new Error(data.error || 'Gagal memproses pembayaran');
        }
      } catch (error) {
        console.error('Error initiating payment:', error);
        setError(
          `Gagal memproses pembayaran: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      } finally {
        setLoading(false);
      }
    };

    initiatePayment();
  }, [booking._id]);

  const handleIframeLoad = () => {
    // optional: handle after load
  };

  const handleIframeError = () => {
    setError('Gagal memuat halaman pembayaran');
  };

  const getGatewayName = () => {
    return gateway === 'doku' ? 'DOKU' : 'Midtrans';
  };

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-[#E5D7BE]">
        {/* Header */}
        <div className="p-6 border-b border-[#E5D7BE] flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-[#3A3530] flex items-center gap-2">
              <span className="w-9 h-9 rounded-full bg-[#F5E4C6] flex items-center justify-center text-[#8F6E45]">
                <IconCreditCard className="w-5 h-5" />
              </span>
              <span>Proses Pembayaran via {getGatewayName()}</span>
            </h2>
            <p className="text-xs md:text-sm text-[#8B7B63] mt-1">
              {booking.user_id.name} • Total:{' '}
              <span className="font-semibold text-[#3A3530]">
                {formatCurrency(booking.total_amount)}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[#8B7B63] hover:bg-[#F7EEDB] transition-colors"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 bg-[#FFFBF3]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-sm text-[#8B7B63]">
              <IconLoader className="w-8 h-8 animate-spin text-[#B48A5A]" />
              <p>Mempersiapkan halaman pembayaran...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-full bg-[#FFF5F4] flex items-center justify-center mx-auto mb-3">
                <IconCreditCard className="w-6 h-6 text-[#B42318]" />
              </div>
              <h3 className="text-base md:text-lg font-semibold text-[#3A3530] mb-1">
                Gagal Memuat Pembayaran
              </h3>
              <p className="text-sm text-[#8B7B63] mb-4 max-w-md mx-auto">
                {error}
              </p>
              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 bg-[#B48A5A] text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-[#8F6E45] transition-colors"
              >
                <IconClose className="w-4 h-4" />
                <span>Tutup</span>
              </button>
            </div>
          ) : paymentUrl ? (
            <div className="w-full h-[480px] bg-white rounded-xl border border-[#E5D7BE] overflow-hidden">
              <iframe
                src={paymentUrl}
                className="w-full h-full border-0"
                title={`${getGatewayName()} Payment`}
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
              />
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#E5D7BE] bg-[#FFF9EB] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <p className="text-xs md:text-sm text-[#8B7B63] max-w-md">
            Setelah pembayaran selesai di halaman di atas, Anda dapat menutup popup
            ini dan me-refresh halaman untuk melihat status terbaru.
          </p>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs md:text-sm font-semibold border border-[#D2C3A7] bg-white text-[#7A5D3A] hover:bg-[#F7EEDB] transition-colors"
          >
            <IconClose className="w-4 h-4" />
            <span>Tutup</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminTransactionsPage() {
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('unpaid');
  const [processingPayment] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    isVisible: false,
    message: '',
    type: 'info',
  });

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  const showSnackbar = (message: string, type: SnackbarType = 'info') => {
    setSnackbar({
      isVisible: true,
      message,
      type,
    });
  };

  const hideSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, isVisible: false }));
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
    setTimeout(() => {
      fetchTransactions();
    }, 2000);
  };

  const checkPaymentStatus = async (bookingId: string) => {
    try {
      const response = await fetch(
        `/api/admin/payments/status?booking_id=${bookingId}`,
      );
      const data = await response.json();

      if (data.success) {
        showSnackbar(`Status pembayaran: ${data.payment.status}`, 'info');
        fetchTransactions();
      } else {
        throw new Error(data.error || 'Gagal memeriksa status pembayaran');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      showSnackbar('Gagal memeriksa status pembayaran', 'error');
    }
  };

  return (
    <div className="p-6 bg-[#F8F4E8] min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-[#3A3530]">
            Manajemen Transaksi
          </h1>
          <p className="text-sm text-[#8B7B63] mt-1">
            Kelola pembayaran dan status transaksi booking pelanggan.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 md:p-7 shadow-sm border border-[#E5D7BE] mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[#F5E4C6] flex items-center justify-center text-[#8F6E45]">
              <IconFilter className="w-4 h-4" />
            </span>
            <label className="text-xs md:text-sm font-semibold text-[#6E5A40]">
              Filter Status Pembayaran
            </label>
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-[#C9AE84] rounded-full px-3 py-2.5 text-xs md:text-sm bg-[#FFFBF3] text-[#3A3530] focus:border-[#B48A5A] focus:ring-2 focus:ring-[#E2CBA4] focus:outline-none"
          >
            <option value="unpaid">Belum Bayar</option>
            <option value="paid">Sudah Bayar</option>
            <option value="all">Semua</option>
          </select>

          <button
            onClick={fetchTransactions}
            className="inline-flex items-center gap-2 bg-[#B48A5A] text-white px-4 py-2.5 rounded-full text-xs md:text-sm font-semibold hover:bg-[#8F6E45] transition-colors"
          >
            <IconRefresh className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E5D7BE] overflow-hidden">
        {loading ? (
          <div className="text-center py-12 flex flex-col items-center gap-3">
            <IconLoader className="w-8 h-8 animate-spin text-[#B48A5A]" />
            <p className="mt-1 text-sm text-[#8B7B63]">
              Memuat data transaksi...
            </p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-12 h-12 rounded-full bg-[#F5E4C6] flex items-center justify-center text-[#8F6E45] mx-auto mb-4">
              <IconCreditCard className="w-6 h-6" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-[#3A3530] mb-1">
              {filter === 'unpaid'
                ? 'Tidak ada transaksi belum bayar'
                : 'Tidak ada transaksi'}
            </h3>
            <p className="text-sm text-[#8B7B63] max-w-md mx-auto">
              {filter === 'unpaid'
                ? 'Semua booking yang terdaftar sudah lunas.'
                : 'Tidak ada transaksi yang sesuai dengan filter yang dipilih.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F1E3CB]">
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
  currentUserRole,
}: any) {
  const canProcessPayment = ['admin', 'superadmin', 'kasir'].includes(
    currentUserRole || '',
  );
  const hasPayment = booking.payment;
  const isPaid = hasPayment && booking.payment.status === 'paid';
  const isPending = hasPayment && booking.payment.status === 'pending';
  
  const getRedirectUrl = () => {
    if (!hasPayment) return null;
    return booking.payment.payment_gateway === 'doku' 
      ? booking.payment.doku_redirect_url 
      : booking.payment.midtrans_redirect_url;
  };
  
  const getGatewayBadge = () => {
    if (!hasPayment) return null;
    const gateway = booking.payment.payment_gateway;
    return (
      <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-[#E6F0FF] text-[#1D4ED8] border border-[#C3D4FF]">
        {gateway === 'doku' ? 'DOKU' : 'Midtrans'}
      </span>
    );
  };

  return (
    <div className="px-6 py-5 hover:bg-[#FFFAF1] transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Status badges */}
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span
              className={`px-3 py-1 rounded-full text-[11px] md:text-xs font-semibold ${getBookingStatusColor(
                booking.status,
              )}`}
            >
              {getBookingStatusText(booking.status)}
            </span>

            {hasPayment && (
              <>
                <span
                  className={`px-3 py-1 rounded-full text-[11px] md:text-xs font-semibold ${getPaymentStatusColor(
                    booking.payment.status,
                  )}`}
                >
                  {getPaymentStatusText(booking.payment.status)}
                </span>
                {getGatewayBadge()}
              </>
            )}

            <span className="text-[11px] md:text-xs text-[#A08C6A] font-mono">
              ID: {booking._id.slice(-8)}
            </span>
          </div>

          {/* Main info grid */}
          <div className="grid md:grid-cols-4 gap-4 mb-3 text-xs md:text-sm">
            <div>
              <p className="text-[#8B7B63] mb-0.5">Pelanggan</p>
              <p className="font-semibold text-[#3A3530]">
                {booking.user_id.name}
              </p>
              <p className="text-[#8B7B63]">{booking.user_id.email}</p>
              {booking.user_id.phone_number && (
                <p className="text-[#8B7B63]">
                  {booking.user_id.phone_number}
                </p>
              )}
            </div>

            <div>
              <p className="text-[#8B7B63] mb-0.5">Tanggal & Waktu</p>
              <p className="font-semibold text-[#3A3530]">
                {formatDate(booking.slot_id.date)} •{' '}
                {booking.slot_id.start_time}
              </p>
              <p className="text-[#8B7B63]">
                {booking.slot_id.doctor_id?.name &&
                  `Dokter: ${booking.slot_id.doctor_id.name}`}
                {booking.slot_id.doctor_id?.name &&
                  booking.slot_id.therapist_id?.name &&
                  ' • '}
                {booking.slot_id.therapist_id?.name &&
                  `Terapis: ${booking.slot_id.therapist_id.name}`}
              </p>
            </div>

            <div>
              <p className="text-[#8B7B63] mb-0.5">Treatment</p>
              <p className="font-semibold text-[#3A3530]">
                {booking.treatments && booking.treatments.length > 0
                  ? `${booking.treatments.length} treatment`
                  : booking.type === 'consultation'
                  ? 'Konsultasi'
                  : 'Treatment'}
              </p>
              <p className="text-[#8B7B63]">
                Total: {formatCurrency(booking.total_amount)}
              </p>
            </div>

            <div>
              <p className="text-[#8B7B63] mb-0.5">Pembayaran</p>
              {hasPayment ? (
                <>
                  <p className="font-semibold text-[#3A3530]">
                    {formatCurrency(booking.payment.amount)}
                  </p>
                  <p className="text-[#8B7B63] text-xs">
                    {formatDate(booking.payment.created_at)}
                  </p>
                </>
              ) : (
                <p className="text-[#8F6E45] font-semibold">
                  Belum ada pembayaran
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {canProcessPayment && (
            <div className="flex flex-wrap items-center gap-3 mt-1">
              {!hasPayment && (
                <button
                  onClick={onInitiatePayment}
                  disabled={processingPayment}
                  className="inline-flex items-center gap-2 bg-[#6BAF7A] text-white px-4 py-2 rounded-full text-xs md:text-sm font-semibold hover:bg-[#4F9160] disabled:bg-[#A6D3B0] disabled:cursor-not-allowed transition-colors"
                >
                  {processingPayment ? (
                    <>
                      <IconLoader className="w-4 h-4 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <IconCreditCard className="w-4 h-4" />
                      <span>Proses Pembayaran</span>
                    </>
                  )}
                </button>
              )}

              {isPending && (
                <button
                  onClick={() => onCheckStatus(booking._id)}
                  className="inline-flex items-center gap-2 bg-[#F2C166] text-[#5E4308] px-4 py-2 rounded-full text-xs md:text-sm font-semibold hover:bg-[#E3B252] transition-colors"
                >
                  <IconSearch className="w-4 h-4" />
                  <span>Cek Status</span>
                </button>
              )}

              {hasPayment && getRedirectUrl() && !isPaid && (
                <button
                  onClick={onInitiatePayment}
                  className="inline-flex items-center gap-2 border border-[#D2C3A7] bg-white text-[#7A5D3A] px-4 py-2 rounded-full text-xs md:text-sm font-semibold hover:bg-[#F7EEDB] transition-colors"
                >
                  <IconCreditCard className="w-4 h-4" />
                  <span>Buka Pembayaran</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper functions remain the same...
function getPaymentStatusColor(status: string) {
  switch (status) {
    case 'paid':
      return 'bg-[#F3FBF4] text-[#2F7C38] border border-[#D1E9D2]';
    case 'pending':
      return 'bg-[#FFF3D4] text-[#8F6E45] border border-[#F0D9A5]';
    case 'failed':
      return 'bg-[#FFF5F4] text-[#B42318] border border-[#F3C9C5]';
    default:
      return 'bg-[#F1E3CB] text-[#6E5A40] border border-[#E0CDA9]';
  }
}

function getPaymentStatusText(status: string) {
  switch (status) {
    case 'paid':
      return 'Lunas';
    case 'pending':
      return 'Menunggu';
    case 'failed':
      return 'Gagal';
    default:
      return status;
  }
}

function getBookingStatusColor(status: string) {
  switch (status) {
    case 'confirmed':
      return 'bg-[#F3FBF4] text-[#2F7C38] border border-[#D1E9D2]';
    case 'pending':
      return 'bg-[#FFF3D4] text-[#8F6E45] border border-[#F0D9A5]';
    case 'completed':
      return 'bg-[#E6F0FF] text-[#1D4ED8] border border-[#C3D4FF]';
    case 'canceled':
      return 'bg-[#FFF5F4] text-[#B42318] border border-[#F3C9C5]';
    default:
      return 'bg-[#F1E3CB] text-[#6E5A40] border border-[#E0CDA9]';
  }
}

function getBookingStatusText(status: string) {
  switch (status) {
    case 'confirmed':
      return 'Dikonfirmasi';
    case 'pending':
      return 'Menunggu';
    case 'completed':
      return 'Selesai';
    case 'canceled':
      return 'Dibatalkan';
    default:
      return status;
  }
}