import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../lib/mongodb';
import Booking from '../../models/Booking';
import BookingSlot from '../../models/BookingSlot';
import { getServerSession } from 'next-auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Silakan login terlebih dahulu' },
        { status: 401 }
      );
    }

    await connectDB();

    const { slot_id, type, notes, treatments } = await req.json();

    // Check slot availability
    const slot = await BookingSlot.findById(slot_id);
    
    if (!slot || !slot.is_available) {
      return NextResponse.json(
        { error: 'Slot tidak tersedia' },
        { status: 400 }
      );
    }

    // Create booking
    const booking = await Booking.create({
      user_id: session.user.id,
      slot_id,
      type,
      notes,
      status: 'pending'
    });

    // Mark slot as unavailable
    await BookingSlot.findByIdAndUpdate(slot_id, { is_available: false });

    return NextResponse.json({
      message: 'Booking berhasil dibuat',
      booking
    }, { status: 201 });

  } catch (error) {
    console.error('Create booking error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}