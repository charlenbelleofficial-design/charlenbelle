// app/components/layouts/unified-layout.tsx
'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, ReactNode } from 'react';

interface UnifiedLayoutProps {
  children: React.ReactNode;
  requiredRole?: string[];
}

type StaffRole = 'kasir' | 'doctor' | 'admin' | 'superadmin';

type StaffNavItem = {
  name: string;
  href: string;
  icon: 'dashboard' | 'booking' | 'transactions' | 'treatments' | 'categories' | 'promo' | 'reports' | 'users' | 'schedule';
  roles: StaffRole[];
};

// === ICONS: solid svg, warna ikut parent (currentColor) ===
function NavIcon({ type }: { type: StaffNavItem['icon'] }) {
  const base = 'w-5 h-5';

  switch (type) {
    case 'dashboard':
      // home
      return (
        <svg className={base} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3 3 10h2v10h6v-6h2v6h6V10h2L12 3z" />
        </svg>
      );
    case 'booking':
      // calendar
      return (
        <svg className={base} viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 2h2v3h6V2h2v3h3v17H4V5h3V2zm12 7H5v11h14V9z" />
        </svg>
      );
    case 'transactions':
      // credit card
      return (
        <svg className={base} viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 5h18v14H3V5zm2 2v2h14V7H5zm0 4v6h14v-6H5zm2 2h4v2H7v-2z" />
        </svg>
      );
    case 'treatments':
      // spa / droplet
      return (
        <svg className={base} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2S7 8 7 12a5 5 0 0 0 10 0c0-4-5-10-5-10zm0 6.5c1.38 0 2.5 1.34 2.5 3s-1.12 3-2.5 3-2.5-1.34-2.5-3 1.12-3 2.5-3z" />
        </svg>
      );
    case 'categories':
      // folder
      return (
        <svg className={base} viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 4 8.5 6H4v14h16V4H10z" />
        </svg>
      );
    case 'promo':
      // gift
      return (
        <svg className={base} viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 7h-2.18A3 3 0 0 0 15 3a2.99 2.99 0 0 0-3 3 2.99 2.99 0 0 0-3-3 3 3 0 0 0-2.82 4H4v4h1v9h6v-9h2v9h6v-9h1V7zm-5-2a1 1 0 0 1 0 2h-2a1 1 0 0 1 0-2h2zM9 5a1 1 0 0 1 0 2H7a1 1 0 0 1 0-2h2zm2 5H6V9h5v1zm2 0V9h5v1h-5z" />
        </svg>
      );
    case 'reports':
      // bar chart
      return (
        <svg className={base} viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 19h16v2H4v-2zm2-8h3v7H6v-7zm5-4h3v11h-3V7zm5 3h3v8h-3v-8z" />
        </svg>
      );
    case 'users':
      // users
      return (
        <svg className={base} viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.5-1A3.5 3.5 0 1 0 15.5 3 3.5 3.5 0 0 0 15.5 10zM9 13c-3.33 0-6 2.24-6 5v2h12v-2c0-2.76-2.67-5-6-5zm6.5 1c-.52 0-1.02.06-1.5.17 1.23.94 2 2.29 2 3.83v2H21v-2c0-2.47-2.24-4-5.5-4z" />
        </svg>
      );
    case 'schedule':
      // clock/calendar combo
      return (
        <svg className={base} viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 2h2v3h6V2h2v3h3v17H4V5h3V2zm12 9H5v9h14v-9zM13 9v4.41l2.29 2.3-1.42 1.41L11 14V9h2z" />
        </svg>
      );
    default:
      return null;
  }
}

// === NAVIGATION CONFIG ===
const staffNavigation: StaffNavItem[] = [
  // semua role staff
  { name: 'Dashboard', href: '/admin/dashboard', icon: 'dashboard', roles: ['kasir', 'doctor', 'admin', 'superadmin'] },
  { name: 'Booking', href: '/admin/bookings', icon: 'booking', roles: ['kasir', 'doctor', 'admin', 'superadmin'] },

  // kasir + admin + superadmin
  { name: 'Transaksi', href: '/admin/transactions', icon: 'transactions', roles: ['kasir', 'admin', 'superadmin'] },

  // hanya admin + superadmin
  { name: 'Treatment', href: '/admin/treatments', icon: 'treatments', roles: ['admin', 'superadmin'] },
  { name: 'Kategori Treatment', href: '/admin/treatment-categories', icon: 'categories', roles: ['admin', 'superadmin'] },
  { name: 'Promo', href: '/admin/promos', icon: 'promo', roles: ['admin', 'superadmin'] },
  { name: 'Laporan', href: '/admin/reports', icon: 'reports', roles: ['admin', 'superadmin'] },
  { name: 'Jadwal Booking', href: '/admin/schedule', icon: 'schedule', roles: ['admin', 'superadmin'] },

  // khusus superadmin saja (opsional, bisa kamu hapus kalau mau persis list 1–8)
  { name: 'Users', href: '/admin/users', icon: 'users', roles: ['superadmin'] },
];

export default function UnifiedLayout({
  children,
  requiredRole = ['kasir', 'doctor', 'admin', 'superadmin'],
}: UnifiedLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push(
        '/user/login?redirect=' + encodeURIComponent(window.location.pathname),
      );
      return;
    }

    const userRole = session.user?.role as StaffRole | undefined;
    if (!userRole || !requiredRole.includes(userRole)) {
      router.push('/user/dashboard');
      return;
    }
  }, [session, status, router, requiredRole]);

  const isStaff =
    session?.user?.role &&
    ['kasir', 'doctor', 'admin', 'superadmin'].includes(session.user.role);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F4E8]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B89038]" />
      </div>
    );
  }

  if (!session || !isStaff) {
    return null;
  }

  const userRole = session.user.role as StaffRole;
  const navigation = staffNavigation.filter((item) =>
    item.roles.includes(userRole),
  );
  const currentPage =
    navigation.find((item) => pathname?.startsWith(item.href)) || navigation[0];

  return (
    <div className="min-h-screen bg-[#F8F4E8] flex">
      {/* Backdrop mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-[#E5D7BE] transform transition-transform duration-300 z-50
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo + role */}
          <div className="px-6 py-6 border-b border-[#E5D7BE] flex flex-col gap-3">
            <Link
              href="/admin/dashboard"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3"
            >
              {/* GANTI src di bawah dengan path logo kamu, misalnya /images/logo-charlen-belle.png */}
              <div className="w-12 h-12 rounded-full overflow-hidden bg-[#D8C9A5] flex items-center justify-center">
                <img
                  src="/images/logo-charlen-belle.png"
                  alt="Charlene Belle Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <p className="text-lg font-semibold text-[#3A3530] leading-tight">
                  Sharlene Belle
                </p>
                <p className="text-xs text-[#8B816D] capitalize">
                  {session.user?.role} panel
                </p>
              </div>
            </Link>
          </div>

          {/* Menu */}
          <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname?.startsWith(item.href + '/');

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-r-full text-sm font-medium transition-colors
                    ${
                      isActive
                        ? 'bg-[#F2E5C9] text-[#3A3530] border-l-4 border-[#B89038]'
                        : 'text-[#3A3530] hover:bg-[#F7EEDB]'
                    }`}
                >
                  <div
                    className={`flex items-center justify-center w-9 h-9 rounded-full 
                    ${isActive ? 'bg-[#B89038] text-white' : 'bg-[#F2E5C9] text-[#3A3530]'}`}
                  >
                    <NavIcon type={item.icon} />
                  </div>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User + website */}
          <div className="px-4 py-4 border-t border-[#E5D7BE]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#B89038] flex items-center justify-center text-white font-semibold">
                {session.user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#3A3530] truncate">
                  {session.user?.name}
                </p>
                <p className="text-xs text-[#8B816D] truncate">
                  {session.user?.email}
                </p>
              </div>
            </div>
            <Link
              href="/"
              target="_blank"
              className="block w-full text-center text-xs font-medium py-2 rounded-full bg-[#3F3A34] text-white hover:bg-black transition-colors"
            >
              Lihat Website
            </Link>
          </div>
        </div>
      </aside>

      {/* CONTENT */}
      <div className="flex-1 lg:ml-64 w-full flex flex-col">
        {/* TOP NAVBAR */}
        <header className="bg-white border-b border-[#E5D7BE] sticky top-0 z-30">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-full border border-[#E5D7BE] text-[#3A3530] hover:bg-[#F7EEDB]"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-[#3A3530]">
                {currentPage?.name || 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <span className="hidden md:inline text-sm text-[#8B816D]">
                Kontak kasir
              </span>
              <div className="hidden lg:flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#B89038] flex items-center justify-center text-white text-sm font-semibold">
                  {session.user?.name?.[0]?.toUpperCase()}
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="px-4 py-2 rounded-full text-sm font-medium bg-[#B89038] text-white hover:bg-[#9C782C] transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
