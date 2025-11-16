'use client';

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";

export const Navbar: React.FC = () => {
  const { data: session, status } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link href="/" className="navbar-logo">
          <div className="logo-circle">S</div>
          <span className="logo-text">Charlene Belle Aesthetic</span>
        </Link>

        {/* Menu */}
        <nav className="navbar-menu">
          <Link href="#tentang-kami">Tentang Kami</Link>
          <Link href="/user/treatments">Produk</Link>
          <Link href="#kontak">Kontak</Link>
        </nav>

        {/* Auth Buttons / User Profile */}
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
                  <Link
                    href="/user/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Profile
                  </Link>
                  {/* <Link
                    href="/user/history"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Riwayat
                  </Link> */}
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
      </div>
    </header>
  );
};