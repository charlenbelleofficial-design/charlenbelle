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
    description: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Loading states for different actions
  const [submitLoading, setSubmitLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const [deleteLoading] = useState<string | null>(null); // tetap ada, logic tidak diubah

  // Alert states
  const [snackbar, setSnackbar] = useState({
    isVisible: false,
    message: '',
    type: 'info' as SnackbarType,
  });

  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    categoryId: '',
    isLoading: false,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

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

  const showConfirmation = (categoryId: string, categoryName: string) => {
    setConfirmationModal({
      isOpen: true,
      title: 'Hapus Kategori',
      message: `Apakah Anda yakin ingin menghapus kategori "${categoryName}"? Tindakan ini tidak dapat dibatalkan.`,
      categoryId,
      isLoading: false,
    });
  };

  const hideConfirmation = () => {
    setConfirmationModal((prev) => ({ ...prev, isOpen: false }));
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
        body: JSON.stringify(formData),
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
        body: JSON.stringify({ is_active: !current }),
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
    setConfirmationModal((prev) => ({ ...prev, isLoading: true }));
    try {
      const res = await fetch(`/api/admin/treatment-categories/${categoryId}`, {
        method: 'DELETE',
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
      setConfirmationModal((prev) => ({ ...prev, isLoading: false }));
    }
  }

  function editCategory(category: Category) {
    setFormData({
      name: category.name,
      description: category.description || '',
    });
    setEditingId(category._id);
  }

  function resetForm() {
    setFormData({
      name: '',
      description: '',
    });
    setEditingId(null);
  }

  return (
    <div className="p-6 bg-[#F8F4E8] min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-[#3A3530]">
            Kategori Treatment
          </h1>
          <p className="text-sm text-[#8B7B63] mt-1">
            Kelola kategori treatment agar daftar layanan tetap rapi dan terstruktur.
          </p>
        </div>

        {/* Category Form */}
        <form
          onSubmit={handleSubmit}
          className="mb-2 bg-white p-6 md:p-7 rounded-2xl shadow-sm border border-[#E5D7BE]"
        >
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-[#3A3530]">
                {editingId ? 'Edit Kategori' : 'Buat Kategori Baru'}
              </h2>
              {editingId && (
                <p className="text-xs text-[#A08C6A] mt-1">
                  Sedang mengedit kategori yang sudah ada.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 mb-5">
            <div>
              <label className="block text-xs font-semibold text-[#6E5A40] mb-1.5">
                Nama *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg border border-[#C9AE84] bg-[#FFFBF3] px-3 py-2.5 text-sm text-[#3A3530] placeholder:text-[#B9A183] focus:outline-none focus:ring-2 focus:ring-[#E2CBA4] focus:border-[#B48A5A]"
                required
                placeholder="Masukkan nama kategori"
                disabled={submitLoading}
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
                placeholder="Masukkan deskripsi kategori"
                disabled={submitLoading}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={submitLoading || !formData.name.trim()}
              className="inline-flex items-center gap-2 bg-[#B48A5A] text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-[#8F6E45] transition-colors disabled:bg-[#D6C7AF] disabled:text-[#F7F0E4] disabled:cursor-not-allowed"
            >
              {submitLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              )}
              {editingId
                ? submitLoading
                  ? 'Memperbarui...'
                  : 'Perbarui Kategori'
                : submitLoading
                ? 'Membuat...'
                : 'Buat Kategori'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                disabled={submitLoading}
                className="inline-flex items-center gap-2 border border-[#D2C3A7] bg-white text-[#7A5D3A] px-4 py-2.5 rounded-full text-sm font-medium hover:bg-[#F7EEDB] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Batal
              </button>
            )}
          </div>
        </form>

        {/* Categories List */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E5D7BE] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E5D7BE] flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#3A3530]">
                Daftar Kategori
              </h2>
              <p className="text-xs text-[#8B7B63] mt-0.5">
                {categories.length} kategori terdaftar
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-[#8B7B63] flex items-center justify-center gap-2">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#B48A5A]" />
              Memuat kategori...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#FBF5E7]">
                  <tr className="border-b border-[#F1E3CB]">
                    <th className="text-left px-6 py-3 font-semibold text-[#6E5A40]">
                      Nama
                    </th>
                    <th className="text-left px-6 py-3 font-semibold text-[#6E5A40]">
                      Deskripsi
                    </th>
                    <th className="px-6 py-3 font-semibold text-[#6E5A40] text-center">
                      Status
                    </th>
                    <th className="px-6 py-3 font-semibold text-[#6E5A40] text-center">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr
                      key={category._id}
                      className="border-b border-[#F5E9D3] hover:bg-[#FFFAF1] transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-[#3A3530]">
                        {category.name}
                      </td>
                      <td className="px-6 py-4 text-xs md:text-sm text-[#8B7B63]">
                        {category.description || '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() =>
                            handleToggle(category._id, !!category.is_active)
                          }
                          disabled={toggleLoading === category._id}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors inline-flex items-center gap-1 mx-auto ${
                            category.is_active
                              ? 'bg-[#F3FBF4] text-[#2F7C38] border border-[#D1E9D2] hover:bg-[#E4F4E5]'
                              : 'bg-[#FFF5F4] text-[#B42318] border border-[#F3C9C5] hover:bg-[#FDE3E1]'
                          } disabled:opacity-60 disabled:cursor-not-allowed`}
                        >
                          {toggleLoading === category._id && (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                          )}
                          {category.is_active ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-3 justify-center">
                          <button
                            onClick={() => editCategory(category)}
                            disabled={submitLoading || deleteLoading !== null}
                            className="inline-flex items-center gap-1 text-[11px] md:text-xs font-semibold border border-[#D9C6A4] text-[#7A5D3A] bg-white px-3 py-1.5 rounded-full hover:bg-[#F7EEDB] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              showConfirmation(category._id, category.name)
                            }
                            disabled={submitLoading || deleteLoading !== null}
                            className="inline-flex items-center gap-1 text-[11px] md:text-xs font-semibold bg-[#FFF5F4] text-[#B42318] border border-[#F3C9C5] px-3 py-1.5 rounded-full hover:bg-[#FDE3E1] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-10 text-center text-sm text-[#8B7B63]"
                      >
                        Tidak ada kategori ditemukan. Buat kategori pertama Anda di
                        formulir di atas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
