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
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f9f7f1] py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-[#2d2617] mb-8">Riwayat</h1>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <p className="text-gray-600">Riwayat booking dan transaksi akan muncul di sini.</p>
        </div>
      </div>
    </div>
  );
}