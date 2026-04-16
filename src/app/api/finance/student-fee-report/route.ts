import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const academicYearId = searchParams.get('academicYearId');
  const classId = searchParams.get('classId');

  // Fetch students (optionally filtered by classId)
  let studentsQuery = supabase
    .from('Student')
    .select('id, name, roll, classId, class:Class(name)')
    .order('name', { ascending: true });

  if (classId) {
    studentsQuery = studentsQuery.eq('classId', classId);
  }

  const { data: students, error: studentsError } = await studentsQuery;

  if (studentsError) {
    return NextResponse.json({ error: studentsError.message }, { status: 500 });
  }

  if (!students || students.length === 0) {
    return NextResponse.json({ report: [], totalDue: 0 });
  }

  // Fetch all StudentFee records for these students (filtered by academicYearId)
  const studentIds = students.map((s) => s.id);

  let feesQuery = supabase
    .from('StudentFee')
    .select('studentId, feeType, amount, paidAmount, dueAmount, status')
    .in('studentId', studentIds);

  if (academicYearId) {
    feesQuery = feesQuery.eq('academicYearId', academicYearId);
  }

  const { data: allFees, error: feesError } = await feesQuery;

  if (feesError) {
    return NextResponse.json({ error: feesError.message }, { status: 500 });
  }

  const fees = allFees || [];

  // Group fees by studentId
  const feesByStudent = new Map<string, typeof fees>();
  fees.forEach((f) => {
    const existing = feesByStudent.get(f.studentId) || [];
    existing.push(f);
    feesByStudent.set(f.studentId, existing);
  });

  // Build report
  const report = students.map((s) => {
    const studentFees = feesByStudent.get(s.id) || [];
    const totalAmount = studentFees.reduce((sum, f) => sum + (f.amount || 0), 0);
    const totalPaid = studentFees.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
    const totalDue = studentFees.reduce((sum, f) => sum + (f.dueAmount || 0), 0);

    // Get className from the student's class relation
    const classData = s.class as { name?: string } | null;
    const className = classData?.name || undefined;

    return {
      studentId: s.id,
      name: s.name,
      roll: s.roll,
      className,
      totalAmount,
      totalPaid,
      totalDue,
      status: totalDue > 0 ? (totalPaid > 0 ? 'partial' : 'unpaid') : 'paid',
      feeCount: studentFees.length,
    };
  });

  return NextResponse.json({
    report,
    totalDue: report.reduce((s, r) => s + r.totalDue, 0),
  });
}
