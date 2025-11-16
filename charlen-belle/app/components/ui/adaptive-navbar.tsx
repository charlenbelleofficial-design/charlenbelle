// app/components/ui/adaptive-navbar.tsx
'use client';

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";

export const AdaptiveNavbar: React.FC = () => {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if we're in dashboard area
  const isDashboard = pathname?.startsWith('/user/dashboard');
  const isAuthPage = pathname?.includes('/user/login') || pathname?.includes('/user/register');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const isLoading = status === 'loading';

  // Dashboard Navigation
  const dashboardNavigation = [
    { name: 'Dashboard', href: '/user/dashboard', icon: '🏠' },
    { name: 'Booking Saya', href: '/user/dashboard/bookings', icon: '📅' },
    // { name: 'Riwayat', href: '/user/dashboard/history', icon: '📋' },
    // { name: 'Profil', href: '/user/profile', icon: '👤' },
  ];

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link href="/" className="navbar-logo">
          <div className="logo-circle">S</div>
          <span className="logo-text">Charlene Belle Aesthetic</span>
        </Link>

        {/* Menu - Only show if not on auth pages */}
        {!isAuthPage && (
          <nav className="navbar-menu">
            {isDashboard ? (
              // Dashboard Navigation
              <>
                {dashboardNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pathname === item.href
                        ? 'bg-[#f8f5e6] text-[#c3aa4c]'
                        : 'text-[#2d2617] hover:text-[#c3aa4c]'
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.name}
                  </Link>
                ))}
              </>
            ) : (
              // Main Site Navigation
              <>
                <Link 
                  href="#tentang-kami" 
                  className="text-[#2d2617] hover:text-[#c3aa4c] transition-colors"
                >
                  Tentang Kami
                </Link>
                <Link 
                  href="/user/treatments" 
                  className="text-[#2d2617] hover:text-[#c3aa4c] transition-colors"
                >
                  Produk
                </Link>
                <Link 
                  href="#kontak" 
                  className="text-[#2d2617] hover:text-[#c3aa4c] transition-colors"
                >
                  Kontak
                </Link>
              </>
            )}
          </nav>
        )}

        {/* Auth Buttons / User Profile - Hide on auth pages */}
        {!isAuthPage && (
          <div className="flex items-center gap-4">
            {isLoading ? (
              // Loading state
              <div className="animate-pulse bg-gray-200 h-10 w-20 rounded"></div>
            ) : session ? (
              // User is logged in - Show profile dropdown
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-[#c3aa4c] rounded-full flex items-center justify-center text-white font-medium">
                    {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {session.user?.name || 'User'}
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {/* Dashboard Link - Only show if not already in dashboard */}
                    {!isDashboard && (
                      <Link
                        href="/user/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        Dashboard
                      </Link>
                    )}
                    <Link
                      href="/user/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Profile
                    </Link>
                    {/* <Link
                      href="/user/dashboard/history"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Riwayat
                    </Link> */}
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // User is not logged in - Show Login and Register buttons
              <div className="flex items-center gap-3">
                <Link
                  href="/user/login"
                  className="text-sm font-medium text-[#2d2617] hover:text-[#c3aa4c] transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/user/register"
                  className="btn btn-primary text-sm"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};