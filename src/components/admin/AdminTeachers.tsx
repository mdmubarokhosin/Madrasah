'use client';

import { useState, useCallback, useRef } from 'react';
import { Plus, Pencil, Trash2, Users, Loader2, Upload } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { dbPush, dbUpdate, dbRemove, uploadFileToGithub } from '@/lib/db-service';
import { toML, loc, type MLValue } from '@/lib/multilingual';
import { MLInput } from '@/components/admin/MLFields';
import type { Teacher } from '@/types/database';
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
  designation: { bn: '', en: '', ar: '' } as MLValue,
  qualification: { bn: '', en: '', ar: '' } as MLValue,
  department: '',
  order: 0,
  imageUrl: '',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminTeachers() {
  const { teachers, departments, githubConfig } = useAppStore();
  const { toast } = useToast();
  const { t, language } = useTranslation();

  /* Dialog state */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Teacher | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  /* Image upload state */
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Delete confirmation */
  const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* Image upload handler */
  const handleImageUpload = async (file: File): Promise<string> => {
    if (!githubConfig?.token || !githubConfig?.owner || !githubConfig?.repo) {
      toast({ title: t('common.error'), description: t('admission.githubNotConfigured'), variant: 'destructive' });
      return '';
    }
    try {
      const url = await uploadFileToGithub(file, githubConfig);
      return url;
    } catch {
      toast({ title: t('common.error'), description: t('admission.imageUploadFailed'), variant: 'destructive' });
      return '';
    }
  };

  /* Helpers */
  const resetAndOpen = useCallback(() => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((item: Teacher) => {
    setEditingItem(item);
    setForm({
      name: toML(item, 'name'),
      designation: toML(item, 'designation'),
      qualification: toML(item, 'qualification'),
      department: item.department,
      order: item.order,
      imageUrl: (item as Teacher & { imageUrl?: string }).imageUrl || '',
    });
    setDialogOpen(true);
  }, []);

  /* Submit handler */
  const handleSubmit = async () => {
    if (!form.name.bn.trim()) {
      toast({ title: t('common.error'), description: t('adminTeachers.nameRequired'), variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.bn.trim(),
        nameEn: form.name.en.trim(),
        nameAr: form.name.ar.trim(),
        designation: form.designation.bn.trim(),
        designationEn: form.designation.en.trim(),
        designationAr: form.designation.ar.trim(),
        qualification: form.qualification.bn.trim(),
        qualificationEn: form.qualification.en.trim(),
        qualificationAr: form.qualification.ar.trim(),
        department: form.department,
        order: Number(form.order) || 0,
        imageUrl: form.imageUrl,
      };

      if (editingItem) {
        await dbUpdate('/teachers/' + editingItem.id, payload);
        toast({ title: t('common.success'), description: t('adminTeachers.updated') });
      } else {
        await dbPush('/teachers', payload);
        toast({ title: t('common.success'), description: t('adminTeachers.created') });
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
      await dbRemove('/teachers/' + deleteTarget.id);
      toast({ title: t('common.success'), description: t('adminTeachers.deleted') });
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
          <h2 className="text-2xl font-bold text-islamic-dark">{t('admin.teachers')}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t('adminTeachers.count', { count: teachers.length })}
          </p>
        </div>
        <Button
          onClick={resetAndOpen}
          className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
        >
          <Plus className="size-4" />
          {t('adminTeachers.addNew')}
        </Button>
      </div>

      {/* Desktop Table + Mobile Cards */}
      {teachers.length > 0 ? (
        <>
          {/* Desktop Table - hidden on mobile */}
          <Card className="shadow-sm hidden md:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-semibold text-muted-foreground">
                        {t('common.name')}
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">
                        {t('adminTeachers.designation')}
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">
                        {t('adminTeachers.qualification')}
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground w-24">
                        {t('adminTeachers.department')}
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground w-28 text-right">
                        {t('common.actions')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teachers.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            {(item as Teacher & { imageUrl?: string }).imageUrl && (
                              <img
                                src={(item as Teacher & { imageUrl?: string }).imageUrl!}
                                alt={item.name}
                                className="w-9 h-9 rounded-full object-cover shrink-0 border border-border"
                              />
                            )}
                            <div>
                              <p className="font-medium text-sm text-islamic-dark">{loc(language, item, 'name')}</p>
                              {item.nameAr && (
                                <p className="text-golden text-base mt-0.5" style={{ fontFamily: 'serif' }} dir="rtl">
                                  {item.nameAr}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground py-3 whitespace-nowrap">
                          {loc(language, item, 'designation') || '—'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground py-3 whitespace-nowrap">
                          {loc(language, item, 'qualification') || '—'}
                        </TableCell>
                        <TableCell className="py-3">
                          <span className="inline-flex items-center rounded-full bg-islamic-lighter px-2.5 py-0.5 text-xs font-medium text-islamic-dark">
                            {item.department || '—'}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-islamic cursor-pointer" onClick={() => openEdit(item)}>
                              <Pencil className="size-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-red-600 cursor-pointer" onClick={() => setDeleteTarget(item)}>
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
            {teachers.map((item) => (
              <Card key={item.id} className="shadow-sm border-gray-100">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    {(item as Teacher & { imageUrl?: string }).imageUrl ? (
                      <img
                        src={(item as Teacher & { imageUrl?: string }).imageUrl!}
                        alt={item.name}
                        className="w-12 h-12 rounded-xl object-cover shrink-0 border border-border"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-islamic-lighter flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5 text-islamic" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-islamic-dark truncate">{loc(language, item, 'name')}</p>
                      {item.nameAr && (
                        <p className="text-golden text-sm mt-0.5" style={{ fontFamily: 'serif' }} dir="rtl">
                          {item.nameAr}
                        </p>
                      )}
                      {loc(language, item, 'designation') && (
                        <p className="text-xs text-muted-foreground mt-1">{loc(language, item, 'designation')}</p>
                      )}
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
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                    {item.department && (
                      <span className="inline-flex items-center rounded-full bg-islamic-lighter px-2 py-0.5 text-[10px] font-medium text-islamic-dark">
                        {item.department}
                      </span>
                    )}
                    {loc(language, item, 'qualification') && (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                        {loc(language, item, 'qualification')}
                      </span>
                    )}
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
              <Users className="size-12 opacity-20 mb-3" />
              <p className="text-sm">{t('adminTeachers.noData')}</p>
              <p className="text-xs mt-1">{t('adminTeachers.addHint')}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) { setEditingItem(null); setForm(EMPTY_FORM); }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-islamic-dark">
              {editingItem ? t('adminTeachers.editTitle') : t('adminTeachers.addNew')}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? t('adminTeachers.editDesc') : t('adminTeachers.createDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Image Upload Section */}
            <div className="space-y-2">
              <Label>{t('adminTeachers.profileImage')}</Label>
              <div className="flex items-center gap-3">
                {form.imageUrl && (
                  <img
                    src={form.imageUrl}
                    alt={t('common.preview')}
                    className="w-16 h-16 rounded-full object-cover border border-border"
                  />
                )}
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploading(true);
                    const url = await handleImageUpload(file);
                    if (url) {
                      setForm((f) => ({ ...f, imageUrl: url }));
                    }
                    setUploading(false);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Upload className="size-4" />
                  )}
                  {uploading ? t('common.uploading') : t('adminTeachers.uploadImage')}
                </Button>
              </div>
              {!githubConfig?.token && (
                <p className="text-xs text-amber-600">
                  {t('admission.githubNotConfigured')}
                </p>
              )}
            </div>

            <MLInput
              label={t('common.name')}
              required
              placeholder={t('adminTeachers.namePlaceholder')}
              value={form.name}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="teacher-designation">{t('adminTeachers.designation')}</Label>
                <Input
                  id="teacher-designation"
                  placeholder={t('adminTeachers.designationPlaceholder')}
                  value={form.designation.bn}
                  onChange={(e) => setForm((f) => ({ ...f, designation: { ...f.designation, bn: e.target.value } }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teacher-qualification">{t('adminTeachers.qualification')}</Label>
                <Input
                  id="teacher-qualification"
                  placeholder={t('adminTeachers.qualificationPlaceholder')}
                  value={form.qualification.bn}
                  onChange={(e) => setForm((f) => ({ ...f, qualification: { ...f.qualification, bn: e.target.value } }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t('ml.en')} / {t('ml.ar')}</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  dir="ltr"
                  lang="en"
                  placeholder="Designation (English)"
                  value={form.designation.en}
                  onChange={(e) => setForm((f) => ({ ...f, designation: { ...f.designation, en: e.target.value } }))}
                />
                <Input
                  dir="ltr"
                  lang="en"
                  placeholder="Qualification (English)"
                  value={form.qualification.en}
                  onChange={(e) => setForm((f) => ({ ...f, qualification: { ...f.qualification, en: e.target.value } }))}
                />
                <Input
                  dir="rtl"
                  lang="ar"
                  placeholder="المسمى الوظيفي (عربي)"
                  value={form.designation.ar}
                  onChange={(e) => setForm((f) => ({ ...f, designation: { ...f.designation, ar: e.target.value } }))}
                />
                <Input
                  dir="rtl"
                  lang="ar"
                  placeholder="المؤهل (عربي)"
                  value={form.qualification.ar}
                  onChange={(e) => setForm((f) => ({ ...f, qualification: { ...f.qualification, ar: e.target.value } }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('adminTeachers.department')}</Label>
                <Select
                  value={form.department}
                  onValueChange={(value) => setForm((f) => ({ ...f, department: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('adminTeachers.departmentPlaceholder')} />
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
                <Label htmlFor="teacher-order">{t('common.order')}</Label>
                <Input
                  id="teacher-order"
                  type="number"
                  placeholder={t('adminTeachers.zero')}
                  value={form.order}
                  onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) || 0 }))}
                />
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
              {t('adminTeachers.deleteDesc', { name: deleteTarget?.name || '' })}{' '}{t('common.permanentDeleteWarning')}
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
