import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '../../../lib/mongodb';
import WalkinTransaction from '../../../models/WalkinTransaction';
import WalkinTransactionItem from '../../../models/WalkinTransactionItem';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(); 
    
    const allowedRoles = ['kasir', 'admin', 'superadmin'];
    if (!session || !session.user?.role || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Tidak memiliki akses' },
        { status: 403 }
      );
    }

    await connectDB();

    const { customer_name, payment_method, items, amount } = await req.json();

    // Validate input
    if (!customer_name || !payment_method || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    // Create transaction
    const transaction = await WalkinTransaction.create({
      kasir_id: session.user.id,
      customer_name,
      payment_method,
      amount,
      status: payment_method.startsWith('manual_') ? 'paid' : 'pending',
      paid_at: payment_method.startsWith('manual_') ? new Date() : null
    });

    // Create transaction items
    const transactionItems = await Promise.all(
      items.map((item: any) =>
        WalkinTransactionItem.create({
          transaction_id: transaction._id,
          treatment_id: item.treatment_id,
          quantity: item.quantity,
          price: item.price
        })
      )
    );

    return NextResponse.json({
      message: 'Transaksi berhasil',
      transaction: {
        ...transaction.toObject(),
        items: transactionItems
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Walk-in transaction error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}