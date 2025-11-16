// app/api/treatment-categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import TreatmentCategory from '../../../models/TreatmentCategory';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth-config';

// GET - Fetch all categories (public access)
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const categories = await TreatmentCategory.find({ is_active: true }).sort({ name: 1 });

    return NextResponse.json({
      success: true,
      categories
    });

  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Create new category (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || !['admin', 'superadmin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const categoryData = await req.json();
    const category = await TreatmentCategory.create(categoryData);

    return NextResponse.json({
      success: true,
      category
    }, { status: 201 });

  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}