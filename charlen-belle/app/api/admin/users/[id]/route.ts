// app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth-config';
import bcrypt from 'bcryptjs';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    await connectDB();

    const { name, email, phone_number, role, password } = await req.json();

    const updateData: any = {
      name,
      email,
      phone_number,
      role,
      updated_at: new Date()
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).select('-password');

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    await connectDB();

    const user = await User.findById(id);
    
    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    // Prevent deleting superadmin
    if (user.role === 'superadmin') {
      return NextResponse.json({ error: 'Tidak dapat menghapus superadmin' }, { status: 400 });
    }

    await User.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'User berhasil dihapus'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}