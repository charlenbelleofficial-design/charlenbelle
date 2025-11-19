// app/api/treatments-with-promos/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Treatment from '../../../models/Treatment';
import Promo from '../../../models/Promo';
import mongoose from 'mongoose';


export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    console.log('=== API DEBUG START ===');
    console.log('Received ID:', id);
    console.log('ID Type:', typeof id);
    console.log('Is valid ObjectId:', mongoose.Types.ObjectId.isValid(id));
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('ERROR: Invalid ObjectId');
      return NextResponse.json(
        { success: false, error: 'ID treatment tidak valid' },
        { status: 400 }
      );
    }

    // Get treatment with populated category
    const treatment = await Treatment.findById(id)
      .populate('category_id', 'name');

    console.log('Treatment found:', treatment);
    
    if (!treatment) {
      return NextResponse.json(
        { success: false, error: 'Treatment tidak ditemukan' },
        { status: 404 }
      );
    }

    // Get all active promos
    const now = new Date();
    const activePromos = await Promo.find({
      is_active: true,
      $or: [
        { start_date: { $lte: now }, end_date: { $gte: now } },
        { start_date: { $lte: now }, end_date: null },
        { start_date: null, end_date: { $gte: now } },
        { start_date: null, end_date: null }
      ]
    });

    console.log('Active promos found:', activePromos.length);

    // Find applicable promos for this treatment
    const applicablePromos = activePromos.filter(promo => 
      promo.is_global || 
      promo.applicable_treatments.some((treatmentId: mongoose.Types.ObjectId) => 
        treatmentId.toString() === treatment._id.toString()
      )
    );

    console.log('Applicable promos:', applicablePromos.length);

    let finalPrice = treatment.base_price;
    let appliedPromo = null;

    // Find the best promo (lowest final price)
    if (applicablePromos.length > 0) {
      let bestPrice = treatment.base_price;
      let bestPromo = null;

      applicablePromos.forEach(promo => {
        let discountedPrice;
        if (promo.discount_type === 'percentage') {
          discountedPrice = Math.round(treatment.base_price * (1 - promo.discount_value / 100));
        } else {
          discountedPrice = Math.max(0, treatment.base_price - promo.discount_value);
        }

        console.log(`Promo ${promo.name}: ${treatment.base_price} -> ${discountedPrice}`);

        if (discountedPrice < bestPrice) {
          bestPrice = discountedPrice;
          bestPromo = promo;
        }
      });

      if (bestPromo && bestPrice < treatment.base_price) {
          finalPrice = bestPrice;
          appliedPromo = {
            _id: (bestPromo as any)._id,
            name: (bestPromo as any).name,
            discount_type: (bestPromo as any).discount_type,
            discount_value: (bestPromo as any).discount_value
          };
          console.log('Applied promo:', appliedPromo);
        }
    }

    const treatmentWithPromo = {
      _id: treatment._id,
      name: treatment.name,
      description: treatment.description,
      base_price: treatment.base_price,
      duration_minutes: treatment.duration_minutes,
      category_id: treatment.category_id,
      requires_confirmation: treatment.requires_confirmation,
      is_active: treatment.is_active,
      images: treatment.images || [],
      final_price: finalPrice,
      applied_promo: appliedPromo
    };

    console.log('Final treatment data:', treatmentWithPromo);
    console.log('=== API DEBUG END ===');

    return NextResponse.json({
      success: true,
      treatment: treatmentWithPromo
    });

  } catch (error) {
    console.error('Error fetching treatment with promos:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Gagal memuat data treatment' 
      },
      { status: 500 }
    );
  }
}