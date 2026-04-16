import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-api';
import { requireAuth, isAuthResponse } from '@/lib/auth';

export async function GET() {
  try {
    const { data: items, error } = await supabase
      .from('AcademicYear')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('[AcademicYear GET] error:', error);
      return NextResponse.json({ error: 'সার্ভার ত্রুটি', detail: error.message }, { status: 500 });
    }

    // Fetch counts for each academic year
    const yearsWithCounts = await Promise.all(
      (items ?? []).map(async (year) => {
        const [
          { count: students },
          { count: exams },
          { count: incomes },
          { count: expenses },
          { count: salaries },
          { count: fees },
        ] = await Promise.all([
          supabase.from('Student').select('*', { count: 'exact', head: true }).eq('academicYearId', year.id),
          supabase.from('Exam').select('*', { count: 'exact', head: true }).eq('academicYearId', year.id),
          supabase.from('Income').select('*', { count: 'exact', head: true }).eq('academicYearId', year.id),
          supabase.from('Expense').select('*', { count: 'exact', head: true }).eq('academicYearId', year.id),
          supabase.from('Salary').select('*', { count: 'exact', head: true }).eq('academicYearId', year.id),
          supabase.from('StudentFee').select('*', { count: 'exact', head: true }).eq('academicYearId', year.id),
        ]);

        return {
          ...year,
          _count: {
            students: students ?? 0,
            exams: exams ?? 0,
            incomes: incomes ?? 0,
            expenses: expenses ?? 0,
            salaries: salaries ?? 0,
            fees: fees ?? 0,
          },
        };
      })
    );

    return NextResponse.json({ academicYears: yearsWithCounts });
  } catch (e) {
    console.error('[AcademicYear GET] catch:', e);
    return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthResponse(auth)) return auth;
  console.log('[AcademicYear POST] Auth OK, admin:', auth.username);

  try {
    const data = await request.json();
    if (!data.name) {
      return NextResponse.json({ error: 'শিক্ষাবর্ষের নাম দিন' }, { status: 400 });
    }
    // Deactivate other years if this one is active
    if (data.isActive) {
      const { error: deactivateError } = await supabase
        .from('AcademicYear')
        .update({ isActive: false })
        .eq('isActive', true);
      if (deactivateError) {
        console.error('[AcademicYear POST] deactivate error:', deactivateError);
        return NextResponse.json({ error: 'সার্ভার ত্রুটি', detail: deactivateError.message }, { status: 500 });
      }
    }
    const { data: item, error } = await supabase
      .from('AcademicYear')
      .insert([
        {
          name: data.name,
          nameEn: data.nameEn || null,
          startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
          endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
          isActive: data.isActive ?? true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[AcademicYear POST] insert error:', error);
      return NextResponse.json({ error: 'সার্ভার ত্রুটি', detail: error.message }, { status: 500 });
    }
    console.log('[AcademicYear POST] Created:', item);
    return NextResponse.json({ academicYear: item }, { status: 201 });
  } catch (e) {
    console.error('[AcademicYear POST] catch:', e);
    return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
