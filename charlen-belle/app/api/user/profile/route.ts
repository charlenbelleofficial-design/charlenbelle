// app/api/user/profile/route.ts
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

    const user = await User.findById(session.user.id).select('-password');
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone_number: user.phone_number,
        role: user.role,
        customer_profile: user.customer_profile,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('Get user profile error:', error);
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

    const { name, phone_number } = await req.json();

    const updateData = {
      name,
      phone_number,
      updated_at: new Date()
    };

    const user = await User.findByIdAndUpdate(
      session.user.id,
      updateData,
      { new: true }
    ).select('-password');

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone_number: user.phone_number,
        role: user.role,
        customer_profile: user.customer_profile,
        created_at: user.created_at
      },
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Update user profile error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}