// app/api/user/customer-profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import User from '../../../models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth-config';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id).select('customer_profile');
    
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

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      session.user.id,
      updateData,
      { new: true }
    ).select('customer_profile');

    return NextResponse.json({
      success: true,
      customer_profile: user.customer_profile,
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