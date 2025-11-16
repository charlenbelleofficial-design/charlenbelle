// app/user/treatments/page.tsx - Updated version
'use client';
import { useEffect, useState } from 'react';
import { formatCurrency } from '../../lib/utils';
import { useRouter } from 'next/navigation';

type Category = { _id: string; name: string; };
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
  type?: 'treatment' | 'consultation'; // Add type field
};

// Consultation data - you can move this to database later
const CONSULTATION_TREATMENT: Treatment = {
  _id: 'consultation',
  name: 'Konsultasi Dokter',
  description: 'Konsultasi dengan dokter spesialis untuk pemeriksaan awal dan rekomendasi treatment',
  base_price: 150000, // Consultation fee
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
        .filter((c: Category) => c && c._id && c._id !== 'undefined' && c._id !== 'null')
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
      const url = selectedCategory === 'all' || !selectedCategory || selectedCategory === 'undefined'
        ? '/api/treatments-with-promos' 
        : `/api/treatments-with-promos?category=${selectedCategory}`;
      
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        // Add consultation to the beginning of treatments list
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
      // For consultation, go directly to booking with consultation data
      const consultationSelection = [{
        id: 'consultation',
        name: treatment.name,
        quantity: 1,
        price: treatment.base_price,
        type: 'consultation'
      }];
      localStorage.setItem('selectedTreatments', JSON.stringify(consultationSelection));
      router.push('/user/booking');
    } else {
      // For regular treatments, go to detail page
      router.push(`/user/treatments/${treatment._id}`);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Layanan & Konsultasi</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Categories Section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Kategori Layanan</h2>
          {categoriesLoading ? (
            <div className="flex gap-3 flex-wrap">
              <div className="px-4 py-2 rounded-full bg-gray-200 animate-pulse">Loading...</div>
            </div>
          ) : (
            <div className="flex gap-3 mb-6 flex-wrap">
              <button 
                onClick={() => setSelectedCategory('all')} 
                className={`px-4 py-2 rounded-full transition-colors ${
                  selectedCategory === 'all' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 border'
                }`}
              >
                Semua
              </button>
              {categories.length > 0 ? (
                categories.map(c => (
                  <button 
                    key={c._id} 
                    onClick={() => handleCategoryClick(c._id)} 
                    className={`px-4 py-2 rounded-full transition-colors ${
                      selectedCategory === c._id 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-100 border'
                    }`}
                  >
                    {c.name}
                  </button>
                ))
              ) : (
                <p className="text-gray-500">Tidak ada kategori tersedia</p>
              )}
            </div>
          )}
        </div>

        {/* Treatments Section */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600">Memuat layanan...</p>
          </div>
        ) : (
          <>
            {treatments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Tidak ada layanan tersedia</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {treatments.map(t => (
                  <div 
                    key={t._id} 
                    className={`bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow border ${
                      t._id === 'consultation' ? 'border-blue-300 border-2' : ''
                    }`}
                  >
                    {/* Consultation Badge */}
                    {t._id === 'consultation' && (
                      <div className="mb-3">
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium">
                          🩺 Konsultasi
                        </span>
                      </div>
                    )}
                    
                    {/* Image section */}
                    {t.images && t.images.length > 0 ? (
                      <img
                        src={t.images[0].url}
                        alt={t.name}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                    ) : t._id === 'consultation' ? (
                      <div className="w-full h-48 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                        <div className="text-center">
                          <div className="text-4xl mb-2">🩺</div>
                          <span className="text-blue-600 text-sm font-medium">Konsultasi Dokter</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                        <span className="text-gray-400 text-sm">No Image</span>
                      </div>
                    )}
                    
                    <h3 className="text-xl font-semibold mb-2 text-gray-800">{t.name}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{t.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        {/* Price display with promo */}
                        {t.promo ? (
                          <div className="space-y-1">
                            <p className="text-sm text-gray-500 line-through">
                              {formatCurrency(t.base_price)}
                            </p>
                            <div className="flex items-center gap-2">
                              <p className="text-2xl font-bold text-green-600">
                                {formatCurrency(calculateDiscountedPrice(t.base_price, t.promo))}
                              </p>
                              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                -{t.promo.discount_type === 'percentage' 
                                  ? `${t.promo.discount_value}%` 
                                  : formatCurrency(t.promo.discount_value)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-2xl font-bold text-purple-600">
                            {formatCurrency(t.base_price)}
                          </p>
                        )}
                        <p className="text-sm text-gray-500">{t.duration_minutes} menit</p>
                      </div>
                      
                      <div>
                        <button 
                          onClick={() => handleBookNow(t)} 
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            t._id === 'consultation'
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-purple-600 text-white hover:bg-purple-700'
                          }`}
                        >
                          {t._id === 'consultation' ? 'Booking' : 'Detail'}
                        </button>
                      </div>
                    </div>
                    
                    {t.requires_confirmation && (
                      <div className="mt-3">
                        <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                          Perlu Konfirmasi Dokter
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}