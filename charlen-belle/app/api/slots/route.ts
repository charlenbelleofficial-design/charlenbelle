import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../lib/mongodb';
import BookingSlot from '../../models/BookingSlot';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: 'Tanggal wajib diisi' },
        { status: 400 }
      );
    }

    const slots = await BookingSlot.find({
      date: new Date(date),
      is_available: true
    }).sort({ start_time: 1 });

    return NextResponse.json({ slots }, { status: 200 });

  } catch (error) {
    console.error('Get slots error:', error);
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

    const slot = await BookingSlot.create(data);

    return NextResponse.json({
      message: 'Slot berhasil dibuat',
      slot
    }, { status: 201 });

  } catch (error) {
    console.error('Create slot error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}