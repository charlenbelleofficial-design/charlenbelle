// app/api/admin/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Booking from '../../../models/Booking';
import Payment from '../../../models/Payment';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth-config';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Silakan login terlebih dahulu' },
        { status: 401 }
      );
    }

    // Check if user has permission (admin, superadmin, kasir)
    const allowedRoles = ['admin', 'superadmin', 'kasir'];
    const userRole = session.user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
    return NextResponse.json(
        { error: 'Akses ditolak' },
        { status: 403 }
    );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const paymentStatus = searchParams.get('payment_status') || 'unpaid';

    // Build query based on payment status
    let bookingQuery: any = {};
    
    if (paymentStatus === 'unpaid') {
      // Find bookings without payment or with pending/failed payments
      bookingQuery = {
        $or: [
          { payment: { $exists: false } },
          { 'payment.status': { $in: ['pending', 'failed'] } }
        ]
      };
    } else if (paymentStatus === 'paid') {
      // Find bookings with paid payments
      bookingQuery = { 'payment.status': 'paid' };
    }

    const bookings = await Booking.find(bookingQuery)
      .populate('user_id', 'name email phone_number')
      .populate({
        path: 'slot_id',
        populate: [
          { path: 'doctor_id', select: 'name' },
          { path: 'therapist_id', select: 'name' }
        ]
      })
      .sort({ created_at: -1 });

    // Get payments for each booking
    const bookingsWithPayments = await Promise.all(
      bookings.map(async (booking) => {
        const payment = await Payment.findOne({ booking_id: booking._id })
          .select('status payment_method amount midtrans_redirect_url created_at')
          .lean();

        // Get treatments for the booking
        const BookingTreatment = (await import('../../../models/BookingTreatment')).default;
        const treatments = await BookingTreatment.find({ booking_id: booking._id })
          .populate('treatment_id', 'name description');

        return {
          _id: booking._id,
          user_id: booking.user_id,
          slot_id: booking.slot_id,
          type: booking.type,
          status: booking.status,
          notes: booking.notes,
          total_amount: booking.total_amount,
          created_at: booking.created_at,
          treatments: treatments.map(t => ({
            _id: t._id,
            treatment_id: t.treatment_id,
            quantity: t.quantity,
            price: t.price
          })),
          payment: payment || null
        };
      })
    );

    return NextResponse.json({
      success: true,
      bookings: bookingsWithPayments
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Terjadi kesalahan server' 
      },
      { status: 500 }
    );
  }
}