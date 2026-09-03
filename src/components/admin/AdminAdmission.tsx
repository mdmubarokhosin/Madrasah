'use client';

import { useState, useCallback } from 'react';
import { Plus, Trash2, BookOpen, Pencil, Loader2, Calendar, FileCheck, ListChecks } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { dbPush, dbUpdate, dbRemove } from '@/lib/db-service';
import { mlListFromDB, mlListToDB, loc, locList, locSchedule, type MLValue } from '@/lib/multilingual';
import { MLRow } from '@/components/admin/MLFields';
import type { AdmissionInfo } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminAdmission() {
  const { admission } = useAppStore();
  const { toast } = useToast();
  const { t, language } = useTranslation();

  /* Dialog state */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdmissionInfo | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /* Form state */
  const [year, setYear] = useState('');
  const [requirements, setRequirements] = useState<MLValue[]>([{ bn: '', en: '', ar: '' }]);
  const [documents, setDocuments] = useState<MLValue[]>([{ bn: '', en: '', ar: '' }]);
  const [schedule, setSchedule] = useState<{ item: MLValue; date: string }[]>([{ item: { bn: '', en: '', ar: '' }, date: '' }]);

  /* Delete confirmation */
  const [deleteTarget, setDeleteTarget] = useState<AdmissionInfo | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* Helpers */
  const resetAndOpen = useCallback(() => {
    setEditingItem(null);
    setYear('');
    setRequirements([{ bn: '', en: '', ar: '' }]);
    setDocuments([{ bn: '', en: '', ar: '' }]);
    setSchedule([{ item: { bn: '', en: '', ar: '' }, date: '' }]);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((item: AdmissionInfo) => {
    setEditingItem(item);
    setYear(item.year);
    const reqRows = mlListFromDB(item, 'requirements');
    const docRows = mlListFromDB(item, 'documents');
    const scheduleEn = Array.isArray((item as any).scheduleEn) ? (item as any).scheduleEn : [];
    const scheduleAr = Array.isArray((item as any).scheduleAr) ? (item as any).scheduleAr : [];
    const scheduleRows = (item.schedule?.length > 0 ? item.schedule : [{ item: '', date: '' }]).map((s, i) => ({
      item: {
        bn: s.item || '',
        en: typeof scheduleEn[i]?.item === 'string' ? scheduleEn[i].item : '',
        ar: typeof scheduleAr[i]?.item === 'string' ? scheduleAr[i].item : '',
      },
      date: s.date || '',
    }));
    setRequirements(reqRows.length > 0 ? reqRows : [{ bn: '', en: '', ar: '' }]);
    setDocuments(docRows.length > 0 ? docRows : [{ bn: '', en: '', ar: '' }]);
    setSchedule(scheduleRows.length > 0 ? scheduleRows : [{ item: { bn: '', en: '', ar: '' }, date: '' }]);
    setDialogOpen(true);
  }, []);

  /* List item handlers (multilingual rows) */
  const handleAddRequirement = () => setRequirements((prev) => [...prev, { bn: '', en: '', ar: '' }]);
  const handleRemoveRequirement = (idx: number) => setRequirements((prev) => prev.filter((_, i) => i !== idx));
  const handleRequirementChange = (idx: number, value: MLValue) =>
    setRequirements((prev) => prev.map((r, i) => (i === idx ? value : r)));

  const handleAddDocument = () => setDocuments((prev) => [...prev, { bn: '', en: '', ar: '' }]);
  const handleRemoveDocument = (idx: number) => setDocuments((prev) => prev.filter((_, i) => i !== idx));
  const handleDocumentChange = (idx: number, value: MLValue) =>
    setDocuments((prev) => prev.map((d, i) => (i === idx ? value : d)));

  const handleAddSchedule = () => setSchedule((prev) => [...prev, { item: { bn: '', en: '', ar: '' }, date: '' }]);
  const handleRemoveSchedule = (idx: number) => setSchedule((prev) => prev.filter((_, i) => i !== idx));
  const handleScheduleItemChange = (idx: number, value: MLValue) =>
    setSchedule((prev) => prev.map((s, i) => (i === idx ? { ...s, item: value } : s)));
  const handleScheduleDateChange = (idx: number, value: string) =>
    setSchedule((prev) => prev.map((s, i) => (i === idx ? { ...s, date: value } : s)));

  /* Submit handler */
  const handleSubmit = async () => {
    if (!year.trim()) {
      toast({ title: t('common.error'), description: t('adminAdmission.yearRequired'), variant: 'destructive' });
      return;
    }

    const reqDB = mlListToDB(requirements);
    const docDB = mlListToDB(documents);
    const keptSchedule = schedule.filter((s) => s.item.bn.trim() || s.item.en.trim() || s.item.ar.trim());
    const scheduleDB = {
      base: keptSchedule.map((s) => ({ item: s.item.bn.trim(), date: s.date.trim() })),
      en: keptSchedule.map((s) => ({ item: s.item.en.trim(), date: s.date.trim() })),
      ar: keptSchedule.map((s) => ({ item: s.item.ar.trim(), date: s.date.trim() })),
    };

    setSubmitting(true);
    try {
      const payload = {
        year: year.trim(),
        requirements: reqDB.base,
        requirementsEn: reqDB.en,
        requirementsAr: reqDB.ar,
        documents: docDB.base,
        documentsEn: docDB.en,
        documentsAr: docDB.ar,
        schedule: scheduleDB.base,
        scheduleEn: scheduleDB.en,
        scheduleAr: scheduleDB.ar,
      };
      if (editingItem) {
        await dbUpdate('/admission/' + editingItem.id, payload);
        toast({ title: t('common.success'), description: t('adminAdmission.updated') });
      } else {
        await dbPush('/admission', payload);
        toast({ title: t('common.success'), description: t('adminAdmission.created') });
      }
      setDialogOpen(false);
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
      await dbRemove('/admission/' + deleteTarget.id);
      toast({ title: t('common.success'), description: t('adminAdmission.deleted') });
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
          <h2 className="text-2xl font-bold text-islamic-dark">{t('admin.admission')}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t('adminAdmission.count', { count: admission.length })}
          </p>
        </div>
        <Button
          onClick={resetAndOpen}
          className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
        >
          <Plus className="size-4" />
          {t('adminAdmission.addNew')}
        </Button>
      </div>

      {/* Card View */}
      {admission.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {admission.map((item) => (
            <Card key={item.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-islamic-lighter text-islamic-dark border-islamic/20 text-xs font-semibold">
                      {t('adminAdmission.yearLabel')}
                    </Badge>
                    <CardTitle className="text-lg text-islamic-dark">{item.year}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
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
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Requirements */}
                {locList(language, item, 'requirements').length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <ListChecks className="size-4 text-islamic" />
                      <span className="text-xs font-semibold text-islamic-dark uppercase tracking-wide">
                        {t('adminAdmission.requirements')}
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {locList(language, item, 'requirements').map((req, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-islamic mt-0.5">•</span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {locList(language, item, 'requirements').length > 0 && locList(language, item, 'documents').length > 0 && <Separator />}

                {/* Documents */}
                {locList(language, item, 'documents').length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <FileCheck className="size-4 text-golden" />
                      <span className="text-xs font-semibold text-islamic-dark uppercase tracking-wide">
                        {t('adminAdmission.documents')}
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {locList(language, item, 'documents').map((doc, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-golden mt-0.5">•</span>
                          {doc}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {locList(language, item, 'documents').length > 0 && locSchedule(language, item).length > 0 && <Separator />}

                {/* Schedule */}
                {locSchedule(language, item).length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Calendar className="size-4 text-emerald-600" />
                      <span className="text-xs font-semibold text-islamic-dark uppercase tracking-wide">
                        {t('adminAdmission.schedule')}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {locSchedule(language, item).map((s, i) => (
                        <div key={i} className="flex items-start justify-between gap-2">
                          <span className="text-sm text-muted-foreground">{s.item}</span>
                          {s.date && (
                            <span className="text-xs font-medium text-islamic-dark bg-islamic-lighter px-2 py-0.5 rounded whitespace-nowrap">
                              {s.date}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <BookOpen className="size-12 opacity-20 mb-3" />
            <p className="text-sm">{t('adminAdmission.noData')}</p>
            <p className="text-xs mt-1">{t('adminAdmission.noDataHint')}</p>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) setEditingItem(null);
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-islamic-dark">
              {editingItem ? t('adminAdmission.editTitle') : t('adminAdmission.addNew')}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? t('adminAdmission.editDesc') : t('adminAdmission.addDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Year */}
            <div className="space-y-2">
              <Label htmlFor="admission-year">{t('adminAdmission.yearLabel')} *</Label>
              <Input
                id="admission-year"
                placeholder={t('adminAdmission.yearPlaceholder')}
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>

            <Separator />

            {/* Requirements */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">{t('adminAdmission.requirements')}</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1 text-xs cursor-pointer"
                  onClick={handleAddRequirement}
                >
                  <Plus className="size-3" />
                  {t('common.add')}
                </Button>
              </div>
              <div className="space-y-3">
                {requirements.map((req, idx) => (
                  <MLRow
                    key={idx}
                    value={req}
                    onChange={(v) => handleRequirementChange(idx, v)}
                    onRemove={requirements.length > 1 ? () => handleRemoveRequirement(idx) : undefined}
                    placeholder={t('adminAdmission.reqPlaceholder', { index: idx + 1 })}
                  />
                ))}
              </div>
            </div>

            <Separator />

            {/* Documents */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">{t('adminAdmission.documents')}</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1 text-xs cursor-pointer"
                  onClick={handleAddDocument}
                >
                  <Plus className="size-3" />
                  {t('common.add')}
                </Button>
              </div>
              <div className="space-y-3">
                {documents.map((doc, idx) => (
                  <MLRow
                    key={idx}
                    value={doc}
                    onChange={(v) => handleDocumentChange(idx, v)}
                    onRemove={documents.length > 1 ? () => handleRemoveDocument(idx) : undefined}
                    placeholder={t('adminAdmission.docPlaceholder', { index: idx + 1 })}
                  />
                ))}
              </div>
            </div>

            <Separator />

            {/* Schedule */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">{t('adminAdmission.schedule')}</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1 text-xs cursor-pointer"
                  onClick={handleAddSchedule}
                >
                  <Plus className="size-3" />
                  {t('common.add')}
                </Button>
              </div>
              <div className="space-y-3">
                {schedule.map((s, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <MLRow
                        value={s.item}
                        onChange={(v) => handleScheduleItemChange(idx, v)}
                        placeholder={t('adminAdmission.scheduleItemPlaceholder')}
                      />
                    </div>
                    <div className="w-36 sm:w-40 shrink-0">
                      <Label className="text-[10px] text-muted-foreground mb-1 block">{t('common.date')}</Label>
                      <Input
                        placeholder={t('common.date')}
                        value={s.date}
                        onChange={(e) => handleScheduleDateChange(idx, e.target.value)}
                      />
                    </div>
                    {schedule.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-9 shrink-0 mt-6 text-muted-foreground hover:text-red-600 cursor-pointer"
                        onClick={() => handleRemoveSchedule(idx)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setDialogOpen(false); setEditingItem(null); }}
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
              {t('adminAdmission.deleteDesc', { year: deleteTarget?.year ?? '' })}
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
