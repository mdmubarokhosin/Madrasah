import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-api';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    const { data: faqs, error } = await supabase
      .from('FAQ')
      .select('*')
      .eq('isActive', true)
      .order('createdAt', { ascending: true });

    if (error) return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
    return NextResponse.json({ faqs });
  } catch {
    return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const data = await request.json();
    if (!data.question || !data.answer) {
      return NextResponse.json({ error: 'প্রশ্ন ও উত্তর দিন' }, { status: 400 });
    }
    const { data: faq, error } = await supabase
      .from('FAQ')
      .insert([
        { question: data.question, answer: data.answer, isActive: data.isActive !== false },
      ])
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
    return NextResponse.json({ faq }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
