'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, ClipboardList, Loader2, Eye } from 'lucide-react';
import { dbPush, dbUpdate, dbRemove, dbSubscribe } from '@/lib/db-service';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface MCQQuestion {
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correctAnswer: string;
  marks?: number;
}

interface MCQExam {
  id: string;
  title: string;
  subject: string;
  department: string;
  class: string;
  duration: number;
  passMarks: number;
  totalMarks: number;
  questions: MCQQuestion[];
  status: 'draft' | 'published' | 'active' | 'inactive';
  createdAt: number;
}

interface MCQSubmission {
  id: string;
  examId: string;
  examTitle: string;
  studentName: string;
  studentRoll: string;
  totalQuestions: number;
  correctAnswers: number;
  obtainedMarks: number;
  status: 'passed' | 'failed' | 'pending';
  submittedAt: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const EMPTY_EXAM_FORM = {
  title: '',
  subject: '',
  department: '',
  class: '',
  duration: '30',
  passMarks: '40',
  totalMarks: '100',
  status: 'draft' as MCQExam['status'],
};

const EMPTY_QUESTION: MCQQuestion = {
  question: '',
  option1: '',
  option2: '',
  option3: '',
  option4: '',
  correctAnswer: '1',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminMCQExams() {
  const { departments } = useAppStore();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [exams, setExams] = useState<MCQExam[]>([]);
  const [submissions, setSubmissions] = useState<MCQSubmission[]>([]);

  /* Exam Dialog state */
  const [examDialogOpen, setExamDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<MCQExam | null>(null);
  const [examForm, setExamForm] = useState(EMPTY_EXAM_FORM);
  const [examSubmitting, setExamSubmitting] = useState(false);

  /* Question Dialog state */
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [currentExamId, setCurrentExamId] = useState<string>('');
  const [currentExamTitle, setCurrentExamTitle] = useState('');
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [questionForm, setQuestionForm] = useState<MCQQuestion>({ ...EMPTY_QUESTION });
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);

  /* Delete confirmation */
  const [deleteTarget, setDeleteTarget] = useState<MCQExam | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* Submissions Dialog */
  const [submissionsDialogOpen, setSubmissionsDialogOpen] = useState(false);
  const [viewingExamSubmissions, setViewingExamSubmissions] = useState<MCQSubmission[]>([]);

  /* Subscribe to data */
  useEffect(() => {
    const unsubExams = dbSubscribe('/onlineExams', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list: MCQExam[] = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        }));
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setExams(list);
      } else {
        setExams([]);
      }
    });

    const unsubSubs = dbSubscribe('/examSubmissions', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list: MCQSubmission[] = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        }));
        list.sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));
        setSubmissions(list);
      } else {
        setSubmissions([]);
      }
    });

    return () => { unsubExams(); unsubSubs(); };
  }, []);

  /* Reset and open exam dialog */
  const resetAndOpenExam = useCallback(() => {
    setEditingExam(null);
    setExamForm(EMPTY_EXAM_FORM);
    setExamDialogOpen(true);
  }, []);

  const openEditExam = useCallback((exam: MCQExam) => {
    setEditingExam(exam);
    setExamForm({
      title: exam.title,
      subject: exam.subject,
      department: exam.department,
      class: exam.class || '',
      duration: String(exam.duration),
      passMarks: String(exam.passMarks),
      totalMarks: String(exam.totalMarks),
      status: exam.status as 'draft' | 'published',
    });
    setExamDialogOpen(true);
  }, []);

  /* Open questions dialog for an exam */
  const openQuestions = useCallback((exam: MCQExam) => {
    setCurrentExamId(exam.id);
    setCurrentExamTitle(exam.title);
    // Convert OnlineExam format back to MCQQuestion format for editing
    const rawQuestions = exam.questions || [];
    const converted = rawQuestions.map((q: any) => ({
      question: q.question || '',
      option1: Array.isArray(q.options) ? q.options[0] || '' : q.option1 || '',
      option2: Array.isArray(q.options) ? q.options[1] || '' : q.option2 || '',
      option3: Array.isArray(q.options) ? q.options[2] || '' : q.option3 || '',
      option4: Array.isArray(q.options) ? q.options[3] || '' : q.option4 || '',
      correctAnswer: String((typeof q.correctAnswer === 'number' ? q.correctAnswer + 1 : q.correctAnswer) || '1'),
      marks: q.marks || 1,
    }));
    setQuestions(converted);
    setQuestionForm({ ...EMPTY_QUESTION });
    setEditingQuestionIndex(null);
    setQuestionDialogOpen(true);
  }, []);

  /* Add/Update question */
  const handleSaveQuestion = () => {
    if (!questionForm.question.trim() || !questionForm.option1.trim() || !questionForm.option2.trim() ||
        !questionForm.option3.trim() || !questionForm.option4.trim()) {
      toast({ title: t('common.error'), description: t('adminMcqExams.questionRequired'), variant: 'destructive' });
      return;
    }

    if (editingQuestionIndex !== null) {
      const updated = [...questions];
      updated[editingQuestionIndex] = { ...questionForm };
      setQuestions(updated);
      setEditingQuestionIndex(null);
    } else {
      setQuestions([...questions, { ...questionForm }]);
    }
    setQuestionForm({ ...EMPTY_QUESTION });
  };

  /* Remove question */
  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  /* Save questions to exam */
  const handleSaveQuestionsToExam = async () => {
    try {
      // Convert MCQQuestion[] to OnlineExam compatible format
      const convertedQuestions = questions.map((q) => ({
        question: q.question,
        options: [q.option1, q.option2, q.option3, q.option4],
        correctAnswer: parseInt(q.correctAnswer, 10) - 1, // convert 1-based to 0-based
        marks: q.marks || 1,
      }));
      await dbUpdate('/onlineExams/' + currentExamId, { questions: convertedQuestions });
      toast({ title: t('common.success'), description: t('adminMcqExams.questionsSaved', { count: questions.length }) });
      setQuestionDialogOpen(false);
    } catch {
      toast({ title: t('common.error'), description: t('adminMcqExams.questionsSaveFailed'), variant: 'destructive' });
    }
  };

  /* Submit exam handler */
  const handleSubmitExam = async () => {
    if (!examForm.title.trim()) {
      toast({ title: t('common.error'), description: t('adminMcqExams.titleRequired'), variant: 'destructive' });
      return;
    }

    setExamSubmitting(true);
    try {
      if (editingExam) {
        // Preserve existing questions in OnlineExam format when editing exam info
        const existingQuestions = editingExam.questions || [];
        await dbUpdate('/onlineExams/' + editingExam.id, {
          title: examForm.title.trim(),
          subject: examForm.subject.trim(),
          department: examForm.department,
          class: examForm.class,
          duration: parseInt(examForm.duration, 10) || 30,
          passMarks: parseInt(examForm.passMarks, 10) || 40,
          totalMarks: parseInt(examForm.totalMarks, 10) || 100,
          status: examForm.status,
          questions: existingQuestions,
        });
        toast({ title: t('common.success'), description: t('adminMcqExams.examUpdated') });
      } else {
        await dbPush('/onlineExams', {
          title: examForm.title.trim(),
          subject: examForm.subject.trim(),
          department: examForm.department,
          class: examForm.class,
          duration: parseInt(examForm.duration, 10) || 30,
          passMarks: parseInt(examForm.passMarks, 10) || 40,
          totalMarks: parseInt(examForm.totalMarks, 10) || 100,
          status: examForm.status,
          questions: [],
          createdAt: Date.now(),
        });
        toast({ title: t('common.success'), description: t('adminMcqExams.examCreated') });
      }
      setExamDialogOpen(false);
      setExamForm(EMPTY_EXAM_FORM);
      setEditingExam(null);
    } catch {
      toast({ title: t('common.error'), description: t('common.operationFailed'), variant: 'destructive' });
    } finally {
      setExamSubmitting(false);
    }
  };

  /* Delete handler */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await dbRemove('/onlineExams/' + deleteTarget.id);
      toast({ title: t('common.success'), description: t('adminMcqExams.examDeleted') });
      setDeleteTarget(null);
    } catch {
      toast({ title: t('common.error'), description: t('common.deleteFailed'), variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  /* View submissions */
  const viewSubmissions = (examId: string) => {
    const subs = submissions.filter((s) => s.examId === examId);
    setViewingExamSubmissions(subs);
    setSubmissionsDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-islamic-dark">{t('adminMcqExams.title')}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t('adminMcqExams.stats', { exams: exams.length, submissions: submissions.length })}
          </p>
        </div>
        <Button
          onClick={resetAndOpenExam}
          className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
        >
          <Plus className="size-4" />
          {t('adminMcqExams.createBtn')}
        </Button>
      </div>

      {/* Exams Table - Desktop */}
      <Card className="shadow-sm hidden md:block">
        <CardContent className="p-0">
          {exams.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold text-muted-foreground">
                      {t('common.title')}
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">
                      {t('adminMcqExams.subject')}
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">
                      {t('common.time')}
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-center">
                      {t('adminMcqExams.questions')}
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-center">
                      {t('common.status')}
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-right">
                      {t('common.actions')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium text-sm text-islamic-dark py-3">
                        {exam.title}
                      </TableCell>
                      <TableCell className="text-sm py-3 text-muted-foreground">
                        {exam.subject || '—'}
                      </TableCell>
                      <TableCell className="text-sm py-3 text-muted-foreground">
                        {t('adminMcqExams.minutes', { count: exam.duration })}
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        <Badge variant="secondary" className="text-xs">
                          {t('adminMcqExams.countShort', { count: (exam.questions || []).length })}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        <Badge className={`text-xs ${exam.status === 'published' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                          {exam.status === 'published' ? t('adminMcqExams.statusPublished') : t('adminMcqExams.statusDraft')}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-islamic cursor-pointer"
                            onClick={() => openQuestions(exam)}
                            title={t('adminMcqExams.addQuestions')}
                          >
                            <Plus className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-blue-600 cursor-pointer"
                            onClick={() => viewSubmissions(exam.id)}
                            title={t('adminMcqExams.viewSubmissions')}
                          >
                            <Eye className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-islamic cursor-pointer"
                            onClick={() => openEditExam(exam)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-red-600 cursor-pointer"
                            onClick={() => setDeleteTarget(exam)}
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
              <ClipboardList className="size-12 opacity-20 mb-3" />
              <p className="text-sm">{t('adminMcqExams.noData')}</p>
              <p className="text-xs mt-1">{t('adminMcqExams.emptyHint')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden">
        {exams.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {exams.map((exam) => (
              <Card key={exam.id} className="shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm truncate">{exam.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{exam.subject || '—'} · {t('adminMcqExams.minutes', { count: exam.duration })}</p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => viewSubmissions(exam.id)}><Eye className="size-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => openEditExam(exam)}><Pencil className="size-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => setDeleteTarget(exam)}><Trash2 className="size-3.5" /></Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium">{t('adminMcqExams.questionCount', { count: (exam.questions || []).length })}</span>
                    {exam.department && (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium">{exam.department}</span>
                    )}
                    {exam.class && (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium">{exam.class}</span>
                    )}
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      exam.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {exam.status === 'published' ? t('adminMcqExams.statusPublished') : t('adminMcqExams.statusDraft')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ClipboardList className="size-12 opacity-20 mb-3" />
            <p className="text-sm">{t('adminMcqExams.noData')}</p>
            <p className="text-xs mt-1">{t('adminMcqExams.emptyHint')}</p>
          </div>
        )}
      </div>

      {/* Create/Edit Exam Dialog */}
      <Dialog open={examDialogOpen} onOpenChange={(open) => {
        setExamDialogOpen(open);
        if (!open) { setEditingExam(null); setExamForm(EMPTY_EXAM_FORM); }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-islamic-dark">
              {editingExam ? t('adminMcqExams.editTitle') : t('adminMcqExams.createBtn')}
            </DialogTitle>
            <DialogDescription>
              {editingExam ? t('adminMcqExams.editDesc') : t('adminMcqExams.createDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="mcq-title">{t('adminMcqExams.examTitleLabel')}</Label>
              <Input
                id="mcq-title"
                placeholder={t('adminMcqExams.examTitlePh')}
                value={examForm.title}
                onChange={(e) => setExamForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mcq-subject">{t('adminMcqExams.subject')}</Label>
                <Input
                  id="mcq-subject"
                  placeholder={t('adminMcqExams.subjectPh')}
                  value={examForm.subject}
                  onChange={(e) => setExamForm((f) => ({ ...f, subject: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mcq-department">{t('adminMcqExams.department')}</Label>
                <Select
                  value={examForm.department}
                  onValueChange={(value) => {
                    setExamForm((f) => ({ ...f, department: value, class: '' }));
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('adminMcqExams.departmentPh')} />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mcq-class">{t('adminMcqExams.class')}</Label>
                {examForm.department ? (() => {
                  const selectedDept = departments.find(d => d.name === examForm.department);
                  const deptClasses = selectedDept?.classes || [];
                  if (deptClasses.length > 0) {
                    return (
                      <Select
                        value={examForm.class}
                        onValueChange={(value) => setExamForm((f) => ({ ...f, class: value }))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t('adminMcqExams.classPh')} />
                        </SelectTrigger>
                        <SelectContent>
                          {deptClasses.map((cls, idx) => (
                            <SelectItem key={idx} value={cls}>
                              {cls}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  }
                  return (
                    <Input
                      placeholder={t('adminMcqExams.noClasses')}
                      value={examForm.class}
                      onChange={(e) => setExamForm((f) => ({ ...f, class: e.target.value }))}
                      disabled={!examForm.department}
                    />
                  );
                })() : (
                  <Input
                    placeholder={t('adminMcqExams.selectDeptFirst')}
                    value={examForm.class}
                    onChange={(e) => setExamForm((f) => ({ ...f, class: e.target.value }))}
                    disabled
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="mcq-duration">{t('adminMcqExams.durationLabel')}</Label>
                <Input
                  id="mcq-duration"
                  type="number"
                  placeholder="30"
                  value={examForm.duration}
                  onChange={(e) => setExamForm((f) => ({ ...f, duration: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mcq-passMarks">{t('adminMcqExams.passMarks')}</Label>
                <Input
                  id="mcq-passMarks"
                  type="number"
                  placeholder="50"
                  value={examForm.passMarks}
                  onChange={(e) => setExamForm((f) => ({ ...f, passMarks: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('common.status')}</Label>
              <Select value={examForm.status} onValueChange={(val) => setExamForm((f) => ({ ...f, status: val as 'draft' | 'published' }))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">{t('adminMcqExams.statusDraft')}</SelectItem>
                  <SelectItem value="published">{t('adminMcqExams.statusPublished')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setExamDialogOpen(false); setEditingExam(null); setExamForm(EMPTY_EXAM_FORM); }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSubmitExam}
              disabled={examSubmitting}
              className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
            >
              {examSubmitting && <Loader2 className="size-4 animate-spin" />}
              {editingExam ? t('common.update') : t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Questions Dialog */}
      <Dialog open={questionDialogOpen} onOpenChange={(open) => {
        setQuestionDialogOpen(open);
        if (!open) { setQuestions([]); setQuestionForm({ ...EMPTY_QUESTION }); setEditingQuestionIndex(null); }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-islamic-dark">
              {t('adminMcqExams.manageQuestions', { title: currentExamTitle })}
            </DialogTitle>
            <DialogDescription>
              {t('adminMcqExams.questionsCount', { count: questions.length })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Add question form */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  {editingQuestionIndex !== null ? t('adminMcqExams.questionEditTitle') : t('adminMcqExams.questionAddTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="mcq-question">{t('adminMcqExams.questionLabel')}</Label>
                  <Textarea
                    id="mcq-question"
                    placeholder={t('adminMcqExams.questionPh')}
                    rows={2}
                    value={questionForm.question}
                    onChange={(e) => setQuestionForm((f) => ({ ...f, question: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">{t('adminMcqExams.option1')} *</Label>
                    <Input
                      placeholder={t('adminMcqExams.option1')}
                      value={questionForm.option1}
                      onChange={(e) => setQuestionForm((f) => ({ ...f, option1: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('adminMcqExams.option2')} *</Label>
                    <Input
                      placeholder={t('adminMcqExams.option2')}
                      value={questionForm.option2}
                      onChange={(e) => setQuestionForm((f) => ({ ...f, option2: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('adminMcqExams.option3')} *</Label>
                    <Input
                      placeholder={t('adminMcqExams.option3')}
                      value={questionForm.option3}
                      onChange={(e) => setQuestionForm((f) => ({ ...f, option3: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('adminMcqExams.option4')} *</Label>
                    <Input
                      placeholder={t('adminMcqExams.option4')}
                      value={questionForm.option4}
                      onChange={(e) => setQuestionForm((f) => ({ ...f, option4: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t('adminMcqExams.correctAnswer')}</Label>
                  <Select value={questionForm.correctAnswer} onValueChange={(val) => setQuestionForm((f) => ({ ...f, correctAnswer: val }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">{t('adminMcqExams.option1')}</SelectItem>
                      <SelectItem value="2">{t('adminMcqExams.option2')}</SelectItem>
                      <SelectItem value="3">{t('adminMcqExams.option3')}</SelectItem>
                      <SelectItem value="4">{t('adminMcqExams.option4')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveQuestion}
                    className="bg-islamic hover:bg-islamic-light text-white gap-1 cursor-pointer"
                  >
                    <Plus className="size-3" />
                    {editingQuestionIndex !== null ? t('adminMcqExams.updateQuestion') : t('common.add')}
                  </Button>
                  {editingQuestionIndex !== null && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingQuestionIndex(null);
                        setQuestionForm({ ...EMPTY_QUESTION });
                      }}
                    >
                      {t('common.cancel')}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Question list */}
            {questions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">{t('adminMcqExams.questionList')}</h4>
                {questions.map((q, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg border p-3 text-sm">
                    <span className="font-bold text-islamic-dark min-w-[24px]">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{q.question}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1 text-xs text-muted-foreground">
                        <span>{t('adminMcqExams.n1')}. {q.option1}</span>
                        <span>{t('adminMcqExams.n2')}. {q.option2}</span>
                        <span>{t('adminMcqExams.n3')}. {q.option3}</span>
                        <span>{t('adminMcqExams.n4')}. {q.option4}</span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">{t('adminMcqExams.correctOption', { answer: q.correctAnswer })} {q.marks ? t('adminMcqExams.marksInfo', { marks: q.marks }) : ''}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => {
                          setEditingQuestionIndex(i);
                          setQuestionForm({ ...q });
                        }}
                      >
                        <Pencil className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-red-500"
                        onClick={() => handleRemoveQuestion(i)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setQuestionDialogOpen(false); }}
            >
              {t('common.close')}
            </Button>
            <Button
              onClick={handleSaveQuestionsToExam}
              className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
            >
              {t('adminMcqExams.saveQuestions')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submissions Dialog */}
      <Dialog open={submissionsDialogOpen} onOpenChange={(open) => setSubmissionsDialogOpen(open)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-islamic-dark">{t('adminMcqExams.submissionsTitle')}</DialogTitle>
            <DialogDescription>{t('adminMcqExams.submissionsCount', { count: viewingExamSubmissions.length })}</DialogDescription>
          </DialogHeader>
          {viewingExamSubmissions.length > 0 ? (
            <div className="space-y-2 py-2">
              {viewingExamSubmissions.map((sub) => (
                <div key={sub.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-islamic-dark">{sub.studentName}</p>
                      <p className="text-xs text-muted-foreground">{t('adminMcqExams.roll')} {sub.studentRoll}</p>
                    </div>
                    <Badge className={`text-xs ${sub.status === 'passed' ? 'bg-green-100 text-green-700' : sub.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {sub.status === 'passed' ? t('adminMcqExams.stPassed') : sub.status === 'failed' ? t('adminMcqExams.stFailed') : t('adminMcqExams.stPending')}
                    </Badge>
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{t('adminMcqExams.correctCount', { correct: sub.correctAnswers, total: sub.totalQuestions })}</span>
                    <span>{t('adminMcqExams.marksValue', { marks: sub.obtainedMarks })}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground text-sm">
              {t('adminMcqExams.noSubmissions')}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('adminMcqExams.deleteDesc', { title: deleteTarget?.title || '' })}
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
