// app/api/admin/treatment-categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import TreatmentCategory from '../../../models/TreatmentCategory';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth-config';

// GET - Fetch all categories (admin access - shows all including inactive)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || !['admin', 'superadmin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const categories = await TreatmentCategory.find().sort({ name: 1 });

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
    
    // Add default values
    const category = await TreatmentCategory.create({
      ...categoryData,
      is_active: categoryData.is_active !== undefined ? categoryData.is_active : true
    });

    return NextResponse.json({
      success: true,
      category
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create category error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json({ 
        error: 'Category name already exists'
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}