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

  // --- Area detection ---
  const isStaffArea = pathname?.startsWith("/admin");
  const isCustomerDashboardArea =
    pathname?.startsWith("/user/dashboard") ||
    pathname?.startsWith("/user/booking") ||
    pathname?.startsWith("/user/customer-profile") ||
    pathname?.startsWith("/user/profile");

  const isAuthPage =
    pathname?.includes("/user/login") || pathname?.includes("/user/register");

  const isStaff =
    session?.user?.role &&
    ["kasir", "admin", "superadmin", "doctor"].includes(session.user.role);

  // Tutup dropdown ketika klik di luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const isLoading = status === "loading";

  // ❗ JANGAN tampilkan navbar:
  // - di area staff (punya layout sendiri)
  // - di area customer dashboard/booking (sudah ada header+sidebar sendiri)
  if (isStaffArea || isCustomerDashboardArea) {
    return null;
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link href="/" className="navbar-logo">
          <div className="logo-circle">S</div>
          <span className="logo-text">Charlene Belle Aesthetic</span>
        </Link>

        {/* Menu - hanya tampil kalau bukan halaman auth */}
        {!isAuthPage && (
          <nav className="navbar-menu">
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
          </nav>
        )}

        {/* Auth Buttons / User Profile */}
        {!isAuthPage && (
          <div className="flex items-center gap-4">
            {isLoading ? (
              <div className="animate-pulse bg-gray-200 h-10 w-20 rounded" />
            ) : session ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-[#c3aa4c] rounded-full flex items-center justify-center text-white font-medium">
                    {session.user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {session.user?.name || "User"}
                  </span>
                  {isStaff && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {session.user.role}
                    </span>
                  )}
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <Link
                      href={isStaff ? "/admin/dashboard" : "/user/dashboard"}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      {isStaff ? "Staff Dashboard" : "Dashboard"}
                    </Link>
                    <Link
                      href="/user/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Profile
                    </Link>
                    <div className="border-t border-gray-200 my-1" />
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
