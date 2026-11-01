'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  FolderOpen,
  FileText,
  Video,
  Image as ImageIcon,
  Music,
  Link2,
  Loader2,
  Layers,
  X,
  Search,
  RotateCcw,
  FileUp,
  AlertTriangle,
  Download,
  BookOpen,
  ClipboardList,
} from 'lucide-react';
import { dbPush, dbUpdate, dbRemove, dbSubscribe, uploadFileToGithub } from '@/lib/db-service';
import { useAppStore } from '@/store/app-store';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import type { StudyMaterial, MaterialVolume } from '@/types/database';
import { useTranslation } from '@/lib/i18n-context';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const FILE_TYPES = ['pdf', 'video', 'audio', 'image', 'document', 'link'] as const;

const FILE_TYPE_LABEL_KEYS: Record<string, string> = {
  pdf: 'adminMaterials.typePdf',
  video: 'adminMaterials.typeVideo',
  audio: 'adminMaterials.typeAudio',
  image: 'adminMaterials.typeImage',
  document: 'adminMaterials.typeDocument',
  link: 'adminMaterials.typeLink',
};

const FILE_TYPE_COLORS: Record<string, string> = {
  pdf: 'bg-danger/10 text-danger border-danger/40',
  video: 'bg-golden-lighter text-golden border-golden/30',
  audio: 'bg-warning/20 text-warning-foreground border-warning/40',
  image: 'bg-primary/10 text-primary border-primary/25',
  document: 'bg-islamic-lighter text-islamic-dark border-islamic/20',
  link: 'bg-warning/20 text-warning-foreground border-warning/40',
};

const MATERIAL_CATEGORIES = [
  'নোট', 'বই', 'হাদীস', 'তাফসীর', 'ফিকহ', 'আকীদাহ',
  'আরবি', 'বাংলা', 'ইংরেজি', 'গণিত', 'বিজ্ঞান',
  'কুরআন', 'হিফজ', 'নামাজ', 'অন্যান্য',
];

/** GitHub contents API practical ceiling enforced client-side */
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

interface MaterialForm {
  title: string;
  description: string;
  category: string;
  department: string;
  class: string;
  fileUrl: string;
  fileType: string;
  hasVolumes: boolean;
  volumes: MaterialVolume[];
}

const EMPTY_VOLUME: MaterialVolume = { volumeTitle: '', fileUrl: '', fileType: 'pdf' };

const EMPTY_FORM: MaterialForm = {
  title: '',
  description: '',
  category: '',
  department: '',
  class: '',
  fileUrl: '',
  fileType: 'pdf',
  hasVolumes: false,
  volumes: [EMPTY_VOLUME],
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getFileIcon(type: string) {
  switch (type) {
    case 'pdf': return <FileText className="size-5 text-danger" />;
    case 'video': return <Video className="size-5 text-golden" />;
    case 'audio': return <Music className="size-5 text-warning" />;
    case 'image': return <ImageIcon className="size-5 text-primary" />;
    case 'document': return <FileText className="size-5 text-islamic" />;
    case 'link': return <Link2 className="size-5 text-warning" />;
    default: return <FileText className="size-5 text-muted-foreground" />;
  }
}

/** Guess the material fileType from the picked file's MIME type / extension */
function detectFileType(file: File): string {
  const name = (file.name || '').toLowerCase();
  const mime = file.type || '';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('image/')) return 'image';
  if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  return 'document';
}

/** Where an uploaded file should land in the form */
type UploadTarget = { kind: 'single' } | { kind: 'volume'; index: number };

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminMaterials() {
  const { departments: storeDepartments, githubConfig, loadGithubConfig } = useAppStore();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  /* Dialog */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StudyMaterial | null>(null);
  const [form, setForm] = useState<MaterialForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  /* Delete */
  const [deleteTarget, setDeleteTarget] = useState<StudyMaterial | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* GitHub upload state */
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [uploadError, setUploadError] = useState(false);
  const [uploadingVolumeIndex, setUploadingVolumeIndex] = useState<number | null>(null);

  const singleFileInputRef = useRef<HTMLInputElement>(null);
  const volumeFileInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const lastUploadRef = useRef<{ file: File; target: UploadTarget } | null>(null);
  const retryUploadRef = useRef<() => void>(() => {});

  /* GitHub config is loaded on demand (admin-only feature) */
  useEffect(() => {
    loadGithubConfig();
  }, [loadGithubConfig]);

  const githubReady = !!(githubConfig?.token && githubConfig?.owner && githubConfig?.repo);
  const uploadBusy = uploading || uploadingVolumeIndex !== null;

  /* Subscribe */
  useEffect(() => {
    const unsub = dbSubscribe('/studyMaterials', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list: StudyMaterial[] = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        }));
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setMaterials(list);
      } else {
        setMaterials([]);
      }
    });
    return () => unsub();
  }, []);

  /* Department list from filter */
  const departments = useMemo(() => {
    // Use canonical departments from store
    if (storeDepartments.length > 0) {
      return storeDepartments.map((d) => d.name).filter(Boolean);
    }
    // Fallback to deriving from materials
    const depts = new Set(materials.map((m) => m.department).filter(Boolean));
    return Array.from(depts);
  }, [storeDepartments, materials]);

  /* Filtered (search + type + category + department) */
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return materials.filter((m) => {
      const matchSearch =
        !q ||
        m.title.toLowerCase().includes(q) ||
        (m.description || '').toLowerCase().includes(q) ||
        (m.class || '').toLowerCase().includes(q);
      const matchType = typeFilter === 'all' || m.fileType === typeFilter;
      const catMatch = categoryFilter === 'all' || m.category === categoryFilter;
      const deptMatch = departmentFilter === 'all' || m.department === departmentFilter;
      return matchSearch && matchType && catMatch && deptMatch;
    });
  }, [materials, searchQuery, typeFilter, categoryFilter, departmentFilter]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    typeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    departmentFilter !== 'all';

  /* Summary */
  const pdfCount = useMemo(() => materials.filter((m) => m.fileType === 'pdf').length, [materials]);
  const videoCount = useMemo(() => materials.filter((m) => m.fileType === 'video').length, [materials]);
  const linkCount = useMemo(() => materials.filter((m) => m.fileType === 'link').length, [materials]);

  /* Handlers */
  const resetAndOpen = useCallback(() => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setUploadError(false);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((item: StudyMaterial) => {
    setEditing(item);
    setForm({
      title: item.title,
      description: item.description || '',
      category: item.category || '',
      department: item.department || '',
      class: item.class || '',
      fileUrl: item.fileUrl || '',
      fileType: item.fileType,
      hasVolumes: !!item.hasVolumes && (item.volumes || []).length > 0,
      volumes: item.volumes && item.volumes.length > 0 ? item.volumes : [EMPTY_VOLUME],
    });
    setUploadError(false);
    setDialogOpen(true);
  }, []);

  /* Volume handlers */
  const addVolume = useCallback(() => {
    setForm((f) => ({ ...f, volumes: [...f.volumes, EMPTY_VOLUME] }));
  }, []);

  const removeVolume = useCallback((index: number) => {
    setForm((f) => {
      if (f.volumes.length <= 1) return f;
      return { ...f, volumes: f.volumes.filter((_, i) => i !== index) };
    });
  }, []);

  const updateVolume = useCallback((index: number, field: keyof MaterialVolume, value: string) => {
    setForm((f) => ({
      ...f,
      volumes: f.volumes.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    }));
  }, []);

  /* ── GitHub upload ─────────────────────────────────────────────── */

  const performUpload = useCallback(
    async (file: File, target: UploadTarget) => {
      if (!githubConfig?.token || !githubConfig?.owner || !githubConfig?.repo) {
        toast({ title: t('common.error'), description: t('adminMaterials.uploadHintNoToken'), variant: 'destructive' });
        return;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        toast({ title: t('common.error'), description: t('adminMaterials.fileTooLarge'), variant: 'destructive' });
        return;
      }

      lastUploadRef.current = { file, target };
      setUploadError(false);
      if (target.kind === 'single') {
        setUploading(true);
        setUploadProgress(t('adminMaterials.uploadingFile'));
      } else {
        setUploadingVolumeIndex(target.index);
      }

      try {
        const url = await uploadFileToGithub(file, {
          token: githubConfig.token,
          owner: githubConfig.owner,
          repo: githubConfig.repo,
          branch: githubConfig.branch || 'main',
        });
        const detected = detectFileType(file);
        if (target.kind === 'single') {
          setForm((f) => ({ ...f, fileUrl: url, fileType: detected }));
        } else {
          setForm((f) => ({
            ...f,
            volumes: f.volumes.map((v, i) =>
              i === target.index ? { ...v, fileUrl: url, fileType: detected } : v
            ),
          }));
        }
        lastUploadRef.current = null;
        setUploadError(false);
        toast({ title: t('common.success'), description: t('adminMaterials.fileUploaded') });
      } catch (err) {
        setUploadError(true);
        toast({
          title: t('adminMaterials.uploadFailedTitle'),
          description: err instanceof Error ? err.message : t('common.operationFailed'),
          variant: 'destructive',
          action: (
            <ToastAction altText={t('adminMaterials.retryUpload')} onClick={() => retryUploadRef.current()}>
              {t('adminMaterials.retryUpload')}
            </ToastAction>
          ),
        });
      } finally {
        setUploading(false);
        setUploadProgress('');
        setUploadingVolumeIndex(null);
        if (singleFileInputRef.current) singleFileInputRef.current.value = '';
        volumeFileInputRefs.current.forEach((el) => {
          if (el) el.value = '';
        });
      }
    },
    [githubConfig, toast, t]
  );

  const retryLastUpload = useCallback(() => {
    const last = lastUploadRef.current;
    if (!last) {
      setUploadError(false);
      return;
    }
    void performUpload(last.file, last.target);
  }, [performUpload]);

  /* Avoid a circular ref between performUpload and its retry action */
  useEffect(() => {
    retryUploadRef.current = retryLastUpload;
  }, [retryLastUpload]);

  const handleSingleFileClick = useCallback(() => {
    singleFileInputRef.current?.click();
  }, []);

  const handleSingleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void performUpload(file, { kind: 'single' });
      e.target.value = '';
    },
    [performUpload]
  );

  const handleVolumeFileChange = useCallback(
    (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void performUpload(file, { kind: 'volume', index });
      e.target.value = '';
    },
    [performUpload]
  );

  /* ── Reset download counter ────────────────────────────────────── */

  const handleResetDownloads = useCallback(
    async (item: StudyMaterial) => {
      try {
        await dbUpdate('/studyMaterials/' + item.id, { downloadCount: 0 });
        toast({ title: t('common.success'), description: t('adminMaterials.downloadsReset') });
      } catch {
        toast({ title: t('common.error'), description: t('common.operationFailed'), variant: 'destructive' });
      }
    },
    [toast, t]
  );

  /* ── Submit ────────────────────────────────────────────────────── */

  const handleSubmit = async () => {
    if (uploadBusy) {
      toast({ title: t('common.error'), description: t('adminMaterials.uploadPendingWarning'), variant: 'destructive' });
      return;
    }

    if (!form.title.trim()) {
      toast({ title: t('common.error'), description: t('adminMaterials.titleRequired'), variant: 'destructive' });
      return;
    }

    if (form.hasVolumes) {
      const validVolumes = form.volumes.filter((v) => v.volumeTitle.trim() && v.fileUrl.trim());
      if (validVolumes.length === 0) {
        toast({ title: t('common.error'), description: t('adminMaterials.volumeRequired'), variant: 'destructive' });
        return;
      }
    } else if (!form.fileUrl.trim()) {
      toast({ title: t('common.error'), description: t('adminMaterials.fileUrlRequired'), variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const volumes = form.hasVolumes
        ? form.volumes.filter((v) => v.volumeTitle.trim() && v.fileUrl.trim())
        : [];

      const payload: Record<string, any> = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        department: form.department.trim(),
        class: form.class.trim(),
        fileUrl: form.hasVolumes ? '' : form.fileUrl.trim(),
        fileType: form.hasVolumes ? (volumes[0]?.fileType || 'pdf') : form.fileType,
        addedBy: 'admin',
        hasVolumes: form.hasVolumes,
        volumes: form.hasVolumes ? volumes : [],
      };

      if (editing) {
        await dbUpdate('/studyMaterials/' + editing.id, payload);
        toast({ title: t('common.success'), description: t('adminMaterials.materialUpdated') });
      } else {
        await dbPush('/studyMaterials', { ...payload, downloadCount: 0, createdAt: Date.now() });
        toast({ title: t('common.success'), description: t('adminMaterials.materialCreated') });
      }
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      setEditing(null);
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
      await dbRemove('/studyMaterials/' + deleteTarget.id);
      toast({ title: t('common.success'), description: t('adminMaterials.materialDeleted') });
      setDeleteTarget(null);
    } catch {
      toast({ title: t('common.error'), description: t('common.deleteFailed'), variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const summaryItems = [
    { value: materials.length, label: t('adminMaterials.total'), icon: BookOpen, valueCls: 'text-islamic-dark', iconBg: 'bg-islamic-lighter text-islamic' },
    { value: pdfCount, label: t('adminMaterials.typePdf'), icon: FileText, valueCls: 'text-danger', iconBg: 'bg-danger/10 text-danger' },
    { value: videoCount, label: t('adminMaterials.typeVideo'), icon: Video, valueCls: 'text-golden', iconBg: 'bg-golden-lighter text-golden' },
    { value: linkCount, label: t('adminMaterials.typeLink'), icon: Link2, valueCls: 'text-warning-foreground', iconBg: 'bg-warning/20 text-warning-foreground' },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-islamic-dark">{t('adminMaterials.title')}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t('adminMaterials.subtitle')}
          </p>
        </div>
        <Button onClick={resetAndOpen} className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer">
          <Plus className="size-4" />
          {t('adminMaterials.addNew')}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summaryItems.map((item) => (
          <Card key={item.label} className="shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <span className={`inline-flex size-10 shrink-0 items-center justify-center rounded-xl ${item.iconBg}`}>
                <item.icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className={`text-xl font-bold leading-tight ${item.valueCls}`}>{item.value}</p>
                <p className="truncate text-xs text-muted-foreground">{item.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Type/Department filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('adminMaterials.searchPlaceholder')}
            aria-label={t('adminMaterials.searchPlaceholder')}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="hidden text-sm text-muted-foreground sm:inline">{t('adminMaterials.filterType')}</span>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-36" aria-label={t('adminMaterials.filterType')}>
              <SelectValue placeholder={t('adminMaterials.filterType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('adminMaterials.all')}</SelectItem>
              {FILE_TYPES.map((type) => (
                <SelectItem key={type} value={type}>{t(FILE_TYPE_LABEL_KEYS[type] || type)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {departments.length > 0 && (
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full sm:w-40" aria-label={t('adminMaterials.filterDepartment')}>
                <SelectValue placeholder={t('adminMaterials.all')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('adminMaterials.all')}</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">{t('adminMaterials.filterCategory')}</span>
        <Button size="sm" variant={categoryFilter === 'all' ? 'default' : 'outline'} onClick={() => setCategoryFilter('all')} className={`text-xs cursor-pointer ${categoryFilter === 'all' ? 'bg-islamic hover:bg-islamic-light text-white' : ''}`}>{t('adminMaterials.all')}</Button>
        {MATERIAL_CATEGORIES.map((cat) => (
          <Button key={cat} size="sm" variant={categoryFilter === cat ? 'default' : 'outline'} onClick={() => setCategoryFilter(cat)} className={`text-xs cursor-pointer ${categoryFilter === cat ? 'bg-islamic hover:bg-islamic-light text-white' : ''}`}>
            {cat}
          </Button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {t('adminMaterials.resultsCount', { count: filtered.length })}
      </p>

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
                      <TableHead className="text-xs font-semibold text-muted-foreground">{t('common.title')}</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">{t('common.type')}</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminMaterials.thCategory')}</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminMaterials.thDepartment')}</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminMaterials.thClass')}</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground text-center">{t('adminMaterials.thVolumes')}</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground text-center">{t('common.download')}</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground text-right">{t('common.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-tertiary/60">
                              {getFileIcon(item.fileType)}
                            </span>
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-islamic-dark truncate max-w-48">{item.title}</p>
                              {item.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1 max-w-48">{item.description}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge className={`text-xs ${FILE_TYPE_COLORS[item.fileType] || ''}`}>
                            {t(FILE_TYPE_LABEL_KEYS[item.fileType] || item.fileType)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm py-3 text-muted-foreground">{item.category || '—'}</TableCell>
                        <TableCell className="text-sm py-3 text-muted-foreground">{item.department || '—'}</TableCell>
                        <TableCell className="text-sm py-3 text-muted-foreground">{item.class || '—'}</TableCell>
                        <TableCell className="py-3 text-center">
                          {item.hasVolumes && item.volumes && item.volumes.length > 0 ? (
                            <Badge className="bg-primary/10 text-primary border-primary/25 text-xs gap-1">
                              <Layers className="size-3" />
                              {t('adminMaterials.volumeCount', { count: item.volumes.length })}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          <div className="inline-flex items-center justify-center gap-0.5">
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Download className="size-3" />
                              {item.downloadCount || 0}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-muted-foreground hover:text-golden cursor-pointer"
                              onClick={() => handleResetDownloads(item)}
                              title={t('adminMaterials.resetDownloads')}
                              aria-label={t('adminMaterials.resetDownloads')}
                            >
                              <RotateCcw className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-islamic cursor-pointer" onClick={() => openEdit(item)} aria-label={t('common.edit')}>
                              <Pencil className="size-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-danger cursor-pointer" onClick={() => setDeleteTarget(item)} aria-label={t('common.delete')}>
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:hidden">
            {filtered.map((item) => (
              <Card key={item.id} className="shadow-sm border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-1 items-start gap-2.5">
                      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-tertiary/60">
                        {getFileIcon(item.fileType)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-islamic-dark line-clamp-2">{item.title}</p>
                        {item.description && (
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <Badge className={`text-[10px] ${FILE_TYPE_COLORS[item.fileType] || ''}`}>
                      {t(FILE_TYPE_LABEL_KEYS[item.fileType] || item.fileType)}
                    </Badge>
                    {item.category && (
                      <span className="inline-flex items-center rounded-full bg-islamic-lighter px-2 py-0.5 text-[10px] font-medium text-islamic-dark">
                        {item.category}
                      </span>
                    )}
                    {item.department && (
                      <span className="inline-flex items-center rounded-full bg-surface-tertiary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {item.department}
                      </span>
                    )}
                    {item.class && (
                      <span className="inline-flex items-center rounded-full bg-surface-tertiary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {item.class}
                      </span>
                    )}
                    {item.hasVolumes && item.volumes && item.volumes.length > 0 && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        <Layers className="size-2.5" />
                        {t('adminMaterials.volumeCount', { count: item.volumes.length })}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5">
                    <Badge variant="secondary" className="text-[11px] gap-1">
                      <Download className="size-3" />
                      {t('adminMaterials.downloadCount', { count: item.downloadCount || 0 })}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-9 text-muted-foreground hover:text-golden cursor-pointer"
                        onClick={() => handleResetDownloads(item)}
                        aria-label={t('adminMaterials.resetDownloads')}
                      >
                        <RotateCcw className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-9 text-muted-foreground hover:text-islamic cursor-pointer" onClick={() => openEdit(item)} aria-label={t('common.edit')}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-9 text-muted-foreground hover:text-danger cursor-pointer" onClick={() => setDeleteTarget(item)} aria-label={t('common.delete')}>
                        <Trash2 className="size-4" />
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
            <div className="flex flex-col items-center justify-center py-16">
              <span className="mb-4 inline-flex size-16 items-center justify-center rounded-full bg-islamic-lighter/70 ring-1 ring-islamic/15">
                {hasActiveFilters ? (
                  <Search className="size-8 text-islamic/70" aria-hidden="true" />
                ) : (
                  <FolderOpen className="size-8 text-islamic/70" aria-hidden="true" />
                )}
              </span>
              <p className="text-sm font-medium text-islamic-dark">
                {hasActiveFilters ? t('adminMaterials.noMatchFiltered') : t('adminMaterials.noMaterials')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) { setEditing(null); setForm(EMPTY_FORM); setUploadError(false); }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-islamic-dark">
              {editing ? t('adminMaterials.editTitle') : t('adminMaterials.addNew')}
            </DialogTitle>
            <DialogDescription>
              {editing ? t('adminMaterials.editDesc') : t('adminMaterials.addDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* ── Section: Basic info ── */}
            <section className="space-y-4 rounded-xl border border-border/70 bg-surface-tertiary/20 p-4">
              <header className="flex items-center gap-2">
                <span className="inline-flex size-7 items-center justify-center rounded-lg bg-islamic-lighter text-islamic">
                  <ClipboardList className="size-3.5" aria-hidden="true" />
                </span>
                <h4 className="text-sm font-semibold text-islamic-dark">{t('adminMaterials.sectionBasic')}</h4>
              </header>
              <div className="space-y-2">
                <Label htmlFor="mat-title">{t('adminMaterials.labelTitle')}</Label>
                <Input id="mat-title" placeholder={t('adminMaterials.phTitle')} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mat-desc">{t('common.description')}</Label>
                <Textarea id="mat-desc" placeholder={t('adminMaterials.phDescription')} rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('adminMaterials.labelCategory')}</Label>
                  <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue placeholder={t('adminMaterials.phSelectCategory')} /></SelectTrigger>
                    <SelectContent>
                      {MATERIAL_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mat-dept">{t('adminMaterials.thDepartment')}</Label>
                  <Select
                    value={form.department}
                    onValueChange={(value) => {
                      setForm((f) => ({ ...f, department: value, class: '' }));
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('adminMaterials.phSelectDepartment')} />
                    </SelectTrigger>
                    <SelectContent>
                      {storeDepartments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.name}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mat-class">{t('adminMaterials.thClass')}</Label>
                {form.department ? (() => {
                  const selectedDept = storeDepartments.find(d => d.name === form.department);
                  const deptClasses = selectedDept?.classes || [];
                  if (deptClasses.length > 0) {
                    return (
                      <Select
                        value={form.class}
                        onValueChange={(value) => setForm((f) => ({ ...f, class: value }))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t('adminMaterials.phSelectClass')} />
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
                      placeholder={t('adminMaterials.noClassesInDept')}
                      value={form.class}
                      onChange={(e) => setForm((f) => ({ ...f, class: e.target.value }))}
                      disabled={!form.department}
                    />
                  );
                })() : (
                  <Input
                    placeholder={t('adminMaterials.selectDeptFirst')}
                    value={form.class}
                    onChange={(e) => setForm((f) => ({ ...f, class: e.target.value }))}
                    disabled
                  />
                )}
              </div>
            </section>

            {/* ── Section: File & link ── */}
            <section className="space-y-4 rounded-xl border border-border/70 bg-surface-tertiary/20 p-4">
              <header className="flex items-center gap-2">
                <span className="inline-flex size-7 items-center justify-center rounded-lg bg-islamic-lighter text-islamic">
                  <FileUp className="size-3.5" aria-hidden="true" />
                </span>
                <h4 className="text-sm font-semibold text-islamic-dark">{t('adminMaterials.sectionFile')}</h4>
              </header>

              {/* Volumes Toggle */}
              <div className="flex items-center justify-between rounded-lg border p-3 bg-islamic-lighter/30">
                <div>
                  <Label htmlFor="has-volumes" className="cursor-pointer font-medium flex items-center gap-2">
                    <Layers className="size-4 text-islamic" />
                    {t('adminMaterials.volumesToggle')}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t('adminMaterials.volumesToggleHint')}
                  </p>
                </div>
                <Switch
                  id="has-volumes"
                  checked={form.hasVolumes}
                  onCheckedChange={(checked) => {
                    if (checked && form.volumes.length === 0) {
                      setForm((f) => ({ ...f, hasVolumes: true, volumes: [EMPTY_VOLUME] }));
                    } else {
                      setForm((f) => ({ ...f, hasVolumes: checked }));
                    }
                  }}
                />
              </div>

              {/* Single File (when volumes is OFF) */}
              {!form.hasVolumes && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('adminMaterials.labelFileType')}</Label>
                      <Select value={form.fileType} onValueChange={(v) => setForm((f) => ({ ...f, fileType: v }))}>
                        <SelectTrigger><SelectValue placeholder={t('adminMaterials.phSelectType')} /></SelectTrigger>
                        <SelectContent>
                          {FILE_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>{t(FILE_TYPE_LABEL_KEYS[type] || type)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mat-url">{t('adminMaterials.labelFileUrl')}</Label>
                      <Input id="mat-url" placeholder={t('adminMaterials.phFileUrl')} value={form.fileUrl} onChange={(e) => setForm((f) => ({ ...f, fileUrl: e.target.value }))} />
                      <p className="text-[11px] text-muted-foreground">{t('adminMaterials.orPasteUrl')}</p>
                    </div>
                  </div>

                  {/* GitHub upload */}
                  {githubReady ? (
                    <div className="space-y-2">
                      <input ref={singleFileInputRef} type="file" className="hidden" aria-label={t('adminMaterials.uploadFromGithub')} disabled={uploadBusy || submitting} onChange={handleSingleFileChange} />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSingleFileClick}
                        disabled={uploadBusy || submitting}
                        className="h-auto w-full border-dashed py-3 flex-col gap-1.5 cursor-pointer text-muted-foreground hover:text-islamic hover:border-islamic"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="size-5 animate-spin text-islamic" />
                            <span className="text-xs font-medium">{uploadProgress || t('adminMaterials.uploadingFile')}</span>
                          </>
                        ) : (
                          <>
                            <FileUp className="size-5 text-islamic" />
                            <span className="text-xs font-medium">
                              {t('adminMaterials.uploadFromGithub')}
                              <span className="font-normal text-muted-foreground"> · {t('adminMaterials.uploadSizeHint')}</span>
                            </span>
                          </>
                        )}
                      </Button>
                      <p className="text-[11px] text-muted-foreground">{t('adminMaterials.autoTypeHint')}</p>
                      {uploadError && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => retryUploadRef.current()}
                          className="h-9 gap-1.5 border-danger/40 bg-danger/10 text-xs text-danger hover:bg-danger/20 hover:text-danger cursor-pointer"
                        >
                          <RotateCcw className="size-3.5" />
                          {t('adminMaterials.retryUpload')}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3" role="status">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-foreground" aria-hidden="true" />
                      <p className="text-xs text-warning-foreground">{t('adminMaterials.uploadHintNoToken')}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Volumes Section (when volumes is ON) */}
              {form.hasVolumes && (
                <div className="space-y-3 border rounded-lg p-4 bg-surface-tertiary/30">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-sm font-semibold text-islamic-dark flex items-center gap-2">
                      <Layers className="size-4" />
                      {t('adminMaterials.volumesList', { count: form.volumes.length })}
                    </Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addVolume}
                      className="gap-1 text-xs cursor-pointer text-islamic hover:text-islamic-dark"
                    >
                      <Plus className="size-3.5" />
                      {t('adminMaterials.addVolume')}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('adminMaterials.volumesHint')}
                  </p>

                  {form.volumes.map((volume, index) => (
                    <div key={index} className="relative border rounded-lg p-3 bg-background space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-islamic">
                          <span className="inline-flex size-6 items-center justify-center rounded-full bg-islamic-lighter text-[11px] font-bold text-islamic-dark">
                            {index + 1}
                          </span>
                          {t('adminMaterials.volumeLabel', { index: index + 1 })}
                        </span>
                        {form.volumes.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-danger cursor-pointer"
                            onClick={() => removeVolume(index)}
                            aria-label={t('common.delete')}
                          >
                            <X className="size-4" />
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Input
                          placeholder={t('adminMaterials.phVolumeTitle')}
                          value={volume.volumeTitle}
                          onChange={(e) => updateVolume(index, 'volumeTitle', e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Select
                            value={volume.fileType}
                            onValueChange={(v) => updateVolume(index, 'fileType', v)}
                          >
                            <SelectTrigger><SelectValue placeholder={t('common.type')} /></SelectTrigger>
                            <SelectContent>
                              {FILE_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>{t(FILE_TYPE_LABEL_KEYS[type] || type)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder={t('adminMaterials.labelFileUrl')}
                              value={volume.fileUrl}
                              onChange={(e) => updateVolume(index, 'fileUrl', e.target.value)}
                            />
                            {githubReady && (
                              <>
                                <input
                                  type="file"
                                  className="hidden"
                                  aria-label={t('adminMaterials.volumeUploadAria')}
                                  disabled={uploadBusy || submitting}
                                  ref={(el) => { volumeFileInputRefs.current[index] = el; }}
                                  onChange={(e) => handleVolumeFileChange(index, e)}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  disabled={uploadBusy || submitting}
                                  onClick={() => volumeFileInputRefs.current[index]?.click()}
                                  className="size-10 shrink-0 cursor-pointer text-muted-foreground hover:text-islamic hover:border-islamic/50"
                                  title={t('adminMaterials.volumeUploadAria')}
                                  aria-label={t('adminMaterials.volumeUploadAria')}
                                >
                                  {uploadingVolumeIndex === index ? (
                                    <Loader2 className="size-4 animate-spin text-islamic" />
                                  ) : (
                                    <FileUp className="size-4" />
                                  )}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); setEditing(null); setForm(EMPTY_FORM); }}>{t('common.cancel')}</Button>
            <Button onClick={handleSubmit} disabled={submitting || uploadBusy} className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer">
              {(submitting || uploadBusy) && <Loader2 className="size-4 animate-spin" />}
              {uploadBusy ? t('adminMaterials.uploadingFile') : editing ? t('adminMaterials.updateBtn') : t('adminMaterials.saveBtn')}
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
              {t('adminMaterials.deleteDesc', { title: deleteTarget?.title || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-danger hover:bg-danger/90 text-white gap-2 cursor-pointer">
              {deleting && <Loader2 className="size-4 animate-spin" />}
              {t('common.confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
