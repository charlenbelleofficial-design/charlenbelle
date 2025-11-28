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

// Consultation
const CONSULTATION_TREATMENT: Treatment = {
  _id: 'consultation',
  name: 'Konsultasi Dokter',
  description: 'Konsultasi dengan dokter spesialis untuk pemeriksaan awal dan rekomendasi treatment',
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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [slideIndex, setSlideIndex] = useState<Record<string, number>>({});
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
      if (!res.ok) throw new Error('Failed to fetch categories');

      const data = await res.json();

      const validCategories = (data.categories || [])
        .filter((c: Category) => c && c._id && c._id !== 'undefined' && c._id !== 'null')
        .map((c: Category) => ({ ...c, _id: String(c._id) }));

      setCategories(validCategories);
    } catch (e) {
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
        selectedCategory === 'all' || !selectedCategory || selectedCategory === 'undefined'
          ? '/api/treatments-with-promos'
          : `/api/treatments-with-promos?category=${selectedCategory}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();

      if (data.success) {
        const allTreatments = [CONSULTATION_TREATMENT, ...(data.treatments || [])];
        setTreatments(allTreatments);
      } else {
        throw new Error(data.error || 'Failed to fetch treatments');
      }
    } catch (e) {
      setError('Gagal memuat data treatment');
      setTreatments([]);
    } finally {
      setLoading(false);
    }
  }

  function calculateDiscountedPrice(basePrice: number, promo: Promo) {
    if (promo.discount_type === 'percentage') {
      return Math.round(basePrice * (1 - promo.discount_value / 100));
    }
    return Math.max(0, basePrice - promo.discount_value);
  }

  const filteredTreatments = treatments.filter((t) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-[#F6F0E3] py-8 sm:py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-6">
          <p className="text-xs text-[#A18F76] mb-1 uppercase tracking-[0.15em]">Layanan</p>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#3B2A1E]">Layanan & Konsultasi</h1>
          <p className="text-sm text-[#A18F76] mt-1">Pilih treatment atau konsultasi sesuai kebutuhan kulit Anda.</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Cari treatment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-[#E1D4C0] bg-[#FFFDF9] text-sm"
          />
        </div>

        {/* Categories */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-[#3B2A1E] mb-3">Kategori Layanan</h2>

          <div className="flex gap-3 mb-4 flex-wrap">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-xs border ${
                selectedCategory === 'all'
                  ? 'bg-[#6C3FD1] text-white border-[#6C3FD1]'
                  : 'bg-[#FFFDF9] text-[#7E6A52] border-[#E1D4C0]'
              }`}
            >
              Semua
            </button>

            {categories.map((c) => (
              <button
                key={c._id}
                onClick={() => setSelectedCategory(c._id)}
                className={`px-4 py-2 rounded-full text-xs border ${
                  selectedCategory === c._id
                    ? 'bg-[#6C3FD1] text-white border-[#6C3FD1]'
                    : 'bg-[#FFFDF9] text-[#7E6A52] border-[#E1D4C0]'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Treatments Grid */}
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTreatments.map((t) => {
              const hasPromo = !!t.promo;
              const finalPrice = hasPromo ? calculateDiscountedPrice(t.base_price, t.promo!) : t.base_price;
              const currentSlide = slideIndex[t._id] || 0;

              return (
                <div key={t._id} className="bg-[#FFFDF9] rounded-2xl border p-5 shadow-sm">
                  
                  {/* FIXED SLIDER HERE */}
                  {t.images && t.images.length > 1 ? (
                    <div className="relative w-full h-40 mb-4 overflow-hidden rounded-xl">
                      <div
                        className="flex h-full transition-transform duration-300"
                        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                      >
                        {t.images.map((img, idx) => (
                          <img
                            key={idx}
                            src={img.url}
                            alt={`${t.name} ${idx + 1}`}
                            className="w-full h-40 object-cover flex-shrink-0 min-w-full"
                          />
                        ))}
                      </div>

                      {/* Buttons */}
                      <button
                        onClick={() =>
                          setSlideIndex((prev) => ({ ...prev, [t._id]: Math.max(0, currentSlide - 1) }))
                        }
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 px-2 rounded-full"
                      >
                        ‹
                      </button>
                      <button
                        onClick={() =>
                          setSlideIndex((prev) => ({
                            ...prev,
                            [t._id]: Math.min(t.images!.length - 1, currentSlide + 1)
                          }))
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 px-2 rounded-full"
                      >
                        ›
                      </button>
                    </div>
                  ) : t.images && t.images.length === 1 ? (
                    <img src={t.images[0].url} className="w-full h-40 rounded-xl object-cover mb-4" />
                  ) : (
                    <div className="w-full h-40 bg-[#FBF6EA] rounded-xl mb-4 flex items-center justify-center">
                      <span className="text-xs text-[#C0B29C]">Tidak ada gambar</span>
                    </div>
                  )}

                  <h3 className="text-base font-semibold text-[#3B2A1E] mb-1">{t.name}</h3>
                  <p className="text-xs text-[#A18F76] mb-3 line-clamp-2">{t.description}</p>

                  <div className="flex items-center justify-between mt-auto">
                    <p className="text-lg font-bold text-[#6C3FD1]">{formatCurrency(finalPrice)}</p>

                    <button
                      onClick={() => router.push(`/user/treatments/${t._id}`)}
                      className="bg-[#6C3FD1] text-white px-4 py-2 rounded-xl text-xs"
                    >
                      Detail
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
