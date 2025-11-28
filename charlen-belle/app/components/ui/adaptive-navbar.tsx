"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";

export const AdaptiveNavbar: React.FC = () => {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAuthPage =
    pathname?.includes("/user/login") || pathname?.includes("/user/register");

  const isDashboard =
    pathname?.startsWith("/user/dashboard") ||
    pathname?.startsWith("/admin");

  const isStaff =
    session?.user?.role &&
    ["superadmin", "admin", "kasir", "doctor"].includes(session.user.role);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  if (isDashboard) return null;

  const MenuLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      <Link
        href="#hero"
        onClick={onClick}
        className="text-sm text-[#6b5d4f] hover:text-[#c9b591]"
      >
        Beranda
      </Link>
      <Link
        href="#tentang-kami"
        onClick={onClick}
        className="text-sm text-[#6b5d4f] hover:text-[#c9b591]"
      >
        Tentang Kami
      </Link>
      <Link
        href="#layanan"
        onClick={onClick}
        className="text-sm text-[#6b5d4f] hover:text-[#c9b591]"
      >
        Layanan
      </Link>
      <Link
        href="#kontak"
        onClick={onClick}
        className="text-sm text-[#6b5d4f] hover:text-[#c9b591]"
      >
        Kontak
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 bg-white border-b border-[#d4b896]/30 z-40">
      <div className="max-w-7xl mx-auto h-16 flex items-center justify-between px-4">
        {/* Logo */}
        <Link href="/user/dashboard/" className="flex items-center">
          <div className="relative h-10 w-28">
            <Image
              src="/images/logo-charlen-belle.png"
              fill
              alt="Logo"
              className="object-contain object-left"
            />
          </div>
        </Link>

        {/* Desktop Menu */}
        {!isAuthPage && (
          <nav className="hidden md:flex items-center gap-8">
            <MenuLinks />

            {/* Auth section */}
            {status === "loading" ? (
              <div className="h-8 w-20 bg-gray-200 animate-pulse rounded-lg" />
            ) : session ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 bg-white border px-3 py-1.5 rounded-lg"
                >
                  <span className="h-7 w-7 flex items-center justify-center bg-[#c9b591] text-white rounded-full text-sm">
                    {session.user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                  </span>
                  <span>{session.user?.name}</span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 bg-white border rounded-xl py-2 w-48 shadow">
                    <Link
                      href={isStaff ? "/admin/dashboard" : "/user/dashboard"}
                      className="block px-4 py-2 hover:bg-gray-50"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/user/profile"
                      className="block px-4 py-2 hover:bg-gray-50"
                    >
                      Profil
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-4 items-center">
                <Link
                  href="/user/login"
                  className="text-sm text-[#6b5d4f] hover:text-[#c9b591]"
                >
                  Login
                </Link>
                <Link
                  href="/user/register"
                  className="bg-[#c9b591] text-white px-4 py-2 rounded-full text-sm"
                >
                  Daftar
                </Link>
              </div>
            )}
          </nav>
        )}

        {/* Mobile Hamburger */}
        {!isAuthPage && (
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex flex-col gap-1.5"
          >
            <span
              className={`h-0.5 w-6 bg-[#6b5d4f] transition ${
                menuOpen ? "rotate-45 translate-y-1.5" : ""
              }`}
            />
            <span
              className={`h-0.5 w-6 bg-[#6b5d4f] ${
                menuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`h-0.5 w-6 bg-[#6b5d4f] transition ${
                menuOpen ? "-rotate-45 -translate-y-1.5" : ""
              }`}
            />
          </button>
        )}
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && !isAuthPage && (
        <div className="md:hidden bg-[#fefbf7] border-t border-[#d4b896]/30 px-4 py-4 flex flex-col gap-3">
          <MenuLinks onClick={() => setMenuOpen(false)} />

          {/* Mobile Auth */}
          <div className="pt-3 border-t border-[#d4b896]/30 flex flex-col gap-3">
            {session ? (
              <>
                <Link
                  href={isStaff ? "/admin/dashboard" : "/user/dashboard"}
                  className="text-sm text-[#6b5d4f]"
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/user/profile"
                  className="text-sm text-[#6b5d4f]"
                  onClick={() => setMenuOpen(false)}
                >
                  Profil
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-600 text-left"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/user/login"
                  className="text-sm"
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/user/register"
                  className="text-sm bg-[#c9b591] text-white px-4 py-2 rounded-full w-fit"
                >
                  Daftar
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
