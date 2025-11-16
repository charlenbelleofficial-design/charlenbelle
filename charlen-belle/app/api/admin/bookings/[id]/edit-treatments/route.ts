// app/api/admin/bookings/[id]/edit-treatments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb';
import Booking from '../../../../../models/Booking';
import BookingTreatment from '../../../../../models/BookingTreatment';
import Treatment from '../../../../../models/Treatment';
import TreatmentPromo from '../../../../../models/TreatmentPromo';
import Promo from '../../../../../models/Promo';
import BookingEditLog from '../../../../../models/BookingEditLog';
import Payment from '../../../../../models/Payment';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../lib/auth-config';
import mongoose from 'mongoose';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin/doctor access
    if (!session.user.role || !['admin', 'superadmin', 'doctor', 'kasir'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    // Validate booking ID
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return NextResponse.json({ error: 'Invalid booking ID' }, { status: 400 });
    }

    const { action, treatment_id, quantity, unit_price } = await req.json();

    // Find booking and check if it's editable
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if booking is paid (not editable if paid)
    const payment = await Payment.findOne({ booking_id: bookingId, status: 'paid' });
    if (payment) {
      return NextResponse.json({ error: 'Cannot edit paid booking' }, { status: 400 });
    }

    let totalAmount = booking.total_amount || 0;
    const editLogs = [];

    if (action === 'add_treatment') {
      // Add new treatment
      const treatment = await Treatment.findById(treatment_id);
      if (!treatment) {
        return NextResponse.json({ error: 'Treatment not found' }, { status: 404 });
      }

      // Calculate final price with promo if unit_price not provided
      let finalUnitPrice = unit_price;
      if (!finalUnitPrice) {
        finalUnitPrice = treatment.base_price;
        
        // Find promos mapped to this treatment
        const mappings = await TreatmentPromo.find({ treatment_id: treatment._id }).lean();
        if (mappings && mappings.length > 0) {
          // Evaluate each promo and pick the one that gives lowest final price
          let bestPrice = treatment.base_price;
          for (const m of mappings) {
            const promo = await Promo.findById(m.promo_id);
            if (!promo) continue;
            // Check active date range
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
          finalUnitPrice = bestPrice;
        }
      }

      const treatmentQuantity = quantity || 1;
      const linePrice = finalUnitPrice * treatmentQuantity;

      // Create booking treatment
      const bookingTreatment = await BookingTreatment.create({
        booking_id: bookingId,
        treatment_id: treatment._id,
        quantity: treatmentQuantity,
        price: finalUnitPrice // Use the promo price
      });

      totalAmount += linePrice;

      // Log the action
      const editLog = await BookingEditLog.create({
        booking_id: bookingId,
        edited_by: new mongoose.Types.ObjectId(session.user.id),
        action: 'added_treatment',
        details: {
          treatment_id: treatment._id,
          treatment_name: treatment.name,
          quantity: treatmentQuantity,
          price: finalUnitPrice, // Log the actual price used
          previous_total: booking.total_amount,
          new_total: totalAmount,
          used_promo_price: finalUnitPrice !== treatment.base_price
        }
      });
      editLogs.push(editLog);

    } else if (action === 'remove_treatment') {
      // Remove treatment
      const bookingTreatment = await BookingTreatment.findOne({
        booking_id: bookingId,
        treatment_id
      });

      if (!bookingTreatment) {
        return NextResponse.json({ error: 'Treatment not found in booking' }, { status: 404 });
      }

      const linePrice = bookingTreatment.price * bookingTreatment.quantity;
      totalAmount = Math.max(0, totalAmount - linePrice);

      // Log before deleting
      const treatment = await Treatment.findById(treatment_id);
      const editLog = await BookingEditLog.create({
        booking_id: bookingId,
        edited_by: new mongoose.Types.ObjectId(session.user.id),
        action: 'removed_treatment',
        details: {
          treatment_id: treatment_id,
          treatment_name: treatment?.name,
          quantity: bookingTreatment.quantity,
          price: bookingTreatment.price,
          previous_total: booking.total_amount,
          new_total: totalAmount
        }
      });
      editLogs.push(editLog);

      // Remove the treatment
      await BookingTreatment.findByIdAndDelete(bookingTreatment._id);

    } else if (action === 'update_quantity') {
      // Update treatment quantity
      const bookingTreatment = await BookingTreatment.findOne({
        booking_id: bookingId,
        treatment_id
      });

      if (!bookingTreatment) {
        return NextResponse.json({ error: 'Treatment not found in booking' }, { status: 404 });
      }

      const oldLinePrice = bookingTreatment.price * bookingTreatment.quantity;
      const newLinePrice = bookingTreatment.price * quantity;

      totalAmount = totalAmount - oldLinePrice + newLinePrice;

      // Log the update
      const treatment = await Treatment.findById(treatment_id);
      const editLog = await BookingEditLog.create({
        booking_id: bookingId,
        edited_by: new mongoose.Types.ObjectId(session.user.id),
        action: 'updated_treatment',
        details: {
          treatment_id: treatment_id,
          treatment_name: treatment?.name,
          quantity: quantity,
          price: bookingTreatment.price,
          previous_total: booking.total_amount,
          new_total: totalAmount
        }
      });
      editLogs.push(editLog);

      // Update quantity
      bookingTreatment.quantity = quantity;
      await bookingTreatment.save();
    }

    // Update booking total amount
    booking.total_amount = totalAmount;
    booking.updated_at = new Date();
    await booking.save();

    // Get updated booking with treatments
    const updatedBooking = await Booking.findById(bookingId)
      .populate('user_id', 'name email phone_number')
      .populate('slot_id')
      .populate('confirmed_by', 'name');

    const updatedTreatments = await BookingTreatment.find({ booking_id: bookingId })
      .populate('treatment_id', 'name');

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      treatments: updatedTreatments,
      edit_logs: editLogs,
      message: 'Booking updated successfully'
    });

  } catch (error) {
    console.error('Edit booking treatments error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}