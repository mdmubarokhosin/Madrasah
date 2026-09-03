'use client';

import { useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, ClipboardList, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { dbPush, dbUpdate, dbRemove } from '@/lib/db-service';
import { toML, loc, type MLValue } from '@/lib/multilingual';
import { MLInput } from '@/components/admin/MLFields';
import type { Exam } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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



const EMPTY_FORM = {
  name: { bn: '', en: '', ar: '' } as MLValue,
  year: '',
  department: '',
  class: '',
  date: '',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminExams() {
  const { exams, departments } = useAppStore();
  const { toast } = useToast();
  const { t, language } = useTranslation();

  /* Dialog state */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Exam | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  /* Delete confirmation */
  const [deleteTarget, setDeleteTarget] = useState<Exam | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* Helpers */
  const resetAndOpen = useCallback(() => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((item: Exam) => {
    setEditingItem(item);
    setForm({
      name: toML(item, 'name'),
      year: item.year,
      department: item.department,
      class: item.class,
      date: item.date,
    });
    setDialogOpen(true);
  }, []);

  /* Submit handler */
  const handleSubmit = async () => {
    if (!form.name.bn.trim()) {
      toast({ title: t('common.error'), description: t('adminExams.nameRequired'), variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.bn.trim(),
        nameEn: form.name.en.trim(),
        nameAr: form.name.ar.trim(),
        year: form.year.trim(),
        department: form.department,
        class: form.class.trim(),
        date: form.date.trim(),
      };

      if (editingItem) {
        await dbUpdate('/exams/' + editingItem.id, payload);
        toast({ title: t('common.success'), description: t('adminExams.updated') });
      } else {
        await dbPush('/exams', {
          ...payload,
          createdAt: Date.now(),
        });
        toast({ title: t('common.success'), description: t('adminExams.created') });
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
      await dbRemove('/exams/' + deleteTarget.id);
      toast({ title: t('common.success'), description: t('adminExams.deleted') });
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
          <h2 className="text-2xl font-bold text-islamic-dark">{t('admin.exams')}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t('adminExams.count', { count: exams.length })}
          </p>
        </div>
        <Button
          onClick={resetAndOpen}
          className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
        >
          <Plus className="size-4" />
          {t('adminExams.addNew')}
        </Button>
      </div>

      {/* Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          {exams.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold text-muted-foreground">
                      {t('adminExams.name')}
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground w-20">
                      {t('common.year')}
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground w-24">
                      {t('adminExams.department')}
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground w-24 hidden sm:table-cell">
                      {t('adminExams.class')}
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground w-28 hidden md:table-cell">
                      {t('common.date')}
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground w-28 text-right">
                      {t('common.actions')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-sm text-islamic-dark py-3">
                        {loc(language, item, 'name')}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground py-3 whitespace-nowrap">
                        {item.year || '—'}
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="inline-flex items-center rounded-full bg-islamic-lighter px-2.5 py-0.5 text-xs font-medium text-islamic-dark">
                          {item.department || '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground py-3 whitespace-nowrap hidden sm:table-cell">
                        {item.class || '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground py-3 whitespace-nowrap hidden md:table-cell">
                        {item.date || '—'}
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
              <ClipboardList className="size-12 opacity-20 mb-3" />
              <p className="text-sm">{t('adminExams.noData')}</p>
              <p className="text-xs mt-1">{t('adminExams.addHint')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) { setEditingItem(null); setForm(EMPTY_FORM); }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-islamic-dark">
              {editingItem ? t('adminExams.editTitle') : t('adminExams.addNew')}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? t('adminExams.editDesc') : t('adminExams.createDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <MLInput
              label={t('adminExams.name')}
              required
              placeholder={t('adminExams.namePlaceholder')}
              value={form.name}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exam-year">{t('common.year')}</Label>
                <Input
                  id="exam-year"
                  placeholder={t('adminExams.yearPlaceholder')}
                  value={form.year}
                  onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exam-date">{t('common.date')}</Label>
                <Input
                  id="exam-date"
                  placeholder={t('adminExams.datePlaceholder')}
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('adminExams.department')}</Label>
                <Select
                  value={form.department}
                  onValueChange={(value) => setForm((f) => ({ ...f, department: value, class: '' }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('adminExams.departmentPlaceholder')} />
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
              <div className="space-y-2">
                <Label>{t('adminExams.class')}</Label>
                {form.department && (() => {
                  const selectedDept = departments.find(d => d.name === form.department);
                  const deptClasses = selectedDept?.classes || [];
                  if (deptClasses.length > 0) {
                    return (
                      <Select
                        value={form.class}
                        onValueChange={(value) => setForm((f) => ({ ...f, class: value }))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t('adminExams.classPlaceholder')} />
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
                      id="exam-class"
                      placeholder={t('adminExams.noClasses')}
                      value={form.class}
                      onChange={(e) => setForm((f) => ({ ...f, class: e.target.value }))}
                      disabled={!form.department}
                    />
                  );
                })()}
              </div>
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
              {t('adminExams.deleteDesc', { name: deleteTarget?.name || '' })}{' '}{t('common.permanentDeleteWarning')}
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
