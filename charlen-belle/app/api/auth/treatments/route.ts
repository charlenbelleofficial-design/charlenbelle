import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Treatment from '../../../models/Treatment';
import getServerSession from 'next-auth';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const isActive = searchParams.get('active') !== 'false';

    let query: any = { is_active: isActive };
    
    if (category) {
      query.category = category;
    }

    const treatments = await Treatment.find(query).sort({ name: 1 });

    return NextResponse.json({ treatments }, { status: 200 });

  } catch (error) {
    console.error('Get treatments error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || !['admin', 'superadmin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Tidak memiliki akses' },
        { status: 403 }
      );
    }

    await connectDB();

    const data = await req.json();
    
    const treatment = await Treatment.create(data);

    return NextResponse.json({
      message: 'Treatment berhasil ditambahkan',
      treatment
    }, { status: 201 });

  } catch (error) {
    console.error('Create treatment error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}