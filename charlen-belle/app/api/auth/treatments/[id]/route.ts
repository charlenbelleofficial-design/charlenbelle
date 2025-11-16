// app/api/treatments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Treatment from '../../../../models/Treatment';
import { getServerSession } from 'next-auth/next';

export async function GET(req: NextRequest, { params }: { params: { id: string }}) {
  try {
    await connectDB();
    const t = await Treatment.findById(params.id).populate('category_id', 'name');
    if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ treatment: t }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string }}) {
  try {
    const session = await getServerSession();
    // Add proper type checking for session and user role
    if (!session?.user?.role || !['admin', 'superadmin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Tidak memiliki akses' }, { status: 403 });
    }
    await connectDB();
    const body = await req.json();
    const t = await Treatment.findByIdAndUpdate(params.id, body, { new: true });
    if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ message: 'Updated', treatment: t }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string }}) {
  try {
    const session = await getServerSession();
    // Add proper type checking for session and user role
    if (!session?.user?.role || !['admin', 'superadmin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Tidak memiliki akses' }, { status: 403 });
    }
    await connectDB();
    await Treatment.findByIdAndDelete(params.id);
    return NextResponse.json({ message: 'Deleted' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
