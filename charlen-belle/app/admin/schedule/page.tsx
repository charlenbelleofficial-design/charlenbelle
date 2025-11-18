// app/admin/schedule/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Snackbar, SnackbarType } from '../../components/ui/snackbar';
import { formatDate } from '../../lib/utils';
import { ConfirmationModal } from '../../components/ui/confirmation-modal';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface BookingSlot {
  _id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  doctor_id?: { _id: string; name: string }; // Made optional
  therapist_id?: { _id: string; name: string }; // Made optional
  booking_id?: {
    _id: string;
    user_id: { name: string; email: string };
    type: string;
    status: string;
  };
}

interface Holiday {
  _id: string;
  date: string;
  name: string;
  description?: string;
  is_recurring: boolean;
}

interface SnackbarState {
  isVisible: boolean;
  message: string;
  type: SnackbarType;
}

interface BulkScheduleData {
  startDate: string;
  endDate: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  timeInterval: number;
  excludeHolidays: boolean;
  doctorId: string;
  therapistId: string;
}

interface CalendarDay {
  date: string;
  day: number;
  hasSlots: boolean;
  slotCount: number;
  availableSlots: number;
  bookedSlots: number;
  isToday: boolean;
  isSelected: boolean;
  isPast: boolean;
}

export default function AdminSchedulePage() {
  const { data: session } = useSession();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [therapists, setTherapists] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [bulkCreating, setBulkCreating] = useState(false);
  const [holidayCreating, setHolidayCreating] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    isVisible: false,
    message: '',
    type: 'info'
  });
  const [showDeleteSlotModal, setShowDeleteSlotModal] = useState(false);
  const [showDeleteHolidayModal, setShowDeleteHolidayModal] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [selectedHolidayId, setSelectedHolidayId] = useState<string | null>(null);
  const [editingSlot, setEditingSlot] = useState<BookingSlot | null>(null);
  const [staffLoading, setStaffLoading] = useState(true);

  const [bulkData, setBulkData] = useState<BulkScheduleData>({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    daysOfWeek: [1, 2, 3, 4, 5, 6],
    startTime: '10:00',
    endTime: '18:00',
    timeInterval: 60,
    excludeHolidays: true,
    doctorId: '',
    therapistId: ''
  });

  const [holidayData, setHolidayData] = useState({
    date: new Date().toISOString().split('T')[0],
    name: '',
    description: '',
    is_recurring: false
  });

  useEffect(() => {
    fetchSchedule();
    fetchHolidays();
    fetchCalendarData();
    fetchDoctorsAndTherapists();
  }, [selectedDate, currentMonth]);

  const fetchDoctorsAndTherapists = async () => {
    try {
      setStaffLoading(true);
      const response = await fetch('/api/admin/users/staff');
      
      // Check if response is HTML (error page)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        console.warn('API returned HTML, using empty arrays');
        setDoctors([]);
        setTherapists([]);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Ensure we have arrays even if API returns undefined
        setDoctors(data.doctors || []);
        setTherapists(data.therapists || []);
        
        // Set default values for bulk data if not set
        if (data.doctors?.length > 0 && !bulkData.doctorId) {
          setBulkData(prev => ({ ...prev, doctorId: data.doctors[0]._id }));
        }
        if (data.therapists?.length > 0 && !bulkData.therapistId) {
          setBulkData(prev => ({ ...prev, therapistId: data.therapists[0]._id }));
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      // Set empty arrays to prevent errors
      setDoctors([]);
      setTherapists([]);
      showSnackbar('Gagal memuat data staff', 'error');
    } finally {
      setStaffLoading(false);
    }
  };

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

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/schedule?date=${selectedDate}`);
      const data = await response.json();
      
      if (data.success) {
        setSlots(data.slots);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      showSnackbar('Gagal memuat jadwal', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchHolidays = async () => {
    try {
      const response = await fetch('/api/admin/holidays');
      const data = await response.json();
      
      if (data.success) {
        setHolidays(data.holidays);
      }
    } catch (error) {
      console.error('Error fetching holidays:', error);
    }
  };

  const fetchCalendarData = async () => {
    try {
      setCalendarLoading(true);
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const response = await fetch(`/api/admin/schedule/calendar?year=${year}&month=${month}`);
      const data = await response.json();
      
      if (data.success) {
        setCalendarDays(data.days || []);
      }
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setCalendarLoading(false);
    }
  };

  const toggleSlotAvailability = async (slotId: string, currentStatus: boolean) => {
    setActionLoading(slotId);
    try {
      const response = await fetch(`/api/admin/schedule/${slotId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_available: !currentStatus })
      });

      const data = await response.json();
      
      if (data.success) {
        showSnackbar('Status slot berhasil diupdate', 'success');
        fetchSchedule();
        fetchCalendarData(); // Refresh calendar
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error updating slot:', error);
      showSnackbar('Gagal mengupdate slot', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteSlotClick = (slotId: string) => {
    setSelectedSlotId(slotId);
    setShowDeleteSlotModal(true);
  };

  const deleteSlot = async () => {
    if (!selectedSlotId) return;
    
    setActionLoading(selectedSlotId);
    try {
      const response = await fetch(`/api/admin/schedule/${selectedSlotId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        showSnackbar('Slot berhasil dihapus', 'success');
        fetchSchedule();
        fetchCalendarData(); // Refresh calendar
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error deleting slot:', error);
      showSnackbar('Gagal menghapus slot', 'error');
    } finally {
      setActionLoading(null);
      setSelectedSlotId(null);
      setShowDeleteSlotModal(false);
    }
  };

  const createBulkSchedule = async () => {
    setBulkCreating(true);
    try {
      const response = await fetch('/api/admin/schedule/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bulkData)
      });

      const data = await response.json();
      
      if (data.success) {
        showSnackbar(`Berhasil membuat ${data.createdSlots} slot`, 'success');
        setShowBulkModal(false);
        fetchSchedule();
        fetchCalendarData(); // Refresh calendar
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error creating bulk schedule:', error);
      showSnackbar('Gagal membuat jadwal', 'error');
    } finally {
      setBulkCreating(false);
    }
  };

  const createHoliday = async () => {
    setHolidayCreating(true);
    try {
      const response = await fetch('/api/admin/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(holidayData)
      });

      const data = await response.json();
      
      if (data.success) {
        showSnackbar('Hari libur berhasil ditambahkan', 'success');
        setShowHolidayModal(false);
        setHolidayData({
          date: new Date().toISOString().split('T')[0],
          name: '',
          description: '',
          is_recurring: false
        });
        fetchHolidays();
        fetchCalendarData(); // Refresh calendar
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error creating holiday:', error);
      showSnackbar('Gagal menambahkan hari libur', 'error');
    } finally {
      setHolidayCreating(false);
    }
  };

  const handleDeleteHolidayClick = (holidayId: string) => {
    setSelectedHolidayId(holidayId);
    setShowDeleteHolidayModal(true);
  };

  const deleteHoliday = async () => {
    if (!selectedHolidayId) return;
    
    setActionLoading(selectedHolidayId);
    try {
      const response = await fetch(`/api/admin/holidays/${selectedHolidayId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        showSnackbar('Hari libur berhasil dihapus', 'success');
        fetchHolidays();
        fetchCalendarData(); // Refresh calendar
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error deleting holiday:', error);
      showSnackbar('Gagal menghapus hari libur', 'error');
    } finally {
      setActionLoading(null);
      setSelectedHolidayId(null);
      setShowDeleteHolidayModal(false);
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    const [startHour, startMinute] = bulkData.startTime.split(':').map(Number);
    const [endHour, endMinute] = bulkData.endTime.split(':').map(Number);
    
    let currentTime = new Date();
    currentTime.setHours(startHour, startMinute, 0, 0);
    
    const endTime = new Date();
    endTime.setHours(endHour, endMinute, 0, 0);
    
    while (currentTime < endTime) {
      const startStr = currentTime.toTimeString().slice(0, 5);
      currentTime.setMinutes(currentTime.getMinutes() + bulkData.timeInterval);
      const endStr = currentTime.toTimeString().slice(0, 5);
      
      slots.push(`${startStr} - ${endStr}`);
    }
    
    return slots;
  };

  const updateSlotStaff = async (slotId: string, doctorId: string, therapistId: string) => {
    setActionLoading(slotId);
    try {
      const response = await fetch(`/api/admin/schedule/${slotId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          doctor_id: doctorId,
          therapist_id: therapistId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        showSnackbar('Staff slot berhasil diupdate', 'success');
        fetchSchedule();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error updating slot staff:', error);
      showSnackbar('Gagal mengupdate staff slot', 'error');
    } finally {
      setActionLoading(null);
      setEditingSlot(null);
    }
  };

  const handleEditSlotClick = (slot: BookingSlot) => {
    setEditingSlot({
      ...slot,
      doctor_id: slot.doctor_id || { _id: '', name: '' },
      therapist_id: slot.therapist_id || { _id: '', name: '' }
    });
  };

  const handleCancelEdit = () => {
    setEditingSlot(null);
  };

  const handleSaveEdit = (slotId: string) => {
    if (!editingSlot) return;
    
    // Ensure we have valid IDs
    if (!editingSlot.doctor_id?._id || !editingSlot.therapist_id?._id) {
      showSnackbar('Harap pilih dokter dan terapis', 'error');
      return;
    }
    
    updateSlotStaff(
      slotId, 
      editingSlot.doctor_id._id, 
      editingSlot.therapist_id._id
    );
  };

  // Calendar navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Generate calendar grid
  const generateCalendarGrid = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDay = firstDay.getDay(); // 0 = Sunday
    const totalDays = lastDay.getDate();
    
    const days = [];
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const calendarDay = calendarDays.find(d => d.date === dateStr);
      
      days.push(calendarDay || {
        date: dateStr,
        day,
        hasSlots: false,
        slotCount: 0,
        availableSlots: 0,
        bookedSlots: 0,
        isToday: dateStr === new Date().toISOString().split('T')[0],
        isSelected: selectedDate === dateStr,
        isPast: new Date(dateStr) < new Date(new Date().setHours(0, 0, 0, 0))
      });
    }
    
    return days;
  };

  const calendarGrid = generateCalendarGrid();
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manajemen Jadwal Booking</h1>
        <p className="text-gray-600 mt-2">Kelola jadwal booking dan hari libur</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendar View */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Kalender Jadwal</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBulkModal(true)}
                  disabled={bulkCreating}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {bulkCreating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Membuat...
                    </>
                  ) : (
                    <>
                      <span>+</span>
                      Bulk Schedule
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowHolidayModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <span>+</span>
                  Tambah Libur
                </button>
              </div>
            </div>

            {/* Calendar Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => navigateMonth('prev')}
                disabled={calendarLoading}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ←
              </button>
              <h3 className="text-lg font-semibold">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                {calendarLoading && <span className="text-sm text-gray-500 ml-2">(memuat...)</span>}
              </h3>
              <button 
                onClick={() => navigateMonth('next')}
                disabled={calendarLoading}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                →
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarGrid.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="h-20" />;
                }

                return (
                  <button
                    key={day.date}
                    onClick={() => !day.isPast && setSelectedDate(day.date)}
                    disabled={day.isPast}
                    className={`
                      h-20 rounded-lg text-sm font-medium transition-all border-2 flex flex-col items-center justify-center p-1
                      ${day.isSelected 
                        ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-lg transform scale-105' 
                        : day.isToday
                        ? 'border-purple-300 bg-white text-gray-900'
                        : day.hasSlots
                        ? day.availableSlots > 0
                          ? 'border-green-200 bg-green-50 text-green-800 hover:bg-green-100 hover:shadow-md'
                          : 'border-red-200 bg-red-50 text-red-800 hover:bg-red-100 hover:shadow-md'
                        : 'border-gray-200 bg-gray-50 text-gray-400 hover:bg-gray-100'
                      }
                      ${day.isPast ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                    title={day.hasSlots ? 
                      `${day.availableSlots} tersedia, ${day.bookedSlots} dibooking` : 
                      'Tidak ada slot'
                    }
                  >
                    <span className="text-base font-semibold">{day.day}</span>
                    {day.hasSlots && (
                      <div className="flex flex-col items-center text-xs mt-1">
                        <div className="flex gap-1">
                          <span className="text-green-600">✓{day.availableSlots}</span>
                          <span className="text-red-600">✗{day.bookedSlots}</span>
                        </div>
                      </div>
                    )}
                    {holidays.some(h => h.date.split('T')[0] === day.date) && (
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-1"></div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Calendar Legend */}
            <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-50 border-2 border-green-200 rounded"></div>
                <span>Slot Tersedia</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-50 border-2 border-red-200 rounded"></div>
                <span>Semua Terbooking</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-600 rounded"></div>
                <span>Terpilih</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Hari Libur</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Selected Date Schedule */}
          {/* Selected Date Schedule */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Jadwal {formatDate(selectedDate)}
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                {slots.length} total slot
              </p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <p className="mt-2 text-gray-600">Memuat jadwal...</p>
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Tidak ada jadwal</h3>
                <p className="text-gray-600">Tidak ada slot booking untuk tanggal ini.</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto divide-y divide-gray-200">
                {slots.map((slot) => (
                  <div key={slot._id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-gray-900">
                            {slot.start_time} - {slot.end_time}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            slot.is_available 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {slot.is_available ? 'Tersedia' : 'Dibooking'}
                          </span>
                        </div>
                        
                        {/* Staff Information */}
                        {editingSlot && editingSlot._id === slot._id ? (
                          <div className="space-y-2 mb-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Dokter
                              </label>
                              <select
                                value={editingSlot.doctor_id?._id || ''}
                                onChange={(e) => setEditingSlot({
                                  ...editingSlot,
                                  doctor_id: { 
                                    _id: e.target.value, 
                                    name: doctors.find(d => d._id === e.target.value)?.name || '' 
                                  }
                                })}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              >
                                <option value="">Pilih Dokter</option>
                                {doctors.map(doctor => (
                                  <option key={doctor._id} value={doctor._id}>
                                    {doctor.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Terapis
                              </label>
                              <select
                                value={editingSlot.therapist_id?._id || ''}
                                onChange={(e) => setEditingSlot({
                                  ...editingSlot,
                                  therapist_id: { 
                                    _id: e.target.value, 
                                    name: therapists.find(t => t._id === e.target.value)?.name || '' 
                                  }
                                })}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              >
                                <option value="">Pilih Terapis</option>
                                {therapists.map(therapist => (
                                  <option key={therapist._id} value={therapist._id}>
                                    {therapist.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600 space-y-1 mb-3">
                            <div className="flex gap-4">
                              <div>
                                <span className="font-medium">Dokter:</span>{' '}
                                {slot.doctor_id?.name || 'Belum ditentukan'}
                              </div>
                              <div>
                                <span className="font-medium">Terapis:</span>{' '}
                                {slot.therapist_id?.name || 'Belum ditentukan'}
                              </div>
                            </div>
                          </div>
                        )}

                        {slot.booking_id && (
                          <div className="text-sm text-gray-600 space-y-1">
                            <p className="font-medium">{slot.booking_id.user_id.name}</p>
                            <p className="text-xs">{slot.booking_id.user_id.email}</p>
                            <div className="flex gap-2 text-xs">
                              <span className="capitalize">{slot.booking_id.type}</span>
                              <span>•</span>
                              <span className="capitalize">{slot.booking_id.status}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {editingSlot && editingSlot._id === slot._id ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(slot._id)}
                              disabled={actionLoading === slot._id}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
                            >
                              {actionLoading === slot._id ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                              ) : (
                                'Simpan'
                              )}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              disabled={actionLoading === slot._id}
                              className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                              Batal
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditSlotClick(slot)}
                              disabled={actionLoading === slot._id}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                            >
                              Edit Staff
                            </button>
                            <button
                              onClick={() => toggleSlotAvailability(slot._id, slot.is_available)}
                              disabled={actionLoading === slot._id}
                              className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-1 ${
                                slot.is_available 
                                  ? 'bg-yellow-600 text-white hover:bg-yellow-700 disabled:bg-yellow-400' 
                                  : 'bg-green-600 text-white hover:bg-green-700 disabled:bg-green-400'
                              } disabled:cursor-not-allowed`}
                            >
                              {actionLoading === slot._id ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                              ) : (
                                slot.is_available ? 'Tutup' : 'Buka'
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteSlotClick(slot._id)}
                              disabled={actionLoading === slot._id}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors"
                            >
                              {actionLoading === slot._id ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                              ) : (
                                'Hapus'
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Holidays List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Hari Libur</h2>
              <p className="text-gray-600 text-sm mt-1">
                {holidays.length} hari libur
              </p>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {holidays.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Belum ada hari libur</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {holidays.map((holiday) => (
                    <div key={holiday._id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{holiday.name}</h3>
                          <p className="text-sm text-gray-600">{formatDate(holiday.date)}</p>
                          {holiday.description && (
                            <p className="text-sm text-gray-500 mt-1">{holiday.description}</p>
                          )}
                          {holiday.is_recurring && (
                            <span className="inline-block mt-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                              Berulang
                            </span>
                          )}
                        </div>
                        <button
                        onClick={() => handleDeleteHolidayClick(holiday._id)}
                        disabled={actionLoading === holiday._id}
                        className="text-red-600 hover:text-red-800 text-sm disabled:text-red-400 disabled:cursor-not-allowed transition-colors"
                        >
                        {actionLoading === holiday._id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                        ) : (
                            'Hapus'
                        )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Schedule Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Buat Jadwal Massal</h2>
              
              <div className="space-y-4">
                 {/* Staff Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dokter
                      </label>
                      <select
                        value={bulkData.doctorId}
                        onChange={(e) => setBulkData({ ...bulkData, doctorId: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                        disabled={doctors.length === 0}
                      >
                        <option value="">{doctors.length === 0 ? 'Tidak ada dokter' : 'Pilih Dokter'}</option>
                        {doctors.map(doctor => (
                          <option key={doctor._id} value={doctor._id}>
                            {doctor.name}
                          </option>
                        ))}
                      </select>
                      {doctors.length === 0 && (
                        <p className="text-xs text-red-500 mt-1">Belum ada data dokter</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Terapis
                      </label>
                      <select
                        value={bulkData.therapistId}
                        onChange={(e) => setBulkData({ ...bulkData, therapistId: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                        disabled={therapists.length === 0}
                      >
                        <option value="">{therapists.length === 0 ? 'Tidak ada terapis' : 'Pilih Terapis'}</option>
                        {therapists.map(therapist => (
                          <option key={therapist._id} value={therapist._id}>
                            {therapist.name}
                          </option>
                        ))}
                      </select>
                      {therapists.length === 0 && (
                        <p className="text-xs text-red-500 mt-1">Belum ada data terapis</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tanggal Mulai
                      </label>
                      <input
                        type="date"
                        value={bulkData.startDate}
                        onChange={(e) => setBulkData({ ...bulkData, startDate: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tanggal Selesai
                      </label>
                      <input
                        type="date"
                        value={bulkData.endDate}
                        onChange={(e) => setBulkData({ ...bulkData, endDate: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      />
                    </div>
                  </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hari Operasional
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value: 0, label: 'Minggu' },
                      { value: 1, label: 'Senin' },
                      { value: 2, label: 'Selasa' },
                      { value: 3, label: 'Rabu' },
                      { value: 4, label: 'Kamis' },
                      { value: 5, label: 'Jumat' },
                      { value: 6, label: 'Sabtu' }
                    ].map(day => (
                      <label key={day.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={bulkData.daysOfWeek.includes(day.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBulkData({
                                ...bulkData,
                                daysOfWeek: [...bulkData.daysOfWeek, day.value]
                              });
                            } else {
                              setBulkData({
                                ...bulkData,
                                daysOfWeek: bulkData.daysOfWeek.filter(d => d !== day.value)
                              });
                            }
                          }}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{day.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jam Mulai
                    </label>
                    <input
                      type="time"
                      value={bulkData.startTime}
                      onChange={(e) => setBulkData({ ...bulkData, startTime: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jam Selesai
                    </label>
                    <input
                      type="time"
                      value={bulkData.endTime}
                      onChange={(e) => setBulkData({ ...bulkData, endTime: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Interval (menit)
                    </label>
                    <select
                      value={bulkData.timeInterval}
                      onChange={(e) => setBulkData({ ...bulkData, timeInterval: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    >
                      <option value={30}>30 menit</option>
                      <option value={60}>60 menit</option>
                      <option value={90}>90 menit</option>
                      <option value={120}>120 menit</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={bulkData.excludeHolidays}
                      onChange={(e) => setBulkData({ ...bulkData, excludeHolidays: e.target.checked })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Exclude hari libur</span>
                  </label>
                </div>

                {/* Preview */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Preview Slot Waktu:</h3>
                  <div className="text-sm text-gray-600 space-y-1 max-h-32 overflow-y-auto">
                    {generateTimeSlots().map((slot, index) => (
                      <div key={index}>{slot}</div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowBulkModal(false)}
                    disabled={bulkCreating}
                    className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Batal
                  </button>
                  <button
                    onClick={createBulkSchedule}
                    disabled={bulkCreating || !bulkData.doctorId || !bulkData.therapistId}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {bulkCreating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Membuat...
                      </>
                    ) : (
                      'Buat Jadwal'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Holiday Modal */}
      {showHolidayModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Tambah Hari Libur</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={holidayData.date}
                    onChange={(e) => setHolidayData({ ...holidayData, date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Hari Libur
                  </label>
                  <input
                    type="text"
                    value={holidayData.name}
                    onChange={(e) => setHolidayData({ ...holidayData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    placeholder="Contoh: Libur Nasional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deskripsi (opsional)
                  </label>
                  <textarea
                    value={holidayData.description}
                    onChange={(e) => setHolidayData({ ...holidayData, description: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    placeholder="Deskripsi hari libur..."
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={holidayData.is_recurring}
                      onChange={(e) => setHolidayData({ ...holidayData, is_recurring: e.target.checked })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Libur berulang setiap tahun</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowHolidayModal(false)}
                    disabled={holidayCreating}
                    className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Batal
                  </button>
                  <button
                    onClick={createHoliday}
                    disabled={holidayCreating}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {holidayCreating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Menyimpan...
                      </>
                    ) : (
                      'Simpan'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Slot Confirmation Modal */}
    <ConfirmationModal
    isOpen={showDeleteSlotModal}
    onClose={() => {
        setShowDeleteSlotModal(false);
        setSelectedSlotId(null);
    }}
    onConfirm={deleteSlot}
    title="Hapus Slot Booking"
    message="Apakah Anda yakin ingin menghapus slot booking ini? Tindakan ini tidak dapat dibatalkan."
    confirmText="Ya, Hapus"
    cancelText="Batal"
    variant="danger"
    isLoading={actionLoading === selectedSlotId}
    />

    {/* Delete Holiday Confirmation Modal */}
    <ConfirmationModal
    isOpen={showDeleteHolidayModal}
    onClose={() => {
        setShowDeleteHolidayModal(false);
        setSelectedHolidayId(null);
    }}
    onConfirm={deleteHoliday}
    title="Hapus Hari Libur"
    message="Apakah Anda yakin ingin menghapus hari libur ini? Tindakan ini tidak dapat dibatalkan."
    confirmText="Ya, Hapus"
    cancelText="Batal"
    variant="danger"
    isLoading={actionLoading === selectedHolidayId}
    />

      {/* Snackbar Component */}
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