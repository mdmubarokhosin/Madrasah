import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-api';

export async function POST(request: NextRequest) {
  try {
    const { examId, marhalaId, roll, regNo, studentId } = await request.json();
    if (!examId || !marhalaId) {
      return NextResponse.json({ error: 'পরীক্ষা ও মারহালা নির্বাচন করুন' }, { status: 400 });
    }

    let targetStudentId = studentId;

    // If studentId not provided, find student by roll/regNo
    if (!targetStudentId) {
      if (!roll && !regNo) {
        return NextResponse.json({ error: 'রোল বা রেজিস্ট্রেশন নম্বর বা শিক্ষার্থী দিন' }, { status: 400 });
      }

      let studentQuery = supabase.from('Student').select('id');
      if (roll && regNo) {
        studentQuery = studentQuery.eq('roll', roll).eq('regNo', regNo);
      } else if (roll) {
        studentQuery = studentQuery.eq('roll', roll);
      } else {
        studentQuery = studentQuery.eq('regNo', regNo);
      }
      const { data: student, error: studentError } = await studentQuery.limit(1).maybeSingle();

      if (studentError || !student) {
        return NextResponse.json({ error: 'এই রোল/রেজি. নং দিয়ে কোনো শিক্ষার্থী পাওয়া যায়নি' }, { status: 404 });
      }
      targetStudentId = student.id;
    }

    // Fetch result for this student
    const { data: results, error } = await supabase
      .from('Result')
      .select('*, student:Student(*), exam:Exam(*), marhala:Marhala(*), items:ResultItem(*, subject:Subject(*))')
      .eq('examId', examId)
      .eq('marhalaId', marhalaId)
      .eq('studentId', targetStudentId)
      .limit(1);

    if (error) return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });

    const result = results && results.length > 0 ? results[0] : null;
    if (!result) {
      return NextResponse.json({ error: 'কোনো ফলাফল পাওয়া যায়নি। নির্বাচিত পরীক্ষা/মারহালায় এই শিক্ষার্থীর ফলাফল প্রকাশ করা হয়নি।' }, { status: 404 });
    }

    return NextResponse.json({ result });
  } catch {
    return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
