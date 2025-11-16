import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import BookingSlot from '../../../../models/BookingSlot';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth-config';
import mongoose from 'mongoose';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || !['admin', 'superadmin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid slot ID' }, { status: 400 });
    }

    const updateData = await req.json();

    const slot = await BookingSlot.findByIdAndUpdate(
      id,
      { ...updateData, updated_at: new Date() },
      { new: true }
    );

    if (!slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      slot
    });

  } catch (error) {
    console.error('Update slot error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || !['admin', 'superadmin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid slot ID' }, { status: 400 });
    }

    const slot = await BookingSlot.findByIdAndDelete(id);

    if (!slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Slot berhasil dihapus'
    });

  } catch (error) {
    console.error('Delete slot error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}