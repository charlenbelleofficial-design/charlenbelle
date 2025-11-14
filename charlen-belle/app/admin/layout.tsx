'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../components/ui/buttons';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (status === 'unauthenticated' || !['admin', 'superadmin'].includes(session?.user?.role || '')) {
    router.push('/login');
    return null;
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: '📊' },
    { name: 'Bookings', href: '/admin/bookings', icon: '📅' },
    { name: 'Treatments', href: '/admin/treatments', icon: '✨' },
    { name: 'Customers', href: '/admin/customers', icon: '👥' },
    { name: 'Promos', href: '/admin/promos', icon: '🎁' },
    { name: 'Laporan', href: '/admin/reports', icon: '📈' },
  ];

  if (session?.user?.role === 'superadmin') {
    navigation.push({ name: 'Users', href: '/admin/users', icon: '👨‍💼' });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b">
            <Link href="/admin" className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              Admin Panel
            </Link>
            <p className="text-sm text-gray-500 mt-1">{session?.user?.role}</p>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'bg-purple-100 text-purple-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                {session?.user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {session?.user?.email}
                </p>
              </div>
            </div>
            <Button
              onClick={() => signOut({ callbackUrl: '/' })}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-64">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-gray-900">
                {navigation.find(item => item.href === pathname)?.name || 'Admin Panel'}
              </h1>
              <div className="flex items-center gap-4">
                <Link href="/" target="_blank">
                  <Button variant="outline" size="sm">
                    🌐 Lihat Website
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}