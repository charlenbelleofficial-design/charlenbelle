// app/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { HeroSection } from "./components/ui/HeroSection";
import { AboutSection } from "./components/ui/AboutSection";
import { ServicesSection } from "./components/ui/ServicesSection";
import { MainFooter } from "./components/ui/MainFooter";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Role yang diarahkan ke admin dashboard
  const adminDashboardRoles = ['admin', 'superadmin', 'kasir', 'doctor', 'therapist'];

  // Role user biasa (customer) diarahkan ke user dashboard
  const userDashboardRoles = ['customer'];

  useEffect(() => {
    if (status !== 'authenticated') return;

    const role = session?.user?.role;
    if (!role) return;

    if (adminDashboardRoles.includes(role)) {
      router.replace('/admin/dashboard');
    } else if (userDashboardRoles.includes(role)) {
      router.replace('/user/dashboard');
    }
  }, [status, session, router]);

  // Saat masih cek session
  if (status === 'loading') return null;

  const role = session?.user?.role || '';

  const isAdminSide = adminDashboardRoles.includes(role);
  const isUserSide = userDashboardRoles.includes(role);

  // Semua user yang sudah login dengan role di atas TIDAK boleh lihat homepage
  if (isAdminSide || isUserSide) {
    return null;
  }

  // Hanya pengunjung (belum login) yang boleh lihat landing page
  return (
    <div className="bg-[#fdf7f2]">
      <HeroSection />
      <AboutSection />
      <ServicesSection />
      <MainFooter />
    </div>
  );
}
