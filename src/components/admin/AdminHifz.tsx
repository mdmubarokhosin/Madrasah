'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, BookOpen, Loader2 } from 'lucide-react';
import { dbPush, dbUpdate, dbRemove, dbGet, dbSubscribe } from '@/lib/db-service';
import { useTranslation } from '@/lib/i18n-context';
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
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface HifzRecord {
  id: string;
  studentName: string;
  studentRoll: string;
  department: string;
  surahName: string;
  surahNumber: string;
  fromAyah: string;
  toAyah: string;
  status: 'memorizing' | 'reviewed' | 'tested' | 'completed';
  testedBy: string;
  testDate: string;
  grade: string;
  notes: string;
  createdAt: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const EMPTY_FORM = {
  studentName: '',
  studentRoll: '',
  department: '',
  surahName: '',
  surahNumber: '',
  fromAyah: '',
  toAyah: '',
  status: 'memorizing' as HifzRecord['status'],
  testedBy: '',
  testDate: '',
  grade: '',
  notes: '',
};

const STATUS_COLORS: Record<string, string> = {
  memorizing: 'bg-blue-100 text-blue-700 border-blue-200',
  reviewed: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  tested: 'bg-purple-100 text-purple-700 border-purple-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminHifz() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const statusLabel = (status: string) => {
    switch (status) {
      case 'memorizing': return t('adminHifz.stMemorizing');
      case 'reviewed': return t('adminHifz.stReviewed');
      case 'tested': return t('adminHifz.stTested');
      case 'completed': return t('adminHifz.stCompleted');
      default: return status;
    }
  };

  const [records, setRecords] = useState<HifzRecord[]>([]);
  const [loading, setLoading] = useState(true);

  /* Dialog state */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HifzRecord | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  /* Delete confirmation */
  const [deleteTarget, setDeleteTarget] = useState<HifzRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* Subscribe to data */
  useEffect(() => {
    const unsub = dbSubscribe('/hifz', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list: HifzRecord[] = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        }));
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setRecords(list);
      } else {
        setRecords([]);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  /* Reset form when dialog opens/closes */
  const resetAndOpen = useCallback(() => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((item: HifzRecord) => {
    setEditingItem(item);
    setForm({
      studentName: item.studentName,
      studentRoll: item.studentRoll,
      department: item.department,
      surahName: item.surahName,
      surahNumber: item.surahNumber,
      fromAyah: item.fromAyah,
      toAyah: item.toAyah,
      status: item.status,
      testedBy: item.testedBy,
      testDate: item.testDate,
      grade: item.grade,
      notes: item.notes,
    });
    setDialogOpen(true);
  }, []);

  /* Submit handler */
  const handleSubmit = async () => {
    if (!form.studentName.trim() || !form.surahName.trim()) {
      toast({ title: t('common.error'), description: t('adminHifz.requiredMsg'), variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      if (editingItem) {
        await dbUpdate('/hifz/' + editingItem.id, {
          studentName: form.studentName.trim(),
          studentRoll: form.studentRoll.trim(),
          department: form.department,
          surahName: form.surahName.trim(),
          surahNumber: form.surahNumber.trim(),
          fromAyah: form.fromAyah.trim(),
          toAyah: form.toAyah.trim(),
          status: form.status,
          testedBy: form.testedBy.trim(),
          testDate: form.testDate.trim(),
          grade: form.grade.trim(),
          notes: form.notes.trim(),
        });
        toast({ title: t('common.success'), description: t('adminHifz.recordUpdated') });
      } else {
        await dbPush('/hifz', {
          studentName: form.studentName.trim(),
          studentRoll: form.studentRoll.trim(),
          department: form.department,
          surahName: form.surahName.trim(),
          surahNumber: form.surahNumber.trim(),
          fromAyah: form.fromAyah.trim(),
          toAyah: form.toAyah.trim(),
          status: form.status,
          testedBy: form.testedBy.trim(),
          testDate: form.testDate.trim(),
          grade: form.grade.trim(),
          notes: form.notes.trim(),
          createdAt: Date.now(),
        });
        toast({ title: t('common.success'), description: t('adminHifz.recordCreated') });
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
      await dbRemove('/hifz/' + deleteTarget.id);
      toast({ title: t('common.success'), description: t('adminHifz.recordDeleted') });
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
          <h2 className="text-2xl font-bold text-islamic-dark">{t('adminHifz.title')}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t('adminHifz.count', { count: records.length })}
          </p>
        </div>
        <Button
          onClick={resetAndOpen}
          className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
        >
          <Plus className="size-4" />
          {t('adminHifz.addNew')}
        </Button>
      </div>

      {/* Desktop Table + Mobile Cards */}
      {records.length > 0 ? (
        <>
          {/* Desktop Table - hidden on mobile */}
          <Card className="shadow-sm hidden md:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-semibold text-muted-foreground">
                        {t('adminHifz.student')}
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">
                        {t('adminHifz.surah')}
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">
                        {t('adminHifz.ayah')}
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground w-28 text-center">
                        {t('common.status')}
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground w-28 text-right">
                        {t('common.actions')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="py-3">
                          <p className="font-medium text-sm text-islamic-dark">{item.studentName}</p>
                          <p className="text-xs text-muted-foreground">{t('adminHifz.roll')} {item.studentRoll || '—'} | {item.department || '—'}</p>
                        </TableCell>
                        <TableCell className="text-sm py-3">
                          <p className="font-medium">{item.surahName}</p>
                          <p className="text-xs text-muted-foreground">{t('adminHifz.no')} {item.surahNumber || '—'}</p>
                        </TableCell>
                        <TableCell className="text-sm py-3 whitespace-nowrap">
                          {item.fromAyah || '—'} - {item.toAyah || '—'}
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          <Badge className={`${STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-700'} text-xs hover:opacity-90`}>
                            {statusLabel(item.status)}
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
            </CardContent>
          </Card>

          {/* Mobile Cards - hidden on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
            {records.map((item) => (
              <Card key={item.id} className="shadow-sm border-gray-100">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-islamic-dark truncate">{item.studentName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t('adminHifz.roll')} {item.studentRoll || '—'}</p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-islamic cursor-pointer" onClick={() => openEdit(item)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-red-600 cursor-pointer" onClick={() => setDeleteTarget(item)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-islamic-dark">{item.surahName}</span>
                      {item.surahNumber && <span> ({t('adminHifz.no')} {item.surahNumber})</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('adminHifz.ayah')}: {item.fromAyah || '—'} - {item.toAyah || '—'}
                    </p>
                    {item.testedBy && (
                      <p className="text-[10px] text-muted-foreground">{t('adminHifz.examiner')}: {item.testedBy}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {item.department && (
                      <span className="inline-flex items-center rounded-full bg-islamic-lighter px-2 py-0.5 text-[10px] font-medium text-islamic-dark">
                        {item.department}
                      </span>
                    )}
                    <Badge className={`${STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-700'} text-[10px] hover:opacity-90`}>
                      {statusLabel(item.status)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <BookOpen className="size-12 opacity-20 mb-3" />
              <p className="text-sm">{t('adminHifz.noData')}</p>
              <p className="text-xs mt-1">{t('adminHifz.emptyHint')}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) { setEditingItem(null); setForm(EMPTY_FORM); }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-islamic-dark">
              {editingItem ? t('adminHifz.editTitle') : t('adminHifz.addNew')}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? t('adminHifz.editDesc') : t('adminHifz.createDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hifz-studentName">{t('adminHifz.studentName')}</Label>
                <Input
                  id="hifz-studentName"
                  placeholder={t('adminHifz.studentNamePh')}
                  value={form.studentName}
                  onChange={(e) => setForm((f) => ({ ...f, studentName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hifz-studentRoll">{t('adminHifz.rollNo')}</Label>
                <Input
                  id="hifz-studentRoll"
                  placeholder={t('adminHifz.rollNo')}
                  value={form.studentRoll}
                  onChange={(e) => setForm((f) => ({ ...f, studentRoll: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hifz-department">{t('adminHifz.department')}</Label>
              <Input
                id="hifz-department"
                placeholder={t('adminHifz.departmentPh')}
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hifz-surahName">{t('adminHifz.surahName')}</Label>
                <Input
                  id="hifz-surahName"
                  placeholder={t('adminHifz.surahNamePh')}
                  value={form.surahName}
                  onChange={(e) => setForm((f) => ({ ...f, surahName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hifz-surahNumber">{t('adminHifz.surahNo')}</Label>
                <Input
                  id="hifz-surahNumber"
                  placeholder={t('adminHifz.surahNoPh')}
                  value={form.surahNumber}
                  onChange={(e) => setForm((f) => ({ ...f, surahNumber: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hifz-fromAyah">{t('adminHifz.fromAyah')}</Label>
                <Input
                  id="hifz-fromAyah"
                  placeholder={t('adminHifz.fromAyahPh')}
                  value={form.fromAyah}
                  onChange={(e) => setForm((f) => ({ ...f, fromAyah: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hifz-toAyah">{t('adminHifz.toAyah')}</Label>
                <Input
                  id="hifz-toAyah"
                  placeholder={t('adminHifz.toAyahPh')}
                  value={form.toAyah}
                  onChange={(e) => setForm((f) => ({ ...f, toAyah: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('common.status')}</Label>
              <Select value={form.status} onValueChange={(val) => setForm((f) => ({ ...f, status: val as HifzRecord['status'] }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('adminHifz.statusPh')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="memorizing">{t('adminHifz.stMemorizing')}</SelectItem>
                  <SelectItem value="reviewed">{t('adminHifz.stReviewed')}</SelectItem>
                  <SelectItem value="tested">{t('adminHifz.stTested')}</SelectItem>
                  <SelectItem value="completed">{t('adminHifz.stCompleted')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hifz-testedBy">{t('adminHifz.examiner')}</Label>
                <Input
                  id="hifz-testedBy"
                  placeholder={t('adminHifz.examinerPh')}
                  value={form.testedBy}
                  onChange={(e) => setForm((f) => ({ ...f, testedBy: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hifz-testDate">{t('adminHifz.testDate')}</Label>
                <Input
                  id="hifz-testDate"
                  type="date"
                  value={form.testDate}
                  onChange={(e) => setForm((f) => ({ ...f, testDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hifz-grade">{t('adminHifz.grade')}</Label>
              <Input
                id="hifz-grade"
                placeholder={t('adminHifz.gradePh')}
                value={form.grade}
                onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hifz-notes">{t('common.notes')}</Label>
              <Textarea
                id="hifz-notes"
                placeholder={t('adminHifz.notesPh')}
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
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
              {t('adminHifz.deleteDesc', { name: deleteTarget?.studentName || '' })}
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
