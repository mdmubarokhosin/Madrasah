'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Award,
  Loader2,
  X,
  BookPlus,
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { dbPush, dbUpdate, dbRemove } from '@/lib/db-service';
import type { ExamResult, SubjectMark } from '@/types/database';
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

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

interface SubjectForm {
  name: string;
  fullMarks: number;
  obtainedMarks: number;
}

interface ResultForm {
  studentId: string;
  examId: string;
  studentName: string;
  studentRoll: string;
  registrationNumber: string;
  examName: string;
  department: string;
  class: string;
  subjects: SubjectForm[];
}

const EMPTY_SUBJECT: SubjectForm = {
  name: '',
  fullMarks: 100,
  obtainedMarks: 0,
};

const EMPTY_FORM: ResultForm = {
  studentId: '',
  examId: '',
  studentName: '',
  studentRoll: '',
  registrationNumber: '',
  examName: '',
  department: '',
  class: '',
  subjects: [{ ...EMPTY_SUBJECT }],
};

/* ------------------------------------------------------------------ */
/*  Grade helpers                                                      */
/* ------------------------------------------------------------------ */

function calculateGrade(percentage: number): string {
  if (percentage >= 80) return 'A+';
  if (percentage >= 70) return 'A';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  return 'F';
}

const GRADE_LABEL_KEYS: Record<string, string> = {
  'A+': 'adminResults.gradeAPlus',
  'A': 'adminResults.gradeA',
  'B': 'adminResults.gradeB',
  'C': 'adminResults.gradeC',
  'F': 'adminResults.gradeF',
};

function getGradeBadgeClasses(grade: string): string {
  switch (grade) {
    case 'A+':
      return 'bg-green-100 text-green-700 border-green-200 hover:bg-green-100';
    case 'A':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
    case 'B':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100';
    case 'C':
      return 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100';
    case 'F':
      return 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100';
    default:
      return '';
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminResults() {
  const { results, students, exams } = useAppStore();
  const { toast } = useToast();
  const { t } = useTranslation();

  /* Dialog state */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExamResult | null>(null);
  const [form, setForm] = useState<ResultForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  /* Delete confirmation */
  const [deleteTarget, setDeleteTarget] = useState<ExamResult | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* Computed values from form */
  const totalMarks = useMemo(
    () => form.subjects.reduce((sum, s) => sum + (Number(s.fullMarks) || 0), 0),
    [form.subjects]
  );

  const obtainedTotal = useMemo(
    () => form.subjects.reduce((sum, s) => sum + (Number(s.obtainedMarks) || 0), 0),
    [form.subjects]
  );

  const percentage = totalMarks > 0 ? (obtainedTotal / totalMarks) * 100 : 0;
  const grade = calculateGrade(percentage);

  /* Helpers */
  const resetAndOpen = useCallback(() => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((item: ExamResult) => {
    setEditingItem(item);
    setForm({
      studentId: item.studentId,
      examId: item.examId,
      studentName: item.studentName,
      studentRoll: item.studentRoll,
      registrationNumber: item.registrationNumber || '',
      examName: item.examName,
      department: item.department,
      class: item.class,
      subjects: item.subjects.length > 0
        ? item.subjects.map((s) => ({
            name: s.name,
            fullMarks: s.fullMarks,
            obtainedMarks: s.obtainedMarks,
          }))
        : [{ ...EMPTY_SUBJECT }],
    });
    setDialogOpen(true);
  }, []);

  /* Auto-fill from student/exam selection */
  const handleStudentChange = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    setForm((f) => ({
      ...f,
      studentId,
      studentName: student?.name || '',
      studentRoll: student?.roll || '',
      registrationNumber: student?.registrationNumber || '',
      department: student?.department || '',
      class: student?.class || '',
    }));
  };

  const handleExamChange = (examId: string) => {
    const exam = exams.find((e) => e.id === examId);
    setForm((f) => ({
      ...f,
      examId,
      examName: exam?.name || '',
    }));
  };

  /* Subject management */
  const addSubject = () => {
    setForm((f) => ({
      ...f,
      subjects: [...f.subjects, { ...EMPTY_SUBJECT }],
    }));
  };

  const removeSubject = (index: number) => {
    setForm((f) => ({
      ...f,
      subjects: f.subjects.filter((_, i) => i !== index),
    }));
  };

  const updateSubject = (index: number, field: keyof SubjectForm, value: string | number) => {
    setForm((f) => ({
      ...f,
      subjects: f.subjects.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    }));
  };

  /* Submit handler */
  const handleSubmit = async () => {
    if (!form.studentId || !form.examId) {
      toast({ title: t('common.error'), description: t('adminResults.studentExamRequired'), variant: 'destructive' });
      return;
    }

    if (form.subjects.length === 0 || form.subjects.some((s) => !s.name.trim())) {
      toast({ title: t('common.error'), description: t('adminResults.subjectNameRequired'), variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const subjects: SubjectMark[] = form.subjects.map((s) => ({
        name: s.name.trim(),
        fullMarks: Number(s.fullMarks) || 0,
        obtainedMarks: Number(s.obtainedMarks) || 0,
      }));

      const total = subjects.reduce((sum, s) => sum + s.fullMarks, 0);
      const obtained = subjects.reduce((sum, s) => sum + s.obtainedMarks, 0);
      const pct = total > 0 ? (obtained / total) * 100 : 0;
      const grade = calculateGrade(pct);

      const payload = {
        studentId: form.studentId,
        studentName: form.studentName,
        studentRoll: form.studentRoll,
        registrationNumber: form.registrationNumber,
        examId: form.examId,
        examName: form.examName,
        department: form.department,
        class: form.class,
        subjects,
        totalMarks: total,
        obtainedTotal: obtained,
        grade,
      };

      if (editingItem) {
        await dbUpdate('/results/' + editingItem.id, payload);
        toast({ title: t('common.success'), description: t('adminResults.updated') });
      } else {
        await dbPush('/results', {
          ...payload,
          createdAt: Date.now(),
        });
        toast({ title: t('common.success'), description: t('adminResults.created') });
      }
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      setEditingItem(null);
    } catch {
      toast({ title: t('common.error'), description: t('common.operationFailed'), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  /* Delete handler */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await dbRemove('/results/' + deleteTarget.id);
      toast({ title: t('common.success'), description: t('adminResults.deleted') });
      setDeleteTarget(null);
    } catch {
      toast({ title: t('common.error'), description: t('common.deleteFailed'), variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-islamic-dark">{t('admin.results')}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t('adminResults.count', { count: results.length })}
          </p>
        </div>
        <Button
          onClick={resetAndOpen}
          className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
        >
          <Plus className="size-4" />
          {t('adminResults.addNew')}
        </Button>
      </div>

      {/* Table - Desktop */}
      <Card className="shadow-sm hidden md:block">
        <CardContent className="p-0">
          {results.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold text-muted-foreground">
                      {t('adminResults.student')}
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground hidden lg:table-cell">
                      {t('adminResults.exam')}
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground w-24 text-center">
                      {t('adminResults.totalMarks')}
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground w-24 text-center">
                      {t('adminResults.obtainedMarks')}
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground w-20 text-center">
                      {t('adminResults.grade')}
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground w-28 text-right">
                      {t('common.actions')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="py-3">
                        <p className="font-medium text-sm text-islamic-dark">{item.studentName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t('adminResults.rollColon')} {item.studentRoll}</p>
                        {/* Show exam name on small screens */}
                        <p className="text-xs text-muted-foreground mt-0.5 lg:hidden">
                          {t('adminResults.examColon')} {item.examName}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground py-3 hidden lg:table-cell">
                        {item.examName}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground py-3 text-center font-mono">
                        {item.totalMarks}
                      </TableCell>
                      <TableCell className="text-sm text-islamic-dark py-3 text-center font-mono font-semibold">
                        {item.obtainedTotal}
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        <Badge className={`text-xs ${getGradeBadgeClasses(item.grade)}`}>
                          {item.grade}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-islamic cursor-pointer"
                            onClick={() => openEdit(item)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-red-600 cursor-pointer"
                            onClick={() => setDeleteTarget(item)}
                          >
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
              <Award className="size-12 opacity-20 mb-3" />
              <p className="text-sm">{t('adminResults.noData')}</p>
              <p className="text-xs mt-1">{t('adminResults.addHint')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden">
        {results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {results.map((item) => (
              <Card key={item.id} className="shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm truncate">{item.studentName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t('adminResults.rollColon')} {item.studentRoll} · {item.examName}</p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(item)}><Pencil className="size-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => setDeleteTarget(item)}><Trash2 className="size-3.5" /></Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                      {t('adminResults.obtainedColon')} {item.obtainedTotal}/{item.totalMarks}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${getGradeBadgeClasses(item.grade)}`}>
                      {item.grade}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Award className="size-12 opacity-20 mb-3" />
            <p className="text-sm">{t('adminResults.noData')}</p>
            <p className="text-xs mt-1">{t('adminResults.addHint')}</p>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) { setEditingItem(null); setForm(EMPTY_FORM); }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-islamic-dark">
              {editingItem ? t('adminResults.editTitle') : t('adminResults.addNew')}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? t('adminResults.editDesc') : t('adminResults.createDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Student & Exam Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('adminResults.studentSelect')} *</Label>
                <Select
                  value={form.studentId}
                  onValueChange={handleStudentChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('adminResults.studentPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({t('adminResults.rollColon')} {s.roll}{s.registrationNumber ? `, ${t('adminResults.regColon')} ${s.registrationNumber}` : ''})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.studentName && (
                  <p className="text-xs text-muted-foreground">
                    {t('adminResults.departmentColon')} {form.department || '—'} | {t('adminResults.classColon')} {form.class || '—'}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>{t('adminResults.examSelect')} *</Label>
                <Select
                  value={form.examId}
                  onValueChange={handleExamChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('adminResults.examPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {exams.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name} ({e.year || t('adminResults.noYear')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.examName && (
                  <p className="text-xs text-muted-foreground">{form.examName}</p>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* Subjects header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-islamic-dark">{t('adminResults.subjects')}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('adminResults.subjectsHint')}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSubject}
                className="gap-1.5 text-xs border-islamic/30 text-islamic hover:bg-islamic-lighter hover:text-islamic-dark cursor-pointer"
              >
                <BookPlus className="size-3.5" />
                {t('adminResults.addSubject')}
              </Button>
            </div>

            {/* Subjects list */}
            <div className="space-y-3">
              {form.subjects.map((subject, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-border/60 p-3 bg-muted/30"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-3">
                      {/* Subject name */}
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          {t('adminResults.subjectName')}
                        </Label>
                        <Input
                          placeholder={t('adminResults.subjectPlaceholder')}
                          value={subject.name}
                          onChange={(e) => updateSubject(index, 'name', e.target.value)}
                          className="mt-1 h-8 text-sm"
                        />
                      </div>
                      {/* Marks row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            {t('adminResults.fullMarks')}
                          </Label>
                          <Input
                            type="number"
                            placeholder={t('adminResults.hundred')}
                            value={subject.fullMarks}
                            onChange={(e) =>
                              updateSubject(index, 'fullMarks', Number(e.target.value) || 0)
                            }
                            className="mt-1 h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            {t('adminResults.obtainedMarks')}
                          </Label>
                          <Input
                            type="number"
                            placeholder={t('adminResults.zero')}
                            value={subject.obtainedMarks}
                            onChange={(e) =>
                              updateSubject(index, 'obtainedMarks', Number(e.target.value) || 0)
                            }
                            className="mt-1 h-8 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                    {/* Remove subject button */}
                    {form.subjects.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-red-600 shrink-0 mt-1 cursor-pointer"
                        onClick={() => removeSubject(index)}
                      >
                        <X className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            {form.subjects.length > 0 && totalMarks > 0 && (
              <div className="rounded-lg border border-golden/30 bg-golden-lighter/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-xs text-muted-foreground">{t('adminResults.totalMarks')}</p>
                      <p className="text-lg font-bold text-islamic-dark font-mono">{totalMarks}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('adminResults.obtainedMarks')}</p>
                      <p className="text-lg font-bold text-islamic-dark font-mono">{obtainedTotal}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('adminResults.percentage')}</p>
                      <p className="text-lg font-bold text-islamic-dark font-mono">{percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">{t('adminResults.grade')}</p>
                    <Badge className={`text-sm px-3 py-1 ${getGradeBadgeClasses(grade)}`}>
                      {grade} — {t(GRADE_LABEL_KEYS[grade] || 'adminResults.grade')}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setDialogOpen(false); setEditingItem(null); setForm(EMPTY_FORM); }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {editingItem ? t('common.update') : t('common.save')}
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
              {t('adminResults.deleteDesc', { name: deleteTarget?.studentName || '', exam: deleteTarget?.examName || '' })}{' '}{t('common.permanentDeleteWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white gap-2 cursor-pointer"
            >
              {deleting && <Loader2 className="size-4 animate-spin" />}
              {t('common.confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
