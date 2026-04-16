import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'madrasa-cms-secret-key-2025';

interface JWTPayload {
  adminId: string;
  username: string;
  name: string;
}

// Encode secret as Uint8Array for jose
function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(JWT_SECRET);
}

export async function generateToken(payload: JWTPayload): Promise<string> {
  const secret = getSecretKey();
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export async function requireAuth(request: NextRequest): Promise<JWTPayload | NextResponse> {
  const token = getTokenFromRequest(request);
  if (!token) {
    return NextResponse.json({ error: 'অনুমতি দেওয়া হয়নি' }, { status: 401 });
  }
  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'অবৈধ টোকেন' }, { status: 401 });
  }
  return payload;
}

export function isAuthResponse(response: NextResponse | JWTPayload): response is NextResponse {
  return response instanceof NextResponse;
}
