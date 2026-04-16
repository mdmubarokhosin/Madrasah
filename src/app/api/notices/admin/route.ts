import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-api';
import { requireAuth, isAuthResponse } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const [noticesResult, countResult] = await Promise.all([
      supabase
        .from('Notice')
        .select('*')
        .order('date', { ascending: false })
        .range(offset, offset + limit - 1),
      supabase.from('Notice').select('*', { count: 'exact', head: true }),
    ]);

    const { data: notices, error: noticesError } = noticesResult;
    const { count: total, error: countError } = countResult;

    if (noticesError) return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });

    return NextResponse.json({ notices, total: total ?? 0, page, limit });
  } catch {
    return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
