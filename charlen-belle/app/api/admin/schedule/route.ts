import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import BookingSlot from '../../../models/BookingSlot';
import Holiday from '../../../models/Holiday';
import Booking from '../../../models/Booking';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth-config';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user.role || !['admin', 'superadmin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'Date parameter required' }, { status: 400 });
    }

    const selectedDate = new Date(date);
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const slots = await BookingSlot.find({
      date: {
        $gte: selectedDate,
        $lt: nextDay
      }
    })
    .populate('doctor_id', 'name email') // Ensure doctor is populated
    .populate('therapist_id', 'name email') // Ensure therapist is populated
    .populate({
      path: 'booking_id',
      populate: {
        path: 'user_id',
        select: 'name email'
      }
    })
    .sort({ start_time: 1 });

    return NextResponse.json({
      success: true,
      slots
    });

  } catch (error) {
    console.error('Get schedule error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || !['admin', 'superadmin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await connectDB();

    const slotData = await req.json();
    
    // Validate required fields
    if (!slotData.date || !slotData.start_time || !slotData.end_time) {
      return NextResponse.json({ error: 'Date, start_time, and end_time are required' }, { status: 400 });
    }

    const slot = await BookingSlot.create({
      ...slotData,
      date: new Date(slotData.date),
      created_at: new Date(),
      updated_at: new Date()
    });

    return NextResponse.json({
      success: true,
      slot
    }, { status: 201 });

  } catch (error) {
    console.error('Create slot error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}