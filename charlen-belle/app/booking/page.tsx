'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '../components/ui/buttons';
import { Input } from '../components/ui/input';
import { formatCurrency, formatDate } from '../lib/utils';
import toast from 'react-hot-toast';

export default function BookingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const treatmentId = searchParams.get('treatment');

  const [step, setStep] = useState(1);
  const [bookingType, setBookingType] = useState<'consultation' | 'treatment'>('treatment');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/booking');
    }
  }, [status, router]);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate]);

  const fetchAvailableSlots = async (date: string) => {
    try {
      const response = await fetch(`/api/slots?date=${date}`);
      const data = await response.json();
      setAvailableSlots(data.slots);
    } catch (error) {
      toast.error('Gagal memuat slot tersedia');
    }
  };

  const handleSubmitBooking = async () => {
    if (!selectedSlot) {
      toast.error('Pilih jadwal terlebih dahulu');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_id: selectedSlot,
          type: bookingType,
          notes,
          treatments: treatmentId ? [treatmentId] : []
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      toast.success('Booking berhasil dibuat!');
      router.push(`/dashboard/bookings/${data.booking._id}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Buat Booking Baru
          </h1>

          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-8">
            <StepIndicator step={1} currentStep={step} label="Jenis Layanan" />
            <div className="flex-1 h-1 bg-gray-200 mx-2"></div>
            <StepIndicator step={2} currentStep={step} label="Pilih Jadwal" />
            <div className="flex-1 h-1 bg-gray-200 mx-2"></div>
            <StepIndicator step={3} currentStep={step} label="Konfirmasi" />
          </div>

          {/* Step 1: Choose Type */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Pilih Jenis Layanan</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setBookingType('consultation')}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      bookingType === 'consultation'
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <h3 className="font-semibold text-lg mb-2">Konsultasi</h3>
                    <p className="text-sm text-gray-600">
                      Konsultasi dengan dokter untuk menentukan treatment yang sesuai
                    </p>
                  </button>
                  <button
                    onClick={() => setBookingType('treatment')}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      bookingType === 'treatment'
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <h3 className="font-semibold text-lg mb-2">Treatment Langsung</h3>
                    <p className="text-sm text-gray-600">
                      Langsung booking treatment tanpa konsultasi
                    </p>
                  </button>
                </div>
              </div>
              <Button onClick={() => setStep(2)} className="w-full" size="lg">
                Lanjutkan
              </Button>
            </div>
          )}

          {/* Step 2: Choose Date & Slot */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Pilih Tanggal & Waktu</h2>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal
                  </label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {selectedDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pilih Waktu
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {availableSlots.length === 0 ? (
                        <p className="col-span-3 text-center text-gray-500 py-4">
                          Tidak ada slot tersedia untuk tanggal ini
                        </p>
                      ) : (
                        availableSlots.map((slot: any) => (
                          <button
                            key={slot._id}
                            onClick={() => setSelectedSlot(slot._id)}
                            className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                              selectedSlot === slot._id
                                ? 'border-purple-600 bg-purple-50 text-purple-600'
                                : 'border-gray-200 hover:border-purple-300'
                            }`}
                          >
                            {slot.start_time} - {slot.end_time}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan (Opsional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Tambahkan catatan atau keluhan..."
                />
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                  Kembali
                </Button>
                <Button 
                  onClick={() => setStep(3)} 
                  className="flex-1"
                  disabled={!selectedSlot}
                >
                  Lanjutkan
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Konfirmasi Booking</h2>
              
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Jenis Layanan:</span>
                  <span className="font-semibold">
                    {bookingType === 'consultation' ? 'Konsultasi' : 'Treatment'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tanggal:</span>
                  <span className="font-semibold">{formatDate(selectedDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Waktu:</span>
                  <span className="font-semibold">
                    {availableSlots.find((s: any) => s._id === selectedSlot)?.start_time} - 
                    {availableSlots.find((s: any) => s._id === selectedSlot)?.end_time}
                  </span>
                </div>
                {notes && (
                  <div>
                    <span className="text-gray-600 block mb-2">Catatan:</span>
                    <p className="text-sm bg-white p-3 rounded-lg">{notes}</p>
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Perhatian:</strong> Mohon datang 15 menit sebelum jadwal. 
                  Pembayaran dilakukan setelah treatment selesai.
                </p>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setStep(2)} variant="outline" className="flex-1">
                  Kembali
                </Button>
                <Button 
                  onClick={handleSubmitBooking}
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? 'Memproses...' : 'Konfirmasi Booking'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ step, currentStep, label }: { step: number; currentStep: number; label: string }) {
  const isActive = currentStep === step;
  const isCompleted = currentStep > step;

  return (
    <div className="flex flex-col items-center">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
        isCompleted 
          ? 'bg-green-500 text-white' 
          : isActive 
            ? 'bg-purple-600 text-white' 
            : 'bg-gray-200 text-gray-500'
      }`}>
        {isCompleted ? '✓' : step}
      </div>
      <span className={`text-xs mt-2 ${isActive ? 'text-purple-600 font-semibold' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  );
}