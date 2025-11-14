'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '../../components/ui/buttons';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

interface Booking {
  _id: string;
  type: string;
  status: string;
  slot_id: {
    date: string;
    start_time: string;
    end_time: string;
  };
  created_at: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const fetchBookings = async () => {
    try {
      const response = await fetch(`/api/bookings?filter=${filter}`);
      const data = await response.json();
      setBookings(data.bookings);
    } catch (error) {
      toast.error('Gagal memuat data booking');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan booking ini?')) {
      return;
    }

    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Gagal membatalkan booking');
      }

      toast.success('Booking berhasil dibatalkan');
      fetchBookings();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Booking Saya</h1>
        <Link href="/booking">
          <Button>+ Buat Booking Baru</Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-sm p-2 inline-flex gap-2">
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'upcoming'
              ? 'bg-purple-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Mendatang
        </button>
        <button
          onClick={() => setFilter('past')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'past'
              ? 'bg-purple-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Selesai
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-purple-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Semua
        </button>
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <p className="text-gray-500 mb-4">Tidak ada booking</p>
          <Link href="/booking">
            <Button>Buat Booking Sekarang</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking._id}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                      {getStatusLabel(booking.status)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {booking.type === 'consultation' ? 'Konsultasi' : 'Treatment'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-gray-900">
                      📅 {formatDate(booking.slot_id.date)}
                    </p>
                    <p className="text-gray-600">
                      🕐 {booking.slot_id.start_time} - {booking.slot_id.end_time}
                    </p>
                    <p className="text-sm text-gray-500">
                      Dibuat: {formatDate(booking.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Link href={`/dashboard/bookings/${booking._id}`}>
                    <Button variant="outline" size="sm">
                      Detail
                    </Button>
                  </Link>
                  {booking.status === 'pending' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancelBooking(booking._id)}
                    >
                      Batalkan
                    </Button>
                  )}
                  {booking.status === 'completed' && (
                    <Link href={`/dashboard/bookings/${booking._id}/payment`}>
                      <Button size="sm">
                        Bayar
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getStatusColor(status: string) {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    canceled: 'bg-red-100 text-red-800'
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
}

function getStatusLabel(status: string) {
  const labels = {
    pending: 'Menunggu Konfirmasi',
    confirmed: 'Dikonfirmasi',
    completed: 'Selesai',
    canceled: 'Dibatalkan'
  };
  return labels[status as keyof typeof labels] || status;
}