import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Payment from '../../../models/Payment';
import Booking from '../../../models/Booking';
import BookingTreatment from '../../../models/BookingTreatment';
import Treatment from '../../../models/Treatment';
import User from '../../../models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth-config';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || !['admin', 'superadmin', 'kasir'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'today'; // today, week, month, year, custom
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const treatmentId = searchParams.get('treatmentId');

    // Calculate date range based on period
    let dateFilter: any = {};
    const now = new Date();
    
    switch (period) {
      case 'today':
        dateFilter = {
          paid_at: {
            $gte: new Date(now.setHours(0, 0, 0, 0)),
            $lte: new Date(now.setHours(23, 59, 59, 999))
          }
        };
        break;
      case 'week':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        dateFilter = {
          paid_at: {
            $gte: startOfWeek,
            $lte: new Date(now.setHours(23, 59, 59, 999))
          }
        };
        break;
      case 'month':
        dateFilter = {
          paid_at: {
            $gte: new Date(now.getFullYear(), now.getMonth(), 1),
            $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
          }
        };
        break;
      case 'year':
        dateFilter = {
          paid_at: {
            $gte: new Date(now.getFullYear(), 0, 1),
            $lte: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
          }
        };
        break;
      case 'custom':
        if (startDate && endDate) {
          dateFilter = {
            paid_at: {
              $gte: new Date(startDate),
              $lte: new Date(endDate + 'T23:59:59.999Z')
            }
          };
        }
        break;
    }

    // Base query for paid payments
    const baseMatch = {
      status: 'paid',
      ...dateFilter
    };

    // Get sales summary
    const salesSummary = await Payment.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalTransactions: { $sum: 1 },
          averageTransaction: { $avg: '$amount' }
        }
      }
    ]);

    // Get daily sales for chart
    const dailySales = await Payment.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$paid_at' }
          },
          revenue: { $sum: '$amount' },
          transactions: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get top treatments
    const topTreatments = await BookingTreatment.aggregate([
      {
        $lookup: {
          from: 'bookings',
          localField: 'booking_id',
          foreignField: '_id',
          as: 'booking'
        }
      },
      { $unwind: '$booking' },
      {
        $lookup: {
          from: 'payments',
          let: { bookingId: '$booking_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$booking_id', '$$bookingId'] },
                status: 'paid',
                ...dateFilter
              }
            }
          ],
          as: 'payment'
        }
      },
      { $match: { 'payment.0': { $exists: true } } },
      {
        $lookup: {
          from: 'treatments',
          localField: 'treatment_id',
          foreignField: '_id',
          as: 'treatment'
        }
      },
      { $unwind: '$treatment' },
      {
        $group: {
          _id: '$treatment_id',
          treatmentName: { $first: '$treatment.name' },
          totalRevenue: { $sum: { $multiply: ['$price', '$quantity'] } },
          totalQuantity: { $sum: '$quantity' },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    // Get payment method distribution
    const paymentMethods = await Payment.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: '$payment_method',
          totalRevenue: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      }
    ]);

    // Get recent transactions
    const recentTransactions = await Payment.find({
      status: 'paid',
      ...dateFilter
    })
      .populate('booking_id')
      .populate('user_id', 'name email phone_number')
      .sort({ paid_at: -1 })
      .limit(10);

    const summary = salesSummary[0] || {
      totalRevenue: 0,
      totalTransactions: 0,
      averageTransaction: 0
    };

    return NextResponse.json({
      success: true,
      data: {
        summary,
        dailySales,
        topTreatments,
        paymentMethods,
        recentTransactions,
        dateRange: dateFilter.paid_at
      }
    });

  } catch (error) {
    console.error('Error fetching sales report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sales report' },
      { status: 500 }
    );
  }
}