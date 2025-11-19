'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Snackbar, SnackbarType } from '../../components/ui/snackbar';
import { formatCurrency } from '../../lib/utils';

interface TreatmentImage {
  url: string;
  public_id: string;
}

interface TreatmentCategory {
  _id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

interface Treatment {
  _id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  base_price: number;
  category_id?: { _id: string; name: string };
  requires_confirmation: boolean;
  is_active: boolean;
  images: TreatmentImage[];
  created_at: string;
}

interface SnackbarState {
  isVisible: boolean;
  message: string;
  type: SnackbarType;
}

// ==== ICONS (solid / senada tema cream–gold) ====
const IconSearch = (props: any) => (
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

const IconPlus = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M12 5v14M5 12h14"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </svg>
);

const IconX = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M6 6l12 12M18 6L6 18"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </svg>
);

const IconPhoto = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect
      x="3"
      y="4"
      width="18"
      height="16"
      rx="2"
      stroke="currentColor"
      strokeWidth={1.6}
    />
    <path
      d="M9 11l2 2.5 2-2.5 4 5H7l2-3.5Z"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="9"
      cy="8"
      r="1.4"
      stroke="currentColor"
      strokeWidth={1.4}
    />
  </svg>
);

export default function AdminTreatmentsPage() {
  const { data: session } = useSession();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [filteredTreatments, setFilteredTreatments] = useState<Treatment[]>([]);
  const [categories, setCategories] = useState<TreatmentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    isVisible: false,
    message: '',
    type: 'info',
  });

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(
    'all',
  );

  useEffect(() => {
    fetchTreatments();
    fetchCategories();
  }, []);

  // Filter treatments whenever search term, category, status, or treatments change
  useEffect(() => {
    filterTreatments();
  }, [searchTerm, categoryFilter, statusFilter, treatments]);

  const filterTreatments = () => {
    let filtered = treatments;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (treatment) =>
          treatment.name.toLowerCase().includes(term) ||
          treatment.description?.toLowerCase().includes(term) ||
          treatment.category_id?.name.toLowerCase().includes(term),
      );
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(
        (treatment) => treatment.category_id?._id === categoryFilter,
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((treatment) =>
        statusFilter === 'active' ? treatment.is_active : !treatment.is_active,
      );
    }

    setFilteredTreatments(filtered);
  };

  const showSnackbar = (message: string, type: SnackbarType = 'info') => {
    setSnackbar({
      isVisible: true,
      message,
      type,
    });
  };

  const hideSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, isVisible: false }));
  };

  const fetchTreatments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/treatments');

      if (!response.ok) {
        if (response.status === 405) {
          throw new Error('Method not allowed. Please check the API route.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setTreatments(data.treatments);
        setFilteredTreatments(data.treatments); // Initialize filtered treatments
      } else {
        throw new Error(data.error || 'Failed to fetch treatments');
      }
    } catch (error) {
      console.error('Error fetching treatments:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load treatments';
      setError(errorMessage);
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await fetch('/api/admin/treatment-categories');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setCategories(data.categories || []);
      } else {
        throw new Error(data.error || 'Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      showSnackbar('Gagal memuat kategori treatment', 'error');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleToggleStatus = async (
    treatmentId: string,
    currentStatus: boolean,
  ) => {
    try {
      const response = await fetch(`/api/admin/treatments/${treatmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      const data = await response.json();

      if (data.success) {
        fetchTreatments(); // Refresh list
        showSnackbar(
          `Treatment berhasil ${
            !currentStatus ? 'diaktifkan' : 'dinonaktifkan'
          }`,
          'success',
        );
      } else {
        showSnackbar(`Gagal mengupdate status: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('Error updating treatment:', error);
      showSnackbar('Terjadi kesalahan saat mengupdate status', 'error');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setStatusFilter('all');
  };

  return (
    <div className="p-6 bg-[#F8F4E8] min-h-screen">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-[#3A3530]">
            Manajemen Treatment
          </h1>
          <p className="text-sm text-[#8B7B63] mt-1">
            Kelola semua treatment dan layanan klinik.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 bg-[#B48A5A] text-white px-4 py-2.5 rounded-full text-sm font-semibold hover:bg-[#8F6E45] transition-colors"
        >
          <IconPlus className="w-4 h-4" />
          <span>Tambah Treatment</span>
        </button>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-2xl p-6 md:p-7 shadow-sm border border-[#E5D7BE] mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Input */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-[#6E5A40] mb-1.5">
              Cari Treatment
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Cari berdasarkan nama, deskripsi, atau kategori..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-[#C9AE84] rounded-full pl-10 pr-4 py-2.5 text-sm bg-[#FFFBF3] text-[#3A3530] placeholder:text-[#B9A183] focus:border-[#B48A5A] focus:ring-2 focus:ring-[#E2CBA4] focus:outline-none"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#B48A5A]">
                <IconSearch className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-semibold text-[#6E5A40] mb-1.5">
              Filter Kategori
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full border border-[#C9AE84] rounded-full px-3 py-2.5 text-sm bg-[#FFFBF3] text-[#3A3530] focus:border-[#B48A5A] focus:ring-2 focus:ring-[#E2CBA4] focus:outline-none"
            >
              <option value="">Semua Kategori</option>
              {categories
                .filter((category) => category.is_active)
                .map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-[#6E5A40] mb-1.5">
              Filter Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')
              }
              className="w-full border border-[#C9AE84] rounded-full px-3 py-2.5 text-sm bg-[#FFFBF3] text-[#3A3530] focus:border-[#B48A5A] focus:ring-2 focus:ring-[#E2CBA4] focus:outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>
        </div>

        {/* Filter Summary and Clear Button */}
        {(searchTerm || categoryFilter || statusFilter !== 'all') && (
          <div className="flex flex-wrap justify-between items-center gap-3 mt-4 pt-4 border-t border-[#E5D7BE]">
            <div className="text-xs md:text-sm text-[#8B7B63] flex flex-wrap gap-2 items-center">
              <span>
                Menampilkan {filteredTreatments.length} dari {treatments.length}{' '}
                treatment
              </span>
              {searchTerm && (
                <span className="inline-flex items-center gap-1 bg-[#F5E4C6] text-[#6E4E2E] px-2.5 py-0.5 rounded-full text-[11px]">
                  <IconSearch className="w-3.5 h-3.5" />
                  <span>Pencarian: "{searchTerm}"</span>
                </span>
              )}
              {categoryFilter && (
                <span className="inline-flex items-center gap-1 bg-[#E6F3E7] text-[#2F7C38] px-2.5 py-0.5 rounded-full text-[11px]">
                  <span>
                    Kategori:{' '}
                    {categories.find((c) => c._id === categoryFilter)?.name}
                  </span>
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-[#FFF3D4] text-[#8F6E45] px-2.5 py-0.5 rounded-full text-[11px]">
                  <span>
                    Status:{' '}
                    {statusFilter === 'active' ? 'Aktif' : 'Nonaktif'}
                  </span>
                </span>
              )}
            </div>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs md:text-sm text-[#7A5D3A] hover:text-[#5B422C]"
            >
              <IconX className="w-4 h-4" />
              <span>Hapus Filter</span>
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-[#FDE8E8] border border-[#F5B5B5] text-[#B42318] px-4 py-3 rounded-xl mb-6 text-sm">
          <p>Error: {error}</p>
          <button
            onClick={fetchTreatments}
            className="mt-3 inline-flex items-center gap-2 bg-[#B42318] text-white px-3 py-1.5 rounded-full text-xs hover:bg-[#8F1B13] transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Treatments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5D7BE] animate-pulse"
            >
              <div className="h-44 bg-[#F3E6D4] rounded-xl mb-4" />
              <div className="h-4 bg-[#F1E3CB] rounded w-3/4 mb-3" />
              <div className="h-3 bg-[#F1E3CB] rounded w-1/2 mb-2" />
              <div className="h-3 bg-[#F5E9D6] rounded w-1/3" />
            </div>
          ))
        ) : filteredTreatments.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="w-12 h-12 rounded-full bg-[#F5E4C6] flex items-center justify-center text-[#8F6E45] mx-auto mb-4">
              <IconSearch className="w-6 h-6" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-[#3A3530] mb-2">
              {treatments.length === 0
                ? 'Tidak ada treatment'
                : 'Treatment tidak ditemukan'}
            </h3>
            <p className="text-sm text-[#8B7B63] mb-4 max-w-md mx-auto">
              {treatments.length === 0
                ? 'Belum ada treatment yang tersedia. Tambahkan treatment baru untuk mulai mengelola layanan klinik.'
                : 'Coba ubah kata kunci pencarian atau filter yang Anda gunakan.'}
            </p>
            {(searchTerm || categoryFilter || statusFilter !== 'all') && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 bg-[#B48A5A] text-white px-4 py-2.5 rounded-full text-sm font-semibold hover:bg-[#8F6E45] transition-colors"
              >
                <IconSearch className="w-4 h-4" />
                <span>Tampilkan Semua Treatment</span>
              </button>
            )}
          </div>
        ) : (
          filteredTreatments.map((treatment) => (
            <TreatmentCard
              key={treatment._id}
              treatment={treatment}
              onEdit={() => setEditingTreatment(treatment)}
              onToggleStatus={handleToggleStatus}
            />
          ))
        )}
      </div>

      {/* Add/Edit Treatment Modal */}
      {(showAddModal || editingTreatment) && (
        <TreatmentModal
          treatment={editingTreatment}
          categories={categories}
          categoriesLoading={categoriesLoading}
          onClose={() => {
            setShowAddModal(false);
            setEditingTreatment(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setEditingTreatment(null);
            fetchTreatments();
          }}
          showSnackbar={showSnackbar}
        />
      )}

      {/* Snackbar Component */}
      <Snackbar
        message={snackbar.message}
        type={snackbar.type}
        isVisible={snackbar.isVisible}
        onClose={hideSnackbar}
        duration={snackbar.type === 'error' ? 7000 : 5000}
        position="top-center"
      />
    </div>
  );
}

// Card Treatment – styling cream–gold
function TreatmentCard({ treatment, onEdit, onToggleStatus }: any) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5D7BE] hover:shadow-md transition-shadow flex flex-col">
      {/* Image Section */}
      {treatment.images && treatment.images.length > 0 ? (
        <div className="mb-4">
          <img
            src={treatment.images[0].url}
            alt={treatment.name}
            className="w-full h-44 object-cover rounded-xl mb-2"
          />
        </div>
      ) : (
        <div className="mb-4 h-44 bg-[#F5E4C6] rounded-xl flex flex-col items-center justify-center text-center">
          <IconPhoto className="w-8 h-8 text-[#B48A5A] mb-1" />
          <span className="text-xs text-[#8B7B63]">Belum ada gambar</span>
        </div>
      )}

      <div className="flex justify-between items-start mb-3 gap-2">
        <h3 className="font-semibold text-[#3A3530] text-base md:text-lg">
          {treatment.name}
        </h3>
        <span
          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
            treatment.is_active
              ? 'bg-[#F3FBF4] text-[#2F7C38] border border-[#D1E9D2]'
              : 'bg-[#FFF5F4] text-[#B42318] border border-[#F3C9C5]'
          }`}
        >
          {treatment.is_active ? 'Aktif' : 'Nonaktif'}
        </span>
      </div>

      {treatment.description && (
        <p className="text-[#8B7B63] text-sm mb-4 line-clamp-2">
          {treatment.description}
        </p>
      )}

      <div className="space-y-2 text-xs md:text-sm text-[#6E5A40] flex-1">
        <div className="flex justify-between">
          <span>Durasi</span>
          <span className="font-semibold text-[#3A3530]">
            {treatment.duration_minutes} menit
          </span>
        </div>
        <div className="flex justify-between">
          <span>Harga</span>
          <span className="font-semibold text-[#B48A5A]">
            {formatCurrency(treatment.base_price)}
          </span>
        </div>
        {treatment.category_id && (
          <div className="flex justify-between items-center">
            <span>Kategori</span>
            <span className="font-semibold bg-[#F5E4C6] text-[#6E4E2E] px-2.5 py-1 rounded-full text-[11px]">
              {treatment.category_id.name}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Konfirmasi</span>
          <span className="font-semibold text-[#3A3530]">
            {treatment.requires_confirmation ? 'Dibutuhkan' : 'Tidak'}
          </span>
        </div>
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t border-[#F1E3CB]">
        <button
          onClick={onEdit}
          className="flex-1 border border-[#D9C6A4] bg-white text-[#7A5D3A] py-2 rounded-full text-xs md:text-sm font-semibold hover:bg-[#F7EEDB] transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onToggleStatus(treatment._id, treatment.is_active)}
          className={`flex-1 py-2 rounded-full text-xs md:text-sm font-semibold transition-colors ${
            treatment.is_active
              ? 'bg-[#FFF5F4] text-[#B42318] border border-[#F3C9C5] hover:bg-[#FDE3E1]'
              : 'bg-[#6BAF7A] text-white hover:bg-[#4F9160]'
          }`}
        >
          {treatment.is_active ? 'Nonaktifkan' : 'Aktifkan'}
        </button>
      </div>
    </div>
  );
}

// Modal Treatment – logic sama, styling cream–gold
function TreatmentModal({
  treatment,
  categories,
  categoriesLoading,
  onClose,
  onSuccess,
  showSnackbar,
}: any) {
  const [formData, setFormData] = useState({
    name: treatment?.name || '',
    description: treatment?.description || '',
    duration_minutes: treatment?.duration_minutes || 60,
    base_price: treatment?.base_price || 0,
    category_id: treatment?.category_id?._id || '',
    requires_confirmation: treatment?.requires_confirmation || false,
    is_active: treatment?.is_active ?? true,
    images: treatment?.images || [],
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);

      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      const data = await response.json();

      if (data.success) {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, data.image],
        }));
        showSnackbar('Gambar berhasil diupload', 'success');
      } else {
        showSnackbar('Gagal mengupload gambar', 'error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showSnackbar('Terjadi kesalahan saat mengupload gambar', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        showSnackbar('Hanya file gambar yang diizinkan', 'error');
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showSnackbar('Ukuran file maksimal 5MB', 'error');
        return;
      }

      handleImageUpload(file);
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_: TreatmentImage, i: number) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = treatment
        ? `/api/admin/treatments/${treatment._id}`
        : '/api/admin/treatments';
      const method = treatment ? 'PUT' : 'POST';

      // Prepare data for API - convert empty string to null for category_id
      const submitData = {
        ...formData,
        category_id: formData.category_id || null,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        showSnackbar(
          treatment
            ? 'Treatment berhasil diupdate'
            : 'Treatment berhasil ditambahkan',
          'success',
        );
      } else {
        showSnackbar(`Gagal: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('Error saving treatment:', error);
      showSnackbar('Terjadi kesalahan saat menyimpan treatment', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 md:p-7">
          <h2 className="text-lg md:text-xl font-semibold text-[#3A3530] mb-4">
            {treatment ? 'Edit Treatment' : 'Tambah Treatment Baru'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image Upload Section */}
            <div>
              <label className="block text-xs font-semibold text-[#6E5A40] mb-1.5">
                Gambar Treatment
              </label>

              {/* Image Preview */}
              {formData.images.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {formData.images.map((image: TreatmentImage, index: number) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.url}
                        alt={`Treatment ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-[#B42318] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* File Input */}
              <div className="border-2 border-dashed border-[#D7C3A3] rounded-xl p-4 text-center bg-[#FFFBF3]">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className={`cursor-pointer block ${
                    uploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <div className="text-[#8B7B63] flex flex-col items-center gap-1">
                    {uploading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#B48A5A]" />
                        <span className="text-sm">Mengupload...</span>
                      </div>
                    ) : (
                      <>
                        <IconPhoto className="mx-auto h-8 w-8 text-[#B48A5A]" />
                        <span className="mt-1 block text-sm font-medium text-[#3A3530]">
                          Klik untuk upload gambar
                        </span>
                        <span className="text-[11px] text-[#A08C6A]">
                          PNG, JPG, JPEG (max. 5MB)
                        </span>
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Basic Information */}
            <div>
              <label className="block text-xs font-semibold text-[#6E5A40] mb-1.5">
                Nama Treatment *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full border border-[#C9AE84] rounded-lg px-3 py-2.5 text-sm bg-[#FFFBF3] text-[#3A3530] focus:border-[#B48A5A] focus:ring-2 focus:ring-[#E2CBA4] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6E5A40] mb-1.5">
                Deskripsi
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full border border-[#E0D2BA] rounded-lg px-3 py-2.5 text-sm bg-[#FFFCF7] text-[#3A3530] focus:border-[#B48A5A] focus:ring-2 focus:ring-[#E2CBA4] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#6E5A40] mb-1.5">
                  Durasi (menit) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.duration_minutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration_minutes: parseInt(e.target.value),
                    })
                  }
                  className="w-full border border-[#C9AE84] rounded-lg px-3 py-2.5 text-sm bg-[#FFFBF3] text-[#3A3530] focus:border-[#B48A5A] focus:ring-2 focus:ring-[#E2CBA4] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E5A40] mb-1.5">
                  Harga Dasar *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.base_price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      base_price: parseInt(e.target.value),
                    })
                  }
                  className="w-full border border-[#C9AE84] rounded-lg px-3 py-2.5 text-sm bg-[#FFFBF3] text-[#3A3530] focus:border-[#B48A5A] focus:ring-2 focus:ring-[#E2CBA4] focus:outline-none"
                />
              </div>
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-xs font-semibold text-[#6E5A40] mb-1.5">
                Kategori
              </label>
              {categoriesLoading ? (
                <div className="flex items-center text-[#8B7B63] gap-2 text-sm">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#B48A5A]" />
                  <span>Memuat kategori...</span>
                </div>
              ) : (
                <select
                  value={formData.category_id}
                  onChange={(e) =>
                    setFormData({ ...formData, category_id: e.target.value })
                  }
                  className="w-full border border-[#C9AE84] rounded-lg px-3 py-2.5 text-sm bg-[#FFFBF3] text-[#3A3530] focus:border-[#B48A5A] focus:ring-2 focus:ring-[#E2CBA4] focus:outline-none"
                >
                  <option value="">Pilih Kategori (Opsional)</option>
                  {categories
                    .filter((category: TreatmentCategory) => category.is_active)
                    .map((category: TreatmentCategory) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                </select>
              )}
              <p className="text-[11px] text-[#A08C6A] mt-1">
                Pilih kategori untuk mengelompokkan treatment ini
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.requires_confirmation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      requires_confirmation: e.target.checked,
                    })
                  }
                  className="rounded border-[#C9AE84] text-[#B48A5A] focus:ring-[#D7BF96]"
                />
                <span className="ml-2 text-xs md:text-sm text-[#3A3530]">
                  Butuh konfirmasi admin
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      is_active: e.target.checked,
                    })
                  }
                  className="rounded border-[#C9AE84] text-[#B48A5A] focus:ring-[#D7BF96]"
                />
                <span className="ml-2 text-xs md:text-sm text-[#3A3530]">
                  Aktif
                </span>
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-[#D2C3A7] bg-white text-[#7A5D3A] py-2.5 rounded-full text-sm font-semibold hover:bg-[#F7EEDB] transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#B48A5A] text-white py-2.5 rounded-full text-sm font-semibold hover:bg-[#8F6E45] transition-colors disabled:bg-[#D6C7AF] disabled:text-[#F7F0E4] flex items-center justify-center gap-2"
              >
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                )}
                {loading
                  ? 'Menyimpan...'
                  : treatment
                  ? 'Update'
                  : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
