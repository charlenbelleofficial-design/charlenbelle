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
        console.error(`Invalid category ID received: ${category}`);
        return NextResponse.json(
          { 
            success: false, 
            error: 'ID kategori tidak valid' 
          },
          { status: 400 }
        );
      }
    }

    // Get all treatments
    const treatments = await Treatment.find(filter)
      .populate('category_id', 'name')
      .sort({ base_price: 1 });

    const now = new Date();
    
    // Get all active promos
    const activePromos = await Promo.find({
      is_active: true,
      $and: [
        { 
          $or: [
            { start_date: { $exists: false } },
            { start_date: null },
            { start_date: { $lte: now } }
          ]
        },
        {
          $or: [
            { end_date: { $exists: false } },
            { end_date: null },
            { end_date: { $gte: now } }
          ]
        }
      ]
    });

    // Map treatments with their applicable promos
    const treatmentsWithPromos = treatments.map(treatment => {
      // Find promos that apply to this treatment
      const applicablePromos = activePromos.filter(promo => 
        promo.is_global || 
        (promo.applicable_treatments && 
         promo.applicable_treatments.some((treatmentId: mongoose.Types.ObjectId) => 
           treatmentId.toString() === treatment._id.toString()
         ))
      );

      // Get the best promo (highest discount)
      const bestPromo = applicablePromos.length > 0 
        ? applicablePromos.reduce((best, current) => {
            const currentDiscount = current.discount_type === 'percentage' 
              ? treatment.base_price * (current.discount_value / 100)
              : current.discount_value;
            
            const bestDiscount = best.discount_type === 'percentage'
              ? treatment.base_price * (best.discount_value / 100)
              : best.discount_value;

            return currentDiscount > bestDiscount ? current : best;
          })
        : null;

      return {
        ...treatment.toObject(),
        promo: bestPromo ? {
          _id: bestPromo._id,
          name: bestPromo.name,
          discount_type: bestPromo.discount_type,
          discount_value: bestPromo.discount_value,
          is_global: bestPromo.is_global
        } : undefined
      };
    });

    return NextResponse.json({
      success: true,
      treatments: treatmentsWithPromos
    });

  } catch (error) {
    console.error('Error fetching treatments with promos:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Gagal memuat data treatment' 
      },
      { status: 500 }
    );
  }
}