// app/api/treatments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Treatment from '../../../models/Treatment';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // params is now a Promise
) {
  try {
    // Unwrap the params promise
    const { id } = await params;
    
    await connectDB();
    
    console.log('=== API DEBUG START ===');
    console.log('Received ID:', id);
    console.log('ID Type:', typeof id);
    console.log('Is valid ObjectId:', mongoose.Types.ObjectId.isValid(id));
    
    // Check if ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('ERROR: Invalid ObjectId');
      return NextResponse.json(
        { success: false, error: 'ID treatment tidak valid' },
        { status: 400 }
      );
    }

    console.log('Searching for treatment...');
    const treatment = await Treatment.findById(id)
      .populate('category_id', 'name');

    console.log('Query result:', treatment);
    console.log('=== API DEBUG END ===');

    if (!treatment) {
      return NextResponse.json(
        { success: false, error: 'Treatment tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      treatment: {
        _id: treatment._id,
        name: treatment.name,
        description: treatment.description,
        base_price: treatment.base_price,
        duration_minutes: treatment.duration_minutes,
        category_id: treatment.category_id,
        requires_confirmation: treatment.requires_confirmation,
        is_active: treatment.is_active
      }
    });

  } catch (error) {
    console.error('Error fetching treatment:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Gagal memuat data treatment' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    const body = await req.json();

    const treatment = await Treatment.findByIdAndUpdate(
      id,
      {
        ...body,
        updated_at: new Date()
      },
      { new: true }
    ).populate('category_id', 'name');

    if (!treatment) {
      return NextResponse.json(
        { success: false, error: 'Treatment tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      treatment
    });

  } catch (error) {
    console.error('Error updating treatment:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Gagal mengupdate treatment' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const treatment = await Treatment.findByIdAndDelete(id);

    if (!treatment) {
      return NextResponse.json(
        { success: false, error: 'Treatment tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Treatment berhasil dihapus'
    });

  } catch (error) {
    console.error('Error deleting treatment:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Gagal menghapus treatment' 
      },
      { status: 500 }
    );
  }
}