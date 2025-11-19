// app/api/debug/promos/route.ts (temporary)
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Promo from '../../../models/Promo';
import TreatmentPromo from '../../../models/TreatmentPromo';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const now = new Date();
    
    // Get all active promos
    const activePromos = await Promo.find({
      is_active: true,
      $or: [
        { start_date: { $lte: now }, end_date: { $gte: now } },
        { start_date: { $lte: now }, end_date: null },
        { start_date: null, end_date: { $gte: now } },
        { start_date: null, end_date: null }
      ]
    });

    // Get all treatment-promo mappings
    const treatmentMappings = await TreatmentPromo.find()
      .populate('treatment_id', 'name base_price')
      .populate('promo_id', 'name is_active discount_type discount_value');

    return NextResponse.json({
      success: true,
      active_promos: activePromos,
      treatment_mappings: treatmentMappings,
      now: now.toISOString()
    });

  } catch (error) {
    console.error('Debug promos error:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}