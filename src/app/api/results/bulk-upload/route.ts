import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-api';
import { requireAuth, isAuthResponse } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthResponse(auth)) return auth;

  try {
    const { examId, marhalaId, results } = await request.json();
    if (!examId || !marhalaId || !results || !Array.isArray(results)) {
      return NextResponse.json({ error: 'প্রয়োজনীয় তথ্য দিন' }, { status: 400 });
    }

    // Fetch subjects for this marhala once
    const { data: subjects, error: subjectsError } = await supabase
      .from('Subject')
      .select('*')
      .eq('marhalaId', marhalaId);

    if (subjectsError) return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });

    const createdResults: any[] = [];

    for (const r of results) {
      // Find or create student
      let studentQuery = supabase.from('Student').select('id').eq('roll', r.roll).eq('regNo', r.regNo);
      const { data: existingStudent } = await studentQuery.limit(1).single();

      let studentId: string;
      if (existingStudent) {
        studentId = existingStudent.id;
      } else {
        const { data: newStudent, error: createStudentError } = await supabase
          .from('Student')
          .insert([{ name: r.studentName, roll: r.roll, regNo: r.regNo }])
          .select()
          .single();

        if (createStudentError) continue;
        studentId = newStudent.id;
      }

      // Calculate totals
      const items: { subjectId: string; marks: number; isPassed: boolean }[] = r.items || [];
      const totalMarks = items.reduce((sum: number, item: { marks: number }) => sum + item.marks, 0);
      const maxMarks = items.reduce((sum: number, _: unknown, idx: number) => {
        const subj = subjects?.[idx];
        return sum + (subj ? subj.totalMarks : 100);
      }, 0);
      const gpa = maxMarks > 0 ? parseFloat(((totalMarks / maxMarks) * 5).toFixed(2)) : 0;

      // Create result
      const { data: result, error: createResultError } = await supabase
        .from('Result')
        .insert([
          {
            studentId,
            examId,
            marhalaId,
            totalMarks,
            gpa,
            isPassed: gpa >= 2.0,
          },
        ])
        .select()
        .single();

      if (createResultError || !result) continue;

      // Create result items
      const resultItems = items.map((item: { subjectId?: string; marks: number }, idx: number) => ({
        resultId: result.id,
        subjectId: item.subjectId || subjects?.[idx]?.id,
        marks: item.marks,
        isPassed: item.marks >= 33,
      }));

      if (resultItems.length > 0) {
        await supabase.from('ResultItem').insert(resultItems);
      }

      createdResults.push(result);
    }

    // Update merit positions - fetch all results for this exam/marhala
    const { data: allResults, error: fetchAllError } = await supabase
      .from('Result')
      .select('id')
      .eq('examId', examId)
      .eq('marhalaId', marhalaId);

    if (!fetchAllError && allResults) {
      // Fetch with sorting data
      const { data: allResultsSorted } = await supabase
        .from('Result')
        .select('id, gpa, totalMarks')
        .eq('examId', examId)
        .eq('marhalaId', marhalaId);

      if (allResultsSorted) {
        // Sort by gpa desc, then totalMarks desc
        const sorted = allResultsSorted.sort((a, b) => {
          if (b.gpa !== a.gpa) return b.gpa - a.gpa;
          return b.totalMarks - a.totalMarks;
        });

        // Update merit positions
        for (let i = 0; i < sorted.length; i++) {
          await supabase
            .from('Result')
            .update({ merit: i + 1 })
            .eq('id', sorted[i].id);
        }
      }
    }

    return NextResponse.json({ success: true, count: createdResults.length }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
