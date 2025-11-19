import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Treatment from '../../../../models/Treatment';
import { getServerSession } from 'next-auth/next';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;

    const t = await Treatment.findById(id).populate('category_id', 'name');
    if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ treatment: t }, { status: 200 });
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

    const t = await Treatment.findByIdAndUpdate(id, body, { new: true });
    if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ message: 'Updated', treatment: t }, { status: 200 });
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

    await Treatment.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Deleted' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
