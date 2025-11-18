// app/api/admin/users/staff/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth-config';

export async function GET(req: NextRequest) {
  try {
    console.log('Staff API called');
    
    const session = await getServerSession(authOptions);
    console.log('Session:', session);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!session.user?.role || !['admin', 'superadmin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    console.log('Database connected');

    const doctors = await User.find({ role: 'doctor' }).select('name email role');
    const therapists = await User.find({ role: 'therapist' }).select('name email role');

    console.log(`Found ${doctors.length} doctors, ${therapists.length} therapists`);

    return NextResponse.json({
      success: true,
      doctors,
      therapists
    });

  } catch (error) {
    console.error('Get staff error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}