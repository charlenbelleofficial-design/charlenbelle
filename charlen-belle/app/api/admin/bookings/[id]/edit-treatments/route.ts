// app/api/admin/bookings/[id]/edit-treatments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb';
import Booking from '../../../../../models/Booking';
import BookingTreatment from '../../../../../models/BookingTreatment';
import Treatment from '../../../../../models/Treatment';
import Promo from '../../../../../models/Promo';
import TreatmentPromo from '../../../../../models/TreatmentPromo';
import BookingEditLog from '../../../../../models/BookingEditLog';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../lib/auth-config';
import mongoose from 'mongoose';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const bookingId = params.id;
    
    console.log('Edit treatments API called for booking:', bookingId);
    
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user.role || !['admin', 'superadmin', 'doctor'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const { action, treatment_id, quantity = 1, unit_price } = await req.json();

    console.log('Edit treatments data:', { action, treatment_id, quantity, unit_price });

    // Validate booking ID
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return NextResponse.json({ error: 'Invalid booking ID' }, { status: 400 });
    }

    // Find booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (action === 'add_treatment') {
      // Validate treatment_id
      if (!treatment_id) {
        return NextResponse.json({ error: 'Treatment ID is required' }, { status: 400 });
      }

      if (!mongoose.Types.ObjectId.isValid(treatment_id)) {
        return NextResponse.json({ error: 'Invalid treatment ID' }, { status: 400 });
      }

      const treatment = await Treatment.findById(treatment_id);
      if (!treatment) {
        return NextResponse.json({ error: 'Treatment not found' }, { status: 404 });
      }

      // Use the provided unit_price (which should include promo discount)
      // or calculate it if not provided
      let finalUnitPrice = unit_price;
      
      if (!finalUnitPrice) {
        // Calculate price with promos
        const mappings = await TreatmentPromo.find({ treatment_id: treatment._id }).lean();
        finalUnitPrice = treatment.base_price;

        if (mappings && mappings.length > 0) {
          let bestPrice = treatment.base_price;
          for (const m of mappings) {
            const promo = await Promo.findById(m.promo_id);
            if (!promo || !promo.is_active) continue;
            
            // Check active date range
            const now = new Date();
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
          finalUnitPrice = bestPrice;
        }
      }

      console.log('Adding treatment with price:', finalUnitPrice);

      // Check if treatment already exists in booking
      const existingTreatment = await BookingTreatment.findOne({
        booking_id: bookingId,
        treatment_id: treatment_id
      });

      // In the add_treatment section, update the BookingTreatment creation:
      if (existingTreatment) {
        // Update quantity if treatment already exists
        existingTreatment.quantity += quantity;
        existingTreatment.price = finalUnitPrice;
        existingTreatment.original_price = treatment.base_price; // Store original price
        
        // Store promo info if price is discounted
        if (finalUnitPrice < treatment.base_price && treatment.applied_promo) {
          existingTreatment.promo_applied = {
            promo_id: treatment.applied_promo._id,
            promo_name: treatment.applied_promo.name,
            discount_type: treatment.applied_promo.discount_type,
            discount_value: treatment.applied_promo.discount_value
          };
        }
        
        await existingTreatment.save();
      } else {
        // Add new treatment to booking
        const bookingTreatmentData: any = {
          booking_id: bookingId,
          treatment_id,
          quantity,
          price: finalUnitPrice,
          original_price: treatment.base_price // Store original price
        };

        // Store promo info if price is discounted
        if (finalUnitPrice < treatment.base_price && treatment.applied_promo) {
          bookingTreatmentData.promo_applied = {
            promo_id: treatment.applied_promo._id,
            promo_name: treatment.applied_promo.name,
            discount_type: treatment.applied_promo.discount_type,
            discount_value: treatment.applied_promo.discount_value
          };
        }

        await BookingTreatment.create(bookingTreatmentData);
      }

      // Log the action
      await BookingEditLog.create({
        booking_id: bookingId,
        edited_by: new mongoose.Types.ObjectId(session.user.id),
        action: 'added_treatment',
        details: {
          treatment_id: treatment_id,
          treatment_name: treatment.name,
          quantity: quantity,
          price: finalUnitPrice
        }
      });

    } else if (action === 'remove_treatment') {
      // Validate treatment_id
      if (!treatment_id) {
        return NextResponse.json({ error: 'Treatment ID is required' }, { status: 400 });
      }

      const treatment = await Treatment.findById(treatment_id);
      if (!treatment) {
        return NextResponse.json({ error: 'Treatment not found' }, { status: 404 });
      }

      // Remove treatment from booking
      const result = await BookingTreatment.findOneAndDelete({
        booking_id: bookingId,
        treatment_id
      });

      if (!result) {
        return NextResponse.json({ error: 'Treatment not found in booking' }, { status: 404 });
      }

      // Log the action
      await BookingEditLog.create({
        booking_id: bookingId,
        edited_by: new mongoose.Types.ObjectId(session.user.id),
        action: 'removed_treatment',
        details: {
          treatment_id: treatment_id,
          treatment_name: treatment.name
        }
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update booking total
    const bookingTreatments = await BookingTreatment.find({ booking_id: bookingId });
    const newTotal = bookingTreatments.reduce((total, bt) => total + (bt.price * bt.quantity), 0);
    
    await Booking.findByIdAndUpdate(bookingId, { 
      total_amount: newTotal,
      updated_at: new Date()
    });

    // Return updated booking with treatments
    const updatedBooking = await Booking.findById(bookingId)
      .populate('user_id', 'name email phone_number')
      .populate('slot_id');

    const updatedTreatments = await BookingTreatment.find({ booking_id: bookingId })
      .populate('treatment_id', 'name');

    return NextResponse.json({
      success: true,
      message: 'Treatment updated successfully',
      booking: {
        ...updatedBooking.toObject(),
        treatments: updatedTreatments
      }
    });

  } catch (error) {
    console.error('Edit treatments error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}