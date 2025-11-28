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
  const [detailSlide, setDetailSlide] = useState(0);

  const router = useRouter();

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  async function fetchDetail() {
    try {
      setLoading(true);
      setError('');

      const res = await fetch(`/api/treatments-with-promos/${id}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      if (data.success) setTreatment(data.treatment);
      else throw new Error(data.error || 'Failed to fetch treatment');
    } catch (e) {
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

    if (exists) exists.quantity += qty;
    else sel.push(treatmentData);

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
      <div className="min-h-screen bg-[#F6F0E3] py-8 sm:py-10">
        <div className="max-w-3xl mx-auto bg-[#FFFDF9] border border-[#E1D4C0] rounded-2xl shadow-sm p-6 sm:p-7">
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
            {error}
          </div>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E1D4C0]"
          >
            ← Kembali
          </button>
        </div>
      </div>
    );
  }

  if (!treatment) {
    return (
      <div className="min-h-screen bg-[#F6F0E3] py-8">
        <div className="max-w-3xl mx-auto bg-[#FFFDF9] border border-[#E1D4C0] rounded-2xl shadow-sm p-6">
          Treatment tidak ditemukan.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F0E3] py-8 sm:py-10">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-[#FFFDF9] border border-[#E1D4C0] rounded-2xl shadow-sm p-5 sm:p-6">

          {/* ======================= */}
          {/*       IMAGE SLIDER      */}
          {/* ======================= */}
          {treatment.images && treatment.images.length > 0 ? (
            <div className="mb-6">
              <div className="relative w-full h-56 overflow-hidden rounded-2xl border border-[#E1D4C0]">
                <div
                  className="flex transition-all duration-300"
                  style={{ transform: `translateX(-${detailSlide * 100}%)` }}
                >
                  {treatment.images.map((image, index) => (
                    <img
                      key={index}
                      src={image.url}
                      alt={`${treatment.name} ${index + 1}`}
                      className="w-full h-56 object-cover flex-shrink-0 min-w-full"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  ))}
                </div>

                {/* Left button */}
                <button
                  onClick={() => setDetailSlide((s) => Math.max(0, s - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/70 px-3 py-1 rounded-full shadow text-lg"
                >
                  ‹
                </button>

                {/* Right button */}
                <button
                  onClick={() =>
                    setDetailSlide((s) =>
                      Math.min((treatment.images?.length || 1) - 1, s + 1)
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/70 px-3 py-1 rounded-full shadow text-lg"
                >
                  ›
                </button>

                {/* Indicators */}
                <div className="absolute bottom-3 w-full flex justify-center gap-2">
                  {treatment.images.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        detailSlide === i ? 'bg-[#6C3FD1]' : 'bg-white/60'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6 h-48 bg-[#FBF6EA] rounded-2xl flex items-center justify-center border border-[#E1D4C0]">
              <span className="text-xs text-[#C0B29C]">Tidak ada gambar</span>
            </div>
          )}

          {/* Title */}
          <h1 className="text-xl sm:text-2xl font-semibold text-[#3B2A1E] mb-2">
            {treatment.name}
          </h1>

          <p className="text-sm text-[#A18F76] mb-4">{treatment.description}</p>

          {/* Promo */}
          {hasPromo && (
            <div className="mb-4 p-3 bg-[#E6F6E3] border border-[#C5E0BF] rounded-2xl">
              <p className="font-medium text-sm text-[#2F855A]">
                Promo {treatment.applied_promo!.name}
              </p>
            </div>
          )}

          {/* Price & Qty */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
            <div>
              <div className="flex items-baseline gap-2">
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

            {/* Qty Selector */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-3 py-1 rounded-xl border bg-[#FFFDF9] text-sm hover:bg-[#FBF6EA]"
              >
                -
              </button>

              <div className="px-4 py-1 rounded-xl bg-[#FBF6EA] border text-sm font-medium">
                {qty}
              </div>

              <button
                onClick={() => setQty((q) => q + 1)}
                className="px-3 py-1 rounded-xl border bg-[#FFFDF9] text-sm hover:bg-[#FBF6EA]"
              >
                +
              </button>
            </div>
          </div>

          {/* Total Price */}
          <div className="mb-6 p-3 rounded-2xl bg-[#FBF6EA] border">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#7E6A52]">Total untuk {qty} treatment:</span>
              <span className="text-base font-semibold">
                {formatCurrency(displayPrice * qty)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={addToSelection}
              className="flex-1 bg-[#6C3FD1] text-white py-3 rounded-xl text-sm font-semibold"
            >
              Tambah & Booking
            </button>

            <button
              onClick={() => router.back()}
              className="flex-1 border py-3 rounded-xl text-sm text-[#7E6A52] bg-[#FFFDF9]"
            >
              Kembali
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
