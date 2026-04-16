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

    // Fetch all results with student, then sort in JS
    const { data: results, error } = await supabase
      .from('Result')
      .select('*, student:Student(*)')
      .eq('examId', examId)
      .eq('marhalaId', marhalaId)
      .eq('isPassed', true);

    if (error) return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });

    // Sort by gpa desc, then totalMarks desc
    const sorted = (results ?? []).sort((a, b) => {
      if (b.gpa !== a.gpa) return b.gpa - a.gpa;
      return b.totalMarks - a.totalMarks;
    });

    return NextResponse.json({ results: sorted });
  } catch {
    return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
