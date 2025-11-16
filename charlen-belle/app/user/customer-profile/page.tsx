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
    setSnackbar(prev => ({ ...prev, isVisible: false }));
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
        // Redirect to booking page or previous page
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
      setProfile(prev => ({
        ...prev,
        allergies: [...prev.allergies, newAllergy.trim()]
      }));
      setNewAllergy('');
    }
  };

  const removeAllergy = (index: number) => {
    setProfile(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index)
    }));
  };

  const addCondition = () => {
    if (newCondition.trim()) {
      setProfile(prev => ({
        ...prev,
        medical_conditions: [...prev.medical_conditions, newCondition.trim()]
      }));
      setNewCondition('');
    }
  };

  const removeCondition = (index: number) => {
    setProfile(prev => ({
      ...prev,
      medical_conditions: prev.medical_conditions.filter((_, i) => i !== index)
    }));
  };

  const addMedication = () => {
    if (newMedication.trim()) {
      setProfile(prev => ({
        ...prev,
        medications: [...prev.medications, newMedication.trim()]
      }));
      setNewMedication('');
    }
  };

  const removeMedication = (index: number) => {
    setProfile(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Profil Kesehatan</h1>
          <p className="text-gray-600 mb-8">
            Lengkapi profil kesehatan Anda untuk pengalaman perawatan yang lebih baik dan aman.
          </p>

          <div className="space-y-8">
            {/* Skin Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jenis Kulit
              </label>
              <select
                value={profile.skin_type}
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
                    onKeyPress={(e) => e.key === 'Enter' && addAllergy()}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Tambahkan alergi (contoh: Latex, Lidocaine)"
                  />
                  <button
                    onClick={addAllergy}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Tambah
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.allergies.map((allergy, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm"
                    >
                      {allergy}
                      <button
                        onClick={() => removeAllergy(index)}
                        className="text-red-600 hover:text-red-800"
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
                    onKeyPress={(e) => e.key === 'Enter' && addCondition()}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Tambahkan kondisi medis (contoh: Diabetes, Hipertensi)"
                  />
                  <button
                    onClick={addCondition}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Tambah
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.medical_conditions.map((condition, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm"
                    >
                      {condition}
                      <button
                        onClick={() => removeCondition(index)}
                        className="text-yellow-600 hover:text-yellow-800"
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
                    onKeyPress={(e) => e.key === 'Enter' && addMedication()}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Tambahkan obat (contoh: Warfarin, Aspirin)"
                  />
                  <button
                    onClick={addMedication}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Tambah
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.medications.map((medication, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                    >
                      {medication}
                      <button
                        onClick={() => removeMedication(index)}
                        className="text-green-600 hover:text-green-800"
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
                value={profile.notes}
                onChange={(e) => setProfile(prev => ({ ...prev, notes: e.target.value }))}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                placeholder="Informasi tambahan tentang kesehatan Anda..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6">
              <button
                onClick={() => router.back()}
                className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Kembali
              </button>
              <button
                onClick={saveProfile}
                disabled={saving}
                className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-purple-400"
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