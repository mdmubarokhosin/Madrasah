import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('examId');
    const marhalaId = searchParams.get('marhalaId');

    if (!examId || !marhalaId) {
      return NextResponse.json({ error: 'পরীক্ষা ও মারহালা আইডি দিন' }, { status: 400 });
    }

    const { data: results, error } = await supabase
      .from('Result')
      .select('*, student:Student(*), items:ResultItem(*, subject:Subject(*))')
      .eq('examId', examId)
      .eq('marhalaId', marhalaId)
      .order('merit', { ascending: true });

    if (error) return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
