// app/user/treatments/[id]/page.tsx
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
  category_id?: { _id: string; name: string } | string;
  images?: { url: string }[];
  final_price?: number;
  applied_promo?: {
    _id: string;
    name: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
  };
};

export default function TreatmentDetail({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [treatment, setTreatment] = useState<Treatment | null>(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    if (id) {
      fetchDetail();
    }
  }, [id]);

  async function fetchDetail() {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/treatments-with-promos/${id}`);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

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

  const displayPrice = treatment?.final_price || treatment?.base_price || 0;
  const hasPromo = !!treatment?.applied_promo;
  const discountAmount =
    treatment?.base_price && treatment?.final_price
      ? treatment.base_price - treatment.final_price
      : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F0E3]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6C3FD1]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F6F0E3] py-10">
        <div className="max-w-3xl mx-auto bg-[#FFFDF9] border border-[#E1D4C0] rounded-2xl shadow-sm p-6">
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
            {error}
          </div>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E1D4C0] text-sm text-[#7E6A52] bg-[#FFFDF9] hover:bg-[#FBF6EA] transition-colors"
          >
            <span>←</span>
            <span>Kembali</span>
          </button>
        </div>
      </div>
    );
  }

  if (!treatment) {
    return (
      <div className="min-h-screen bg-[#F6F0E3] py-10">
        <div className="max-w-3xl mx-auto bg-[#FFFDF9] border border-[#E1D4C0] rounded-2xl shadow-sm p-6 text-sm text-[#7E6A52]">
          Treatment tidak ditemukan.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F0E3] py-10">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-[#FFFDF9] border border-[#E1D4C0] rounded-2xl shadow-sm p-6">
          {/* Image */}
          {treatment.images && treatment.images.length > 0 ? (
            <div className="mb-6 space-y-4">
              {treatment.images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image.url}
                    alt={`${treatment.name} ${index + 1}`}
                    className="w-full h-56 object-cover rounded-2xl border border-[#E1D4C0]"
                    onError={(e) => {
                      console.error('Image failed to load:', image.url);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="mb-6 h-48 bg-[#FBF6EA] rounded-2xl flex items-center justify-center border border-[#E1D4C0]">
              <span className="text-xs text-[#C0B29C]">
                Tidak ada gambar untuk treatment ini
              </span>
            </div>
          )}

          {/* Title & Description */}
          <h1 className="text-xl font-semibold text-[#3B2A1E] mb-2">
            {treatment.name}
          </h1>
          <p className="text-sm text-[#A18F76] mb-4">{treatment.description}</p>

          {/* Promo Badge */}
          {hasPromo && (
            <div className="mb-4 p-3 bg-[#E6F6E3] border border-[#C5E0BF] rounded-2xl">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-xl bg-[#C5E0BF] flex items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 text-[#2F855A]"
                    fill="currentColor"
                  >
                    <path d="M12 2 3 6v6c0 5 3.8 9.7 9 10 5.2-.3 9-5 9-10V6l-9-4zm0 2.2 6 2.7v4.1c0 4-2.9 7.8-6 8.1-3.1-.3-6-4.1-6-8.1V6.9l6-2.7z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-sm text-[#2F855A]">
                    Promo {treatment.applied_promo!.name}
                  </p>
                  <p className="text-xs text-[#2F855A]">
                    Diskon{' '}
                    {treatment.applied_promo!.discount_type === 'percentage'
                      ? `${treatment.applied_promo!.discount_value}%`
                      : `Rp ${treatment.applied_promo!.discount_value.toLocaleString(
                          'id-ID'
                        )}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Price & Qty */}
          <div className="flex items-center justify-between mb-4 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-[#2F855A]">
                  {formatCurrency(displayPrice)}
                </p>
                {hasPromo && (
                  <p className="text-sm text-[#A18F76] line-through">
                    {formatCurrency(treatment.base_price)}
                  </p>
                )}
              </div>
              {hasPromo && discountAmount > 0 && (
                <p className="text-xs text-[#2F855A] font-medium">
                  Hemat {formatCurrency(discountAmount)}
                </p>
              )}
              <p className="text-xs text-[#A18F76]">
                Durasi ± {treatment.duration_minutes} menit
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-3 py-1 rounded-xl border border-[#E1D4C0] bg-[#FFFDF9] text-sm text-[#3B2A1E] hover:bg-[#FBF6EA] transition-colors"
              >
                -
              </button>
              <div className="px-4 py-1 rounded-xl bg-[#FBF6EA] border border-[#E1D4C0] text-sm font-medium text-[#3B2A1E]">
                {qty}
              </div>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="px-3 py-1 rounded-xl border border-[#E1D4C0] bg-[#FFFDF9] text-sm text-[#3B2A1E] hover:bg-[#FBF6EA] transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Total Price */}
          <div className="mb-6 p-3 rounded-2xl bg-[#FBF6EA] border border-[#E1D4C0]">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#7E6A52]">
                Total untuk {qty} treatment:
              </span>
              <span className="text-base font-semibold text-[#3B2A1E]">
                {formatCurrency(displayPrice * qty)}
              </span>
            </div>
            {hasPromo && (
              <p className="mt-1 text-[11px] text-[#A18F76] text-right">
                Harga sudah termasuk promo.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={addToSelection}
              className="flex-1 bg-[#6C3FD1] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#5b34b3] transition-colors"
            >
              Tambah & Booking
            </button>
            <button
              onClick={() => router.back()}
              className="flex-1 border border-[#E1D4C0] py-3 rounded-xl text-sm text-[#7E6A52] bg-[#FFFDF9] hover:bg-[#FBF6EA] transition-colors"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
