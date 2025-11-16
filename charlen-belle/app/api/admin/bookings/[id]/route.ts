import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Booking from '../../../../models/Booking';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth-config';
import mongoose from 'mongoose';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params promise
    const { id: bookingId } = await params;
    
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

    const requestBody = await req.json();
    const { status } = requestBody;

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'completed', 'canceled'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status', 
        validStatuses 
      }, { status: 400 });
    }

    // Find and update the booking
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { 
        status,
        updated_at: new Date(),
        ...(status === 'confirmed' && { 
          confirmed_by: new mongoose.Types.ObjectId(session.user.id) 
        })
      },
      { new: true, runValidators: true }
    ).populate('user_id', 'name email phone_number')
     .populate({
        path: 'slot_id',
        model: 'BookingSlot'
      });

    if (!updatedBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      message: 'Status booking berhasil diupdate'
    });

  } catch (error) {
    console.error('Update booking error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Optional: Add GET method to fetch single booking
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params promise
    const { id: bookingId } = await params;
    
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

    const booking = await Booking.findById(bookingId)
      .populate('user_id', 'name email phone_number')
      .populate({
        path: 'slot_id',
        model: 'BookingSlot'
      })
      .populate('confirmed_by', 'name');

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Get payment and treatments
    const Payment = (await import('../../../../models/Payment')).default;
    const BookingTreatment = (await import('../../../../models/BookingTreatment')).default;

    const [payment, treatments] = await Promise.all([
      Payment.findOne({ booking_id: bookingId }).select('status payment_method'),
      BookingTreatment.find({ booking_id: bookingId }).populate('treatment_id', 'name')
    ]);

    const bookingWithDetails = {
      ...booking.toObject(),
      payment: payment ? {
        status: payment.status,
        payment_method: payment.payment_method
      } : null,
      treatments: treatments.map(t => ({
        _id: t._id,
        treatment_id: t.treatment_id,
        quantity: t.quantity,
        price: t.price
      }))
    };

    return NextResponse.json({
      success: true,
      booking: bookingWithDetails
    });

  } catch (error) {
    console.error('Get booking error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}