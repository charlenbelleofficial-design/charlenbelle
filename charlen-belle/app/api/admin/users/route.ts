// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import User from '../../../models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth-config';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only superadmin can access user management
    if (session.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const users = await User.find({})
      .select('-password')
      .sort({ created_at: -1 });

    return NextResponse.json({
      success: true,
      users
    });

  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const { name, email, phone_number, role, password } = await req.json();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      phone_number,
      role,
      password: hashedPassword,
      created_at: new Date(),
      updated_at: new Date()
    });

    const userWithoutPassword = await User.findById(user._id).select('-password');

    return NextResponse.json({
      success: true,
      user: userWithoutPassword
    }, { status: 201 });

  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}