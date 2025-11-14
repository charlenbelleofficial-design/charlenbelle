'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../components/ui/buttons';
import { formatCurrency } from '../lib/utils';
import toast from 'react-hot-toast';

interface Treatment {
  _id: string;
  name: string;
  description: string;
  duration_minutes: number;
  base_price: number;
  category: string;
  requires_confirmation: boolean;
}

export default function TreatmentsPage() {
  const router = useRouter();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchTreatments();
  }, [selectedCategory]);

  const fetchTreatments = async () => {
    try {
      const url = selectedCategory === 'all' 
        ? '/api/treatments'
        : `/api/treatments?category=${selectedCategory}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      setTreatments(data.treatments);
    } catch (error) {
      toast.error('Gagal memuat data treatment');
    } finally {
      setIsLoading(false);
    }
  };

  const categories = ['all', 'facial', 'laser', 'peeling', 'anti-aging', 'body-treatment'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Layanan Treatment Kami
          </h1>
          <p className="text-lg text-gray-600">
            Pilih treatment yang sesuai dengan kebutuhan Anda
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {category === 'all' ? 'Semua' : category.replace('-', ' ').toUpperCase()}
            </button>
          ))}
        </div>

        {/* Treatments Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {treatments.map((treatment) => (
              <div
                key={treatment._id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all overflow-hidden group"
              >
                <div className="h-48 bg-gradient-to-br from-pink-200 to-purple-200 relative">
                  <div className="absolute inset-0 flex items-center justify-center text-white text-xl font-bold">
                    {treatment.name}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-purple-600 transition-colors">
                    {treatment.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {treatment.description}
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-2xl font-bold text-purple-600">
                        {formatCurrency(treatment.base_price)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {treatment.duration_minutes} menit
                      </p>
                    </div>
                    {treatment.requires_confirmation && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                        Perlu Konfirmasi
                      </span>
                    )}
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => router.push(`/booking?treatment=${treatment._id}`)}
                  >
                    Booking Sekarang
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && treatments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">Tidak ada treatment tersedia</p>
          </div>
        )}
      </div>
    </div>
  );
}