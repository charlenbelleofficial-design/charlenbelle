// app/api/admin/walkin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import WalkinTransaction from '../../../models/WalkinTransaction';
import WalkinTransactionItem from '../../../models/WalkinTransactionItem';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth-config';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Add type checking for the role
    if (!session?.user?.role || !['kasir', 'admin', 'superadmin'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const transactions = await WalkinTransaction.find({})
      .populate('kasir_id', 'name')
      .sort({ created_at: -1 });

    return NextResponse.json({
      success: true,
      transactions
    });

  } catch (error) {
    console.error('Walkin transactions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Add type checking for the role
    if (!session?.user?.role || !['kasir', 'admin', 'superadmin'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const { customer_name, payment_method, amount, items, notes } = await req.json();

    // Create transaction
    const transaction = await WalkinTransaction.create({
      kasir_id: session.user.id,
      customer_name,
      payment_method,
      amount,
      status: 'paid', // Auto mark as paid for walk-in
      paid_at: new Date(),
      created_at: new Date()
    });

    // Create transaction items
    if (items && items.length > 0) {
      const transactionItems = items.map((item: any) => ({
        transaction_id: transaction._id,
        treatment_id: item.treatment_id,
        quantity: item.quantity,
        price: item.price
      }));

      await WalkinTransactionItem.insertMany(transactionItems);
    }

    return NextResponse.json({
      success: true,
      transaction
    }, { status: 201 });

  } catch (error) {
    console.error('Create walkin transaction error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}