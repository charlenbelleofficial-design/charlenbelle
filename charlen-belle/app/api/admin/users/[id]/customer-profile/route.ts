// app/api/admin/users/[id]/customer-profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb';
import User from '../../../../../models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../lib/auth-config';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin/doctor access
    if (!session.user.role || !['admin', 'superadmin', 'doctor'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: userId } = await params;
    await connectDB();

    const { allergies, skin_type, medical_conditions, medications, notes } = await req.json();

    const updateData = {
      customer_profile: {
        allergies: allergies || [],
        skin_type: skin_type || '',
        medical_conditions: medical_conditions || [],
        medications: medications || [],
        notes: notes || '',
        completed_at: new Date()
      },
      updated_at: new Date()
    };

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('name email customer_profile');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user,
      message: 'Customer profile updated successfully'
    });

  } catch (error) {
    console.error('Update customer profile error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin/doctor access
    if (!session.user.role || !['admin', 'superadmin', 'doctor'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: userId } = await params;
    await connectDB();

    const user = await User.findById(userId).select('customer_profile name email');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      customer_profile: user.customer_profile || {}
    });

  } catch (error) {
    console.error('Get customer profile error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}