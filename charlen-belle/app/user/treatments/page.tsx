// app/user/treatments/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { formatCurrency } from '../../lib/utils';
import { useRouter } from 'next/navigation';

type Category = { _id: string; name: string };
type Promo = {
  _id: string;
  name: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  is_global: boolean;
};

type Treatment = {
  _id: string;
  name: string;
  description?: string;
  base_price: number;
  duration_minutes: number;
  category_id?: Category | string;
  requires_confirmation?: boolean;
  images?: { url: string }[];
  promo?: Promo;
  type?: 'treatment' | 'consultation';
};

// Consultation data
const CONSULTATION_TREATMENT: Treatment = {
  _id: 'consultation',
  name: 'Konsultasi Dokter',
  description:
    'Konsultasi dengan dokter spesialis untuk pemeriksaan awal dan rekomendasi treatment',
  base_price: 150000,
  duration_minutes: 30,
  type: 'consultation'
};

export default function TreatmentsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    fetchCategories();
    fetchTreatments();
  }, []);

  useEffect(() => {
    if (!categoriesLoading) {
      fetchTreatments();
    }
  }, [selectedCategory, categoriesLoading]);

  async function fetchCategories() {
    try {
      setCategoriesLoading(true);
      const res = await fetch('/api/treatment-categories');
      if (!res.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = await res.json();

      const validCategories = (data.categories || [])
        .filter(
          (c: Category) =>
            c && c._id && c._id !== 'undefined' && c._id !== 'null'
        )
        .map((c: Category) => ({
          ...c,
          _id: String(c._id)
        }));

      setCategories(validCategories);
    } catch (e) {
      console.error('Error fetching categories:', e);
      setError('Gagal memuat kategori');
    } finally {
      setCategoriesLoading(false);
    }
  }

  async function fetchTreatments() {
    setLoading(true);
    setError('');
    try {
      const url =
        selectedCategory === 'all' ||
        !selectedCategory ||
        selectedCategory === 'undefined'
          ? '/api/treatments-with-promos'
          : `/api/treatments-with-promos?category=${selectedCategory}`;

      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        const allTreatments = [CONSULTATION_TREATMENT, ...(data.treatments || [])];
        setTreatments(allTreatments);
      } else {
        throw new Error(data.error || 'Failed to fetch treatments');
      }
    } catch (e) {
      console.error('Error fetching treatments:', e);
      setError('Gagal memuat data treatment');
      setTreatments([]);
    } finally {
      setLoading(false);
    }
  }

  function calculateDiscountedPrice(basePrice: number, promo: Promo): number {
    if (promo.discount_type === 'percentage') {
      const discounted = basePrice * (1 - promo.discount_value / 100);
      return Math.round(discounted);
    } else {
      return Math.max(0, basePrice - promo.discount_value);
    }
  }

  const handleCategoryClick = (categoryId: string) => {
    if (!categoryId || categoryId === 'undefined' || categoryId === 'null') {
      setSelectedCategory('all');
    } else {
      setSelectedCategory(categoryId);
    }
  };

  const handleBookNow = (treatment: Treatment) => {
    if (treatment._id === 'consultation') {
      const consultationSelection = [
        {
          id: 'consultation',
          name: treatment.name,
          quantity: 1,
          price: treatment.base_price,
          type: 'consultation'
        }
      ];
      localStorage.setItem(
        'selectedTreatments',
        JSON.stringify(consultationSelection)
      );
      router.push('/user/booking');
    } else {
      router.push(`/user/treatments/${treatment._id}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F0E3] py-10">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <p className="text-xs text-[#A18F76] mb-1 uppercase tracking-[0.15em]">
            Layanan
          </p>
          <h1 className="text-2xl font-semibold text-[#3B2A1E]">
            Layanan & Konsultasi
          </h1>
          <p className="text-sm text-[#A18F76] mt-1">
            Pilih treatment atau konsultasi sesuai kebutuhan kulit Anda.
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Categories Section */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-[#3B2A1E] mb-3">
            Kategori Layanan
          </h2>
          {categoriesLoading ? (
            <div className="flex gap-3 flex-wrap">
              <div className="px-4 py-2 rounded-full bg-[#FBF6EA] animate-pulse text-xs text-[#A18F76]">
                Memuat kategori...
              </div>
            </div>
          ) : (
            <div className="flex gap-3 mb-4 flex-wrap">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-colors border ${
                  selectedCategory === 'all'
                    ? 'bg-[#6C3FD1] text-white border-[#6C3FD1]'
                    : 'bg-[#FFFDF9] text-[#7E6A52] border-[#E1D4C0] hover:bg-[#FBF6EA]'
                }`}
              >
                Semua
              </button>
              {categories.length > 0 ? (
                categories.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => handleCategoryClick(c._id)}
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-colors border ${
                      selectedCategory === c._id
                        ? 'bg-[#6C3FD1] text-white border-[#6C3FD1]'
                        : 'bg-[#FFFDF9] text-[#7E6A52] border-[#E1D4C0] hover:bg-[#FBF6EA]'
                    }`}
                  >
                    {c.name}
                  </button>
                ))
              ) : (
                <p className="text-xs text-[#A18F76]">
                  Tidak ada kategori tersedia.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Treatments Section */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#6C3FD1]" />
            <p className="mt-4 text-sm text-[#A18F76]">Memuat layanan...</p>
          </div>
        ) : treatments.length === 0 ? (
          <div className="text-center py-12 bg-[#FFFDF9] border border-[#E1D4C0] rounded-2xl">
            <p className="text-sm text-[#7E6A52]">
              Tidak ada layanan tersedia saat ini.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {treatments.map((t) => {
              const isConsultation = t._id === 'consultation';
              const hasPromo = !!t.promo;
              const finalPrice = hasPromo
                ? calculateDiscountedPrice(t.base_price, t.promo!)
                : t.base_price;

              return (
                <div
                  key={t._id}
                  className={`bg-[#FFFDF9] rounded-2xl border border-[#E1D4C0] shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col ${
                    isConsultation ? 'border-[#C4DAF8]' : ''
                  }`}
                >
                  {/* Badge */}
                  {isConsultation && (
                    <div className="mb-3">
                      <span className="inline-flex items-center gap-1 bg-[#E3ECFF] text-[#1E4E8C] text-[11px] px-3 py-1 rounded-full font-medium">
                        <span className="h-4 w-4 rounded-full bg-[#C4D7F2] flex items-center justify-center">
                          <svg
                            viewBox="0 0 24 24"
                            className="h-3 w-3"
                            fill="currentColor"
                          >
                            <path d="M12 2a7 7 0 0 0-7 7v4.5L3.5 16A1 1 0 0 0 4.4 18H8v-2H6.1l.9-1.8A1 1 0 0 0 7 13V9a5 5 0 0 1 10 0v4a1 1 0 0 0 .3.7l.9.9A3 3 0 0 1 16 21h-3v2h3a5 5 0 0 0 3.5-8.5l-.8-.8V9a7 7 0 0 0-7-7z" />
                          </svg>
                        </span>
                        Konsultasi Dokter
                      </span>
                    </div>
                  )}

                  {/* Image */}
                  {t.images && t.images.length > 0 ? (
                    <img
                      src={t.images[0].url}
                      alt={t.name}
                      className="w-full h-40 object-cover rounded-xl mb-4"
                    />
                  ) : (
                    <div className="w-full h-40 bg-[#FBF6EA] rounded-xl flex items-center justify-center mb-4">
                      <span className="text-xs text-[#C0B29C]">
                        {isConsultation
                          ? 'Ilustrasi Konsultasi'
                          : 'Tidak ada gambar'}
                      </span>
                    </div>
                  )}

                  <h3 className="text-base font-semibold text-[#3B2A1E] mb-1">
                    {t.name}
                  </h3>
                  <p className="text-xs text-[#A18F76] mb-3 line-clamp-2">
                    {t.description}
                  </p>

                  <div className="mt-auto flex items-end justify-between gap-2">
                    <div>
                      {hasPromo ? (
                        <div className="space-y-1">
                          <p className="text-xs text-[#A18F76] line-through">
                            {formatCurrency(t.base_price)}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-lg font-bold text-[#2F855A]">
                              {formatCurrency(finalPrice)}
                            </p>
                            <span className="bg-[#FDECEE] text-[#C53030] text-[10px] px-2 py-0.5 rounded-full font-medium">
                              {t.promo!.discount_type === 'percentage'
                                ? `-${t.promo!.discount_value}%`
                                : `- ${formatCurrency(
                                    t.promo!.discount_value
                                  )}`}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-lg font-bold text-[#6C3FD1]">
                          {formatCurrency(t.base_price)}
                        </p>
                      )}
                      <p className="text-[11px] text-[#A18F76]">
                        {t.duration_minutes} menit
                      </p>
                    </div>

                    <button
                      onClick={() => handleBookNow(t)}
                      className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
                        isConsultation
                          ? 'bg-[#1E4E8C] text-white hover:bg-[#163C6A]'
                          : 'bg-[#6C3FD1] text-white hover:bg-[#5b34b3]'
                      }`}
                    >
                      {isConsultation ? 'Booking' : 'Detail'}
                    </button>
                  </div>

                  {t.requires_confirmation && (
                    <div className="mt-3">
                      <span className="inline-flex items-center gap-1 bg-[#FFF7E0] text-[#8B5E34] text-[10px] px-2 py-1 rounded-full">
                        <span className="h-3 w-3 rounded-full bg-[#F6E0A4]" />
                        Perlu Konfirmasi Dokter
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
