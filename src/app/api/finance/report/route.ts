import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const academicYearId = searchParams.get('academicYearId');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  // Fetch all income records
  let incomeQuery = supabase.from('Income').select('*');
  if (academicYearId) incomeQuery = incomeQuery.eq('academicYearId', academicYearId);
  if (from) incomeQuery = incomeQuery.gte('date', from);
  if (to) incomeQuery = incomeQuery.lte('date', to);

  // Fetch all expense records
  let expenseQuery = supabase.from('Expense').select('*');
  if (academicYearId) expenseQuery = expenseQuery.eq('academicYearId', academicYearId);
  if (from) expenseQuery = expenseQuery.gte('date', from);
  if (to) expenseQuery = expenseQuery.lte('date', to);

  // Fetch all salary records
  let salaryQuery = supabase.from('Salary').select('*');
  if (academicYearId) salaryQuery = salaryQuery.eq('academicYearId', academicYearId);

  const [incomeRes, expenseRes, salaryRes] = await Promise.all([incomeQuery, expenseQuery, salaryQuery]);

  if (incomeRes.error) {
    return NextResponse.json({ error: incomeRes.error.message }, { status: 500 });
  }
  if (expenseRes.error) {
    return NextResponse.json({ error: expenseRes.error.message }, { status: 500 });
  }
  if (salaryRes.error) {
    return NextResponse.json({ error: salaryRes.error.message }, { status: 500 });
  }

  const incomes = incomeRes.data || [];
  const expenses = expenseRes.data || [];
  const salaries = salaryRes.data || [];

  // Monthly breakdown
  const monthly: { month: string; income: number; expense: number }[] = [];
  const monthNames = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রি', 'মে', 'জুন', 'জুলা', 'আগ', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];

  for (let m = 0; m < 12; m++) {
    const monthIncome = incomes.filter((item) => {
      const d = new Date(item.date);
      return d.getMonth() === m;
    }).reduce((sum, item) => sum + (item.amount || 0), 0);

    const monthExpense = expenses.filter((item) => {
      const d = new Date(item.date);
      return d.getMonth() === m;
    }).reduce((sum, item) => sum + (item.amount || 0), 0);

    monthly.push({
      month: monthNames[m],
      income: monthIncome,
      expense: monthExpense,
    });
  }

  // Totals
  const totalIncomeAmount = incomes.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalExpensesAmount = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalSalaryPaid = salaries.reduce((sum, item) => sum + (item.netSalary || 0), 0);

  // Category breakdown
  const incomeCategoryMap = new Map<string, number>();
  incomes.forEach((item) => {
    const cat = item.category || 'অন্যান্য';
    incomeCategoryMap.set(cat, (incomeCategoryMap.get(cat) || 0) + (item.amount || 0));
  });
  const incomeByCategory = Array.from(incomeCategoryMap.entries()).map(([category, amount]) => ({ category, amount }));

  const expenseCategoryMap = new Map<string, number>();
  expenses.forEach((item) => {
    const cat = item.category || 'অন্যান্য';
    expenseCategoryMap.set(cat, (expenseCategoryMap.get(cat) || 0) + (item.amount || 0));
  });
  const expenseByCategory = Array.from(expenseCategoryMap.entries()).map(([category, amount]) => ({ category, amount }));

  return NextResponse.json({
    totalIncome: totalIncomeAmount + totalSalaryPaid,
    totalExpenses: totalExpensesAmount,
    totalSalaryPaid,
    balance: totalIncomeAmount - totalExpensesAmount,
    monthly,
    incomeByCategory,
    expenseByCategory,
  });
}
