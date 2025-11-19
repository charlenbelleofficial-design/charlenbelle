'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/buttons';
import { Snackbar } from '../../components/ui/snackbar';
import { useSnackbar } from '../../hooks/useSnackbar';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const redirect = searchParams.get('redirect') || '/';

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      console.log('SignIn result:', result);

      if (result?.error) {
        if (result.error.includes('Email atau password salah')) {
          showSnackbar('Email atau password salah', 'error');
        } else {
          showSnackbar(`Login gagal: ${result.error}`, 'error');
        }
      } else {
        showSnackbar('Login berhasil!', 'success');
        router.push(redirect);
        router.refresh();
      }

    } catch (error) {
      console.error('Login error:', error);
      showSnackbar('Terjadi kesalahan. Silakan coba lagi.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-[#f9f7f1]">
        <div className="max-w-md w-full mx-4 bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#2d2617] mb-2">
              Selamat Datang Kembali
            </h1>
            <p className="text-sm text-gray-600">
              Masuk ke akun Anda untuk melanjutkan
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <Input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="nama@email.com"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <Input
                type="password"
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-end -mt-2">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-[#c3aa4c] hover:text-[#b0963d]"
              >
                Lupa password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Belum punya akun?{' '}
            <Link
              href="/user/register"
              className="font-semibold text-[#c3aa4c] hover:text-[#b0963d]"
            >
              Daftar Sekarang
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>

      <Snackbar
        message={snackbar.message}
        type={snackbar.type}
        isVisible={snackbar.isVisible}
        onClose={hideSnackbar}
        duration={5000}
        position="top-center"
      />
    </>
  );
}