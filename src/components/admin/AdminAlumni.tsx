'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, GraduationCap, Loader2 } from 'lucide-react';
import { dbPush, dbUpdate, dbRemove, dbSubscribe } from '@/lib/db-service';
import { useTranslation } from '@/lib/i18n-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
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

interface AlumniRecord {
  id: string;
  name: string;
  passingYear: string;
  department: string;
  currentOccupation: string;
  phone: string;
  email: string;
  address: string;
  bio: string;
  createdAt: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const EMPTY_FORM = {
  name: '',
  passingYear: '',
  department: '',
  currentOccupation: '',
  phone: '',
  email: '',
  address: '',
  bio: '',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminAlumni() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [records, setRecords] = useState<AlumniRecord[]>([]);

  /* Dialog state */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AlumniRecord | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  /* Delete confirmation */
  const [deleteTarget, setDeleteTarget] = useState<AlumniRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* Subscribe */
  useEffect(() => {
    const unsub = dbSubscribe('/alumni', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list: AlumniRecord[] = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        }));
        list.sort((a, b) => (b.passingYear || '').localeCompare(a.passingYear || ''));
        setRecords(list);
      } else {
        setRecords([]);
      }
    });
    return unsub;
  }, []);

  /* Handlers */
  const resetAndOpen = useCallback(() => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((item: AlumniRecord) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      passingYear: item.passingYear,
      department: item.department,
      currentOccupation: item.currentOccupation,
      phone: item.phone,
      email: item.email,
      address: item.address,
      bio: item.bio,
    });
    setDialogOpen(true);
  }, []);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast({ title: t('common.error'), description: t('adminAlumni.nameRequired'), variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        passingYear: form.passingYear.trim(),
        department: form.department.trim(),
        currentOccupation: form.currentOccupation.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        bio: form.bio.trim(),
      };

      if (editingItem) {
        await dbUpdate('/alumni/' + editingItem.id, payload);
        toast({ title: t('common.success'), description: t('adminAlumni.updatedMsg') });
      } else {
        await dbPush('/alumni', { ...payload, createdAt: Date.now() });
        toast({ title: t('common.success'), description: t('adminAlumni.createdMsg') });
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
      await dbRemove('/alumni/' + deleteTarget.id);
      toast({ title: t('common.success'), description: t('adminAlumni.deletedMsg') });
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
          <h2 className="text-2xl font-bold text-islamic-dark">{t('adminAlumni.title')}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t('adminAlumni.count', { count: records.length })}
          </p>
        </div>
        <Button
          onClick={resetAndOpen}
          className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
        >
          <Plus className="size-4" />
          {t('adminAlumni.addNew')}
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
                      <TableHead className="text-xs font-semibold text-muted-foreground">{t('common.name')}</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminAlumni.passingYear')}</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminAlumni.department')}</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminAlumni.occupation')}</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminAlumni.contact')}</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground text-right">{t('common.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium text-sm text-islamic-dark py-3">
                          {item.name}
                        </TableCell>
                        <TableCell className="text-sm py-3 text-muted-foreground">
                          {item.passingYear || '—'}
                        </TableCell>
                        <TableCell className="text-sm py-3 text-muted-foreground">
                          {item.department || '—'}
                        </TableCell>
                        <TableCell className="text-sm py-3 text-muted-foreground">
                          {item.currentOccupation || '—'}
                        </TableCell>
                        <TableCell className="text-sm py-3 text-muted-foreground">
                          <div>
                            {item.phone && <p className="text-xs">{item.phone}</p>}
                            {item.email && <p className="text-xs">{item.email}</p>}
                            {!item.phone && !item.email && <span>—</span>}
                          </div>
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
                      <p className="font-bold text-sm text-islamic-dark truncate">{item.name}</p>
                      {item.currentOccupation && (
                        <p className="text-xs text-muted-foreground mt-0.5">{item.currentOccupation}</p>
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
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {item.passingYear && (
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                        {t('adminAlumni.batch')} {item.passingYear}
                      </span>
                    )}
                    {item.department && (
                      <span className="inline-flex items-center rounded-full bg-islamic-lighter px-2 py-0.5 text-[10px] font-medium text-islamic-dark">
                        {item.department}
                      </span>
                    )}
                  </div>
                  {(item.phone || item.email) && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      {item.phone && <p className="text-[10px] text-muted-foreground">{item.phone}</p>}
                      {item.email && <p className="text-[10px] text-muted-foreground">{item.email}</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <GraduationCap className="size-12 opacity-20 mb-3" />
              <p className="text-sm">{t('adminAlumni.noData')}</p>
              <p className="text-xs mt-1">{t('adminAlumni.emptyHint')}</p>
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
              {editingItem ? t('adminAlumni.editTitle') : t('adminAlumni.addNew')}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? t('adminAlumni.editDesc') : t('adminAlumni.createDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="alumni-name">{t('common.name')} *</Label>
              <Input
                id="alumni-name"
                placeholder={t('adminAlumni.namePh')}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="alumni-year">{t('adminAlumni.passingYear')}</Label>
                <Input
                  id="alumni-year"
                  placeholder={t('adminAlumni.yearPh')}
                  value={form.passingYear}
                  onChange={(e) => setForm((f) => ({ ...f, passingYear: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alumni-dept">{t('adminAlumni.department')}</Label>
                <Input
                  id="alumni-dept"
                  placeholder={t('adminAlumni.departmentPh')}
                  value={form.department}
                  onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alumni-occupation">{t('adminAlumni.occupation')}</Label>
              <Input
                id="alumni-occupation"
                placeholder={t('adminAlumni.occupationPh')}
                value={form.currentOccupation}
                onChange={(e) => setForm((f) => ({ ...f, currentOccupation: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="alumni-phone">{t('common.phone')}</Label>
                <Input
                  id="alumni-phone"
                  placeholder={t('adminAlumni.phonePh')}
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alumni-email">{t('common.email')}</Label>
                <Input
                  id="alumni-email"
                  type="email"
                  placeholder={t('adminAlumni.emailPh')}
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alumni-address">{t('common.address')}</Label>
              <Input
                id="alumni-address"
                placeholder={t('adminAlumni.addressPh')}
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alumni-bio">{t('adminAlumni.bio')}</Label>
              <Textarea
                id="alumni-bio"
                placeholder={t('adminAlumni.bioPh')}
                rows={3}
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); setEditingItem(null); setForm(EMPTY_FORM); }}>
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
              {t('adminAlumni.deleteDesc', { name: deleteTarget?.name || '' })}
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
