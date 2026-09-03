'use client';

import { useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Bell, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { dbPush, dbUpdate, dbRemove } from '@/lib/db-service';
import { toML, loc, type MLValue } from '@/lib/multilingual';
import { MLInput, MLTextarea } from '@/components/admin/MLFields';
import type { Notice } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  title: { bn: '', en: '', ar: '' } as MLValue,
  content: { bn: '', en: '', ar: '' } as MLValue,
  date: '',
  important: false,
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminNotices() {
  const { notices } = useAppStore();
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const locTitle = (n: Notice) => loc(language, n, 'title');
  const locContent = (n: Notice) => loc(language, n, 'content');

  /* Dialog state */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Notice | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  /* Delete confirmation */
  const [deleteTarget, setDeleteTarget] = useState<Notice | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* Reset form when dialog opens/closes */
  const resetAndOpen = useCallback(() => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((item: Notice) => {
    setEditingItem(item);
    setForm({
      title: toML(item, 'title'),
      content: toML(item, 'content'),
      date: item.date,
      important: item.important,
    });
    setDialogOpen(true);
  }, []);

  /* Submit handler */
  const handleSubmit = async () => {
    if (!form.title.bn.trim() || !form.content.bn.trim()) {
      toast({ title: t('common.error'), description: t('adminNotices.titleRequired'), variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: form.title.bn.trim(),
        titleEn: form.title.en.trim(),
        titleAr: form.title.ar.trim(),
        content: form.content.bn.trim(),
        contentEn: form.content.en.trim(),
        contentAr: form.content.ar.trim(),
        date: form.date.trim(),
        important: form.important,
      };
      if (editingItem) {
        await dbUpdate('/notices/' + editingItem.id, payload);
        toast({ title: t('common.success'), description: t('adminNotices.updated') });
      } else {
        await dbPush('/notices', { ...payload, createdAt: Date.now() });
        toast({ title: t('common.success'), description: t('adminNotices.created') });
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
      await dbRemove('/notices/' + deleteTarget.id);
      toast({ title: t('common.success'), description: t('adminNotices.deleted') });
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
          <h2 className="text-2xl font-bold text-islamic-dark">{t('admin.notices')}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t('adminNotices.count', { count: notices.length })}
          </p>
        </div>
        <Button
          onClick={resetAndOpen}
          className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
        >
          <Plus className="size-4" />
          {t('adminNotices.addNew')}
        </Button>
      </div>

      {/* Desktop Table + Mobile Cards */}
      {notices.length > 0 ? (
        <>
          {/* Desktop Table - hidden on mobile */}
          <Card className="shadow-sm hidden md:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-semibold text-muted-foreground w-28">
                        {t('common.date')}
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">
                        {t('common.title')}
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground w-24 text-center">
                        {t('adminNotices.importance')}
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground w-28 text-right">
                        {t('common.actions')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notices.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm text-muted-foreground py-3 whitespace-nowrap">
                          {item.date || '—'}
                        </TableCell>
                        <TableCell className="font-medium text-sm text-islamic-dark py-3 max-w-xs">
                          <p className="truncate">{locTitle(item)}</p>
                          {locContent(item) && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {locContent(item)}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          {item.important ? (
                            <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100 text-xs">
                              {t('notices.important')}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              {t('adminNotices.normal')}
                            </Badge>
                          )}
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
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {notices.map((item) => (
              <Card key={item.id} className={`shadow-sm ${item.important ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.important ? 'bg-red-100' : 'bg-islamic-lighter'}`}>
                      <Bell className={`w-4 h-4 ${item.important ? 'text-red-600' : 'text-islamic'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-islamic-dark truncate">{locTitle(item)}</p>
                        {item.important && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded bg-red-100 text-red-600 text-[9px] font-bold">
                            {t('notices.important')}
                          </span>
                        )}
                      </div>
                      {locContent(item) && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{locContent(item)}</p>
                      )}
                      {item.date && (
                        <p className="text-[10px] text-muted-foreground/60 mt-1.5">{item.date}</p>
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
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Bell className="size-12 opacity-20 mb-3" />
              <p className="text-sm">{t('adminNotices.noData')}</p>
              <p className="text-xs mt-1">{t('adminNotices.addHint')}</p>
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
              {editingItem ? t('adminNotices.editTitle') : t('adminNotices.addNew')}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? t('adminNotices.editDesc') : t('adminNotices.createDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <MLInput
              label={t('common.title')}
              required
              placeholder={t('adminNotices.titlePlaceholder')}
              value={form.title}
              onChange={(v) => setForm((f) => ({ ...f, title: v }))}
            />

            <MLTextarea
              label={t('common.description')}
              required
              rows={4}
              placeholder={t('adminNotices.contentPlaceholder')}
              value={form.content}
              onChange={(v) => setForm((f) => ({ ...f, content: v }))}
            />

            <div className="space-y-2">
              <Label htmlFor="notice-date">{t('common.date')}</Label>
              <Input
                id="notice-date"
                placeholder={t('adminNotices.datePlaceholder')}
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="notice-important" className="cursor-pointer">
                  {t('adminNotices.importantLabel')}
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('adminNotices.importantHint')}
                </p>
              </div>
              <Switch
                id="notice-important"
                checked={form.important}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, important: checked }))}
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
              {t('adminNotices.deleteDesc', { title: deleteTarget ? locTitle(deleteTarget) : '' })}{' '}{t('common.permanentDeleteWarning')}
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
