// app/api/slots/available-dates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import BookingSlot from '../../../models/BookingSlot';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());

    console.log('Fetching available dates for:', year, month);

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of the month

    // Format dates for query - use local date strings without timezone conversion
    const startDateStr = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDateStr = `${year}-${String(month).padStart(2, '0')}-${endDate.getDate()}`;

    console.log('Date range:', startDateStr, 'to', endDateStr);

    // Query available slots for the entire month using string comparison
    const allAvailableSlots = await BookingSlot.find({
      is_available: true
    }).select('date -_id');

    console.log('Total available slots in DB:', allAvailableSlots.length);

    // Filter slots for the requested month
    const monthSlots = allAvailableSlots.filter(slot => {
      const slotDate = new Date(slot.date);
      const slotYear = slotDate.getFullYear();
      const slotMonth = slotDate.getMonth() + 1;
      
      return slotYear === year && slotMonth === month;
    });

    console.log('Available slots for month:', monthSlots.length);

    // Group slots by date and count
    const dateMap = new Map();
    monthSlots.forEach(slot => {
      const dateStr = new Date(slot.date).toISOString().split('T')[0];
      const count = dateMap.get(dateStr) || 0;
      dateMap.set(dateStr, count + 1);
    });

    // Convert to array of AvailableDate objects
    const availableDates = Array.from(dateMap.entries()).map(([date, slotCount]) => ({
      date,
      hasSlots: slotCount > 0,
      slotCount
    }));

    console.log('Processed available dates:', availableDates);

    return NextResponse.json({
      success: true,
      dates: availableDates,
      month,
      year,
      debug: {
        totalAvailableSlots: allAvailableSlots.length,
        monthAvailableSlots: monthSlots.length
      }
    });

  } catch (error) {
    console.error('Error fetching available dates:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Terjadi kesalahan server' 
    }, { status: 500 });
  }
}