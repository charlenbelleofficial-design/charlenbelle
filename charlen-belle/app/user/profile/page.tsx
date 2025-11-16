// app/user/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Snackbar, SnackbarType } from '../../components/ui/snackbar';

interface UserProfile {
  name: string;
  email: string;
  phone_number?: string;
  role: string;
  created_at?: string;
  customer_profile?: {
    allergies: string[];
    skin_type: string;
    medical_conditions: string[];
    medications: string[];
    notes: string;
    completed_at?: string;
  };
}

export default function UserProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingCustomerProfile, setEditingCustomerProfile] = useState(false);
  const [snackbar, setSnackbar] = useState({
    isVisible: false,
    message: '',
    type: 'info' as SnackbarType
  });

  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    phone_number: '',
    role: '',
    created_at: '',
    customer_profile: {
      allergies: [],
      skin_type: '',
      medical_conditions: [],
      medications: [],
      notes: ''
    }
  });

  // State for customer profile inputs
  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [newMedication, setNewMedication] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/user/login');
      return;
    }
    
    if (session) {
      fetchProfile();
    }
  }, [session, status, router]);

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

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      const data = await response.json();
      
      if (data.success) {
        setProfile(data.user);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      showSnackbar('Gagal memuat profil', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          phone_number: profile.phone_number
        })
      });

      const data = await response.json();
      
      if (data.success) {
        showSnackbar('Profil berhasil diperbarui', 'success');
        setEditing(false);
        fetchProfile(); // Refresh data
      } else {
        throw new Error(data.error || 'Gagal menyimpan profil');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      showSnackbar('Gagal menyimpan profil', 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveCustomerProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/user/customer-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile.customer_profile)
      });

      const data = await response.json();
      
      if (data.success) {
        showSnackbar('Profil kesehatan berhasil disimpan', 'success');
        setEditingCustomerProfile(false);
        fetchProfile(); // Refresh data
      } else {
        throw new Error(data.error || 'Gagal menyimpan profil kesehatan');
      }
    } catch (error) {
      console.error('Error saving customer profile:', error);
      showSnackbar('Gagal menyimpan profil kesehatan', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Helper functions for customer profile
  const addAllergy = () => {
    if (newAllergy.trim()) {
      setProfile(prev => ({
        ...prev,
        customer_profile: {
          ...prev.customer_profile!,
          allergies: [...(prev.customer_profile?.allergies || []), newAllergy.trim()]
        }
      }));
      setNewAllergy('');
    }
  };

  const removeAllergy = (index: number) => {
    setProfile(prev => ({
      ...prev,
      customer_profile: {
        ...prev.customer_profile!,
        allergies: (prev.customer_profile?.allergies || []).filter((_, i) => i !== index)
      }
    }));
  };

  const addCondition = () => {
    if (newCondition.trim()) {
      setProfile(prev => ({
        ...prev,
        customer_profile: {
          ...prev.customer_profile!,
          medical_conditions: [...(prev.customer_profile?.medical_conditions || []), newCondition.trim()]
        }
      }));
      setNewCondition('');
    }
  };

  const removeCondition = (index: number) => {
    setProfile(prev => ({
      ...prev,
      customer_profile: {
        ...prev.customer_profile!,
        medical_conditions: (prev.customer_profile?.medical_conditions || []).filter((_, i) => i !== index)
      }
    }));
  };

  const addMedication = () => {
    if (newMedication.trim()) {
      setProfile(prev => ({
        ...prev,
        customer_profile: {
          ...prev.customer_profile!,
          medications: [...(prev.customer_profile?.medications || []), newMedication.trim()]
        }
      }));
      setNewMedication('');
    }
  };

  const removeMedication = (index: number) => {
    setProfile(prev => ({
      ...prev,
      customer_profile: {
        ...prev.customer_profile!,
        medications: (prev.customer_profile?.medications || []).filter((_, i) => i !== index)
      }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f7f1] py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#2d2617]">Profil Saya</h1>
          <div className="flex gap-2">
            {!editing && !editingCustomerProfile && (
              <button
                onClick={() => setEditing(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Edit Profil
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Informasi Pribadi</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nama</label>
                  {editing ? (
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    />
                  ) : (
                    <p className="text-lg">{profile.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <p className="text-lg text-gray-600">{profile.email}</p>
                  <p className="text-sm text-gray-500 mt-1">Email tidak dapat diubah</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nomor Telepon</label>
                  {editing ? (
                    <input
                      type="tel"
                      value={profile.phone_number || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, phone_number: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      placeholder="Masukkan nomor telepon"
                    />
                  ) : (
                    <p className="text-lg">{profile.phone_number || 'Belum diisi'}</p>
                  )}
                </div>

                {editing && (
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setEditing(false)}
                      className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      onClick={saveProfile}
                      disabled={saving}
                      className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-purple-400"
                    >
                      {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Profile - Integrated Editing */}
            {profile.role === 'customer' && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Profil Kesehatan</h2>
                  {!editingCustomerProfile && !editing && (
                    <button
                      onClick={() => setEditingCustomerProfile(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {profile.customer_profile?.completed_at ? 'Edit' : 'Lengkapi'} Profil Kesehatan
                    </button>
                  )}
                </div>

                {editingCustomerProfile ? (
                  <div className="space-y-6">
                    {/* Skin Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jenis Kulit
                      </label>
                      <select
                        value={profile.customer_profile?.skin_type || ''}
                        onChange={(e) => setProfile(prev => ({
                          ...prev,
                          customer_profile: {
                            ...prev.customer_profile!,
                            skin_type: e.target.value
                          }
                        }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      >
                        <option value="">Pilih jenis kulit</option>
                        <option value="normal">Normal</option>
                        <option value="oily">Berminyak</option>
                        <option value="dry">Kering</option>
                        <option value="combination">Kombinasi</option>
                        <option value="sensitive">Sensitif</option>
                      </select>
                    </div>

                    {/* Allergies */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Alergi
                      </label>
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
                          {(profile.customer_profile?.allergies || []).map((allergy: string, index: number) => (
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
                    </div>

                    {/* Medical Conditions */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kondisi Medis
                      </label>
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
                          {(profile.customer_profile?.medical_conditions || []).map((condition: string, index: number) => (
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
                    </div>

                    {/* Medications */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Obat yang Dikonsumsi
                      </label>
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
                          {(profile.customer_profile?.medications || []).map((medication: string, index: number) => (
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
                    </div>

                    {/* Additional Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Catatan Tambahan
                      </label>
                      <textarea
                        value={profile.customer_profile?.notes || ''}
                        onChange={(e) => setProfile(prev => ({
                          ...prev,
                          customer_profile: {
                            ...prev.customer_profile!,
                            notes: e.target.value
                          }
                        }))}
                        rows={4}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                        placeholder="Informasi tambahan tentang kesehatan..."
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => {
                          setEditingCustomerProfile(false);
                          // Reset customer profile data
                          fetchProfile();
                          setNewAllergy('');
                          setNewCondition('');
                          setNewMedication('');
                        }}
                        className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Batal
                      </button>
                      <button
                        onClick={saveCustomerProfile}
                        disabled={saving}
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400"
                      >
                        {saving ? 'Menyimpan...' : 'Simpan Profil Kesehatan'}
                      </button>
                    </div>
                  </div>
                ) : (
                  // View mode for customer profile
                  profile.customer_profile?.completed_at ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Jenis Kulit:</span>
                        <span className="font-medium">{profile.customer_profile.skin_type || 'Belum diisi'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Alergi:</span>
                        <span className="font-medium">{profile.customer_profile.allergies?.length || 0} item</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Kondisi Medis:</span>
                        <span className="font-medium">{profile.customer_profile.medical_conditions?.length || 0} item</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Obat:</span>
                        <span className="font-medium">{profile.customer_profile.medications?.length || 0} item</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-2">
                        Terakhir diperbarui: {new Date(profile.customer_profile.completed_at).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="text-6xl mb-4">🏥</div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Profil Kesehatan Belum Dilengkapi</h3>
                      <p className="text-gray-600 mb-4">
                        Lengkapi profil kesehatan Anda untuk pengalaman perawatan yang lebih baik.
                      </p>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Quick Actions */}
          <div className="space-y-6">
            {/* Account Status */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Status Akun</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    Aktif
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bergabung:</span>
                  <span className="font-medium">
                    {profile.created_at ? new Date(profile.created_at).toLocaleDateString('id-ID') : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Aksi Cepat</h3>
              <div className="space-y-2">
                <button
                  onClick={() => router.push('/user/booking')}
                  className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  📅 Lihat Booking Saya
                </button>
                <button
                  onClick={() => router.push('/user/booking/new')}
                  className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  ➕ Buat Booking Baru
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Snackbar
        message={snackbar.message}
        type={snackbar.type}
        isVisible={snackbar.isVisible}
        onClose={hideSnackbar}
        duration={5000}
        position="top-center"
      />
    </div>
  );
}