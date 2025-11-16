// app/api/treatment-categories/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import TreatmentCategory from '../../../../models/TreatmentCategory';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth-config';

export async function PUT(
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

    const updateData = await req.json();
    updateData.updated_at = new Date();

    const category = await TreatmentCategory.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!category) {
      return NextResponse.json({ error: 'Category tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      category
    });

  } catch (error) {
    console.error('Update category error:', error);
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

    const category = await TreatmentCategory.findByIdAndDelete(id);

    if (!category) {
      return NextResponse.json({ error: 'Category tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Category berhasil dihapus'
    });

  } catch (error) {
    console.error('Delete category error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}