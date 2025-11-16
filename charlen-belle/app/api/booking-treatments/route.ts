// app/api/booking-treatments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../lib/mongodb';
import BookingTreatment from '../../models/BookingTreatment';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const booking_id = searchParams.get('booking_id');
    if (!booking_id) {
      return NextResponse.json({ error: 'booking_id required' }, { status: 400 });
    }
    const items = await BookingTreatment.find({ booking_id }).populate('treatment_id');
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error('Get booking treatments error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
