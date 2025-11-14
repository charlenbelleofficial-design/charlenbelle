'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '../../components/ui/buttons';
import { Input } from '../../components/ui/input';
import toast from 'react-hot-toast';

export default function AdminBookingsPage() {
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const fetchBookings = async () => {
    try {
      const url = statusFilter === 'all' 
        ? '/api/admin/bookings'
        : `/api/admin/bookings?status=${statusFilter}`;
      
      const response = await fetch(url);
      const data = await response.json();
      setBookings(data.bookings);
    } catch (error) {
      toast.error('Gagal memuat data booking');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmBooking = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/confirm`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Gagal mengkonfirmasi booking');
      }

      toast.success('Booking berhasil dikonfirmasi');
      fetchBookings();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleCompleteBooking = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/complete`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Gagal menyelesaikan booking');
      }

      toast.success('Booking diselesaikan');
      fetchBookings();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredBookings = bookings.filter((booking: any) => {
    if (!searchQuery) return true;
    return (
      booking.user_id?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.user_id?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex-1 w-full md:max-w-md">
          <Input
            type="text"
            placeholder="Cari customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'confirmed', 'completed', 'canceled'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {status === 'all' ? 'Semua' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipe</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Waktu</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      Tidak ada booking
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking: any) => (
                    <tr key={booking._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-mono text-gray-500">
                        #{booking._id.slice(-6)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {booking.user_id?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.user_id?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {booking.type === 'consultation' ? 'Konsultasi' : 'Treatment'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(booking.slot_id?.date).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {booking.slot_id?.start_time} - {booking.slot_id?.end_time}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={booking.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {booking.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleConfirmBooking(booking._id)}
                            >
                              Konfirmasi
                            </Button>
                          )}
                          {booking.status === 'confirmed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCompleteBooking(booking._id)}
                            >
                              Selesai
                            </Button>
                          )}
                          <a href={`/admin/bookings/${booking._id}`}>
                            <Button size="sm" variant="ghost">
                              Detail
                            </Button>
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    canceled: 'bg-red-100 text-red-800'
  };

  const labels = {
    pending: 'Menunggu',
    confirmed: 'Dikonfirmasi',
    completed: 'Selesai',
    canceled: 'Dibatalkan'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles]}`}>
      {labels[status as keyof typeof labels]}
    </span>
  );
}