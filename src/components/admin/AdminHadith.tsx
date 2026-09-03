'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, BookOpen, Loader2 } from 'lucide-react';
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

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface HadithEntry {
  id: string;
  title: string;
  content: string;
  translation: string;
  category: 'hadith' | 'dua';
  date: string;
  createdAt: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const EMPTY_FORM = {
  title: '',
  content: '',
  translation: '',
  category: 'hadith' as 'hadith' | 'dua',
  date: '',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminHadith() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [entries, setEntries] = useState<HadithEntry[]>([]);
  const [filterCategory, setFilterCategory] = useState('all');

  /* Dialog state */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HadithEntry | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  /* Delete confirmation */
  const [deleteTarget, setDeleteTarget] = useState<HadithEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* Subscribe */
  useEffect(() => {
    const unsub = dbSubscribe('/hadithDuas', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list: HadithEntry[] = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        }));
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setEntries(list);
      } else {
        setEntries([]);
      }
    });
    return unsub;
  }, []);

  /* Filtered */
  const filteredEntries = filterCategory === 'all'
    ? entries
    : entries.filter((e) => e.category === filterCategory);

  /* Handlers */
  const resetAndOpen = useCallback(() => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((item: HadithEntry) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      content: item.content,
      translation: item.translation,
      category: item.category,
      date: item.date,
    });
    setDialogOpen(true);
  }, []);

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast({ title: t('common.error'), description: t('adminHadith.requiredFields'), variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        translation: form.translation.trim(),
        category: form.category,
        date: form.date,
      };

      if (editingItem) {
        await dbUpdate('/hadithDuas/' + editingItem.id, payload);
        toast({ title: t('common.success'), description: t('common.updated') });
      } else {
        await dbPush('/hadithDuas', { ...payload, createdAt: Date.now() });
        toast({ title: t('common.success'), description: t('adminHadith.created') });
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
      await dbRemove('/hadithDuas/' + deleteTarget.id);
      toast({ title: t('common.success'), description: t('adminHadith.deleted') });
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
          <h2 className="text-2xl font-bold text-islamic-dark">{t('adminHadith.title')}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t('adminHadith.subtitle')}
          </p>
        </div>
        <Button
          onClick={resetAndOpen}
          className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
        >
          <Plus className="size-4" />
          {t('common.addNew')}
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['all', 'hadith', 'dua'].map((cat) => (
          <Button
            key={cat}
            size="sm"
            variant={filterCategory === cat ? 'default' : 'outline'}
            onClick={() => setFilterCategory(cat)}
            className={`text-xs cursor-pointer ${filterCategory === cat ? 'bg-islamic hover:bg-islamic-light text-white' : ''}`}
          >
            {cat === 'all' ? t('common.all') : cat === 'hadith' ? t('adminHadith.hadith') : t('adminHadith.dua')}
          </Button>
        ))}
      </div>

      {/* Cards Grid */}
      {filteredEntries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEntries.map((entry) => (
            <Card key={entry.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${
                      entry.category === 'hadith'
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                        : 'bg-blue-100 text-blue-700 border-blue-200'
                    }`}>
                      {entry.category === 'hadith' ? t('adminHadith.hadith') : t('adminHadith.dua')}
                    </Badge>
                    {entry.date && (
                      <span className="text-xs text-muted-foreground">{entry.date}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-islamic cursor-pointer"
                      onClick={() => openEdit(entry)}
                    >
                      <Pencil className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-red-600 cursor-pointer"
                      onClick={() => setDeleteTarget(entry)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>

                <h3 className="font-semibold text-sm text-islamic-dark mb-2">{entry.title}</h3>

                <div className="text-right mb-2 bg-islamic/5 rounded-lg p-3">
                  <p className="text-sm leading-relaxed text-islamic-dark" dir="rtl" lang="ar">
                    {entry.content}
                  </p>
                </div>

                {entry.translation && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {entry.translation}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <BookOpen className="size-12 opacity-20 mb-3" />
          <p className="text-sm">{t('adminHadith.noData')}</p>
          <p className="text-xs mt-1">{t('adminHadith.noDataHint')}</p>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) { setEditingItem(null); setForm(EMPTY_FORM); }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-islamic-dark">
              {editingItem ? t('common.edit') : t('adminHadith.addTitle')}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? t('adminHadith.editDesc') : t('adminHadith.addDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="hadith-title">{t('common.title')} *</Label>
              <Input
                id="hadith-title"
                placeholder={t('common.enterTitle')}
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('common.type')}</Label>
              <Select
                value={form.category}
                onValueChange={(val) => setForm((f) => ({ ...f, category: val as 'hadith' | 'dua' }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hadith">{t('adminHadith.hadith')}</SelectItem>
                  <SelectItem value="dua">{t('adminHadith.dua')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hadith-content">{t('adminHadith.arabicContent')} *</Label>
              <Textarea
                id="hadith-content"
                placeholder={t('adminHadith.contentPlaceholder')}
                rows={4}
                dir="rtl"
                className="text-right"
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hadith-translation">{t('adminHadith.translationLabel')}</Label>
              <Textarea
                id="hadith-translation"
                placeholder={t('adminHadith.translationPlaceholder')}
                rows={3}
                value={form.translation}
                onChange={(e) => setForm((f) => ({ ...f, translation: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hadith-date">{t('common.date')}</Label>
              <Input
                id="hadith-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
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
              {t('adminHadith.deleteDesc', { title: deleteTarget?.title ?? '' })}
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
