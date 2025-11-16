// app/api/treatments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Treatment from '../../../models/Treatment';
import TreatmentCategory from '../../../models/TreatmentCategory';
import { getServerSession } from 'next-auth/next';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category'); // category id
    const isActiveParam = searchParams.get('active');
    const isActive = isActiveParam === null ? true : isActiveParam !== 'false';

    const query: any = { is_active: isActive };
    if (category) query.category_id = category;

    const treatments = await Treatment.find(query).sort({ name: 1 }).populate('category_id', 'name');
    return NextResponse.json({ treatments }, { status: 200 });
  } catch (error) {
    console.error('Get treatments error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
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
    // validate category exists (if provided)
    if (body.category_id) {
      const cat = await TreatmentCategory.findById(body.category_id);
      if (!cat) return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 400 });
    }

    const t = await Treatment.create(body);
    return NextResponse.json({ message: 'Treatment dibuat', treatment: t }, { status: 201 });
  } catch (error) {
    console.error('Create treatment error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
