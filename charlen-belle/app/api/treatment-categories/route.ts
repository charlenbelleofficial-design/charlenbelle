// app/api/treatment-categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../lib/mongodb';
import TreatmentCategory from '../../models/TreatmentCategory';
import { getServerSession } from 'next-auth/next';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const categories = await TreatmentCategory.find({ is_active: true }).sort({ name: 1 });
    
    // Ensure we return a proper array
    return NextResponse.json({ 
      categories: categories.map(cat => ({
        _id: cat._id.toString(),
        name: cat.name,
        description: cat.description
      }))
    }, { status: 200 });
    
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json({ 
      error: 'Server error',
      categories: [] // Ensure we always return an array
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    // Add proper type checking for session and user role
    if (!session?.user?.role || !['admin', 'superadmin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Tidak memiliki akses' }, { status: 403 });
    }
    
    await connectDB();
    const body = await req.json();
    
    const category = await TreatmentCategory.create({
      name: body.name,
      description: body.description,
      is_active: body.is_active !== undefined ? body.is_active : true
    });
    
    return NextResponse.json({ message: 'Kategori dibuat', category }, { status: 201 });
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}