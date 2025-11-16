// app/api/admin/debug-promo-schema/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Promo from '../../../models/Promo';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    // Check the schema
    const schema = Promo.schema.obj;
    console.log('Promo Schema:', schema);
    
    // Check existing promos
    const promos = await Promo.find();
    console.log('Existing Promos:', promos);
    
    return NextResponse.json({
      success: true,
      schema: schema,
      promos: promos
    });
    
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Debug failed' }, { status: 500 });
  }
}