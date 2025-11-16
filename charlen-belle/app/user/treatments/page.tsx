// app/user/treatments/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { formatCurrency } from '../../lib/utils';
import { useRouter } from 'next/navigation';

type Category = { _id: string; name: string; };
type Treatment = {
  _id: string;
  name: string;
  description?: string;
  base_price: number;
  duration_minutes: number;
  category_id?: Category | string;
  requires_confirmation?: boolean;
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
      
      // Filter out categories with undefined _id and ensure valid IDs
      const validCategories = (data.categories || [])
        .filter((c: Category) => c && c._id && c._id !== 'undefined' && c._id !== 'null')
        .map((c: Category) => ({
          ...c,
          _id: String(c._id) // Ensure _id is a string
        }));
      
      console.log('Valid categories:', validCategories); // Debug log
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
      // Validate selectedCategory before making the request
      const url = selectedCategory === 'all' || !selectedCategory || selectedCategory === 'undefined'
        ? '/api/treatments' 
        : `/api/treatments?category=${selectedCategory}`;
      
      console.log('Fetching treatments from:', url); // Debug log
      
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        setTreatments(data.treatments || []);
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

  const handleCategoryClick = (categoryId: string) => {
    // Validate categoryId before setting state
    if (!categoryId || categoryId === 'undefined' || categoryId === 'null') {
      console.warn('Invalid category ID:', categoryId);
      setSelectedCategory('all');
    } else {
      setSelectedCategory(categoryId);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Layanan Treatment</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Categories Section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Kategori Treatment</h2>
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
            <p className="mt-4 text-gray-600">Memuat treatments...</p>
          </div>
        ) : (
          <>
            {treatments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Tidak ada treatment tersedia</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {treatments.map(t => {
                  console.log('Treatment:', t.name, 'ID:', t._id); 
                  return (
                  <div key={t._id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow border">
                    <h3 className="text-xl font-semibold mb-2 text-gray-800">{t.name}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{t.description}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-purple-600">{formatCurrency(t.base_price)}</p>
                        <p className="text-sm text-gray-500">{t.duration_minutes} menit</p>
                      </div>
                      <div>
                        <button 
                          onClick={() => router.push(`/user/treatments/${t._id}`)} 
                          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          Detail
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
                  );
              })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}