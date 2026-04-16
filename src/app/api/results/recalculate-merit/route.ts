import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-api';
import { requireAuth, isAuthResponse } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthResponse(auth)) return auth;

  try {
    const { examId, marhalaId } = await request.json();

    if (!examId || !marhalaId) {
      return NextResponse.json({ error: 'পরীক্ষা ও মারহালা আইডি দিন' }, { status: 400 });
    }

    const { data: allResults } = await supabase
      .from('Result')
      .select('id, gpa, totalMarks')
      .eq('examId', examId)
      .eq('marhalaId', marhalaId);

    if (!allResults || allResults.length === 0) {
      return NextResponse.json({ message: 'কোনো ফলাফল নেই', updated: 0 });
    }

    // Sort by gpa desc, then totalMarks desc
    const sorted = allResults.sort((a, b) => {
      if (b.gpa !== a.gpa) return b.gpa - a.gpa;
      return b.totalMarks - a.totalMarks;
    });

    // Update merit positions
    for (let i = 0; i < sorted.length; i++) {
      await supabase.from('Result').update({ merit: i + 1 }).eq('id', sorted[i].id);
    }

    return NextResponse.json({ message: 'মেধা তালিকা আপডেট হয়েছে', updated: sorted.length });
  } catch {
    return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
