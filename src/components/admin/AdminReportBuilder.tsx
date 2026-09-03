'use client';

import { useState, useMemo } from 'react';
import { BarChart3, Loader2, Download, Copy, Printer, FileSpreadsheet } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const REPORT_TYPES = [
  'students', 'teachers', 'attendance', 'results',
  'fees', 'expenses', 'salary', 'donations',
];

/* Bengali month names — these are the values stored in Firebase and used for
   filtering, so they must stay unchanged; only the display label is translated. */
const MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল',
  'মে', 'জুন', 'জুলাই', 'আগস্ট',
  'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর',
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminReportBuilder() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const {
    students, teachers, expenses, salaryRecords,
    feePayments, donations, results, departments: storeDepartments,
  } = useAppStore();

  /* Translated label for a report type (internal value stays English) */
  const reportTypeLabel = (value: string): string => {
    const label = t(`adminReportBuilder.type.${value}`);
    return label.startsWith('adminReportBuilder.type.') ? t('adminReportBuilder.reportWord') : label;
  };

  /* Translated display label for a Bengali month DB value */
  const monthLabel = (month: string): string => {
    const idx = MONTHS.indexOf(month);
    return idx >= 0 ? t(`adminReportBuilder.month.${idx + 1}`) : month;
  };

  const [reportType, setReportType] = useState('students');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));
  const [filterStatus, setFilterStatus] = useState('all');
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);

  /* Derived lists */
  const departments = useMemo(() => {
    // Use canonical departments from store
    if (storeDepartments.length > 0) {
      return storeDepartments.map((d) => d.name).filter(Boolean);
    }
    // Fallback to deriving from students/teachers
    const depts = new Set<string>();
    students.forEach((s) => { if (s.department) depts.add(s.department); });
    teachers.forEach((t) => { if (t.department) depts.add(t.department); });
    return Array.from(depts);
  }, [storeDepartments, students, teachers]);

  const classes = useMemo(() => {
    const cls = new Set<string>();
    students.forEach((s) => { if (s.class) cls.add(s.class); });
    return Array.from(cls);
  }, [students]);

  /* Report columns based on type */
  const getColumns = (): { key: string; label: string }[] => {
    switch (reportType) {
      case 'students': return [
        { key: 'name', label: t('common.name') },
        { key: 'roll', label: t('adminReportBuilder.col.roll') },
        { key: 'department', label: t('adminReportBuilder.department') },
        { key: 'class', label: t('adminReportBuilder.col.class') },
        { key: 'fatherName', label: t('adminReportBuilder.col.fatherName') },
        { key: 'admissionYear', label: t('adminReportBuilder.col.admissionYear') },
      ];
      case 'teachers': return [
        { key: 'name', label: t('common.name') },
        { key: 'designation', label: t('adminReportBuilder.col.designation') },
        { key: 'department', label: t('adminReportBuilder.department') },
        { key: 'qualification', label: t('adminReportBuilder.col.qualification') },
      ];
      case 'results': return [
        { key: 'studentName', label: t('adminReportBuilder.col.student') },
        { key: 'studentRoll', label: t('adminReportBuilder.col.roll') },
        { key: 'examName', label: t('adminReportBuilder.col.exam') },
        { key: 'department', label: t('adminReportBuilder.department') },
        { key: 'totalMarks', label: t('adminReportBuilder.col.totalMarks') },
        { key: 'obtainedTotal', label: t('adminReportBuilder.col.obtainedMarks') },
        { key: 'grade', label: t('adminReportBuilder.col.grade') },
      ];
      case 'fees': return [
        { key: 'studentName', label: t('adminReportBuilder.col.student') },
        { key: 'studentRoll', label: t('adminReportBuilder.col.roll') },
        { key: 'amount', label: t('common.amount') },
        { key: 'status', label: t('common.status') },
        { key: 'month', label: t('common.month') },
        { key: 'paidDate', label: t('common.date') },
      ];
      case 'expenses': return [
        { key: 'title', label: t('common.title') },
        { key: 'category', label: t('adminReportBuilder.col.category') },
        { key: 'amount', label: t('common.amount') },
        { key: 'date', label: t('common.date') },
        { key: 'status', label: t('common.status') },
        { key: 'description', label: t('common.description') },
      ];
      case 'salary': return [
        { key: 'teacherName', label: t('adminReportBuilder.col.teacher') },
        { key: 'designation', label: t('adminReportBuilder.col.designation') },
        { key: 'department', label: t('adminReportBuilder.department') },
        { key: 'basicSalary', label: t('adminReportBuilder.col.basicSalary') },
        { key: 'allowance', label: t('adminReportBuilder.col.allowance') },
        { key: 'deduction', label: t('adminReportBuilder.col.deduction') },
        { key: 'netSalary', label: t('adminReportBuilder.col.netSalary') },
        { key: 'status', label: t('common.status') },
      ];
      case 'donations': return [
        { key: 'title', label: t('adminReportBuilder.col.fund') },
        { key: 'collected', label: t('adminReportBuilder.col.collected') },
        { key: 'target', label: t('adminReportBuilder.col.target') },
        { key: 'type', label: t('common.type') },
      ];
      case 'attendance': return [
        { key: 'name', label: t('common.name') },
        { key: 'roll', label: t('adminReportBuilder.col.roll') },
        { key: 'department', label: t('adminReportBuilder.department') },
      ];
      default: return [{ key: 'name', label: t('common.name') }];
    }
  };

  /* Generate report data */
  const reportData = useMemo(() => {
    if (!generated) return [];

    switch (reportType) {
      case 'students':
        return students.filter((s) => {
          const deptMatch = filterDepartment === 'all' || s.department === filterDepartment;
          const classMatch = filterClass === 'all' || s.class === filterClass;
          return deptMatch && classMatch;
        }).map((s) => ({
          name: s.name,
          roll: s.roll,
          department: s.department || '—',
          class: s.class || '—',
          fatherName: s.fatherName || '—',
          admissionYear: s.admissionYear || '—',
        }));

      case 'teachers':
        return teachers.filter((t) => {
          const deptMatch = filterDepartment === 'all' || t.department === filterDepartment;
          return deptMatch;
        }).map((t) => ({
          name: t.name,
          designation: t.designation || '—',
          department: t.department || '—',
          qualification: t.qualification || '—',
        }));

      case 'results':
        return results.filter((r) => {
          const deptMatch = filterDepartment === 'all' || r.department === filterDepartment;
          return deptMatch;
        }).map((r) => ({
          studentName: r.studentName,
          studentRoll: r.studentRoll,
          examName: r.examName,
          department: r.department || '—',
          totalMarks: String(r.totalMarks),
          obtainedTotal: String(r.obtainedTotal),
          grade: r.grade,
        }));

      case 'fees':
        return feePayments.filter((p) => {
          const statusMatch = filterStatus === 'all' || p.status === filterStatus;
          return statusMatch;
        }).map((p) => ({
          studentName: p.studentName,
          studentRoll: p.studentRoll,
          amount: String(p.amount),
          status: p.status === 'paid' ? t('adminReportBuilder.statusPaid') : p.status === 'unpaid' ? t('adminReportBuilder.statusUnpaid') : t('adminReportBuilder.statusPartial'),
          month: p.month || '—',
          paidDate: p.paymentDate || '—',
        }));

      case 'expenses':
        return expenses.filter((e) => {
          const statusMatch = filterStatus === 'all' || e.status === filterStatus;
          const dateMatch = filterYear === 'all' || (e.date || '').startsWith(filterYear);
          return statusMatch && dateMatch;
        }).map((e) => ({
          title: e.title,
          category: e.category || '—',
          amount: String(e.amount),
          date: e.date || '—',
          status: e.status === 'approved' ? t('admin.approved') : e.status === 'rejected' ? t('admin.rejected') : t('admin.pending'),
          description: e.description ? (e.description.length > 50 ? e.description.substring(0, 50) + '...' : e.description) : '—',
        }));

      case 'salary':
        return salaryRecords.filter((s) => {
          const statusMatch = filterStatus === 'all' || s.status === filterStatus;
          const monthMatch = filterMonth === 'all' || s.month === filterMonth;
          const yearMatch = filterYear === 'all' || s.year === filterYear;
          return statusMatch && monthMatch && yearMatch;
        }).map((s) => ({
          teacherName: s.teacherName,
          designation: s.designation || '—',
          department: s.department || '—',
          basicSalary: String(s.basicSalary),
          allowance: String(s.allowance),
          deduction: String(s.deduction),
          netSalary: String(s.netSalary),
          status: s.status === 'paid' ? t('adminReportBuilder.statusPaid') : s.status === 'unpaid' ? t('adminReportBuilder.statusUnpaid') : t('adminReportBuilder.statusPartial'),
        }));

      case 'donations':
        return donations.map((d) => ({
          title: d.title || '—',
          collected: String(d.collected || 0),
          target: String(d.target || 0),
          type: d.type || '—',
        }));

      case 'attendance':
        return students.filter((s) => {
          const deptMatch = filterDepartment === 'all' || s.department === filterDepartment;
          return deptMatch;
        }).map((s) => ({
          name: s.name,
          roll: s.roll,
          department: s.department || '—',
        }));

      default:
        return [];
    }
  }, [generated, reportType, students, teachers, results, feePayments, expenses, salaryRecords, donations, filterDepartment, filterClass, filterStatus, filterMonth, filterYear, t]);

  const columns = getColumns();

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerated(true);
      setGenerating(false);
      toast({ title: t('common.success'), description: t('adminReportBuilder.generatedToast') });
    }, 500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (reportData.length === 0) {
      toast({ title: t('common.error'), description: t('adminReportBuilder.generateFirst'), variant: 'destructive' });
      return;
    }
    const header = columns.map((c) => c.label).join(',');
    const rows = reportData.map((row: any) =>
      columns.map((c) => `"${String(row[c.key] || '').replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = '\uFEFF' + [header, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `রিপোর্ট_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: t('common.success'), description: t('adminReportBuilder.csvDownloaded') });
  };

  const handleCopy = async () => {
    if (reportData.length === 0) {
      toast({ title: t('common.error'), description: t('adminReportBuilder.generateFirst'), variant: 'destructive' });
      return;
    }
    const header = columns.map((c) => c.label).join('\t');
    const rows = reportData.map((row: any) =>
      columns.map((c) => String(row[c.key] || '')).join('\t')
    );
    const text = [header, ...rows].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: t('common.success'), description: t('adminReportBuilder.copiedToast') });
    } catch {
      toast({ title: t('common.error'), description: t('adminReportBuilder.copyFailed'), variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-islamic-dark">{t('adminReportBuilder.title')}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t('adminReportBuilder.subtitle')}
          </p>
        </div>
      </div>

      {/* Report Configuration */}
      <Card className="shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>{t('adminReportBuilder.typeLabel')}</Label>
              <Select value={reportType} onValueChange={(v) => { setReportType(v); setGenerated(false); }}>
                <SelectTrigger>
                  <SelectValue placeholder={t('adminReportBuilder.selectReport')} />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((rt) => (
                    <SelectItem key={rt} value={rt}>{reportTypeLabel(rt)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(reportType === 'students' || reportType === 'teachers' || reportType === 'results') && departments.length > 0 && (
              <div className="space-y-2">
                <Label>{t('adminReportBuilder.department')}</Label>
                <Select value={filterDepartment} onValueChange={(v) => { setFilterDepartment(v); setGenerated(false); }}>
                  <SelectTrigger><SelectValue placeholder={t('adminReportBuilder.selectDepartment')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('common.all')}</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {reportType === 'students' && classes.length > 0 && (
              <div className="space-y-2">
                <Label>{t('adminReportBuilder.col.class')}</Label>
                <Select value={filterClass} onValueChange={(v) => { setFilterClass(v); setGenerated(false); }}>
                  <SelectTrigger><SelectValue placeholder={t('adminReportBuilder.selectClass')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('common.all')}</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(reportType === 'expenses' || reportType === 'salary') && (
              <div className="space-y-2">
                <Label>{t('common.year')}</Label>
                <Select value={filterYear} onValueChange={(v) => { setFilterYear(v); setGenerated(false); }}>
                  <SelectTrigger><SelectValue placeholder={t('adminReportBuilder.selectYear')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('common.all')}</SelectItem>
                    {Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i)).map((y) => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {reportType === 'salary' && (
              <div className="space-y-2">
                <Label>{t('common.month')}</Label>
                <Select value={filterMonth} onValueChange={(v) => { setFilterMonth(v); setGenerated(false); }}>
                  <SelectTrigger><SelectValue placeholder={t('adminReportBuilder.selectMonth')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('common.all')}</SelectItem>
                    {MONTHS.map((m) => (
                      <SelectItem key={m} value={m}>{monthLabel(m)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(reportType === 'fees' || reportType === 'expenses' || reportType === 'salary') && (
              <div className="space-y-2">
                <Label>{t('common.status')}</Label>
                <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setGenerated(false); }}>
                  <SelectTrigger><SelectValue placeholder={t('adminReportBuilder.selectStatus')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('common.all')}</SelectItem>
                    {reportType === 'fees' ? (
                      <>
                        <SelectItem value="paid">{t('adminReportBuilder.statusPaid')}</SelectItem>
                        <SelectItem value="unpaid">{t('adminReportBuilder.statusUnpaid')}</SelectItem>
                        <SelectItem value="partial">{t('adminReportBuilder.statusPartial')}</SelectItem>
                      </>
                    ) : reportType === 'expenses' ? (
                      <>
                        <SelectItem value="approved">{t('admin.approved')}</SelectItem>
                        <SelectItem value="pending">{t('admin.pending')}</SelectItem>
                        <SelectItem value="rejected">{t('admin.rejected')}</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="paid">{t('adminReportBuilder.statusPaid')}</SelectItem>
                        <SelectItem value="unpaid">{t('adminReportBuilder.statusUnpaid')}</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={handleGenerate} disabled={generating} className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer">
              {generating ? <Loader2 className="size-4 animate-spin" /> : <BarChart3 className="size-4" />}
              {t('adminReportBuilder.generate')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Result */}
      {generated && (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            {/* Report Header with Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b">
              <div>
                <h3 className="font-semibold text-islamic-dark">
                  {t('adminReportBuilder.reportTitle', { type: reportTypeLabel(reportType) })}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t('adminReportBuilder.totalEntries', { count: reportData.length })}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handlePrint} className="gap-2 cursor-pointer">
                  <Printer className="size-4" />
                  {t('common.print')}
                </Button>
                <Button size="sm" variant="outline" onClick={handleExportCSV} className="gap-2 cursor-pointer">
                  <FileSpreadsheet className="size-4" />
                  CSV
                </Button>
                <Button size="sm" variant="outline" onClick={handleCopy} className="gap-2 cursor-pointer">
                  <Copy className="size-4" />
                  {t('common.copy')}
                </Button>
              </div>
            </div>

            {/* Report Table - Desktop */}
            {reportData.length > 0 ? (
              <>
              <div className="overflow-x-auto hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-semibold text-muted-foreground w-10">#</TableHead>
                      {columns.map((col) => (
                        <TableHead key={col.key} className="text-xs font-semibold text-muted-foreground">
                          {col.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.map((row: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="text-xs text-muted-foreground py-2">{idx + 1}</TableCell>
                        {columns.map((col) => (
                          <TableCell key={col.key} className="text-sm py-2">
                            {col.key === 'name' || col.key === 'studentName' || col.key === 'teacherName' || col.key === 'title' ? (
                              <span className="font-medium text-islamic-dark">{row[col.key]}</span>
                            ) : (
                              <span className="text-muted-foreground">{row[col.key]}</span>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* Mobile Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 md:hidden">
                {reportData.map((row: any, idx: number) => (
                  <Card key={idx} className="shadow-sm">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] text-muted-foreground font-mono mb-0.5">#{idx + 1}</p>
                          {columns.length > 0 && (
                            <p className="font-bold text-sm truncate text-islamic-dark">
                              {row[columns[0].key]}
                            </p>
                          )}
                          {columns.length > 1 && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {columns[1].label}: {row[columns[1].key]}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {columns.slice(2).map((col) => (
                          <span key={col.key} className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                            {col.label}: {String(row[col.key] || '—')}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <BarChart3 className="size-12 opacity-20 mb-3" />
                <p className="text-sm">{t('adminReportBuilder.noDataFiltered')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!generated && (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <BarChart3 className="size-16 opacity-15 mb-4" />
            <p className="text-lg font-medium">{t('adminReportBuilder.generate')}</p>
            <p className="text-sm mt-1">{t('adminReportBuilder.emptyDesc')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
