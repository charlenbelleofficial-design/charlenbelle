// app/user/dashboard/layout.tsx
'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

function classNames(...classes: (string | boolean | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#C89B4B]" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/user/login');
    return null;
  }

  const navItems = [
    { href: '/user/dashboard', label: 'Dashboard', icon: 'home' },
    { href: '/user/dashboard/bookings', label: 'Booking', icon: 'calendar' },
  ];

  const initial = (session?.user?.name || 'U')[0];

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="h-16 sm:h-20 flex items-center px-4 sm:px-6 border-b border-gray-200">
          <img
            src="/images/logo-charlen-belle.png"
            alt="Logo"
            className="h-full w-full object-contain object-left"
          />
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1 text-sm">
          {navItems.map((item) => {
            const active =
              item.href === '/user/dashboard'
                ? pathname === '/user/dashboard'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={classNames(
                  'flex items-center gap-3 px-3 py-3 rounded-xl transition-all',
                  active
                    ? 'bg-gray-100 text-gray-900 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50',
                )}
              >
                <span
                  className={classNames(
                    'h-9 w-9 rounded-xl flex items-center justify-center',
                    active ? 'bg-[#C89B4B] text-white' : 'bg-gray-100 text-gray-700',
                  )}
                >
                  {item.icon === 'home' && (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3 3 10h2v10h6v-6h2v6h6V10h2L12 3z" />
                    </svg>
                  )}
                  {item.icon === 'calendar' && (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7 2v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm12 7H5v10h14V9z" />
                    </svg>
                  )}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 sm:px-6 py-4 text-xs text-gray-400 border-t border-gray-200 mt-auto">
          © {new Date().getFullYear()} Sharlene Belle
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Top navbar */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 md:px-8 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
              User Panel
            </p>
            <h1 className="text-lg font-semibold text-gray-900">
              {pathname.includes('/bookings') ? 'Booking' : 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Profil diarahkan ke /user/profile */}
            <Link href="/user/profile" className="flex items-center gap-3 group">
              <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-800">
                {initial}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-sm font-medium text-gray-900 group-hover:underline">
                  {session?.user?.name || 'User'}
                </span>
                <span className="text-xs text-gray-500">Member</span>
              </div>
            </Link>

            <button
              onClick={() => signOut()}
              className="inline-flex items-center gap-2 rounded-full px-3 sm:px-4 py-2 text-xs font-medium bg-[#C89B4B] text-white hover:bg-[#b48735] transition-colors"
            >
              <span>Logout</span>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 13v-2H7V8l-5 4 5 4v-3h9zm3-10H11v2h8v14h-8v2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" />
              </svg>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 sm:px-6 md:px-8 py-6 bg-[#F9F5EE]">
          {children}
        </main>
      </div>
    </div>
  );
}
