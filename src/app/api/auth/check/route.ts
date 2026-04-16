import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthResponse } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthResponse(auth)) return auth;
  return NextResponse.json({ admin: auth });
}
