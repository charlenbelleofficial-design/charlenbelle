// app/api/treatments-with-promos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../lib/mongodb';
import Treatment from '../../models/Treatment';
import Promo from '../../models/Promo';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    
    let filter: any = { is_active: true };
    
    if (category && category !== 'all' && category !== 'undefined' && category !== 'null') {
      if (mongoose.Types.ObjectId.isValid(category)) {
        filter.category_id = category;
      } else {
        return NextResponse.json(
          { success: false, error: 'ID kategori tidak valid' },
          { status: 400 }
        );
      }
    }

    const treatments = await Treatment.find(filter)
      .populate('category_id', 'name')
      .sort({ base_price: 1 });

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

    // Apply promos to treatments
    const treatmentsWithPromos = treatments.map(treatment => {
      const treatmentObj = treatment.toObject();
      
      // Find applicable promos for this treatment
      const applicablePromos = activePromos.filter(promo => 
        promo.is_global || 
        promo.applicable_treatments.some((id: mongoose.Types.ObjectId) => id.toString() === treatment._id.toString())
      );

      if (applicablePromos.length === 0) {
        return treatmentObj;
      }

      // Find the best promo (lowest final price)
      let bestPrice = treatment.base_price;
      let bestPromo = null;

      applicablePromos.forEach(promo => {
        let discountedPrice;
        if (promo.discount_type === 'percentage') {
          discountedPrice = Math.round(treatment.base_price * (1 - promo.discount_value / 100));
        } else {
          discountedPrice = Math.max(0, treatment.base_price - promo.discount_value);
        }

        if (discountedPrice < bestPrice) {
          bestPrice = discountedPrice;
          bestPromo = {
            _id: promo._id,
            name: promo.name,
            discount_type: promo.discount_type,
            discount_value: promo.discount_value,
            is_global: promo.is_global
          };
        }
      });

      return {
        ...treatmentObj,
        promo: bestPromo,
        final_price: bestPrice
      };
    });

    return NextResponse.json({
      success: true,
      treatments: treatmentsWithPromos
    });

  } catch (error) {
    console.error('Error fetching treatments with promos:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat data treatment' },
      { status: 500 }
    );
  }
}