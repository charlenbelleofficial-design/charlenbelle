// app/api/admin/dashboard/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Booking from '../../../../models/Booking';
import Payment from '../../../../models/Payment';
import WalkinTransaction from '../../../../models/WalkinTransaction';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth-config';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin access
     if (!session.user.role || !['admin', 'superadmin', 'kasir', 'doctor'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch stats in parallel
    const [
      totalBookings,
      pendingBookings,
      todayBookings,
      paidPayments,
      walkinTransactions
    ] = await Promise.all([
      // Total bookings
      Booking.countDocuments(),
      
      // Pending bookings
      Booking.countDocuments({ status: 'pending' }),
      
      // Today's bookings
      Booking.countDocuments({
        'slot_id.date': {
          $gte: today,
          $lt: tomorrow
        }
      }),
      
      // Total revenue from paid payments
      Payment.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      
      // Walk-in transactions
      WalkinTransaction.countDocuments({ status: 'paid' })
    ]);

    const totalRevenue = paidPayments[0]?.total || 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalBookings,
        pendingBookings,
        todayBookings,
        totalRevenue,
        walkinTransactions
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}