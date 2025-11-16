// app/admin/users/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
// import AdminLayout from '../../components/layouts/admin-layout';
import UnifiedLayout from '../../components/layouts/unified-layout';
import { Snackbar, SnackbarType } from '../../components/ui/snackbar';
import { ConfirmationModal } from '../../components/ui/confirmation-modal';
import { formatDate } from '../../lib/utils';

interface User {
  _id: string;
  name: string;
  email: string;
  phone_number?: string;
  role: 'customer' | 'kasir' | 'admin' | 'superadmin' | 'doctor';
  created_at: string;
}

interface SnackbarState {
  isVisible: boolean;
  message: string;
  type: SnackbarType;
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    isVisible: false,
    message: '',
    type: 'info'
  });
  
  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'danger' as 'danger' | 'warning' | 'info',
    isLoading: false
  });

  useEffect(() => {
    fetchUsers();
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

  const showConfirmation = (title: string, message: string, onConfirm: () => void, variant: 'danger' | 'warning' | 'info' = 'danger') => {
    setConfirmationModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      variant,
      isLoading: false
    });
  };

  const hideConfirmation = () => {
    setConfirmationModal(prev => ({ ...prev, isOpen: false }));
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
      } else {
        showSnackbar('Gagal memuat data user: ' + data.error, 'error');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showSnackbar('Terjadi kesalahan saat memuat data user', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    showConfirmation(
      'Hapus User',
      `Apakah Anda yakin ingin menghapus user "${userName}"? Tindakan ini tidak dapat dibatalkan.`,
      async () => {
        setConfirmationModal(prev => ({ ...prev, isLoading: true }));
        
        try {
          const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE'
          });

          const data = await response.json();
          
          if (data.success) {
            fetchUsers(); // Refresh list
            showSnackbar('User berhasil dihapus', 'success');
          } else {
            showSnackbar('Gagal menghapus user: ' + data.error, 'error');
          }
        } catch (error) {
          console.error('Error deleting user:', error);
          showSnackbar('Terjadi kesalahan saat menghapus user', 'error');
        } finally {
          hideConfirmation();
        }
      },
      'danger'
    );
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'kasir': return 'bg-blue-100 text-blue-800';
      case 'doctor': return 'bg-green-100 text-green-800';
      case 'customer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'superadmin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'kasir': return 'Kasir';
      case 'doctor': return 'Dokter';
      case 'customer': return 'Customer';
      default: return role;
    }
  };

  return (
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manajemen User</h1>
            <p className="text-gray-600 mt-2">Kelola semua user dan staff</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            + Tambah User
          </button>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p className="mt-2 text-gray-600">Memuat data user...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal Bergabung
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                          {user.phone_number && (
                            <div className="text-sm text-gray-500">
                              {user.phone_number}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                          {getRoleText(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          {user.role !== 'superadmin' && (
                            <button
                              onClick={() => handleDeleteUser(user._id, user.name)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add/Edit User Modal */}
        {(showAddModal || editingUser) && (
          <UserModal
            user={editingUser}
            onClose={() => {
              setShowAddModal(false);
              setEditingUser(null);
            }}
            onSuccess={() => {
              setShowAddModal(false);
              setEditingUser(null);
              fetchUsers();
            }}
            showSnackbar={showSnackbar}
          />
        )}

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={confirmationModal.isOpen}
          onClose={hideConfirmation}
          onConfirm={confirmationModal.onConfirm}
          title={confirmationModal.title}
          message={confirmationModal.message}
          variant={confirmationModal.variant}
          isLoading={confirmationModal.isLoading}
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

function UserModal({ user, onClose, onSuccess, showSnackbar }: any) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
    role: user?.role || 'customer',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = user ? `/api/admin/users/${user._id}` : '/api/admin/users';
      const method = user ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        onSuccess();
        showSnackbar(
          user ? 'User berhasil diupdate' : 'User berhasil ditambahkan',
          'success'
        );
      } else {
        showSnackbar(`Gagal: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      showSnackbar('Terjadi kesalahan saat menyimpan user', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {user ? 'Edit User' : 'Tambah User Baru'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama
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
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nomor Telepon
              </label>
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              >
                <option value="customer">Customer</option>
                <option value="kasir">Kasir</option>
                <option value="admin">Admin</option>
                <option value="doctor">Dokter</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>

            {!user && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                />
              </div>
            )}

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
                className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-purple-400"
              >
                {loading ? 'Menyimpan...' : (user ? 'Update' : 'Simpan')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}