'use client';

import { useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, GraduationCap, BookOpen, Book, Scale, Star, Loader2, GripVertical, ImageIcon, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { dbPush, dbUpdate, dbRemove } from '@/lib/db-service';
import { toML, loc, type MLValue } from '@/lib/multilingual';
import { MLInput, MLTextarea } from '@/components/admin/MLFields';
import type { Department } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ICON_OPTIONS = [
  { value: 'BookOpen', labelKey: 'adminDepartments.iconBookOpen', icon: BookOpen },
  { value: 'Book', labelKey: 'adminDepartments.iconBook', icon: Book },
  { value: 'Scale', labelKey: 'adminDepartments.iconScale', icon: Scale },
  { value: 'Star', labelKey: 'adminDepartments.iconStar', icon: Star },
  { value: 'GraduationCap', labelKey: 'adminDepartments.iconGraduationCap', icon: GraduationCap },
];

const EMPTY_FORM = {
  name: { bn: '', en: '', ar: '' } as MLValue,
  description: { bn: '', en: '', ar: '' } as MLValue,
  icon: 'BookOpen',
  order: 0,
  imageUrl: '',
  classes: [] as string[],
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getIconComponent(iconName: string, className: string) {
  const match = ICON_OPTIONS.find((opt) => opt.value === iconName);
  if (!match) return <GraduationCap className={className} />;
  const Icon = match.icon;
  return <Icon className={className} />;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminDepartments() {
  const { departments } = useAppStore();
  const { toast } = useToast();
  const { t, language } = useTranslation();

  /* Dialog state */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Department | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  /* Delete confirmation */
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* Class management */
  const [newClassName, setNewClassName] = useState('');

  const addClassName = useCallback(() => {
    const trimmed = newClassName.trim();
    if (!trimmed) return;
    if (form.classes.includes(trimmed)) {
      toast({ title: t('common.warning'), description: t('adminDepartments.classExists'), variant: 'destructive' });
      return;
    }
    setForm((f) => ({ ...f, classes: [...f.classes, trimmed] }));
    setNewClassName('');
  }, [newClassName, form.classes, toast, t]);

  const removeClassName = useCallback((index: number) => {
    setForm((f) => ({ ...f, classes: f.classes.filter((_, i) => i !== index) }));
  }, []);

  /* View mode */
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  /* Sort helper */
  const sortedDepts = [...departments].sort((a, b) => (a.order || 0) - (b.order || 0));

  /* Helpers */
  const resetAndOpen = useCallback(() => {
    setEditingItem(null);
    setForm({
      ...EMPTY_FORM,
      order: departments.length > 0
        ? Math.max(...departments.map(d => d.order || 0)) + 1
        : 1,
    });
    setDialogOpen(true);
  }, [departments.length]);

  const openEdit = useCallback((item: Department) => {
    setEditingItem(item);
    setForm({
      name: toML(item, 'name'),
      description: toML(item, 'description'),
      icon: item.icon,
      order: item.order,
      imageUrl: item.imageUrl || '',
      classes: item.classes || [],
    });
    setDialogOpen(true);
  }, []);

  /* Submit handler */
  const handleSubmit = async () => {
    if (!form.name.bn.trim()) {
      toast({ title: t('common.error'), description: t('adminDepartments.nameRequired'), variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.bn.trim(),
        nameEn: form.name.en.trim(),
        nameAr: form.name.ar.trim(),
        description: form.description.bn.trim(),
        descriptionEn: form.description.en.trim(),
        descriptionAr: form.description.ar.trim(),
        icon: form.icon,
        order: Number(form.order) || 0,
        imageUrl: form.imageUrl.trim(),
        classes: form.classes || [],
      };

      if (editingItem) {
        await dbUpdate('/departments/' + editingItem.id, payload);
        toast({ title: t('common.success'), description: t('adminDepartments.updated') });
      } else {
        await dbPush('/departments', payload);
        toast({ title: t('common.success'), description: t('adminDepartments.created') });
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
      await dbRemove('/departments/' + deleteTarget.id);
      toast({ title: t('common.success'), description: t('adminDepartments.deleted') });
      setDeleteTarget(null);
    } catch {
      toast({ title: t('common.error'), description: t('common.deleteFailed'), variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  /* Move order up/down */
  const moveOrder = async (item: Department, direction: 'up' | 'down') => {
    const idx = sortedDepts.findIndex((d) => d.id === item.id);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sortedDepts.length) return;
    const swapItem = sortedDepts[swapIdx];
    try {
      await dbUpdate('/departments/' + item.id, { order: swapItem.order || 0 });
      await dbUpdate('/departments/' + swapItem.id, { order: item.order || 0 });
    } catch {
      toast({ title: t('common.error'), description: t('adminDepartments.orderChangeFailed'), variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-islamic-dark flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-islamic/10 flex items-center justify-center">
              <GraduationCap className="size-5 text-islamic" />
            </div>
            {t('admin.departments')}
          </h2>
          <p className="text-muted-foreground text-sm mt-1.5 ml-11">
            {t('adminDepartments.countPrefix')}<span className="font-semibold text-islamic-dark">{departments.length}</span>{t('adminDepartments.countSuffix')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-white shadow-sm text-islamic-dark' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('adminDepartments.viewGrid')}
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-white shadow-sm text-islamic-dark' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('adminDepartments.viewList')}
            </button>
          </div>
          <Button
            onClick={resetAndOpen}
            className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer shadow-sm"
          >
            <Plus className="size-4" />
            {t('adminDepartments.addNew')}
          </Button>
        </div>
      </div>

      {/* Departments */}
      {departments.length > 0 ? (
        viewMode === 'grid' ? (
          /* ========== GRID VIEW ========== */
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedDepts.map((item, idx) => (
              <Card
                key={item.id}
                className="group relative shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-islamic/20 overflow-hidden"
              >
                {/* Top colored bar */}
                <div className="h-1 bg-gradient-to-r from-islamic via-islamic-light to-golden" />

                <CardContent className="p-5">
                  {/* Icon + Action buttons row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-islamic-lighter flex items-center justify-center text-islamic shrink-0 shadow-sm">
                      {getIconComponent(item.icon, 'size-6')}
                    </div>
                    {/* Action buttons - always visible */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-islamic hover:bg-islamic-lighter/50 cursor-pointer"
                        onClick={() => openEdit(item)}
                        title={t('common.edit')}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        onClick={() => setDeleteTarget(item)}
                        title={t('common.delete')}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Arabic Name */}
                  {item.nameAr && (
                    <p
                      className="text-golden text-lg mb-0.5 text-right leading-relaxed"
                      style={{ fontFamily: 'serif' }}
                      dir="rtl"
                    >
                      {item.nameAr}
                    </p>
                  )}

                  {/* Name (selected language) */}
                  <h3 className="font-semibold text-islamic-dark text-base leading-tight mb-1">
                    {loc(language, item, 'name')}
                  </h3>

                  {/* Description */}
                  {loc(language, item, 'description') && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {loc(language, item, 'description')}
                    </p>
                  )}

                  {/* Classes count */}
                  {item.classes && item.classes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.classes.slice(0, 3).map((cls, idx) => (
                        <Badge key={idx} variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                          {cls}
                        </Badge>
                      ))}
                      {item.classes.length > 3 && (
                        <Badge variant="outline" className="text-[10px] bg-gray-50 text-gray-500">
                          {t('adminDepartments.moreCount', { count: item.classes.length - 3 })}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Footer: Order + Reorder buttons */}
                  <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <GripVertical className="size-3.5 text-muted-foreground/40" />
                      <span className="text-xs text-muted-foreground">{t('common.order')}</span>
                      <Badge variant="outline" className="bg-golden-lighter/50 text-golden border-golden/20 text-xs px-2 py-0">
                        {item.order}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-islamic cursor-pointer disabled:opacity-30"
                        disabled={idx === 0}
                        onClick={() => moveOrder(item, 'up')}
                      >
                        <ChevronUp className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-islamic cursor-pointer disabled:opacity-30"
                        disabled={idx === sortedDepts.length - 1}
                        onClick={() => moveOrder(item, 'down')}
                      >
                        <ChevronDown className="size-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* ========== LIST VIEW ========== */
          <Card className="shadow-sm border-gray-100">
            <CardHeader className="pb-3 bg-gray-50/50 border-b">
              <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <GraduationCap className="size-4" />
                {t('adminDepartments.listTitle')}
                <Badge variant="secondary" className="text-xs ml-auto">
                  {t('adminDepartments.countOnly', { count: departments.length })}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {sortedDepts.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/80 transition-colors group"
                  >
                    {/* Drag handle */}
                    <GripVertical className="size-4 text-muted-foreground/30 shrink-0" />

                    {/* Icon */}
                    <div className="w-10 h-10 rounded-lg bg-islamic-lighter flex items-center justify-center text-islamic shrink-0">
                      {getIconComponent(item.icon, 'size-5')}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-islamic-dark text-sm truncate">{loc(language, item, 'name')}</h4>
                        {item.nameAr && (
                          <span className="text-golden text-xs font-serif" dir="rtl">{item.nameAr}</span>
                        )}
                      </div>
                      {loc(language, item, 'description') && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{loc(language, item, 'description')}</p>
                      )}
                    </div>

                    {/* Order */}
                    <Badge variant="outline" className="bg-golden-lighter/50 text-golden border-golden/20 text-xs shrink-0 hidden sm:flex">
                      {t('common.order')}: {item.order}
                    </Badge>

                    {/* Reorder */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-islamic cursor-pointer disabled:opacity-30"
                        disabled={idx === 0}
                        onClick={() => moveOrder(item, 'up')}
                      >
                        <ChevronUp className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-islamic cursor-pointer disabled:opacity-30"
                        disabled={idx === sortedDepts.length - 1}
                        onClick={() => moveOrder(item, 'down')}
                      >
                        <ChevronDown className="size-3.5" />
                      </Button>
                    </div>

                    {/* Action buttons - always visible */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs border-gray-200 hover:border-islamic/30 hover:text-islamic hover:bg-islamic-lighter/30 cursor-pointer"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil className="size-3" />
                        <span className="hidden sm:inline">{t('common.edit')}</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs border-gray-200 hover:border-red-300 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        onClick={() => setDeleteTarget(item)}
                      >
                        <Trash2 className="size-3" />
                        <span className="hidden sm:inline">{t('common.delete')}</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      ) : (
        /* ========== EMPTY STATE ========== */
        <Card className="shadow-sm border-dashed border-2 border-gray-200">
          <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <div className="w-20 h-20 rounded-full bg-islamic-lighter/50 flex items-center justify-center mb-4">
              <GraduationCap className="size-10 text-islamic/30" />
            </div>
            <p className="text-base font-medium text-islamic-dark/60">{t('adminDepartments.noData')}</p>
            <p className="text-sm mt-1 text-muted-foreground">
              {t('adminDepartments.addHint', { button: t('adminDepartments.addNew') })}
            </p>
            <Button
              onClick={resetAndOpen}
              className="mt-5 bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
            >
              <Plus className="size-4" />
              {t('adminDepartments.addFull')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ========== Create/Edit Dialog ========== */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) { setEditingItem(null); setForm(EMPTY_FORM); }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-islamic-dark flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-islamic/10 flex items-center justify-center">
                {editingItem ? (
                  <Pencil className="size-4 text-islamic" />
                ) : (
                  <Plus className="size-4 text-islamic" />
                )}
              </div>
              {editingItem ? t('adminDepartments.editTitle') : t('adminDepartments.addFull')}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? t('adminDepartments.editDesc', { name: editingItem.name })
                : t('adminDepartments.createDesc')
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Preview */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-muted-foreground mb-2 font-medium">{t('common.preview')}</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-islamic-lighter flex items-center justify-center text-islamic">
                  {getIconComponent(form.icon, 'size-5')}
                </div>
                <div>
                  {form.name.bn && (
                    <p className="font-semibold text-islamic-dark text-sm">{form.name.bn}</p>
                  )}
                  {form.name.ar && (
                    <p className="text-golden text-xs font-serif" dir="rtl">{form.name.ar}</p>
                  )}
                  {!form.name.bn && !form.name.ar && (
                    <p className="text-sm text-muted-foreground/50 italic">{t('adminDepartments.previewHint')}</p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Name (trilingual) */}
            <MLInput
              label={t('common.title')}
              required
              placeholder={t('adminDepartments.namePlaceholder')}
              value={form.name}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
            />

            {/* Description (trilingual) */}
            <MLTextarea
              label={t('common.description')}
              rows={3}
              placeholder={t('adminDepartments.descPlaceholder')}
              value={form.description}
              onChange={(v) => setForm((f) => ({ ...f, description: v }))}
            />

            {/* Icon + Order */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-islamic-dark font-medium">{t('adminDepartments.icon')}</Label>
                <Select
                  value={form.icon}
                  onValueChange={(value) => setForm((f) => ({ ...f, icon: value }))}
                >
                  <SelectTrigger className="w-full border-gray-200">
                    <SelectValue placeholder={t('adminDepartments.iconPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className="flex items-center gap-2">
                          <opt.icon className="size-4" />
                          {t(opt.labelKey)}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dept-order" className="text-islamic-dark font-medium">
                  {t('adminDepartments.orderLabel')}
                </Label>
                <Input
                  id="dept-order"
                  type="number"
                  placeholder={t('adminDepartments.zero')}
                  value={form.order}
                  onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) || 0 }))}
                  className="border-gray-200 focus:border-islamic/40"
                />
                <p className="text-xs text-muted-foreground">{t('adminDepartments.orderHint')}</p>
              </div>
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <Label htmlFor="dept-image" className="text-islamic-dark font-medium flex items-center gap-1.5">
                <ImageIcon className="size-3.5" />
                {t('adminDepartments.imageUrlLabel')}
              </Label>
              <Input
                id="dept-image"
                placeholder="https://example.com/image.jpg"
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                className="border-gray-200 focus:border-islamic/40"
              />
              {form.imageUrl && (
                <div className="mt-2 rounded-lg overflow-hidden border border-gray-100 h-32 bg-gray-50">
                  <img src={form.imageUrl} alt={t('common.preview')} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
            </div>

            {/* Classes Management */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-islamic-dark font-medium">
                  {t('adminDepartments.classesLabel')}
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('adminDepartments.classesHint')}
              </p>
              <div className="flex items-center gap-2">
                <Input
                  placeholder={t('adminDepartments.classNamePlaceholder')}
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addClassName(); } }}
                  className="border-gray-200 focus:border-islamic/40"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addClassName}
                  disabled={!newClassName.trim()}
                  className="gap-1 shrink-0 cursor-pointer border-islamic/30 text-islamic hover:bg-islamic-lighter hover:text-islamic-dark"
                >
                  <Plus className="size-4" />
                  {t('common.add')}
                </Button>
              </div>
              {form.classes && form.classes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.classes.map((cls, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="bg-islamic-lighter text-islamic-dark border border-islamic/20 px-3 py-1.5 text-sm flex items-center gap-1.5"
                    >
                      {cls}
                      <button
                        type="button"
                        onClick={() => removeClassName(idx)}
                        className="hover:text-red-600 cursor-pointer"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => { setDialogOpen(false); setEditingItem(null); setForm(EMPTY_FORM); }}
              className="cursor-pointer"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !form.name.bn.trim()}
              className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer shadow-sm"
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {editingItem ? (
                <>
                  <Pencil className="size-4" />
                  {t('common.update')}
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  {t('common.save')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== Delete Confirmation ========== */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="size-5 text-red-600" />
              </div>
              <AlertDialogTitle className="text-islamic-dark">{t('adminDepartments.deleteTitle')}</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm leading-relaxed">
              <span className="font-semibold text-islamic-dark">&quot;{deleteTarget ? loc(language, deleteTarget, 'name') : ''}&quot;</span>{' '}{t('adminDepartments.deleteDesc')}
              <br />
              <span className="text-red-600 font-medium">{t('common.permanentDeleteWarning')}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="cursor-pointer">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white gap-2 cursor-pointer"
            >
              {deleting && <Loader2 className="size-4 animate-spin" />}
              <Trash2 className="size-4" />
              {t('common.confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
