// app/admin/bookings/page.tsx - Updated version with user search
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Snackbar, SnackbarType } from '../../components/ui/snackbar';
import { formatCurrency, formatDate } from '../../lib/utils';
import { calculateTreatmentPrice } from '../../lib/promo-utils';

interface User {
  _id: string;
  name: string;
  email: string;
  phone_number?: string;
}

interface Booking {
  _id: string;
  user_id: { _id: string; name: string; email: string; phone_number?: string };
  slot_id: {
    _id: string;
    date: string;
    start_time: string;
    end_time: string;
    doctor_id?: { _id: string; name: string };
    therapist_id?: { _id: string; name: string };
  };
  type: string;
  status: 'pending' | 'confirmed' | 'completed' | 'canceled';
  notes?: string;
  total_amount: number;
  created_at: string;
  treatments?: any[];
  payment?: {
    status: string;
    payment_method: string;
  };
  consultation_notes?: ConsultationNote[];
}

interface Treatment {
  _id: string;
  name: string;
  description?: string;
  base_price: number;
  duration_minutes: number;
  requires_confirmation?: boolean;
  final_price?: number;
  applied_promo?: {
    _id: string;
    name: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
  };
  active_promos?: any[];
}

interface Slot {
  _id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface SnackbarState {
  isVisible: boolean;
  message: string;
  type: SnackbarType;
}

interface BookingEditLog {
  _id: string;
  edited_by: { _id: string; name: string };
  action: string;
  details: any;
  created_at: string;
}

interface ConsultationNote {
  diagnosis?: string;
  recommendations?: string;
  notes?: string;
  added_by: { _id: string; name: string };
  added_at: string;
}

function EditBookingModal({ booking, treatments, onAddTreatment, onRemoveTreatment, onClose }: any) {
  const [selectedTreatment, setSelectedTreatment] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleAddTreatment = () => {
    if (!selectedTreatment) return;
    onAddTreatment(selectedTreatment, quantity);
    setSelectedTreatment('');
    setQuantity(1);
    setSearchTerm('');
    setIsDropdownOpen(false);
  };

  const getSelectedTreatment = () => {
    return treatments.find((t: any) => t._id === selectedTreatment);
  };

  // Filter treatments based on search term
  const filteredTreatments = treatments.filter((treatment: any) =>
    treatment.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTreatmentSelect = (treatmentId: string) => {
    setSelectedTreatment(treatmentId);
    setSearchTerm(''); // Clear search when treatment is selected
    setIsDropdownOpen(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsDropdownOpen(true);
    if (!selectedTreatment) {
      setSelectedTreatment('');
    }
  };

  const handleInputFocus = () => {
    setIsDropdownOpen(true);
  };

  const handleInputBlur = () => {
    // Delay closing to allow for item selection
    setTimeout(() => setIsDropdownOpen(false), 200);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="
        bg-white 
        rounded-xl 
        shadow-xl 
        w-full 
        max-w-[95vw] 
        max-h-[90vh] 
        overflow-y-auto 
        overflow-x-hidden
      ">
        {/* HEADER */}
        <div className="p-5 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            Edit Treatments — {booking.user_id?.name}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 space-y-6 overflow-y-auto">

          {/* CURRENT TREATMENTS */}
          <section>
            <h3 className="font-semibold mb-3 text-gray-800">Treatments Saat Ini</h3>

            {booking.treatments?.length > 0 ? (
              <div className="space-y-3">
                {booking.treatments.map((treatment: any, index: number) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition"
                  >
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {treatment.treatment_id?.name}
                        </p>

                        <p className="text-xs text-gray-600">Qty: {treatment.quantity}</p>

                        {treatment.promo_applied && (
                          <div className="mt-1 text-xs bg-green-100 text-green-700 rounded px-2 py-0.5 inline-block">
                            🎁 {treatment.promo_applied.promo_name}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {formatCurrency(treatment.price)} each
                        </p>

                        {treatment.original_price > treatment.price && (
                          <p className="text-xs line-through text-gray-400">
                            {formatCurrency(treatment.original_price)}
                          </p>
                        )}

                        <p className="text-xs text-gray-600 mt-1">
                          Subtotal: {formatCurrency(treatment.price * treatment.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Belum ada treatments.</p>
            )}
          </section>

          {/* ADD NEW TREATMENT */}
          <section>
            <h3 className="font-semibold mb-3 text-gray-800">Tambah Treatment</h3>
            <p className="text-xs text-gray-500 mb-2">
              Harga di bawah adalah harga terbaru (sudah termasuk promo jika ada)
            </p>

            <div className="space-y-3">
              <div className="flex gap-2">
                {/* Searchable Treatment Selector */}
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    placeholder="Cari treatment..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                  
                  {/* Search Icon */}
                  <div className="absolute right-3 top-2.5 text-gray-400">
                    🔍
                  </div>

                  {/* Dropdown Results */}
                  {isDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredTreatments.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-gray-500">
                          {searchTerm ? 'Tidak ada treatment ditemukan' : 'Ketik untuk mencari treatment...'}
                        </div>
                      ) : (
                        filteredTreatments.map((treatment: any) => (
                          <button
                            key={treatment._id}
                            type="button"
                            onClick={() => handleTreatmentSelect(treatment._id)}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-100 border-b border-gray-200 last:border-b-0 transition-colors ${
                              selectedTreatment === treatment._id ? 'bg-blue-50 border-blue-200' : ''
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{treatment.name}</div>
                                <div className="text-xs text-gray-600 mt-1">
                                  Harga: {formatCurrency(treatment.final_price || treatment.base_price)}
                                  {treatment.applied_promo && (
                                    <span className="text-green-600 ml-1">
                                      🎁 Promo {treatment.applied_promo.discount_type === 'percentage' 
                                        ? `${treatment.applied_promo.discount_value}%`
                                        : `Rp ${treatment.applied_promo.discount_value.toLocaleString()}`
                                      }
                                    </span>
                                  )}
                                </div>
                                {treatment.applied_promo && treatment.final_price !== treatment.base_price && (
                                  <div className="text-xs text-gray-500 line-through mt-1">
                                    Normal: {formatCurrency(treatment.base_price)}
                                  </div>
                                )}
                              </div>
                              {selectedTreatment === treatment._id && (
                                <div className="text-blue-600 ml-2">✓</div>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => {
                    const value = e.target.value;
                    // If the input is empty, set quantity to 1 (or 0 if you prefer)
                    if (value === '') {
                      setQuantity(1);
                    } else {
                      const numValue = parseInt(value);
                      // Only update if it's a valid number and at least 1
                      if (!isNaN(numValue) && numValue >= 1) {
                        setQuantity(numValue);
                      }
                    }
                  }}
                  className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="Qty"
                />

                <button
                  onClick={handleAddTreatment}
                  disabled={!selectedTreatment}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Tambah
                </button>
              </div>

              {/* Selected Treatment Preview */}
              {selectedTreatment && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  {(() => {
                    const treatment = getSelectedTreatment();
                    if (!treatment) return null;

                    return (
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{treatment.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Durasi: {treatment.duration_minutes} menit
                            </p>
                            {treatment.requires_confirmation && (
                              <p className="text-xs text-orange-600 mt-1">⚠️ Membutuhkan konfirmasi</p>
                            )}
                          </div>
                          <div className="text-right">
                            {treatment.applied_promo ? (
                              <>
                                <p className="text-green-600 font-semibold text-lg">
                                  {formatCurrency(treatment.final_price!)}
                                </p>
                                <p className="text-sm text-gray-500 line-through">
                                  {formatCurrency(treatment.base_price)}
                                </p>
                              </>
                            ) : (
                              <p className="font-semibold text-lg">
                                {formatCurrency(treatment.base_price)}
                              </p>
                            )}
                          </div>
                        </div>

                        {treatment.applied_promo && (
                          <div className="bg-green-100 border border-green-200 rounded p-3 mb-3">
                            <div className="flex items-center gap-2 text-green-800">
                              <span className="text-sm">🎁</span>
                              <div>
                                <p className="font-medium text-sm">
                                  Promo {treatment.applied_promo.name}
                                </p>
                                <p className="text-xs">
                                  Diskon: {treatment.applied_promo.discount_type === 'percentage' 
                                    ? `${treatment.applied_promo.discount_value}%`
                                    : `Rp ${treatment.applied_promo.discount_value.toLocaleString()}`
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="bg-white rounded p-3 border">
                          <p className="text-sm font-medium text-gray-900">
                            Total untuk {quantity} item: {formatCurrency((treatment.final_price || treatment.base_price) * quantity)}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Show selected treatment name when search is empty */}
              {selectedTreatment && !searchTerm && (
                <div className="text-sm text-gray-600">
                  Treatment terpilih: <span className="font-medium">{getSelectedTreatment()?.name}</span>
                  <button
                    onClick={() => {
                      setSelectedTreatment('');
                      setSearchTerm('');
                    }}
                    className="ml-2 text-red-600 hover:text-red-800 text-xs"
                  >
                    ✕ Hapus pilihan
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* FOOTER */}
        <div className="border-t p-4 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-5 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}


function ConsultationModal({ booking, data, onChange, onSave, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Catatan Konsultasi - {booking.user_id.name}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Diagnosis
              </label>
              <textarea
                value={data.diagnosis}
                onChange={(e) => onChange({ ...data, diagnosis: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Masukkan diagnosis..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rekomendasi Treatment
              </label>
              <textarea
                value={data.recommendations}
                onChange={(e) => onChange({ ...data, recommendations: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Masukkan rekomendasi treatment..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catatan Tambahan
              </label>
              <textarea
                value={data.notes}
                onChange={(e) => onChange({ ...data, notes: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Masukkan catatan tambahan..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
              >
                Batal
              </button>
              <button
                onClick={onSave}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
              >
                Simpan Catatan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminBookingsPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(searchParams.get('status') || 'all');
  const [dateFilter, setDateFilter] = useState(searchParams.get('date') || '');
  const [showWalkinModal, setShowWalkinModal] = useState(false);
  const [walkinLoading, setWalkinLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    isVisible: false,
    message: '',
    type: 'info'
  });

  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLogs, setEditLogs] = useState<BookingEditLog[]>([]);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [consultationData, setConsultationData] = useState({
    diagnosis: '',
    recommendations: '',
    notes: ''
  });


  // Walk-in booking state
  const [walkinData, setWalkinData] = useState({
    customerType: 'new', // 'new' or 'existing'
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    selectedUserId: '', // For existing user
    selectedDate: new Date().toISOString().split('T')[0],
    selectedSlot: '',
    selectedTreatment: '',
    treatmentType: 'treatment', // 'treatment' or 'consultation'
    notes: ''
  });

  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [availableDates, setAvailableDates] = useState<{date: string; hasSlots: boolean}[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);


  useEffect(() => {
    fetchBookings();
    if (showWalkinModal || showEditModal) {
      fetchTreatments();
    }
    if (showWalkinModal) {
      fetchAvailableDates();
    }
  }, [filter, dateFilter, showWalkinModal, showEditModal]);

  useEffect(() => {
    if (walkinData.selectedDate && showWalkinModal) {
      fetchSlots(walkinData.selectedDate);
    }
  }, [walkinData.selectedDate, showWalkinModal]);

  // Search users when query changes
  useEffect(() => {
    if (searchQuery.trim() && walkinData.customerType === 'existing') {
      searchUsers(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, walkinData.customerType]);

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

  // Replace your current fetchBookings function with this:
  const fetchBookings = async (searchTerm?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      if (dateFilter) params.append('date', dateFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/admin/bookings?${params}`);
      const data = await response.json();
      
      if (data.success) {
        console.log('Bookings data:', data.bookings);
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      showSnackbar('Gagal memuat data booking', 'error');
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  // Add search function
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setSearchLoading(true);
      // Debounce search to avoid too many requests
      const timeoutId = setTimeout(() => {
        fetchBookings(query.trim());
      }, 500);
      
      // Cleanup function to clear timeout
      return () => clearTimeout(timeoutId);
    } else {
      fetchBookings(); // Reset to all bookings when search is cleared
    }
  };

  // Add clear search function
  const clearSearch = () => {
    setSearchQuery('');
    fetchBookings();
  };
  
  const fetchTreatments = async () => {
    try {
      console.log('🔄 Fetching treatments from:', '/api/admin/treatments?include_promos=true');
      const response = await fetch('/api/admin/treatments?include_promos=true');
      
      // Check if response is HTML (error page)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response received:', text.substring(0, 200));
        throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      console.log('📦 Treatments API response:', data);
      
      if (data.success) {
        // Use the utility function to calculate prices with promos
        const treatmentsWithPromos = data.treatments.map((treatment: any) => 
          calculateTreatmentPrice(treatment)
        );

        console.log('✅ Processed treatments with promos:', treatmentsWithPromos);
        setTreatments(treatmentsWithPromos);
      } else {
        throw new Error(data.error || 'Failed to fetch treatments');
      }
    } catch (error) {
      console.error('❌ Error fetching treatments:', error);
      showSnackbar(
        `Gagal memuat data treatments: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
      // Set empty array as fallback
      setTreatments([]);
    }
  };

  const fetchAvailableDates = async () => {
    try {
      const currentMonth = new Date();
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      
      const response = await fetch(`/api/slots/available-dates?year=${year}&month=${month}`);
      const data = await response.json();
      
      if (data.success) {
        setAvailableDates(data.dates || []);
      }
    } catch (error) {
      console.error('Error fetching available dates:', error);
    }
  };

  const fetchSlots = async (date: string) => {
    try {
      const response = await fetch(`/api/slots?date=${date}`);
      const data = await response.json();
      
      if (data.success) {
        setAvailableSlots(data.slots || []);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
    }
  };

  const searchUsers = async (query: string) => {
    try {
      setSearching(true);
      const response = await fetch(`/api/admin/search-users?q=${encodeURIComponent(query)}&limit=10`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Search endpoint not found');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.users || []);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
      // Only show snackbar for non-404 errors to avoid spamming during development
      if (error instanceof Error && !error.message.includes('404')) {
        showSnackbar('Gagal mencari pelanggan', 'error');
      }
    } finally {
      setSearching(false);
    }
  };

  const selectUser = (user: User) => {
    setWalkinData({
      ...walkinData,
      customerName: user.name,
      customerEmail: user.email,
      customerPhone: user.phone_number || '',
      selectedUserId: user._id
    });
    setSearchQuery(user.name);
    setSearchResults([]);
  };

  const fetchEditLogs = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/edit-logs`);
      const data = await response.json();
      
      if (data.success) {
        setEditLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching edit logs:', error);
    }
  };

  const addTreatmentToBooking = async (treatmentId: string, quantity: number = 1) => {
    if (!editingBooking) return;

    try {
      // Get the treatment with promo info
      const treatment = treatments.find(t => t._id === treatmentId);
      if (!treatment) {
        throw new Error('Treatment tidak ditemukan');
      }

      // ALWAYS use final_price if available (with promo), otherwise use base_price
      const unitPrice = treatment.final_price !== undefined ? treatment.final_price : treatment.base_price;

      console.log('Adding treatment to booking:', {
        treatment: treatment.name,
        base_price: treatment.base_price,
        final_price: treatment.final_price,
        unitPrice,
        hasPromo: treatment.applied_promo !== null
      });

      const response = await fetch(`/api/admin/bookings/${editingBooking._id}/edit-treatments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_treatment',
          treatment_id: treatmentId,
          quantity,
          unit_price: unitPrice // Force using the promo price
        })
      });

      // Check response type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response from edit-treatments:', text.substring(0, 200));
        throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      if (data.success) {
        const promoText = treatment.applied_promo ? ` (dengan promo ${treatment.applied_promo.name})` : '';
        showSnackbar(`Treatment "${treatment.name}" berhasil ditambahkan${promoText}`, 'success');
        fetchBookings();
        setShowEditModal(false);
        setEditingBooking(null);
      } else {
        throw new Error(data.error || 'Gagal menambah treatment');
      }
    } catch (error) {
      console.error('Error adding treatment:', error);
      showSnackbar(
        `Gagal menambah treatment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
    }
  };

  const removeTreatmentFromBooking = async (treatmentId: string) => {
    if (!editingBooking) return;

    try {
      const response = await fetch(`/api/admin/bookings/${editingBooking._id}/edit-treatments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove_treatment',
          treatment_id: treatmentId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        showSnackbar('Treatment berhasil dihapus', 'success');
        fetchBookings();
        setShowEditModal(false);
        setEditingBooking(null);
      } else {
        throw new Error(data.error || 'Gagal menghapus treatment');
      }
    } catch (error) {
      console.error('Error removing treatment:', error);
      showSnackbar('Gagal menghapus treatment', 'error');
    }
  };

  const addConsultationNote = async () => {
  if (!editingBooking) return;

  try {
    const response = await fetch(`/api/admin/bookings/${editingBooking._id}/consultation-notes`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(consultationData)
    });

    // Check if response is HTML (error page)
    const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response received:', text.substring(0, 200));
        throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      if (data.success) {
        showSnackbar('Catatan konsultasi berhasil ditambahkan', 'success');
        fetchBookings();
        setShowConsultationModal(false);
        setEditingBooking(null);
        setConsultationData({ diagnosis: '', recommendations: '', notes: '' });
      } else {
        throw new Error(data.error || 'Gagal menambah catatan konsultasi');
      }
    } catch (error) {
      console.error('Error adding consultation note:', error);
      showSnackbar(
        `Gagal menambah catatan konsultasi: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      if (data.success) {
        showSnackbar('Status booking berhasil diupdate!', 'success');
        fetchBookings();
      } else {
        throw new Error(data.error || 'Gagal mengupdate status');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      showSnackbar(
        `Terjadi kesalahan: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
    }
  };

  const createWalkinBooking = async () => {
    if (!walkinData.customerName || !walkinData.selectedSlot) {
      showSnackbar('Nama pelanggan dan slot waktu wajib diisi', 'error');
      return;
    }

    setWalkinLoading(true);
    try {
      // Get selected treatment with promo info
      let treatmentsData: Array<{
        treatment_id: string;
        quantity: number;
        unit_price: number;
      }> = [];
      
      // In your createWalkinBooking function, update the treatment selection part:
      if (walkinData.treatmentType === 'treatment' && walkinData.selectedTreatment) {
        const selectedTreatment = treatments.find(t => t._id === walkinData.selectedTreatment);
        if (selectedTreatment) {
          // Use final_price (with promo) if available, otherwise use base_price
          const unitPrice = selectedTreatment.final_price || selectedTreatment.base_price;
          treatmentsData = [{
            treatment_id: walkinData.selectedTreatment,
            quantity: 1,
            unit_price: unitPrice // This ensures promo price is used
          }];
        }
      }

      const bookingData = {
        customer_name: walkinData.customerName,
        customer_email: walkinData.customerEmail,
        customer_phone: walkinData.customerPhone,
        slot_id: walkinData.selectedSlot,
        type: walkinData.treatmentType,
        notes: walkinData.notes,
        treatments: treatmentsData, // Fixed variable name
        user_id: walkinData.customerType === 'existing' ? walkinData.selectedUserId : undefined
      };

      const response = await fetch('/api/admin/walkin-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Gagal membuat booking');
      }
      
      if (data.success) {
        showSnackbar('Booking walk-in berhasil dibuat!', 'success');
        setShowWalkinModal(false);
        resetWalkinForm();
        fetchBookings();
      } else {
        throw new Error(data.error || 'Gagal membuat booking');
      }
    } catch (error) {
      console.error('Error creating walk-in booking:', error);
      showSnackbar(
        `Terjadi kesalahan: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
    } finally {
      setWalkinLoading(false);
    }
  };

  const resetWalkinForm = () => {
    setWalkinData({
      customerType: 'new',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      selectedUserId: '',
      selectedDate: new Date().toISOString().split('T')[0],
      selectedSlot: '',
      selectedTreatment: '',
      treatmentType: 'treatment',
      notes: ''
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Dikonfirmasi';
      case 'pending': return 'Menunggu';
      case 'completed': return 'Selesai';
      case 'canceled': return 'Dibatalkan';
      default: return status;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Booking</h1>
          <p className="text-gray-600 mt-2">Kelola semua booking pelanggan</p>
        </div>
        <button
          onClick={() => setShowWalkinModal(true)}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          + Booking Walk-in
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Input */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cari Booking
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-10 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                placeholder="Cari berdasarkan nama, email, telepon, atau ID booking..."
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                🔍
              </div>
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="text-sm text-gray-500 mt-1">
                Menampilkan hasil pencarian untuk: "{searchQuery}"
              </p>
            )}
          </div>
          
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status Booking
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu</option>
              <option value="confirmed">Dikonfirmasi</option>
              <option value="completed">Selesai</option>
              <option value="canceled">Dibatalkan</option>
            </select>
          </div>
          
          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-600">
            {searchLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                Mencari...
              </div>
            ) : (
              `Menampilkan ${bookings.length} booking`
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setFilter('all');
                setDateFilter('');
                setSearchQuery('');
                showSnackbar('Filter telah direset', 'info');
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <p className="mt-2 text-gray-600">Memuat data booking...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">
              {searchQuery ? '🔍' : '📅'}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery ? 'Tidak ada booking ditemukan' : 'Tidak ada booking'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery 
                ? `Tidak ada booking yang sesuai dengan pencarian "${searchQuery}"`
                : 'Tidak ada booking yang sesuai dengan filter yang dipilih.'
              }
            </p>
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Tampilkan Semua Booking
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden">
            {bookings.map((booking) => (
              <BookingCard
                key={booking._id}
                booking={booking}
                onStatusUpdate={updateBookingStatus}
                currentUserRole={session?.user?.role}
                onEditBooking={(booking: Booking, action: string) => {
                  setEditingBooking(booking);
                  if (action === 'edit') {
                    setShowEditModal(true);
                    fetchEditLogs(booking._id);
                  } else if (action === 'consultation') {
                    setShowConsultationModal(true);
                  }
                }}
                editLogs={editLogs}
              />
            ))}
          </div>
        )}
      </div>

      {/* MODALS - MOVED HERE from BookingCard */}
      
      {/* Edit Booking Modal */}
      {showEditModal && editingBooking && (
        <EditBookingModal
          booking={editingBooking}
          treatments={treatments}
          onAddTreatment={addTreatmentToBooking}
          onRemoveTreatment={removeTreatmentFromBooking}
          onClose={() => {
            setShowEditModal(false);
            setEditingBooking(null);
          }}
        />
      )}

      {/* Consultation Notes Modal */}
      {showConsultationModal && editingBooking && (
        <ConsultationModal
          booking={editingBooking}
          data={consultationData}
          onChange={setConsultationData}
          onSave={addConsultationNote}
          onClose={() => {
            setShowConsultationModal(false);
            setEditingBooking(null);
            setConsultationData({ diagnosis: '', recommendations: '', notes: '' });
          }}
        />
      )}
      {/* Walk-in Booking Modal */}
      {showWalkinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Buat Booking Walk-in</h2>
              
              <div className="space-y-4">
                {/* Customer Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jenis Pelanggan
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="new"
                        checked={walkinData.customerType === 'new'}
                        onChange={(e) => {
                          setWalkinData({...walkinData, customerType: e.target.value});
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Pelanggan Baru</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="existing"
                        checked={walkinData.customerType === 'existing'}
                        onChange={(e) => setWalkinData({...walkinData, customerType: e.target.value})}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Pelanggan Existing</span>
                    </label>
                  </div>
                </div>

                {/* Customer Search for Existing Users */}
                {walkinData.customerType === 'existing' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cari Pelanggan
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                        placeholder="Cari berdasarkan nama, email, atau telepon..."
                      />
                      {searching && (
                        <div className="absolute right-3 top-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                        </div>
                      )}
                      
                      {/* Search Results Dropdown */}
                      {searchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {searchResults.map((user) => (
                            <button
                              key={user._id}
                              type="button"
                              onClick={() => selectUser(user)}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-200 last:border-b-0"
                            >
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-gray-600">{user.email}</div>
                              {user.phone_number && (
                                <div className="text-sm text-gray-600">{user.phone_number}</div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {searchQuery && searchResults.length === 0 && !searching && (
                      <p className="text-sm text-gray-500 mt-1">Tidak ada pelanggan ditemukan</p>
                    )}
                  </div>
                )}

                {/* Customer Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Pelanggan *
                    </label>
                    <input
                      type="text"
                      value={walkinData.customerName}
                      onChange={(e) => setWalkinData({...walkinData, customerName: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      placeholder="Masukkan nama pelanggan"
                      disabled={walkinData.customerType === 'existing'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Pelanggan
                    </label>
                    <input
                      type="email"
                      value={walkinData.customerEmail}
                      onChange={(e) => setWalkinData({...walkinData, customerEmail: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      placeholder="email@contoh.com"
                      disabled={walkinData.customerType === 'existing'}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor Telepon
                  </label>
                  <input
                    type="tel"
                    value={walkinData.customerPhone}
                    onChange={(e) => setWalkinData({...walkinData, customerPhone: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    placeholder="081234567890"
                    disabled={walkinData.customerType === 'existing'}
                  />
                </div>

                {/* Treatment Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jenis Layanan
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="treatment"
                        checked={walkinData.treatmentType === 'treatment'}
                        onChange={(e) => setWalkinData({...walkinData, treatmentType: e.target.value})}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Treatment</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="consultation"
                        checked={walkinData.treatmentType === 'consultation'}
                        onChange={(e) => setWalkinData({...walkinData, treatmentType: e.target.value})}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Konsultasi</span>
                    </label>
                  </div>
                </div>

                {/* Treatment Selection */}
                {walkinData.treatmentType === 'treatment' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pilih Treatment
                    </label>
                    <select
                      value={walkinData.selectedTreatment}
                      onChange={(e) => setWalkinData({...walkinData, selectedTreatment: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    >
                      <option value="">Pilih treatment...</option>
                      {treatments.map((treatment) => (
                        <option key={treatment._id} value={treatment._id}>
                          {treatment.name} - {formatCurrency(treatment.final_price || treatment.base_price)}
                          {treatment.applied_promo && (
                            ` 🎁 (Promo: ${treatment.applied_promo.discount_type === 'percentage' 
                              ? `${treatment.applied_promo.discount_value}%` 
                              : `Rp ${treatment.applied_promo.discount_value.toLocaleString()}`})`
                          )}
                          {treatment.applied_promo && treatment.final_price !== treatment.base_price && (
                            ` ❌ ${formatCurrency(treatment.base_price)}`
                          )}
                        </option>
                      ))}
                    </select>
                    
                    {/* Show promo details when treatment is selected */}
                    {walkinData.selectedTreatment && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        {(() => {
                          const selectedTreatment = treatments.find(t => t._id === walkinData.selectedTreatment);
                          if (!selectedTreatment) return null;
                          
                          return (
                            <div className="text-sm">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">{selectedTreatment.name}</span>
                                <div className="text-right">
                                  {selectedTreatment.applied_promo ? (
                                    <>
                                      <div className="text-green-600 font-semibold">
                                        {formatCurrency(selectedTreatment.final_price!)}
                                      </div>
                                      <div className="text-gray-500 text-xs line-through">
                                        {formatCurrency(selectedTreatment.base_price)}
                                      </div>
                                    </>
                                  ) : (
                                    <div className="font-semibold">
                                      {formatCurrency(selectedTreatment.base_price)}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {selectedTreatment.applied_promo && (
                                <div className="bg-green-100 border border-green-200 rounded p-2">
                                  <div className="flex items-center gap-2 text-green-800">
                                    <span className="text-xs">🎁</span>
                                    <span className="text-xs font-medium">
                                      Promo {selectedTreatment.applied_promo.name}: 
                                      {selectedTreatment.applied_promo.discount_type === 'percentage' 
                                        ? ` ${selectedTreatment.applied_promo.discount_value}% off`
                                        : ` Rp ${selectedTreatment.applied_promo.discount_value.toLocaleString()} off`
                                      }
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pilih Tanggal
                  </label>
                  <input
                    type="date"
                    value={walkinData.selectedDate}
                    onChange={(e) => setWalkinData({...walkinData, selectedDate: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  />
                </div>

                {/* Time Slot Selection */}
                {walkinData.selectedDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pilih Waktu
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                      {availableSlots.length === 0 ? (
                        <div className="col-span-full text-center text-gray-500 p-4 border rounded-lg">
                          Tidak ada slot tersedia untuk tanggal ini
                        </div>
                      ) : (
                        availableSlots.map((slot) => (
                          <button
                            key={slot._id}
                            onClick={() => setWalkinData({...walkinData, selectedSlot: slot._id})}
                            className={`p-3 border rounded-lg text-sm font-medium transition-all ${
                              walkinData.selectedSlot === slot._id
                                ? 'bg-purple-600 text-white border-purple-600 shadow-lg transform scale-105'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-purple-300 hover:bg-purple-50'
                            } ${!slot.is_available ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={!slot.is_available}
                          >
                            {slot.start_time} - {slot.end_time}
                            {!slot.is_available && <div className="text-xs text-red-600">(Dibooking)</div>}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catatan (opsional)
                  </label>
                  <textarea
                    value={walkinData.notes}
                    onChange={(e) => setWalkinData({...walkinData, notes: e.target.value})}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    placeholder="Catatan khusus untuk treatment..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowWalkinModal(false);
                      resetWalkinForm();
                    }}
                    disabled={walkinLoading}
                    className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Batal
                  </button>
                  <button
                    onClick={createWalkinBooking}
                    disabled={walkinLoading || !walkinData.customerName || !walkinData.selectedSlot}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {walkinLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Membuat...
                      </>
                    ) : (
                      'Buat Booking'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
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

// Helper functions (same as before)
function getStatusColor(status: string) {
  switch (status) {
    case 'confirmed': return 'bg-green-100 text-green-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'completed': return 'bg-blue-100 text-blue-800';
    case 'canceled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'confirmed': return 'Dikonfirmasi';
    case 'pending': return 'Menunggu';
    case 'completed': return 'Selesai';
    case 'canceled': return 'Dibatalkan';
    default: return status;
  }
}

function getEditLogMessage(log: BookingEditLog): string {
  switch (log.action) {
    case 'added_treatment':
      return `Menambah treatment: ${log.details.treatment_name} (${log.details.quantity}x)`;
    case 'removed_treatment':
      return `Menghapus treatment: ${log.details.treatment_name}`;
    case 'updated_treatment':
      return `Mengupdate treatment: ${log.details.treatment_name} (${log.details.quantity}x)`;
    case 'added_consultation_note':
      return `Menambah catatan konsultasi`;
    default:
      return `Mengupdate booking`;
  }
}

// BookingCard component remains the same as before...
function BookingCard({ 
  booking, 
  onStatusUpdate, 
  currentUserRole,
  onEditBooking,
  editLogs
}: any) {
  const [showDetails, setShowDetails] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const canUpdateStatus = ['admin', 'superadmin', 'kasir', 'doctor'].includes(currentUserRole);
  const canEditBooking = ['admin', 'superadmin', 'doctor'].includes(currentUserRole);
  const canAddConsultation = ['admin', 'superadmin', 'doctor'].includes(currentUserRole);

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <div className="p-6 hover:bg-gray-50 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                {getStatusText(booking.status)}
              </span>
              <span className="text-sm text-gray-500">
                ID: {booking._id.slice(-8)}
              </span>
              {booking.payment && (
                <span className={`px-2 py-1 rounded-full text-xs ${
                  booking.payment.status === 'paid' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {booking.payment.status === 'paid' ? 'Lunas' : 'Belum Bayar'}
                </span>
              )}
            </div>
            
            <div className="grid md:grid-cols-4 gap-4 mb-3">
              <div>
                <p className="text-sm text-gray-600">Pelanggan</p>
                <p className="font-medium">{booking.user_id.name}</p>
                <p className="text-sm text-gray-500">{booking.user_id.email}</p>
                {booking.user_id.phone_number && (
                  <p className="text-sm text-gray-500">{booking.user_id.phone_number}</p>
                )}
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Tanggal & Waktu</p>
                <p className="font-medium">
                  {formatDate(booking.slot_id.date)} • {booking.slot_id.start_time}
                </p>
                <p className="text-sm text-gray-500">
                  {booking.slot_id.doctor_id?.name && `Dokter: ${booking.slot_id.doctor_id.name}`}
                  {booking.slot_id.therapist_id?.name && `Therapist: ${booking.slot_id.therapist_id.name}`}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Treatment</p>
                <p className="font-medium">
                  {booking.treatments && booking.treatments.length > 0 
                    ? `${booking.treatments.length} treatment` 
                    : booking.type === 'consultation' ? 'Konsultasi' : 'Treatment'
                  }
                </p>
                <p className="text-sm text-gray-500">
                  Total: {formatCurrency(booking.total_amount)}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Dibuat</p>
                <p className="font-medium">{formatDate(booking.created_at)}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                {showDetails ? 'Sembunyikan' : 'Lihat'} Detail
              </button>
              
              {canUpdateStatus && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Ubah Status:</span>
                  <select
                    value={booking.status}
                    onChange={(e) => onStatusUpdate(booking._id, e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:border-purple-500 focus:ring-1 focus:ring-purple-200"
                  >
                    <option value="pending">Menunggu</option>
                    <option value="confirmed">Dikonfirmasi</option>
                    <option value="completed">Selesai</option>
                    <option value="canceled">Dibatalkan</option>
                  </select>
                </div>
              )}

              {/* Edit Actions Dropdown */}
              {(canEditBooking || canAddConsultation) && (
                <div className="relative">
                  <button
                    onClick={() => setShowActions(!showActions)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Aksi ▼
                  </button>
                  
                  {showActions && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                      {canEditBooking && (
                        <button
                          onClick={() => {
                            onEditBooking(booking, 'edit');
                            setShowActions(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Edit Treatments
                        </button>
                      )}
                      {canAddConsultation && (
                        <button
                          onClick={() => {
                            onEditBooking(booking, 'consultation');
                            setShowActions(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {booking.type === 'consultation' ? 'Edit Catatan Konsultasi' : 'Tambah Catatan Konsultasi'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {showDetails && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Treatments - Updated to show saved prices */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Detail Treatment</h4>
                {booking.treatments && booking.treatments.length > 0 ? (
                  <div className="space-y-2">
                    {booking.treatments.map((treatment: any, index: number) => (
                      <div key={index} className="p-3 bg-white rounded border">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="font-medium">{treatment.treatment_id?.name}</p>
                            <p className="text-sm text-gray-600">Qty: {treatment.quantity}</p>
                            
                            {/* Show promo info if applied */}
                            {treatment.promo_applied && (
                              <div className="mt-1 flex items-center gap-1">
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                  🎁 {treatment.promo_applied.promo_name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({treatment.promo_applied.discount_type === 'percentage' 
                                    ? `${treatment.promo_applied.discount_value}%` 
                                    : `Rp ${treatment.promo_applied.discount_value.toLocaleString()}`} off)
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="text-right">
                            {/* Show the saved price (the price they actually paid) */}
                            <p className="font-semibold text-green-600">
                              {formatCurrency(treatment.price)} each
                            </p>
                            
                            {/* Show original price if there was a promo */}
                            {treatment.promo_applied && treatment.original_price && treatment.original_price > treatment.price && (
                              <p className="text-xs text-gray-500 line-through">
                                {formatCurrency(treatment.original_price)}
                              </p>
                            )}
                            
                            {/* Show subtotal */}
                            <p className="text-sm text-gray-600 mt-1">
                              Subtotal: {formatCurrency(treatment.price * treatment.quantity)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Total Amount */}
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">Total Amount:</span>
                        <span className="text-xl font-bold text-purple-600">
                          {formatCurrency(booking.total_amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600">
                    {booking.type === 'consultation' ? 'Konsultasi' : 'Treatment umum'}
                  </p>
                )}
              </div>

              {/* Consultation Notes & Edit Logs */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Informasi Tambahan</h4>
                
                {/* Consultation Notes */}
                {booking.consultation_notes && booking.consultation_notes.length > 0 && (
                  <div className="mb-4">
                    <h5 className="font-medium text-gray-700 mb-2">Catatan Konsultasi:</h5>
                    {booking.consultation_notes.map((note: ConsultationNote, index: number) => (
                      <div key={index} className="mb-3 p-3 bg-white rounded border">
                        {note.diagnosis && <p><strong>Diagnosis:</strong> {note.diagnosis}</p>}
                        {note.recommendations && <p><strong>Rekomendasi:</strong> {note.recommendations}</p>}
                        {note.notes && <p><strong>Catatan:</strong> {note.notes}</p>}
                        <p className="text-xs text-gray-500 mt-1">
                          Ditambahkan oleh: {note.added_by.name} • {formatDate(note.added_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Edit Logs */}
                {editLogs && editLogs.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Riwayat Edit:</h5>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {editLogs.map((log: BookingEditLog) => (
                        <div key={log._id} className="text-xs text-gray-600 p-2 bg-white rounded border">
                          <p>{getEditLogMessage(log)}</p>
                          <p className="text-gray-400">
                            oleh {log.edited_by.name} • {formatDate(log.created_at)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>  
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
