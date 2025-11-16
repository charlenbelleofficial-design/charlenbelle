// app/api/slots/all/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import BookingSlot from '../../../models/BookingSlot';

export async function GET() {
  try {
    await connectDB();
    
    const allSlots = await BookingSlot.find({}).sort({ date: 1, start_time: 1 });
    
    console.log('All booking slots in database:', allSlots.length);
    console.log('Slots:', allSlots);

    return NextResponse.json({ 
      total: allSlots.length,
      slots: allSlots 
    }, { status: 200 });
  } catch (error) {
    console.error('Get all slots error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}