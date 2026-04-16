import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-api';
import { requireAuth, isAuthResponse } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const academicYearId = searchParams.get('academicYearId');
  const category = searchParams.get('category');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  let query = supabase
    .from('Income')
    .select('*')
    .order('date', { ascending: false })
    .limit(200);

  if (academicYearId) {
    query = query.eq('academicYearId', academicYearId);
  }
  if (category) {
    query = query.eq('category', category);
  }
  if (from) {
    query = query.gte('date', from);
  }
  if (to) {
    query = query.lte('date', to);
  }

  const { data: items, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const total = (items || []).reduce((sum, item) => sum + (item.amount || 0), 0);

  return NextResponse.json({ incomes: items || [], total });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthResponse(auth)) return auth;

  try {
    const data = await request.json();
    if (!data.date || !data.category || !data.amount) {
      return NextResponse.json({ error: 'তারিখ, ক্যাটেগরি ও পরিমাণ দিন' }, { status: 400 });
    }

    const insertData: Record<string, unknown> = {
      date: new Date(data.date).toISOString(),
      category: data.category,
      description: data.description || null,
      amount: parseFloat(data.amount),
      academicYearId: data.academicYearId || null,
      receivedBy: data.receivedBy || null,
    };

    const { data: item, error } = await supabase
      .from('Income')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ income: item }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
