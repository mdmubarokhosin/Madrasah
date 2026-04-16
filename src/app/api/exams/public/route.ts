import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-api';

export async function GET() {
  try {
    const { data: exams, error } = await supabase
      .from('Exam')
      .select('*, marhalas:Marhala(*)')
      .eq('isPublished', true)
      .order('createdAt', { ascending: false });

    if (error) return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
    return NextResponse.json({ exams });
  } catch {
    return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
