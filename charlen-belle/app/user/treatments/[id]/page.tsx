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
};

export default function TreatmentDetail({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the params promise using use()
  const { id } = use(params);
  
  const [treatment, setTreatment] = useState<Treatment | null>(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    console.log('Treatment ID:', id); // Debug log
    if (id) {
      fetchDetail();
    }
  }, [id]);

  async function fetchDetail() {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching from:', `/api/treatments/${id}`); // Debug log
      
      const res = await fetch(`/api/treatments/${id}`);
      
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
    if (exists) {
      exists.quantity += qty;
    } else {
      sel.push({ id, name: treatment?.name, quantity: qty });
    }
    localStorage.setItem('selectedTreatments', JSON.stringify(sel));
    router.push('/user/booking');
  }

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
        <h1 className="text-2xl font-bold mb-2">{treatment.name}</h1>
        <p className="text-sm text-gray-600 mb-4">{treatment.description}</p>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-2xl font-bold">{formatCurrency(treatment.base_price)}</p>
            <p className="text-sm text-gray-500">{treatment.duration_minutes} menit</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-3 py-1 border rounded">-</button>
            <div className="px-4">{qty}</div>
            <button onClick={() => setQty(q => q + 1)} className="px-3 py-1 border rounded">+</button>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={addToSelection} className="flex-1 bg-purple-600 text-white py-2 rounded-lg">Tambah & Booking</button>
          <button onClick={() => router.back()} className="flex-1 border py-2 rounded-lg">Kembali</button>
        </div>
      </div>
    </div>
  );
}