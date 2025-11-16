// app/api/admin/promos/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Promo from '../../../../models/Promo';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth-config';

// app/api/admin/promos/[id]/route.ts - UPDATE THE GET METHOD
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

    const promo = await Promo.findById(id);

    if (!promo) {
      return NextResponse.json({ error: 'Promo tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      promo: {
        _id: promo._id,
        name: promo.name,
        description: promo.description,
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
        start_date: promo.start_date,
        end_date: promo.end_date,
        is_active: promo.is_active,
        is_global: promo.is_global || false,
        applicable_treatments: promo.applicable_treatments || [],
        created_at: promo.created_at
      }
    });

  } catch (error) {
    console.error('Get promo error:', error);
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

    const updateData = await req.json();
    
    // Handle date conversion
    if (updateData.start_date) {
      updateData.start_date = new Date(updateData.start_date);
    }
    if (updateData.end_date) {
      updateData.end_date = new Date(updateData.end_date);
    }

    const promo = await Promo.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!promo) {
      return NextResponse.json({ error: 'Promo tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      promo: {
        _id: promo._id,
        name: promo.name,
        description: promo.description,
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
        start_date: promo.start_date,
        end_date: promo.end_date,
        is_active: promo.is_active,
        is_global: promo.is_global || false,
        applicable_treatments: promo.applicable_treatments || [],
        created_at: promo.created_at
      }
    });

  } catch (error) {
    console.error('Update promo error:', error);
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

    const { is_active } = await req.json();

    const promo = await Promo.findByIdAndUpdate(
      id,
      { is_active },
      { new: true }
    );

    if (!promo) {
      return NextResponse.json({ error: 'Promo tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      promo
    });

  } catch (error) {
    console.error('Toggle promo error:', error);
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

    const promo = await Promo.findByIdAndDelete(id);

    if (!promo) {
      return NextResponse.json({ error: 'Promo tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Promo berhasil dihapus'
    });

  } catch (error) {
    console.error('Delete promo error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}