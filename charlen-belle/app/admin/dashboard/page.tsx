// app/admin/dashboard/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DashboardStats {
  totalBookings: number;
  pendingBookings: number;
  todayBookings: number;
  totalRevenue: number;
  walkinTransactions: number;
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    pendingBookings: 0,
    todayBookings: 0,
    totalRevenue: 0,
    walkinTransactions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, href }: any) => (
    <Link href={href || '#'} className="block">
      <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow ${href ? 'cursor-pointer' : ''}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {loading ? '...' : value}
            </p>
          </div>
          <div className={`text-2xl ${color}`}>
            {icon}
          </div>
        </div>
      </div>
    </Link>
  );

  const QuickAction = ({ title, description, icon, href, color }: any) => (
    <Link href={href} className="block">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center text-white text-xl mb-4`}>
          {icon}
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </Link>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Selamat Datang, {session?.user?.name}!
        </h1>
        <p className="text-gray-600 mt-2">
          Dashboard Management Klinik Charlene Belle
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Booking"
          value={stats.totalBookings}
          icon="📅"
          color="text-blue-600"
          href="/admin/bookings"
        />
        <StatCard
          title="Pending Konfirmasi"
          value={stats.pendingBookings}
          icon="⏳"
          color="text-yellow-600"
          href="/admin/bookings?status=pending"
        />
        <StatCard
          title="Booking Hari Ini"
          value={stats.todayBookings}
          icon="📋"
          color="text-green-600"
          href="/admin/bookings?date=today"
        />
        <StatCard
          title="Total Pendapatan"
          value={`Rp ${stats.totalRevenue.toLocaleString('id-ID')}`}
          icon="💰"
          color="text-purple-600"
          href="/admin/transactions"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <QuickAction
          title="Kelola Booking"
          description="Lihat dan kelola semua booking"
          icon="📅"
          href="/admin/bookings"
          color="bg-blue-500"
        />
        <QuickAction
          title="Transaksi Walk-in"
          description="Input transaksi pelanggan langsung"
          icon="💳"
          href="/admin/walkin"
          color="bg-green-500"
        />
        {(session?.user?.role === 'admin' || session?.user?.role === 'superadmin') && (
          <QuickAction
            title="Kelola Treatment"
            description="Tambah dan edit treatment"
            icon="💆"
            href="/admin/treatments"
            color="bg-purple-500"
          />
        )}
        {session?.user?.role === 'superadmin' && (
          <QuickAction
            title="Kelola User"
            description="Kelola staff dan admin"
            icon="👥"
            href="/admin/users"
            color="bg-orange-500"
          />
        )}
      </div>

      {/* Role-based sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Bookings */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Booking Terbaru</h2>
            <Link href="/admin/bookings" className="text-sm text-purple-600 hover:text-purple-700">
              Lihat semua
            </Link>
          </div>
          <RecentBookingsList />
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Ringkasan Hari Ini</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Transaksi Sukses</span>
              <span className="font-semibold text-green-600">12</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pelanggan Baru</span>
              <span className="font-semibold text-blue-600">8</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Treatment Populer</span>
              <span className="font-semibold text-purple-600">Facial</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Recent Bookings Component
function RecentBookingsList() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentBookings();
  }, []);

  const fetchRecentBookings = async () => {
    try {
      const response = await fetch('/api/admin/bookings?limit=5');
      const data = await response.json();
      
      if (data.success) {
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error('Error fetching recent bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Memuat...</div>;
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking) => (
        <div key={booking._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">{booking.user_id?.name}</p>
            <p className="text-sm text-gray-600">{booking.treatments?.[0]?.treatment_id?.name || 'Treatment'}</p>
          </div>
          <div className="text-right">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {booking.status === 'confirmed' ? 'Dikonfirmasi' : 
               booking.status === 'pending' ? 'Menunggu' : booking.status}
            </span>
            <p className="text-sm text-gray-600 mt-1">
              {new Date(booking.slot_id?.date).toLocaleDateString('id-ID')}
            </p>
          </div>
        </div>
      ))}
      {bookings.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          Tidak ada booking terbaru
        </div>
      )}
    </div>
  );
}