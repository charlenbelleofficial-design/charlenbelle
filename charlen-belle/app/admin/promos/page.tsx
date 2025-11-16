// app/admin/promos/page.tsx (Updated version)
'use client';
import { useEffect, useState } from 'react';
import { Snackbar, SnackbarType } from '../../components/ui/snackbar';

type Treatment = {
  _id: string;
  name: string;
  base_price: number;
};

type Promo = {
  _id: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  is_global: boolean;
  applicable_treatments?: string[]; // Make this optional with ?
  created_at: string;
};

type LoadingState = {
  [key: string]: boolean;
};

export default function AdminPromosPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [treatmentsLoading, setTreatmentsLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 0,
    start_date: '',
    end_date: '',
    is_active: true,
    is_global: false,
    applicable_treatments: [] as string[]
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    isVisible: false,
    message: '',
    type: 'success' as SnackbarType
  });

  useEffect(() => {
    fetchPromos();
    fetchTreatments();
  }, []);

  const showSnackbar = (message: string, type: SnackbarType = 'success') => {
    setSnackbar({ isVisible: true, message, type });
  };

  const hideSnackbar = () => {
    setSnackbar(prev => ({ ...prev, isVisible: false }));
  };

  async function fetchPromos() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/promos');
      const data = await res.json();
      if (data.success) {
        setPromos(data.promos || []);
      } else {
        throw new Error(data.error || 'Failed to fetch promos');
      }
    } catch (err: any) {
      showSnackbar(err.message || 'Error loading promos', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function fetchTreatments() {
    setTreatmentsLoading(true);
    try {
        const res = await fetch('/api/treatments');
        const data = await res.json();
        
        console.log('=== DEBUG: FETCHED TREATMENTS ===');
        console.log('Treatments API Response:', data);
        console.log('Treatments Count:', data.treatments?.length);
        if (data.treatments && data.treatments.length > 0) {
        console.log('First treatment ID:', data.treatments[0]._id);
        console.log('First treatment ID type:', typeof data.treatments[0]._id);
        }
        console.log('================================');
        
        if (data.success) {
        setTreatments(data.treatments || []);
        } else {
        throw new Error(data.error || 'Failed to fetch treatments');
        }
    } catch (err: any) {
        console.error('Error fetching treatments:', err);
    } finally {
        setTreatmentsLoading(false);
    }
    }

 async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setFormLoading(true);
  
  try {
    const url = editingId ? `/api/admin/promos/${editingId}` : '/api/admin/promos';
    const method = editingId ? 'PUT' : 'POST';

    // COMPREHENSIVE DEBUGGING
    console.log('=== DEBUG: PROMO SUBMISSION ===');
    console.log('Form Data:', formData);
    console.log('Selected Treatment IDs:', formData.applicable_treatments);
    console.log('Selected Treatments Count:', formData.applicable_treatments.length);
    console.log('Is Global:', formData.is_global);
    console.log('URL:', url);
    console.log('Method:', method);
    console.log('==============================');

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    const data = await res.json();
    
    console.log('=== DEBUG: API RESPONSE ===');
    console.log('Response Status:', res.status);
    console.log('Response Data:', data);
    console.log('Returned Promo:', data.promo);
    console.log('Returned Treatments:', data.promo?.applicable_treatments);
    console.log('===========================');
    
    if (!res.ok) throw new Error(data.error || 'Failed to save promo');

    showSnackbar(editingId ? 'Promo updated successfully!' : 'Promo created successfully!');
    resetForm();
    fetchPromos();
  } catch (err: any) {
    console.error('Error saving promo:', err);
    showSnackbar(err.message || 'Error saving promo', 'error');
  } finally {
    setFormLoading(false);
  }
}

  async function handleToggle(id: string, current: boolean) {
    setLoadingStates(prev => ({ ...prev, [id]: true }));
    
    try {
      const res = await fetch(`/api/admin/promos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !current })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');

      showSnackbar(`Promo ${!current ? 'activated' : 'deactivated'} successfully!`);
      fetchPromos();
    } catch (err: any) {
      showSnackbar(err.message || 'Error updating promo', 'error');
    } finally {
      setLoadingStates(prev => ({ ...prev, [id]: false }));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this promo?')) return;
    
    setLoadingStates(prev => ({ ...prev, [id]: true }));
    
    try {
      const res = await fetch(`/api/admin/promos/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');

      showSnackbar('Promo deleted successfully!');
      fetchPromos();
    } catch (err: any) {
      showSnackbar(err.message || 'Error deleting promo', 'error');
    } finally {
      setLoadingStates(prev => ({ ...prev, [id]: false }));
    }
  }

  function editPromo(promo: Promo) {
    setFormData({
      name: promo.name,
      description: promo.description || '',
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      start_date: promo.start_date ? new Date(promo.start_date).toISOString().split('T')[0] : '',
      end_date: promo.end_date ? new Date(promo.end_date).toISOString().split('T')[0] : '',
      is_active: promo.is_active,
      is_global: promo.is_global || false,
      applicable_treatments: promo.applicable_treatments || []
    });
    setEditingId(promo._id);
    
    document.getElementById('promo-form')?.scrollIntoView({ behavior: 'smooth' });
  }

  function resetForm() {
    setFormData({
      name: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      start_date: '',
      end_date: '',
      is_active: true,
      is_global: false,
      applicable_treatments: []
    });
    setEditingId(null);
  }

  function handleTreatmentToggle(treatmentId: string) {
    setFormData(prev => ({
      ...prev,
      applicable_treatments: prev.applicable_treatments.includes(treatmentId)
        ? prev.applicable_treatments.filter(id => id !== treatmentId)
        : [...prev.applicable_treatments, treatmentId]
    }));
  }

  function formatDiscount(promo: Promo) {
    return promo.discount_type === 'percentage' 
      ? `${promo.discount_value}%` 
      : `Rp ${promo.discount_value.toLocaleString()}`;
  }

  function formatDate(dateString?: string) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID');
  }

  function getApplicableTreatmentsText(promo: Promo) {
    if (promo.is_global) return 'All Treatments';
    
    // Add null/undefined check for applicable_treatments
    if (!promo.applicable_treatments || promo.applicable_treatments.length === 0) {
        return 'No treatments selected';
    }
    
    if (promo.applicable_treatments.length === 1) return '1 treatment';
    return `${promo.applicable_treatments.length} treatments`;
  }

  const isFormValid = formData.name.trim() && formData.discount_value >= 0;

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Manage Promos</h1>
        <p className="text-gray-600 mb-6">Create and manage promotional offers for your treatments</p>

        {/* Promo Form */}
        <div id="promo-form" className="mb-8 bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {editingId ? (
                <span className="flex items-center gap-2">
                  <span className="text-blue-600">✏️ Editing Promo</span>
                  <span className="text-sm text-gray-500 font-normal">(ID: {editingId})</span>
                </span>
              ) : (
                'Create New Promo'
              )}
            </h2>
            {editingId && (
              <button 
                type="button" 
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1"
              >
                <span>Cancel Edit</span>
              </button>
            )}
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter promo name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter promo description"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Discount Type *</label>
                <select
                  value={formData.discount_type}
                  onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (Rp)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Discount Value * 
                  {formData.discount_type === 'percentage' && ' (%)'}
                  {formData.discount_type === 'fixed' && ' (Rp)'}
                </label>
                <input
                  type="number"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min="0"
                  step={formData.discount_type === 'percentage' ? 1 : 1000}
                  placeholder={formData.discount_type === 'percentage' ? '10' : '50000'}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Treatment Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Apply To Treatments</label>
              
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  id="is_global"
                  checked={formData.is_global}
                  onChange={(e) => setFormData({ ...formData, is_global: e.target.checked, applicable_treatments: e.target.checked ? [] : formData.applicable_treatments })}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="is_global" className="text-sm font-medium">
                  Apply to all treatments (Global Promo)
                </label>
              </div>

              {!formData.is_global && (
                <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                  {treatmentsLoading ? (
                    <div className="text-center text-gray-500">Loading treatments...</div>
                  ) : treatments.length === 0 ? (
                    <div className="text-center text-gray-500">No treatments available</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {treatments.map(treatment => (
                        <label key={treatment._id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={formData.applicable_treatments.includes(treatment._id)}
                            onChange={() => handleTreatmentToggle(treatment._id)}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span>{treatment.name}</span>
                          <span className="text-gray-500 text-xs">({formatCurrency(treatment.base_price)})</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="is_active" className="text-sm font-medium">
                Active Promo
              </label>
            </div>

            <div className="flex gap-2">
              <button 
                type="submit" 
                disabled={!isFormValid || formLoading}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {formLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {editingId ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    {editingId ? '💾 Update Promo' : '✨ Create Promo'}
                  </>
                )}
              </button>
              
              {editingId && (
                <button 
                  type="button" 
                  onClick={resetForm}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
        
        {/* Promos List */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Active Promos</h2>
            <p className="text-sm text-gray-600">{promos.length} promo(s) found</p>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p className="mt-2 text-gray-600">Loading promos...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-4 font-semibold">Promo Details</th>
                    <th className="text-left p-4 font-semibold">Discount</th>
                    <th className="text-left p-4 font-semibold">Applicable To</th>
                    <th className="text-left p-4 font-semibold">Period</th>
                    <th className="text-left p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {promos.map(promo => (
                    <tr 
                      key={promo._id} 
                      className={`border-b hover:bg-gray-50 transition-colors ${
                        editingId === promo._id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <td className="p-4">
                        <div className="font-medium flex items-center gap-2">
                          {promo.name}
                          {promo.is_global && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                              Global
                            </span>
                          )}
                          {editingId === promo._id && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                              Editing
                            </span>
                          )}
                        </div>
                        {promo.description && (
                          <div className="text-sm text-gray-600 mt-1">{promo.description}</div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          Created: {new Date(promo.created_at).toLocaleDateString('id-ID')}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-lg">{formatDiscount(promo)}</span>
                        <div className="text-xs text-gray-500 capitalize">{promo.discount_type}</div>
                      </td>
                      <td className="p-4 text-sm">
                        {getApplicableTreatmentsText(promo)}
                      </td>
                      <td className="p-4 text-sm">
                        <div className="font-medium">{formatDate(promo.start_date)}</div>
                        <div className="text-gray-500">to {formatDate(promo.end_date)}</div>
                      </td>
                      <td className="p-4">
                        <button 
                          onClick={() => handleToggle(promo._id, promo.is_active)}
                          disabled={loadingStates[promo._id]}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
                            promo.is_active 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {loadingStates[promo._id] ? (
                            <>
                              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              {promo.is_active ? '✅ Active' : '❌ Inactive'}
                            </>
                          )}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-center">
                          <button 
                            onClick={() => editPromo(promo)}
                            disabled={loadingStates[promo._id]}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                          >
                            <span>✏️ Edit</span>
                          </button>
                          <button 
                            onClick={() => handleDelete(promo._id)}
                            disabled={loadingStates[promo._id]}
                            className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                          >
                            {loadingStates[promo._id] ? (
                              <>⏳ Deleting...</>
                            ) : (
                              <>🗑️ Delete</>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {promos.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <div className="text-4xl mb-2">🎁</div>
                          <p className="text-lg font-medium">No promos found</p>
                          <p className="text-sm">Create your first promo to get started!</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Snackbar Component */}
      <Snackbar
        message={snackbar.message}
        type={snackbar.type}
        isVisible={snackbar.isVisible}
        onClose={hideSnackbar}
        duration={4000}
        position="top-center"
      />
    </div>
  );
}

// Add this helper function if not already in your utils
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}