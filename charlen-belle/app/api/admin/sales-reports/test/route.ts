import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Payment from '../../../../models/Payment';

export async function GET() {
  await connectDB();
  
  // Test: Get first 5 payments
  const testPayments = await Payment.find().limit(5);
  
  // Test: Check if payments have paid_at and payment_method
  const paymentsWithFields = testPayments.map(p => ({
    id: p._id,
    status: p.status,
    paid_at: p.paid_at,
    payment_method: p.payment_method,
    amount: p.amount
  }));
  
  return NextResponse.json({ testPayments: paymentsWithFields });
}