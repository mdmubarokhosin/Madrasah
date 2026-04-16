import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-api';
import { requireAuth, isAuthResponse } from '@/lib/auth';

export async function POST() {
  const auth = await requireAuth(request);
  if (isAuthResponse(auth)) return auth;

  try {
    // 1. Create Academic Year
    const { data: year, error: yearErr } = await supabase
      .from('AcademicYear')
      .upsert({ id: 'demo-year-2025', name: '২০২৫', nameEn: '2025', isActive: true })
      .select()
      .single();

    if (yearErr) return NextResponse.json({ error: 'শিক্ষাবর্ষ তৈরি সমস্যা: ' + yearErr.message }, { status: 500 });

    // 2. Create Exam (published)
    const { data: exam, error: examErr } = await supabase
      .from('Exam')
      .upsert({
        id: 'demo-exam-2025',
        name: 'বার্ষিক পরীক্ষা ২০২৫',
        nameEn: 'Annual Exam 2025',
        year: '2025',
        isPublished: true,
        academicYearId: year.id,
      })
      .select()
      .single();

    if (examErr) return NextResponse.json({ error: 'পরীক্ষা তৈরি সমস্যা: ' + examErr.message }, { status: 500 });

    // 3. Create Marhala
    const { data: marhala, error: marhalaErr } = await supabase
      .from('Marhala')
      .upsert({
        id: 'demo-marhala-hifz',
        name: 'হিফজুল কুরআন',
        nameEn: 'Hifzul Quran',
        examId: exam.id,
      })
      .select()
      .single();

    if (marhalaErr) return NextResponse.json({ error: 'মারহালা তৈরি সমস্যা: ' + marhalaErr.message }, { status: 500 });

    // 4. Create Subjects
    const subjectsData = [
      { id: 'demo-sub-quran', name: 'কুরআন মাজীদ', totalMarks: 100, passMarks: 40, marhalaId: marhala.id },
      { id: 'demo-sub-hadith', name: 'হাদীস শরীফ', totalMarks: 100, passMarks: 33, marhalaId: marhala.id },
      { id: 'demo-sub-fiqh', name: 'ফিকহ', totalMarks: 100, passMarks: 33, marhalaId: marhala.id },
      { id: 'demo-sub-arabi', name: 'আরবী', totalMarks: 100, passMarks: 33, marhalaId: marhala.id },
      { id: 'demo-sub-bangla', name: 'বাংলা', totalMarks: 100, passMarks: 33, marhalaId: marhala.id },
    ];

    const { error: subErr } = await supabase.from('Subject').upsert(subjectsData);
    if (subErr) return NextResponse.json({ error: 'বিষয় তৈরি সমস্যা: ' + subErr.message }, { status: 500 });

    // 5. Create Students
    const studentsData = [
      { id: 'demo-stu-1', name: 'আব্দুল্লাহ', roll: '01', regNo: '2025-001', classId: null, academicYearId: year.id, isActive: true },
      { id: 'demo-stu-2', name: 'মুহাম্মাদ আহমাদ', roll: '02', regNo: '2025-002', classId: null, academicYearId: year.id, isActive: true },
      { id: 'demo-stu-3', name: 'ইব্রাহীম', roll: '03', regNo: '2025-003', classId: null, academicYearId: year.id, isActive: true },
      { id: 'demo-stu-4', name: 'উসমান', roll: '04', regNo: '2025-004', classId: null, academicYearId: year.id, isActive: true },
      { id: 'demo-stu-5', name: 'বিলাল', roll: '05', regNo: '2025-005', classId: null, academicYearId: year.id, isActive: true },
      { id: 'demo-stu-6', name: 'হামজা', roll: '06', regNo: '2025-006', classId: null, academicYearId: year.id, isActive: true },
      { id: 'demo-stu-7', name: 'খালিদ', roll: '07', regNo: '2025-007', classId: null, academicYearId: year.id, isActive: true },
      { id: 'demo-stu-8', name: 'ইউসুফ', roll: '08', regNo: '2025-008', classId: null, academicYearId: year.id, isActive: true },
      { id: 'demo-stu-9', name: 'আলী হাসান', roll: '09', regNo: '2025-009', classId: null, academicYearId: year.id, isActive: true },
      { id: 'demo-stu-10', name: 'তাকি উদ্দীন', roll: '10', regNo: '2025-010', classId: null, academicYearId: year.id, isActive: true },
    ];

    const { error: stuErr } = await supabase.from('Student').upsert(studentsData);
    if (stuErr) return NextResponse.json({ error: 'শিক্ষার্থী তৈরি সমস্যা: ' + stuErr.message }, { status: 500 });

    // 6. Create Results with marks
    const marksData = [
      { studentIdx: 0, marks: [95, 88, 82, 90, 85] },
      { studentIdx: 1, marks: [90, 92, 78, 85, 88] },
      { studentIdx: 2, marks: [85, 75, 90, 80, 78] },
      { studentIdx: 3, marks: [80, 82, 70, 75, 82] },
      { studentIdx: 4, marks: [78, 70, 85, 72, 75] },
      { studentIdx: 5, marks: [72, 65, 75, 68, 70] },
      { studentIdx: 6, marks: [65, 60, 68, 62, 65] },
      { studentIdx: 7, marks: [58, 55, 60, 50, 58] },
      { studentIdx: 8, marks: [45, 42, 48, 40, 45] },
      { studentIdx: 9, marks: [30, 28, 35, 25, 30] },
    ];

    const createdResults: string[] = [];

    for (const md of marksData) {
      const studentId = studentsData[md.studentIdx].id;
      const totalMarks = md.marks.reduce((a, b) => a + b, 0);
      const maxMarks = 500;
      const gpa = parseFloat(((totalMarks / maxMarks) * 5).toFixed(2));
      const allPassed = md.marks.every((m, i) => m >= subjectsData[i].passMarks);
      const isPassed = allPassed && gpa >= 2.0;

      const { data: result, error: resErr } = await supabase
        .from('Result')
        .upsert({
          id: `demo-result-${md.studentIdx + 1}`,
          studentId,
          examId: exam.id,
          marhalaId: marhala.id,
          totalMarks,
          gpa,
          isPassed,
        })
        .select()
        .single();

      if (resErr) continue;
      if (!result) continue;
      createdResults.push(result.id);

      // Create result items
      const items = subjectsData.map((subj, i) => ({
        id: `demo-ri-${md.studentIdx + 1}-${i}`,
        resultId: result.id,
        subjectId: subj.id,
        marks: md.marks[i],
        isPassed: md.marks[i] >= subj.passMarks,
      }));

      await supabase.from('ResultItem').upsert(items);
    }

    // 7. Recalculate merit
    const { data: allResults } = await supabase
      .from('Result')
      .select('id, gpa, totalMarks')
      .eq('examId', exam.id)
      .eq('marhalaId', marhala.id);

    if (allResults) {
      const sorted = allResults.sort((a, b) => {
        if (b.gpa !== a.gpa) return b.gpa - a.gpa;
        return b.totalMarks - a.totalMarks;
      });
      for (let i = 0; i < sorted.length; i++) {
        await supabase.from('Result').update({ merit: i + 1 }).eq('id', sorted[i].id);
      }
    }

    // 8. Create a sample notice
    await supabase.from('Notice').upsert({
      id: 'demo-notice-1',
      title: 'বার্ষিক পরীক্ষা ২০২৫ এর ফলাফল প্রকাশিত',
      content: 'বার্ষিক পরীক্ষা ২০২৫ এর ফলাফল প্রকাশ করা হয়েছে। প্রত্যেক শিক্ষার্থী তাদের ফলাফল ওয়েবসাইট থেকে দেখতে পারবে।',
      date: new Date().toISOString().split('T')[0],
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      message: 'ডেমো ডাটা সফলভাবে তৈরি হয়েছে',
      details: {
        academicYear: year.name,
        exam: exam.name,
        marhala: marhala.name,
        subjects: subjectsData.length,
        students: studentsData.length,
        results: createdResults.length,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'সার্ভার ত্রুটি';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
