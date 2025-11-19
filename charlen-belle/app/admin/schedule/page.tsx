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

// ==== ICONS (solid, senada tema cream–gold) ====
const IconCalendar = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect
      x="3"
      y="4"
      width="18"
      height="17"
      rx="2"
      stroke="currentColor"
      strokeWidth={1.6}
    />
    <path
      d="M8 3v3M16 3v3"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
    />
    <path
      d="M3 9h18"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
    />
  </svg>
);

const IconPlus = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M12 5v14M5 12h14"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
    />
  </svg>
);

const IconChevronLeft = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M15 6l-6 6 6 6"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconChevronRight = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M9 6l6 6-6 6"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconLoader = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <circle
      cx="12"
      cy="12"
      r="8"
      stroke="currentColor"
      strokeWidth={1.6}
      opacity={0.25}
    />
    <path
      d="M20 12a8 8 0 0 0-8-8"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
    />
  </svg>
);

export default function AdminSchedulePage() {
  const { data: session } = useSession();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
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
    type: 'info',
  });
  const [showDeleteSlotModal, setShowDeleteSlotModal] = useState(false);
  const [showDeleteHolidayModal, setShowDeleteHolidayModal] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [selectedHolidayId, setSelectedHolidayId] = useState<string | null>(null);
  const [editingSlot, setEditingSlot] = useState<BookingSlot | null>(null);
  const [staffLoading, setStaffLoading] = useState(true);

  const [bulkData, setBulkData] = useState<BulkScheduleData>({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    daysOfWeek: [1, 2, 3, 4, 5, 6],
    startTime: '10:00',
    endTime: '18:00',
    timeInterval: 60,
    excludeHolidays: true,
    doctorId: '',
    therapistId: '',
  });

  const [holidayData, setHolidayData] = useState({
    date: new Date().toISOString().split('T')[0],
    name: '',
    description: '',
    is_recurring: false,
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
        setDoctors(data.doctors || []);
        setTherapists(data.therapists || []);

        if (data.doctors?.length > 0 && !bulkData.doctorId) {
          setBulkData((prev) => ({ ...prev, doctorId: data.doctors[0]._id }));
        }
        if (data.therapists?.length > 0 && !bulkData.therapistId) {
          setBulkData((prev) => ({ ...prev, therapistId: data.therapists[0]._id }));
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
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
      type,
    });
  };

  const hideSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, isVisible: false }));
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
      const response = await fetch(
        `/api/admin/schedule/calendar?year=${year}&month=${month}`
      );
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
        body: JSON.stringify({ is_available: !currentStatus }),
      });

      const data = await response.json();

      if (data.success) {
        showSnackbar('Status slot berhasil diupdate', 'success');
        fetchSchedule();
        fetchCalendarData();
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
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        showSnackbar('Slot berhasil dihapus', 'success');
        fetchSchedule();
        fetchCalendarData();
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
        body: JSON.stringify(bulkData),
      });

      const data = await response.json();

      if (data.success) {
        showSnackbar(`Berhasil membuat ${data.createdSlots} slot`, 'success');
        setShowBulkModal(false);
        fetchSchedule();
        fetchCalendarData();
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
        body: JSON.stringify(holidayData),
      });

      const data = await response.json();

      if (data.success) {
        showSnackbar('Hari libur berhasil ditambahkan', 'success');
        setShowHolidayModal(false);
        setHolidayData({
          date: new Date().toISOString().split('T')[0],
          name: '',
          description: '',
          is_recurring: false,
        });
        fetchHolidays();
        fetchCalendarData();
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
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        showSnackbar('Hari libur berhasil dihapus', 'success');
        fetchHolidays();
        fetchCalendarData();
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

  const updateSlotStaff = async (
    slotId: string,
    doctorId: string,
    therapistId: string
  ) => {
    setActionLoading(slotId);
    try {
      const response = await fetch(`/api/admin/schedule/${slotId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: doctorId,
          therapist_id: therapistId,
        }),
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
      therapist_id: slot.therapist_id || { _id: '', name: '' },
    });
  };

  const handleCancelEdit = () => {
    setEditingSlot(null);
  };

  const handleSaveEdit = (slotId: string) => {
    if (!editingSlot) return;

    if (!editingSlot.doctor_id?._id || !editingSlot.therapist_id?._id) {
      showSnackbar('Harap pilih dokter dan terapis', 'error');
      return;
    }

    updateSlotStaff(slotId, editingSlot.doctor_id._id, editingSlot.therapist_id._id);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const generateCalendarGrid = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDay = firstDay.getDay(); // 0 = Sunday
    const totalDays = lastDay.getDate();

    const days = [];

    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
        day
      ).padStart(2, '0')}`;
      const calendarDay = calendarDays.find((d) => d.date === dateStr);

      days.push(
        calendarDay || {
          date: dateStr,
          day,
          hasSlots: false,
          slotCount: 0,
          availableSlots: 0,
          bookedSlots: 0,
          isToday: dateStr === new Date().toISOString().split('T')[0],
          isSelected: selectedDate === dateStr,
          isPast:
            new Date(dateStr) < new Date(new Date().setHours(0, 0, 0, 0)),
        }
      );
    }

    return days;
  };

  const calendarGrid = generateCalendarGrid();
  const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  return (
    <div className="p-6 bg-[#F8F4E8] min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold text-[#3A3530]">
          Jadwal Booking
        </h1>
        <p className="text-sm text-[#8B7B63] mt-1">
          Kelola slot jadwal dan hari libur klinik.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendar View */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-[#E5D7BE] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-[#F5E4C6] flex items-center justify-center text-[#8F6E45]">
                  <IconCalendar className="w-5 h-5" />
                </div>
                <h2 className="text-lg md:text-xl font-semibold text-[#3A3530]">
                  Kalender Jadwal
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowBulkModal(true)}
                  disabled={bulkCreating}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs md:text-sm font-semibold bg-[#B48A5A] text-white hover:bg-[#8F6E45] disabled:bg-[#D6C7AF] disabled:text-[#F7F0E4] disabled:cursor-not-allowed transition-colors"
                >
                  {bulkCreating ? (
                    <>
                      <IconLoader className="w-4 h-4 animate-spin" />
                      <span>Membuat...</span>
                    </>
                  ) : (
                    <>
                      <IconPlus className="w-4 h-4" />
                      <span>Bulk Jadwal</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowHolidayModal(true)}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs md:text-sm font-semibold border border-[#D2C3A7] bg-white text-[#7A5D3A] hover:bg-[#F7EEDB] transition-colors"
                >
                  <IconPlus className="w-4 h-4" />
                  <span>Tambah Libur</span>
                </button>
              </div>
            </div>

            {/* Calendar Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigateMonth('prev')}
                disabled={calendarLoading}
                className="p-2 rounded-full border border-[#E5D7BE] text-[#7A5D3A] hover:bg-[#F7EEDB] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IconChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="text-base md:text-lg font-semibold text-[#3A3530]">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                {calendarLoading && (
                  <span className="text-xs text-[#A08C6A] ml-2">(memuat...)</span>
                )}
              </h3>
              <button
                onClick={() => navigateMonth('next')}
                disabled={calendarLoading}
                className="p-2 rounded-full border border-[#E5D7BE] text-[#7A5D3A] hover:bg-[#F7EEDB] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IconChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-semibold text-[#8B7B63] py-1.5"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarGrid.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="h-20" />;
                }

                const isHoliday = holidays.some(
                  (h) => h.date.split('T')[0] === day.date
                );

                const baseClasses =
                  'h-20 rounded-xl text-xs md:text-sm font-medium transition-all border flex flex-col items-center justify-center px-1 py-1.5';
                let stateClasses = '';
                if (day.isSelected) {
                  stateClasses =
                    'border-[#B48A5A] bg-[#F5E4C6] text-[#3A3530] shadow-md';
                } else if (day.isToday) {
                  stateClasses =
                    'border-[#D2C3A7] bg-[#FFFBF3] text-[#3A3530] font-semibold';
                } else if (day.hasSlots) {
                  if (day.availableSlots > 0) {
                    stateClasses =
                      'border-[#D1E9D2] bg-[#F3FBF4] text-[#2F7C38] hover:bg-[#E4F4E5]';
                  } else {
                    stateClasses =
                      'border-[#F3C9C5] bg-[#FFF5F4] text-[#B42318] hover:bg-[#FDE3E1]';
                  }
                } else {
                  stateClasses =
                    'border-[#E5D7BE] bg-white text-[#B3A495] hover:bg-[#F7F0E4]';
                }

                const disabledClasses = day.isPast
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer';

                return (
                  <button
                    key={day.date}
                    onClick={() => !day.isPast && setSelectedDate(day.date)}
                    disabled={day.isPast}
                    className={`${baseClasses} ${stateClasses} ${disabledClasses}`}
                    title={
                      day.hasSlots
                        ? `${day.availableSlots} tersedia, ${day.bookedSlots} dibooking`
                        : 'Tidak ada slot'
                    }
                  >
                    <span className="text-base font-semibold">{day.day}</span>
                    {day.hasSlots && (
                      <div className="flex flex-col items-center mt-1 gap-0.5">
                        <div className="flex gap-1 items-center">
                          <span className="w-2 h-2 rounded-full bg-[#74A27F]" />
                          <span className="text-[10px] text-[#2F7C38]">
                            {day.availableSlots}
                          </span>
                        </div>
                        <div className="flex gap-1 items-center">
                          <span className="w-2 h-2 rounded-full bg-[#F3A7A3]" />
                          <span className="text-[10px] text-[#B42318]">
                            {day.bookedSlots}
                          </span>
                        </div>
                      </div>
                    )}
                    {isHoliday && (
                      <div className="w-2 h-2 bg-[#C53030] rounded-full mt-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Calendar Legend */}
            <div className="flex flex-wrap gap-4 mt-4 text-[11px] text-[#8B7B63]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#F3FBF4] border border-[#D1E9D2] rounded" />
                <span>Slot tersedia</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#FFF5F4] border border-[#F3C9C5] rounded" />
                <span>Semua terbooking</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#F5E4C6] border border-[#B48A5A] rounded" />
                <span>Tanggal terpilih</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#C53030] rounded-full" />
                <span>Hari libur</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Selected Date Schedule */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#E5D7BE]">
            <div className="px-6 py-5 border-b border-[#E5D7BE]">
              <h2 className="text-lg md:text-xl font-semibold text-[#3A3530]">
                Jadwal {formatDate(selectedDate)}
              </h2>
              <p className="text-xs text-[#8B7B63] mt-1">
                {slots.length} total slot
              </p>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-sm text-[#8B7B63]">
                <IconLoader className="w-7 h-7 animate-spin text-[#B48A5A]" />
                <span>Memuat jadwal...</span>
              </div>
            ) : slots.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-sm text-[#8B7B63]">
                <div className="w-12 h-12 rounded-full bg-[#F5E4C6] flex items-center justify-center text-[#8F6E45]">
                  <IconCalendar className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-[#3A3530]">
                  Tidak ada jadwal
                </h3>
                <p className="text-xs">
                  Belum ada slot booking pada tanggal ini.
                </p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto divide-y divide-[#F1E3CB]">
                {slots.map((slot) => (
                  <div
                    key={slot._id}
                    className="px-5 py-4 hover:bg-[#FFFAF1] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-[#3A3530]">
                            {slot.start_time} - {slot.end_time}
                          </span>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                              slot.is_available
                                ? 'bg-[#F3FBF4] text-[#2F7C38] border border-[#D1E9D2]'
                                : 'bg-[#FFF5F4] text-[#B42318] border border-[#F3C9C5]'
                            }`}
                          >
                            {slot.is_available ? 'Tersedia' : 'Dibooking'}
                          </span>
                        </div>

                        {/* Staff Info */}
                        {editingSlot && editingSlot._id === slot._id ? (
                          <div className="space-y-2 mb-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-[#6E5A40] mb-1">
                                Dokter
                              </label>
                              <select
                                value={editingSlot.doctor_id?._id || ''}
                                onChange={(e) =>
                                  setEditingSlot({
                                    ...editingSlot,
                                    doctor_id: {
                                      _id: e.target.value,
                                      name:
                                        doctors.find(
                                          (d) => d._id === e.target.value
                                        )?.name || '',
                                    },
                                  })
                                }
                                className="w-full border border-[#D7C3A3] rounded-lg px-2.5 py-1.5 text-xs text-[#3A3530] bg-[#FFFBF3] focus:outline-none focus:ring-2 focus:ring-[#E2CBA4] focus:border-[#B48A5A]"
                              >
                                <option value="">Pilih Dokter</option>
                                {doctors.map((doctor) => (
                                  <option key={doctor._id} value={doctor._id}>
                                    {doctor.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-[#6E5A40] mb-1">
                                Terapis
                              </label>
                              <select
                                value={editingSlot.therapist_id?._id || ''}
                                onChange={(e) =>
                                  setEditingSlot({
                                    ...editingSlot,
                                    therapist_id: {
                                      _id: e.target.value,
                                      name:
                                        therapists.find(
                                          (t) => t._id === e.target.value
                                        )?.name || '',
                                    },
                                  })
                                }
                                className="w-full border border-[#D7C3A3] rounded-lg px-2.5 py-1.5 text-xs text-[#3A3530] bg-[#FFFBF3] focus:outline-none focus:ring-2 focus:ring-[#E2CBA4] focus:border-[#B48A5A]"
                              >
                                <option value="">Pilih Terapis</option>
                                {therapists.map((therapist) => (
                                  <option
                                    key={therapist._id}
                                    value={therapist._id}
                                  >
                                    {therapist.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-[#8B7B63] space-y-1 mb-3">
                            <div className="flex flex-wrap gap-4">
                              <div>
                                <span className="font-semibold text-[#6E5A40]">
                                  Dokter:
                                </span>{' '}
                                {slot.doctor_id?.name || 'Belum ditentukan'}
                              </div>
                              <div>
                                <span className="font-semibold text-[#6E5A40]">
                                  Terapis:
                                </span>{' '}
                                {slot.therapist_id?.name || 'Belum ditentukan'}
                              </div>
                            </div>
                          </div>
                        )}

                        {slot.booking_id && (
                          <div className="text-xs text-[#8B7B63] space-y-1">
                            <p className="font-semibold text-[#3A3530]">
                              {slot.booking_id.user_id.name}
                            </p>
                            <p>{slot.booking_id.user_id.email}</p>
                            <div className="flex gap-2">
                              <span className="capitalize">
                                {slot.booking_id.type}
                              </span>
                              <span>•</span>
                              <span className="capitalize">
                                {slot.booking_id.status}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        {editingSlot && editingSlot._id === slot._id ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(slot._id)}
                              disabled={actionLoading === slot._id}
                              className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-[#B48A5A] text-white hover:bg-[#8F6E45] disabled:bg-[#D6C7AF] disabled:text-[#F7F0E4] disabled:cursor-not-allowed transition-colors"
                            >
                              {actionLoading === slot._id ? (
                                <IconLoader className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                'Simpan'
                              )}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              disabled={actionLoading === slot._id}
                              className="px-3 py-1.5 rounded-full text-[11px] font-semibold border border-[#D2C3A7] bg-white text-[#7A5D3A] hover:bg-[#F7EEDB] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                            >
                              Batal
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditSlotClick(slot)}
                              disabled={actionLoading === slot._id}
                              className="px-3 py-1.5 rounded-full text-[11px] font-semibold border border-[#D2C3A7] bg-white text-[#7A5D3A] hover:bg-[#F7EEDB] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                            >
                              Edit Staff
                            </button>
                            <button
                              onClick={() =>
                                toggleSlotAvailability(slot._id, slot.is_available)
                              }
                              disabled={actionLoading === slot._id}
                              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 ${
                                slot.is_available
                                  ? 'bg-[#F2C166] text-[#5E4308] hover:bg-[#E3B252]'
                                  : 'bg-[#6BAF7A] text-white hover:bg-[#4F9160]'
                              } disabled:opacity-60 disabled:cursor-not-allowed`}
                            >
                              {actionLoading === slot._id ? (
                                <IconLoader className="w-3.5 h-3.5 animate-spin" />
                              ) : slot.is_available ? (
                                'Tutup'
                              ) : (
                                'Buka'
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteSlotClick(slot._id)}
                              disabled={actionLoading === slot._id}
                              className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-[#FFF5F4] text-[#B42318] border border-[#F3C9C5] hover:bg-[#FDE3E1] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                            >
                              {actionLoading === slot._id ? (
                                <IconLoader className="w-3.5 h-3.5 animate-spin" />
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
          <div className="bg-white rounded-2xl shadow-sm border border-[#E5D7BE]">
            <div className="px-6 py-5 border-b border-[#E5D7BE]">
              <h2 className="text-lg md:text-xl font-semibold text-[#3A3530]">
                Hari Libur
              </h2>
              <p className="text-xs text-[#8B7B63] mt-1">
                {holidays.length} hari libur terdaftar
              </p>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {holidays.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-xs text-[#8B7B63]">
                  Belum ada hari libur terdaftar.
                </div>
              ) : (
                <div className="divide-y divide-[#F1E3CB]">
                  {holidays.map((holiday) => (
                    <div
                      key={holiday._id}
                      className="px-5 py-4 hover:bg-[#FFFAF1] transition-colors"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-[#3A3530]">
                            {holiday.name}
                          </h3>
                          <p className="text-xs text-[#8B7B63]">
                            {formatDate(holiday.date)}
                          </p>
                          {holiday.description && (
                            <p className="text-xs text-[#A08C6A] mt-1">
                              {holiday.description}
                            </p>
                          )}
                          {holiday.is_recurring && (
                            <span className="inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#E6F3E7] text-[#2F7C38]">
                              Berulang tiap tahun
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteHolidayClick(holiday._id)}
                          disabled={actionLoading === holiday._id}
                          className="text-[11px] font-semibold rounded-full px-3 py-1.5 bg-[#FFF5F4] text-[#B42318] border border-[#F3C9C5] hover:bg-[#FDE3E1] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                        >
                          {actionLoading === holiday._id ? (
                            <IconLoader className="w-3.5 h-3.5 animate-spin" />
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 md:p-7">
              <h2 className="text-lg md:text-xl font-semibold text-[#3A3530] mb-4">
                Buat Jadwal Massal
              </h2>

              <div className="space-y-4">
                {/* Staff Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#6E5A40] mb-1.5">
                      Dokter
                    </label>
                    <select
                      value={bulkData.doctorId}
                      onChange={(e) =>
                        setBulkData({ ...bulkData, doctorId: e.target.value })
                      }
                      className="w-full border border-[#D7C3A3] rounded-lg px-3 py-2 text-sm text-[#3A3530] bg-[#FFFBF3] focus:outline-none focus:ring-2 focus:ring-[#E2CBA4] focus:border-[#B48A5A]"
                      disabled={doctors.length === 0}
                    >
                      <option value="">
                        {doctors.length === 0
                          ? 'Tidak ada dokter'
                          : 'Pilih Dokter'}
                      </option>
                      {doctors.map((doctor) => (
                        <option key={doctor._id} value={doctor._id}>
                          {doctor.name}
                        </option>
                      ))}
                    </select>
                    {doctors.length === 0 && (
                      <p className="text-[11px] text-[#B42318] mt-1">
                        Belum ada data dokter
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#6E5A40] mb-1.5">
                      Terapis
                    </label>
                    <select
                      value={bulkData.therapistId}
                      onChange={(e) =>
                        setBulkData({ ...bulkData, therapistId: e.target.value })
                      }
                      className="w-full border border-[#D7C3A3] rounded-lg px-3 py-2 text-sm text-[#3A3530] bg-[#FFFBF3] focus:outline-none focus:ring-2 focus:ring-[#E2CBA4] focus:border-[#B48A5A]"
                      disabled={therapists.length === 0}
                    >
                      <option value="">
                        {therapists.length === 0
                          ? 'Tidak ada terapis'
                          : 'Pilih Terapis'}
                      </option>
                      {therapists.map((therapist) => (
                        <option key={therapist._id} value={therapist._id}>
                          {therapist.name}
                        </option>
                      ))}
                    </select>
                    {therapists.length === 0 && (
                      <p className="text-[11px] text-[#B42318] mt-1">
                        Belum ada data terapis
                      </p>
                    )}
                  </div>
                </div>

                {/* Date range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#6E5A40] mb-1.5">
                      Tanggal Mulai
                    </label>
                    <input
                      type="date"
                      value={bulkData.startDate}
                      onChange={(e) =>
                        setBulkData({ ...bulkData, startDate: e.target.value })
                      }
                      className="w-full border border-[#D7C3A3] rounded-lg px-3 py-2 text-sm bg-[#FFFBF3] text-[#3A3530] focus:outline-none focus:ring-2 focus:ring-[#E2CBA4] focus:border-[#B48A5A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#6E5A40] mb-1.5">
                      Tanggal Selesai
                    </label>
                    <input
                      type="date"
                      value={bulkData.endDate}
                      onChange={(e) =>
                        setBulkData({ ...bulkData, endDate: e.target.value })
                      }
                      className="w-full border border-[#D7C3A3] rounded-lg px-3 py-2 text-sm bg-[#FFFBF3] text-[#3A3530] focus:outline-none focus:ring-2 focus:ring-[#E2CBA4] focus:border-[#B48A5A]"
                    />
                  </div>
                </div>

                {/* Days of week */}
                <div>
                  <label className="block text-xs font-semibold text-[#6E5A40] mb-2">
                    Hari Operasional
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { value: 0, label: 'Minggu' },
                      { value: 1, label: 'Senin' },
                      { value: 2, label: 'Selasa' },
                      { value: 3, label: 'Rabu' },
                      { value: 4, label: 'Kamis' },
                      { value: 5, label: 'Jumat' },
                      { value: 6, label: 'Sabtu' },
                    ].map((day) => (
                      <label
                        key={day.value}
                        className="flex items-center gap-2 text-xs text-[#3A3530]"
                      >
                        <input
                          type="checkbox"
                          checked={bulkData.daysOfWeek.includes(day.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBulkData({
                                ...bulkData,
                                daysOfWeek: [...bulkData.daysOfWeek, day.value],
                              });
                            } else {
                              setBulkData({
                                ...bulkData,
                                daysOfWeek: bulkData.daysOfWeek.filter(
                                  (d) => d !== day.value
                                ),
                              });
                            }
                          }}
                          className="rounded border-[#C9AE84] text-[#B48A5A] focus:ring-[#D7BF96]"
                        />
                        <span>{day.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Time & interval */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#6E5A40] mb-1.5">
                      Jam Mulai
                    </label>
                    <input
                      type="time"
                      value={bulkData.startTime}
                      onChange={(e) =>
                        setBulkData({ ...bulkData, startTime: e.target.value })
                      }
                      className="w-full border border-[#D7C3A3] rounded-lg px-3 py-2 text-sm bg-[#FFFBF3] text-[#3A3530] focus:outline-none focus:ring-2 focus:ring-[#E2CBA4] focus:border-[#B48A5A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#6E5A40] mb-1.5">
                      Jam Selesai
                    </label>
                    <input
                      type="time"
                      value={bulkData.endTime}
                      onChange={(e) =>
                        setBulkData({ ...bulkData, endTime: e.target.value })
                      }
                      className="w-full border border-[#D7C3A3] rounded-lg px-3 py-2 text-sm bg-[#FFFBF3] text-[#3A3530] focus:outline-none focus:ring-2 focus:ring-[#E2CBA4] focus:border-[#B48A5A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#6E5A40] mb-1.5">
                      Interval (menit)
                    </label>
                    <select
                      value={bulkData.timeInterval}
                      onChange={(e) =>
                        setBulkData({
                          ...bulkData,
                          timeInterval: parseInt(e.target.value),
                        })
                      }
                      className="w-full border border-[#D7C3A3] rounded-lg px-3 py-2 text-sm bg-[#FFFBF3] text-[#3A3530] focus:outline-none focus:ring-2 focus:ring-[#E2CBA4] focus:border-[#B48A5A]"
                    >
                      <option value={30}>30 menit</option>
                      <option value={60}>60 menit</option>
                      <option value={90}>90 menit</option>
                      <option value={120}>120 menit</option>
                    </select>
                  </div>
                </div>

                {/* Exclude holidays */}
                <div>
                  <label className="inline-flex items-center gap-2 text-xs text-[#3A3530]">
                    <input
                      type="checkbox"
                      checked={bulkData.excludeHolidays}
                      onChange={(e) =>
                        setBulkData({
                          ...bulkData,
                          excludeHolidays: e.target.checked,
                        })
                      }
                      className="rounded border-[#C9AE84] text-[#B48A5A] focus:ring-[#D7BF96]"
                    />
                    <span>Kecualikan hari libur</span>
                  </label>
                </div>

                {/* Preview */}
                <div className="bg-[#FFFBF3] border border-[#E5D7BE] rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-[#6E5A40] mb-2">
                    Preview Slot Waktu
                  </h3>
                  <div className="text-xs text-[#8B7B63] space-y-1 max-h-32 overflow-y-auto">
                    {generateTimeSlots().map((slot, index) => (
                      <div key={index}>{slot}</div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-3 pt-2">
                  <button
                    onClick={() => setShowBulkModal(false)}
                    disabled={bulkCreating}
                    className="flex-1 rounded-full px-4 py-2.5 text-sm font-semibold border border-[#D2C3A7] bg-white text-[#7A5D3A] hover:bg-[#F7EEDB] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={createBulkSchedule}
                    disabled={
                      bulkCreating || !bulkData.doctorId || !bulkData.therapistId
                    }
                    className="flex-1 rounded-full px-4 py-2.5 text-sm font-semibold bg-[#B48A5A] text-white hover:bg-[#8F6E45] disabled:bg-[#D6C7AF] disabled:text-[#F7F0E4] disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                  >
                    {bulkCreating ? (
                      <>
                        <IconLoader className="w-4 h-4 animate-spin" />
                        <span>Membuat...</span>
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6 md:p-7">
              <h2 className="text-lg md:text-xl font-semibold text-[#3A3530] mb-4">
                Tambah Hari Libur
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#6E5A40] mb-1.5">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={holidayData.date}
                    onChange={(e) =>
                      setHolidayData({ ...holidayData, date: e.target.value })
                    }
                    className="w-full border border-[#D7C3A3] rounded-lg px-3 py-2 text-sm bg-[#FFFBF3] text-[#3A3530] focus:outline-none focus:ring-2 focus:ring-[#E2CBA4] focus:border-[#B48A5A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6E5A40] mb-1.5">
                    Nama Hari Libur
                  </label>
                  <input
                    type="text"
                    value={holidayData.name}
                    onChange={(e) =>
                      setHolidayData({ ...holidayData, name: e.target.value })
                    }
                    className="w-full border border-[#D7C3A3] rounded-lg px-3 py-2 text-sm bg-[#FFFBF3] text-[#3A3530] focus:outline-none focus:ring-2 focus:ring-[#E2CBA4] focus:border-[#B48A5A]"
                    placeholder="Contoh: Libur Nasional"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6E5A40] mb-1.5">
                    Deskripsi (opsional)
                  </label>
                  <textarea
                    value={holidayData.description}
                    onChange={(e) =>
                      setHolidayData({
                        ...holidayData,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full border border-[#D7C3A3] rounded-lg px-3 py-2 text-sm bg-[#FFFBF3] text-[#3A3530] focus:outline-none focus:ring-2 focus:ring-[#E2CBA4] focus:border-[#B48A5A]"
                    placeholder="Deskripsi hari libur..."
                  />
                </div>

                <div>
                  <label className="inline-flex items-center gap-2 text-xs text-[#3A3530]">
                    <input
                      type="checkbox"
                      checked={holidayData.is_recurring}
                      onChange={(e) =>
                        setHolidayData({
                          ...holidayData,
                          is_recurring: e.target.checked,
                        })
                      }
                      className="rounded border-[#C9AE84] text-[#B48A5A] focus:ring-[#D7BF96]"
                    />
                    <span>Libur berulang setiap tahun</span>
                  </label>
                </div>

                <div className="flex flex-col md:flex-row gap-3 pt-2">
                  <button
                    onClick={() => setShowHolidayModal(false)}
                    disabled={holidayCreating}
                    className="flex-1 rounded-full px-4 py-2.5 text-sm font-semibold border border-[#D2C3A7] bg-white text-[#7A5D3A] hover:bg-[#F7EEDB] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={createHoliday}
                    disabled={holidayCreating}
                    className="flex-1 rounded-full px-4 py-2.5 text-sm font-semibold bg-[#B48A5A] text-white hover:bg-[#8F6E45] disabled:bg-[#D6C7AF] disabled:text-[#F7F0E4] disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                  >
                    {holidayCreating ? (
                      <>
                        <IconLoader className="w-4 h-4 animate-spin" />
                        <span>Menyimpan...</span>
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
