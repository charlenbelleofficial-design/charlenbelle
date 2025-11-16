import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import BookingSlot from '../../../../models/BookingSlot';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth-config';

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
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of the month

    // Get all slots for the month
    const slots = await BookingSlot.find({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    });

    // Group slots by date
    const slotsByDate: { [key: string]: any[] } = {};
    slots.forEach(slot => {
      const dateStr = slot.date.toISOString().split('T')[0];
      if (!slotsByDate[dateStr]) {
        slotsByDate[dateStr] = [];
      }
      slotsByDate[dateStr].push(slot);
    });

    // Generate calendar days with slot information
    const days = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dateSlots = slotsByDate[dateStr] || [];
      const availableSlots = dateSlots.filter(slot => slot.is_available).length;
      const bookedSlots = dateSlots.filter(slot => !slot.is_available).length;
      
      days.push({
        date: dateStr,
        day: currentDate.getDate(),
        hasSlots: dateSlots.length > 0,
        slotCount: dateSlots.length,
        availableSlots,
        bookedSlots,
        isToday: dateStr === new Date().toISOString().split('T')[0],
        isSelected: false, // This will be set on the client side
        isPast: currentDate < new Date(new Date().setHours(0, 0, 0, 0))
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return NextResponse.json({
      success: true,
      days
    });

  } catch (error) {
    console.error('Get calendar data error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}