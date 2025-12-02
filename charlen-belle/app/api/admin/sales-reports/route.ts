// app/api/admin/sales-reports/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Payment from '../../../models/Payment';
import BookingTreatment from '../../../models/BookingTreatment';
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
    const period = searchParams.get('period') || 'today';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Calculate date range based on period - FIXED TIMEZONE
    let dateFilter: any = {};
    const now = new Date();
    
    // Helper function to create date in local timezone
    const createLocalDate = (year: number, month: number, day: number, hour = 0, minute = 0, second = 0, ms = 0) => {
      const date = new Date(year, month, day, hour, minute, second, ms);
      // Adjust for timezone offset
      const timezoneOffset = date.getTimezoneOffset() * 60000;
      return new Date(date.getTime() - timezoneOffset);
    };

    switch (period) {
      case 'today': {
        // Today in local timezone
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
        
        dateFilter = {
          $or: [
            {
              paid_at: {
                $gte: todayStart,
                $lte: todayEnd
              }
            },
            // Also check if created_at is today (for testing)
            {
              paid_at: { $exists: false },
              created_at: {
                $gte: todayStart,
                $lte: todayEnd
              },
              status: 'paid'
            }
          ]
        };
        break;
      }
      case 'week': {
        // This week (last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);
        
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        
        dateFilter = {
          $or: [
            {
              paid_at: {
                $gte: weekAgo,
                $lte: todayEnd
              }
            },
            {
              paid_at: { $exists: false },
              created_at: {
                $gte: weekAgo,
                $lte: todayEnd
              },
              status: 'paid'
            }
          ]
        };
        break;
      }
      case 'month': {
        // This month
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        
        dateFilter = {
          $or: [
            {
              paid_at: {
                $gte: startOfMonth,
                $lte: endOfMonth
              }
            },
            {
              paid_at: { $exists: false },
              created_at: {
                $gte: startOfMonth,
                $lte: endOfMonth
              },
              status: 'paid'
            }
          ]
        };
        break;
      }
      case 'year': {
        // This year
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        
        dateFilter = {
          $or: [
            {
              paid_at: {
                $gte: startOfYear,
                $lte: endOfYear
              }
            },
            {
              paid_at: { $exists: false },
              created_at: {
                $gte: startOfYear,
                $lte: endOfYear
              },
              status: 'paid'
            }
          ]
        };
        break;
      }
      case 'custom':
        if (startDate && endDate) {
          const customStart = new Date(startDate);
          customStart.setHours(0, 0, 0, 0);
          const customEnd = new Date(endDate);
          customEnd.setHours(23, 59, 59, 999);
          
          dateFilter = {
            $or: [
              {
                paid_at: {
                  $gte: customStart,
                  $lte: customEnd
                }
              },
              {
                paid_at: { $exists: false },
                created_at: {
                  $gte: customStart,
                  $lte: customEnd
                },
                status: 'paid'
              }
            ]
          };
        }
        break;
      case 'all':
        // No date filter for "all"
        dateFilter = {};
        break;
    }

    // Base query for paid payments - MORE FLEXIBLE
    const baseMatch = {
      status: 'paid',
      ...dateFilter
    };

    console.log('Query filter:', JSON.stringify(baseMatch, null, 2));
    console.log('Current date:', new Date().toISOString());

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

    // Get daily sales - use paid_at or created_at
    const dailySales = await Payment.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: {
            $dateToString: { 
              format: '%Y-%m-%d', 
              date: { $ifNull: ['$paid_at', '$created_at'] }
            }
          },
          revenue: { $sum: '$amount' },
          transactions: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 }
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
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    // Get recent transactions
    const recentTransactions = await Payment.find(baseMatch)
      .populate({
        path: 'user_id',
        select: 'name email phone_number'
      })
      .populate({
        path: 'booking_id',
        select: '_id type status'
      })
      .sort({ paid_at: -1, created_at: -1 })
      .limit(10)
      .lean();

    const summary = salesSummary[0] || {
      totalRevenue: 0,
      totalTransactions: 0,
      averageTransaction: 0
    };

    // DEBUG: Count how many payments matched
    const matchedCount = await Payment.countDocuments(baseMatch);

    return NextResponse.json({
      success: true,
      data: {
        summary,
        dailySales,
        topTreatments: [], // We'll fix this separately
        paymentMethods,
        recentTransactions,
        debug: {
          matchedCount,
          filter: baseMatch,
          currentDate: new Date().toISOString(),
          timezoneOffset: new Date().getTimezoneOffset()
        }
      }
    });

  } catch (error) {
    console.error('Error fetching sales report:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch sales report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}