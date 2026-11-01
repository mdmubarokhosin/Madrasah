'use client';

import { useState, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Award,
  Loader2,
  X,
  BookPlus,
  Layers,
  Search,
  Eye,
  EyeOff,
  Trash,
  Info,
  TableProperties,
  ClipboardPaste,
  ClipboardCheck,
  ListChecks,
  AlertTriangle,
  GraduationCap,
  BookOpen,
  BarChart3,
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { dbPush, dbUpdate, dbRemove } from '@/lib/db-service';
import { gradeFromPercent, isExamPublished, sortExamsNewestFirst } from '@/lib/results-service';
import type { ExamResult, Student, SubjectMark } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
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

interface BulkRow {
  obtained: string;
  total: string;
}

/** One parsed row of the paste-import textarea. */
interface ImportRow {
  line: number;
  roll: string;
  name: string;
  obtained: number;
  total: number;
  student: Student | null;
  /** i18n key describing why the row is invalid (null = valid). */
  error: string | null;
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
      return 'bg-primary/10 text-primary border-primary/25 hover:bg-primary/10';
    case 'A':
      return 'bg-primary/10 text-primary border-primary/25 hover:bg-primary/10';
    case 'B':
      return 'bg-warning/20 text-warning-foreground border-warning/40 hover:bg-warning/20';
    case 'C':
      return 'bg-warning/20 text-warning-foreground border-warning/40 hover:bg-warning/20';
    case 'F':
      return 'bg-danger/10 text-danger border-danger/40 hover:bg-danger/10';
    default:
      return '';
  }
}

/** Grouped-section heading used inside dialogs. */
function SectionHeader({ icon: Icon, title }: { icon: React.ComponentType<{ className?: string }>; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-islamic-lighter text-islamic shrink-0" aria-hidden="true">
        <Icon className="size-3.5" />
      </span>
      <h3 className="text-sm font-bold text-islamic-dark">{title}</h3>
      <span className="h-px flex-1 bg-gradient-to-r from-islamic/25 to-transparent" aria-hidden="true" />
    </div>
  );
}

const isNumeric = (v: string) => v !== '' && !Number.isNaN(Number(v));

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminResults() {
  const { results, students, exams } = useAppStore();
  const { toast } = useToast();
  const { t } = useTranslation();

  /* ---------- single-entry dialog state ---------- */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExamResult | null>(null);
  const [form, setForm] = useState<ResultForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  /* ---------- delete single ---------- */
  const [deleteTarget, setDeleteTarget] = useState<ExamResult | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ---------- filters ---------- */
  const [filterExam, setFilterExam] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<'merit' | 'roll' | 'name'>('merit');

  /* ---------- bulk entry ---------- */
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkExamId, setBulkExamId] = useState('');
  const [bulkClass, setBulkClass] = useState('');
  const [bulkRows, setBulkRows] = useState<Record<string, BulkRow>>({});
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });

  /* ---------- paste import ---------- */
  const [importOpen, setImportOpen] = useState(false);
  const [importExamId, setImportExamId] = useState('');
  const [importClass, setImportClass] = useState('');
  const [importText, setImportText] = useState('');
  const [importSaving, setImportSaving] = useState(false);
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });

  /* ---------- delete whole exam results ---------- */
  const [deleteExamOpen, setDeleteExamOpen] = useState(false);
  const [deleteExamId, setDeleteExamId] = useState('');
  const [deleteExamBusy, setDeleteExamBusy] = useState(false);

  /* ---------- derived helpers ---------- */

  // Results indexed by "studentId::examId" for duplicate-aware entry.
  const existingByKey = new Map<string, ExamResult>();
  results.forEach((r) => {
    if (r.studentId && r.examId) existingByKey.set(`${r.studentId}::${r.examId}`, r);
  });

  const sortedExams = sortExamsNewestFirst(exams);

  const resultClasses = Array.from(
    new Set(results.map((r) => r.class).filter(Boolean))
  ).sort();

  const filteredResults = results.filter((r) => {
    if (filterExam !== 'all' && r.examId !== filterExam) return false;
    if (filterClass !== 'all' && r.class !== filterClass) return false;
    const q = search.trim().toLowerCase();
    if (q) {
      const hay = `${r.studentName} ${r.studentRoll} ${r.registrationNumber || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  // Grade distribution + pass rate for the filtered set.
  const gradeCounts = filteredResults.reduce<Record<string, number>>((acc, r) => {
    const g = r.grade || 'F';
    acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {});
  const filteredPassed = filteredResults.filter((r) => (r.grade || 'F') !== 'F').length;
  const passRate = filteredResults.length > 0 ? (filteredPassed / filteredResults.length) * 100 : 0;

  // When a specific exam is filtered, offer merit/roll/name ordering.
  const showRank = filterExam !== 'all';
  const displayResults = (() => {
    if (!showRank) return filteredResults;
    const arr = [...filteredResults];
    if (sortMode === 'roll') {
      arr.sort((a, b) => (a.studentRoll || '').localeCompare(b.studentRoll || '', undefined, { numeric: true }));
    } else if (sortMode === 'name') {
      arr.sort((a, b) => (a.studentName || '').localeCompare(b.studentName || '', undefined));
    } else {
      arr.sort((a, b) => (b.obtainedTotal || 0) - (a.obtainedTotal || 0));
    }
    return arr;
  })();

  const filterExamRecord = exams.find((e) => e.id === filterExam);
  const filterExamPublished = filterExamRecord ? isExamPublished(filterExamRecord) : true;

  /* ---------- single-entry helpers ---------- */

  const totalMarks = form.subjects.reduce((sum, s) => sum + (Number(s.fullMarks) || 0), 0);
  const obtainedTotal = form.subjects.reduce((sum, s) => sum + (Number(s.obtainedMarks) || 0), 0);
  const percentage = totalMarks > 0 ? (obtainedTotal / totalMarks) * 100 : 0;
  const formGrade = gradeFromPercent(percentage);
  const hasSubjectError = form.subjects.some(
    (s) => (Number(s.fullMarks) || 0) < 1 || (Number(s.obtainedMarks) || 0) > (Number(s.fullMarks) || 0)
  );

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

  const handleSubmit = async () => {
    if (!form.studentId || !form.examId) {
      toast({ title: t('common.error'), description: t('adminResults.studentExamRequired'), variant: 'destructive' });
      return;
    }

    if (form.subjects.length === 0 || form.subjects.some((s) => !s.name.trim())) {
      toast({ title: t('common.error'), description: t('adminResults.subjectNameRequired'), variant: 'destructive' });
      return;
    }

    if (form.subjects.some((s) => (Number(s.fullMarks) || 0) < 1)) {
      toast({ title: t('common.error'), description: t('adminResults.fullMarksInvalid'), variant: 'destructive' });
      return;
    }

    if (form.subjects.some((s) => (Number(s.obtainedMarks) || 0) > (Number(s.fullMarks) || 0))) {
      toast({ title: t('common.error'), description: t('adminResults.obtainedAboveFull'), variant: 'destructive' });
      return;
    }

    // Duplicate guard: one result per student per exam.
    if (!editingItem && existingByKey.has(`${form.studentId}::${form.examId}`)) {
      toast({ title: t('common.error'), description: t('adminResults.duplicateResult'), variant: 'destructive' });
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
      const grade = gradeFromPercent(pct);

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

  /* ---------- bulk entry helpers ---------- */

  const bulkExam = exams.find((e) => e.id === bulkExamId) || null;
  const bulkStudents: Student[] = bulkClass
    ? students
        .filter((s) => s.class === bulkClass && (!bulkExam?.department || !s.department || s.department === bulkExam.department))
        .sort((a, b) => (a.roll || '').localeCompare(b.roll || '', undefined, { numeric: true }))
    : [];

  const getBulkRow = (student: Student): BulkRow & { exists: boolean; existingId?: string } => {
    const override = bulkRows[student.id];
    const existing = existingByKey.get(`${student.id}::${bulkExamId}`);
    return {
      obtained: override?.obtained ?? (existing ? String(existing.obtainedTotal ?? '') : ''),
      total: override?.total ?? (existing ? String(existing.totalMarks ?? 100) : '100'),
      exists: !!existing,
      existingId: existing?.id,
    };
  };

  const setBulkField = (student: Student, field: keyof BulkRow, value: string) => {
    setBulkRows((prev) => {
      const base = prev[student.id];
      if (base) return { ...prev, [student.id]: { ...base, [field]: value } };
      const row = getBulkRow(student);
      return { ...prev, [student.id]: { obtained: row.obtained, total: row.total, [field]: value } };
    });
  };

  const applyTotalToAll = (value: string) => {
    const next: Record<string, BulkRow> = {};
    bulkStudents.forEach((s) => {
      const row = getBulkRow(s);
      next[s.id] = { obtained: row.obtained, total: value };
    });
    setBulkRows(next);
  };

  const bulkReadyCount = bulkStudents.filter((s) => getBulkRow(s).obtained.trim() !== '').length;

  const handleBulkSave = async () => {
    if (!bulkExamId) {
      toast({ title: t('common.error'), description: t('adminResults.examSelect'), variant: 'destructive' });
      return;
    }
    const entries = bulkStudents
      .map((s) => ({ student: s, row: getBulkRow(s) }))
      .filter(({ row }) => row.obtained.trim() !== '');

    if (entries.length === 0) {
      toast({ title: t('common.error'), description: t('adminResults.bulkNoStudents'), variant: 'destructive' });
      return;
    }

    setBulkSaving(true);
    setBulkProgress({ done: 0, total: entries.length });

    let updated = 0;
    try {
      for (const { student, row } of entries) {
        const total = Math.max(Number(row.total) || 0, 1);
        const obtained = Math.min(Number(row.obtained) || 0, total);
        const pct = (obtained / total) * 100;
        const grade = gradeFromPercent(pct);
        const examNameStored = bulkExam?.name || '';

        const payload = {
          studentId: student.id,
          studentName: student.name,
          studentRoll: student.roll,
          registrationNumber: student.registrationNumber || '',
          examId: bulkExamId,
          examName: examNameStored,
          department: student.department || '',
          class: student.class || '',
          subjects: [{ name: t('adminResults.grandTotalSubject'), fullMarks: total, obtainedMarks: obtained }],
          totalMarks: total,
          obtainedTotal: obtained,
          grade,
        };

        const existingId = row.existingId;
        if (existingId) {
          await dbUpdate('/results/' + existingId, payload);
          updated++;
        } else {
          await dbPush('/results', { ...payload, createdAt: Date.now() });
        }
        setBulkProgress((p) => ({ ...p, done: p.done + 1 }));
      }

      toast({
        title: t('common.success'),
        description:
          t('adminResults.bulkSaved', { count: entries.length - updated }) +
          (updated > 0 ? ' ' + t('adminResults.bulkSkipped', { count: updated }) : ''),
      });
      setBulkOpen(false);
      setBulkRows({});
      setBulkExamId('');
      setBulkClass('');
    } catch {
      toast({ title: t('common.error'), description: t('common.operationFailed'), variant: 'destructive' });
    } finally {
      setBulkSaving(false);
    }
  };

  /* ---------- paste-import helpers ---------- */

  const importExam = exams.find((e) => e.id === importExamId) || null;
  const studentByRoll = new Map<string, Student>();
  students.forEach((s) => {
    const roll = (s.roll || '').trim().toLowerCase();
    if (roll && !studentByRoll.has(roll)) studentByRoll.set(roll, s);
  });

  const importRows: ImportRow[] = (() => {
    if (!importText.trim()) return [];
    let lines = importText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    // Auto-skip a header row ("roll,name,obtained,total" etc.).
    if (lines.length > 0 && /^(roll|রোল|reg|রেজি)/i.test(lines[0]) && !isNumeric(lines[0].split(/[,\t;]/)[0] || '')) {
      lines = lines.slice(1);
    }

    return lines.map((line, i) => {
      const makeError = (key: string): ImportRow => ({
        line: i + 1, roll: line.split(/[,\t;]/)[0]?.trim() || '', name: '', obtained: 0, total: 100, student: null, error: key,
      });

      const parts = line.split(/[,\t;]+/).map((p) => p.trim());
      if (parts.length < 2 || !parts[0]) return makeError('adminResults.importErrRoll');

      const roll = parts[0];
      let name = '';
      let obtStr = '';
      let totalStr = '';

      if (parts.length >= 3) {
        if (isNumeric(parts[1])) {
          // roll, obtained, total
          obtStr = parts[1];
          totalStr = parts[2] || '';
        } else {
          // roll, name, obtained[, total]
          name = parts[1];
          obtStr = parts[2];
          totalStr = parts[3] || '';
        }
      } else {
        // roll, obtained
        if (!isNumeric(parts[1])) return makeError('adminResults.importErrMarks');
        obtStr = parts[1];
      }

      if (!isNumeric(obtStr)) return makeError('adminResults.importErrMarks');
      const obtained = Number(obtStr);

      let total = 100;
      if (totalStr !== '') {
        if (!isNumeric(totalStr)) return makeError('adminResults.importErrTotal');
        total = Number(totalStr);
      }
      if (total <= 0) return makeError('adminResults.importErrTotal');
      if (obtained < 0 || obtained > total) return makeError('adminResults.importErrRange');

      const student = studentByRoll.get(roll.toLowerCase()) || null;
      if (!student && !name) return makeError('adminResults.importErrNoName');

      return { line: i + 1, roll, name, obtained, total, student, error: null };
    });
  })();

  const importValidRows = importRows.filter((r) => !r.error);
  const importInvalidCount = importRows.length - importValidRows.length;

  const handleImportSave = async () => {
    if (!importExamId) {
      toast({ title: t('common.error'), description: t('adminResults.examSelect'), variant: 'destructive' });
      return;
    }
    if (importValidRows.length === 0) {
      toast({ title: t('common.error'), description: t('adminResults.importNoRows'), variant: 'destructive' });
      return;
    }

    setImportSaving(true);
    setImportProgress({ done: 0, total: importValidRows.length });

    let added = 0;
    let updated = 0;
    try {
      for (const row of importValidRows) {
        const student = row.student;
        const studentId = student?.id || '';
        const existing = studentId ? existingByKey.get(`${studentId}::${importExamId}`) : undefined;

        const payload = {
          studentId,
          studentName: student?.name || row.name,
          studentRoll: student?.roll || row.roll,
          registrationNumber: student?.registrationNumber || '',
          examId: importExamId,
          examName: importExam?.name || '',
          department: student?.department || '',
          class: student?.class || importClass || '',
          subjects: [{ name: t('adminResults.grandTotalSubject'), fullMarks: row.total, obtainedMarks: row.obtained }],
          totalMarks: row.total,
          obtainedTotal: row.obtained,
          grade: gradeFromPercent(row.total > 0 ? (row.obtained / row.total) * 100 : 0),
        };

        if (existing) {
          await dbUpdate('/results/' + existing.id, payload);
          updated++;
        } else {
          await dbPush('/results', { ...payload, createdAt: Date.now() });
          added++;
        }
        setImportProgress((p) => ({ ...p, done: p.done + 1 }));
      }

      toast({
        title: t('common.success'),
        description: t('adminResults.importDone', { added, updated }),
      });
      setImportOpen(false);
      setImportText('');
      setImportExamId('');
      setImportClass('');
    } catch {
      toast({ title: t('common.error'), description: t('common.operationFailed'), variant: 'destructive' });
    } finally {
      setImportSaving(false);
    }
  };

  /* ---------- delete whole exam results ---------- */

  const deleteExamTarget = exams.find((e) => e.id === deleteExamId) || null;
  const deleteExamCount = deleteExamId
    ? results.filter((r) => r.examId === deleteExamId).length
    : 0;

  const handleDeleteExamResults = async () => {
    if (!deleteExamId || deleteExamCount === 0) return;
    setDeleteExamBusy(true);
    try {
      const nulls: Record<string, null> = {};
      results
        .filter((r) => r.examId === deleteExamId)
        .forEach((r) => { nulls[r.id] = null; });
      await dbUpdate('/results', nulls);
      toast({
        title: t('common.success'),
        description: t('adminResults.deleteExamDone', { count: deleteExamCount }),
      });
      setDeleteExamOpen(false);
      setDeleteExamId('');
    } catch {
      toast({ title: t('common.error'), description: t('common.deleteFailed'), variant: 'destructive' });
    } finally {
      setDeleteExamBusy(false);
    }
  };

  /* ================================================================== */
  /*  Render                                                             */
  /* ================================================================== */

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-islamic-dark">{t('admin.results')}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t('adminResults.count', { count: results.length })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => { setDeleteExamOpen(true); setDeleteExamId(''); }}
            className="gap-2 border-danger/40 text-danger hover:bg-danger/10 hover:text-danger cursor-pointer"
          >
            <Trash className="size-4" />
            <span className="hidden sm:inline">{t('adminResults.deleteExamResults')}</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => { setImportOpen(true); setImportExamId(''); setImportClass(''); setImportText(''); }}
            className="gap-2 border-golden/50 text-islamic-dark hover:bg-golden-lighter/60 hover:text-islamic-dark cursor-pointer"
          >
            <ClipboardPaste className="size-4" />
            <span className="hidden sm:inline">{t('adminResults.importPaste')}</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => { setBulkOpen(true); setBulkExamId(''); setBulkClass(''); setBulkRows({}); }}
            className="gap-2 border-islamic/30 text-islamic hover:bg-islamic-lighter hover:text-islamic-dark cursor-pointer"
          >
            <Layers className="size-4" />
            {t('adminResults.bulkEntry')}
          </Button>
          <Button
            onClick={resetAndOpen}
            className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
          >
            <Plus className="size-4" />
            {t('adminResults.addNew')}
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <Card className="shadow-sm border-islamic/10">
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select value={filterExam} onValueChange={(v) => setFilterExam(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('adminResults.filterAllExams')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('adminResults.filterAllExams')}</SelectItem>
                {sortedExams.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterClass} onValueChange={(v) => setFilterClass(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('adminResults.filterAllClasses')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('adminResults.filterAllClasses')}</SelectItem>
                {resultClasses.map((cls) => (
                  <SelectItem key={cls} value={cls}>
                    {cls}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative sm:col-span-2">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('adminResults.searchPlaceholder')}
                className="ps-9"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="text-xs text-muted-foreground">
              {t('adminResults.showing', { count: displayResults.length })}
            </span>
            {showRank && filterExamRecord && (
              <Badge
                className={`gap-1 text-[10px] px-2 py-0.5 border ${
                  filterExamPublished
                    ? 'bg-primary/5 text-primary border-primary/25'
                    : 'bg-surface-tertiary text-muted-foreground border-border'
                }`}
              >
                {filterExamPublished ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
                {filterExamPublished ? t('adminResults.published') : t('adminResults.unpublished')}
              </Badge>
            )}
            {!filterExamPublished && (
              <span className="inline-flex items-center gap-1 text-xs text-warning-foreground">
                <Info className="size-3.5" />
                {t('adminResults.publishHint')}
              </span>
            )}
          </div>

          {/* Grade distribution + pass rate for the filtered set */}
          {filteredResults.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border/50">
              <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                <BarChart3 className="size-3.5" />
                {t('adminResults.gradeDist')}:
              </span>
              {(['A+', 'A', 'B', 'C', 'F'] as const).map((g) =>
                gradeCounts[g] ? (
                  <Badge key={g} className={`text-[10px] px-2 py-0.5 border ${getGradeBadgeClasses(g)}`}>
                    {g} · {gradeCounts[g]}
                  </Badge>
                ) : null
              )}
              <span className="text-[11px] text-muted-foreground ms-auto inline-flex items-center gap-1">
                <Award className="size-3.5 text-islamic" />
                {t('adminResults.passRate')}: <strong className="text-islamic-dark font-semibold">{passRate.toFixed(0)}%</strong>
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table - Desktop */}
      <Card className="shadow-sm hidden md:block">
        <CardContent className="p-0">
          {displayResults.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {showRank && (
                      <TableHead className="text-xs font-semibold text-muted-foreground w-16 text-center">
                        {t('adminResults.rankCol')}
                      </TableHead>
                    )}
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
                  {displayResults.map((item, idx) => (
                    <TableRow key={item.id}>
                      {showRank && (
                        <TableCell className="py-3 text-center">
                          <span className={`inline-flex w-7 h-7 items-center justify-center rounded-lg text-xs font-bold ${
                            sortMode === 'merit' && idx === 0 ? 'bg-warning/20 text-warning-foreground' :
                            sortMode === 'merit' && idx === 1 ? 'bg-surface-tertiary text-muted-foreground' :
                            sortMode === 'merit' && idx === 2 ? 'bg-warning/20 text-warning-foreground' :
                            'bg-surface-tertiary text-muted-foreground'
                          }`}>
                            {idx + 1}
                          </span>
                        </TableCell>
                      )}
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
                            aria-label={`${t('common.update')}: ${item.studentName}`}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-danger cursor-pointer"
                            onClick={() => setDeleteTarget(item)}
                            aria-label={`${t('common.confirmDelete')}: ${item.studentName}`}
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
              <p className="text-sm">
                {results.length > 0 ? t('adminResults.noMatch') : t('adminResults.noData')}
              </p>
              {results.length === 0 && (
                <p className="text-xs mt-1">{t('adminResults.addHint')}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden">
        {displayResults.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {displayResults.map((item, idx) => (
              <Card key={item.id} className="shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm truncate">
                        {showRank && sortMode === 'merit' && <span className="text-islamic me-1">#{idx + 1}</span>}
                        {item.studentName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t('adminResults.rollColon')} {item.studentRoll} · {item.examName}</p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(item)} aria-label={`${t('common.update')}: ${item.studentName}`}><Pencil className="size-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => setDeleteTarget(item)} aria-label={`${t('common.confirmDelete')}: ${item.studentName}`}><Trash2 className="size-3.5" /></Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="inline-flex items-center rounded-full bg-primary/5 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      {t('adminResults.obtainedColon')} {item.obtainedTotal}/{item.totalMarks}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${getGradeBadgeClasses(item.grade)}`}>
                      {item.grade}
                    </span>
                    {item.totalMarks > 0 && (
                      <span className="inline-flex items-center rounded-full bg-surface-tertiary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {Math.round(((item.obtainedTotal || 0) / item.totalMarks) * 100)}%
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Award className="size-12 opacity-20 mb-3" />
            <p className="text-sm">
              {results.length > 0 ? t('adminResults.noMatch') : t('adminResults.noData')}
            </p>
          </div>
        )}
      </div>

      {/* ============ Create/Edit Dialog ============ */}
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
            {/* ── Section 1: Student & Exam ── */}
            <SectionHeader icon={GraduationCap} title={t('adminResults.sectionStudentExam')} />
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
                    {sortedExams.map((e) => (
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

            {/* ── Section 2: Subject-wise marks ── */}
            <SectionHeader icon={BookOpen} title={t('adminResults.sectionMarks')} />
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {t('adminResults.subjectsHint')}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSubject}
                  className="gap-1.5 text-xs border-islamic/30 text-islamic hover:bg-islamic-lighter hover:text-islamic-dark cursor-pointer shrink-0"
                >
                  <BookPlus className="size-3.5" />
                  {t('adminResults.addSubject')}
                </Button>
              </div>

              {form.subjects.map((subject, index) => {
                const full = Number(subject.fullMarks) || 0;
                const obt = Number(subject.obtainedMarks) || 0;
                const rowInvalid = full < 1 || obt > full;
                return (
                  <div
                    key={index}
                    className={`rounded-lg border p-3 ${rowInvalid ? 'border-danger/50 bg-danger/5' : 'border-border/60 bg-surface-tertiary/30'}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-islamic-lighter text-islamic text-[11px] font-bold shrink-0 mt-0.5" aria-hidden="true">
                        {index + 1}
                      </span>
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
                              aria-invalid={full < 1}
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
                              aria-invalid={obt > full && full >= 1}
                              className="mt-1 h-8 text-sm"
                            />
                          </div>
                        </div>
                        {rowInvalid && (
                          <p className="text-[11px] text-danger inline-flex items-center gap-1">
                            <AlertTriangle className="size-3" />
                            {full < 1 ? t('adminResults.fullMarksInvalid') : t('adminResults.obtainedAboveFull')}
                          </p>
                        )}
                      </div>
                      {/* Remove subject button */}
                      {form.subjects.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-danger shrink-0 mt-1 cursor-pointer"
                          onClick={() => removeSubject(index)}
                          aria-label={`${t('common.confirmDelete')} ${subject.name || index + 1}`}
                        >
                          <X className="size-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Section 3: Summary ── */}
            {form.subjects.length > 0 && totalMarks > 0 && (
              <>
                <SectionHeader icon={BarChart3} title={t('adminResults.sectionSummary')} />
                <div className={`rounded-lg border p-4 ${hasSubjectError ? 'border-danger/40 bg-danger/5' : 'border-golden/30 bg-golden-lighter/50'}`}>
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
                      <Badge className={`text-sm px-3 py-1 ${getGradeBadgeClasses(formGrade)}`}>
                        {formGrade} — {t(GRADE_LABEL_KEYS[formGrade] || 'adminResults.grade')}
                      </Badge>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setDialogOpen(false); setEditingItem(null); setForm(EMPTY_FORM); }}
              disabled={submitting}
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

      {/* ============ Paste Import Dialog ============ */}
      <Dialog open={importOpen} onOpenChange={(open) => {
        setImportOpen(open);
        if (!open) { setImportText(''); setImportExamId(''); setImportClass(''); }
      }}>
        <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-islamic-dark flex items-center gap-2">
              <ClipboardCheck className="size-5 text-islamic" />
              {t('adminResults.importTitle')}
            </DialogTitle>
            <DialogDescription>{t('adminResults.importDesc')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Target exam + fallback class */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('adminResults.importExam')} *</Label>
                <Select
                  value={importExamId}
                  onValueChange={setImportExamId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('adminResults.examPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedExams.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name} ({e.year || t('adminResults.noYear')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {importExam && !isExamPublished(importExam) && (
                  <p className="text-xs text-warning-foreground inline-flex items-center gap-1">
                    <Info className="size-3.5" />
                    {t('adminResults.publishHint')}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>{t('adminResults.importClass')}</Label>
                <Select
                  value={importClass}
                  onValueChange={(v) => setImportClass(v === 'none' ? '' : v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('adminResults.filterAllClasses')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {Array.from(new Set(students.map((s) => s.class).filter(Boolean))).sort().map((cls) => (
                      <SelectItem key={cls} value={cls}>
                        {cls}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Textarea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>{t('adminResults.importPaste')} *</Label>
                {importText && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground hover:text-danger cursor-pointer"
                    onClick={() => setImportText('')}
                  >
                    <X className="size-3.5 me-1" />
                    {t('adminResults.clearInput')}
                  </Button>
                )}
              </div>
              <Textarea
                rows={6}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={t('adminResults.importPlaceholder')}
                aria-label={t('adminResults.importTitle')}
                className="font-mono text-xs sm:text-sm min-h-32"
              />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {t('adminResults.importFormat')}
              </p>
            </div>

            {/* Preview */}
            {importRows.length > 0 && (
              <div className="rounded-xl border border-border/60 overflow-hidden">
                <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 bg-surface-tertiary/40 border-b border-border/50">
                  <ListChecks className="size-4 text-islamic" />
                  <span className="text-xs font-semibold text-islamic-dark">
                    {t('adminResults.importPreview')}
                  </span>
                  <Badge className="text-[10px] bg-primary/10 text-primary border-primary/25 ms-auto">
                    {t('adminResults.importValidCount', { count: importValidRows.length })}
                  </Badge>
                  {importInvalidCount > 0 && (
                    <Badge className="text-[10px] bg-danger/10 text-danger border-danger/40">
                      {t('adminResults.importInvalidCount', { count: importInvalidCount })}
                    </Badge>
                  )}
                </div>
                <div className="divide-y divide-border/40 max-h-60 overflow-y-auto">
                  {importRows.slice(0, 200).map((row) => (
                    <div key={row.line} className={`flex flex-wrap sm:flex-nowrap items-center gap-2 px-3 py-2 text-sm ${row.error ? 'bg-danger/5' : 'bg-surface'}`}>
                      <span className="w-6 text-[10px] text-muted-foreground font-mono shrink-0">{row.line}</span>
                      <span className="w-16 sm:w-20 font-mono text-xs text-islamic-dark truncate shrink-0">{row.roll || '—'}</span>
                      <span className="flex-1 min-w-0 truncate text-xs text-islamic-dark">
                        {row.student?.name || row.name || '—'}
                      </span>
                      {row.error ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-danger">
                          <AlertTriangle className="size-3 shrink-0" />
                          {t(row.error)}
                        </span>
                      ) : (
                        <>
                          <span className="font-mono text-xs text-muted-foreground shrink-0">
                            {row.obtained}/{row.total}
                          </span>
                          <Badge className={`text-[10px] shrink-0 ${getGradeBadgeClasses(gradeFromPercent(row.total > 0 ? (row.obtained / row.total) * 100 : 0))}`}>
                            {gradeFromPercent(row.total > 0 ? (row.obtained / row.total) * 100 : 0)}
                          </Badge>
                          <Badge className={`text-[10px] shrink-0 ${row.student ? 'bg-islamic-lighter/60 text-islamic-dark border-islamic/20' : 'bg-surface-tertiary text-muted-foreground border-border'}`}>
                            {row.student ? t('adminResults.importMatched') : t('adminResults.importUnmatched')}
                          </Badge>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                {importRows.length > 200 && (
                  <p className="px-3 py-1.5 text-[10px] text-muted-foreground bg-surface-tertiary/30">
                    +{importRows.length - 200}
                  </p>
                )}
              </div>
            )}

            {/* Progress */}
            {importSaving && importProgress.total > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{importProgress.done}/{importProgress.total}</span>
                  <span>{Math.round((importProgress.done / importProgress.total) * 100)}%</span>
                </div>
                <div className="h-2 rounded-full bg-surface-tertiary overflow-hidden">
                  <div
                    className="h-full bg-islamic transition-all duration-200"
                    style={{ width: `${(importProgress.done / importProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setImportOpen(false); setImportText(''); setImportExamId(''); setImportClass(''); }}
              disabled={importSaving}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleImportSave}
              disabled={importSaving || !importExamId || importValidRows.length === 0}
              className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
            >
              {importSaving ? <Loader2 className="size-4 animate-spin" /> : <ClipboardCheck className="size-4" />}
              {t('adminResults.importSave', { count: importValidRows.length })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ Bulk Entry Dialog ============ */}
      <Dialog open={bulkOpen} onOpenChange={(open) => {
        setBulkOpen(open);
        if (!open) { setBulkExamId(''); setBulkClass(''); setBulkRows({}); }
      }}>
        <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-islamic-dark flex items-center gap-2">
              <Layers className="size-5 text-islamic" />
              {t('adminResults.bulkTitle')}
            </DialogTitle>
            <DialogDescription>{t('adminResults.bulkDesc')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Exam & class selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('adminResults.examSelect')} *</Label>
                <Select
                  value={bulkExamId}
                  onValueChange={(v) => { setBulkExamId(v); setBulkRows({}); }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('adminResults.examPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedExams.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name} ({e.year || t('adminResults.noYear')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {bulkExam && !isExamPublished(bulkExam) && (
                  <p className="text-xs text-warning-foreground inline-flex items-center gap-1">
                    <Info className="size-3.5" />
                    {t('adminResults.publishHint')}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>{t('adminResults.bulkClassSelect')} *</Label>
                <Select
                  value={bulkClass}
                  onValueChange={(v) => { setBulkClass(v); setBulkRows({}); }}
                  disabled={!bulkExamId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('adminResults.bulkClassSelect')} />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(new Set(students.map((s) => s.class).filter(Boolean))).sort().map((cls) => (
                      <SelectItem key={cls} value={cls}>
                        {cls}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Student rows */}
            {bulkExamId && bulkClass && (
              bulkStudents.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-islamic-dark inline-flex items-center gap-1.5">
                      <TableProperties className="size-4 text-islamic" />
                      {t('adminResults.bulkStudents')}
                      <span className="text-muted-foreground font-normal">
                        ({t('adminResults.showing', { count: bulkStudents.length })})
                      </span>
                    </h3>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground whitespace-nowrap">
                        {t('adminResults.bulkApplyTotalToAll')}:
                      </Label>
                      <Input
                        type="number"
                        defaultValue={100}
                        id="bulk-apply-total"
                        className="h-8 w-20 text-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs cursor-pointer"
                        onClick={() => {
                          const el = document.getElementById('bulk-apply-total') as HTMLInputElement | null;
                          applyTotalToAll(el?.value || '100');
                        }}
                      >
                        {t('common.save')}
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('adminResults.bulkHint')}</p>

                  <div className="rounded-xl border border-border/60 overflow-hidden">
                    <div className="divide-y divide-border/40 max-h-80 overflow-y-auto">
                      {bulkStudents.map((s) => {
                        const row = getBulkRow(s);
                        return (
                          <div key={s.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 px-3 py-2.5 bg-surface hover:bg-surface-tertiary/30 transition-colors">
                            <div className="flex-1 min-w-0 sm:min-w-48">
                              <p className="text-sm font-medium text-islamic-dark truncate flex items-center gap-1.5">
                                {s.name}
                                {row.exists && (
                                  <span className="inline-flex items-center rounded-full bg-islamic-lighter/60 text-islamic-dark px-1.5 py-0.5 text-[9px] font-semibold shrink-0">
                                    {t('adminResults.bulkExistsBadge')}
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-muted-foreground">{t('adminResults.rollColon')} {s.roll}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <div>
                                <Label className="text-[10px] text-muted-foreground block text-center">
                                  {t('adminResults.bulkObtained')}
                                </Label>
                                <Input
                                  type="number"
                                  inputMode="numeric"
                                  value={row.obtained}
                                  onChange={(e) => setBulkField(s, 'obtained', e.target.value)}
                                  className="h-9 w-24 sm:w-28 text-center text-sm"
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <Label className="text-[10px] text-muted-foreground block text-center">
                                  {t('adminResults.totalMarks')}
                                </Label>
                                <Input
                                  type="number"
                                  inputMode="numeric"
                                  value={row.total}
                                  onChange={(e) => setBulkField(s, 'total', e.target.value)}
                                  className="h-9 w-20 sm:w-24 text-center text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Award className="size-10 opacity-20 mb-2" />
                  <p className="text-sm">{t('adminResults.bulkNoStudents')}</p>
                </div>
              )
            )}

            {/* Progress */}
            {bulkSaving && bulkProgress.total > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{bulkProgress.done}/{bulkProgress.total}</span>
                  <span>{Math.round((bulkProgress.done / bulkProgress.total) * 100)}%</span>
                </div>
                <div className="h-2 rounded-full bg-surface-tertiary overflow-hidden">
                  <div
                    className="h-full bg-islamic transition-all duration-200"
                    style={{ width: `${(bulkProgress.done / bulkProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setBulkOpen(false); setBulkExamId(''); setBulkClass(''); setBulkRows({}); }}
              disabled={bulkSaving}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleBulkSave}
              disabled={bulkSaving || bulkReadyCount === 0}
              className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
            >
              {bulkSaving ? <Loader2 className="size-4 animate-spin" /> : <Layers className="size-4" />}
              {t('adminResults.bulkSaveAll')}
              {bulkReadyCount > 0 && <span className="opacity-70">({bulkReadyCount})</span>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ Delete whole exam results ============ */}
      <Dialog open={deleteExamOpen} onOpenChange={(open) => {
        setDeleteExamOpen(open);
        if (!open) setDeleteExamId('');
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-islamic-dark flex items-center gap-2">
              <Trash className="size-5 text-danger" />
              {t('adminResults.deleteExamResults')}
            </DialogTitle>
            <DialogDescription>{t('common.permanentDeleteWarning')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t('adminResults.deleteExamSelect')} *</Label>
              <Select value={deleteExamId} onValueChange={setDeleteExamId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('adminResults.deleteExamSelect')} />
                </SelectTrigger>
                <SelectContent>
                  {sortedExams.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} ({e.year || t('adminResults.noYear')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {deleteExamTarget && deleteExamCount > 0 && (
              <div className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
                {t('adminResults.deleteExamConfirm', { name: deleteExamTarget.name, count: deleteExamCount })}
              </div>
            )}
            {deleteExamTarget && deleteExamCount === 0 && (
              <div className="rounded-lg border border-border bg-surface-tertiary/40 p-3 text-sm text-muted-foreground">
                {t('adminResults.noMatch')}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteExamOpen(false); setDeleteExamId(''); }} disabled={deleteExamBusy}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleDeleteExamResults}
              disabled={deleteExamBusy || deleteExamCount === 0}
              className="bg-danger hover:bg-danger/90 text-danger-foreground gap-2 cursor-pointer"
            >
              {deleteExamBusy ? <Loader2 className="size-4 animate-spin" /> : <Trash className="size-4" />}
              {t('common.confirmDelete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation (single) */}
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
              className="bg-danger hover:bg-danger/90 text-danger-foreground gap-2 cursor-pointer"
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
