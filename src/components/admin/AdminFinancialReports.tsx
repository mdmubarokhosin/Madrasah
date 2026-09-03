'use client';

import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calendar, ArrowUpRight, ArrowDownRight, Download, FileText, Filter } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';

/* ------------------------------------------------------------------ */
/*  Colors                                                             */
/* ------------------------------------------------------------------ */

const CHART_COLORS = ['#166534', '#dc2626', '#ca8a04', '#0891b2', '#7c3aed', '#db2777', '#ea580c', '#4f46e5'];
const PIE_COLORS = ['#166534', '#dc2626', '#ca8a04', '#0891b2', '#7c3aed', '#db2777', '#ea580c', '#4f46e5', '#65a30d', '#0d9488'];

/* ------------------------------------------------------------------ */
/*  Helper: get YYYY-MM from a timestamp or date string                */
/* ------------------------------------------------------------------ */

function getYM(timestamp: number | undefined, dateStr?: string): string {
  if (timestamp) {
    const d = new Date(timestamp);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  if (dateStr) {
    return dateStr.substring(0, 7);
  }
  return '';
}

function getMonthIndex(ym: string): number {
  return parseInt(ym.split('-')[1], 10) - 1;
}

function toTaka(n: number): string {
  return '৳' + n.toLocaleString('bn-BD');
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function pctStr(current: number, previous: number): string {
  const p = pctChange(current, previous);
  if (p > 0) return `+${p}%`;
  if (p < 0) return `${p}%`;
  return '0%';
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminFinancialReports() {
  const { t } = useTranslation();
  const donations = useAppStore((s) => s.donations);
  const expenses = useAppStore((s) => s.expenses);
  const salaryRecords = useAppStore((s) => s.salaryRecords);
  const payments = useAppStore((s) => s.payments);
  const feePayments = useAppStore((s) => s.feePayments);
  const vouchers = useAppStore((s) => s.vouchers);
  const donationSubscriptions = useAppStore((s) => s.donationSubscriptions);

  const now = new Date();
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => now.toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('overview');

  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevYM = (() => {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();

  /* Filter data by date range */
  const startTs = new Date(startDate).getTime();
  const endTs = new Date(endDate).getTime() + 86400000; // include end date

  const filteredPayments = useMemo(() =>
    payments.filter((p) => p.status === 'success' && p.createdAt && p.createdAt >= startTs && p.createdAt <= endTs),
    [payments, startTs, endTs]
  );

  const filteredFeePayments = useMemo(() =>
    feePayments.filter((p) => p.status === 'paid' && p.createdAt && p.createdAt >= startTs && p.createdAt <= endTs),
    [feePayments, startTs, endTs]
  );

  const filteredExpenses = useMemo(() =>
    expenses.filter((e) => e.status === 'approved' && e.createdAt && e.createdAt >= startTs && e.createdAt <= endTs),
    [expenses, startTs, endTs]
  );

  const filteredSalary = useMemo(() =>
    salaryRecords.filter((r) => r.status === 'paid' && r.createdAt && r.createdAt >= startTs && r.createdAt <= endTs),
    [salaryRecords, startTs, endTs]
  );

  /* Total calculations for date range */
  const totalIncome = useMemo(() => {
    const donationCollected = donations.reduce((s, d) => s + (d.collected || 0), 0);
    const paymentTotal = filteredPayments.reduce((s, p) => s + (p.amount || 0), 0);
    const feeTotal = filteredFeePayments.reduce((s, p) => s + (p.paidAmount || 0), 0);
    return donationCollected + paymentTotal + feeTotal;
  }, [donations, filteredPayments, filteredFeePayments]);

  const totalExpense = useMemo(() => {
    const expTotal = filteredExpenses.reduce((s, e) => s + (e.amount || 0), 0);
    const salTotal = filteredSalary.reduce((s, r) => s + (r.paidAmount || 0), 0);
    return expTotal + salTotal;
  }, [filteredExpenses, filteredSalary]);

  const netBalance = totalIncome - totalExpense;

  /* This month calculations */
  const thisMonthIncome = useMemo(() => {
    const paymentMonth = payments.filter((p) => p.status === 'success' && getYM(p.createdAt) === currentYM).reduce((s, p) => s + (p.amount || 0), 0);
    const feeMonth = feePayments.filter((p) => p.status === 'paid' && getYM(p.createdAt) === currentYM).reduce((s, p) => s + (p.paidAmount || 0), 0);
    const donationsTotal = donations.reduce((s, d) => s + (d.collected || 0), 0);
    return paymentMonth + feeMonth + donationsTotal;
  }, [payments, feePayments, donations, currentYM]);

  const lastMonthIncome = useMemo(() => {
    const paymentMonth = payments.filter((p) => p.status === 'success' && getYM(p.createdAt) === prevYM).reduce((s, p) => s + (p.amount || 0), 0);
    const feeMonth = feePayments.filter((p) => p.status === 'paid' && getYM(p.createdAt) === prevYM).reduce((s, p) => s + (p.paidAmount || 0), 0);
    return paymentMonth + feeMonth;
  }, [payments, feePayments, prevYM]);

  const thisMonthExpense = useMemo(() => {
    const expMonth = expenses.filter((e) => e.status === 'approved' && getYM(e.createdAt) === currentYM).reduce((s, e) => s + (e.amount || 0), 0);
    const salMonth = salaryRecords.filter((r) => r.status === 'paid' && getYM(r.createdAt) === currentYM).reduce((s, r) => s + (r.paidAmount || 0), 0);
    return expMonth + salMonth;
  }, [expenses, salaryRecords, currentYM]);

  const lastMonthExpense = useMemo(() => {
    const expMonth = expenses.filter((e) => e.status === 'approved' && getYM(e.createdAt) === prevYM).reduce((s, e) => s + (e.amount || 0), 0);
    const salMonth = salaryRecords.filter((r) => r.status === 'paid' && getYM(r.createdAt) === prevYM).reduce((s, r) => s + (r.paidAmount || 0), 0);
    return expMonth + salMonth;
  }, [expenses, salaryRecords, prevYM]);

  /* Income vs Expense Bar Chart Data - last 6 months from real data */
  const barChartData = useMemo(() => {
    const months = t('adminFinancialReports.monthsShort').split(',');
    const data: { name: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthName = months[d.getMonth()];

      const monthPayments = payments.filter((p) => p.status === 'success' && getYM(p.createdAt) === ym).reduce((s, p) => s + (p.amount || 0), 0);
      const monthFee = feePayments.filter((p) => p.status === 'paid' && getYM(p.createdAt) === ym).reduce((s, p) => s + (p.paidAmount || 0), 0);
      const income = monthPayments + monthFee;

      const monthExpenses = expenses.filter((e) => e.status === 'approved' && getYM(e.createdAt) === ym).reduce((s, e) => s + (e.amount || 0), 0);
      const monthSalary = salaryRecords.filter((r) => r.status === 'paid' && getYM(r.createdAt) === ym).reduce((s, r) => s + (r.paidAmount || 0), 0);
      const expense = monthExpenses + monthSalary;

      data.push({ name: monthName, income, expense });
    }
    return data;
  }, [payments, expenses, salaryRecords, feePayments, t]);

  /* Monthly Trend Line Chart - last 12 months from real data */
  const trendData = useMemo(() => {
    const months = t('adminFinancialReports.monthsShort').split(',');
    const data: { name: string; income: number; expense: number; balance: number }[] = [];
    let cumBalance = 0;
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthName = months[d.getMonth()];

      const income = payments.filter((p) => p.status === 'success' && getYM(p.createdAt) === ym).reduce((s, p) => s + (p.amount || 0), 0)
        + feePayments.filter((p) => p.status === 'paid' && getYM(p.createdAt) === ym).reduce((s, p) => s + (p.paidAmount || 0), 0);

      const expense = expenses.filter((e) => e.status === 'approved' && getYM(e.createdAt) === ym).reduce((s, e) => s + (e.amount || 0), 0)
        + salaryRecords.filter((r) => r.status === 'paid' && getYM(r.createdAt) === ym).reduce((s, r) => s + (r.paidAmount || 0), 0);

      cumBalance += income - expense;
      data.push({ name: monthName, income, expense, balance: cumBalance });
    }
    return data;
  }, [payments, expenses, salaryRecords, feePayments, t]);

  /* Expense Categories Pie Chart - real data */
  const pieData = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    expenses.filter((e) => e.status === 'approved').forEach((e) => {
      const cat = e.category || t('adminFinancialReports.otherCategory');
      categoryMap[cat] = (categoryMap[cat] || 0) + (e.amount || 0);
    });
    return Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses, t]);

  /* Income Source Breakdown */
  const incomeBreakdown = useMemo(() => {
    const onlinePayments = filteredPayments.reduce((s, p) => s + (p.amount || 0), 0);
    const feeCollected = filteredFeePayments.reduce((s, p) => s + (p.paidAmount || 0), 0);
    const donationsTotal = donations.reduce((s, d) => s + (d.collected || 0), 0);
    return [
      { name: t('adminFinancialReports.srcOnline'), value: onlinePayments, color: '#166534' },
      { name: t('adminFinancialReports.srcFeeCollected'), value: feeCollected, color: '#0891b2' },
      { name: t('adminFinancialReports.srcFunds'), value: donationsTotal, color: '#ca8a04' },
    ].filter((d) => d.value > 0);
  }, [filteredPayments, filteredFeePayments, donations, t]);

  /* Recent transactions */
  const recentTransactions = useMemo(() => {
    const txns: { id: string; type: 'income' | 'expense'; title: string; amount: number; date: string; source: string }[] = [];

    filteredPayments.forEach((p) => {
      txns.push({
        id: p.id,
        type: 'income',
        title: p.full_name || t('adminFinancialReports.txTitleUnknown'),
        amount: p.amount || 0,
        date: p.createdAt ? new Date(p.createdAt).toLocaleDateString('bn-BD') : '',
        source: t('adminFinancialReports.srcOnline'),
      });
    });

    filteredFeePayments.forEach((p) => {
      txns.push({
        id: p.id,
        type: 'income',
        title: p.studentName || p.studentRoll || t('adminFinancialReports.txTitleFee'),
        amount: p.paidAmount || 0,
        date: p.createdAt ? new Date(p.createdAt).toLocaleDateString('bn-BD') : '',
        source: t('adminFinancialReports.srcFeePayment'),
      });
    });

    filteredExpenses.forEach((e) => {
      txns.push({
        id: e.id,
        type: 'expense',
        title: e.title,
        amount: e.amount || 0,
        date: e.createdAt ? new Date(e.createdAt).toLocaleDateString('bn-BD') : '',
        source: e.category || t('adminFinancialReports.seriesExpense'),
      });
    });

    filteredSalary.forEach((r) => {
      txns.push({
        id: r.id,
        type: 'expense',
        title: r.teacherName || t('adminFinancialReports.txTitleSalary'),
        amount: r.paidAmount || 0,
        date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('bn-BD') : '',
        source: t('adminFinancialReports.srcSalary', { month: r.month, year: r.year }),
      });
    });

    return txns.sort((a, b) => {
      const da = a.date || '0';
      const db = b.date || '0';
      return db.localeCompare(da);
    }).slice(0, 20);
  }, [filteredPayments, filteredFeePayments, filteredExpenses, filteredSalary, t]);

  /* Custom tooltip for charts */
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold text-islamic-dark mb-1">{label}</p>
        {payload.map((entry: any, idx: number) => (
          <p key={idx} style={{ color: entry.color }} className="flex justify-between gap-4">
            <span>{entry.name}:</span>
            <span className="font-medium">{toTaka(entry.value)}</span>
          </p>
        ))}
      </div>
    );
  };

  /* Empty state component */
  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-islamic-lighter flex items-center justify-center mb-3">
        <FileText className="size-8 text-islamic/40" />
      </div>
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );

  const hasAnyData = totalIncome > 0 || totalExpense > 0 || donations.some((d) => (d.collected || 0) > 0);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-islamic-dark">{t('adminFinancialReports.title')}</h2>
          <p className="text-muted-foreground text-sm mt-1">{t('adminFinancialReports.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs cursor-pointer"
            onClick={() => {
              const csvRows = [t('adminFinancialReports.csvHeader')];
              recentTransactions.forEach((txn) => {
                csvRows.push(`${txn.type === 'income' ? t('adminFinancialReports.seriesIncome') : t('adminFinancialReports.seriesExpense')},${txn.title},${txn.amount},${txn.date},${txn.source}`);
              });
              const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `financial-report-${startDate}-to-${endDate}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="size-3.5" />
            {t('adminFinancialReports.csvDownload')}
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card className="shadow-sm">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-muted-foreground shrink-0" />
              <Label className="text-sm text-muted-foreground whitespace-nowrap">{t('adminFinancialReports.dateRange')}</Label>
            </div>
            <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full xs:w-auto text-sm"
              />
              <span className="text-muted-foreground text-center hidden xs:block">—</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full xs:w-auto text-sm"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs cursor-pointer whitespace-nowrap"
              onClick={() => {
                const d = new Date();
                d.setMonth(d.getMonth() - 6);
                setStartDate(d.toISOString().split('T')[0]);
                setEndDate(new Date().toISOString().split('T')[0]);
              }}
            >
              {t('adminFinancialReports.last6Months')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs cursor-pointer whitespace-nowrap"
              onClick={() => {
                const d = new Date();
                d.setFullYear(d.getFullYear() - 1);
                setStartDate(d.toISOString().split('T')[0]);
                setEndDate(new Date().toISOString().split('T')[0]);
              }}
            >
              {t('adminFinancialReports.last1Year')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs cursor-pointer whitespace-nowrap"
              onClick={() => {
                setStartDate('2020-01-01');
                setEndDate(new Date().toISOString().split('T')[0]);
              }}
            >
              {t('adminFinancialReports.allTime')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="size-7 sm:size-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <TrendingUp className="size-3.5 sm:size-4 text-green-600" />
              </div>
              <span className="text-xs text-muted-foreground">{t('adminFinancialReports.totalIncome')}</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-green-600">{toTaka(totalIncome)}</p>
            <div className="flex items-center gap-1 mt-1">
              {thisMonthIncome > 0 || lastMonthIncome > 0 ? (
                <>
                  <ArrowUpRight className="size-3 text-green-500" />
                  <span className="text-xs text-green-600">
                    {t('adminFinancialReports.vsLastMonth', { pct: pctStr(thisMonthIncome, lastMonthIncome) })}
                  </span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">{t('adminFinancialReports.noIncomeThisMonth')}</span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="size-7 sm:size-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <TrendingDown className="size-3.5 sm:size-4 text-red-600" />
              </div>
              <span className="text-xs text-muted-foreground">{t('adminFinancialReports.totalExpense')}</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-red-600">{toTaka(totalExpense)}</p>
            <div className="flex items-center gap-1 mt-1">
              {thisMonthExpense > 0 || lastMonthExpense > 0 ? (
                <>
                  <ArrowDownRight className="size-3 text-red-500" />
                  <span className="text-xs text-red-600">
                    {t('adminFinancialReports.vsLastMonth', { pct: pctStr(thisMonthExpense, lastMonthExpense) })}
                  </span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">{t('adminFinancialReports.noExpenseThisMonth')}</span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="size-7 sm:size-8 rounded-full bg-islamic/10 flex items-center justify-center shrink-0">
                <DollarSign className="size-3.5 sm:size-4 text-islamic" />
              </div>
              <span className="text-xs text-muted-foreground">{t('adminFinancialReports.netBalance')}</span>
            </div>
            <p className={`text-lg sm:text-2xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {toTaka(netBalance)}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-muted-foreground">{t('adminFinancialReports.incomeMinusExpense')}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="size-7 sm:size-8 rounded-full bg-golden-lighter flex items-center justify-center shrink-0">
                <Calendar className="size-3.5 sm:size-4 text-golden" />
              </div>
              <span className="text-xs text-muted-foreground">{t('adminFinancialReports.thisMonthSummary')}</span>
            </div>
            <p className="text-sm font-semibold text-islamic-dark">{t('adminFinancialReports.incomeAmount', { amount: toTaka(thisMonthIncome) })}</p>
            <p className="text-sm text-red-600">{t('adminFinancialReports.expenseAmount', { amount: toTaka(thisMonthExpense) })}</p>
            <p className={`text-xs font-semibold mt-1 ${thisMonthIncome - thisMonthExpense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {t('adminFinancialReports.balanceAmount', { amount: toTaka(thisMonthIncome - thisMonthExpense) })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Charts, Transactions, Details */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">{t('adminFinancialReports.tabCharts')}</TabsTrigger>
          <TabsTrigger value="transactions" className="text-xs sm:text-sm">{t('adminFinancialReports.tabTransactions')}</TabsTrigger>
          <TabsTrigger value="details" className="text-xs sm:text-sm">{t('adminFinancialReports.tabDetails')}</TabsTrigger>
        </TabsList>

        {/* Charts Tab */}
        <TabsContent value="overview" className="space-y-6">
          {!hasAnyData ? (
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <EmptyState message={t('adminFinancialReports.emptyAll')} />
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Income vs Expense Bar Chart */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                    <CardTitle className="text-sm sm:text-base font-semibold text-islamic-dark">{t('adminFinancialReports.incomeVsExpense')}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
                    {barChartData.every((d) => d.income === 0 && d.expense === 0) ? (
                      <EmptyState message={t('adminFinancialReports.noDataRange')} />
                    ) : (
                      <div className="h-56 sm:h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={barChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Bar dataKey="income" name={t('adminFinancialReports.seriesIncome')} fill="#166534" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expense" name={t('adminFinancialReports.seriesExpense')} fill="#dc2626" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Monthly Trend Line Chart */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                    <CardTitle className="text-sm sm:text-base font-semibold text-islamic-dark">{t('adminFinancialReports.monthlyTrend')}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
                    {trendData.every((d) => d.income === 0 && d.expense === 0) ? (
                      <EmptyState message={t('adminFinancialReports.noTransactions12')} />
                    ) : (
                      <div className="h-56 sm:h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Area type="monotone" dataKey="income" name={t('adminFinancialReports.seriesIncome')} stroke="#166534" fill="#16653420" strokeWidth={2} dot={{ r: 3 }} />
                            <Area type="monotone" dataKey="expense" name={t('adminFinancialReports.seriesExpense')} stroke="#dc2626" fill="#dc262620" strokeWidth={2} dot={{ r: 3 }} />
                            <Line type="monotone" dataKey="balance" name={t('adminFinancialReports.seriesBalance')} stroke="#ca8a04" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Pie Chart - Expense Categories */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                    <CardTitle className="text-sm sm:text-base font-semibold text-islamic-dark">{t('adminFinancialReports.expenseCategories')}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
                    {pieData.length === 0 ? (
                      <EmptyState message={t('adminFinancialReports.noApprovedExpenses')} />
                    ) : (
                      <div className="h-56 sm:h-72 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              outerRadius={window.innerWidth < 640 ? 70 : 90}
                              dataKey="value"
                              label={({ name, percent }) => window.innerWidth >= 640 ? `${name} (${(percent * 100).toFixed(0)}%)` : `${(percent * 100).toFixed(0)}%`}
                              labelLine={window.innerWidth >= 640 ? { stroke: '#9ca3af' } : false}
                            >
                              {pieData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => toTaka(value)} contentStyle={{ borderRadius: '8px', fontSize: 12 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Income Source Breakdown */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                    <CardTitle className="text-sm sm:text-base font-semibold text-islamic-dark">{t('adminFinancialReports.incomeSources')}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                    {incomeBreakdown.length === 0 ? (
                      <EmptyState message={t('adminFinancialReports.noIncomeData')} />
                    ) : (
                      <div className="space-y-4">
                        {incomeBreakdown.map((item) => {
                          const total = incomeBreakdown.reduce((s, d) => s + d.value, 0);
                          const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
                          return (
                            <div key={item.name}>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-sm text-muted-foreground">{item.name}</span>
                                <span className="text-sm font-bold" style={{ color: item.color }}>{toTaka(item.value)}</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2.5">
                                <div
                                  className="h-2.5 rounded-full transition-all duration-500"
                                  style={{ width: `${pct}%`, backgroundColor: item.color }}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{pct}%</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          {/* Desktop Table */}
          <Card className="shadow-sm hidden md:block">
            <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
              <CardTitle className="text-sm sm:text-base font-semibold text-islamic-dark">
                {t('adminFinancialReports.recentTransactions', { count: recentTransactions.length })}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
              {recentTransactions.length === 0 ? (
                <EmptyState message={t('adminFinancialReports.noTransactionsRange')} />
              ) : (
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-sm min-w-[400px]">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">{t('common.type')}</th>
                        <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">{t('common.description')}</th>
                        <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">{t('adminFinancialReports.thSource')}</th>
                        <th className="text-right py-2 px-2 text-xs font-semibold text-muted-foreground">{t('common.amount')}</th>
                        <th className="text-right py-2 px-2 text-xs font-semibold text-muted-foreground hidden sm:table-cell">{t('common.date')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTransactions.map((txn) => (
                        <tr key={txn.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 px-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              txn.type === 'income'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {txn.type === 'income' ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                              {txn.type === 'income' ? t('adminFinancialReports.seriesIncome') : t('adminFinancialReports.seriesExpense')}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-islamic-dark font-medium max-w-[120px] truncate">{txn.title}</td>
                          <td className="py-2.5 px-2 text-muted-foreground text-xs max-w-[100px] truncate">{txn.source}</td>
                          <td className={`py-2.5 px-2 text-right font-semibold ${txn.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {txn.type === 'income' ? '+' : '-'}{toTaka(txn.amount)}
                          </td>
                          <td className="py-2.5 px-2 text-right text-muted-foreground text-xs hidden sm:table-cell">{txn.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mobile Cards */}
          <div className="md:hidden">
            <h3 className="text-sm font-semibold text-islamic-dark mb-3">
              {t('adminFinancialReports.recentTransactions', { count: recentTransactions.length })}
            </h3>
            {recentTransactions.length === 0 ? (
              <EmptyState message={t('adminFinancialReports.noTransactionsRange')} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recentTransactions.map((txn) => (
                  <Card key={txn.id} className="shadow-sm">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${
                              txn.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {txn.type === 'income' ? <ArrowUpRight className="size-2.5" /> : <ArrowDownRight className="size-2.5" />}
                              {txn.type === 'income' ? t('adminFinancialReports.seriesIncome') : t('adminFinancialReports.seriesExpense')}
                            </span>
                            <p className="text-xs text-muted-foreground">{txn.date}</p>
                          </div>
                          <p className="font-bold text-sm truncate mt-1">{txn.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{txn.source}</p>
                        </div>
                        <p className={`text-sm font-semibold shrink-0 ${txn.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {txn.type === 'income' ? '+' : '-'}{toTaka(txn.amount)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Quick Stats */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className="text-sm sm:text-base font-semibold text-islamic-dark">{t('adminFinancialReports.quickStats')}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-green-50">
                    <span className="text-xs sm:text-sm text-muted-foreground">{t('adminFinancialReports.statDonationsCollected')}</span>
                    <span className="text-xs sm:text-sm font-bold text-green-600">{toTaka(donations.reduce((s, d) => s + (d.collected || 0), 0))}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-blue-50">
                    <span className="text-xs sm:text-sm text-muted-foreground">{t('adminFinancialReports.statOnlinePayments')}</span>
                    <span className="text-xs sm:text-sm font-bold text-blue-600">{toTaka(payments.filter((p) => p.status === 'success').reduce((s, p) => s + (p.amount || 0), 0))}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-purple-50">
                    <span className="text-xs sm:text-sm text-muted-foreground">{t('adminFinancialReports.srcFeeCollected')}</span>
                    <span className="text-xs sm:text-sm font-bold text-purple-600">{toTaka(feePayments.filter((p) => p.status === 'paid').reduce((s, p) => s + (p.paidAmount || 0), 0))}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-red-50">
                    <span className="text-xs sm:text-sm text-muted-foreground">{t('adminFinancialReports.statApprovedExpenses')}</span>
                    <span className="text-xs sm:text-sm font-bold text-red-600">{toTaka(expenses.filter((e) => e.status === 'approved').reduce((s, e) => s + (e.amount || 0), 0))}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-orange-50">
                    <span className="text-xs sm:text-sm text-muted-foreground">{t('adminFinancialReports.statSalaryPaid')}</span>
                    <span className="text-xs sm:text-sm font-bold text-orange-600">{toTaka(salaryRecords.filter((r) => r.status === 'paid').reduce((s, r) => s + (r.paidAmount || 0), 0))}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-islamic/5">
                    <span className="text-xs sm:text-sm text-muted-foreground">{t('adminFinancialReports.statVouchers')}</span>
                    <span className="text-xs sm:text-sm font-bold text-islamic-dark">{t('adminFinancialReports.countItems', { count: vouchers.length })}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-yellow-50">
                    <span className="text-xs sm:text-sm text-muted-foreground">{t('adminFinancialReports.statActiveSubscriptions')}</span>
                    <span className="text-xs sm:text-sm font-bold text-yellow-700">{t('adminFinancialReports.countItems', { count: donationSubscriptions.filter((s) => s.status === 'active').length })}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-cyan-50">
                    <span className="text-xs sm:text-sm text-muted-foreground">{t('adminFinancialReports.statSuccessfulPayments')}</span>
                    <span className="text-xs sm:text-sm font-bold text-cyan-700">{t('adminFinancialReports.countItems', { count: payments.filter((p) => p.status === 'success').length })}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expense category breakdown */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className="text-sm sm:text-base font-semibold text-islamic-dark">{t('adminFinancialReports.expenseByCategory')}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                {pieData.length === 0 ? (
                  <EmptyState message={t('adminFinancialReports.noApprovedExpenses')} />
                ) : (
                  <div className="space-y-3">
                    {pieData.map((item, idx) => {
                      const total = pieData.reduce((s, d) => s + d.value, 0);
                      const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
                      return (
                        <div key={item.name} className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs sm:text-sm text-muted-foreground truncate">{item.name}</span>
                              <span className="text-xs sm:text-sm font-bold text-islamic-dark">{toTaka(item.value)}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Salary summary by department */}
            <Card className="shadow-sm lg:col-span-2">
              <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className="text-sm sm:text-base font-semibold text-islamic-dark">{t('adminFinancialReports.salarySummary')}</CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
                {(() => {
                  const deptMap: Record<string, { paid: number; unpaid: number; count: number }> = {};
                  salaryRecords.forEach((r) => {
                    const dept = r.department || t('adminFinancialReports.otherCategory');
                    if (!deptMap[dept]) deptMap[dept] = { paid: 0, unpaid: 0, count: 0 };
                    deptMap[dept].count++;
                    if (r.status === 'paid') deptMap[dept].paid += r.paidAmount || 0;
                    else deptMap[dept].unpaid += r.netSalary || 0;
                  });
                  const depts = Object.entries(deptMap);
                  if (depts.length === 0) return <EmptyState message={t('adminFinancialReports.noSalaryRecords')} />;
                  return (
                    <div className="overflow-x-auto -mx-1">
                      <table className="w-full text-sm min-w-[350px]">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">{t('adminFinancialReports.thDepartment')}</th>
                            <th className="text-center py-2 px-2 text-xs font-semibold text-muted-foreground">{t('adminFinancialReports.thTeacherCount')}</th>
                            <th className="text-right py-2 px-2 text-xs font-semibold text-muted-foreground">{t('adminFinancialReports.thPaid')}</th>
                            <th className="text-right py-2 px-2 text-xs font-semibold text-muted-foreground">{t('adminFinancialReports.thUnpaid')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {depts.map(([dept, data]) => (
                            <tr key={dept} className="border-b border-border/50 hover:bg-muted/30">
                              <td className="py-2.5 px-2 font-medium text-islamic-dark">{dept}</td>
                              <td className="py-2.5 px-2 text-center">{data.count}</td>
                              <td className="py-2.5 px-2 text-right text-green-600 font-semibold">{toTaka(data.paid)}</td>
                              <td className="py-2.5 px-2 text-right text-red-600 font-semibold">{toTaka(data.unpaid)}</td>
                            </tr>
                          ))}
                          <tr className="font-bold">
                            <td className="py-2.5 px-2 text-islamic-dark">{t('common.total')}</td>
                            <td className="py-2.5 px-2 text-center">{salaryRecords.length}</td>
                            <td className="py-2.5 px-2 text-right text-green-600">{toTaka(salaryRecords.filter((r) => r.status === 'paid').reduce((s, r) => s + (r.paidAmount || 0), 0))}</td>
                            <td className="py-2.5 px-2 text-right text-red-600">{toTaka(salaryRecords.filter((r) => r.status !== 'paid').reduce((s, r) => s + (r.netSalary || 0), 0))}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
