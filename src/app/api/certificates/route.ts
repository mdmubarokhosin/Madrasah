import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-api';
import { requireAuth, isAuthResponse } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthResponse(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const status = searchParams.get('status') || '';

  let query = supabase
    .from('CertificateApplication')
    .select('*, exam:Exam(*), marhala:Marhala(*)', { count: 'exact' })
    .order('createdAt', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data: applications, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ applications: applications || [], total: count || 0, page, limit });
}
