// app/api/treatment-categories/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import TreatmentCategory from '../../../models/TreatmentCategory';
import { getServerSession } from 'next-auth/next';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;

    const category = await TreatmentCategory.findById(id);
    if (!category) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ category }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.role || !['admin', 'superadmin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Tidak memiliki akses' }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();

    const { id } = await context.params;

    const category = await TreatmentCategory.findByIdAndUpdate(id, body, { new: true });
    if (!category) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ message: 'Updated', category }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.role || !['admin', 'superadmin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Tidak memiliki akses' }, { status: 403 });
    }

    await connectDB();
    const { id } = await context.params;

    await TreatmentCategory.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Deleted' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
