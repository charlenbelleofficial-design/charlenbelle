// app/user/customer-profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Snackbar, SnackbarType } from '../../components/ui/snackbar';

interface CustomerProfile {
  allergies: string[];
  skin_type: string;
  medical_conditions: string[];
  medications: string[];
  notes: string;
  completed_at?: string;
}

export default function CustomerProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    isVisible: false,
    message: '',
    type: 'info' as SnackbarType
  });

  const [profile, setProfile] = useState<CustomerProfile>({
    allergies: [],
    skin_type: '',
    medical_conditions: [],
    medications: [],
    notes: ''
  });

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
      const response = await fetch('/api/user/customer-profile');
      const data = await response.json();

      if (data.success && data.customer_profile) {
        setProfile(data.customer_profile);
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
      const response = await fetch('/api/user/customer-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });

      const data = await response.json();

      if (data.success) {
        showSnackbar('Profil berhasil disimpan', 'success');
        setTimeout(() => {
          router.push('/user/booking');
        }, 2000);
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

  const addAllergy = () => {
    if (newAllergy.trim()) {
      setProfile((prev) => ({
        ...prev,
        allergies: [...prev.allergies, newAllergy.trim()]
      }));
      setNewAllergy('');
    }
  };

  const removeAllergy = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index)
    }));
  };

  const addCondition = () => {
    if (newCondition.trim()) {
      setProfile((prev) => ({
        ...prev,
        medical_conditions: [...prev.medical_conditions, newCondition.trim()]
      }));
      setNewCondition('');
    }
  };

  const removeCondition = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      medical_conditions: prev.medical_conditions.filter((_, i) => i !== index)
    }));
  };

  const addMedication = () => {
    if (newMedication.trim()) {
      setProfile((prev) => ({
        ...prev,
        medications: [...prev.medications, newMedication.trim()]
      }));
      setNewMedication('');
    }
  };

  const removeMedication = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
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
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-[#FFFDF9] border border-[#E1D4C0] rounded-2xl shadow-sm p-6 sm:p-8">
          {/* Header */}
          <div className="mb-6">
            <p className="text-xs text-[#A18F76] mb-1">Profil</p>
            <h1 className="text-xl sm:text-2xl font-semibold text-[#3B2A1E] mb-2">
              Profil Kesehatan
            </h1>
            <p className="text-sm text-[#A18F76]">
              Lengkapi profil kesehatan Anda untuk pengalaman perawatan yang
              lebih aman dan personal.
            </p>
          </div>

          <div className="space-y-7">
            {/* Skin Type */}
            <div>
              <label className="block text-sm font-semibold text-[#3B2A1E] mb-2">
                Jenis Kulit
              </label>
              <select
                value={profile.skin_type}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    skin_type: e.target.value
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
              <label className="block text-sm font-semibold text-[#3B2A1E] mb-2">
                Alergi
              </label>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addAllergy()}
                    className="flex-1 border border-[#E1D4C0] rounded-xl px-3 py-2 text-sm bg-[#FFFDF9] focus:outline-none focus:border-[#C89B4B] focus:ring-2 focus:ring-[#C89B4B]/30"
                    placeholder="Tambahkan alergi (contoh: Latex, Lidocaine)"
                  />
                  <button
                    onClick={addAllergy}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#C89B4B] text-white text-sm font-medium hover:bg-[#b48735] transition-colors"
                  >
                    Tambah
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.allergies.map((allergy, index) => (
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
                  ))}
                </div>
              </div>
            </div>

            {/* Medical Conditions */}
            <div>
              <label className="block text-sm font-semibold text-[#3B2A1E] mb-2">
                Kondisi Medis
              </label>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCondition()}
                    className="flex-1 border border-[#E1D4C0] rounded-xl px-3 py-2 text-sm bg-[#FFFDF9] focus:outline-none focus:border-[#C89B4B] focus:ring-2 focus:ring-[#C89B4B]/30"
                    placeholder="Tambahkan kondisi medis (contoh: Diabetes, Hipertensi)"
                  />
                  <button
                    onClick={addCondition}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#C89B4B] text-white text-sm font-medium hover:bg-[#b48735] transition-colors"
                  >
                    Tambah
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.medical_conditions.map((condition, index) => (
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
              <label className="block text-sm font-semibold text-[#3B2A1E] mb-2">
                Obat yang Dikonsumsi
              </label>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newMedication}
                    onChange={(e) => setNewMedication(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addMedication()}
                    className="flex-1 border border-[#E1D4C0] rounded-xl px-3 py-2 text-sm bg-[#FFFDF9] focus:outline-none focus:border-[#C89B4B] focus:ring-2 focus:ring-[#C89B4B]/30"
                    placeholder="Tambahkan obat (contoh: Warfarin, Aspirin)"
                  />
                  <button
                    onClick={addMedication}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#C89B4B] text-white text-sm font-medium hover:bg-[#b48735] transition-colors"
                  >
                    Tambah
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.medications.map((medication, index) => (
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
                  ))}
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-semibold text-[#3B2A1E] mb-2">
                Catatan Tambahan
              </label>
              <textarea
                value={profile.notes}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={4}
                className="w-full border border-[#E1D4C0] rounded-2xl px-3 py-2 text-sm bg-[#FFFDF9] text-[#3B2A1E] focus:outline-none focus:border-[#C89B4B] focus:ring-2 focus:ring-[#C89B4B]/30"
                placeholder="Informasi tambahan tentang kesehatan Anda..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={() => router.back()}
                className="w-full sm:flex-1 py-3 rounded-xl bg-[#E1D4C0] text-sm font-medium text-[#3B2A1E] hover:bg-[#D3C2A6] transition-colors"
              >
                Kembali
              </button>
              <button
                onClick={saveProfile}
                disabled={saving}
                className="w-full sm:flex-1 py-3 rounded-xl bg-[#6C3FD1] text-sm font-semibold text-white hover:bg-[#5b34b3] disabled:bg-[#A68FEA] transition-colors"
              >
                {saving ? 'Menyimpan...' : 'Simpan Profil'}
              </button>
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
