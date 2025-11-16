// app/api/treatments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../lib/mongodb';
import Treatment from '../../models/Treatment';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    
    let filter: any = { is_active: true };
    
    if (category && category !== 'all' && category !== 'undefined' && category !== 'null') { // Added 'null' check too
      // Validate if category is a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(category)) {
        filter.category_id = category;
      } else {
        console.error(`Invalid category ID received: ${category}`); // Add logging
        return NextResponse.json(
          { 
            success: false, 
            error: 'ID kategori tidak valid' 
          },
          { status: 400 }
        );
      }
    }

    // Populate the category name in the response
    const treatments = await Treatment.find(filter)
      .populate('category_id', 'name') // Populate the name field of the category
      .sort({ base_price: 1 });

    return NextResponse.json({
      success: true,
      treatments
    });

  } catch (error) {
    console.error('Error fetching treatments:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Gagal memuat data treatment' 
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    
    const treatment = await Treatment.create({
      name: body.name,
      description: body.description,
      duration_minutes: body.duration_minutes,
      base_price: body.base_price,
      category_id: body.category_id,
      requires_confirmation: body.requires_confirmation || false,
      is_active: body.is_active !== undefined ? body.is_active : true
    });

    return NextResponse.json({
      success: true,
      treatment
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating treatment:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Gagal membuat treatment' 
      },
      { status: 500 }
    );
  }
}