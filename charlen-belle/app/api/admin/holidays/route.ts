import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Holiday from '../../../models/Holiday';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth-config';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user.role || !['admin', 'superadmin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const holidays = await Holiday.find().sort({ date: 1 });

    return NextResponse.json({
      success: true,
      holidays
    });

  } catch (error) {
    console.error('Get holidays error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || !['admin', 'superadmin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const holidayData = await req.json();
    
    if (!holidayData.date || !holidayData.name) {
      return NextResponse.json({ error: 'Date and name are required' }, { status: 400 });
    }

    // Check if holiday already exists for this date
    const existingHoliday = await Holiday.findOne({
      date: new Date(holidayData.date)
    });

    if (existingHoliday) {
      return NextResponse.json({ error: 'Holiday already exists for this date' }, { status: 400 });
    }

    const holiday = await Holiday.create({
      ...holidayData,
      date: new Date(holidayData.date),
      created_at: new Date(),
      updated_at: new Date()
    });

    return NextResponse.json({
      success: true,
      holiday
    }, { status: 201 });

  } catch (error) {
    console.error('Create holiday error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}