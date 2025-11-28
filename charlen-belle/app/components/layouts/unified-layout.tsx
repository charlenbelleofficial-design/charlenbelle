// app/components/layouts/unified-layout.tsx
'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';

interface UnifiedLayoutProps {
  children: React.ReactNode;
  requiredRole?: string[];
}

type StaffRole = 'kasir' | 'doctor' | 'admin' | 'superadmin';

type StaffNavItem = {
  name: string;
  href: string;
  icon:
    | 'dashboard'
    | 'booking'
    | 'transactions'
    | 'treatments'
    | 'categories'
    | 'promo'
    | 'reports'
    | 'users'
    | 'schedule';
  roles: StaffRole[];
};

function NavIcon({ type }: { type: StaffNavItem['icon'] }) {
  const base = 'w-4 h-4';

  switch (type) {
    case 'dashboard':
      return (
        <svg className={base} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3 3 10h2v10h6v-6h2v6h6V10h2L12 3z" />
        </svg>
      );
    case 'booking':
      return (
        <svg className={base} viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 2h2v3h6V2h2v3h3v17H4V5h3V2zm12 7H5v11h14V9z" />
        </svg>
      );
    case 'transactions':
      return (
        <svg className={base} viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 5h18v14H3V5zm2 2v2h14V7H5zm0 4v6h14v-6H5zm2 2h4v2H7v-2z" />
        </svg>
      );
    case 'treatments':
      return (
        <svg className={base} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2S7 8 7 12a5 5 0 0 0 10 0c0-4-5-10-5-10zm0 6.5c1.38 0 2.5 1.34 2.5 3s-1.12 3-2.5 3-2.5-1.34-2.5-3 1.12-3 2.5-3z" />
        </svg>
      );
    case 'categories':
      return (
        <svg className={base} viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 4 8.5 6H4v14h16V4H10z" />
        </svg>
      );
    case 'promo':
      return (
        <svg className={base} viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 7h-2.18A3 3 0 0 0 15 3a2.99 2.99 0 0 0-3 3 2.99 2.99 0 0 0-3-3 3 3 0 0 0-2.82 4H4v4h1v9h6v-9h2v9h6v-9h1V7zm-5-2a1 1 0 0 1 0 2h-2a1 1 0 0 1 0-2h2zM9 5a1 1 0 0 1 0 2H7a1 1 0 0 1 0-2h2zm2 5H6V9h5v1zm2 0V9h5v1h-5z" />
        </svg>
      );
    case 'reports':
      return (
        <svg className={base} viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 19h16v2H4v-2zm2-8h3v7H6v-7zm5-4h3v11h-3V7zm5 3h3v8h-3v-8z" />
        </svg>
      );
    case 'users':
      return (
        <svg className={base} viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.5-1A3.5 3.5 0 1 0 15.5 3 3.5 3.5 0 0 0 15.5 10zM9 13c-3.33 0-6 2.24-6 5v2h12v-2c0-2.76-2.67-5-6-5zm6.5 1c-.52 0-1.02.06-1.5.17 1.23.94 2 2.29 2 3.83v2H21v-2c0-2.47-2.24-4-5.5-4z" />
        </svg>
      );
    case 'schedule':
      return (
        <svg className={base} viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 2h2v3h6V2h2v3h3v17H4V5h3V2zm12 9H5v9h14v-9zM13 9v4.41l2.29 2.3-1.42 1.41L11 14V9h2z" />
        </svg>
      );
    default:
      return null;
  }
}

const staffNavigation: StaffNavItem[] = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: 'dashboard', roles: ['kasir', 'doctor', 'admin', 'superadmin'] },
  { name: 'Booking', href: '/admin/bookings', icon: 'booking', roles: ['kasir', 'doctor', 'admin', 'superadmin'] },
  { name: 'Transaksi', href: '/admin/transactions', icon: 'transactions', roles: ['kasir', 'admin', 'superadmin'] },
  { name: 'Treatment', href: '/admin/treatments', icon: 'treatments', roles: ['admin', 'superadmin'] },
  { name: 'Kategori Treatment', href: '/admin/treatment-categories', icon: 'categories', roles: ['admin', 'superadmin'] },
  { name: 'Promo', href: '/admin/promos', icon: 'promo', roles: ['admin', 'superadmin'] },
  { name: 'Laporan', href: '/admin/reports', icon: 'reports', roles: ['admin', 'superadmin'] },
  { name: 'Jadwal Booking', href: '/admin/schedule', icon: 'schedule', roles: ['admin', 'superadmin'] },
  { name: 'Users', href: '/admin/users', icon: 'users', roles: ['superadmin'] },
];

function getProfilePath(role?: string | null) {
  if (!role) return '/admin/users';
  if (['kasir', 'doctor', 'admin', 'superadmin'].includes(role)) {
    return '/admin/users';
  }
  return '/user/profile';
}

export default function UnifiedLayout({
  children,
  requiredRole = ['kasir', 'doctor', 'admin', 'superadmin'],
}: UnifiedLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'loading') return;

    // diminta: JANGAN redirect ke login.
    if (!session) return;

    const userRole = session.user?.role as StaffRole | undefined;
    if (!userRole || !requiredRole.includes(userRole)) {
      router.push('/user/dashboard');
      return;
    }
  }, [session, status, router, requiredRole]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#C89B4B]" />
      </div>
    );
  }

  // kalau tidak ada session, tapi juga tidak mau redirect ke login
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-500">
        Tidak ada sesi pengguna.
      </div>
    );
  }

  const isStaff =
    session.user?.role &&
    ['kasir', 'doctor', 'admin', 'superadmin'].includes(session.user.role);

  if (!isStaff) {
    return null;
  }

  const userRole = session.user.role as StaffRole;
  const navigation = staffNavigation.filter((item) =>
    item.roles.includes(userRole),
  );
  const currentPage =
    navigation.find((item) => pathname?.startsWith(item.href)) || navigation[0];

  const profilePath = getProfilePath(session.user.role);
  const initial = session.user?.name?.[0]?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-white flex">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="h-20 flex items-center px-6 border-b border-gray-200">
            <img
              src="/images/logo-charlen-belle.png"
              alt="Logo"
              className="h-full w-full object-contain object-left"
            />
          </div>
        {/* Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1 text-sm">
          {navigation.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'flex items-center gap-3 px-3 py-3 rounded-xl transition-all',
                  active
                    ? 'bg-gray-100 text-gray-900 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50',
                ].join(' ')}
              >
                <span
                  className={[
                    'h-9 w-9 rounded-xl flex items-center justify-center',
                    active ? 'bg-[#C89B4B] text-white' : 'bg-gray-100 text-gray-700',
                  ].join(' ')}
                >
                  <NavIcon type={item.icon} />
                </span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-6 py-4 text-xs text-gray-400 border-t border-gray-200">
          © {new Date().getFullYear()} Sharlene Belle
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col">
        {/* NAVBAR */}
        <header className="h-20 bg-white border-b border-gray-200 px-8 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
              {userRole} Panel
            </p>
            <h1 className="text-lg font-semibold text-gray-900">
              {currentPage?.name || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Profil */}
            <Link
              href={profilePath}
              className="flex items-center gap-3 group"
            >
              <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-800">
                {initial}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-sm font-medium text-gray-900 group-hover:underline">
                  {session.user?.name || 'User'}
                </span>
                <span className="text-xs text-gray-500 capitalize">
                  {userRole}
                </span>
              </div>
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium bg-[#C89B4B] text-white hover:bg-[#b48735] transition-colors"
            >
              <span>Logout</span>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 13v-2H7V8l-5 4 5 4v-3h9zm3-10H11v2h8v14h-8v2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" />
              </svg>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-8 bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}
