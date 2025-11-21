'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/buttons';
import { useEffect, useState, ReactNode } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    upcomingBookings: 0,
    completedTreatments: 0,
    totalSpent: 0,
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
      {/* Greeting */}
      <div className="bg-[#FFFDF9] border border-[#E1D4C0] rounded-2xl px-4 sm:px-6 py-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-[#A18F76] mb-1">
            Hi, {session?.user?.name || 'User'}!
          </p>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#3B2A1E]">
            Selamat Datang di Charlen Belle
          </h1>
          <p className="text-sm text-[#A18F76] mt-1">
            Kelola booking dan lihat riwayat treatment Anda di sini.
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
        <StatCard
          title="Booking Mendatang"
          value={stats.upcomingBookings}
          icon={<CalendarIcon />}
        />
        <StatCard
          title="Treatment Selesai"
          value={stats.completedTreatments}
          icon={<CheckIcon />}
        />
        <StatCard
          title="Total Pengeluaran"
          value={`Rp ${stats.totalSpent.toLocaleString('id-ID')}`}
          icon={<MoneyIcon />}
        />
      </div>

      {/* Buat Booking card */}
      <div className="bg-[#FFFDF9] border border-[#E1D4C0] rounded-2xl px-4 sm:px-6 py-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#3B2A1E] mb-1">
            Buat Booking
          </h2>
          <p className="text-sm text-[#A18F76]">
            Atur jadwal treatment Anda dengan mudah.
          </p>
        </div>
        <div className="sm:flex-shrink-0">
          <Link href="/user/treatments">
            <Button className="w-full sm:w-auto rounded-xl bg-[#C89B4B] hover:bg-[#b48735] border-none text-white flex items-center justify-center gap-2">
              <CalendarIconSmall />
              <span>Buat Booking</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Booking Mendatang Preview */}
      <div className="bg-[#FBF6EA] rounded-2xl px-4 sm:px-6 py-6 border border-[#E1D4C0]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#3B2A1E]">
            Booking Terbaru
          </h2>
          <Link
            href="/user/dashboard/bookings"
            className="text-xs font-medium text-[#8B5E34] underline underline-offset-2 self-start sm:self-auto"
          >
            Lihat Semua
          </Link>
        </div>
        {/* TODO: list booking nanti kalau API ada */}
        <p className="text-sm text-[#A18F76] text-center py-6">
          Belum ada booking terbaru.
        </p>
      </div>

      {/* Promo Banner */}
      <div className="bg-[#C89B4B] rounded-2xl p-6 sm:p-7 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold mb-1">
            Promo Spesial Bulan Ini!
          </h3>
          <p className="text-sm opacity-90">
            Dapatkan diskon hingga 30% untuk treatment pilihan.
          </p>
        </div>
        <div className="md:flex-shrink-0">
          <Button
            variant="secondary"
            className="w-full sm:w-auto rounded-full bg-white text-[#8B5E34] hover:bg-[#F6EEE0] border-none text-sm px-5 py-2"
          >
            Lihat Promo
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: ReactNode;
}) {
  return (
    <div className="bg-[#FFFDF9] border border-[#E1D4C0] rounded-2xl px-4 sm:px-5 py-4 flex items-center justify-between gap-3">
      <div>
        <p className="text-xs text-[#A18F76] mb-1">{title}</p>
        <p className="text-xl sm:text-2xl font-semibold text-[#3B2A1E]">
          {value}
        </p>
      </div>
      <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-[#E6D8C2] flex items-center justify-center">
        {icon}
      </div>
    </div>
  );
}

/* --- Simple solid icons (SVG) --- */

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#3B2A1E]" fill="currentColor">
      <path d="M7 2v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm12 7H5v10h14V9z" />
    </svg>
  );
}

function CalendarIconSmall() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M7 2v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm12 7H5v10h14V9z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#3B2A1E]" fill="currentColor">
      <path d="M9 16.17 4.83 12 3.41 13.41 9 19l12-12-1.41-1.41z" />
    </svg>
  );
}

function MoneyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#3B2A1E]" fill="currentColor">
      <path d="M12 3C8.13 3 5 5.24 5 8c0 1.93 1.4 3.58 3.5 4.37V13c0 .55.45 1 1 1h1v3h2v-3h1c.55 0 1-.45 1-1v-1.12C17.6 11.58 19 9.93 19 8c0-2.76-3.13-5-7-5zm0 2c2.76 0 5 .9 5 3s-2.24 3-5 3-5-.9-5-3 2.24-3 5-3z" />
    </svg>
  );
}
