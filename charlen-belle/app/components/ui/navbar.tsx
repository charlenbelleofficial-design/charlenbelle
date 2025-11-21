// app/components/ui/navbar.tsx
"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";

export const Navbar: React.FC = () => {
  const { data: session, status } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Sembunyikan navbar di halaman panel user
  if (
    pathname?.startsWith("/user/dashboard") ||
    pathname?.startsWith("/user/booking") ||
    pathname?.startsWith("/user/treatments") ||
    pathname?.startsWith("/user/customer-profile") ||
    pathname?.startsWith("/user/profile")
  ) {
    return null;
  }

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const isLoading = status === "loading";

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
        {/* Logo persegi panjang di ujung kiri */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-32 items-center justify-center rounded-xl border border-slate-200 bg-gradient-to-r from-[#f7e9dc] via-[#fbeef0] to-[#f3f0ff] text-xs font-semibold tracking-wide text-slate-800 shadow-sm">
            CHARLENE
          </div>
          <span className="hidden text-sm font-medium text-slate-700 sm:block">
            Charlene Belle Aesthetic
          </span>
        </Link>

        {/* Menu */}
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <Link
            href="#hero"
            className="transition hover:text-[#c3aa4c]"
          >
            Beranda
          </Link>
          <Link
            href="#tentang-kami"
            className="transition hover:text-[#c3aa4c]"
          >
            Tentang Kami
          </Link>
          <Link
            href="#layanan"
            className="transition hover:text-[#c3aa4c]"
          >
            Layanan
          </Link>
          <Link
            href="#kontak"
            className="transition hover:text-[#c3aa4c]"
          >
            Kontak
          </Link>
        </nav>

        {/* Auth / Profile */}
        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="h-9 w-20 animate-pulse rounded-full bg-slate-200" />
          ) : session ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen((p) => !p)}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm transition hover:border-[#c3aa4c]/60 hover:bg-[#fdf7f2]"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#c3aa4c] text-xs font-semibold text-white">
                  {session.user?.name?.charAt(0).toUpperCase() ?? "U"}
                </div>
                <span className="hidden text-xs font-medium text-slate-700 sm:block">
                  {session.user?.name ?? "User"}
                </span>
                <svg
                  className={`h-4 w-4 transition-transform ${
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
                <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-slate-200 bg-white/95 py-2 text-sm shadow-xl">
                  <Link
                    href="/user/profile"
                    className="block px-4 py-2 text-slate-700 hover:bg-slate-50"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full px-4 py-2 text-left text-red-500 hover:bg-slate-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/user/login"
                className="text-xs font-medium text-slate-700 hover:text-[#c3aa4c]"
              >
                Login
              </Link>
              <Link
                href="/user/register"
                className="rounded-full bg-[#c3aa4c] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#b19a42]"
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
