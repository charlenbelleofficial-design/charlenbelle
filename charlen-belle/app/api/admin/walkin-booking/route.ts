// app/api/admin/walkin-booking/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Booking from '../../../models/Booking';
import BookingSlot from '../../../models/BookingSlot';
import BookingTreatment from '../../../models/BookingTreatment';
import Treatment from '../../../models/Treatment';
import User from '../../../models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth-config';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin access
    if (!session.user.role || !['admin', 'superadmin', 'kasir'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const {
      customer_name,
      customer_email,
      customer_phone,
      slot_id,
      type,
      notes,
      treatments,
      user_id // New field for existing user
    } = await req.json();

    // Validate required fields
    if (!customer_name || !slot_id) {
      return NextResponse.json({ error: 'Nama pelanggan dan slot waktu wajib diisi' }, { status: 400 });
    }

    // Check slot availability
    const slot = await BookingSlot.findById(slot_id);
    if (!slot || !slot.is_available) {
      return NextResponse.json({ error: 'Slot tidak tersedia' }, { status: 400 });
    }

    // For treatment bookings, validate treatments
    if (type !== 'consultation' && (!Array.isArray(treatments) || treatments.length === 0)) {
      return NextResponse.json({ error: 'Treatment wajib diisi untuk booking treatment' }, { status: 400 });
    }

    // Handle user - either use existing user or create new one
    let user;
    if (user_id) {
      // Use existing user
      user = await User.findById(user_id);
      if (!user) {
        return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
      }
    } else {
      // Create new user for walk-in customer
      if (customer_email) {
        user = await User.findOne({ email: customer_email });
      }

      if (!user) {
        user = await User.create({
          name: customer_name,
          email: customer_email || `${customer_name.toLowerCase().replace(/\s+/g, '.')}@walkin.com`,
          phone_number: customer_phone,
          role: 'customer',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }

    // Create booking (auto-confirmed for walk-in)
    const booking = await Booking.create({
      user_id: user._id,
      slot_id,
      type: type || 'treatment',
      notes,
      status: 'confirmed', // Auto-confirm walk-in bookings
      confirmed_by: new mongoose.Types.ObjectId(session.user.id),
      created_at: new Date(),
      updated_at: new Date()
    });

    let totalAmount = 0;
    const createdItems = [];

    // Handle consultation booking
    if (type === 'consultation') {
      const consultationFee = 150000;
      totalAmount = consultationFee;
    } else {
      // Handle regular treatment booking
      for (const t of treatments) {
        const treatment = await Treatment.findById(t.treatment_id);
        if (!treatment) {
          // Rollback: delete created booking and return error
          await Booking.findByIdAndDelete(booking._id);
          return NextResponse.json({ error: `Treatment ${t.treatment_id} tidak ditemukan` }, { status: 400 });
        }

        const quantity = t.quantity && Number(t.quantity) > 0 ? Number(t.quantity) : 1;
        const linePrice = treatment.base_price * quantity;
        totalAmount += linePrice;

        const bookingTreatment = await BookingTreatment.create({
          booking_id: booking._id,
          treatment_id: treatment._id,
          quantity,
          price: treatment.base_price
        });

        createdItems.push(bookingTreatment);
      }
    }

    // Update booking with total_amount
    await Booking.findByIdAndUpdate(booking._id, { 
      total_amount: totalAmount,
      updated_at: new Date()
    });

    // Mark slot as unavailable
    await BookingSlot.findByIdAndUpdate(slot_id, { 
      is_available: false,
      booking_id: booking._id
    });

    // Populate booking details for response
    const bookingPop = await Booking.findById(booking._id)
      .populate('user_id', 'name email phone_number')
      .populate('slot_id')
      .populate('confirmed_by', 'name');

    return NextResponse.json({
      success: true,
      message: 'Booking walk-in berhasil dibuat',
      booking: bookingPop,
      items: createdItems,
      total_amount: totalAmount
    }, { status: 201 });

  } catch (error) {
    console.error('Create walk-in booking error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}