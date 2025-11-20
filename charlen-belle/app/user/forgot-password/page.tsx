// app/forgot-password/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Input } from '../../components/ui/input';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengirim email reset');
      }

      toast.success(
        'Jika email terdaftar, link reset password sudah dikirim ke email Anda.'
      );
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F0E3] px-4">
      <div className="max-w-md w-full bg-[#FFFDF9] border border-[#E1D4C0] rounded-2xl shadow-sm p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-[#E6D8C2] flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6 text-[#3B2A1E]"
              fill="currentColor"
            >
              <path d="M12 12a4 4 0 1 0-4-4 4.003 4.003 0 0 0 4 4zm0 2c-3.33 0-6 1.567-6 3.5V20h12v-2.5C18 15.567 15.33 14 12 14z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-[#3B2A1E] mb-2">
            Lupa Password
          </h1>
          <p className="text-sm text-[#A18F76]">
            Masukkan email Anda dan kami akan mengirim link untuk reset password.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#3B2A1E] mb-2">
              Email
            </label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              disabled={isLoading}
              className="border-[#E1D4C0] bg-[#FFFDF9] text-[#3B2A1E] placeholder:text-[#C0B29C] focus:border-[#C89B4B] focus:ring-[#C89B4B]/40"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all
              ${
                isLoading
                  ? 'bg-[#C7B9A2] text-white cursor-not-allowed'
                  : 'bg-[#6C3FD1] text-white hover:bg-[#5b34b3] shadow-sm hover:shadow-md'
              }`}
          >
            {isLoading ? 'Mengirim...' : 'Kirim Link Reset'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <Link
            href="/user/login"
            className="text-sm text-[#7E6A52] hover:text-[#3B2A1E] inline-flex items-center gap-1"
          >
            <span>←</span>
            <span>Kembali ke halaman login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
