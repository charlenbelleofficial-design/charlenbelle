'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '../components/ui/buttons';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    upcomingBookings: 0,
    completedTreatments: 0,
    totalSpent: 0
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Selamat Datang, {session?.user?.name}! 👋
        </h1>
        <p className="text-gray-600">
          Kelola booking dan lihat riwayat treatment Anda di sini
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <StatCard
          title="Booking Mendatang"
          value={stats.upcomingBookings}
          icon="📅"
          color="purple"
        />
        <StatCard
          title="Treatment Selesai"
          value={stats.completedTreatments}
          icon="✅"
          color="green"
        />
        <StatCard
          title="Total Pengeluaran"
          value={`Rp ${stats.totalSpent.toLocaleString('id-ID')}`}
          icon="💰"
          color="pink"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Aksi Cepat</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Link href="/booking">
            <Button className="w-full" size="lg">
              📅 Buat Booking Baru
            </Button>
          </Link>
          <Link href="/treatments">
            <Button variant="outline" className="w-full" size="lg">
              ✨ Lihat Semua Treatment
            </Button>
          </Link>
          <Link href="/dashboard/history">
            <Button variant="outline" className="w-full" size="lg">
              📋 Lihat Riwayat
            </Button>
          </Link>
        </div>
      </div>

      {/* Upcoming Bookings Preview */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Booking Mendatang</h2>
          <Link href="/dashboard/bookings" className="text-purple-600 text-sm font-medium hover:underline">
            Lihat Semua →
          </Link>
        </div>
        {/* Add upcoming bookings list component here */}
        <p className="text-gray-500 text-center py-8">
          Belum ada booking mendatang
        </p>
      </div>

      {/* Promo Banner */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-8 text-white">
        <h3 className="text-2xl font-bold mb-2">Promo Spesial Bulan Ini! 🎉</h3>
        <p className="mb-4">Dapatkan diskon hingga 30% untuk treatment pilihan</p>
        <Button variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100">
          Lihat Promo
        </Button>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) {
  const colorClasses = {
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    pink: 'from-pink-500 to-pink-600'
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
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