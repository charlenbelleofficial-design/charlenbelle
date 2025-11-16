// app/api/admin/treatments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Treatment from '../../../../models/Treatment';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth-config';
import mongoose from 'mongoose';

export async function GET(
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
      return NextResponse.json({ error: 'Invalid treatment ID' }, { status: 400 });
    }

    const treatment = await Treatment.findById(id).populate('category_id', 'name');

    if (!treatment) {
      return NextResponse.json({ error: 'Treatment not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      treatment
    });

  } catch (error) {
    console.error('Get treatment error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid treatment ID' }, { status: 400 });
    }

    const updateData = await req.json();
    updateData.updated_at = new Date();

    const treatment = await Treatment.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category_id', 'name');

    if (!treatment) {
      return NextResponse.json({ error: 'Treatment not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      treatment
    });

  } catch (error) {
    console.error('Update treatment error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

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
      return NextResponse.json({ error: 'Invalid treatment ID' }, { status: 400 });
    }

    const updateData = await req.json();
    updateData.updated_at = new Date();

    const treatment = await Treatment.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category_id', 'name');

    if (!treatment) {
      return NextResponse.json({ error: 'Treatment not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      treatment
    });

  } catch (error) {
    console.error('Patch treatment error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Optional: Add DELETE method if needed
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

    // Ensure all models are registered
    if (!mongoose.models.TreatmentCategory) {
      await import('../../../../models/TreatmentCategory');
    }
    if (!mongoose.models.Treatment) {
      await import('../../../../models/Treatment');
    }

    const treatment = await Treatment.findByIdAndDelete(id);

    if (!treatment) {
      return NextResponse.json({ error: 'Treatment tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Treatment berhasil dihapus'
    });

  } catch (error) {
    console.error('Delete treatment error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}