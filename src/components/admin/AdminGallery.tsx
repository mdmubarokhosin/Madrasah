'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Plus, Pencil, Trash2, Camera, Loader2, Upload, AlertTriangle, Image as ImageIcon, Video, Play } from 'lucide-react';
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
  mediaType: 'image' as 'image' | 'video',
  imageUrl: '',
  videoUrl: '',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminGallery() {
  const { gallery, githubConfig, loadGithubConfig } = useAppStore();

  /* Fetch GitHub config on demand (removed from the global visitor subscription) */
  useEffect(() => {
    loadGithubConfig();
  }, [loadGithubConfig]);
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
      mediaType: item.mediaType === 'video' || item.videoUrl ? 'video' : 'image',
      imageUrl: item.imageUrl || '',
      videoUrl: item.videoUrl || '',
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

    // Validate file type (image or video)
    const isVideo = file.type.startsWith('video/');
    if (!file.type.startsWith('image/') && !isVideo) {
      toast({ title: t('common.error'), description: t('adminGallery.imageOnly'), variant: 'destructive' });
      return;
    }

    // Validate file size (max 5MB image / 20MB video — GitHub contents API limit)
    const maxSize = isVideo ? 20 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ title: t('common.error'), description: isVideo ? t('adminGallery.videoSizeMax') : t('adminGallery.fileSizeMax'), variant: 'destructive' });
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
      if (isVideo) {
        setForm((f) => ({ ...f, mediaType: 'video', videoUrl: url }));
      } else {
        setForm((f) => ({ ...f, mediaType: 'image', imageUrl: url }));
      }
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
    const isVideo = form.mediaType === 'video' && !!form.videoUrl;
    const isImage = form.mediaType === 'image' && !!form.imageUrl;
    if (!form.title.bn.trim() || !form.category || (!isVideo && !isImage)) {
      toast({ title: t('common.error'), description: t('adminGallery.requiredFields'), variant: 'destructive' });
      return;
    }

    const mediaPayload = isVideo
      ? { mediaType: 'video', imageUrl: '', videoUrl: form.videoUrl }
      : { mediaType: 'image', imageUrl: form.imageUrl, videoUrl: '' };

    setSubmitting(true);
    try {
      if (editingItem) {
        await dbUpdate('/gallery/' + editingItem.id, {
          title: form.title.bn.trim(),
          titleEn: form.title.en.trim(),
          titleAr: form.title.ar.trim(),
          category: form.category,
          ...mediaPayload,
        });
        toast({ title: t('common.success'), description: t('adminGallery.updated') });
      } else {
        await dbPush('/gallery', {
          title: form.title.bn.trim(),
          titleEn: form.title.en.trim(),
          titleAr: form.title.ar.trim(),
          category: form.category,
          ...mediaPayload,
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
        <Card className="border-warning/40 bg-warning/15">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="size-5 text-warning-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-warning-foreground">
                {t('admission.githubNotConfigured')}
              </p>
              <p className="text-xs text-warning-foreground mt-1">
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
              <div className="relative aspect-square bg-surface-tertiary overflow-hidden">
                {item.mediaType === 'video' || item.videoUrl ? (
                  <>
                    <video
                      src={item.videoUrl}
                      muted
                      loop
                      autoPlay
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 bg-accent/85 rounded-full p-1.5">
                      <Play className="size-3 text-accent-foreground fill-accent-foreground" />
                    </div>
                  </>
                ) : item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="size-10 text-muted-foreground/50" />
                  </div>
                )}
                {/* Overlay actions */}
                <div className="absolute inset-0 bg-accent/0 group-hover:bg-accent/35 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
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
                    className="size-9 bg-white/90 hover:bg-white text-danger cursor-pointer"
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

            {/* Media Type */}
            <div className="space-y-2">
              <Label>{t('adminGallery.mediaType')} *</Label>
              <Select
                value={form.mediaType}
                onValueChange={(value) => setForm((f) => ({ ...f, mediaType: value as 'image' | 'video' }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('adminGallery.mediaType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image" className="gap-2">
                    <ImageIcon className="size-4" /> {t('adminGallery.typeImage')}
                  </SelectItem>
                  <SelectItem value="video" className="gap-2">
                    <Video className="size-4" /> {t('adminGallery.typeVideo')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Media Upload Section (image or video) */}
            <div className="space-y-2">
              <Label>{form.mediaType === 'video' ? t('adminGallery.typeVideo') : t('common.image')} *</Label>
              {form.mediaType === 'video' && form.videoUrl ? (
                <div className="relative rounded-lg overflow-hidden border bg-surface-tertiary">
                  <video
                    src={form.videoUrl}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full h-48 bg-surface-secondary"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white text-islamic-dark gap-1.5 cursor-pointer text-xs"
                    onClick={() => setForm((f) => ({ ...f, videoUrl: '' }))}
                  >
                    <Trash2 className="size-3" />
                    {t('adminGallery.removeImage')}
                  </Button>
                </div>
              ) : form.mediaType === 'image' && form.imageUrl ? (
                <div className="relative rounded-lg overflow-hidden border bg-surface-tertiary">
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
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
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
                        {form.mediaType === 'video' ? <Video className="size-6" /> : <Upload className="size-6" />}
                        <span className="text-xs">
                          {!isGithubReady ? t('adminGallery.setGithubKey') : t('adminGallery.uploadClickHint')}
                        </span>
                      </>
                    )}
                  </Button>
                  <Input
                    dir="ltr"
                    placeholder={t('adminGallery.mediaUrlPlaceholder')}
                    value={form.mediaType === 'video' ? form.videoUrl : form.imageUrl}
                    onChange={(e) => setForm((f) => f.mediaType === 'video' ? { ...f, videoUrl: e.target.value } : { ...f, imageUrl: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">{t('adminGallery.mediaUrlHint')}</p>
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
