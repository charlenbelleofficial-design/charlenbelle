// app/user/booking/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '../../lib/utils';

type Slot = { _id: string; start_time: string; end_time: string; date: string; };
type AvailableDate = { date: string; hasSlots: boolean; slotCount: number };

export default function BookingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [selectedTreatments, setSelectedTreatments] = useState<{ id: string; name?: string; quantity: number }[]>([]);
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
      router.push('/login?redirect=/user/booking');
    }
  }, [status]);

  useEffect(() => {
    if (selectedDate) {
      fetchSlots(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchAvailableDates();
  }, [currentMonth]);

  // In your fetchAvailableDates function, add this:
  async function fetchAvailableDates() {
    setIsLoadingDates(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      console.log('Fetching available dates for:', year, month);
      
      const res = await fetch(`/api/slots/available-dates?year=${year}&month=${month}`);
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
    const next = selectedTreatments.filter(t => t.id !== id);
    setSelectedTreatments(next);
    localStorage.setItem('selectedTreatments', JSON.stringify(next));
  }

  function changeQty(id: string, qty: number) {
    const next = selectedTreatments.map(t => t.id === id ? { ...t, quantity: qty } : t);
    setSelectedTreatments(next);
    localStorage.setItem('selectedTreatments', JSON.stringify(next));
  }

  async function handleSubmitBooking() {
    if (!selectedSlot) { toast.error('Pilih slot'); return; }
    if (selectedTreatments.length === 0) { toast.error('Pilih minimal 1 treatment'); return; }
    setIsLoading(true);
    try {
      const body = {
        slot_id: selectedSlot,
        type: 'treatment',
        notes,
        treatments: selectedTreatments.map(t => ({ treatment_id: t.id, quantity: t.quantity }))
      };
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
      toast.error(e.message || 'Error');
    } finally {
      setIsLoading(false);
    }
  }

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

  // Generate calendar days
  const generateCalendarDays = () => {
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
      
      // Find matching available date - use exact string comparison
      const availableDate = availableDates.find(d => {
        // Ensure both dates are in the same format
        const availableDateStr = new Date(d.date).toISOString().split('T')[0];
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
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 shadow">
        <h1 className="text-2xl font-bold mb-6">Buat Booking Baru</h1>

        <div className="mb-6">
          <h3 className="font-semibold mb-3">Treatment Terpilih</h3>
          {selectedTreatments.length === 0 ? (
            <div className="text-gray-500 p-4 border rounded-lg text-center">
              Belum ada treatment. Pilih dari halaman layanan.
            </div>
          ) : (
            <div className="space-y-3">
              {selectedTreatments.map(t => (
                <div key={t.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-semibold text-lg">{t.name || t.id}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      Qty: 
                      <button 
                        onClick={() => changeQty(t.id, Math.max(1, t.quantity - 1))} 
                        className="ml-3 px-3 py-1 border rounded-lg hover:bg-gray-50"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 mx-1 border rounded-lg bg-gray-50 min-w-[40px] inline-block text-center">
                        {t.quantity}
                      </span>
                      <button 
                        onClick={() => changeQty(t.id, t.quantity + 1)} 
                        className="px-3 py-1 border rounded-lg hover:bg-gray-50"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button 
                    className="text-sm text-red-600 hover:text-red-800 px-3 py-1 border border-red-200 rounded-lg hover:bg-red-50" 
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
        <div className="mb-6">
          <label className="block text-sm font-medium mb-3">Pilih Tanggal</label>
          <div className="border rounded-lg p-4 bg-white">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg"
                disabled={isLoadingDates}
              >
                ←
              </button>
              <h3 className="text-lg font-semibold">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                {isLoadingDates && <span className="text-sm text-gray-500 ml-2">(memuat...)</span>}
              </h3>
              <button 
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 rounded-lg"
                disabled={isLoadingDates}
              >
                →
              </button>
            </div>

            {isLoadingDates ? (
              <div className="flex justify-center items-center h-48">
                <div className="text-gray-500">Memuat kalender...</div>
              </div>
            ) : (
              <>
                {/* Day Names */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {dayNames.map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, index) => {
                    if (day === null) {
                      return <div key={`empty-${index}`} className="h-12" />;
                    }

                    const isSelected = selectedDate === day.date;
                    const isToday = day.date === new Date().toISOString().split('T')[0];
                    const isPast = new Date(day.date) < new Date(new Date().setHours(0, 0, 0, 0));

                    return (
                      <button
                        key={day.date}
                        onClick={() => !isPast && day.hasSlots && setSelectedDate(day.date)}
                        disabled={isPast || !day.hasSlots}
                        className={`
                          h-12 rounded-lg text-sm font-medium transition-all
                          ${isSelected 
                            ? 'bg-purple-600 text-white shadow-lg transform scale-105' 
                            : isToday
                            ? 'border-2 border-purple-300 bg-white text-gray-900'
                            : day.hasSlots
                            ? 'bg-green-50 text-green-800 hover:bg-green-100 hover:shadow-md'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }
                          ${isPast ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                        title={day.hasSlots ? `${day.slotCount} slot tersedia` : 'Tidak ada slot'}
                      >
                        <div className="flex flex-col items-center justify-center h-full">
                          <span>{day.day}</span>
                          {day.hasSlots && day.slotCount > 0 && (
                            <span className="text-xs opacity-75">
                              {day.slotCount}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Calendar Legend */}
            <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-50 border border-green-200 rounded"></div>
                <span>Tersedia</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-600 rounded"></div>
                <span>Terpilih</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-100 rounded"></div>
                <span>Tidak Tersedia</span>
              </div>
            </div>
          </div>
        </div>

        {/* Time Slots Section */}
        {selectedDate && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3">
              Pilih Waktu untuk {formatDate(selectedDate)}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableSlots.length === 0 ? (
                <div className="col-span-3 text-center text-gray-500 p-4 border rounded-lg">
                  Tidak ada slot tersedia untuk tanggal ini
                </div>
              ) : (
                availableSlots.map(s => (
                  <button 
                    key={s._id} 
                    onClick={() => setSelectedSlot(s._id)}
                    className={`
                      p-3 border rounded-lg text-sm font-medium transition-all
                      ${selectedSlot === s._id 
                        ? 'bg-purple-600 text-white border-purple-600 shadow-lg transform scale-105' 
                        : 'bg-white text-gray-700 border-gray-300 hover:border-purple-300 hover:bg-purple-50'
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
        <div className="mb-6">
          <label className="block text-sm font-medium mb-3">Catatan (opsional)</label>
          <textarea 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)} 
            rows={3} 
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors" 
            placeholder="Tambahkan catatan khusus untuk terapis atau dokter..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button 
            onClick={() => router.back()} 
            className="flex-1 border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Kembali
          </button>
          <button 
            onClick={handleSubmitBooking} 
            disabled={isLoading || !selectedSlot || selectedTreatments.length === 0}
            className={`
              flex-1 py-3 rounded-lg font-medium transition-all
              ${isLoading || !selectedSlot || selectedTreatments.length === 0
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg hover:shadow-xl'
              }
            `}
          >
            {isLoading ? 'Memproses...' : 'Konfirmasi Booking'}
          </button>
        </div>
      </div>
    </div>
  );
}