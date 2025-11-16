// app/admin/bookings/page.tsx - Updated version with user search
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Snackbar, SnackbarType } from '../../components/ui/snackbar';
import { formatCurrency, formatDate } from '../../lib/utils';

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
}

interface Treatment {
  _id: string;
  name: string;
  description?: string;
  base_price: number;
  duration_minutes: number;
  requires_confirmation?: boolean;
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

  useEffect(() => {
    fetchBookings();
    if (showWalkinModal) {
      fetchTreatments();
      fetchAvailableDates();
    }
  }, [filter, dateFilter, showWalkinModal]);

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

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      if (dateFilter) params.append('date', dateFilter);

      const response = await fetch(`/api/admin/bookings?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      showSnackbar('Gagal memuat data booking', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTreatments = async () => {
    try {
      const response = await fetch('/api/treatments');
      const data = await response.json();
      
      if (data.success) {
        setTreatments(data.treatments);
      }
    } catch (error) {
      console.error('Error fetching treatments:', error);
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
      const bookingData = {
        customer_name: walkinData.customerName,
        customer_email: walkinData.customerEmail,
        customer_phone: walkinData.customerPhone,
        slot_id: walkinData.selectedSlot,
        type: walkinData.treatmentType,
        notes: walkinData.notes,
        treatments: walkinData.treatmentType === 'consultation' ? [] : [
          {
            treatment_id: walkinData.selectedTreatment,
            quantity: 1
          }
        ],
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

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
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
          
          <div className="flex-1">
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

          <div className="flex items-end">
            <button
              onClick={() => {
                setFilter('all');
                setDateFilter('');
                showSnackbar('Filter telah direset', 'info');
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Reset
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
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Tidak ada booking</h3>
            <p className="text-gray-600">Tidak ada booking yang sesuai dengan filter yang dipilih.</p>
          </div>
        ) : (
          <div className="overflow-hidden">
            {bookings.map((booking) => (
              <BookingCard
                key={booking._id}
                booking={booking}
                onStatusUpdate={updateBookingStatus}
                currentUserRole={session?.user?.role}
              />
            ))}
          </div>
        )}
      </div>

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
                          {treatment.name} - {formatCurrency(treatment.base_price)}
                        </option>
                      ))}
                    </select>
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

// BookingCard component remains the same as before...
function BookingCard({ booking, onStatusUpdate, currentUserRole }: any) {
  const [showDetails, setShowDetails] = useState(false);

  const canUpdateStatus = ['admin', 'superadmin', 'kasir'].includes(currentUserRole);

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
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {showDetails && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Treatments */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Detail Treatment</h4>
                {booking.treatments && booking.treatments.length > 0 ? (
                  <div className="space-y-2">
                    {booking.treatments.map((treatment: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-white rounded">
                        <div>
                          <p className="font-medium">{treatment.treatment_id?.name}</p>
                          <p className="text-sm text-gray-600">Qty: {treatment.quantity}</p>
                        </div>
                        <p className="font-semibold">{formatCurrency(treatment.price)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">
                    {booking.type === 'consultation' ? 'Konsultasi' : 'Treatment umum'}
                  </p>
                )}
              </div>

              {/* Notes & Additional Info */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Informasi Tambahan</h4>
                {booking.notes && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-1">Catatan:</p>
                    <p className="text-sm bg-white p-2 rounded">{booking.notes}</p>
                  </div>
                )}
                
                {booking.payment && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Pembayaran:</p>
                    <p className="text-sm">
                      Status: <span className={booking.payment.status === 'paid' ? 'text-green-600' : 'text-yellow-600'}>
                        {booking.payment.status === 'paid' ? 'Lunas' : 'Belum Bayar'}
                      </span>
                    </p>
                    {booking.payment.payment_method && (
                      <p className="text-sm">Metode: {booking.payment.payment_method}</p>
                    )}
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