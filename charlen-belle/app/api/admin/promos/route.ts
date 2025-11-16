// app/api/admin/promos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Promo from '../../../models/Promo';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth-config';
import mongoose from 'mongoose';

// GET - Fetch all promos
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || !['admin', 'superadmin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const promos = await Promo.find().sort({ created_at: -1 });

    // Transform the response to include default values
    const promosWithDefaults = promos.map(promo => ({
      _id: promo._id,
      name: promo.name,
      description: promo.description,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      start_date: promo.start_date,
      end_date: promo.end_date,
      is_active: promo.is_active,
      is_global: promo.is_global || false, // Add default
      applicable_treatments: promo.applicable_treatments || [], // Add default
      created_at: promo.created_at
    }));

    return NextResponse.json({
      success: true,
      promos: promosWithDefaults
    });

  } catch (error) {
    console.error('Get promos error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Create new promo
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || !['admin', 'superadmin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const promoData = await req.json();
    
    console.log('=== DEBUG: API RECEIVED ===');
    console.log('Received promoData:', promoData);
    console.log('Received treatments:', promoData.applicable_treatments);
    console.log('==========================');
    
    // Validate dates
    if (promoData.start_date) {
      promoData.start_date = new Date(promoData.start_date);
    }
    if (promoData.end_date) {
      promoData.end_date = new Date(promoData.end_date);
    }

    // Convert treatment IDs to ObjectId
    if (promoData.applicable_treatments && Array.isArray(promoData.applicable_treatments)) {
      promoData.applicable_treatments = promoData.applicable_treatments.map((id: string) => {
        if (mongoose.Types.ObjectId.isValid(id)) {
          return new mongoose.Types.ObjectId(id);
        } else {
          console.warn('Invalid treatment ID:', id);
          return id;
        }
      });
    }

    console.log('=== DEBUG: AFTER CONVERSION ===');
    console.log('Processed treatments:', promoData.applicable_treatments);
    console.log('================================');

    const promo = await Promo.create(promoData);

    // Return the complete promo with populated data if needed
    const createdPromo = await Promo.findById(promo._id);

    return NextResponse.json({
      success: true,
      promo: {
        _id: createdPromo._id,
        name: createdPromo.name,
        description: createdPromo.description,
        discount_type: createdPromo.discount_type,
        discount_value: createdPromo.discount_value,
        start_date: createdPromo.start_date,
        end_date: createdPromo.end_date,
        is_active: createdPromo.is_active,
        is_global: createdPromo.is_global,
        applicable_treatments: createdPromo.applicable_treatments || [],
        created_at: createdPromo.created_at
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Create promo error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}