'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency, formatDate } from '../../../lib/utils';
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
  type: 'consultation' | 'treatment';
  status: 'pending' | 'confirmed' | 'completed' | 'canceled';
  confirmed_by?: { _id: string; name: string };
  notes?: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  treatments?: BookingTreatment[];
};

type BookingTreatment = {
  _id: string;
  treatment_id: { _id: string; name: string; description?: string };
  quantity: number;
  price: number;
};

// Status Card Component
function StatusCard({
  title,
  count,
  active,
  onClick,
  color = 'gray'
}: {
  title: string;
  count: number;
  active: boolean;
  onClick: () => void;
  color?: 'gray' | 'yellow' | 'green' | 'blue' | 'red';
}) {
  const baseColor = {
    gray: 'border-[#E1D4C0] bg-[#FBF6EA] text-[#7E6A52]',
    yellow: 'border-[#E6D9AF] bg-[#FFF8D6] text-[#7E6A52]',
    green: 'border-[#C5E0BF] bg-[#E6F6E3] text-[#4F6F52]',
    blue: 'border-[#C4D7F2] bg-[#E3ECFF] text-[#4F628E]',
    red: 'border-[#F1C5C5] bg-[#FFE5E5] text-[#8A3A3A]'
  }[color];

  const activeRing = {
    gray: 'ring-2 ring-[#D3C2A6]',
    yellow: 'ring-2 ring-[#E2C771]',
    green: 'ring-2 ring-[#81B07A]',
    blue: 'ring-2 ring-[#6D8BD3]',
    red: 'ring-2 ring-[#D46A6A]'
  }[color];

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[96px] ${baseColor} ${
        active ? activeRing + ' shadow-sm' : 'hover:shadow-sm'
      }`}
    >
      <div className="text-xs text-[#A18F76] mb-1">{title}</div>
      <div className="text-2xl font-semibold text-[#3B2A1E]">{count}</div>
    </button>
  );
}

// Booking Card Component
function BookingCard({ booking, onViewDetail }: { booking: Booking; onViewDetail: () => void }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Dikonfirmasi';
      case 'pending':
        return 'Menunggu Konfirmasi';
      case 'completed':
        return 'Selesai';
      case 'canceled':
        return 'Dibatalkan';
      default:
        return status;
    }
  };

  const getActionButton = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <button
            onClick={onViewDetail}
            className="px-5 py-2.5 bg-[#6C3FD1] text-white rounded-xl text-xs font-medium hover:bg-[#5b34b3] transition-colors"
          >
            Bayar Sekarang
          </button>
        );
      case 'confirmed':
        return (
          <button
            onClick={onViewDetail}
            className="px-5 py-2.5 border border-[#6C3FD1] text-[#6C3FD1] rounded-xl text-xs font-medium hover:bg-[#F4EDFF] transition-colors"
          >
            Lihat Detail
          </button>
        );
      default:
        return (
          <button
            onClick={onViewDetail}
            className="px-5 py-2.5 border border-[#D0C3AD] text-[#7E6A52] rounded-xl text-xs font-medium hover:bg-[#FBF6EA] transition-colors"
          >
            Lihat Detail
          </button>
        );
    }
  };

  const getTreatmentNames = () => {
    if (!booking.treatments || booking.treatments.length === 0) {
      return booking.type === 'consultation' ? 'Konsultasi' : 'Treatment';
    }

    const names = booking.treatments.map((t) => t.treatment_id.name);
    if (names.length > 2) {
      return `${names.slice(0, 2).join(', ')} +${names.length - 2} lainnya`;
    }
    return names.join(', ');
  };

  return (
    <div className="px-6 py-5 hover:bg-[#FBF6EA] transition-colors">
      <div className="flex items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
              {getStatusText(booking.status)}
            </span>
            <span className="text-xs text-[#A18F76]">
              ID: {booking._id.slice(-8)}
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-3">
            <div>
              <p className="text-xs text-[#A18F76]">Tanggal & Waktu</p>
              <p className="text-sm font-semibold text-[#3B2A1E]">
                {formatDate(booking.slot_id.date)} • {booking.slot_id.start_time}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#A18F76]">Treatment</p>
              <p className="text-sm font-semibold text-[#3B2A1E]">
                {getTreatmentNames()}
              </p>
              {booking.treatments && booking.treatments.length > 0 && (
                <p className="text-xs text-[#A18F76] mt-1">
                  {booking.treatments.length} item •{' '}
                  {booking.treatments.reduce((sum, t) => sum + t.quantity, 0)} total
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-[#A18F76]">Total</p>
              <p className="text-sm font-semibold text-[#6C3FD1]">
                {formatCurrency(booking.total_amount)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[#A18F76]">
            <span>Dibuat: {formatDate(booking.created_at)}</span>
            {booking.confirmed_by && (
              <span>Dikonfirmasi oleh: {booking.confirmed_by.name}</span>
            )}
            {booking.notes && (
              <span className="truncate max-w-xs">Catatan: {booking.notes}</span>
            )}
          </div>
        </div>

        <div className="ml-0 md:ml-6 shrink-0">
          {getActionButton(booking.status)}
        </div>
      </div>
    </div>
  );
}

// Main Component
export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] =
    useState<'all' | 'pending' | 'confirmed' | 'completed' | 'canceled'>('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    try {
      setLoading(true);
      const res = await fetch('/api/bookings?user=me');
      const data = await res.json();

      if (data.success) {
        setBookings(data.bookings || []);
      } else {
        throw new Error(data.error || 'Gagal memuat data booking');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Gagal memuat data booking');
    } finally {
      setLoading(false);
    }
  }

  const filteredBookings = bookings.filter(
    (booking) => filter === 'all' || booking.status === filter
  );

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Dikonfirmasi';
      case 'pending':
        return 'Menunggu Konfirmasi';
      case 'completed':
        return 'Selesai';
      case 'canceled':
        return 'Dibatalkan';
      default:
        return status;
    }
  };

  const getStatusCount = (status: string) => {
    return bookings.filter((booking) => booking.status === status).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#6C3FD1]" />
            <p className="mt-4 text-[#A18F76]">Memuat data booking...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-2">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#3B2A1E] mb-1">
            Booking Saya
          </h1>
          <p className="text-sm text-[#A18F76]">
            Kelola dan lihat riwayat booking treatment Anda.
          </p>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatusCard
            title="Semua"
            count={bookings.length}
            active={filter === 'all'}
            onClick={() => setFilter('all')}
          />
          <StatusCard
            title="Menunggu"
            count={getStatusCount('pending')}
            active={filter === 'pending'}
            onClick={() => setFilter('pending')}
            color="yellow"
          />
          <StatusCard
            title="Dikonfirmasi"
            count={getStatusCount('confirmed')}
            active={filter === 'confirmed'}
            onClick={() => setFilter('confirmed')}
            color="green"
          />
          <StatusCard
            title="Selesai"
            count={getStatusCount('completed')}
            active={filter === 'completed'}
            onClick={() => setFilter('completed')}
            color="blue"
          />
        </div>

        {/* Buat Booking card di halaman booking */}
        <div className="bg-[#FFFDF9] border border-[#E1D4C0] rounded-2xl px-6 py-5 flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-[#3B2A1E] mb-1">Buat Booking</h2>
            <p className="text-sm text-[#A18F76]">Buat janji baru untuk treatment favorit Anda.</p>
          </div>
          <button
            onClick={() => router.push('/user/booking')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C89B4B] text-white text-xs font-medium hover:bg-[#b48735] transition-colors"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              <path d="M7 2v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm5 7h2v3h3v2h-3v3h-2v-3H9v-2h3V9z" />
            </svg>
            <span>Buat Booking</span>
          </button>
        </div>

        {/* Bookings List */}
        <div className="bg-[#FFFDF9] rounded-2xl shadow-sm border border-[#E1D4C0] overflow-hidden">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-[#FBF6EA] mb-4">
                <svg viewBox="0 0 24 24" className="h-7 w-7 text-[#C89B4B]" fill="currentColor">
                  <path d="M7 2v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm0 7h10v2H7V9zm0 4h6v2H7v-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#3B2A1E] mb-2">
                {filter === 'all'
                  ? 'Belum ada booking'
                  : `Tidak ada booking ${getStatusText(filter).toLowerCase()}`}
              </h3>
              <p className="text-sm text-[#A18F76] mb-6 max-w-md mx-auto">
                {filter === 'all'
                  ? 'Mulai buat booking pertama Anda untuk treatment favorit.'
                  : `Tidak ada booking dengan status ${getStatusText(filter).toLowerCase()}.`}
              </p>
              {filter === 'all' && (
                <button
                  onClick={() => router.push('/user/treatments')}
                  className="px-6 py-2.5 rounded-xl bg-[#6C3FD1] text-white text-xs font-medium hover:bg-[#5b34b3] transition-colors"
                >
                  Buat Booking Baru
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-[#F1E5D1]">
              {filteredBookings.map((booking) => (
                <BookingCard
                  key={booking._id}
                  booking={booking}
                  onViewDetail={() =>
                    router.push(`/user/dashboard/bookings/${booking._id}`)
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
