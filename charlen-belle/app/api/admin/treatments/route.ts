import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Treatment from '../../../models/Treatment';
import TreatmentPromo from '../../../models/TreatmentPromo';
import Promo from '../../../models/Promo';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth-config';
import mongoose from 'mongoose';


interface PromoDetails {
  _id: string;
  name: string;
  discount_type: string;
  discount_value: number;
}


export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || !['admin', 'superadmin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const includePromos = searchParams.get('include_promos') === 'true';

    console.log('🔄 API: Fetching ALL treatments for admin');
    await connectDB();

    // REMOVE the is_active filter to get ALL treatments for admin
    const treatments = await Treatment.find() // Remove { is_active: true } filter
      .populate('category_id', 'name') // Add category population
      .select('name description base_price duration_minutes requires_confirmation is_active images created_at category_id')
      .sort({ name: 1 });

    console.log(`📦 API: Found ${treatments.length} treatments (including inactive)`);

    let treatmentsWithPromos = treatments;

    // In the GET function, add more logging:
    if (includePromos) {
      // Get all active promos first
      const now = new Date();
      const allActivePromos = await Promo.find({
        is_active: true,
        $or: [
          { start_date: { $lte: now }, end_date: { $gte: now } },
          { start_date: { $lte: now }, end_date: null },
          { start_date: null, end_date: { $gte: now } },
          { start_date: null, end_date: null }
        ]
      });

      console.log(`🎯 API: Found ${allActivePromos.length} active promos total`);

      // Get active promos for each treatment
      treatmentsWithPromos = treatments.map((treatment) => {
        console.log(`🔍 API: Checking promos for treatment: ${treatment.name} (ID: ${treatment._id})`);
        console.log(`  💰 Base price: ${treatment.base_price}`);
        
        // Find promos that apply to this treatment
        const applicablePromos = allActivePromos.filter(promo => {
          // Check if promo is global OR treatment is in applicable_treatments
          const isApplicable = promo.is_global || 
            promo.applicable_treatments.some((treatmentId: mongoose.Types.ObjectId) => 
              treatmentId.toString() === treatment._id.toString()
            );
          
          if (isApplicable) {
            console.log(`  ✅ API: Promo ${promo.name} applies to ${treatment.name}`);
          }
          
          return isApplicable;
        });

        console.log(`  📊 API: Found ${applicablePromos.length} applicable promos for ${treatment.name}`);

        // Calculate best price
        let bestPrice = treatment.base_price;
        let bestPromo: PromoDetails | null = null;

        applicablePromos.forEach(promo => {
          let discountedPrice = treatment.base_price;
          
          if (promo.discount_type === 'percentage') {
            discountedPrice = Math.round(treatment.base_price * (1 - promo.discount_value / 100));
          } else {
            discountedPrice = Math.max(0, treatment.base_price - promo.discount_value);
          }

          console.log(`  💰 Promo ${promo.name}: ${treatment.base_price} -> ${discountedPrice}`);

          if (discountedPrice < bestPrice) {
            bestPrice = discountedPrice;
            bestPromo = {
              _id: promo._id.toString(),
              name: promo.name,
              discount_type: promo.discount_type,
              discount_value: promo.discount_value
            };
          }
        });

        const result = {
          ...treatment.toObject(),
          active_promos: applicablePromos,
          final_price: bestPrice,
          applied_promo: bestPromo
        };

        console.log(`  🎯 FINAL: ${treatment.name} - Base: ${treatment.base_price}, Final: ${bestPrice}, Has Promo: ${!!bestPromo}`);
        
        return result;
      });
    }

    return NextResponse.json({
      success: true,
      treatments: treatmentsWithPromos
    });

  } catch (error) {
    console.error('❌ API: Error fetching treatments:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Terjadi kesalahan server' 
    }, { status: 500 });
  }
}


export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || !['admin', 'superadmin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const treatmentData = await req.json();
    
    const treatment = await Treatment.create({
      ...treatmentData,
      category_id: treatmentData.category_id || null
    });

    // Populate the category for the response
    await treatment.populate('category_id', 'name');

    return NextResponse.json({
      success: true,
      treatment
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create treatment error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

// Add other methods to explicitly reject them
export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed. Use /api/admin/treatments/[id] for updates' }, { status: 405 });
}

export async function PATCH() {
  return NextResponse.json({ error: 'Method not allowed. Use /api/admin/treatments/[id] for updates' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed. Use /api/admin/treatments/[id] for deletes' }, { status: 405 });
}