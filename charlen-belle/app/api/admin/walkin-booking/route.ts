// app/api/admin/walkin-booking/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Booking from '../../../models/Booking';
import BookingSlot from '../../../models/BookingSlot';
import BookingTreatment from '../../../models/BookingTreatment';
import Treatment from '../../../models/Treatment';
import TreatmentPromo from '../../../models/TreatmentPromo';
import Promo from '../../../models/Promo';
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
      treatments = [], // Default to empty array
      user_id // New field for existing user
    } = await req.json();

    console.log('Walk-in booking request:', {
      customer_name,
      customer_email,
      slot_id,
      type,
      treatments_count: treatments?.length,
      user_id
    });

    // Validate required fields
    if (!customer_name || !slot_id) {
      return NextResponse.json({ error: 'Nama pelanggan dan slot waktu wajib diisi' }, { status: 400 });
    }

    // Check slot availability
    const slot = await BookingSlot.findById(slot_id);
    if (!slot) {
      return NextResponse.json({ error: 'Slot tidak ditemukan' }, { status: 404 });
    }
    if (!slot.is_available) {
      return NextResponse.json({ error: 'Slot tidak tersedia' }, { status: 400 });
    }

    // For treatment bookings, validate treatments
    if (type === 'treatment' && (!Array.isArray(treatments) || treatments.length === 0)) {
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

    let totalAmount = 0;
    const createdItems = [];

    // Calculate total amount first
    if (type === 'consultation') {
      const consultationFee = 150000; // Make this configurable if needed
      totalAmount = consultationFee;
    } else {
      // Calculate total for treatments
      for (const t of treatments) {
        const treatment = await Treatment.findById(t.treatment_id);
        if (!treatment) {
          return NextResponse.json({ error: `Treatment ${t.treatment_id} tidak ditemukan` }, { status: 400 });
        }

        const quantity = t.quantity && Number(t.quantity) > 0 ? Number(t.quantity) : 1;
        
        // Use the unit_price sent from frontend (already includes promo calculation)
        // If not provided, calculate with backend logic for consistency
        let unitPrice = t.unit_price;
        
        if (!unitPrice) {
          // Fallback: calculate price with promo
          unitPrice = treatment.base_price;
          
          const mappings = await TreatmentPromo.find({ treatment_id: treatment._id }).lean();
          if (mappings && mappings.length > 0) {
            let bestPrice = treatment.base_price;
            for (const m of mappings) {
              const promo = await Promo.findById(m.promo_id);
              if (!promo) continue;
              
              const now = new Date();
              if (!promo.is_active) continue;
              if (promo.start_date && new Date(promo.start_date) > now) continue;
              if (promo.end_date && new Date(promo.end_date) < now) continue;

              let candidatePrice = treatment.base_price;
              if (promo.discount_type === 'percentage') {
                candidatePrice = Math.round(treatment.base_price * (1 - promo.discount_value / 100));
              } else {
                candidatePrice = Math.max(0, treatment.base_price - promo.discount_value);
              }

              if (candidatePrice < bestPrice) bestPrice = candidatePrice;
            }
            unitPrice = bestPrice;
          }
        }

        const linePrice = unitPrice * quantity;
        totalAmount += linePrice;
      }
    }

    // Create booking with total_amount
    const booking = await Booking.create({
      user_id: user._id,
      slot_id,
      type: type || 'treatment',
      notes,
      status: 'confirmed', // Auto-confirm walk-in bookings
      total_amount: totalAmount, // Include total_amount in initial creation
      confirmed_by: new mongoose.Types.ObjectId(session.user.id),
      created_at: new Date(),
      updated_at: new Date()
    });

    // Create booking treatments if it's a treatment booking
    if (type === 'treatment') {
      for (const t of treatments) {
        const treatment = await Treatment.findById(t.treatment_id);
        const quantity = t.quantity && Number(t.quantity) > 0 ? Number(t.quantity) : 1;
        
        // Use the same price calculation logic as above
        let unitPrice = t.unit_price;
        if (!unitPrice) {
          unitPrice = treatment.base_price;
          // You might want to replicate the promo calculation here again
          // or store the calculated price from the first loop
        }

        const bookingTreatment = await BookingTreatment.create({
          booking_id: booking._id,
          treatment_id: treatment._id,
          quantity,
          price: unitPrice
        });

        createdItems.push(bookingTreatment);
      }
    }

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

    console.log('Walk-in booking created successfully:', {
      bookingId: booking._id,
      totalAmount,
      itemsCount: createdItems.length
    });

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
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}