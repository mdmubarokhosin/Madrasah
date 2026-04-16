import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-api';
import { requireAuth, isAuthResponse } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const academicYearId = searchParams.get('academicYearId');
  const paymentStatus = searchParams.get('paymentStatus');
  const month = searchParams.get('month');
  const year = searchParams.get('year');

  let query = supabase
    .from('Salary')
    .select('*')
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .limit(200);

  if (academicYearId) {
    query = query.eq('academicYearId', academicYearId);
  }
  if (paymentStatus) {
    query = query.eq('paymentStatus', paymentStatus);
  }
  if (month) {
    query = query.eq('month', month);
  }
  if (year) {
    query = query.eq('year', parseInt(year));
  }

  const { data: items, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Calculate totalPaid and totalUnpaid from the fetched items
  const totalPaid = (items || []).filter(s => s.paymentStatus === 'paid').reduce((sum, s) => sum + (s.netSalary || 0), 0);
  const totalUnpaid = (items || []).filter(s => s.paymentStatus === 'unpaid').reduce((sum, s) => sum + (s.netSalary || 0), 0);

  return NextResponse.json({ salaries: items || [], totalPaid, totalUnpaid });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthResponse(auth)) return auth;

  try {
    const data = await request.json();
    if (!data.employeeName || !data.month || !data.year) {
      return NextResponse.json({ error: 'কর্মীর নাম, মাস ও বছর দিন' }, { status: 400 });
    }

    const basicSalary = parseFloat(data.basicSalary) || 0;
    const allowance = parseFloat(data.allowance) || 0;
    const deduction = parseFloat(data.deduction) || 0;
    const netSalary = basicSalary + allowance - deduction;

    const insertData: Record<string, unknown> = {
      employeeName: data.employeeName,
      designation: data.designation || null,
      month: data.month,
      year: data.year,
      basicSalary,
      allowance,
      deduction,
      netSalary,
      paymentStatus: data.paymentStatus || 'unpaid',
      academicYearId: data.academicYearId || null,
    };

    const { data: item, error } = await supabase
      .from('Salary')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ salary: item }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
