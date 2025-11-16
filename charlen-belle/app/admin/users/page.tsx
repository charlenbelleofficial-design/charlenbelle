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

interface CustomerProfile {
  skin_type?: string;
  allergies?: string[];
  medical_conditions?: string[];
  medications?: string[];
  notes?: string;
  completed_at?: string;
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
  const [viewingCustomerProfile, setViewingCustomerProfile] = useState<User | null>(null);

  
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
                            onClick={() => setViewingCustomerProfile(user)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Profil Kesehatan
                          </button>
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

        {viewingCustomerProfile && (
          <CustomerProfileModal
            user={viewingCustomerProfile}
            onClose={() => setViewingCustomerProfile(null)}
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

function CustomerProfileModal({ user, onClose, showSnackbar }: any) {
  const [profile, setProfile] = useState<CustomerProfile>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // New state for input fields
  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [newMedication, setNewMedication] = useState('');

  useEffect(() => {
    fetchCustomerProfile();
  }, [user]);

  const fetchCustomerProfile = async () => {
    try {
      const response = await fetch(`/api/admin/users/${user._id}/customer-profile`);
      const data = await response.json();
      
      if (data.success) {
        setProfile(data.customer_profile || {
          allergies: [],
          medical_conditions: [],
          medications: [],
          skin_type: '',
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error fetching customer profile:', error);
      showSnackbar('Gagal memuat profil kesehatan', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${user._id}/customer-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });

      const data = await response.json();
      
      if (data.success) {
        showSnackbar('Profil kesehatan berhasil diperbarui', 'success');
        setEditing(false);
        fetchCustomerProfile();
        // Clear input fields
        setNewAllergy('');
        setNewCondition('');
        setNewMedication('');
      } else {
        throw new Error(data.error || 'Gagal menyimpan profil');
      }
    } catch (error) {
      console.error('Error saving customer profile:', error);
      showSnackbar('Gagal menyimpan profil kesehatan', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Helper functions for adding/removing items
  const addAllergy = () => {
    if (newAllergy.trim()) {
      setProfile(prev => ({
        ...prev,
        allergies: [...(prev.allergies || []), newAllergy.trim()]
      }));
      setNewAllergy('');
    }
  };

  const removeAllergy = (index: number) => {
    setProfile(prev => ({
      ...prev,
      allergies: (prev.allergies || []).filter((_, i) => i !== index)
    }));
  };

  const addCondition = () => {
    if (newCondition.trim()) {
      setProfile(prev => ({
        ...prev,
        medical_conditions: [...(prev.medical_conditions || []), newCondition.trim()]
      }));
      setNewCondition('');
    }
  };

  const removeCondition = (index: number) => {
    setProfile(prev => ({
      ...prev,
      medical_conditions: (prev.medical_conditions || []).filter((_, i) => i !== index)
    }));
  };

  const addMedication = () => {
    if (newMedication.trim()) {
      setProfile(prev => ({
        ...prev,
        medications: [...(prev.medications || []), newMedication.trim()]
      }));
      setNewMedication('');
    }
  };

  const removeMedication = (index: number) => {
    setProfile(prev => ({
      ...prev,
      medications: (prev.medications || []).filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
          <div className="p-6">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Profil Kesehatan - {user.name}
              </h2>
              <p className="text-gray-600">{user.email}</p>
            </div>
            <div className="flex gap-2">
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit Profil
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setEditing(false);
                      // Reset form when canceling
                      fetchCustomerProfile();
                      setNewAllergy('');
                      setNewCondition('');
                      setNewMedication('');
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400"
                  >
                    {saving ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Skin Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jenis Kulit
              </label>
              {editing ? (
                <select
                  value={profile.skin_type || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, skin_type: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                >
                  <option value="">Pilih jenis kulit</option>
                  <option value="normal">Normal</option>
                  <option value="oily">Berminyak</option>
                  <option value="dry">Kering</option>
                  <option value="combination">Kombinasi</option>
                  <option value="sensitive">Sensitif</option>
                </select>
              ) : (
                <p className="text-lg">{profile.skin_type || 'Belum diisi'}</p>
              )}
            </div>

            {/* Allergies */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alergi
              </label>
              {editing ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newAllergy}
                      onChange={(e) => setNewAllergy(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      placeholder="Tambahkan alergi (contoh: Latex, Lidocaine)"
                    />
                    <button
                      onClick={addAllergy}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Tambah
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(profile.allergies || []).map((allergy: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm"
                      >
                        {allergy}
                        <button
                          onClick={() => removeAllergy(index)}
                          className="text-red-600 hover:text-red-800 text-lg font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(profile.allergies || []).length > 0 ? (
                    (profile.allergies || []).map((allergy: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm"
                      >
                        {allergy}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">Tidak ada alergi yang tercatat</p>
                  )}
                </div>
              )}
            </div>

            {/* Medical Conditions */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kondisi Medis
              </label>
              {editing ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCondition}
                      onChange={(e) => setNewCondition(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCondition())}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      placeholder="Tambahkan kondisi medis (contoh: Diabetes, Hipertensi)"
                    />
                    <button
                      onClick={addCondition}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Tambah
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(profile.medical_conditions || []).map((condition: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm"
                      >
                        {condition}
                        <button
                          onClick={() => removeCondition(index)}
                          className="text-yellow-600 hover:text-yellow-800 text-lg font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(profile.medical_conditions || []).length > 0 ? (
                    (profile.medical_conditions || []).map((condition: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm"
                      >
                        {condition}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">Tidak ada kondisi medis yang tercatat</p>
                  )}
                </div>
              )}
            </div>

            {/* Medications */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Obat yang Dikonsumsi
              </label>
              {editing ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMedication}
                      onChange={(e) => setNewMedication(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMedication())}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      placeholder="Tambahkan obat (contoh: Warfarin, Aspirin)"
                    />
                    <button
                      onClick={addMedication}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Tambah
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(profile.medications || []).map((medication: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                      >
                        {medication}
                        <button
                          onClick={() => removeMedication(index)}
                          className="text-green-600 hover:text-green-800 text-lg font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(profile.medications || []).length > 0 ? (
                    (profile.medications || []).map((medication: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                      >
                        {medication}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">Tidak ada obat yang tercatat</p>
                  )}
                </div>
              )}
            </div>

            {/* Additional Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catatan Tambahan
              </label>
              {editing ? (
                <textarea
                  value={profile.notes || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, notes: e.target.value }))}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  placeholder="Informasi tambahan tentang kesehatan..."
                />
              ) : (
                <p className="text-lg">{profile.notes || 'Tidak ada catatan tambahan'}</p>
              )}
            </div>

            {/* Profile Completion Status */}
            {profile.completed_at && (
              <div className="md:col-span-2">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    Profil kesehatan terakhir diperbarui: {new Date(profile.completed_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}