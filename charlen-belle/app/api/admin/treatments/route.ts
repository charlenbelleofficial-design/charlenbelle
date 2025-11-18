import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Treatment from '../../../models/Treatment';
import TreatmentPromo from '../../../models/TreatmentPromo';
import Promo from '../../../models/Promo';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth-config';

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

    if (includePromos) {
      // Get active promos for each treatment
      treatmentsWithPromos = await Promise.all(
        treatments.map(async (treatment) => {
          console.log(`🔍 API: Checking promos for treatment: ${treatment.name}`);
          
          const treatmentPromos = await TreatmentPromo.find({ 
            treatment_id: treatment._id 
          }).populate('promo_id');

          console.log(`  📊 API: Found ${treatmentPromos.length} promo mappings`);

          const activePromos = treatmentPromos
            .map(tp => {
              const promo = tp.promo_id;
              console.log(`  🎯 API: Checking promo: ${promo?.name}, Active: ${promo?.is_active}`);
              return promo;
            })
            .filter(promo => {
              if (!promo || !promo.is_active) {
                console.log(`  ❌ API: Promo ${promo?.name} is not active`);
                return false;
              }
              
              const now = new Date();
              if (promo.start_date && new Date(promo.start_date) > now) {
                console.log(`  ❌ API: Promo ${promo.name} hasn't started yet`);
                return false;
              }
              if (promo.end_date && new Date(promo.end_date) < now) {
                console.log(`  ❌ API: Promo ${promo.name} has expired`);
                return false;
              }
              
              console.log(`  ✅ API: Promo ${promo.name} is active and valid`);
              return true;
            });

          console.log(`  ✅ API: ${activePromos.length} active promos for ${treatment.name}`);

          return {
            ...treatment.toObject(),
            active_promos: activePromos
          };
        })
      );
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