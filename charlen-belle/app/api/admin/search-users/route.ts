// app/api/admin/search-users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import User from '../../../models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth-config';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin access
    if (!session.user.role || !['admin', 'superadmin', 'kasir'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    let searchFilter = {};
    
    if (query) {
      searchFilter = {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
          { phone_number: { $regex: query, $options: 'i' } }
        ],
        role: 'customer' // Only search customers
      };
    } else {
      searchFilter = { role: 'customer' };
    }

    const users = await User.find(searchFilter)
      .select('name email phone_number')
      .limit(limit)
      .sort({ name: 1 });

    return NextResponse.json({
      success: true,
      users
    });

  } catch (error) {
    console.error('Search users error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}