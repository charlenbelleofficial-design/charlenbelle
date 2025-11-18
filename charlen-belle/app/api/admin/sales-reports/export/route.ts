import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth-config';
import * as XLSX from 'xlsx';
import connectDB from '../../../../lib/mongodb';
import Payment from '../../../../models/Payment';
import BookingTreatment from '../../../../models/BookingTreatment';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || !['admin', 'superadmin', 'kasir'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'today';

    // Similar date filtering logic as main API
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
      // Add other cases...
    }

    // Get transactions for export
    const transactions = await Payment.find({
      status: 'paid',
      ...dateFilter
    })
      .populate('user_id', 'name email phone_number')
      .populate('booking_id')
      .sort({ paid_at: -1 });

    // Prepare data for Excel
    const worksheetData = transactions.map(transaction => ({
      'ID Transaksi': transaction._id.toString().slice(-8),
      'Tanggal': new Date(transaction.paid_at!).toLocaleDateString('id-ID'),
      'Pelanggan': transaction.user_id.name,
      'Email': transaction.user_id.email,
      'Telepon': transaction.user_id.phone_number || '-',
      'Metode Pembayaran': transaction.payment_method,
      'Jumlah': transaction.amount,
      'Status': 'Paid'
    }));

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Report');

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    // Return as downloadable file
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="sales-report-${period}-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });

  } catch (error) {
    console.error('Error exporting sales report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export sales report' },
      { status: 500 }
    );
  }
}