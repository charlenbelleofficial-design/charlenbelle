// app/api/admin/sales-reports/debug/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Payment from '../../../../models/Payment';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth-config';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || !['admin', 'superadmin', 'kasir'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    // Get ALL payments to see what we have
    const allPayments = await Payment.find()
      .sort({ created_at: -1 })
      .limit(20)
      .lean();

    // Count by status
    const statusCounts = await Payment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Check if any payments have paid_at
    const paymentsWithPaidAt = await Payment.find({
      paid_at: { $exists: true, $ne: null }
    }).countDocuments();

    // Get a sample of paid payments
    const paidPaymentsSample = await Payment.find({
      status: 'paid'
    })
    .limit(5)
    .select('_id status amount payment_method paid_at created_at')
    .lean();

    return NextResponse.json({
      success: true,
      data: {
        totalPayments: allPayments.length,
        statusCounts,
        paymentsWithPaidAt,
        paidPaymentsSample,
        allPaymentsSample: allPayments.map(p => ({
          _id: p._id,
          status: p.status,
          payment_method: p.payment_method,
          amount: p.amount,
          paid_at: p.paid_at,
          created_at: p.created_at,
          payment_gateway: p.payment_gateway
        }))
      }
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Debug failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}