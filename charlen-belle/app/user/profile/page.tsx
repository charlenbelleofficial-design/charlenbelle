// app/profile/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProfilePage() {
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
        <h1 className="text-3xl font-bold text-[#2d2617] mb-8">Profile</h1>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nama</label>
              <p className="text-lg">{session.user?.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <p className="text-lg">{session.user?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <p className="text-lg capitalize">{session.user?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}