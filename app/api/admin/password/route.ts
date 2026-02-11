import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getAuthUser } from '@/lib/server/jwt';
import { query } from '@/lib/server/db';

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { newPassword } = await req.json();

    if (!newPassword || newPassword.length < 3) {
      return NextResponse.json(
        { error: 'Password must be at least 3 characters.' },
        { status: 400 }
      );
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, user.userId]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Password change error:', err);
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}
