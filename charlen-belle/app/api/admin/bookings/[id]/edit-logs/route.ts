// app/api/admin/bookings/[id]/edit-logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb';
import BookingEditLog from '../../../../../models/BookingEditLog';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../lib/auth-config';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const bookingId = params.id;
    
    console.log('Fetching edit logs for booking:', bookingId);
    
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin access
    if (!session.user.role || !['admin', 'superadmin', 'kasir', 'doctor'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    // Validate booking ID
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return NextResponse.json({ error: 'Invalid booking ID' }, { status: 400 });
    }

    // Fetch edit logs for this booking
    const editLogs = await BookingEditLog.find({ booking_id: bookingId })
      .populate('edited_by', 'name')
      .sort({ created_at: -1 });

    return NextResponse.json({
      success: true,
      logs: editLogs
    });

  } catch (error) {
    console.error('Error fetching edit logs:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}