'use client';

import { useMemo } from 'react';
import {
  UserCheck,
  Users,
  Bell,
  FileText,
  Plus,
  Award,
  CalendarDays,
  ArrowRight,
  HandCoins,
  UserPlus,
  MailOpen,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  ShieldCheck,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import type { AdminPage } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

/* ------------------------------------------------------------------ */
/*  Chart.js registration (same pattern as AdminFinancialReports)      */
/* ------------------------------------------------------------------ */

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

/* Chart.js canvas text (labels, ticks, tooltips) should match the app's Bengali font */
ChartJS.defaults.font.family = "'Noto Serif Bangla', ui-serif, Georgia, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

/* Tasteful palette for the content doughnut (greens + gold — no blues) */
const CONTENT_COLORS = ['#0485f7', '#17c964', '#f5a524', '#18181b', '#71717a', '#ff383c'];

/* ------------------------------------------------------------------ */
/*  Chart.js shared option fragments (module scope, same as reports)   */
/* ------------------------------------------------------------------ */

/* Compact "k" tick format — same compact formatting as AdminFinancialReports */
const compactKTick = (value: string | number): string => `${(Number(value) / 1000).toFixed(0)}k`;

const chartLegendOptions = {
  position: 'bottom' as const,
  labels: { font: { size: 12 }, usePointStyle: true, boxWidth: 8, padding: 16 },
};

/* White tooltip card, matching the app's card styling */
const chartTooltipOptions = {
  backgroundColor: '#ffffff',
  titleColor: '#18181b',
  bodyColor: '#71717a',
  borderColor: '#e4e4e7',
  borderWidth: 1,
  padding: 10,
  cornerRadius: 8,
  boxPadding: 4,
};

const monthXScale = {
  border: { display: false },
  grid: { display: false },
  ticks: { font: { size: 11 } },
};

const currencyYScale = {
  beginAtZero: true,
  border: { display: false },
  grid: { color: '#e4e4e7' },
  ticks: { font: { size: 11 }, callback: compactKTick },
};

/* ------------------------------------------------------------------ */
/*  Helpers (replicated from AdminFinancialReports)                    */
/* ------------------------------------------------------------------ */

/* YYYY-MM from a timestamp (falls back to a date string) */
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

/* Full currency for tooltips / stat cards — same convention as AdminFinancialReports */
function toTaka(n: number): string {
  return '৳' + n.toLocaleString('bn-BD');
}

/* ------------------------------------------------------------------ */
/*  Empty state for charts / lists (module scope component)            */
/* ------------------------------------------------------------------ */

interface EmptyStateProps {
  icon: React.ReactNode;
  message: string;
}

function EmptyState({ icon, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 rounded-full bg-islamic-lighter flex items-center justify-center mb-3">
        <span className="text-islamic/40">{icon}</span>
      </div>
      <p className="text-muted-foreground text-sm max-w-xs">{message}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat card component                                                */
/* ------------------------------------------------------------------ */

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  bgClass: string;
  iconColorClass: string;
  compact?: boolean;
}

function StatCard({ title, value, icon, bgClass, iconColorClass, compact }: StatCardProps) {
  return (
    <Card className="card-cinema rounded-2xl">
      <CardContent className="p-3 sm:p-5 flex items-center gap-2.5 sm:gap-4">
        <div
          className={`w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl ${bgClass} flex items-center justify-center shrink-0`}
        >
          <span className={iconColorClass}>{icon}</span>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
            {title}
          </p>
          <p
            className={`font-black text-islamic-dark leading-tight mt-0.5 truncate ${
              compact ? 'text-base sm:text-xl md:text-2xl' : 'text-xl sm:text-2xl md:text-3xl'
            }`}
          >
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Quick action card component                                        */
/* ------------------------------------------------------------------ */

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  page: AdminPage;
  onClick: (page: AdminPage) => void;
  accentClass: string;
}

function QuickAction({
  title,
  description,
  icon,
  page,
  onClick,
  accentClass,
}: QuickActionProps) {
  return (
    <Card
      className="group card-cinema rounded-2xl cursor-pointer"
      onClick={() => onClick(page)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(page);
        }
      }}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div
            className={`w-11 h-11 rounded-xl ${accentClass} flex items-center justify-center shrink-0`}
          >
            {icon}
          </div>
          <ArrowRight className="size-4 text-islamic opacity-0 group-hover:opacity-100 transition-opacity mt-1 rtl:-scale-x-100" />
        </div>
        <h3 className="font-bold text-islamic-dark mt-3 text-sm">{title}</h3>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Dashboard component                                           */
/* ------------------------------------------------------------------ */

export default function AdminDashboard() {
  const {
    students,
    teachers,
    notices,
    blogs,
    gallery,
    events,
    exams,
    results,
    donations,
    contactMessages,
    admissionApplications,
    feePayments,
    expenses,
    salaryRecords,
    activityLogs,
    setAdminPage,
  } = useAppStore();
  const { t, language } = useTranslation();

  /* Last 5 notices (already sorted by createdAt desc from store) */
  const recentNotices = notices.slice(0, 5);

  /* Last 6 activity log entries (already sorted by timestamp desc from store) */
  const recentActivity = useMemo(() => activityLogs.slice(0, 6), [activityLogs]);

  /* ---------------- Live stats (all from real store data) ---------------- */

  const currentYM = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  /* Total donations collected (DonationFund.collected) */
  const totalDonations = useMemo(
    () => donations.reduce((s, d) => s + (d.collected || 0), 0),
    [donations]
  );

  /* Pending admission applications (AdmissionApplication.status === 'pending') */
  const pendingApplications = useMemo(
    () => admissionApplications.filter((a) => a.status === 'pending').length,
    [admissionApplications]
  );

  /* Unread contact messages (ContactMessage.isRead === false) */
  const unreadMessages = useMemo(
    () => contactMessages.filter((m) => !m.isRead).length,
    [contactMessages]
  );

  /* This month's expenses — approved expenses + paid salary, same convention as AdminFinancialReports */
  const monthExpenses = useMemo(() => {
    const expMonth = expenses
      .filter((e) => e.status === 'approved' && getYM(e.createdAt) === currentYM)
      .reduce((s, e) => s + (e.amount || 0), 0);
    const salMonth = salaryRecords
      .filter((r) => r.status === 'paid' && getYM(r.createdAt) === currentYM)
      .reduce((s, r) => s + (r.paidAmount || 0), 0);
    return expMonth + salMonth;
  }, [expenses, salaryRecords, currentYM]);

  /* ---------------- Monthly income vs expense, last 6 months ---------------- */

  const incomeExpenseData = useMemo(() => {
    const months = t('adminFinancialReports.monthsShort').split(',');
    const rows: { name: string; income: number; expense: number }[] = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthName = months[d.getMonth()];

      const income = feePayments
        .filter((p) => p.status === 'paid' && getYM(p.createdAt) === ym)
        .reduce((s, p) => s + (p.paidAmount || 0), 0);

      const expense = expenses
        .filter((e) => e.status === 'approved' && getYM(e.createdAt) === ym)
        .reduce((s, e) => s + (e.amount || 0), 0)
        + salaryRecords
          .filter((r) => r.status === 'paid' && getYM(r.createdAt) === ym)
          .reduce((s, r) => s + (r.paidAmount || 0), 0);

      rows.push({ name: monthName, income, expense });
    }
    return rows;
  }, [feePayments, expenses, salaryRecords, t]);

  const hasIncomeExpenseData = useMemo(
    () => incomeExpenseData.some((r) => r.income > 0 || r.expense > 0),
    [incomeExpenseData]
  );

  /* ---------------- Content overview doughnut (real array lengths) ---------------- */

  const contentData = useMemo(
    () => [
      { label: t('adminDashboard.statNotices'), value: notices.length },
      { label: t('adminDashboard.statBlogs'), value: blogs.length },
      { label: t('admin.gallery'), value: gallery.length },
      { label: t('admin.events'), value: events.length },
      { label: t('admin.exams'), value: exams.length },
      { label: t('admin.results'), value: results.length },
    ],
    [t, notices.length, blogs.length, gallery.length, events.length, exams.length, results.length]
  );

  const totalContent = useMemo(
    () => contentData.reduce((s, d) => s + d.value, 0),
    [contentData]
  );

  /* ---------------- Relative time for activity entries ---------------- */

  const formatRelativeTime = (ts: number) => {
    if (!ts) return '—';
    const diffMs = Date.now() - ts;
    if (diffMs < 60000) return t('adminDashboard.justNow');
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 60) return t('adminDashboard.agoMinutes', { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t('adminDashboard.agoHours', { count: hours });
    const days = Math.floor(hours / 24);
    if (days < 30) return t('adminDashboard.agoDays', { count: days });
    const locale = language === 'bn' ? 'bn-BD' : language === 'ar' ? 'ar-EG' : 'en-GB';
    return new Date(ts).toLocaleDateString(locale);
  };

  /* Format a date string for display (raw value with empty-string fallback) */
  const formatDate = (dateStr: string) => dateStr || '—';

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Welcome header */}
      <div>
        <p className="eyebrow">{t('admin.adminPanel')}</p>
        <h2 className="text-2xl md:text-3xl font-black text-islamic-dark tracking-tight mt-2">
          {t('admin.dashboard')}
        </h2>
        <p className="text-muted-foreground text-sm mt-1.5">
          {t('adminDashboard.subtitle')}
        </p>
      </div>

      {/* Stat cards grid — 8 live stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title={t('about.totalStudents')}
          value={students.length}
          icon={<UserCheck className="size-5 sm:size-7" />}
          bgClass="bg-islamic-lighter"
          iconColorClass="text-islamic"
        />
        <StatCard
          title={t('adminDashboard.totalTeachers')}
          value={teachers.length}
          icon={<Users className="size-5 sm:size-7" />}
          bgClass="bg-golden-lighter"
          iconColorClass="text-golden"
        />
        <StatCard
          title={t('adminDashboard.statNotices')}
          value={notices.length}
          icon={<Bell className="size-5 sm:size-7" />}
          bgClass="bg-primary/5"
          iconColorClass="text-primary"
        />
        <StatCard
          title={t('adminDashboard.statBlogs')}
          value={blogs.length}
          icon={<FileText className="size-5 sm:size-7" />}
          bgClass="bg-primary/5"
          iconColorClass="text-primary"
        />
        <StatCard
          title={t('adminDashboard.statDonations')}
          value={toTaka(totalDonations)}
          icon={<HandCoins className="size-5 sm:size-7" />}
          bgClass="bg-warning/15"
          iconColorClass="text-warning-foreground"
          compact
        />
        <StatCard
          title={t('adminDashboard.statPendingApps')}
          value={pendingApplications}
          icon={<UserPlus className="size-5 sm:size-7" />}
          bgClass="bg-warning/15"
          iconColorClass="text-warning-foreground"
        />
        <StatCard
          title={t('adminDashboard.statUnreadMessages')}
          value={unreadMessages}
          icon={<MailOpen className="size-5 sm:size-7" />}
          bgClass="bg-danger/10"
          iconColorClass="text-danger"
        />
        <StatCard
          title={t('adminDashboard.statMonthExpense')}
          value={toTaka(monthExpenses)}
          icon={<TrendingDown className="size-5 sm:size-7" />}
          bgClass="bg-danger/10"
          iconColorClass="text-danger"
          compact
        />
      </div>

      {/* Charts grid — real Chart.js */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Monthly Income vs Expense (last 6 months) */}
        <Card className="card-cinema rounded-2xl">
          <CardHeader className="pb-0">
            <CardTitle className="text-base sm:text-lg text-islamic-dark font-bold flex items-center gap-2">
              <BarChart3 className="size-5 text-golden shrink-0" />
              {t('adminDashboard.chartIncomeExpense')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3 sm:pt-4">
            {hasIncomeExpenseData ? (
              <div className="h-64 sm:h-72">
                <Bar
                  data={{
                    labels: incomeExpenseData.map((d) => d.name),
                    datasets: [
                      {
                        label: t('adminFinancialReports.seriesIncome'),
                        data: incomeExpenseData.map((d) => d.income),
                        backgroundColor: '#0485f7',
                        borderRadius: 4,
                      },
                      {
                        label: t('adminFinancialReports.seriesExpense'),
                        data: incomeExpenseData.map((d) => d.expense),
                        backgroundColor: '#ff383c',
                        borderRadius: 4,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: chartLegendOptions,
                      tooltip: {
                        ...chartTooltipOptions,
                        callbacks: {
                          label: (ctx) => `${ctx.dataset.label}: ${toTaka(ctx.parsed.y ?? 0)}`,
                        },
                      },
                    },
                    scales: {
                      x: monthXScale,
                      y: currencyYScale,
                    },
                  }}
                />
              </div>
            ) : (
              <EmptyState
                icon={<BarChart3 className="size-7" />}
                message={t('adminDashboard.noDataChart')}
              />
            )}
          </CardContent>
        </Card>

        {/* Content Overview */}
        <Card className="card-cinema rounded-2xl">
          <CardHeader className="pb-0">
            <CardTitle className="text-base sm:text-lg text-islamic-dark font-bold flex items-center gap-2">
              <PieChart className="size-5 text-golden shrink-0" />
              {t('adminDashboard.chartContent')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3 sm:pt-4">
            {totalContent > 0 ? (
              <div className="h-64 sm:h-72">
                <Doughnut
                  data={{
                    labels: contentData.map((d) => d.label),
                    datasets: [
                      {
                        data: contentData.map((d) => d.value),
                        backgroundColor: CONTENT_COLORS,
                        borderColor: '#ffffff',
                        borderWidth: 2,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: chartLegendOptions,
                      tooltip: {
                        ...chartTooltipOptions,
                        callbacks: {
                          label: (ctx) => `${ctx.label}: ${Number(ctx.parsed) || 0}`,
                        },
                      },
                    },
                  }}
                />
              </div>
            ) : (
              <EmptyState
                icon={<PieChart className="size-7" />}
                message={t('adminDashboard.noDataChart')}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent activity (live from activityLogs) */}
      <Card className="card-cinema rounded-2xl">
        <CardHeader className="pb-0">
          <CardTitle className="text-base sm:text-lg text-islamic-dark font-bold flex items-center gap-2">
            <Activity className="size-5 text-golden shrink-0" />
            {t('adminDashboard.recentActivity')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2 sm:pt-3">
          {recentActivity.length > 0 ? (
            <div className="divide-y divide-border/60">
              {recentActivity.map((log) => (
                <div key={log.id} className="flex items-center gap-3 py-3">
                  <div className="w-9 h-9 rounded-lg bg-islamic-lighter flex items-center justify-center shrink-0">
                    <ShieldCheck className="size-4 text-islamic" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-islamic-dark truncate">
                      {log.action}
                    </p>
                    {log.details && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {log.details}
                      </p>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
                    {formatRelativeTime(log.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Activity className="size-7" />}
              message={t('adminDashboard.noActivity')}
            />
          )}
        </CardContent>
      </Card>

      {/* Two-column layout: Recent Notices + Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent notices table */}
        <div className="xl:col-span-2">
          <Card className="card-cinema rounded-2xl hidden md:block">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-islamic-dark font-bold flex items-center gap-2">
                  <CalendarDays className="size-5 text-golden" />
                  {t('adminDashboard.recentNotices')}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAdminPage('notices')}
                  className="text-islamic hover:bg-islamic-lighter gap-1 text-xs font-semibold rounded-full"
                >
                  {t('adminDashboard.viewAll')}
                  <ArrowRight className="size-3.5 rtl:-scale-x-100" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              {recentNotices.length > 0 ? (
                <div className="max-h-80 overflow-x-auto overflow-y-auto results-scroll">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs font-semibold text-muted-foreground">
                          {t('common.title')}
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground w-28">
                          {t('common.date')}
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground w-24 text-center">
                          {t('common.status')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentNotices.map((notice) => (
                        <TableRow key={notice.id} className="cursor-pointer" onClick={() => setAdminPage('notices')}>
                          <TableCell className="font-medium text-sm text-islamic-dark py-3 max-w-xs truncate">
                            {notice.title}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground py-3">
                            {formatDate(notice.date)}
                          </TableCell>
                          <TableCell className="py-3 text-center">
                            {notice.important ? (
                              <Badge className="bg-danger/10 text-danger border-danger/40 hover:bg-danger/10 text-xs">
                                {t('notices.important')}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                {t('adminDashboard.general')}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Bell className="size-10 opacity-30 mb-3" />
                  <p className="text-sm">{t('adminDashboard.noNotices')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mobile Cards for Notices */}
          <div className="md:hidden">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-islamic-dark flex items-center gap-2">
                <CalendarDays className="size-4 text-golden" />
                {t('adminDashboard.recentNotices')}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAdminPage('notices')}
                className="text-islamic hover:bg-islamic-lighter gap-1 text-xs font-semibold rounded-full"
              >
                {t('adminDashboard.viewAll')}
                <ArrowRight className="size-3.5 rtl:-scale-x-100" />
              </Button>
            </div>
            {recentNotices.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recentNotices.map((notice) => (
                  <Card key={notice.id} className="card-cinema rounded-2xl cursor-pointer" onClick={() => setAdminPage('notices')}>
                    <CardContent className="p-3">
                      <p className="font-bold text-sm text-islamic-dark truncate">{notice.title}</p>
                      {notice.content && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notice.content}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-[10px] text-muted-foreground">{formatDate(notice.date)}</p>
                        {notice.important ? (
                          <Badge className="bg-danger/10 text-danger border-danger/40 hover:bg-danger/10 text-[10px] px-1.5 py-0">
                            {t('notices.important')}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {t('adminDashboard.general')}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="card-cinema rounded-2xl">
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Bell className="size-10 opacity-30 mb-3" />
                  <p className="text-sm">{t('adminDashboard.noNotices')}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <Card className="card-cinema rounded-2xl">
          <CardHeader className="pb-0">
            <CardTitle className="text-lg text-islamic-dark font-bold flex items-center gap-2">
              <Plus className="size-5 text-golden" />
              {t('adminDashboard.quickActions')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 space-y-3">
            <QuickAction
              title={t('adminDashboard.newNotice')}
              description={t('adminDashboard.newNoticeDesc')}
              icon={<Bell className="size-5 text-islamic" />}
              page="notices"
              onClick={setAdminPage}
              accentClass="bg-islamic-lighter"
            />
            <QuickAction
              title={t('adminDashboard.newStudent')}
              description={t('adminDashboard.newStudentDesc')}
              icon={<UserCheck className="size-5 text-primary" />}
              page="students"
              onClick={setAdminPage}
              accentClass="bg-primary/5"
            />
            <QuickAction
              title={t('adminDashboard.addResult')}
              description={t('adminDashboard.addResultDesc')}
              icon={<Award className="size-5 text-golden" />}
              page="results"
              onClick={setAdminPage}
              accentClass="bg-golden-lighter"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
