// app/api/admin/bookings/[id]/consultation-notes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb';
import Booking from '../../../../../models/Booking';
import BookingEditLog from '../../../../../models/BookingEditLog';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../lib/auth-config';
import mongoose from 'mongoose';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const bookingId = params.id;
    
    console.log('Consultation notes API called for booking:', bookingId);
    
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin/doctor access
    if (!session.user.role || !['admin', 'superadmin', 'doctor'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    // Validate booking ID
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return NextResponse.json({ error: 'Invalid booking ID' }, { status: 400 });
    }

    const body = await req.json();
    const { diagnosis, recommendations, notes } = body;

    console.log('Received consultation data:', { diagnosis, recommendations, notes });

    // Find booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Add consultation note
    const consultationNote = {
      diagnosis,
      recommendations,
      notes,
      added_by: new mongoose.Types.ObjectId(session.user.id),
      added_at: new Date()
    };

    if (!booking.consultation_notes) {
      booking.consultation_notes = [];
    }

    booking.consultation_notes.push(consultationNote);
    booking.updated_at = new Date();
    await booking.save();

    // Log the action
    await BookingEditLog.create({
      booking_id: bookingId,
      edited_by: new mongoose.Types.ObjectId(session.user.id),
      action: 'added_consultation_note',
      details: {
        consultation_note: notes || diagnosis
      }
    });

    // FIXED: Use proper population for nested arrays
    const updatedBooking = await Booking.findById(bookingId)
      .populate('user_id', 'name email phone_number')
      .populate('slot_id')
      .populate({
        path: 'consultation_notes.added_by',
        select: 'name'
      });

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      message: 'Consultation note added successfully'
    });

  } catch (error) {
    console.error('Add consultation note error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}