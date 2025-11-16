// app/api/slots/route.ts - UPDATED
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../lib/mongodb';
import BookingSlot from '../../models/BookingSlot';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    console.log('Slots API called with date:', date);

    if (!date) {
      return NextResponse.json({ error: 'Tanggal wajib diisi' }, { status: 400 });
    }

    // Method 1: Exact date match (try this first)
    const exactDate = new Date(date + 'T00:00:00.000Z');
    console.log('Exact date for query:', exactDate.toISOString());
    
    let slots = await BookingSlot.find({
      date: exactDate,
      is_available: true
    }).sort({ start_time: 1 });

    console.log('Exact date match found:', slots.length);

    // Method 2: If exact match fails, try date range
    if (slots.length === 0) {
      console.log('Trying date range approach...');
      const startOfDay = new Date(date + 'T00:00:00.000Z');
      const endOfDay = new Date(date + 'T23:59:59.999Z');
      
      slots = await BookingSlot.find({
        date: {
          $gte: startOfDay,
          $lte: endOfDay
        },
        is_available: true
      }).sort({ start_time: 1 });
      
      console.log('Date range match found:', slots.length);
    }

    // Method 3: If still no results, try string comparison
    if (slots.length === 0) {
      console.log('Trying string comparison...');
      const allSlots = await BookingSlot.find({ is_available: true });
      slots = allSlots.filter(slot => {
        const slotDateStr = slot.date.toISOString().split('T')[0];
        return slotDateStr === date;
      });
      console.log('String comparison found:', slots.length);
    }

    return NextResponse.json({ 
      success: true,
      slots: slots.map(slot => ({
        _id: slot._id,
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        is_available: slot.is_available
      }))
    });

  } catch (error) {
    console.error('Slots API error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}