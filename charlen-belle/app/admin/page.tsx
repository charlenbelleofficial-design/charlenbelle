'use client';

import { useEffect, useState } from 'react';
import { formatCurrency } from "../lib/utils";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    todayBookings: 0,
    pendingBookings: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
    totalCustomers: 0,
    activePromos: 0
  });

  const [recentBookings, setRecentBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard');
      const data = await response.json();
      setStats(data.stats);
      setRecentBookings(data.recentBookings);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title="Booking Hari Ini"
          value={stats.todayBookings}
          icon="📅"
          color="blue"
        />
        <StatsCard
          title="Menunggu Konfirmasi"
          value={stats.pendingBookings}
          icon="⏰"
          color="yellow"
        />
        <StatsCard
          title="Revenue Hari Ini"
          value={formatCurrency(stats.todayRevenue)}
          icon="💰"
          color="green"
        />
        <StatsCard
          title="Revenue Bulan Ini"
          value={formatCurrency(stats.monthlyRevenue)}
          icon="📊"
          color="purple"
        />
        <StatsCard
          title="Total Customer"
          value={stats.totalCustomers}
          icon="👥"
          color="pink"
        />
        <StatsCard
          title="Promo Aktif"
          value={stats.activePromos}
          icon="🎁"
          color="red"
        />
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Booking Terbaru</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Treatment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentBookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Belum ada booking
                  </td>
                </tr>
              ) : (
                recentBookings.map((booking: any) => (
                  <tr key={booking._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.user_id?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.user_id?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.type === 'consultation' ? 'Konsultasi' : 'Treatment'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(booking.slot_id?.date).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={booking.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      
                        href={`/admin/bookings/${booking._id}`}
                        className="text-purple-600 hover:text-purple-900 font-medium"
                      >
                        Detail →
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <QuickActionCard
          title="Konfirmasi Booking"
          description="Ada booking yang menunggu konfirmasi"
          count={stats.pendingBookings}
          href="/admin/bookings?status=pending"
          icon="✅"
          color="yellow"
        />
        <QuickActionCard
          title="Tambah Treatment"
          description="Kelola treatment dan layanan"
          count={0}
          href="/admin/treatments"
          icon="✨"
          color="purple"
        />
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    yellow: 'from-yellow-500 to-yellow-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    pink: 'from-pink-500 to-pink-600',
    red: 'from-red-500 to-red-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`text-3xl p-3 rounded-xl bg-gradient-to-r ${colorClasses[color as keyof typeof colorClasses]} bg-opacity-10`}>
          {icon}
        </div>
      </div>
      <p className="text-gray-600 text-sm mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
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

function QuickActionCard({ title, description, count, href, icon, color }: any) {
  return (
    <a href={href} className="block bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{icon}</span>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">{description}</p>
          {count > 0 && (
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
              color === 'yellow' ? 'bg-yellow-100 text-yellow-800' : 'bg-purple-100 text-purple-800'
            }`}>
              {count} pending
            </span>
          )}
        </div>
        <span className="text-gray-400">→</span>
      </div>
    </a>
  );
}