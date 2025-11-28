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
    setSnackbar((prev) => ({ ...prev, isVisible: false }));
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
      setProfile((prev) => ({
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
    setProfile((prev) => ({
      ...prev,
      customer_profile: {
        ...prev.customer_profile!,
        allergies: (prev.customer_profile?.allergies || []).filter((_, i) => i !== index)
      }
    }));
  };

  const addCondition = () => {
    if (newCondition.trim()) {
      setProfile((prev) => ({
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
    setProfile((prev) => ({
      ...prev,
      customer_profile: {
        ...prev.customer_profile!,
        medical_conditions: (prev.customer_profile?.medical_conditions || []).filter((_, i) => i !== index)
      }
    }));
  };

  const addMedication = () => {
    if (newMedication.trim()) {
      setProfile((prev) => ({
        ...prev,
        customer_profile: {
          ...prev.customer_profile!,
          medications: (prev.customer_profile?.medications || []).concat(
            newMedication.trim()
          )
        }
      }));
      setNewMedication('');
    }
  };

  const removeMedication = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      customer_profile: {
        ...prev.customer_profile!,
        medications: (prev.customer_profile?.medications || []).filter(
          (_, i) => i !== index
        )
      }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F0E3]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6C3FD1]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F0E3] py-8 sm:py-10">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            {/* Tombol kembali ke dashboard */}
            <button
              onClick={() => router.push('/user/dashboard')}
              className="inline-flex items-center gap-2 mb-3 px-4 py-2 rounded-xl border border-[#E1D4C0] bg-[#FFFDF9] text-sm text-[#7E6A52] hover:bg-[#FBF6EA] transition-colors"
            >
              <span>←</span>
              <span>Kembali ke Dashboard</span>
            </button>

            <p className="text-xs text-[#A18F76] mb-1 uppercase tracking-[0.15em]">
              Akun
            </p>
            <h1 className="text-xl sm:text-2xl font-semibold text-[#3B2A1E]">
              Profil Saya
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#FFFDF9] rounded-2xl border border-[#E1D4C0] shadow-sm p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#3B2A1E]">
                  Informasi Pribadi
                </h2>

                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="bg-[#C89B4B] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#b48735] transition-colors shadow-sm"
                  >
                    Edit Profil
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#3B2A1E] mb-2">
                    Nama
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) =>
                        setProfile((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className="w-full border border-[#E1D4C0] rounded-xl px-3 py-2 text-sm bg-[#FFFDF9] text-[#3B2A1E] focus:outline-none focus:border-[#C89B4B] focus:ring-2 focus:ring-[#C89B4B]/30"
                    />
                  ) : (
                    <p className="text-base text-[#3B2A1E]">{profile.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#3B2A1E] mb-2">
                    Email
                  </label>
                  <p className="text-base text-[#7E6A52] break-all">
                    {profile.email}
                  </p>
                  <p className="text-xs text-[#A18F76] mt-1">
                    Email tidak dapat diubah
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#3B2A1E] mb-2">
                    Nomor Telepon
                  </label>
                  {editing ? (
                    <input
                      type="tel"
                      value={profile.phone_number || ''}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          phone_number: e.target.value
                        }))
                      }
                      className="w-full border border-[#E1D4C0] rounded-xl px-3 py-2 text-sm bg-[#FFFDF9] text-[#3B2A1E] focus:outline-none focus:border-[#C89B4B] focus:ring-2 focus:ring-[#C89B4B]/30"
                      placeholder="Masukkan nomor telepon"
                    />
                  ) : (
                    <p className="text-base text-[#3B2A1E]">
                      {profile.phone_number || 'Belum diisi'}
                    </p>
                  )}
                </div>

                {editing && (
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      onClick={() => setEditing(false)}
                      className="flex-1 bg-[#E1D4C0] text-[#3B2A1E] py-2.5 rounded-xl text-sm font-medium hover:bg-[#D3C2A6] transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      onClick={saveProfile}
                      disabled={saving}
                      className="flex-1 bg-[#C89B4B] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#b48735] transition-colors disabled:bg-[#e2c691]"
                    >
                      {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Profile */}
            {profile.role === 'customer' && (
              <div className="bg-[#FFFDF9] rounded-2xl border border-[#E1D4C0] shadow-sm p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                  <h2 className="text-lg font-semibold text-[#3B2A1E]">
                    Profil Kesehatan
                  </h2>
                  {!editingCustomerProfile && !editing && (
                    <button
                      onClick={() => setEditingCustomerProfile(true)}
                      className="self-start sm:self-auto bg-[#C89B4B] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#b48735] transition-colors"
                    >
                      {profile.customer_profile?.completed_at
                        ? 'Edit'
                        : 'Lengkapi'}{' '}
                      Profil
                    </button>
                  )}
                </div>

                {editingCustomerProfile ? (
                  <div className="space-y-6">
                    {/* Skin Type */}
                    <div>
                      <label className="block text-sm font-medium text-[#3B2A1E] mb-2">
                        Jenis Kulit
                      </label>
                      <select
                        value={profile.customer_profile?.skin_type || ''}
                        onChange={(e) =>
                          setProfile((prev) => ({
                            ...prev,
                            customer_profile: {
                              ...prev.customer_profile!,
                              skin_type: e.target.value
                            }
                          }))
                        }
                        className="w-full border border-[#E1D4C0] rounded-xl px-3 py-2 text-sm bg-[#FFFDF9] text-[#3B2A1E] focus:outline-none focus:border-[#C89B4B] focus:ring-2 focus:ring-[#C89B4B]/30"
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
                      <label className="block text-sm font-medium text-[#3B2A1E] mb-2">
                        Alergi
                      </label>
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={newAllergy}
                            onChange={(e) => setNewAllergy(e.target.value)}
                            onKeyPress={(e) =>
                              e.key === 'Enter' && (e.preventDefault(), addAllergy())
                            }
                            className="flex-1 border border-[#E1D4C0] rounded-xl px-3 py-2 text-sm bg-[#FFFDF9] focus:outline-none focus:border-[#C89B4B] focus:ring-2 focus:ring-[#C89B4B]/30"
                            placeholder="Tambahkan alergi (contoh: Latex, Lidocaine)"
                          />
                          <button
                            onClick={addAllergy}
                            className="w-full sm:w-auto bg-[#6C3FD1] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#5b34b3] transition-colors"
                          >
                            Tambah
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(profile.customer_profile?.allergies || []).map(
                            (allergy, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs border border-red-200"
                              >
                                {allergy}
                                <button
                                  onClick={() => removeAllergy(index)}
                                  className="hover:text-red-900"
                                >
                                  ×
                                </button>
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Medical Conditions */}
                    <div>
                      <label className="block text-sm font-medium text-[#3B2A1E] mb-2">
                        Kondisi Medis
                      </label>
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={newCondition}
                            onChange={(e) => setNewCondition(e.target.value)}
                            onKeyPress={(e) =>
                              e.key === 'Enter' &&
                              (e.preventDefault(), addCondition())
                            }
                            className="flex-1 border border-[#E1D4C0] rounded-xl px-3 py-2 text-sm bg-[#FFFDF9] focus:outline-none focus:border-[#C89B4B] focus:ring-2 focus:ring-[#C89B4B]/30"
                            placeholder="Tambahkan kondisi medis (contoh: Diabetes, Hipertensi)"
                          />
                          <button
                            onClick={addCondition}
                            className="w-full sm:w-auto bg-[#6C3FD1] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#5b34b3] transition-colors"
                          >
                            Tambah
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(
                            profile.customer_profile?.medical_conditions || []
                          ).map((condition, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-3 py-1 rounded-full text-xs border border-amber-200"
                            >
                              {condition}
                              <button
                                onClick={() => removeCondition(index)}
                                className="hover:text-amber-900"
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
                      <label className="block text-sm font-medium text-[#3B2A1E] mb-2">
                        Obat yang Dikonsumsi
                      </label>
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={newMedication}
                            onChange={(e) => setNewMedication(e.target.value)}
                            onKeyPress={(e) =>
                              e.key === 'Enter' &&
                              (e.preventDefault(), addMedication())
                            }
                            className="flex-1 border border-[#E1D4C0] rounded-xl px-3 py-2 text-sm bg-[#FFFDF9] focus:outline-none focus:border-[#C89B4B] focus:ring-2 focus:ring-[#C89B4B]/30"
                            placeholder="Tambahkan obat (contoh: Warfarin, Aspirin)"
                          />
                          <button
                            onClick={addMedication}
                            className="w-full sm:w-auto bg-[#6C3FD1] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#5b34b3] transition-colors"
                          >
                            Tambah
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(profile.customer_profile?.medications || []).map(
                            (medication, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs border border-emerald-200"
                              >
                                {medication}
                                <button
                                  onClick={() => removeMedication(index)}
                                  className="hover:text-emerald-900"
                                >
                                  ×
                                </button>
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Additional Notes */}
                    <div>
                      <label className="block text-sm font-medium text-[#3B2A1E] mb-2">
                        Catatan Tambahan
                      </label>
                      <textarea
                        value={profile.customer_profile?.notes || ''}
                        onChange={(e) =>
                          setProfile((prev) => ({
                            ...prev,
                            customer_profile: {
                              ...prev.customer_profile!,
                              notes: e.target.value
                            }
                          }))
                        }
                        rows={4}
                        className="w-full border border-[#E1D4C0] rounded-2xl px-3 py-2 text-sm bg-[#FFFDF9] text-[#3B2A1E] focus:outline-none focus:border-[#C89B4B] focus:ring-2 focus:ring-[#C89B4B]/30"
                        placeholder="Informasi tambahan tentang kesehatan..."
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <button
                        onClick={() => {
                          setEditingCustomerProfile(false);
                          fetchProfile();
                          setNewAllergy('');
                          setNewCondition('');
                          setNewMedication('');
                        }}
                        className="flex-1 bg-[#E1D4C0] text-[#3B2A1E] py-2.5 rounded-xl text-sm font-medium hover:bg-[#D3C2A6] transition-colors"
                      >
                        Batal
                      </button>
                      <button
                        onClick={saveCustomerProfile}
                        disabled={saving}
                        className="flex-1 bg-[#2F855A] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#276749] transition-colors disabled:bg-[#9AE6B4]"
                      >
                        {saving ? 'Menyimpan...' : 'Simpan Profil Kesehatan'}
                      </button>
                    </div>
                  </div>
                ) : profile.customer_profile?.completed_at ? (
                  // View mode when completed
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#7E6A52]">Jenis Kulit</span>
                      <span className="font-medium text-[#3B2A1E] text-right">
                        {profile.customer_profile.skin_type || 'Belum diisi'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#7E6A52]">Alergi</span>
                      <span className="font-medium text-[#3B2A1E] text-right">
                        {profile.customer_profile.allergies?.length || 0} item
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#7E6A52]">Kondisi Medis</span>
                      <span className="font-medium text-[#3B2A1E] text-right">
                        {profile.customer_profile.medical_conditions?.length ||
                          0}{' '}
                        item
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#7E6A52]">Obat</span>
                      <span className="font-medium text-[#3B2A1E] text-right">
                        {profile.customer_profile.medications?.length || 0}{' '}
                        item
                      </span>
                    </div>
                    <div className="text-xs text-[#A18F76] mt-2">
                      Terakhir diperbarui:{' '}
                      {new Date(
                        profile.customer_profile.completed_at
                      ).toLocaleDateString('id-ID')}
                    </div>
                  </div>
                ) : (
                  // Empty state
                  <div className="text-center py-6">
                    <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-[#FBF6EA] flex items-center justify-center">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-6 w-6 text-[#C89B4B]"
                        fill="currentColor"
                      >
                        <path d="M12 2a7 7 0 0 0-7 7v4.5l-1.7 3.4A1 1 0 0 0 4.2 18H8v-2H5.6l1.1-2.2A1 1 0 0 0 7 13V9a5 5 0 0 1 10 0v4a1 1 0 0 0 .3.7l1.1 1.1A3 3 0 0 1 16 21h-3v2h3a5 5 0 0 0 3.5-8.5l-.8-.8V9a7 7 0 0 0-7-7z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-[#3B2A1E] mb-1">
                      Profil Kesehatan Belum Dilengkapi
                    </h3>
                    <p className="text-xs text-[#A18F76]">
                      Lengkapi profil kesehatan Anda untuk pengalaman perawatan
                      yang lebih baik.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Quick info */}
          <div className="space-y-6">
            {/* Account Status */}
            <div className="bg-[#FFFDF9] rounded-2xl border border-[#E1D4C0] shadow-sm p-5 sm:p-6">
              <h3 className="font-semibold text-sm text-[#3B2A1E] mb-3">
                Status Akun
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-[#7E6A52]">Status</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-[11px] font-medium">
                    Aktif
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-[#7E6A52]">Bergabung</span>
                  <span className="font-medium text-[#3B2A1E] text-right">
                    {profile.created_at
                      ? new Date(profile.created_at).toLocaleDateString('id-ID')
                      : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-[#FFFDF9] rounded-2xl border border-[#E1D4C0] shadow-sm p-5 sm:p-6">
              <h3 className="font-semibold text-sm text-[#3B2A1E] mb-3">
                Aksi Cepat
              </h3>
              <div className="space-y-2 text-sm">
                <button
                  onClick={() => router.push('/user/dashboard/bookings')}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#7E6A52] hover:bg-[#FBF6EA] transition-colors"
                >
                  <span className="h-7 w-7 rounded-xl bg-[#E6D8C2] flex items-center justify-center">
                    <svg
                      className="h-4 w-4 text-[#3B2A1E]"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M7 2v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm12 7H5v10h14V9z" />
                    </svg>
                  </span>
                  <span>Lihat Booking Saya</span>
                </button>
                <button
                  onClick={() => router.push('/user/treatments')}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#7E6A52] hover:bg-[#FBF6EA] transition-colors"
                >
                  <span className="h-7 w-7 rounded-xl bg-[#E6D8C2] flex items-center justify-center">
                    <svg
                      className="h-4 w-4 text-[#3B2A1E]"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M7 2v2H5a2 2 0 0 0-2 2v2h2V6h14v12H5v-2H3v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm5 7v3H9v2h3v3h2v-3h3v-2h-3V9h-2z" />
                    </svg>
                  </span>
                  <span>Buat Booking Baru</span>
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
