import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '../../../lib/mongodb';
import User from '../../../models/User';
import { sanitizeInput, isValidEmail, checkRateLimit } from '../../../lib/security';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(`register-${ip}`, 3, 60000)) {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan. Silakan coba lagi nanti.' },
        { status: 429 }
      );
    }

    const { name, email, password, phone_number } = await req.json();

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nama, email, dan password wajib diisi' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Format email tidak valid' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password minimal 8 karakter' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      name: sanitizeInput(name),
      email: email.toLowerCase(),
      password: hashedPassword,
      phone_number: phone_number ? sanitizeInput(phone_number) : undefined,
      role: 'customer'
    });

    return NextResponse.json({
      message: 'Registrasi berhasil',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}