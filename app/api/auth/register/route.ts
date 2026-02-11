import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/server/db';
import { signToken, getTokenCookieHeader } from '@/lib/server/jwt';

export async function POST(req: NextRequest) {
  try {
    const { matricNumber, password } = await req.json();

    if (!matricNumber || !password) {
      return NextResponse.json({ error: 'Matric number and password are required.' }, { status: 400 });
    }
    if (password.length < 3) {
      return NextResponse.json({ error: 'Password must be at least 3 characters.' }, { status: 400 });
    }

    const matric = matricNumber.toUpperCase().trim();

    // Check if already exists
    const existing = await query<any[]>('SELECT id FROM users WHERE matric_number = ?', [matric]);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'This matric number is already registered.' }, { status: 409 });
    }

    // Hash password and create user
    const hash = await bcrypt.hash(password, 10);
    const result = await query<any>('INSERT INTO users (matric_number, password_hash, role) VALUES (?, ?, ?)', [matric, hash, 'student']);

    // Create empty state
    await query('INSERT INTO user_state (user_id, grades, carryovers) VALUES (?, ?, ?)', [result.insertId, '{}', '{}']);

    // Sign JWT
    const token = signToken({ userId: result.insertId, matricNumber: matric, role: 'student' });

    const res = NextResponse.json({ success: true, matricNumber: matric, role: 'student' });
    res.headers.set('Set-Cookie', getTokenCookieHeader(token));
    return res;
  } catch (err: any) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
