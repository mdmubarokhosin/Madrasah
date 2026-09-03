'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, Wallet, Loader2, Users } from 'lucide-react';
import { dbPush, dbUpdate, dbRemove, dbSubscribe } from '@/lib/db-service';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { SalaryRecord } from '@/types/database';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর',
];

const EMPTY_FORM = {
  teacherId: '',
  designation: '',
  department: '',
  basicSalary: '',
  allowance: '',
  deduction: '',
  netSalary: '0',
  month: '',
  year: '',
  status: 'unpaid',
  paidAmount: '',
  paidDate: '',
  paymentMethod: '',
  notes: '',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminSalary() {
  const { toast } = useToast();
  const teachers = useAppStore((s) => s.teachers);
  const { t, language } = useTranslation();
  const locale = language === 'bn' ? 'bn-BD' : language;

  /* Translated display label for a month (DB values stay Bengali month names) */
  const monthLabel = (m: string) => {
    const idx = MONTHS.indexOf(m);
    return idx >= 0 ? t(`adminSalary.month${idx + 1}`) : m;
  };

  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [statusFilter, setStatusFilter] = useState('all');

  /* Dialog */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SalaryRecord | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [batchGenerating, setBatchGenerating] = useState(false);

  /* Delete */
  const [deleteTarget, setDeleteTarget] = useState<SalaryRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* Subscribe */
  useEffect(() => {
    const unsub = dbSubscribe('/salaryRecords', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list: SalaryRecord[] = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        }));
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setRecords(list);
      } else {
        setRecords([]);
      }
    });
    return () => unsub();
  }, []);

  /* Auto-calculate net salary */
  const netSalary = useMemo(() => {
    const basic = Number(form.basicSalary) || 0;
    const allowance = Number(form.allowance) || 0;
    const deduction = Number(form.deduction) || 0;
    return basic + allowance - deduction;
  }, [form.basicSalary, form.allowance, form.deduction]);

  /* Filtered */
  const filtered = useMemo(() => {
    return records.filter((r) => {
      const monthMatch = !monthFilter || r.month === monthFilter;
      const yearMatch = !yearFilter || r.year === yearFilter;
      const statusMatch = statusFilter === 'all' || r.status === statusFilter;
      return monthMatch && yearMatch && statusMatch;
    });
  }, [records, monthFilter, yearFilter, statusFilter]);

  /* Summary */
  const thisMonthPaid = useMemo(() => {
    const ym = `${yearFilter}-${String(MONTHS.indexOf(monthFilter) + 1 || new Date().getMonth() + 1).padStart(2, '0')}`;
    return records.filter((r) => r.status === 'paid' && `${r.year}-${String(MONTHS.indexOf(r.month) + 1 || 0).padStart(2, '0')}` === ym)
      .reduce((sum, r) => sum + (r.paidAmount || 0), 0);
  }, [records, yearFilter, monthFilter]);

  const pendingSalaries = useMemo(() => records.filter((r) => r.status !== 'paid').reduce((sum, r) => sum + (r.netSalary || 0), 0), [records]);
  const totalAmount = useMemo(() => records.reduce((sum, r) => sum + (r.netSalary || 0), 0), [records]);

  /* Handlers */
  const resetAndOpen = useCallback(() => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((item: SalaryRecord) => {
    setEditing(item);
    setForm({
      teacherId: item.teacherId || '',
      designation: item.designation || '',
      department: item.department || '',
      basicSalary: String(item.basicSalary || 0),
      allowance: String(item.allowance || 0),
      deduction: String(item.deduction || 0),
      netSalary: String(item.netSalary || 0),
      month: item.month || '',
      year: item.year || '',
      status: item.status || 'unpaid',
      paidAmount: String(item.paidAmount || 0),
      paidDate: item.paidDate || '',
      paymentMethod: item.paymentMethod || '',
      notes: item.notes || '',
    });
    setDialogOpen(true);
  }, []);

  const handleTeacherSelect = useCallback((teacherId: string) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    if (teacher) {
      setForm((f) => ({
        ...f,
        teacherId: teacher.id,
        designation: teacher.designation || '',
        department: teacher.department || '',
      }));
    }
  }, [teachers]);

  const handleSubmit = async () => {
    if (!form.teacherId || !form.basicSalary) {
      toast({ title: t('common.error'), description: t('adminSalary.teacherBasicRequired'), variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const teacher = teachers.find((t) => t.id === form.teacherId);
      const payload = {
        teacherId: form.teacherId,
        teacherName: teacher?.name || '',
        designation: form.designation.trim(),
        department: form.department.trim(),
        basicSalary: Number(form.basicSalary) || 0,
        allowance: Number(form.allowance) || 0,
        deduction: Number(form.deduction) || 0,
        netSalary,
        month: form.month || MONTHS[new Date().getMonth()],
        year: form.year || new Date().getFullYear().toString(),
        status: form.status,
        paidAmount: Number(form.paidAmount) || 0,
        paidDate: form.paidDate || '',
        paymentMethod: form.paymentMethod.trim(),
        notes: form.notes.trim(),
      };
      if (editing) {
        await dbUpdate('/salaryRecords/' + editing.id, payload);
        toast({ title: t('common.success'), description: t('adminSalary.recordUpdated') });
      } else {
        await dbPush('/salaryRecords', { ...payload, createdAt: Date.now() });
        toast({ title: t('common.success'), description: t('adminSalary.recordCreated') });
      }
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      setEditing(null);
    } catch {
      toast({ title: t('common.error'), description: t('common.operationFailed'), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBatchGenerate = async () => {
    if (teachers.length === 0) {
      toast({ title: t('common.error'), description: t('adminSalary.noTeachers'), variant: 'destructive' });
      return;
    }
    setBatchGenerating(true);
    try {
      const month = monthFilter || MONTHS[new Date().getMonth()];
      const year = yearFilter || new Date().getFullYear().toString();
      for (const teacher of teachers) {
        const exists = records.some((r) => r.teacherId === teacher.id && r.month === month && r.year === year);
        if (!exists) {
          await dbPush('/salaryRecords', {
            teacherId: teacher.id,
            teacherName: teacher.name,
            designation: teacher.designation || '',
            department: teacher.department || '',
            basicSalary: 0,
            allowance: 0,
            deduction: 0,
            netSalary: 0,
            month,
            year,
            status: 'unpaid',
            paidAmount: 0,
            paidDate: '',
            paymentMethod: '',
            notes: '',
            createdAt: Date.now(),
          });
        }
      }
      toast({ title: t('common.success'), description: t('adminSalary.batchCreated', { count: teachers.length }) });
    } catch {
      toast({ title: t('common.error'), description: t('adminSalary.batchFailed'), variant: 'destructive' });
    } finally {
      setBatchGenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await dbRemove('/salaryRecords/' + deleteTarget.id);
      toast({ title: t('common.success'), description: t('adminSalary.recordDeleted') });
      setDeleteTarget(null);
    } catch {
      toast({ title: t('common.error'), description: t('common.deleteFailed'), variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const markAsPaid = async (record: SalaryRecord) => {
    try {
      await dbUpdate('/salaryRecords/' + record.id, {
        status: 'paid',
        paidAmount: record.netSalary,
        paidDate: new Date().toISOString().split('T')[0],
      });
      toast({ title: t('common.success'), description: t('adminSalary.markedPaid') });
    } catch {
      toast({ title: t('common.error'), description: t('adminSalary.updateFailed'), variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-islamic-dark">{t('adminSalary.title')}</h2>
          <p className="text-muted-foreground text-sm mt-1">{t('adminSalary.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBatchGenerate} disabled={batchGenerating} className="gap-2 cursor-pointer">
            {batchGenerating ? <Loader2 className="size-4 animate-spin" /> : <Users className="size-4" />}
            {t('adminSalary.generateBatch')}
          </Button>
          <Button onClick={resetAndOpen} className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer">
            <Plus className="size-4" />
            {t('adminSalary.newRecord')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">৳{thisMonthPaid.toLocaleString(locale)}</p>
            <p className="text-xs text-muted-foreground">{t('adminSalary.paidThisMonth')}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">৳{pendingSalaries.toLocaleString(locale)}</p>
            <p className="text-xs text-muted-foreground">{t('adminSalary.unpaidSalaries')}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-islamic-dark">৳{totalAmount.toLocaleString(locale)}</p>
            <p className="text-xs text-muted-foreground">{t('adminSalary.totalAmount')}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-islamic-dark">{records.length}</p>
            <p className="text-xs text-muted-foreground">{t('hifz.totalRecords')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground whitespace-nowrap">{t('common.month')}:</Label>
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder={t('adminSalary.selectMonth')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('adminSalary.allMonths')}</SelectItem>
              {MONTHS.map((m) => <SelectItem key={m} value={m}>{monthLabel(m)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground whitespace-nowrap">{t('common.year')}:</Label>
          <Input className="w-28" type="number" placeholder={t('common.year')} value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'paid', 'unpaid', 'partial'].map((status) => (
            <Button
              key={status}
              size="sm"
              variant={statusFilter === status ? 'default' : 'outline'}
              onClick={() => setStatusFilter(status)}
              className={`text-xs cursor-pointer ${statusFilter === status ? 'bg-islamic hover:bg-islamic-light text-white' : ''}`}
            >
              {status === 'all' ? t('common.all') : status === 'paid' ? t('fee.paid') : status === 'unpaid' ? t('adminSalary.unpaid') : t('adminSalary.partial')}
            </Button>
          ))}
        </div>
      </div>

      {/* Table - Desktop */}
      <Card className="shadow-sm hidden md:block">
        <CardContent className="p-0">
          {filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold text-muted-foreground">{t('classRoutine.teacher')}</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminSalary.designation')}</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminSalary.department')}</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">{t('common.month')}</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-right">{t('adminSalary.basicSalary')}</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-right">{t('adminSalary.allowance')}</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-right">{t('adminSalary.deduction')}</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-right">{t('adminSalary.netSalary')}</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-center">{t('common.status')}</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="py-3">
                        <p className="font-medium text-sm text-islamic-dark">{record.teacherName}</p>
                      </TableCell>
                      <TableCell className="text-sm py-3 text-muted-foreground">{record.designation || '—'}</TableCell>
                      <TableCell className="text-sm py-3 text-muted-foreground">{record.department || '—'}</TableCell>
                      <TableCell className="text-sm py-3 text-muted-foreground">{monthLabel(record.month)} {record.year}</TableCell>
                      <TableCell className="text-sm py-3 text-right">৳{(record.basicSalary || 0).toLocaleString(locale)}</TableCell>
                      <TableCell className="text-sm py-3 text-right text-green-600">+৳{(record.allowance || 0).toLocaleString(locale)}</TableCell>
                      <TableCell className="text-sm py-3 text-right text-red-600">-৳{(record.deduction || 0).toLocaleString(locale)}</TableCell>
                      <TableCell className="text-sm py-3 text-right font-semibold">৳{(record.netSalary || 0).toLocaleString(locale)}</TableCell>
                      <TableCell className="py-3 text-center">
                        <Badge className={`text-xs ${
                          record.status === 'paid' ? 'bg-green-100 text-green-700 border-green-200' :
                          record.status === 'partial' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                          'bg-red-100 text-red-700 border-red-200'
                        }`}>
                          {record.status === 'paid' ? t('fee.paid') : record.status === 'partial' ? t('adminSalary.partial') : t('adminSalary.unpaid')}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {record.status !== 'paid' && (
                            <Button size="sm" variant="outline" onClick={() => markAsPaid(record)} className="text-xs gap-1 cursor-pointer text-green-600 hover:text-green-700">
                              {t('fee.pay')}
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-islamic cursor-pointer" onClick={() => openEdit(record)}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-red-600 cursor-pointer" onClick={() => setDeleteTarget(record)}>
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Wallet className="size-12 opacity-20 mb-3" />
              <p className="text-sm">{t('adminSalary.noRecords')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((record) => (
              <Card key={record.id} className="shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm truncate">{record.teacherName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{record.designation || '—'} · {record.department || '—'}</p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {record.status !== 'paid' && (
                        <Button size="sm" variant="outline" onClick={() => markAsPaid(record)} className="text-[10px] gap-0.5 cursor-pointer text-green-600 hover:text-green-700 h-7 px-2">
                          {t('fee.pay')}
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(record)}><Pencil className="size-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => setDeleteTarget(record)}><Trash2 className="size-3.5" /></Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium">{monthLabel(record.month)} {record.year}</span>
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">{t('adminSalary.netShort', { amount: (record.netSalary || 0).toLocaleString(locale) })}</span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      record.status === 'paid' ? 'bg-green-100 text-green-700' :
                      record.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {record.status === 'paid' ? t('fee.paid') : record.status === 'partial' ? t('adminSalary.partial') : t('adminSalary.unpaid')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Wallet className="size-12 opacity-20 mb-3" />
            <p className="text-sm">{t('adminSalary.noRecords')}</p>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) { setEditing(null); setForm(EMPTY_FORM); }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-islamic-dark">
              {editing ? t('adminSalary.editRecord') : t('adminSalary.newRecord')}
            </DialogTitle>
            <DialogDescription>{t('adminSalary.dialogDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t('classRoutine.teacher')} *</Label>
              <Select value={form.teacherId} onValueChange={handleTeacherSelect} disabled={!!editing}>
                <SelectTrigger><SelectValue placeholder={t('adminSalary.selectTeacher')} /></SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sal-desig">{t('adminSalary.designation')}</Label>
                <Input id="sal-desig" placeholder={t('adminSalary.designation')} value={form.designation} onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sal-dept">{t('adminSalary.department')}</Label>
                <Input id="sal-dept" placeholder={t('adminSalary.department')} value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sal-basic">{t('adminSalary.basicSalaryTaka')} *</Label>
                <Input id="sal-basic" type="number" placeholder={t('adminSalary.basicSalary')} value={form.basicSalary} onChange={(e) => setForm((f) => ({ ...f, basicSalary: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sal-allow">{t('adminSalary.allowanceTaka')}</Label>
                <Input id="sal-allow" type="number" placeholder={t('adminSalary.allowance')} value={form.allowance} onChange={(e) => setForm((f) => ({ ...f, allowance: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sal-ded">{t('adminSalary.deductionTaka')}</Label>
                <Input id="sal-ded" type="number" placeholder={t('adminSalary.deduction')} value={form.deduction} onChange={(e) => setForm((f) => ({ ...f, deduction: e.target.value }))} />
              </div>
            </div>
            <Card className="bg-islamic/5 border-islamic/20">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">{t('adminSalary.netSalaryAuto')}</p>
                <p className="text-xl font-bold text-islamic-dark">৳{netSalary.toLocaleString(locale)}</p>
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('common.month')}</Label>
                <Select value={form.month} onValueChange={(v) => setForm((f) => ({ ...f, month: v }))}>
                  <SelectTrigger><SelectValue placeholder={t('common.month')} /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => <SelectItem key={m} value={m}>{monthLabel(m)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sal-year">{t('common.year')}</Label>
                <Input id="sal-year" type="number" placeholder={t('common.year')} value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('common.status')}</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">{t('adminSalary.unpaid')}</SelectItem>
                    <SelectItem value="paid">{t('fee.paid')}</SelectItem>
                    <SelectItem value="partial">{t('adminSalary.partial')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sal-paid">{t('adminSalary.paidAmount')}</Label>
                <Input id="sal-paid" type="number" placeholder={t('common.amount')} value={form.paidAmount} onChange={(e) => setForm((f) => ({ ...f, paidAmount: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sal-date">{t('adminSalary.paidDate')}</Label>
                <Input id="sal-date" type="date" value={form.paidDate} onChange={(e) => setForm((f) => ({ ...f, paidDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sal-method">{t('adminSalary.paymentMethod')}</Label>
                <Input id="sal-method" placeholder={t('adminSalary.methodExample')} value={form.paymentMethod} onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sal-notes">{t('common.notes')}</Label>
              <Textarea id="sal-notes" placeholder={t('adminSalary.extraNotes')} rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); setEditing(null); setForm(EMPTY_FORM); }}>{t('common.cancel')}</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer">
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {editing ? t('common.update') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('adminSalary.deleteRecordDesc', { name: deleteTarget?.teacherName || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white gap-2 cursor-pointer">
              {deleting && <Loader2 className="size-4 animate-spin" />}
              {t('common.confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
