import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-api';
import { requireAuth, isAuthResponse } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('classId');
  const date = searchParams.get('date');
  const studentId = searchParams.get('studentId');
  const academicYearId = searchParams.get('academicYearId');

  let query = supabase
    .from('Attendance')
    .select('*, student:Student(id, name, roll), class:Class(id, name)')
    .order('date', { ascending: false })
    .limit(500);

  if (classId) {
    query = query.eq('classId', classId);
  }
  if (date) {
    query = query.eq('date', date);
  }
  if (studentId) {
    query = query.eq('studentId', studentId);
  }
  if (academicYearId) {
    query = query.eq('academicYearId', academicYearId);
  }

  const { data: items, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Count present and total using same filters
  let countQuery = supabase
    .from('Attendance')
    .select('id', { count: 'exact', head: true });

  let presentQuery = supabase
    .from('Attendance')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'present');

  if (classId) {
    countQuery = countQuery.eq('classId', classId);
    presentQuery = presentQuery.eq('classId', classId);
  }
  if (date) {
    countQuery = countQuery.eq('date', date);
    presentQuery = presentQuery.eq('date', date);
  }
  if (studentId) {
    countQuery = countQuery.eq('studentId', studentId);
    presentQuery = presentQuery.eq('studentId', studentId);
  }
  if (academicYearId) {
    countQuery = countQuery.eq('academicYearId', academicYearId);
    presentQuery = presentQuery.eq('academicYearId', academicYearId);
  }

  const [totalCountRes, presentCountRes] = await Promise.all([countQuery, presentQuery]);

  const totalCount = totalCountRes.count || 0;
  const presentCount = presentCountRes.count || 0;

  return NextResponse.json({
    attendance: items || [],
    presentCount,
    totalCount,
    rate: totalCount > 0 ? parseFloat(((presentCount / totalCount) * 100).toFixed(1)) : 0,
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthResponse(auth)) return auth;

  try {
    const data = await request.json();
    if (!data.classId || !data.date || !data.records) {
      return NextResponse.json({ error: 'শ্রেণি, তারিখ ও রেকর্ড দিন' }, { status: 400 });
    }

    const dateStr = new Date(data.date).toISOString().split('T')[0];

    // Delete existing attendance for this class/date
    const { error: deleteError } = await supabase
      .from('Attendance')
      .delete()
      .eq('classId', data.classId)
      .eq('date', dateStr);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    const records = data.records.map((r: { studentId: string; status: string }) => ({
      studentId: r.studentId,
      classId: data.classId,
      date: dateStr,
      status: r.status,
      academicYearId: data.academicYearId || null,
    }));

    const { error: insertError } = await supabase
      .from('Attendance')
      .insert(records);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ count: records.length }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
