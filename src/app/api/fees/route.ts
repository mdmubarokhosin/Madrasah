import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-api';
import { requireAuth, isAuthResponse } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');
  const academicYearId = searchParams.get('academicYearId');
  const status = searchParams.get('status');
  const classId = searchParams.get('classId');

  let query = supabase
    .from('StudentFee')
    .select('*, student:Student(id, name, roll, class:Class(name))')
    .order('createdAt', { ascending: false })
    .limit(300);

  if (studentId) {
    query = query.eq('studentId', studentId);
  }
  if (academicYearId) {
    query = query.eq('academicYearId', academicYearId);
  }
  if (status) {
    query = query.eq('status', status);
  }

  // If classId filter, first get studentIds from that class
  if (classId) {
    const { data: classStudents, error: classError } = await supabase
      .from('Student')
      .select('id')
      .eq('classId', classId);

    if (classError) {
      return NextResponse.json({ error: classError.message }, { status: 500 });
    }

    const studentIds = (classStudents || []).map(s => s.id);
    if (studentIds.length === 0) {
      return NextResponse.json({
        fees: [],
        totalAmount: 0,
        totalPaid: 0,
        totalDue: 0,
      });
    }
    query = query.in('studentId', studentIds);
  }

  const { data: items, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const fees = items || [];
  const totalAmount = fees.reduce((sum, f) => sum + (f.amount || 0), 0);
  const totalPaid = fees.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
  const totalDue = fees.reduce((sum, f) => sum + (f.dueAmount || 0), 0);

  return NextResponse.json({
    fees,
    totalAmount,
    totalPaid,
    totalDue,
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthResponse(auth)) return auth;

  try {
    const data = await request.json();
    if (!data.studentId || !data.feeType || !data.amount) {
      return NextResponse.json({ error: 'শিক্ষার্থী, ফি ধরন ও পরিমাণ দিন' }, { status: 400 });
    }

    const amount = parseFloat(data.amount) || 0;
    const paidAmount = data.paidAmount ? parseFloat(data.paidAmount) : 0;
    const dueAmount = amount - paidAmount;
    const feeStatus = data.status || (paidAmount >= amount ? 'paid' : 'unpaid');

    const insertData: Record<string, unknown> = {
      studentId: data.studentId,
      academicYearId: data.academicYearId || null,
      feeType: data.feeType,
      amount,
      paidAmount,
      dueAmount,
      status: feeStatus,
      month: data.month || null,
      paymentDate: data.paymentDate ? new Date(data.paymentDate).toISOString() : null,
    };

    const { data: item, error } = await supabase
      .from('StudentFee')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ fee: item }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
