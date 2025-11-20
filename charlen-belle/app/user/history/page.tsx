// app/history/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/user/login');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F0E3]">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#6C3FD1]" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F6F0E3] py-10">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <p className="text-xs text-[#A18F76] mb-1 uppercase tracking-[0.15em]">
            Akun
          </p>
          <h1 className="text-2xl font-semibold text-[#3B2A1E] mb-1">
            Riwayat
          </h1>
          <p className="text-sm text-[#A18F76]">
            Riwayat booking dan transaksi Anda akan muncul di sini.
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#FFFDF9] rounded-2xl border border-[#E1D4C0] shadow-sm p-8 flex flex-col items-center text-center">
          <div className="h-14 w-14 rounded-2xl bg-[#E6D8C2] flex items-center justify-center mb-4">
            <svg
              viewBox="0 0 24 24"
              className="h-7 w-7 text-[#3B2A1E]"
              fill="currentColor"
            >
              <path d="M12 8v4l3 3-1.5 1.5L10 13V8h2zm0-6a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8.009 8.009 0 0 1-8 8z" />
            </svg>
          </div>
          <p className="text-sm text-[#7E6A52] max-w-md">
            Riwayat booking dan transaksi akan muncul di sini setelah Anda
            melakukan pemesanan atau pembayaran di Charlen Belle.
          </p>
        </div>
      </div>
    </div>
  );
}
