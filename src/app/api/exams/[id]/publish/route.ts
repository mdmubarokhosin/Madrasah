import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-api';
import { requireAuth, isAuthResponse } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (isAuthResponse(auth)) return auth;
  const { id } = await params;

  try {
    const { data: exam, error: fetchError } = await supabase
      .from('Exam')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !exam) return NextResponse.json({ error: 'পরীক্ষা পাওয়া যায়নি' }, { status: 404 });

    const { data: updated, error } = await supabase
      .from('Exam')
      .update({ isPublished: !exam.isPublished })
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
    return NextResponse.json({ exam: updated });
  } catch {
    return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
