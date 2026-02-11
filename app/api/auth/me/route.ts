import { NextResponse } from 'next/server';
import { getAuthUser, getClearCookieHeader } from '@/lib/server/jwt';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      const res = NextResponse.json({ authenticated: false }, { status: 401 });
      res.headers.set('Set-Cookie', getClearCookieHeader());
      return res;
    }
    return NextResponse.json({
      authenticated: true,
      matricNumber: user.matricNumber,
      role: user.role,
      userId: user.userId,
    });
  } catch (err: any) {
    console.error('Auth check error:', err);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
