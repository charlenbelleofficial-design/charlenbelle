import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import BookingSlot from '../../../../models/BookingSlot';
import Holiday from '../../../../models/Holiday';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth-config';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || !['admin', 'superadmin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const { startDate, endDate, daysOfWeek, startTime, endTime, timeInterval, excludeHolidays } = await req.json();

    // Validate input
    if (!startDate || !endDate || !daysOfWeek || !startTime || !endTime || !timeInterval) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const createdSlots = [];

    // Get holidays if needed
    let holidays = [];
    if (excludeHolidays) {
      holidays = await Holiday.find({
        date: { $gte: start, $lte: end }
      });
    }

    // Generate time slots for each day
    const generateTimeSlots = (date: Date) => {
      const slots = [];
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      let currentTime = new Date(date);
      currentTime.setHours(startHour, startMinute, 0, 0);
      
      const endTimeObj = new Date(date);
      endTimeObj.setHours(endHour, endMinute, 0, 0);
      
      while (currentTime < endTimeObj) {
        const startStr = currentTime.toTimeString().slice(0, 5);
        currentTime.setMinutes(currentTime.getMinutes() + timeInterval);
        const endStr = currentTime.toTimeString().slice(0, 5);
        
        slots.push({ start_time: startStr, end_time: endStr });
      }
      
      return slots;
    };

    // Iterate through each day in the range
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      
      // Check if this day should have slots
      if (daysOfWeek.includes(dayOfWeek)) {
        // Check if it's a holiday
        const isHoliday = holidays.some(holiday => 
          new Date(holiday.date).toDateString() === date.toDateString()
        );

        if (!isHoliday) {
          const timeSlots = generateTimeSlots(new Date(date));
          
          for (const timeSlot of timeSlots) {
            // Check if slot already exists
            const existingSlot = await BookingSlot.findOne({
              date: date,
              start_time: timeSlot.start_time,
              end_time: timeSlot.end_time
            });

            if (!existingSlot) {
              const slot = await BookingSlot.create({
                date: new Date(date),
                start_time: timeSlot.start_time,
                end_time: timeSlot.end_time,
                is_available: true,
                created_at: new Date(),
                updated_at: new Date()
              });
              createdSlots.push(slot);
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      createdSlots: createdSlots.length,
      message: `Berhasil membuat ${createdSlots.length} slot booking`
    }, { status: 201 });

  } catch (error) {
    console.error('Bulk create schedule error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}