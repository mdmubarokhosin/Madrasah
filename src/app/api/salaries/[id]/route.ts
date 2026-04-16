import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-api';
import { requireAuth, isAuthResponse } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (isAuthResponse(auth)) return auth;

  const { id } = await params;
  try {
    const data = await request.json();
    const basicSalary = parseFloat(data.basicSalary) || 0;
    const allowance = parseFloat(data.allowance) || 0;
    const deduction = parseFloat(data.deduction) || 0;

    const { data: item, error } = await supabase
      .from('Salary')
      .update({
        employeeName: data.employeeName,
        designation: data.designation,
        month: data.month,
        year: data.year,
        basicSalary,
        allowance,
        deduction,
        netSalary: basicSalary + allowance - deduction,
        paymentStatus: data.paymentStatus,
        academicYearId: data.academicYearId,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
    }

    return NextResponse.json({ salary: item });
  } catch {
    return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (isAuthResponse(auth)) return auth;

  const { id } = await params;
  try {
    const { error } = await supabase
      .from('Salary')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: 'ডিলিট করা যায়নি' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'ডিলিট করা যায়নি' }, { status: 500 });
  }
}
