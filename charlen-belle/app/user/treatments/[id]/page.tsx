'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '../../../lib/utils';

type Treatment = {
  _id: string;
  name: string;
  description?: string;
  base_price: number;
  duration_minutes: number;
  category_id?: { _id: string, name: string } | string;
  images?: { url: string }[];
  // New fields for promo pricing
  final_price?: number;
  applied_promo?: {
    _id: string;
    name: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
  };
};

export default function TreatmentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [treatment, setTreatment] = useState<Treatment | null>(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    console.log('Treatment ID:', id);
    if (id) {
      fetchDetail();
    }
  }, [id]);

  async function fetchDetail() {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching from:', `/api/treatments-with-promos/${id}`); // Changed endpoint
      
      const res = await fetch(`/api/treatments-with-promos/${id}`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      console.log('API Response:', data);
      console.log('Treatment data with promos:', data.treatment);
      
      if (data.success) {
        setTreatment(data.treatment);
      } else {
        throw new Error(data.error || 'Failed to fetch treatment');
      }
    } catch (e) {
      console.error('Error fetching treatment:', e);
      setError('Gagal memuat data treatment');
    } finally {
      setLoading(false);
    }
  }

  function addToSelection() {
    const selRaw = localStorage.getItem('selectedTreatments');
    let sel = selRaw ? JSON.parse(selRaw) : [];
    const exists = sel.find((s: any) => s.id === id);
    
    // Store both base price and final price with promo
    const treatmentData = {
      id,
      name: treatment?.name,
      quantity: qty,
      base_price: treatment?.base_price,
      final_price: treatment?.final_price || treatment?.base_price,
      has_promo: !!treatment?.applied_promo,
      promo_details: treatment?.applied_promo
    };
    
    if (exists) {
      exists.quantity += qty;
    } else {
      sel.push(treatmentData);
    }
    localStorage.setItem('selectedTreatments', JSON.stringify(sel));
    router.push('/user/booking');
  }

  // Calculate display price (with promo if available)
  const displayPrice = treatment?.final_price || treatment?.base_price || 0;
  const hasPromo = treatment?.applied_promo;
  const discountAmount = treatment?.base_price && treatment.final_price 
    ? treatment.base_price - treatment.final_price 
    : 0;

  if (loading) return <div className="p-8">Loading...</div>;
  
  if (error) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-2xl shadow">
          <div className="text-red-600 mb-4">{error}</div>
          <button onClick={() => router.back()} className="border py-2 px-4 rounded-lg">Kembali</button>
        </div>
      </div>
    );
  }

  if (!treatment) return <div className="p-8">Treatment tidak ditemukan</div>;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-2xl shadow">
        {treatment.images && treatment.images.length > 0 ? (
          <div className="mb-6">
            <div className="space-y-4">
              {treatment.images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image.url}
                    alt={`${treatment.name} ${index + 1}`}
                    className="w-full h-64 object-cover rounded-lg"
                    onError={(e) => {
                      console.error('Image failed to load:', image.url);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-6 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-gray-400">No images available</span>
          </div>
        )}
        
        <h1 className="text-2xl font-bold mb-2">{treatment.name}</h1>
        <p className="text-sm text-gray-600 mb-4">{treatment.description}</p>
        
        {/* Promo Badge */}
        {hasPromo && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-green-600">🎁</span>
              <div>
                <p className="font-medium text-green-800 text-sm">
                  Promo {treatment.applied_promo!.name}
                </p>
                <p className="text-green-600 text-xs">
                  Diskon {treatment.applied_promo!.discount_type === 'percentage' 
                    ? `${treatment.applied_promo!.discount_value}%` 
                    : `Rp ${treatment.applied_promo!.discount_value.toLocaleString('id-ID')}`
                  }
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between mb-4">
          <div>
            {/* Price Display with Promo */}
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(displayPrice)}
              </p>
              {hasPromo && (
                <p className="text-lg text-gray-500 line-through">
                  {formatCurrency(treatment.base_price)}
                </p>
              )}
            </div>
            
            {/* Discount Savings */}
            {hasPromo && discountAmount > 0 && (
              <p className="text-sm text-green-600 font-medium">
                Hemat {formatCurrency(discountAmount)}
              </p>
            )}
            
            <p className="text-sm text-gray-500">{treatment.duration_minutes} menit</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setQty(q => Math.max(1, q - 1))} 
              className="px-3 py-1 border rounded hover:bg-gray-50 transition-colors"
            >
              -
            </button>
            <div className="px-4 font-medium">{qty}</div>
            <button 
              onClick={() => setQty(q => q + 1)} 
              className="px-3 py-1 border rounded hover:bg-gray-50 transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Total Price */}
        <div className="mb-6 p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total untuk {qty} item:</span>
            <span className="text-lg font-bold text-gray-900">
              {formatCurrency(displayPrice * qty)}
            </span>
          </div>
          {hasPromo && (
            <p className="text-xs text-green-600 text-right">
              Harga sudah termasuk promo
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button 
            onClick={addToSelection} 
            className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            Tambah & Booking
          </button>
          <button 
            onClick={() => router.back()} 
            className="flex-1 border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Kembali
          </button>
        </div>
      </div>
    </div>
  );
}