// app/user/booking/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '../../lib/utils';

type Slot = { _id: string; start_time: string; end_time: string; date: string };
type AvailableDate = { date: string; hasSlots: boolean; slotCount: number };

export default function BookingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [selectedTreatments, setSelectedTreatments] = useState<
    { id: string; name?: string; quantity: number }[]
  >([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isLoadingDates, setIsLoadingDates] = useState(false);

  useEffect(() => {
    // Load selection from localStorage
    const raw = localStorage.getItem('selectedTreatments');
    if (raw) setSelectedTreatments(JSON.parse(raw));
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/user/login?redirect=/user/booking');
    }
  }, [status, router]);

  useEffect(() => {
    if (selectedDate) {
      fetchSlots(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchAvailableDates();
  }, [currentMonth]);

  // Cek customer profile sebelum booking
  useEffect(() => {
    const checkCustomerProfile = async () => {
      try {
        const response = await fetch('/api/user/customer-profile');
        const data = await response.json();

        if (data.success && !data.customer_profile?.completed_at) {
          router.push('/user/customer-profile?redirect=/user/booking');
        }
      } catch (error) {
        console.error('Error checking customer profile:', error);
      }
    };

    if (session) {
      checkCustomerProfile();
    }
  }, [session, router]);

  async function fetchAvailableDates() {
    setIsLoadingDates(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      console.log('Fetching available dates for:', year, month);

      const res = await fetch(
        `/api/slots/available-dates?year=${year}&month=${month}`
      );
      const data = await res.json();

      console.log('Available dates API response:', data);
      console.log('Calendar days:', calendarDays);
      console.log('Available dates:', availableDates);

      if (data.success) {
        console.log('Available dates data:', data.dates);
        setAvailableDates(data.dates || []);
      } else {
        toast.error('Gagal memuat tanggal tersedia');
      }
    } catch (e) {
      console.error('Error fetching available dates:', e);
      toast.error('Gagal memuat tanggal tersedia');
    } finally {
      setIsLoadingDates(false);
    }
  }

  async function fetchSlots(date: string) {
    try {
      console.log('Fetching slots for date:', date);
      const res = await fetch(`/api/slots?date=${date}`);
      const data = await res.json();
      console.log('Slots API response:', data);
      setAvailableSlots(data.slots || []);
    } catch (e) {
      console.error('Error fetching slots:', e);
      toast.error('Gagal memuat slot');
    }
  }

  function removeTreatment(id: string) {
    const next = selectedTreatments.filter((t) => t.id !== id);
    setSelectedTreatments(next);
    localStorage.setItem('selectedTreatments', JSON.stringify(next));
  }

  function changeQty(id: string, qty: number) {
    const next = selectedTreatments.map((t) =>
      t.id === id ? { ...t, quantity: qty } : t
    );
    setSelectedTreatments(next);
    localStorage.setItem('selectedTreatments', JSON.stringify(next));
  }

  async function handleSubmitBooking() {
    if (!selectedSlot) {
      toast.error('Pilih slot');
      return;
    }
    if (selectedTreatments.length === 0) {
      toast.error('Pilih minimal 1 treatment');
      return;
    }
    setIsLoading(true);
    try {
      // Check if this is a consultation booking
      const isConsultation = selectedTreatments.some(
        (t) => t.id === 'consultation'
      );

      const body = {
        slot_id: selectedSlot,
        type: isConsultation ? 'consultation' : 'treatment',
        notes,
        treatments: isConsultation
          ? []
          : selectedTreatments.map((t) => ({
              treatment_id: t.id,
              quantity: t.quantity
            }))
      };

      console.log('Booking request body:', body); // Debug log

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal buat booking');

      toast.success('Booking berhasil dibuat!');
      localStorage.removeItem('selectedTreatments');
      router.push(`/user/dashboard/bookings/${data.booking._id}`);
    } catch (e: any) {
      console.error('Booking error:', e);
      toast.error(e.message || 'Error membuat booking');
    } finally {
      setIsLoading(false);
    }
  }

  // Calendar navigation
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

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDay = firstDay.getDay(); // 0 = Sunday
    const totalDays = lastDay.getDate();

    const days: any[] = [];

    // empty cells
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    // month days
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
        day
      ).padStart(2, '0')}`;

      const availableDate = availableDates.find((d) => {
        const availableDateStr = new Date(d.date)
          .toISOString()
          .split('T')[0];
        return availableDateStr === dateStr;
      });

      days.push({
        date: dateStr,
        day,
        hasSlots: availableDate ? availableDate.hasSlots : false,
        slotCount: availableDate ? availableDate.slotCount : 0
      });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
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
    'Desember'
  ];
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  return (
    <div className="min-h-screen bg-[#F6F0E3] py-8 sm:py-10">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-[#FFFDF9] border border-[#E1D4C0] rounded-2xl p-6 sm:p-8 shadow-sm">
          {/* Header */}
          <div className="mb-6">
            <p className="text-xs text-[#A18F76] mb-1">Booking</p>
            <h1 className="text-xl sm:text-2xl font-semibold text-[#3B2A1E]">
              Buat Booking Baru
            </h1>
            <p className="text-sm text-[#A18F76] mt-1">
              Pilih treatment, tanggal, dan waktu yang sesuai untuk kunjungan Anda.
            </p>
          </div>

          {/* Treatment selected */}
          <div className="mb-7">
            <h3 className="text-sm font-semibold text-[#3B2A1E] mb-3">
              Treatment Terpilih
            </h3>
            {selectedTreatments.length === 0 ? (
              <div className="text-sm text-[#A18F76] p-4 border border-dashed border-[#E1D4C0] rounded-xl bg-[#FBF6EA] text-center">
                Belum ada treatment. Pilih dari halaman layanan terlebih dahulu.
              </div>
            ) : (
              <div className="space-y-3">
                {selectedTreatments.map((t) => (
                  <div
                    key={t.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-[#E1D4C0] bg-[#FBF6EA]"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-[#3B2A1E]">
                        {t.name || t.id}
                      </div>
                      <div className="text-xs text-[#A18F76] mt-2 flex flex-wrap items-center gap-2">
                        <span>Qty:</span>
                        <button
                          onClick={() =>
                            changeQty(t.id, Math.max(1, t.quantity - 1))
                          }
                          className="px-2 py-1 rounded-lg border border-[#E1D4C0] bg-[#FFFDF9] text-xs hover:bg-[#F1E5D1] transition-colors"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 rounded-lg bg-[#FFFDF9] border border-[#E1D4C0] min-w-[40px] text-center">
                          {t.quantity}
                        </span>
                        <button
                          onClick={() => changeQty(t.id, t.quantity + 1)}
                          className="px-2 py-1 rounded-lg border border-[#E1D4C0] bg-[#FFFDF9] text-xs hover:bg-[#F1E5D1] transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button
                      className="text-xs font-medium text-red-700 px-3 py-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition-colors self-start sm:self-auto"
                      onClick={() => removeTreatment(t.id)}
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Calendar Section */}
          <div className="mb-7">
            <label className="block text-sm font-semibold text-[#3B2A1E] mb-3">
              Pilih Tanggal
            </label>
            <div className="border border-[#E1D4C0] rounded-2xl p-4 bg-[#FFFDF9]">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 rounded-xl hover:bg-[#FBF6EA] text-[#7E6A52] disabled:opacity-50"
                  disabled={isLoadingDates}
                >
                  ←
                </button>
                <h3 className="text-sm font-semibold text-[#3B2A1E]">
                  {monthNames[currentMonth.getMonth()]}{' '}
                  {currentMonth.getFullYear()}
                  {isLoadingDates && (
                    <span className="text-xs text-[#A18F76] ml-2">
                      (memuat…)
                    </span>
                  )}
                </h3>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 rounded-xl hover:bg-[#FBF6EA] text-[#7E6A52] disabled:opacity-50"
                  disabled={isLoadingDates}
                >
                  →
                </button>
              </div>

              {isLoadingDates ? (
                <div className="flex justify-center items-center h-40">
                  <span className="text-sm text-[#A18F76]">
                    Memuat kalender...
                  </span>
                </div>
              ) : (
                <>
                  {/* Day Names */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {dayNames.map((day) => (
                      <div
                        key={day}
                        className="text-center text-[11px] font-medium text-[#A18F76] py-2"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, index) => {
                      if (day === null) {
                        return <div key={`empty-${index}`} className="h-10" />;
                      }

                      const isSelected = selectedDate === day.date;
                      const todayStr = new Date().toISOString().split('T')[0];
                      const isToday = day.date === todayStr;
                      const isPast =
                        new Date(day.date) <
                        new Date(new Date().setHours(0, 0, 0, 0));

                      return (
                        <button
                          key={day.date}
                          onClick={() =>
                            !isPast && day.hasSlots && setSelectedDate(day.date)
                          }
                          disabled={isPast || !day.hasSlots}
                          className={`h-10 rounded-xl text-xs font-medium transition-all
                            ${
                              isSelected
                                ? 'bg-[#6C3FD1] text-white shadow-md'
                                : isToday
                                ? 'border border-[#C89B4B] bg-[#FFFDF9] text-[#3B2A1E]'
                                : day.hasSlots
                                ? 'bg-[#E9F3E3] text-[#4F6F52] hover:bg-[#DBEAD5]'
                                : 'bg-[#F0ECE4] text-[#B4A592] cursor-not-allowed'
                            }
                            ${isPast ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                          title={
                            day.hasSlots
                              ? `${day.slotCount} slot tersedia`
                              : 'Tidak ada slot'
                          }
                        >
                          <div className="flex flex-col items-center justify-center h-full">
                            <span>{day.day}</span>
                            {day.hasSlots && day.slotCount > 0 && (
                              <span className="text-[10px] opacity-80">
                                {day.slotCount}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-4 mt-4 text-[11px] text-[#7E6A52]">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-[#E9F3E3] border border-[#C5E0BF]" />
                      <span>Tersedia</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-[#6C3FD1]" />
                      <span>Terpilih</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-[#F0ECE4]" />
                      <span>Tidak tersedia</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Time Slots Section */}
          {selectedDate && (
            <div className="mb-7">
              <label className="block text-sm font-semibold text-[#3B2A1E] mb-3">
                Pilih Waktu untuk {formatDate(selectedDate)}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {availableSlots.length === 0 ? (
                  <div className="col-span-2 sm:col-span-3 text-center text-sm text-[#A18F76] p-4 border border-dashed border-[#E1D4C0] rounded-xl bg-[#FBF6EA]">
                    Tidak ada slot tersedia untuk tanggal ini.
                  </div>
                ) : (
                  availableSlots.map((s) => (
                    <button
                      key={s._id}
                      onClick={() => setSelectedSlot(s._id)}
                      className={`p-3 rounded-xl text-sm font-medium border transition-all
                        ${
                          selectedSlot === s._id
                            ? 'bg-[#6C3FD1] text-white border-[#6C3FD1] shadow-md'
                            : 'bg-[#FFFDF9] text-[#3B2A1E] border-[#E1D4C0] hover:bg-[#F1E5D1]'
                        }
                      `}
                    >
                      {s.start_time} - {s.end_time}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Notes Section */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-[#3B2A1E] mb-3">
              Catatan (opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border border-[#E1D4C0] rounded-2xl px-4 py-3 text-sm text-[#3B2A1E] bg-[#FFFDF9] focus:outline-none focus:ring-2 focus:ring-[#C89B4B]/40 focus:border-[#C89B4B] transition-colors"
              placeholder="Tambahkan catatan khusus untuk terapis atau dokter..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.back()}
              className="w-full sm:flex-1 py-3 rounded-xl border border-[#E1D4C0] text-sm font-medium text-[#7E6A52] bg-[#FFFDF9] hover:bg-[#FBF6EA] transition-colors"
            >
              Kembali
            </button>
            <button
              onClick={handleSubmitBooking}
              disabled={
                isLoading || !selectedSlot || selectedTreatments.length === 0
              }
              className={`w-full sm:flex-1 py-3 rounded-xl text-sm font-semibold transition-all
                ${
                  isLoading || !selectedSlot || selectedTreatments.length === 0
                    ? 'bg-[#C7B9A2] text-white cursor-not-allowed'
                    : 'bg-[#6C3FD1] text-white hover:bg-[#5b34b3] shadow-md hover:shadow-lg'
                }
              `}
            >
              {isLoading ? 'Memproses...' : 'Konfirmasi Booking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
