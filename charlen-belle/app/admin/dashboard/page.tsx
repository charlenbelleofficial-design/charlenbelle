// app/admin/dashboard/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, ReactNode } from 'react';
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
    walkinTransactions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  // === FETCH TETAP SAMA, HANYA STYLE YANG DIUBAH ===
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

  // ICON SVG SOLID (warna mengikuti parent: currentColor)
  const CalendarIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 2h2v3h6V2h2v3h3v17H4V5h3V2zm12 7H5v11h14V9z" />
    </svg>
  );

  const StatusIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2zm1 11h-2V7h2zm0 4h-2v-2h2z" />
    </svg>
  );

  const TodayIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 5h16v2H4zm0 4h10v2H4zm0 4h16v2H4zm0 4h10v2H4z" />
    </svg>
  );

  const RevenueIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 4h14v2H5zm0 4h14v12H5zm7 2a3 3 0 0 0-3 3h2a1 1 0 0 1 2 0c0 .552-.448 1-1 1h-1v2h1a1 1 0 0 1 0 2 1 1 0 0 1-1-1h-2a3 3 0 0 0 3 3v1h2v-1a3 3 0 0 0 0-6 1 1 0 0 1 0-2 3 3 0 0 0 3-3h-2a1 1 0 0 1-2 0 3 3 0 0 0-3-3z" />
    </svg>
  );

  const BookingIcon = CalendarIcon;
  const TransactionIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 5h18v14H3V5zm2 2v2h14V7H5zm0 4v6h14v-6H5zm2 2h4v2H7v-2z" />
    </svg>
  );
  const TreatmentIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2S7 8 7 12a5 5 0 0 0 10 0c0-4-5-10-5-10zm0 6.5c1.38 0 2.5 1.34 2.5 3s-1.12 3-2.5 3-2.5-1.34-2.5-3 1.12-3 2.5-3z" />
    </svg>
  );
  const UsersIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.5-1A3.5 3.5 0 1 0 15.5 3 3.5 3.5 0 0 0 15.5 10zM9 13c-3.33 0-6 2.24-6 5v2h12v-2c0-2.76-2.67-5-6-5zm6.5 1c-.52 0-1.02.06-1.5.17 1.23.94 2 2.29 2 3.83v2H21v-2c0-2.47-2.24-4-5.5-4z" />
    </svg>
  );

  const StatCard = ({
    title,
    value,
    icon,
    href,
  }: {
    title: string;
    value: ReactNode;
    icon: ReactNode;
    href?: string;
  }) => (
    <Link href={href || '#'} className="block">
      <div className="bg-[#F7EEDB] rounded-2xl p-5 shadow-sm border border-[#E5D7BE] hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-wide text-[#8B816D] uppercase">
              {title}
            </p>
            <p className="text-2xl font-semibold text-[#3A3530] mt-3">
              {loading ? '...' : value}
            </p>
          </div>
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#B89038] text-white">
            {icon}
          </div>
        </div>
      </div>
    </Link>
  );

  const QuickAction = ({
    title,
    description,
    icon,
    href,
  }: {
    title: string;
    description: string;
    icon: ReactNode;
    href: string;
  }) => (
    <Link href={href} className="block">
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5D7BE] hover:shadow-md transition-shadow">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[#B89038] text-white flex items-center justify-center">
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-[#3A3530] mb-1">{title}</h3>
            <p className="text-sm text-[#8B816D]">{description}</p>
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-[#3A3530]">
          Hi, {session?.user?.name || 'User'}!
        </h1>
        <p className="text-sm text-[#8B816D] mt-2">
          Ringkasan aktivitas klinik Charlene Belle hari ini.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Booking"
          value={stats.totalBookings}
          icon={<CalendarIcon />}
          href="/admin/bookings"
        />
        <StatCard
          title="Status Konfirmasi"
          value={stats.pendingBookings}
          icon={<StatusIcon />}
          href="/admin/bookings?status=pending"
        />
        <StatCard
          title="Booking Hari Ini"
          value={stats.todayBookings}
          icon={<TodayIcon />}
          href="/admin/bookings?date=today"
        />
        <StatCard
          title="Total Pendapatan"
          value={`Rp ${stats.totalRevenue.toLocaleString('id-ID')}`}
          icon={<RevenueIcon />}
          href="/admin/transactions"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickAction
          title="Kelola Booking"
          description="Lihat dan kelola semua booking"
          icon={<BookingIcon />}
          href="/admin/bookings"
        />
        <QuickAction
          title="Kelola Transaksi"
          description="Lihat dan proses pembayaran"
          icon={<TransactionIcon />}
          href="/admin/transactions"
        />
        {(session?.user?.role === 'admin' ||
          session?.user?.role === 'superadmin') && (
          <QuickAction
            title="Kelola Treatment"
            description="Tambah dan edit treatment"
            icon={<TreatmentIcon />}
            href="/admin/treatments"
          />
        )}
        {session?.user?.role === 'superadmin' && (
          <QuickAction
            title="Kelola User"
            description="Kelola staff dan admin"
            icon={<UsersIcon />}
            href="/admin/users"
          />
        )}
      </div>

      {/* Two-column section: booking terbaru + ringkasan hari ini */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Terbaru */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5D7BE]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[#3A3530]">
              Booking Terbaru
            </h2>
            <Link
              href="/admin/bookings"
              className="text-xs font-medium text-[#B89038] hover:underline"
            >
              Lihat semua
            </Link>
          </div>
          <RecentBookingsList />
        </div>

        {/* Ringkasan Hari Ini */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5D7BE]">
          <h2 className="text-xl font-semibold text-[#3A3530] mb-4">
            Ringkasan Hari Ini
          </h2>
          <div className="space-y-3">
            <SummaryRow label="Transaksi Sukses" value="12" valueColor="text-[#2F7C38]" />
            <SummaryRow label="Pelanggan Baru" value="8" valueColor="text-[#1D4ED8]" />
            <SummaryRow label="Treatment Populer" value="Facial" valueColor="text-[#B89038]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-dashed border-[#E5D7BE] last:border-b-0">
      <span className="text-sm text-[#8B816D]">{label}</span>
      <span className={`text-sm font-semibold ${valueColor || 'text-[#3A3530]'}`}>
        {value}
      </span>
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

  // FETCH TIDAK DIUBAH
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
    return (
      <div className="text-center py-4 text-sm text-[#8B816D]">
        Memuat...
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-[#8B816D]">
        Tidak ada booking terbaru
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking) => (
        <div
          key={booking._id}
          className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#F7EEDB] border border-[#E5D7BE]"
        >
          <div>
            <p className="text-sm font-semibold text-[#3A3530]">
              {booking.user_id?.name}
            </p>
            <p className="text-xs text-[#8B816D]">
              {booking.treatments?.[0]?.treatment_id?.name || 'Treatment'}
            </p>
          </div>
          <div className="text-right">
            <span
              className={`inline-flex px-3 py-1 rounded-full text-[11px] font-medium
                ${
                  booking.status === 'confirmed'
                    ? 'bg-[#D9F7D3] text-[#2F7C38]'
                    : booking.status === 'pending'
                    ? 'bg-[#FFF3C4] text-[#9C782C]'
                    : 'bg-[#F2F2F2] text-[#4B5563]'
                }`}
            >
              {booking.status === 'confirmed'
                ? 'Dikonfirmasi'
                : booking.status === 'pending'
                ? 'Menunggu'
                : booking.status}
            </span>
            <p className="text-xs text-[#8B816D] mt-1">
              {booking.slot_id?.date
                ? new Date(booking.slot_id.date).toLocaleDateString('id-ID')
                : '-'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
