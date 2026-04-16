import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-api';
import { requireAuth, isAuthResponse } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthResponse(auth)) return auth;

  try {
    const { studentId, examId, marhalaId, items } = await request.json();

    if (!studentId || !examId || !marhalaId) {
      return NextResponse.json({ error: 'শিক্ষার্থী, পরীক্ষা ও মারহালা আবশ্যক' }, { status: 400 });
    }

    // Check for duplicate result
    const { data: existing } = await supabase
      .from('Result')
      .select('id')
      .eq('studentId', studentId)
      .eq('examId', examId)
      .eq('marhalaId', marhalaId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'এই শিক্ষার্থীর জন্য ইতিমধ্যে ফলাফল আছে' }, { status: 400 });
    }

    // Fetch subjects for this marhala
    const { data: subjects, error: subjectsError } = await supabase
      .from('Subject')
      .select('*')
      .eq('marhalaId', marhalaId);

    if (subjectsError) return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });

    // Build result items
    const resultItems = (items || []).map((item: { subjectId: string; marks: number }) => {
      const subj = subjects?.find((s: any) => s.id === item.subjectId);
      return {
        subjectId: item.subjectId,
        marks: item.marks,
        isPassed: subj ? item.marks >= (subj.passMarks || 33) : item.marks >= 33,
      };
    });

    // Calculate totals
    const totalMarks = resultItems.reduce((sum: number, item: any) => sum + item.marks, 0);
    const maxMarks = resultItems.reduce((sum: number, item: any) => {
      const subj = subjects?.find((s: any) => s.id === item.subjectId);
      return sum + (subj ? subj.totalMarks : 100);
    }, 0);
    const gpa = maxMarks > 0 ? parseFloat(((totalMarks / maxMarks) * 5).toFixed(2)) : 0;
    const allPassed = resultItems.every((item: any) => item.isPassed);

    // Create result
    const { data: result, error: createError } = await supabase
      .from('Result')
      .insert([{
        studentId,
        examId,
        marhalaId,
        totalMarks,
        gpa,
        isPassed: allPassed && gpa >= 2.0,
      }])
      .select('*, student:Student(*)')
      .single();

    if (createError || !result) {
      return NextResponse.json({ error: 'ফলাফল তৈরি করতে সমস্যা হয়েছে' }, { status: 500 });
    }

    // Create result items
    if (resultItems.length > 0) {
      const itemsWithResultId = resultItems.map((item: any) => ({
        ...item,
        resultId: result.id,
      }));
      await supabase.from('ResultItem').insert(itemsWithResultId);
    }

    // Recalculate merit positions
    await recalculateMerit(examId, marhalaId);

    return NextResponse.json({ result }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}

async function recalculateMerit(examId: string, marhalaId: string) {
  const { data: allResults } = await supabase
    .from('Result')
    .select('id, gpa, totalMarks')
    .eq('examId', examId)
    .eq('marhalaId', marhalaId);

  if (!allResults || allResults.length === 0) return;

  const sorted = allResults.sort((a, b) => {
    if (b.gpa !== a.gpa) return b.gpa - a.gpa;
    return b.totalMarks - a.totalMarks;
  });

  for (let i = 0; i < sorted.length; i++) {
    await supabase.from('Result').update({ merit: i + 1 }).eq('id', sorted[i].id);
  }
}
