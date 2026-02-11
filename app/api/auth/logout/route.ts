import { NextResponse } from 'next/server';
import { getClearCookieHeader } from '@/lib/server/jwt';

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.headers.set('Set-Cookie', getClearCookieHeader());
  return res;
}
