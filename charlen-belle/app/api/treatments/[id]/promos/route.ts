// app/api/treatments/[id]/promos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Promo from '../../../../models/Promo';
import Treatment from '../../../../models/Treatment';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    // Get the treatment first
    const treatment = await Treatment.findById(id);
    if (!treatment) {
      return NextResponse.json({ error: 'Treatment not found' }, { status: 404 });
    }

    const now = new Date();
    
    // Find active promos that apply to this treatment
    const promos = await Promo.find({
      is_active: true,
      $or: [
        { is_global: true }, // Global promos
        { applicable_treatments: id } // Promos specifically for this treatment
      ],
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
    }).sort({ discount_value: -1 }); // Sort by highest discount first

    return NextResponse.json({
      success: true,
      promos
    });

  } catch (error) {
    console.error('Get treatment promos error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}