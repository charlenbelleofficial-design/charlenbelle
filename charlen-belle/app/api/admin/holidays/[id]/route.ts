import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Holiday from '../../../../models/Holiday';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth-config';
import mongoose from 'mongoose';

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
      return NextResponse.json({ error: 'Invalid holiday ID' }, { status: 400 });
    }

    const holiday = await Holiday.findByIdAndDelete(id);

    if (!holiday) {
      return NextResponse.json({ error: 'Holiday not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Holiday berhasil dihapus'
    });

  } catch (error) {
    console.error('Delete holiday error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}