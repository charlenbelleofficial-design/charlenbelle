// app/api/treatments/all/route.ts
import { NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Treatment from '../../../models/Treatment';

export async function GET() {
  try {
    await connectDB();
    
    const treatments = await Treatment.find({})
      .populate('category_id', 'name')
      .sort({ name: 1 });

    console.log('All treatments in database:', treatments.map(t => ({
      _id: t._id,
      name: t.name
    })));

    return NextResponse.json({
      success: true,
      treatments: treatments.map(t => ({
        _id: t._id,
        name: t.name,
        description: t.description,
        base_price: t.base_price,
        duration_minutes: t.duration_minutes,
        category_id: t.category_id
      }))
    });

  } catch (error) {
    console.error('Error fetching all treatments:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Gagal memuat data treatment' 
      },
      { status: 500 }
    );
  }
}