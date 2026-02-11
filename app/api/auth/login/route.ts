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

    const matric = matricNumber.toUpperCase().trim();

    const users = await query<any[]>('SELECT id, matric_number, password_hash, role FROM users WHERE matric_number = ?', [matric]);
    if (users.length === 0) {
      return NextResponse.json({ error: 'Matric number not found. Please register first.' }, { status: 404 });
    }

    const user = users[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
    }

    const token = signToken({ userId: user.id, matricNumber: user.matric_number, role: user.role });

    const res = NextResponse.json({ success: true, matricNumber: user.matric_number, role: user.role });
    res.headers.set('Set-Cookie', getTokenCookieHeader(token));
    return res;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
