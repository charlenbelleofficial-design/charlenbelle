'use client';
import { useEffect, useState } from 'react';
import { Snackbar, SnackbarType } from '../../components/ui/snackbar';
import { ConfirmationModal } from '../../components/ui/confirmation-modal';

type Category = { 
  _id: string; 
  name: string; 
  description?: string; 
  is_active?: boolean; 
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Loading states for different actions
  const [submitLoading, setSubmitLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Alert states
  const [snackbar, setSnackbar] = useState({
    isVisible: false,
    message: '',
    type: 'info' as SnackbarType
  });

  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    categoryId: '',
    isLoading: false
  });

  useEffect(() => { 
    fetchCategories(); 
  }, []);

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

  const showConfirmation = (categoryId: string, categoryName: string) => {
    setConfirmationModal({
      isOpen: true,
      title: 'Hapus Kategori',
      message: `Apakah Anda yakin ingin menghapus kategori "${categoryName}"? Tindakan ini tidak dapat dibatalkan.`,
      categoryId,
      isLoading: false
    });
  };

  const hideConfirmation = () => {
    setConfirmationModal(prev => ({ ...prev, isOpen: false }));
  };

  async function fetchCategories() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/treatment-categories');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories || []);
      } else {
        throw new Error(data.error || 'Failed to fetch categories');
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      showSnackbar(err.message || 'Gagal memuat kategori', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitLoading) return;

    setSubmitLoading(true);
    try {
      const url = editingId 
        ? `/api/admin/treatment-categories/${editingId}` 
        : '/api/admin/treatment-categories';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save category');
      }

      const data = await res.json();
      showSnackbar(
        editingId ? 'Kategori berhasil diperbarui' : 'Kategori berhasil dibuat', 
        'success'
      );
      resetForm();
      fetchCategories();
    } catch (err: any) {
      console.error('Submit error:', err);
      showSnackbar(err.message || 'Gagal menyimpan kategori', 'error');
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleToggle(id: string, current: boolean) {
    if (toggleLoading) return;

    setToggleLoading(id);
    try {
      const res = await fetch(`/api/admin/treatment-categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !current })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update');
      }

      showSnackbar('Status kategori berhasil diperbarui', 'success');
      fetchCategories();
    } catch (err: any) {
      console.error('Toggle error:', err);
      showSnackbar(err.message || 'Gagal memperbarui status kategori', 'error');
    } finally {
      setToggleLoading(null);
    }
  }

  async function handleDelete(categoryId: string) {
    if (deleteLoading) return;

    setConfirmationModal(prev => ({ ...prev, isLoading: true }));
    try {
      const res = await fetch(`/api/admin/treatment-categories/${categoryId}`, { 
        method: 'DELETE' 
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete');
      }

      showSnackbar('Kategori berhasil dihapus', 'success');
      fetchCategories();
      hideConfirmation();
    } catch (err: any) {
      console.error('Delete error:', err);
      showSnackbar(err.message || 'Gagal menghapus kategori', 'error');
      setConfirmationModal(prev => ({ ...prev, isLoading: false }));
    }
  }

  function editCategory(category: Category) {
    setFormData({
      name: category.name,
      description: category.description || ''
    });
    setEditingId(category._id);
  }

  function resetForm() {
    setFormData({
      name: '',
      description: ''
    });
    setEditingId(null);
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Kelola Kategori Treatment</h1>

        {/* Category Form */}
        <form onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Kategori' : 'Buat Kategori Baru'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nama *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border rounded focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                required
                placeholder="Masukkan nama kategori"
                disabled={submitLoading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Deskripsi</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 border rounded focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                placeholder="Masukkan deskripsi kategori"
                disabled={submitLoading}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              type="submit" 
              disabled={submitLoading}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors disabled:bg-purple-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {editingId ? (submitLoading ? 'Memperbarui...' : 'Perbarui Kategori') : (submitLoading ? 'Membuat...' : 'Buat Kategori')}
            </button>
            {editingId && (
              <button 
                type="button" 
                onClick={resetForm}
                disabled={submitLoading}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Batal
              </button>
            )}
          </div>
        </form>

        {/* Categories List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-600">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mr-2"></div>
              Memuat kategori...
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="border-b">
                  <th className="text-left p-4 font-semibold text-gray-700">Nama</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Deskripsi</th>
                  <th className="p-4 font-semibold text-gray-700">Status</th>
                  <th className="p-4 font-semibold text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(category => (
                  <tr key={category._id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">{category.name}</td>
                    <td className="p-4 text-sm text-gray-600">{category.description || '-'}</td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleToggle(category._id, !!category.is_active)}
                        disabled={toggleLoading === category._id}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 mx-auto ${
                          category.is_active 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {toggleLoading === category._id && (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                        )}
                        {category.is_active ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-3 justify-center">
                        <button 
                          onClick={() => editCategory(category)}
                          disabled={submitLoading || deleteLoading !== null}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button 
                          onClick={() => showConfirmation(category._id, category.name)}
                          disabled={submitLoading || deleteLoading !== null}
                          className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">
                      Tidak ada kategori ditemukan. Buat kategori pertama Anda di atas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={hideConfirmation}
        onConfirm={() => handleDelete(confirmationModal.categoryId)}
        title={confirmationModal.title}
        message={confirmationModal.message}
        variant="danger"
        isLoading={confirmationModal.isLoading}
        confirmText="Ya, Hapus"
        cancelText="Batal"
      />

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