"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";

export const AdaptiveNavbar: React.FC = () => {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isStaffArea = pathname?.startsWith("/admin");
  const isCustomerDashboardArea =
    pathname?.startsWith("/user/dashboard") ||
    pathname?.startsWith("/user/booking") ||
    pathname?.startsWith("/user/customer-profile") ||
    pathname?.startsWith("/user/login") ||
    pathname?.startsWith("/user/register") ||
    pathname?.startsWith("/user/treatments") ||
    pathname?.startsWith("/user/profile");

  const isAuthPage =
    pathname?.includes("/user/login") || pathname?.includes("/user/register");

  const isStaff =
    session?.user?.role &&
    ["kasir", "admin", "superadmin", "doctor"].includes(session.user.role);

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

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  if (isStaffArea || isCustomerDashboardArea) {
    return null;
  }

  const isLoading = status === "loading";

  const mainMenu = (
    <>
      <Link
        href="#hero"
        className="text-xs font-medium tracking-[0.16em] uppercase text-[#6b5d4f] hover:text-[#c9b591] transition-colors"
      >
        Beranda
      </Link>
      <Link
        href="#tentang-kami"
        className="text-xs font-medium tracking-[0.16em] uppercase text-[#6b5d4f] hover:text-[#c9b591] transition-colors"
      >
        Tentang Kami
      </Link>
      <Link
        href="#layanan"
        className="text-xs font-medium tracking-[0.16em] uppercase text-[#6b5d4f] hover:text-[#c9b591] transition-colors"
      >
        Layanan
      </Link>
      <Link
        href="#kontak"
        className="text-xs font-medium tracking-[0.16em] uppercase text-[#6b5d4f] hover:text-[#c9b591] transition-colors"
      >
        Kontak
      </Link>
    </>
  );

  const authArea = !isAuthPage && (
    <>
      {isLoading ? (
        <div className="h-9 w-20 rounded-full bg-[#d4b896]/20 animate-pulse" />
      ) : session ? (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-full border border-[#d4b896]/30 bg-white px-3 py-1.5 text-xs text-[#6b5d4f] shadow-sm hover:border-[#c9b591] hover:text-[#3d2e1f] transition-colors"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#c9b591] text-[13px] font-semibold text-white">
              {session.user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <span className="font-medium">
              {session.user?.name || "User"}
            </span>
            {isStaff && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                {session.user.role}
              </span>
            )}
            <svg
              className={`h-4 w-4 transition-transform ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M6 9l6 6 6-6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-52 rounded-2xl border border-[#d4b896]/20 bg-white/95 py-2 text-sm text-[#6b5d4f] shadow-[0_18px_50px_rgba(61,46,31,0.12)] backdrop-blur-md z-50">
              <Link
                href={isStaff ? "/admin/dashboard" : "/user/dashboard"}
                className="block px-4 py-2 hover:bg-[#f5ede4]/50"
                onClick={() => setIsDropdownOpen(false)}
              >
                {isStaff ? "Staff Dashboard" : "Dashboard"}
              </Link>
              <Link
                href="/user/profile"
                className="block px-4 py-2 hover:bg-[#f5ede4]/50"
                onClick={() => setIsDropdownOpen(false)}
              >
                Profil
              </Link>
              <div className="my-1 border-t border-[#d4b896]/20" />
              <button
                onClick={handleLogout}
                className="block w-full px-4 py-2 text-left text-red-600 hover:bg-red-50/80"
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
            className="text-xs font-medium text-[#6b5d4f] hover:text-[#c9b591] transition-colors"
          >
            Login
          </Link>
          <Link
            href="/user/register"
            className="inline-flex items-center rounded-full bg-[#c9b591] px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-[#c9b591]/30 hover:bg-[#b8a582] hover:shadow-xl transition-all duration-300"
          >
            Daftar
          </Link>
        </div>
      )}
    </>
  );

  return (
<header
  className={`sticky top-0 z-40 border-b border-[#d4b896]/20 bg-white transition-all duration-300 ${
    isScrolled ? "shadow-[0_8px_30px_rgba(201,181,145,0.08)]" : ""
  }`}
>

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:h-18 sm:px-6 lg:px-8">
        {/* Logo - Image Based */}
      <Link
        href="/"
        className="flex items-center"
      >
        {/* Logo Only */}
        <div className="relative h-10 w-28">
          <Image
            src="/images/logo-charlen-belle.png"
            alt="Charlene Belle Logo"
            fill
            className="object-contain object-left"
            priority
          />
        </div>
      </Link>


        {/* Desktop Menu */}
        {!isAuthPage && (
          <div className="hidden items-center gap-8 md:flex">
            <nav className="flex items-center gap-6">{mainMenu}</nav>
            {authArea}
          </div>
        )}

        {/* Mobile Menu Button */}
        {!isAuthPage && (
          <div className="flex items-center gap-3 md:hidden">
            {authArea}
            <button
              aria-label="Toggle menu"
              onClick={() => setIsMobileOpen((prev) => !prev)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d4b896]/30 bg-white shadow-sm transition-colors hover:bg-[#f5ede4]/50"
            >
              <span className="sr-only">Toggle navigation</span>
              <div className="space-y-1.5">
                <span className={`block h-0.5 w-4 rounded-full bg-[#6b5d4f] transition-transform ${isMobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
                <span className={`block h-0.5 w-4 rounded-full bg-[#6b5d4f] transition-opacity ${isMobileOpen ? 'opacity-0' : ''}`} />
                <span className={`block h-0.5 w-4 rounded-full bg-[#6b5d4f] transition-transform ${isMobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Mobile Menu Dropdown */}
      {!isAuthPage && isMobileOpen && (
        <div className="border-t border-[#d4b896]/20 bg-[#fdfaf7]/98 px-4 py-4 shadow-lg backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-3 text-sm">
            {mainMenu}
          </nav>
        </div>
      )}
    </header>
  );
};