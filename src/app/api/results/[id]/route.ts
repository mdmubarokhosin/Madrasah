import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-api';
import { requireAuth, isAuthResponse } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (isAuthResponse(auth)) return auth;
  const { id } = await params;

  try {
    const data = await request.json();

    // If items are provided, update them
    if (data.items && Array.isArray(data.items)) {
      // Fetch subjects for GPA calculation
      const { data: result } = await supabase.from('Result').select('marhalaId, examId').eq('id', id).single();
      if (!result) return NextResponse.json({ error: 'ফলাফল পাওয়া যায়নি' }, { status: 404 });

      const { data: subjects } = await supabase.from('Subject').select('*').eq('marhalaId', result.marhalaId);

      // Delete existing items
      await supabase.from('ResultItem').delete().eq('resultId', id);

      // Build new items
      const resultItems = data.items.map((item: { subjectId: string; marks: number }) => {
        const subj = subjects?.find((s: any) => s.id === item.subjectId);
        return {
          resultId: id,
          subjectId: item.subjectId,
          marks: item.marks,
          isPassed: subj ? item.marks >= (subj.passMarks || 33) : item.marks >= 33,
        };
      });

      // Insert new items
      if (resultItems.length > 0) {
        await supabase.from('ResultItem').insert(resultItems);
      }

      // Recalculate total, GPA, isPassed
      const totalMarks = resultItems.reduce((sum: number, item: any) => sum + item.marks, 0);
      const maxMarks = resultItems.reduce((sum: number, item: any) => {
        const subj = subjects?.find((s: any) => s.id === item.subjectId);
        return sum + (subj ? subj.totalMarks : 100);
      }, 0);
      const gpa = maxMarks > 0 ? parseFloat(((totalMarks / maxMarks) * 5).toFixed(2)) : 0;
      const allPassed = resultItems.every((item: any) => item.isPassed);

      // Update result
      const { data: updatedResult, error } = await supabase
        .from('Result')
        .update({ totalMarks, gpa, isPassed: allPassed && gpa >= 2.0 })
        .eq('id', id)
        .select('*, student:Student(*), items:ResultItem(*, subject:Subject(*))')
        .single();

      if (error) return NextResponse.json({ error: 'আপডেট করতে সমস্যা হয়েছে' }, { status: 500 });

      // Recalculate merit
      await recalculateMerit(result.examId, result.marhalaId);

      return NextResponse.json({ result: updatedResult });
    }

    // If only basic fields are provided (no items)
    const updateData: Record<string, unknown> = {};
    if (data.totalMarks !== undefined) updateData.totalMarks = data.totalMarks;
    if (data.gpa !== undefined) updateData.gpa = data.gpa;
    if (data.merit !== undefined) updateData.merit = data.merit;
    if (data.isPassed !== undefined) updateData.isPassed = data.isPassed;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'আপডেটের জন্য কোনো তথ্য দেওয়া হয়নি' }, { status: 400 });
    }

    const { data: updatedResult, error } = await supabase
      .from('Result')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'আপডেট করতে সমস্যা হয়েছে' }, { status: 500 });
    return NextResponse.json({ result: updatedResult });
  } catch {
    return NextResponse.json({ error: 'আপডেট করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (isAuthResponse(auth)) return auth;
  const { id } = await params;

  try {
    // Fetch result to get examId and marhalaId for merit recalculation
    const { data: result } = await supabase.from('Result').select('examId, marhalaId').eq('id', id).single();

    // Delete result items first
    await supabase.from('ResultItem').delete().eq('resultId', id);
    // Then delete the result
    const { error } = await supabase.from('Result').delete().eq('id', id);
    if (error) return NextResponse.json({ error: 'মুছে ফেলতে সমস্যা হয়েছে' }, { status: 500 });

    // Recalculate merit after delete
    if (result) {
      await recalculateMerit(result.examId, result.marhalaId);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'মুছে ফেলতে সমস্যা হয়েছে' }, { status: 500 });
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
