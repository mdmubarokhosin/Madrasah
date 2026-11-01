'use client';

import { useState, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, FileText, Loader2, Search, SearchX, Tag, X } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { dbPush, dbUpdate, dbRemove } from '@/lib/db-service';
import { toML, loc, type MLValue } from '@/lib/multilingual';
import { MLInput, MLTextarea } from '@/components/admin/MLFields';
import type { BlogPost } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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

/* Values are stored in Firebase as-is; labels are translated at render time. */
const CATEGORY_OPTIONS = [
  { value: 'ইসলামিক লেখা', labelKey: 'adminBlogs.catIslamic' },
  { value: 'ফতোয়া', labelKey: 'adminBlogs.catFatwa' },
  { value: 'শিক্ষামূলক', labelKey: 'adminBlogs.catEducational' },
];

const CATEGORY_STYLES: Record<string, string> = {
  'ইসলামিক লেখা': 'bg-islamic-lighter text-islamic-dark border-islamic/20',
  'ফতোয়া': 'bg-golden-lighter text-golden border-golden/20',
  'শিক্ষামূলক': 'bg-primary/5 text-primary border-primary/25',
};

const EMPTY_FORM = {
  title: { bn: '', en: '', ar: '' } as MLValue,
  content: { bn: '', en: '', ar: '' } as MLValue,
  category: '',
  date: '',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminBlogs() {
  const { blogs } = useAppStore();
  const { toast } = useToast();
  const { t, language } = useTranslation();

  /* List filters */
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const hasFilters = searchQuery.trim() !== '' || categoryFilter !== '';

  /* Dialog state */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BlogPost | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  /* Delete confirmation */
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* Display list — newest first, then search + category filter */
  const sortedBlogs = useMemo(
    () => [...blogs].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    [blogs]
  );

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of blogs) {
      const c = (b.category || '').trim();
      if (c) counts.set(c, (counts.get(c) || 0) + 1);
    }
    return [...counts.entries()];
  }, [blogs]);

  const filteredBlogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q && !categoryFilter) return sortedBlogs;
    return sortedBlogs.filter((b) => {
      if (categoryFilter && (b.category || '') !== categoryFilter) return false;
      if (!q) return true;
      return [b.title, b.titleEn, b.titleAr, b.content, b.contentEn, b.contentAr]
        .some((v) => typeof v === 'string' && v.toLowerCase().includes(q));
    });
  }, [sortedBlogs, searchQuery, categoryFilter]);

  /* Helpers */
  const resetAndOpen = useCallback(() => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((item: BlogPost) => {
    setEditingItem(item);
    setForm({
      title: toML(item, 'title'),
      content: toML(item, 'content'),
      category: item.category,
      date: item.date,
    });
    setDialogOpen(true);
  }, []);

  /* Submit handler */
  const handleSubmit = async () => {
    if (!form.title.bn.trim() || !form.content.bn.trim() || !form.category) {
      toast({ title: t('common.error'), description: t('adminBlogs.requiredFields'), variant: 'destructive' });
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
        category: form.category,
        date: form.date.trim(),
      };
      if (editingItem) {
        await dbUpdate('/blogs/' + editingItem.id, payload);
        toast({ title: t('common.success'), description: t('adminBlogs.updated') });
      } else {
        await dbPush('/blogs', { ...payload, createdAt: Date.now() });
        toast({ title: t('common.success'), description: t('adminBlogs.created') });
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
      await dbRemove('/blogs/' + deleteTarget.id);
      toast({ title: t('common.success'), description: t('adminBlogs.deleted') });
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
          <h2 className="text-2xl font-bold text-islamic-dark">{t('adminBlogs.title')}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {hasFilters
              ? t('adminBlogs.showingCount', { shown: filteredBlogs.length, total: blogs.length })
              : t('adminBlogs.count', { count: blogs.length })}
          </p>
        </div>
        <Button
          onClick={resetAndOpen}
          className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
        >
          <Plus className="size-4" />
          {t('adminBlogs.addNew')}
        </Button>
      </div>

      {/* Search + category filter toolbar */}
      {blogs.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 sm:p-4 md:flex-row md:items-center md:justify-between">
          {/* Search */}
          <div className="relative min-w-0 flex-1 md:max-w-xs">
            <Search
              className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('adminBlogs.searchPlaceholder')}
              aria-label={t('common.search')}
              className="h-10 rounded-full ps-9 pe-9"
            />
            {searchQuery !== '' && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute end-2 top-1/2 grid size-6 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-muted-foreground transition-colors hover:bg-islamic-lighter hover:text-islamic"
                aria-label={t('common.cancel')}
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Category chips */}
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t('common.category')}>
            <button
              type="button"
              onClick={() => setCategoryFilter('')}
              aria-pressed={categoryFilter === ''}
              className={`inline-flex min-h-9 cursor-pointer items-center rounded-full px-3 text-xs font-semibold transition-colors ${
                categoryFilter === ''
                  ? 'bg-islamic text-white shadow-sm'
                  : 'border border-border bg-surface-tertiary/40 text-muted-foreground hover:bg-islamic-lighter hover:text-islamic-dark'
              }`}
            >
              {t('adminBlogs.filterAll')}
            </button>
            {categoryCounts.map(([cat, count]) => (
              <button
                key={cat || 'uncategorized'}
                type="button"
                onClick={() => setCategoryFilter(categoryFilter === cat ? '' : cat)}
                aria-pressed={categoryFilter === cat}
                className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors ${
                  categoryFilter === cat
                    ? 'bg-islamic text-white shadow-sm'
                    : 'border border-border bg-surface-tertiary/40 text-muted-foreground hover:bg-islamic-lighter hover:text-islamic-dark'
                }`}
              >
                {cat || t('common.category')}
                <span
                  className={`rounded-full px-1.5 text-[10px] font-bold ${
                    categoryFilter === cat ? 'bg-white/20' : 'bg-islamic-lighter text-islamic-dark'
                  }`}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Desktop Table + Mobile Cards */}
      {blogs.length > 0 ? (
        filteredBlogs.length > 0 ? (
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
                        <TableHead className="text-xs font-semibold text-muted-foreground w-36">
                          {t('common.category')}
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground w-28 text-right">
                          {t('common.actions')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBlogs.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-sm text-muted-foreground py-3 whitespace-nowrap">
                            {item.date || '—'}
                          </TableCell>
                          <TableCell className="font-medium text-sm text-islamic-dark py-3 max-w-xs">
                            <p className="truncate">{loc(language, item, 'title')}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-md">
                              {(loc(language, item, 'content') || '').substring(0, 80)}...
                            </p>
                          </TableCell>
                          <TableCell className="py-3">
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                CATEGORY_STYLES[item.category] || 'bg-surface-tertiary text-muted-foreground'
                              }`}
                            >
                              {item.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-islamic cursor-pointer" onClick={() => openEdit(item)}>
                                <Pencil className="size-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-danger cursor-pointer" onClick={() => setDeleteTarget(item)}>
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
              {filteredBlogs.map((item) => (
                <Card key={item.id} className="shadow-sm border-border">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-islamic-lighter flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-islamic" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-islamic-dark truncate">{loc(language, item, 'title')}</p>
                        {loc(language, item, 'content') && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{(loc(language, item, 'content') || '').substring(0, 100)}...</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          {item.date && (
                            <p className="text-[10px] text-muted-foreground/60">{item.date}</p>
                          )}
                          <Badge
                            variant="outline"
                            className={`text-[9px] px-1.5 py-0 ${
                              CATEGORY_STYLES[item.category] || 'bg-surface-tertiary text-muted-foreground'
                            }`}
                          >
                            {item.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-islamic cursor-pointer" onClick={() => openEdit(item)}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-danger cursor-pointer" onClick={() => setDeleteTarget(item)}>
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
          /* Filters active but nothing matched */
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
                <div className="mb-3 grid size-14 place-items-center rounded-full bg-golden-lighter ring-1 ring-golden/25">
                  <SearchX className="size-6 text-golden" aria-hidden="true" />
                </div>
                <p className="text-sm font-semibold text-islamic-dark">{t('adminBlogs.noSearchResults')}</p>
                <p className="text-xs mt-1">{t('adminBlogs.noSearchHint')}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setSearchQuery(''); setCategoryFilter(''); }}
                  className="mt-4 cursor-pointer"
                >
                  <X className="size-3.5" />
                  {t('common.cancel')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FileText className="size-12 opacity-20 mb-3" />
              <p className="text-sm">{t('adminBlogs.noData')}</p>
              <p className="text-xs mt-1">{t('adminBlogs.noDataHint')}</p>
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
              {editingItem ? t('adminBlogs.editTitle') : t('adminBlogs.addNew')}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? t('adminBlogs.editDesc') : t('adminBlogs.addDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Section: article content */}
            <section className="space-y-4 rounded-xl border border-border bg-surface-tertiary/30 p-4">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-islamic-lighter text-islamic">
                  <FileText className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-islamic-dark">{t('adminBlogs.sectionContent')}</p>
                  <p className="text-xs text-muted-foreground">{t('adminBlogs.sectionContentDesc')}</p>
                </div>
              </div>

              <MLInput
                label={t('adminBlogs.titleML')}
                required
                placeholder={t('adminBlogs.titlePlaceholder')}
                value={form.title}
                onChange={(v) => setForm((f) => ({ ...f, title: v }))}
              />

              <MLTextarea
                label={t('adminBlogs.contentML')}
                required
                rows={8}
                placeholder={t('adminBlogs.contentPlaceholder')}
                value={form.content}
                onChange={(v) => setForm((f) => ({ ...f, content: v }))}
              />
            </section>

            {/* Section: category & publish date */}
            <section className="space-y-4 rounded-xl border border-border bg-surface-tertiary/30 p-4">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-golden-lighter text-golden">
                  <Tag className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-islamic-dark">{t('adminBlogs.sectionMeta')}</p>
                  <p className="text-xs text-muted-foreground">{t('adminBlogs.sectionMetaDesc')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('common.category')} *</Label>
                  <Select
                    value={form.category}
                    onValueChange={(value) => setForm((f) => ({ ...f, category: value }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('adminBlogs.selectCategory')} />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {t(opt.labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blog-date">{t('common.date')}</Label>
                  <Input
                    id="blog-date"
                    placeholder={t('adminBlogs.datePlaceholder')}
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  />
                </div>
              </div>
            </section>
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
              {t('adminBlogs.deleteDesc', { title: deleteTarget ? loc(language, deleteTarget, 'title') : '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-danger hover:bg-danger/90 text-white gap-2 cursor-pointer"
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
