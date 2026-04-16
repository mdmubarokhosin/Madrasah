import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-api';
import { requireAuth, isAuthResponse } from '@/lib/auth';

export async function GET() {
  try {
    const { data: notices, error } = await supabase
      .from('Notice')
      .select('*')
      .eq('isActive', true)
      .order('date', { ascending: false });

    if (error) return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
    return NextResponse.json({ notices });
  } catch {
    return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthResponse(auth)) return auth;

  try {
    const data = await request.json();
    if (!data.title || !data.content || !data.date) {
      return NextResponse.json({ error: 'শিরোনাম, বিবরণ ও তারিখ দিন' }, { status: 400 });
    }
    const { data: notice, error } = await supabase
      .from('Notice')
      .insert([
        { title: data.title, content: data.content, date: data.date, isActive: data.isActive !== false },
      ])
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
    return NextResponse.json({ notice }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
