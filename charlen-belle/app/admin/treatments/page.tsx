// app/admin/treatments/page.tsx
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
    type: 'info'
  });
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

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
      filtered = filtered.filter(treatment =>
        treatment.name.toLowerCase().includes(term) ||
        treatment.description?.toLowerCase().includes(term) ||
        treatment.category_id?.name.toLowerCase().includes(term)
      );
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(treatment =>
        treatment.category_id?._id === categoryFilter
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(treatment =>
        statusFilter === 'active' ? treatment.is_active : !treatment.is_active
      );
    }

    setFilteredTreatments(filtered);
  };

  const showSnackbar = (message: string, type: SnackbarType = 'info') => {
    setSnackbar({
      isVisible: true,
      message,
      type
    });
  };

  const hideSnackbar = () => {
    setSnackbar(prev => ({ ...prev, isVisible: false }));
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to load treatments';
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

  const handleToggleStatus = async (treatmentId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/treatments/${treatmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      const data = await response.json();
      
      if (data.success) {
        fetchTreatments(); // Refresh list
        showSnackbar(
          `Treatment berhasil ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}`,
          'success'
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
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manajemen Treatment</h1>
            <p className="text-gray-600 mt-2">Kelola semua treatment dan layanan</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            + Tambah Treatment
          </button>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cari Treatment
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama, deskripsi, atau kategori..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter Kategori
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              >
                <option value="">Semua Kategori</option>
                {categories
                  .filter(category => category.is_active)
                  .map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))
                }
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              >
                <option value="all">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </div>
          </div>

          {/* Filter Summary and Clear Button */}
          {(searchTerm || categoryFilter || statusFilter !== 'all') && (
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Menampilkan {filteredTreatments.length} dari {treatments.length} treatment
                {searchTerm && (
                  <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    Pencarian: "{searchTerm}"
                  </span>
                )}
                {categoryFilter && (
                  <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                    Kategori: {categories.find(c => c._id === categoryFilter)?.name}
                  </span>
                )}
                {statusFilter !== 'all' && (
                  <span className="ml-2 bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                    Status: {statusFilter === 'active' ? 'Aktif' : 'Nonaktif'}
                  </span>
                )}
              </div>
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Hapus Filter
              </button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p>Error: {error}</p>
            <button
              onClick={fetchTreatments}
              className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
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
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))
          ) : filteredTreatments.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {treatments.length === 0 ? 'Tidak ada treatment' : 'Treatment tidak ditemukan'}
              </h3>
              <p className="text-gray-600 mb-4">
                {treatments.length === 0 
                  ? 'Belum ada treatment yang tersedia.' 
                  : 'Coba ubah kata kunci pencarian atau filter yang Anda gunakan.'
                }
              </p>
              {(searchTerm || categoryFilter || statusFilter !== 'all') && (
                <button
                  onClick={clearFilters}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Tampilkan Semua Treatment
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

// TreatmentCard and TreatmentModal components remain the same...
function TreatmentCard({ treatment, onEdit, onToggleStatus }: any) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      {/* Image Section */}
      {treatment.images && treatment.images.length > 0 ? (
        <div className="mb-4">
          <img
            src={treatment.images[0].url}
            alt={treatment.name}
            className="w-full h-48 object-cover rounded-lg mb-3"
          />
        </div>
      ) : (
        <div className="mb-4 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
          <span className="text-gray-400 text-sm">No Image</span>
        </div>
      )}

      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-gray-900 text-lg">{treatment.name}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          treatment.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {treatment.is_active ? 'Aktif' : 'Nonaktif'}
        </span>
      </div>

      {treatment.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {treatment.description}
        </p>
      )}

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Durasi:</span>
          <span className="font-medium">{treatment.duration_minutes} menit</span>
        </div>
        <div className="flex justify-between">
          <span>Harga:</span>
          <span className="font-medium text-purple-600">
            {formatCurrency(treatment.base_price)}
          </span>
        </div>
        {treatment.category_id && (
          <div className="flex justify-between">
            <span>Kategori:</span>
            <span className="font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
              {treatment.category_id.name}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Konfirmasi:</span>
          <span className="font-medium">
            {treatment.requires_confirmation ? 'Dibutuhkan' : 'Tidak'}
          </span>
        </div>
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={onEdit}
          className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onToggleStatus(treatment._id, treatment.is_active)}
          className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
            treatment.is_active 
              ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {treatment.is_active ? 'Nonaktifkan' : 'Aktifkan'}
        </button>
      </div>
    </div>
  );
}

// TreatmentModal component remains exactly the same as your original code
function TreatmentModal({ treatment, categories, categoriesLoading, onClose, onSuccess, showSnackbar }: any) {
  const [formData, setFormData] = useState({
    name: treatment?.name || '',
    description: treatment?.description || '',
    duration_minutes: treatment?.duration_minutes || 60,
    base_price: treatment?.base_price || 0,
    category_id: treatment?.category_id?._id || '',
    requires_confirmation: treatment?.requires_confirmation || false,
    is_active: treatment?.is_active ?? true,
    images: treatment?.images || []
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, data.image]
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
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_: TreatmentImage, i: number) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = treatment ? `/api/admin/treatments/${treatment._id}` : '/api/admin/treatments';
      const method = treatment ? 'PUT' : 'POST';

      // Prepare data for API - convert empty string to null for category_id
      const submitData = {
        ...formData,
        category_id: formData.category_id || null
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();
      
      if (data.success) {
        onSuccess();
        showSnackbar(
          treatment ? 'Treatment berhasil diupdate' : 'Treatment berhasil ditambahkan',
          'success'
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {treatment ? 'Edit Treatment' : 'Tambah Treatment Baru'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* File Input */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
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
                  <div className="text-gray-600">
                    {uploading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                        <span className="ml-2">Mengupload...</span>
                      </div>
                    ) : (
                      <>
                        <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="mt-2 block text-sm font-medium">
                          Klik untuk upload gambar
                        </span>
                        <span className="text-xs text-gray-500">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Treatment *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deskripsi
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Durasi (menit) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Harga Dasar *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                />
              </div>
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategori
              </label>
              {categoriesLoading ? (
                <div className="flex items-center text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                  Memuat kategori...
                </div>
              ) : (
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                >
                  <option value="">Pilih Kategori (Opsional)</option>
                  {categories
                    .filter((category: TreatmentCategory) => category.is_active)
                    .map((category: TreatmentCategory) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))
                  }
                </select>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Pilih kategori untuk mengelompokkan treatment ini
              </p>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.requires_confirmation}
                  onChange={(e) => setFormData({ ...formData, requires_confirmation: e.target.checked })}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-700">Butuh konfirmasi admin</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-700">Aktif</span>
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-purple-400 flex items-center justify-center gap-2"
              >
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {loading ? 'Menyimpan...' : (treatment ? 'Update' : 'Simpan')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}