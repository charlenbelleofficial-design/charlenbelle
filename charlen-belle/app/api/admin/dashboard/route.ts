import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth-config';
import connectDB from '../../../lib/mongodb';
import Booking from '../../../models/Booking';
import Payment from '../../../models/Payment';
import User from '../../../models/User';
import Promo from '../../../models/Promo';
import BookingSlot from '../../../models/BookingSlot'; // Explicitly import BookingSlot
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.role || !['admin', 'superadmin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Tidak memiliki akses' },
        { status: 403 }
      );
    }

    await connectDB();

    // Ensure BookingSlot model is registered
    if (!mongoose.models.BookingSlot) {
      await import('../../../models/BookingSlot');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Count today's bookings
    const todayBookings = await Booking.countDocuments({
      created_at: { $gte: today }
    });

    // Count pending bookings
    const pendingBookings = await Booking.countDocuments({
      status: 'pending'
    });

    // Calculate today's revenue
    const todayPayments = await Payment.aggregate([
      {
        $match: {
          status: 'paid',
          paid_at: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const todayRevenue = todayPayments[0]?.total || 0;

    // Calculate monthly revenue
    const monthlyPayments = await Payment.aggregate([
      {
        $match: {
          status: 'paid',
          paid_at: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const monthlyRevenue = monthlyPayments[0]?.total || 0;

    // Count total customers
    const totalCustomers = await User.countDocuments({
      role: 'customer'
    });

    // Count active promos
    const activePromos = await Promo.countDocuments({
      is_active: true,
      start_date: { $lte: today },
      end_date: { $gte: today }
    });

    // Get recent bookings - fix the populate path
    const recentBookings = await Booking.find()
      .sort({ created_at: -1 })
      .limit(10)
      .populate('user_id', 'name email')
      .populate({
        path: 'slot_id',
        model: 'BookingSlot' // Explicitly specify the model
      });

    return NextResponse.json({
      stats: {
        todayBookings,
        pendingBookings,
        todayRevenue,
        monthlyRevenue,
        totalCustomers,
        activePromos
      },
      recentBookings
    }, { status: 200 });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}