// app/components/layouts/unified-layout.tsx
'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface UnifiedLayoutProps {
  children: React.ReactNode;
  requiredRole?: string[];
}

// Define navigation structure for different roles
const navigationConfig = {
  // Staff navigation (kasir, doctor, admin, superadmin)
  staff: [
    { name: 'Dashboard', href: '/admin/dashboard', icon: '📊', roles: ['kasir', 'doctor', 'admin', 'superadmin'] },
    { name: 'Booking', href: '/admin/bookings', icon: '📅', roles: ['kasir', 'doctor', 'admin', 'superadmin'] },
    { name: 'Transaksi', href: '/admin/transactions', icon: '💳', roles: ['kasir', 'admin', 'superadmin'] },
    { name: 'Treatment', href: '/admin/treatments', icon: '💆', roles: ['admin', 'superadmin'] },
    { name: 'Kategori Treatment', href: '/admin/treatment-categories', icon: '🗂️', roles: ['admin', 'superadmin'] },
    { name: 'Promo', href: '/admin/promos', icon: '🎁', roles: ['admin', 'superadmin'] },
    { name: 'Laporan', href: '/admin/reports', icon: '📈', roles: ['admin', 'superadmin'] },
    { name: 'Users', href: '/admin/users', icon: '👥', roles: ['superadmin'] },
    { name: 'Jadwal Booking', href: '/admin/schedule', icon: '📅', roles: ['admin', 'superadmin'] },
  ],
  // Customer navigation
  customer: [
    { name: 'Dashboard', href: '/user/dashboard', icon: '🏠' },
    { name: 'Booking Saya', href: '/user/dashboard/bookings', icon: '📅' },
  ]
};

export default function UnifiedLayout({ 
  children, 
  requiredRole = ['kasir', 'doctor', 'admin', 'superadmin'] 
}: UnifiedLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/user/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    const userRole = session.user?.role;
    if (!userRole || !requiredRole.includes(userRole)) {
      router.push('/user/dashboard');
      return;
    }
  }, [session, status, router, requiredRole]);

  // Get filtered navigation based on user role
  const getFilteredNavigation = () => {
    if (!session?.user?.role) return [];
    
    const userRole = session.user.role;
    return navigationConfig.staff.filter(item => 
      item.roles.includes(userRole)
    );
  };

  const isStaff = session?.user?.role && ['kasir', 'doctor', 'admin', 'superadmin'].includes(session.user.role);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!session || !isStaff) {
    return null;
  }

  const navigation = getFilteredNavigation();
  const currentPage = navigation.find(item => pathname?.startsWith(item.href)) || navigation[0];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed on desktop */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 z-50
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b">
            <Link 
              href="/admin/dashboard" 
              className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent"
              onClick={() => setSidebarOpen(false)}
            >
              Charlene Belle
            </Link>
            <p className="text-sm text-gray-500 mt-1 capitalize">
              {session.user?.role} Panel
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.href || pathname?.startsWith(item.href + '/')
                    ? 'bg-purple-100 text-purple-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                {session.user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session.user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {session.user?.email}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href="/"
                target="_blank"
                className="flex-1 bg-gray-500 text-white py-2 px-3 rounded-lg text-sm hover:bg-gray-600 transition-colors text-center"
              >
                🌐 Website
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex-1 bg-red-500 text-white py-2 px-3 rounded-lg text-sm hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content - With left margin on desktop */}
      <div className="flex-1 lg:ml-64 w-full">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Mobile menu button */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                
                <h1 className="text-2xl font-semibold text-gray-900">
                  {currentPage?.name || 'Dashboard'}
                </h1>
              </div>

              {/* User info for mobile */}
              <div className="lg:hidden flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                  {session.user?.name?.[0]?.toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}