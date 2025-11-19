'use client';
import { useEffect, useState } from 'react';
import { Snackbar, SnackbarType } from '../../components/ui/snackbar';

type Treatment = {
  _id: string;
  name: string;
  base_price: number;
};

type Promo = {
  _id: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  is_global: boolean;
  applicable_treatments?: string[];
  created_at: string;
};

type LoadingState = {
  [key: string]: boolean;
};

// ==== ICONS (solid, senada sidebar) ====
const IconEdit = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M5 19h3.5L19 8.5 15.5 5 5 15.5V19Z"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12.5 6.5 17 11"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconTrash = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M5 7h14"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
    />
    <path
      d="M10 10v6M14 10v6"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
    />
    <path
      d="M9 4h6l1 3H8l1-3Z"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7 7h10v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V7Z"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconGift = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect
      x="3"
      y="9"
      width="18"
      height="11"
      rx="1.5"
      stroke="currentColor"
      strokeWidth={1.6}
    />
    <path
      d="M12 4v16M3 9h18"
      stroke="currentColor"
      strokeWidth={1.6}
    />
    <path
      d="M9 4c-.9 0-1.7.6-1.7 1.6 0 .9.7 1.4 1.7 1.4h2.8c1 0 1.7-.5 1.7-1.4C13.5 4.6 12.7 4 11.8 4c-.6 0-1.2.3-1.8.9-.6-.6-1-.9-1.8-.9Z"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconLoader = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <circle
      cx="12"
      cy="12"
      r="8"
      stroke="currentColor"
      strokeWidth={1.6}
      opacity={0.3}
    />
    <path
      d="M20 12a8 8 0 0 0-8-8"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
    />
  </svg>
);

const IconToggleOn = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 32 18" fill="none" {...props}>
    <rect
      x="1"
      y="1"
      width="30"
      height="16"
      rx="8"
      stroke="currentColor"
      strokeWidth={1.6}
    />
    <circle cx="23" cy="9" r="6" fill="currentColor" />
  </svg>
);

const IconToggleOff = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 32 18" fill="none" {...props}>
    <rect
      x="1"
      y="1"
      width="30"
      height="16"
      rx="8"
      stroke="currentColor"
      strokeWidth={1.6}
    />
    <circle cx="9" cy="9" r="6" fill="currentColor" />
  </svg>
);

const IconSearch = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <circle
      cx="11"
      cy="11"
      r="6"
      stroke="currentColor"
      strokeWidth={1.8}
    />
    <path
      d="M16 16l4 4"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </svg>
);

const IconX = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M6 6l12 12M18 6L6 18"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </svg>
);

export default function AdminPromosPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [treatmentsLoading, setTreatmentsLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 0,
    start_date: '',
    end_date: '',
    is_active: true,
    is_global: false,
    applicable_treatments: [] as string[],
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    isVisible: false,
    message: '',
    type: 'success' as SnackbarType,
  });

  useEffect(() => {
    fetchPromos();
    fetchTreatments();
  }, []);

  const showSnackbar = (message: string, type: SnackbarType = 'success') => {
    setSnackbar({ isVisible: true, message, type });
  };

  const hideSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, isVisible: false }));
  };

  async function fetchPromos() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/promos');
      const data = await res.json();
      if (data.success) {
        setPromos(data.promos || []);
      } else {
        throw new Error(data.error || 'Failed to fetch promos');
      }
    } catch (err: any) {
      showSnackbar(err.message || 'Error loading promos', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function fetchTreatments() {
    setTreatmentsLoading(true);
    try {
      const res = await fetch('/api/treatments');
      const data = await res.json();

      console.log('=== DEBUG: FETCHED TREATMENTS ===');
      console.log('Treatments API Response:', data);
      console.log('Treatments Count:', data.treatments?.length);
      if (data.treatments && data.treatments.length > 0) {
        console.log('First treatment ID:', data.treatments[0]._id);
        console.log('First treatment ID type:', typeof data.treatments[0]._id);
      }
      console.log('================================');

      if (data.success) {
        setTreatments(data.treatments || []);
      } else {
        throw new Error(data.error || 'Failed to fetch treatments');
      }
    } catch (err: any) {
      console.error('Error fetching treatments:', err);
    } finally {
      setTreatmentsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);

    try {
      const url = editingId ? `/api/admin/promos/${editingId}` : '/api/admin/promos';
      const method = editingId ? 'PUT' : 'POST';

      console.log('=== DEBUG: PROMO SUBMISSION ===');
      console.log('Form Data:', formData);
      console.log('Selected Treatment IDs:', formData.applicable_treatments);
      console.log('Selected Treatments Count:', formData.applicable_treatments.length);
      console.log('Is Global:', formData.is_global);
      console.log('URL:', url);
      console.log('Method:', method);
      console.log('==============================');

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      console.log('=== DEBUG: API RESPONSE ===');
      console.log('Response Status:', res.status);
      console.log('Response Data:', data);
      console.log('Returned Promo:', data.promo);
      console.log('Returned Treatments:', data.promo?.applicable_treatments);
      console.log('===========================');

      if (!res.ok) throw new Error(data.error || 'Failed to save promo');

      showSnackbar(
        editingId ? 'Promo berhasil diperbarui!' : 'Promo berhasil dibuat!',
        'success',
      );
      resetForm();
      fetchPromos();
    } catch (err: any) {
      console.error('Error saving promo:', err);
      showSnackbar(err.message || 'Error saving promo', 'error');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleToggle(id: string, current: boolean) {
    setLoadingStates((prev) => ({ ...prev, [id]: true }));

    try {
      const res = await fetch(`/api/admin/promos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !current }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');

      showSnackbar(
        `Promo ${!current ? 'berhasil diaktifkan' : 'berhasil dinonaktifkan'}`,
        'success',
      );
      fetchPromos();
    } catch (err: any) {
      showSnackbar(err.message || 'Error updating promo', 'error');
    } finally {
      setLoadingStates((prev) => ({ ...prev, [id]: false }));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Apakah Anda yakin ingin menghapus promo ini?')) return;

    setLoadingStates((prev) => ({ ...prev, [id]: true }));

    try {
      const res = await fetch(`/api/admin/promos/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');

      showSnackbar('Promo berhasil dihapus', 'success');
      fetchPromos();
    } catch (err: any) {
      showSnackbar(err.message || 'Error deleting promo', 'error');
    } finally {
      setLoadingStates((prev) => ({ ...prev, [id]: false }));
    }
  }

  function editPromo(promo: Promo) {
    setFormData({
      name: promo.name,
      description: promo.description || '',
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      start_date: promo.start_date
        ? new Date(promo.start_date).toISOString().split('T')[0]
        : '',
      end_date: promo.end_date
        ? new Date(promo.end_date).toISOString().split('T')[0]
        : '',
      is_active: promo.is_active,
      is_global: promo.is_global || false,
      applicable_treatments: promo.applicable_treatments || [],
    });
    setEditingId(promo._id);

    document.getElementById('promo-form')?.scrollIntoView({ behavior: 'smooth' });
  }

  function resetForm() {
    setFormData({
      name: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      start_date: '',
      end_date: '',
      is_active: true,
      is_global: false,
      applicable_treatments: [],
    });
    setEditingId(null);
  }

  function handleTreatmentToggle(treatmentId: string) {
    setFormData((prev) => ({
      ...prev,
      applicable_treatments: prev.applicable_treatments.includes(treatmentId)
        ? prev.applicable_treatments.filter((id) => id !== treatmentId)
        : [...prev.applicable_treatments, treatmentId],
    }));
  }

  function formatDiscount(promo: Promo) {
    return promo.discount_type === 'percentage'
      ? `${promo.discount_value}%`
      : `Rp ${promo.discount_value.toLocaleString()}`;
  }

  function formatDate(dateString?: string) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID');
  }

  function getApplicableTreatmentsText(promo: Promo) {
    if (promo.is_global) return 'Semua treatment';

    if (!promo.applicable_treatments || promo.applicable_treatments.length === 0) {
      return 'Tidak ada treatment';
    }

    if (promo.applicable_treatments.length === 1) return '1 treatment';
    return `${promo.applicable_treatments.length} treatment`;
  }

  const isFormValid = formData.name.trim() && formData.discount_value >= 0;

  return (
    <div className="p-6 bg-[#F8F4E8] min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-[#3A3530]">
            Pengaturan Promo
          </h1>
          <p className="text-sm text-[#8B7B63] mt-1">
            Buat dan kelola promo untuk treatment di klinik.
          </p>
        </div>

        {/* Promo Form */}
        <div
          id="promo-form"
          className="mb-2 bg-white rounded-2xl shadow-sm border border-[#E5D7BE] p-6 md:p-7"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg font-semibold text-[#3A3530] flex items-center gap-2">
                <span>{editingId ? 'Edit Promo' : 'Buat Promo Baru'}</span>
                {editingId && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FFF3D4] text-[#8F6E45]">
                    Sedang mengedit
                  </span>
                )}
              </h2>
              {editingId && (
                <p className="text-xs text-[#A08C6A] mt-0.5">
                  ID: <span className="font-mono">{editingId}</span>
                </p>
              )}
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 text-xs md:text-sm font-medium text-[#7A5D3A] px-3 py-1.5 rounded-full border border-[#DEC7A3] bg-[#FFF7E7] hover:bg-[#F6E4C5] transition-colors"
              >
                <IconX className="w-4 h-4" />
                <span>Batalkan Edit</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              <div>
                <label className="block text-xs font-semibold text-[#6E5A40] mb-1.5">
                  Nama Promo *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-[#C9AE84] bg-[#FFFBF3] px-3 py-2.5 text-sm text-[#3A3530] placeholder:text-[#B9A183] focus:outline-none focus:ring-2 focus:ring-[#E2CBA4] focus:border-[#B48A5A]"
                  placeholder="Contoh: Promo Akhir Pekan"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E5A40] mb-1.5">
                  Deskripsi
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full rounded-lg border border-[#E0D2BA] bg-[#FFFCF7] px-3 py-2.5 text-sm text-[#3A3530] placeholder:text-[#B9A183] focus:outline-none focus:ring-2 focus:ring-[#E2CBA4] focus:border-[#B48A5A]"
                  placeholder="Contoh: Berlaku untuk treatment wajah tertentu"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E5A40] mb-1.5">
                  Tipe Diskon *
                </label>
                <select
                  value={formData.discount_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discount_type: e.target.value as 'percentage' | 'fixed',
                    })
                  }
                  className="w-full rounded-lg border border-[#C9AE84] bg-[#FFFBF3] px-3 py-2.5 text-sm text-[#3A3530] focus:outline-none focus:ring-2 focus:ring-[#E2CBA4] focus:border-[#B48A5A]"
                  required
                >
                  <option value="percentage">Persentase (%)</option>
                  <option value="fixed">Nominal (Rp)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E5A40] mb-1.5">
                  Nilai Diskon *
                  {formData.discount_type === 'percentage' && ' (%)'}
                  {formData.discount_type === 'fixed' && ' (Rp)'}
                </label>
                <input
                  type="number"
                  value={formData.discount_value}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discount_value: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-[#C9AE84] bg-[#FFFBF3] px-3 py-2.5 text-sm text-[#3A3530] placeholder:text-[#B9A183] focus:outline-none focus:ring-2 focus:ring-[#E2CBA4] focus:border-[#B48A5A]"
                  min="0"
                  step={formData.discount_type === 'percentage' ? 1 : 1000}
                  placeholder={formData.discount_type === 'percentage' ? '10' : '50000'}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E5A40] mb-1.5">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                  className="w-full rounded-lg border border-[#E0D2BA] bg-[#FFFBF7] px-3 py-2.5 text-sm text-[#3A3530] focus:outline-none focus:ring-2 focus:ring-[#E2CBA4] focus:border-[#B48A5A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E5A40] mb-1.5">
                  Tanggal Berakhir
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                  className="w-full rounded-lg border border-[#E0D2BA] bg-[#FFFBF7] px-3 py-2.5 text-sm text-[#3A3530] focus:outline-none focus:ring-2 focus:ring-[#E2CBA4] focus:border-[#B48A5A]"
                />
              </div>
            </div>

            {/* Treatment selection */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-[#6E5A40]">
                Berlaku Untuk Treatment
              </label>

              <div className="flex items-center gap-2 mb-1">
                <input
                  type="checkbox"
                  id="is_global"
                  checked={formData.is_global}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      is_global: e.target.checked,
                      applicable_treatments: e.target.checked
                        ? []
                        : formData.applicable_treatments,
                    })
                  }
                  className="rounded border-[#C9AE84] text-[#B48A5A] focus:ring-[#D7BF96]"
                />
                <label
                  htmlFor="is_global"
                  className="text-sm font-medium text-[#3A3530]"
                >
                  Terapkan ke semua treatment (Global promo)
                </label>
              </div>

              {!formData.is_global && (
                <div className="border border-[#E5D7BE] rounded-xl bg-[#FFFCF7] p-4 max-h-56 overflow-y-auto">
                  {treatmentsLoading ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-[#8B7B63]">
                      <IconLoader className="w-5 h-5 animate-spin" />
                      <span>Memuat daftar treatment...</span>
                    </div>
                  ) : treatments.length === 0 ? (
                    <div className="text-center text-sm text-[#8B7B63]">
                      Belum ada treatment terdaftar.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {treatments.map((treatment) => (
                        <label
                          key={treatment._id}
                          className="flex items-center gap-2 text-sm rounded-lg px-2 py-1 hover:bg-[#F7EEDB] cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.applicable_treatments.includes(
                              treatment._id,
                            )}
                            onChange={() => handleTreatmentToggle(treatment._id)}
                            className="rounded border-[#C9AE84] text-[#B48A5A] focus:ring-[#D7BF96]"
                          />
                          <span className="text-[#3A3530]">{treatment.name}</span>
                          <span className="text-xs text-[#A08C6A]">
                            ({formatCurrency(treatment.base_price)})
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="rounded border-[#C9AE84] text-[#B48A5A] focus:ring-[#D7BF96]"
              />
              <label
                htmlFor="is_active"
                className="text-sm font-medium text-[#3A3530]"
              >
                Promo aktif
              </label>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="submit"
                disabled={!isFormValid || formLoading}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold bg-[#B48A5A] text-white hover:bg-[#8F6E45] disabled:bg-[#D6C7AF] disabled:text-[#F7F0E4] disabled:cursor-not-allowed transition-colors"
              >
                {formLoading ? (
                  <>
                    <IconLoader className="w-4 h-4 animate-spin" />
                    <span>{editingId ? 'Menyimpan perubahan...' : 'Membuat promo...'}</span>
                  </>
                ) : (
                  <>
                    <IconGift className="w-4 h-4" />
                    <span>{editingId ? 'Simpan Perubahan' : 'Buat Promo'}</span>
                  </>
                )}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium border border-[#D2C3A7] bg-white text-[#7A5D3A] hover:bg-[#F7EEDB] transition-colors"
                >
                  <IconX className="w-4 h-4" />
                  <span>Batalkan</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Promos List */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E5D7BE] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E5D7BE] flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#3A3530]">
                Daftar Promo
              </h2>
              <p className="text-xs text-[#8B7B63] mt-0.5">
                {promos.length} promo terdaftar
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-10 flex flex-col items-center justify-center gap-3 text-sm text-[#8B7B63]">
              <IconLoader className="w-7 h-7 animate-spin text-[#B48A5A]" />
              <span>Memuat data promo...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#FBF5E7] text-xs text-[#6E5A40] uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-6 py-3 font-semibold">Promo</th>
                    <th className="text-left px-6 py-3 font-semibold">Diskon</th>
                    <th className="text-left px-6 py-3 font-semibold">Berlaku Untuk</th>
                    <th className="text-left px-6 py-3 font-semibold">Periode</th>
                    <th className="text-left px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {promos.map((promo) => (
                    <tr
                      key={promo._id}
                      className={`border-t border-[#F1E3CB] ${
                        editingId === promo._id
                          ? 'bg-[#FFF9EB]'
                          : 'hover:bg-[#FDF7EB]'
                      }`}
                    >
                      <td className="px-6 py-4 align-top">
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5">
                            <div className="w-8 h-8 rounded-full bg-[#F5E4C6] flex items-center justify-center text-[#8F6E45]">
                              <IconGift className="w-4 h-4" />
                            </div>
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-[#3A3530]">
                                {promo.name}
                              </span>
                              {promo.is_global && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#E6F3E7] text-[#2F7C38]">
                                  Global
                                </span>
                              )}
                              {editingId === promo._id && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FFF3D4] text-[#8F6E45]">
                                  Sedang diedit
                                </span>
                              )}
                            </div>
                            {promo.description && (
                              <div className="text-xs text-[#8B7B63] mt-1">
                                {promo.description}
                              </div>
                            )}
                            <div className="text-[11px] text-[#A08C6A] mt-1">
                              Dibuat:{' '}
                              {new Date(promo.created_at).toLocaleDateString('id-ID')}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 align-top whitespace-nowrap">
                        <div className="font-semibold text-[#3A3530]">
                          {formatDiscount(promo)}
                        </div>
                        <div className="text-[11px] text-[#8B7B63] capitalize">
                          {promo.discount_type === 'percentage'
                            ? 'Diskon persentase'
                            : 'Diskon nominal'}
                        </div>
                      </td>

                      <td className="px-6 py-4 align-top">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#F5E4C6] text-[#6E4E2E]">
                          {getApplicableTreatmentsText(promo)}
                        </span>
                      </td>

                      <td className="px-6 py-4 align-top whitespace-nowrap">
                        <div className="text-xs text-[#3A3530]">
                          {formatDate(promo.start_date)}
                        </div>
                        <div className="text-[11px] text-[#8B7B63]">
                          s/d {formatDate(promo.end_date)}
                        </div>
                      </td>

                      <td className="px-6 py-4 align-top">
                        <button
                          onClick={() => handleToggle(promo._id, promo.is_active)}
                          disabled={loadingStates[promo._id]}
                          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold border border-transparent disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                        >
                          {loadingStates[promo._id] ? (
                            <>
                              <IconLoader className="w-4 h-4 animate-spin text-[#B48A5A]" />
                              <span className="text-[#7A5D3A]">Mengubah...</span>
                            </>
                          ) : promo.is_active ? (
                            <>
                              <IconToggleOn className="w-9 h-5 text-[#2F7C38]" />
                              <span className="text-[#2F7C38]">Aktif</span>
                            </>
                          ) : (
                            <>
                              <IconToggleOff className="w-9 h-5 text-[#C53030]" />
                              <span className="text-[#C53030]">Nonaktif</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="px-6 py-4 align-top">
                        <div className="flex flex-wrap gap-2 justify-center">
                          <button
                            onClick={() => editPromo(promo)}
                            disabled={loadingStates[promo._id]}
                            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold border border-[#D9C6A4] text-[#7A5D3A] bg-white hover:bg-[#F7EEDB] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                          >
                            <IconEdit className="w-4 h-4" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(promo._id)}
                            disabled={loadingStates[promo._id]}
                            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold border border-[#F3C9C5] text-[#B42318] bg-[#FFF5F4] hover:bg-[#FDE3E1] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                          >
                            {loadingStates[promo._id] ? (
                              <>
                                <IconLoader className="w-4 h-4 animate-spin" />
                                <span>Hapus...</span>
                              </>
                            ) : (
                              <>
                                <IconTrash className="w-4 h-4" />
                                <span>Hapus</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {promos.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-10 text-center text-sm text-[#8B7B63]"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#F5E4C6] flex items-center justify-center text-[#8F6E45]">
                            <IconGift className="w-5 h-5" />
                          </div>
                          <p className="text-base font-semibold text-[#3A3530]">
                            Belum ada promo
                          </p>
                          <p className="text-xs text-[#8B7B63]">
                            Tambahkan promo pertama Anda untuk menarik lebih banyak
                            pelanggan.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Snackbar */}
      <Snackbar
        message={snackbar.message}
        type={snackbar.type}
        isVisible={snackbar.isVisible}
        onClose={hideSnackbar}
        duration={4000}
        position="top-center"
      />
    </div>
  );
}

// helper
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}
