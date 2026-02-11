import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const TOKEN_NAME = 'cgpa_token';

export interface JWTPayload {
  userId: number;
  matricNumber: string;
  role: 'student' | 'admin';
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function getAuthUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function getTokenCookieHeader(token: string): string {
  return `${TOKEN_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`;
}

export function getClearCookieHeader(): string {
  return `${TOKEN_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}
