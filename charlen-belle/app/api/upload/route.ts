// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../lib/auth-config';
import cloudinary from '../../lib/cloudinary';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user has admin access
    if (!session?.user?.role || !['admin', 'superadmin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Convert buffer to base64
    const base64String = `data:${file.type};base64,${buffer.toString('base64')}`;

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        base64String,
        {
          folder: 'charlen-belle/treatments',
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
    });

    return NextResponse.json({
      success: true,
      image: {
        url: (result as any).secure_url,
        public_id: (result as any).public_id
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}