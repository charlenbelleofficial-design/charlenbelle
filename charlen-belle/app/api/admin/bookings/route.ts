import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Booking from '../../../models/Booking';
import BookingSlot from '../../../models/BookingSlot';
import Treatment from '../../../models/Treatment';
import TreatmentPromo from '../../../models/TreatmentPromo';
import BookingTreatment from '../../../models/BookingTreatment';
import Promo from '../../../models/Promo';
import Payment from '../../../models/Payment';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth-config';
import mongoose from 'mongoose';

// Only handle GET requests for multiple bookings
// Add this to your existing GET function in app/api/admin/bookings/route.ts
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin access
    if (!session.user.role || !['admin', 'superadmin', 'kasir', 'doctor'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    // Ensure models are registered
    if (!mongoose.models.BookingSlot) {
      await import('../../../models/BookingSlot');
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query: any = {};

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Date filter
    if (date === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      query['slot_id.date'] = {
        $gte: today,
        $lt: tomorrow
      };
    } else if (date) {
      const filterDate = new Date(date);
      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      query['slot_id.date'] = {
        $gte: filterDate,
        $lt: nextDay
      };
    }

    // Search functionality
    let userQuery: any = {};
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      userQuery = {
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { phone_number: searchRegex }
        ]
      };
    }

    // First, find users that match the search criteria if search is provided
    let userIds = [];
    if (search && search.trim()) {
      const User = (await import('../../../models/User')).default;
      const matchingUsers = await User.find(userQuery).select('_id');
      userIds = matchingUsers.map(user => user._id);
      
      // If no users found and there's a search term, return empty results
      if (userIds.length === 0) {
        // Also check if search term might be a booking ID
        if (mongoose.Types.ObjectId.isValid(search)) {
          query._id = new mongoose.Types.ObjectId(search);
        } else {
          return NextResponse.json({
            success: true,
            bookings: []
          });
        }
      } else {
        query.user_id = { $in: userIds };
      }
    }

    const bookings = await Booking.find(query)
      .populate('user_id', 'name email phone_number')
      .populate({
        path: 'slot_id',
        model: 'BookingSlot'
      })
      .populate('consultation_notes.added_by', 'name')
      .populate('confirmed_by', 'name')
      .sort({ created_at: -1 })
      .limit(limit);

    // Get payments for each booking
    const bookingsWithPayments = await Promise.all(
      bookings.map(async (booking) => {
        const payment = await Payment.findOne({ 
          booking_id: booking._id 
        }).select('status payment_method');

        const treatments = await BookingTreatment.find({ booking_id: booking._id })
          .populate('treatment_id', 'name');

        return {
          _id: booking._id,
          user_id: booking.user_id,
          slot_id: booking.slot_id,
          type: booking.type,
          status: booking.status,
          confirmed_by: booking.confirmed_by,
          notes: booking.notes,
          total_amount: booking.total_amount,
          created_at: booking.created_at,
          updated_at: booking.updated_at,
          consultation_notes: booking.consultation_notes,
          payment: payment ? {
            status: payment.status,
            payment_method: payment.payment_method
          } : null,
          treatments: treatments.map(t => ({
            _id: t._id,
            treatment_id: t.treatment_id,
            quantity: t.quantity,
            price: t.price
          }))
        };
      })
    );

    return NextResponse.json({
      success: true,
      bookings: bookingsWithPayments
    });

  } catch (error) {
    console.error('Admin bookings error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Update the POST function in app/api/bookings/route.ts
export async function POST(req: NextRequest) {
  try {
    // Use authOptions to get the session properly
    const session = await getServerSession(authOptions);
    
    console.log('Session in booking API:', session); // Debug log
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Silakan login terlebih dahulu' }, { status: 401 });
    }

    // Check if user ID exists in session
    if (!session.user.id) {
      console.error('User ID missing from session:', session);
      return NextResponse.json({ error: 'Session tidak valid' }, { status: 401 });
    }

    await connectDB();

    const { slot_id, type, notes, treatments } = await req.json();
    
    console.log('Booking request data:', { slot_id, type, notes, treatments }); // Debug log

    if (!slot_id) {
      return NextResponse.json({ error: 'Slot wajib diisi' }, { status: 400 });
    }

    // For consultation, treatments array can be empty
    if (type !== 'consultation' && (!Array.isArray(treatments) || treatments.length === 0)) {
      return NextResponse.json({ error: 'Treatment wajib diisi untuk booking treatment' }, { status: 400 });
    }

    // Check slot availability
    const slot = await BookingSlot.findById(slot_id);
    if (!slot || !slot.is_available) {
      return NextResponse.json({ error: 'Slot tidak tersedia' }, { status: 400 });
    }

    // Create booking (status pending)
    const booking = await Booking.create({
      user_id: session.user.id,
      slot_id,
      type: type || 'treatment', // Default to treatment if not specified
      notes,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    });

    console.log('Booking created with user_id:', session.user.id);

    let totalAmount = 0;
    const createdItems = [];

    // Handle consultation booking
    if (type === 'consultation') {
      // Set consultation fee (you can make this configurable)
      const consultationFee = 150000;
      totalAmount = consultationFee;
      
      console.log('Consultation booking created with fee:', consultationFee);
      // No treatments to add for consultation
    } else {
      // Handle regular treatment booking (existing logic)
      for (const t of treatments) {
        const tr = await Treatment.findById(t.treatment_id);
        if (!tr) {
          // Rollback: delete created booking and return error
          await Booking.findByIdAndDelete(booking._id);
          return NextResponse.json({ error: `Treatment ${t.treatment_id} tidak ditemukan` }, { status: 400 });
        }

        const quantity = t.quantity && Number(t.quantity) > 0 ? Number(t.quantity) : 1;
        // Find promos mapped to this treatment
        const mappings = await TreatmentPromo.find({ treatment_id: tr._id }).lean();
        let finalUnitPrice = tr.base_price;

        if (mappings && mappings.length > 0) {
          // Evaluate each promo and pick the one that gives lowest final price
          let bestPrice = tr.base_price;
          for (const m of mappings) {
            const promo = await Promo.findById(m.promo_id);
            if (!promo) continue;
            // Check active date range
            const now = new Date();
            if (!promo.is_active) continue;
            if (promo.start_date && new Date(promo.start_date) > now) continue;
            if (promo.end_date && new Date(promo.end_date) < now) continue;

            let candidatePrice = tr.base_price;
            if (promo.discount_type === 'percentage') {
              candidatePrice = Math.round(tr.base_price * (1 - promo.discount_value / 100));
            } else {
              candidatePrice = Math.max(0, tr.base_price - promo.discount_value);
            }

            if (candidatePrice < bestPrice) bestPrice = candidatePrice;
          }
          finalUnitPrice = bestPrice;
        }

        const linePrice = finalUnitPrice * quantity;
        totalAmount += linePrice;

        const bt = await BookingTreatment.create({
          booking_id: booking._id,
          treatment_id: tr._id,
          quantity,
          price: finalUnitPrice
        });

        createdItems.push(bt);
      }
    }

    // Update booking with total_amount
    await Booking.findByIdAndUpdate(booking._id, { total_amount: totalAmount, updated_at: new Date() });

    // Mark slot as unavailable
    await BookingSlot.findByIdAndUpdate(slot_id, { is_available: false });

    const bookingPop = await Booking.findById(booking._id)
      .populate('user_id', 'name email')
      .populate('slot_id');

    return NextResponse.json({
      message: 'Booking berhasil dibuat',
      booking: bookingPop,
      items: createdItems,
      total_amount: totalAmount
    }, { status: 201 });

  } catch (error) {
    console.error('Create booking error:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ 
      error: 'Terjadi kesalahan server',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PATCH() {
  return NextResponse.json({ error: 'Method not allowed. Use /api/admin/bookings/[id] for updates' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}