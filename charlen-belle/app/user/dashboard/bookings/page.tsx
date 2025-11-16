// app/user/dashboard/bookings/page.tsx
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
  const colorClasses = {
    gray: 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100',
    green: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100',
    blue: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
    red: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
  };

  const activeClasses = {
    gray: 'bg-gray-100 border-gray-300 ring-2 ring-gray-200',
    yellow: 'bg-yellow-100 border-yellow-300 ring-2 ring-yellow-200',
    green: 'bg-green-100 border-green-300 ring-2 ring-green-200',
    blue: 'bg-blue-100 border-blue-300 ring-2 ring-blue-200',
    red: 'bg-red-100 border-red-300 ring-2 ring-red-200'
  };

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border-2 transition-all text-left ${
        active ? activeClasses[color] : colorClasses[color]
      }`}
    >
      <div className="text-2xl font-bold mb-1">{count}</div>
      <div className="text-sm font-medium">{title}</div>
    </button>
  );
}


// Booking Card Component
function BookingCard({ booking, onViewDetail }: { booking: Booking; onViewDetail: () => void }) {
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

  const getActionButton = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <button
            onClick={onViewDetail}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            Bayar Sekarang
          </button>
        );
      case 'confirmed':
        return (
          <button
            onClick={onViewDetail}
            className="px-4 py-2 border border-purple-600 text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-50 transition-colors"
          >
            Lihat Detail
          </button>
        );
      default:
        return (
          <button
            onClick={onViewDetail}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Lihat Detail
          </button>
        );
    }
  };

  // Get treatment names for display
  const getTreatmentNames = () => {
    if (!booking.treatments || booking.treatments.length === 0) {
      return booking.type === 'consultation' ? 'Konsultasi' : 'Treatment';
    }
    
    const names = booking.treatments.map(t => t.treatment_id.name);
    if (names.length > 2) {
      return `${names.slice(0, 2).join(', ')} +${names.length - 2} lainnya`;
    }
    return names.join(', ');
  };
  

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
              {getStatusText(booking.status)}
            </span>
            <span className="text-sm text-gray-500">
              ID: {booking._id.slice(-8)}
            </span>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 mb-3">
            <div>
              <p className="text-sm text-gray-600">Tanggal & Waktu</p>
              <p className="font-medium">
                {formatDate(booking.slot_id.date)} • {booking.slot_id.start_time}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Treatment</p>
              <p className="font-medium">{getTreatmentNames()}</p>
              {booking.treatments && booking.treatments.length > 0 && (
                <p className="text-xs text-gray-500">
                  {booking.treatments.length} item • {booking.treatments.reduce((sum, t) => sum + t.quantity, 0)} total
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="font-medium text-purple-600">{formatCurrency(booking.total_amount)}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>Dibuat: {formatDate(booking.created_at)}</span>
            {booking.confirmed_by && (
              <span>Dikonfirmasi oleh: {booking.confirmed_by.name}</span>
            )}
            {booking.notes && (
              <span className="truncate max-w-xs">Catatan: {booking.notes}</span>
            )}
          </div>
        </div>

        <div className="ml-6">
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
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'canceled'>('all');

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

  const filteredBookings = bookings.filter(booking => 
    filter === 'all' || booking.status === filter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'canceled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const getStatusCount = (status: string) => {
    return bookings.filter(booking => booking.status === status).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600">Memuat data booking...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Saya</h1>
          <p className="text-gray-600">Kelola dan lihat riwayat booking treatment Anda</p>
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

        {/* Bookings List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {filter === 'all' ? 'Belum ada booking' : `Tidak ada booking ${getStatusText(filter).toLowerCase()}`}
              </h3>
              <p className="text-gray-600 mb-6">
                {filter === 'all' 
                  ? 'Mulai buat booking pertama Anda untuk treatment favorit'
                  : `Tidak ada booking dengan status ${getStatusText(filter).toLowerCase()}`
                }
              </p>
              {filter === 'all' && (
                <button
                  onClick={() => router.push('/user/treatments')}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Buat Booking Baru
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredBookings.map((booking) => (
                <BookingCard
                  key={booking._id}
                  booking={booking}
                  onViewDetail={() => router.push(`/user/dashboard/bookings/${booking._id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}