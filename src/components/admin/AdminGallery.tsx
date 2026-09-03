'use client';

import { useState, useCallback, useRef } from 'react';
import { Plus, Pencil, Trash2, Camera, Loader2, Upload, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { dbPush, dbUpdate, dbRemove, uploadFileToGithub } from '@/lib/db-service';
import { toML, loc, type MLValue } from '@/lib/multilingual';
import { MLInput } from '@/components/admin/MLFields';
import type { GalleryItem } from '@/types/database';
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

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/* Values are stored in Firebase as-is; labels are translated at render time. */
const CATEGORY_OPTIONS = [
  { value: 'বার্ষিক মাহফিল', labelKey: 'adminGallery.catAnnualMahfil' },
  { value: 'ক্লাস', labelKey: 'adminGallery.catClass' },
  { value: 'অনুষ্ঠান', labelKey: 'adminGallery.catProgram' },
];

const EMPTY_FORM = {
  title: { bn: '', en: '', ar: '' } as MLValue,
  category: '',
  imageUrl: '',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminGallery() {
  const { gallery, githubConfig } = useAppStore();
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Dialog state */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  /* Delete confirmation */
  const [deleteTarget, setDeleteTarget] = useState<GalleryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* Check GitHub config */
  const isGithubReady = githubConfig && githubConfig.token && githubConfig.owner && githubConfig.repo;

  /* Helpers */
  const resetAndOpen = useCallback(() => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((item: GalleryItem) => {
    setEditingItem(item);
    setForm({
      title: toML(item, 'title'),
      category: item.category,
      imageUrl: item.imageUrl,
    });
    setDialogOpen(true);
  }, []);

  /* Upload handler */
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isGithubReady) {
      toast({
        title: t('common.error'),
        description: t('admission.githubNotConfigured'),
        variant: 'destructive',
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: t('common.error'), description: t('adminGallery.imageOnly'), variant: 'destructive' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: t('common.error'), description: t('adminGallery.fileSizeMax'), variant: 'destructive' });
      return;
    }

    setUploading(true);
    setUploadProgress(t('common.uploading'));

    try {
      const url = await uploadFileToGithub(file, {
        token: githubConfig.token,
        owner: githubConfig.owner,
        repo: githubConfig.repo,
        branch: githubConfig.branch,
      });
      setForm((f) => ({ ...f, imageUrl: url }));
      setUploadProgress('');
      toast({ title: t('common.success'), description: t('adminGallery.imageUploaded') });
    } catch (err) {
      setUploadProgress('');
      toast({
        title: t('adminGallery.uploadFailedTitle'),
        description: err instanceof Error ? err.message : t('admission.imageUploadFailed'),
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /* Submit handler */
  const handleSubmit = async () => {
    if (!form.title.bn.trim() || !form.category || !form.imageUrl) {
      toast({ title: t('common.error'), description: t('adminGallery.requiredFields'), variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      if (editingItem) {
        await dbUpdate('/gallery/' + editingItem.id, {
          title: form.title.bn.trim(),
          titleEn: form.title.en.trim(),
          titleAr: form.title.ar.trim(),
          category: form.category,
          imageUrl: form.imageUrl,
        });
        toast({ title: t('common.success'), description: t('adminGallery.updated') });
      } else {
        await dbPush('/gallery', {
          title: form.title.bn.trim(),
          titleEn: form.title.en.trim(),
          titleAr: form.title.ar.trim(),
          category: form.category,
          imageUrl: form.imageUrl,
          createdAt: Date.now(),
        });
        toast({ title: t('common.success'), description: t('adminGallery.created') });
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
      await dbRemove('/gallery/' + deleteTarget.id);
      toast({ title: t('common.success'), description: t('adminGallery.deleted') });
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
          <h2 className="text-2xl font-bold text-islamic-dark">{t('admin.gallery')}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t('adminGallery.count', { count: gallery.length })}
          </p>
        </div>
        <Button
          onClick={resetAndOpen}
          className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
        >
          <Plus className="size-4" />
          {t('adminGallery.addNew')}
        </Button>
      </div>

      {/* GitHub Config Warning */}
      {!isGithubReady && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                {t('admission.githubNotConfigured')}
              </p>
              <p className="text-xs text-amber-600 mt-1">
                {t('adminGallery.githubRequiredHint')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid View */}
      {gallery.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {gallery.map((item) => (
            <Card key={item.id} className="overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
              {/* Thumbnail */}
              <div className="relative aspect-square bg-gray-100 overflow-hidden">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="size-10 text-gray-300" />
                  </div>
                )}
                {/* Overlay actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="size-9 bg-white/90 hover:bg-white text-islamic-dark cursor-pointer"
                    onClick={() => openEdit(item)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="size-9 bg-white/90 hover:bg-white text-red-600 cursor-pointer"
                    onClick={() => setDeleteTarget(item)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              {/* Info */}
              <div className="p-3">
                <p className="text-sm font-medium text-islamic-dark truncate">{loc(language, item, 'title')}</p>
                <Badge variant="outline" className="mt-1.5 text-xs bg-islamic-lighter text-islamic-dark border-islamic/20">
                  {item.category}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Camera className="size-12 opacity-20 mb-3" />
            <p className="text-sm">{t('adminGallery.noData')}</p>
            <p className="text-xs mt-1">{t('adminGallery.noDataHint')}</p>
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
              {editingItem ? t('adminGallery.editTitle') : t('adminGallery.addNew')}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? t('adminGallery.editDesc') : t('adminGallery.addDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <MLInput
              label={t('common.title')}
              required
              placeholder={t('adminGallery.titlePlaceholder')}
              value={form.title}
              onChange={(v) => setForm((f) => ({ ...f, title: v }))}
            />

            <div className="space-y-2">
              <Label>{t('common.category')} *</Label>
              <Select
                value={form.category}
                onValueChange={(value) => setForm((f) => ({ ...f, category: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('adminGallery.selectCategory')} />
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

            {/* Image Upload Section */}
            <div className="space-y-2">
              <Label>{t('common.image')} *</Label>
              {form.imageUrl ? (
                <div className="relative rounded-lg overflow-hidden border bg-gray-50">
                  <img
                    src={form.imageUrl}
                    alt={t('common.preview')}
                    className="w-full h-48 object-cover"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white text-islamic-dark gap-1.5 cursor-pointer text-xs"
                    onClick={() => setForm((f) => ({ ...f, imageUrl: '' }))}
                  >
                    <Trash2 className="size-3" />
                    {t('adminGallery.removeImage')}
                  </Button>
                </div>
              ) : (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Button
                    variant="outline"
                    className="w-full h-24 border-dashed flex-col gap-2 cursor-pointer text-muted-foreground hover:text-islamic hover:border-islamic"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || !isGithubReady}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="size-6 animate-spin text-islamic" />
                        <span className="text-xs">{uploadProgress || t('common.uploading')}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="size-6" />
                        <span className="text-xs">
                          {!isGithubReady ? t('adminGallery.setGithubKey') : t('adminGallery.uploadClickHint')}
                        </span>
                      </>
                    )}
                  </Button>
                </div>
              )}
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
              disabled={submitting || uploading}
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
              {t('adminGallery.deleteDesc', { title: deleteTarget?.title ?? '' })}
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
