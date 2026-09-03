'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { Plus, Pencil, Trash2, UserCheck, Search, Loader2, Upload } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { dbPush, dbUpdate, dbRemove, uploadFileToGithub } from '@/lib/db-service';
import type { Student } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  name: '',
  roll: '',
  registrationNumber: '',
  department: '',
  class: '',
  fatherName: '',
  admissionYear: '',
  imageUrl: '',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminStudents() {
  const { students, departments, githubConfig } = useAppStore();
  const { toast } = useToast();
  const { t } = useTranslation();

  /* Search state */
  const [search, setSearch] = useState('');

  /* Filtered list */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.roll.toLowerCase().includes(q) ||
        (s.registrationNumber && s.registrationNumber.toLowerCase().includes(q)) ||
        (s.fatherName && s.fatherName.toLowerCase().includes(q))
    );
  }, [students, search]);

  /* Dialog state */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Student | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  /* Image upload state */
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Delete confirmation */
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
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

  const openEdit = useCallback((item: Student) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      roll: item.roll,
      registrationNumber: item.registrationNumber || '',
      department: item.department,
      class: item.class,
      fatherName: item.fatherName,
      admissionYear: item.admissionYear,
      imageUrl: (item as Student & { imageUrl?: string }).imageUrl || '',
    });
    setDialogOpen(true);
  }, []);

  /* Submit handler */
  const handleSubmit = async () => {
    if (!form.name.trim() || !form.roll.trim()) {
      toast({ title: t('common.error'), description: t('adminStudents.nameRollRequired'), variant: 'destructive' });
      return;
    }
    if (!editingItem && !form.registrationNumber.trim()) {
      toast({ title: t('common.error'), description: t('adminStudents.regRequired'), variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        roll: form.roll.trim(),
        department: form.department,
        class: form.class.trim(),
        fatherName: form.fatherName.trim(),
        admissionYear: form.admissionYear.trim(),
        imageUrl: form.imageUrl,
      };

      if (!editingItem) {
        // Only set registrationNumber on creation — cannot be changed after
        if (!form.registrationNumber.trim()) {
          toast({ title: t('common.error'), description: t('adminStudents.regRequired'), variant: 'destructive' });
          setSubmitting(false);
          return;
        }
        (payload as any).registrationNumber = form.registrationNumber.trim();
      }

      if (editingItem) {
        await dbUpdate('/students/' + editingItem.id, payload);
        toast({ title: t('common.success'), description: t('adminStudents.updated') });
      } else {
        await dbPush('/students', {
          ...payload,
          createdAt: Date.now(),
        });
        toast({ title: t('common.success'), description: t('adminStudents.created') });
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
      await dbRemove('/students/' + deleteTarget.id);
      toast({ title: t('common.success'), description: t('adminStudents.deleted') });
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
          <h2 className="text-2xl font-bold text-islamic-dark">{t('admin.students')}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t('adminStudents.count', { count: students.length })}
            {search.trim() && (
              <span className="ml-2">
                {t('adminStudents.foundPrefix')}{' '}<Badge variant="secondary" className="text-xs mx-1">{filtered.length}</Badge>{t('adminStudents.foundSuffix')}
              </span>
            )}
          </p>
        </div>
        <Button
          onClick={resetAndOpen}
          className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
        >
          <Plus className="size-4" />
          {t('adminStudents.addNew')}
        </Button>
      </div>

      {/* Search bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder={t('adminStudents.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Desktop Table + Mobile Cards */}
      {filtered.length > 0 ? (
        <>
          {/* Desktop Table - hidden on mobile */}
          <Card className="shadow-sm hidden md:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-semibold text-muted-foreground w-20">
                        {t('adminStudents.roll')}
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">
                        {t('common.name')}
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">
                        {t('adminStudents.fatherName')}
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground w-24">
                        {t('adminStudents.department')}
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground w-24">
                        {t('adminStudents.class')}
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground w-28">
                        {t('adminStudents.registration')}
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground w-28 text-right">
                        {t('common.actions')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-sm text-muted-foreground py-3 whitespace-nowrap">
                          {item.roll}
                        </TableCell>
                        <TableCell className="font-medium text-sm text-islamic-dark py-3">
                          <div className="flex items-center gap-2">
                            {(item as Student & { imageUrl?: string }).imageUrl && (
                              <img
                                src={(item as Student & { imageUrl?: string }).imageUrl!}
                                alt={item.name}
                                className="w-7 h-7 rounded-full object-cover shrink-0 border border-border"
                              />
                            )}
                            <span>{item.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground py-3 whitespace-nowrap">
                          {item.fatherName || '—'}
                        </TableCell>
                        <TableCell className="py-3">
                          <span className="inline-flex items-center rounded-full bg-islamic-lighter px-2.5 py-0.5 text-xs font-medium text-islamic-dark">
                            {item.department || '—'}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground py-3 whitespace-nowrap">
                          {item.class || '—'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground py-3 whitespace-nowrap font-mono">
                          {item.registrationNumber || '—'}
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
            {filtered.map((item) => (
              <Card key={item.id} className="shadow-sm border-gray-100">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    {(item as Student & { imageUrl?: string }).imageUrl ? (
                      <img
                        src={(item as Student & { imageUrl?: string }).imageUrl!}
                        alt={item.name}
                        className="w-11 h-11 rounded-xl object-cover shrink-0 border border-border"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-islamic-lighter flex items-center justify-center shrink-0">
                        <UserCheck className="w-5 h-5 text-islamic" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-islamic-dark truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono">{t('adminStudents.rollColon')} {item.roll}</p>
                      {item.registrationNumber && (
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5 font-mono">{t('adminStudents.regShort')} {item.registrationNumber}</p>
                      )}
                      {item.fatherName && (
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5">{t('adminStudents.fatherShort')} {item.fatherName}</p>
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
                    {item.class && (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                        {item.class}
                      </span>
                    )}
                    {item.admissionYear && (
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                        {item.admissionYear}
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
              <UserCheck className="size-12 opacity-20 mb-3" />
              <p className="text-sm">
                {search.trim() ? t('adminStudents.noSearchResult') : t('adminStudents.noData')}
              </p>
              <p className="text-xs mt-1">
                {search.trim() ? t('adminStudents.noSearchHint') : t('adminStudents.addHint')}
              </p>
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
              {editingItem ? t('adminStudents.editTitle') : t('adminStudents.addNew')}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? t('adminStudents.editDesc') : t('adminStudents.createDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Image Upload Section */}
            <div className="space-y-2">
              <Label>{t('adminStudents.studentImage')}</Label>
              <div className="flex items-center gap-3">
                {form.imageUrl && (
                  <img
                    src={form.imageUrl}
                    alt={t('common.preview')}
                    className="w-14 h-14 rounded-full object-cover border border-border"
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
                  {uploading ? t('common.uploading') : t('adminStudents.uploadImage')}
                </Button>
              </div>
              {!githubConfig?.token && (
                <p className="text-xs text-amber-600">
                  {t('admission.githubNotConfigured')}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="student-name">{t('common.name')} *</Label>
                <Input
                  id="student-name"
                  placeholder={t('adminStudents.namePlaceholder')}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-roll">{t('adminStudents.roll')} *</Label>
                <Input
                  id="student-roll"
                  placeholder={t('adminStudents.rollPlaceholder')}
                  value={form.roll}
                  onChange={(e) => setForm((f) => ({ ...f, roll: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="student-reg">{t('adminStudents.regNumber')} * <span className="text-xs text-muted-foreground font-normal">{t('adminStudents.regImmutable')}</span></Label>
              <Input
                id="student-reg"
                placeholder={t('adminStudents.regNumber')}
                value={form.registrationNumber}
                onChange={(e) => setForm((f) => ({ ...f, registrationNumber: e.target.value }))}
                disabled={!!editingItem}
                className={editingItem ? 'bg-muted cursor-not-allowed' : ''}
              />
              {editingItem && (
                <p className="text-xs text-amber-600">{t('adminStudents.regLocked')}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="student-father">{t('adminStudents.fatherName')}</Label>
              <Input
                id="student-father"
                placeholder={t('adminStudents.fatherName')}
                value={form.fatherName}
                onChange={(e) => setForm((f) => ({ ...f, fatherName: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('adminStudents.department')}</Label>
                <Select
                  value={form.department}
                  onValueChange={(value) => {
                    setForm((f) => ({ ...f, department: value, class: '' }));
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('adminStudents.departmentPlaceholder')} />
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
                <Label>{t('adminStudents.class')}</Label>
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
                          <SelectValue placeholder={t('adminStudents.classPlaceholder')} />
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
                      id="student-class"
                      placeholder={t('adminStudents.noClasses')}
                      value={form.class}
                      onChange={(e) => setForm((f) => ({ ...f, class: e.target.value }))}
                      disabled={!form.department}
                    />
                  );
                })()}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="student-admission">{t('adminStudents.admissionYear')}</Label>
              <Input
                id="student-admission"
                placeholder={t('adminStudents.yearPlaceholder')}
                value={form.admissionYear}
                onChange={(e) => setForm((f) => ({ ...f, admissionYear: e.target.value }))}
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
              {t('adminStudents.deleteDesc', { name: deleteTarget?.name || '', roll: deleteTarget?.roll || '' })}{' '}{t('common.permanentDeleteWarning')}
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
