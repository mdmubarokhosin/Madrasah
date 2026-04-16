import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-api';

export async function GET() {
  try {
    const [
      { count: totalStudents },
      { count: totalExams },
      { count: totalResults },
      { count: totalNotices },
      { count: totalMessages },
      { count: unreadMessages },
      { count: totalClasses },
      { count: presentCount },
      { count: totalAttendance },
    ] = await Promise.all([
      supabase.from('Student').select('*', { count: 'exact', head: true }).eq('isActive', true),
      supabase.from('Exam').select('*', { count: 'exact', head: true }),
      supabase.from('Result').select('*', { count: 'exact', head: true }),
      supabase.from('Notice').select('*', { count: 'exact', head: true }).eq('isActive', true),
      supabase.from('ContactMessage').select('*', { count: 'exact', head: true }),
      supabase.from('ContactMessage').select('*', { count: 'exact', head: true }).eq('isRead', false),
      supabase.from('Class').select('*', { count: 'exact', head: true }).eq('isActive', true),
      supabase.from('Attendance').select('*', { count: 'exact', head: true }).eq('status', 'present'),
      supabase.from('Attendance').select('*', { count: 'exact', head: true }),
    ]);

    const { count: passCount } = await supabase
      .from('Result')
      .select('*', { count: 'exact', head: true })
      .eq('isPassed', true);
    const passRate = totalResults! > 0 ? parseFloat((((passCount ?? 0) / totalResults!) * 100).toFixed(1)) : 0;

    // Aggregate total income
    const { data: incomes } = await supabase.from('Income').select('amount');
    const totalIncome = (incomes ?? []).reduce((sum, i) => sum + (i.amount ?? 0), 0);

    // Aggregate total expenses
    const { data: expenses } = await supabase.from('Expense').select('amount');
    const totalExpenses = (expenses ?? []).reduce((sum, e) => sum + (e.amount ?? 0), 0);

    // Aggregate unpaid fees (status in ['unpaid', 'partial'])
    const { data: unpaidFees } = await supabase
      .from('StudentFee')
      .select('dueAmount')
      .in('status', ['unpaid', 'partial']);
    const totalUnpaidFees = (unpaidFees ?? []).reduce((sum, f) => sum + (f.dueAmount ?? 0), 0);

    const attendanceRate = totalAttendance! > 0 ? parseFloat((((presentCount ?? 0) / totalAttendance!) * 100).toFixed(1)) : 0;

    return NextResponse.json({
      totalStudents: totalStudents ?? 0,
      totalExams: totalExams ?? 0,
      totalResults: totalResults ?? 0,
      totalNotices: totalNotices ?? 0,
      totalMessages: totalMessages ?? 0,
      unreadMessages: unreadMessages ?? 0,
      passRate,
      totalClasses: totalClasses ?? 0,
      totalIncome,
      totalExpenses,
      unpaidFees: totalUnpaidFees,
      attendanceRate,
    });
  } catch {
    return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
