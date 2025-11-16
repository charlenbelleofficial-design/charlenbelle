// app/api/admin/treatments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Treatment from '../../../models/Treatment';
import TreatmentCategory from '../../../models/TreatmentCategory';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth-config';
import mongoose from 'mongoose';

// GET - Fetch all treatments
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || !['admin', 'superadmin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    // Ensure all models are registered
    if (!mongoose.models.TreatmentCategory) {
      await import('../../../models/TreatmentCategory');
    }
    if (!mongoose.models.Treatment) {
      await import('../../../models/Treatment');
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const isActive = searchParams.get('is_active');

    let query: any = {};

    // Filter by category if provided
    if (category && category !== 'all') {
      query.category_id = category;
    }

    // Filter by active status if provided
    if (isActive !== null) {
      query.is_active = isActive === 'true';
    }

    const treatments = await Treatment.find(query)
      .populate('category_id', 'name')
      .sort({ created_at: -1 });

    return NextResponse.json({
      success: true,
      treatments
    });

  } catch (error) {
    console.error('Get treatments error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.stack : undefined : undefined
    }, { status: 500 });
  }
}

// POST - Create new treatment
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || !['admin', 'superadmin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    // Ensure all models are registered
    if (!mongoose.models.TreatmentCategory) {
      await import('../../../models/TreatmentCategory');
    }
    if (!mongoose.models.Treatment) {
      await import('../../../models/Treatment');
    }

    const treatmentData = await req.json();
    
    // Add created_at and updated_at
    const now = new Date();
    treatmentData.created_at = now;
    treatmentData.updated_at = now;

    const treatment = await Treatment.create(treatmentData);
    
    // Populate category if it exists
    await treatment.populate('category_id', 'name');

    return NextResponse.json({
      success: true,
      treatment
    }, { status: 201 });

  } catch (error) {
    console.error('Create treatment error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Add other methods to explicitly reject them
export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed. Use /api/admin/treatments/[id] for updates' }, { status: 405 });
}

export async function PATCH() {
  return NextResponse.json({ error: 'Method not allowed. Use /api/admin/treatments/[id] for updates' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed. Use /api/admin/treatments/[id] for deletes' }, { status: 405 });
}