'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, FolderOpen, FileText, Video, Image, Music, Link2, Loader2, Layers, X } from 'lucide-react';
import { dbPush, dbUpdate, dbRemove, dbSubscribe } from '@/lib/db-service';
import { useAppStore } from '@/store/app-store';
import { useToast } from '@/hooks/use-toast';
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
  pdf: 'bg-red-100 text-red-700 border-red-200',
  video: 'bg-purple-100 text-purple-700 border-purple-200',
  audio: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  image: 'bg-green-100 text-green-700 border-green-200',
  document: 'bg-blue-100 text-blue-700 border-blue-200',
  link: 'bg-orange-100 text-orange-700 border-orange-200',
};

const MATERIAL_CATEGORIES = [
  'নোট', 'বই', 'হাদীস', 'তাফসীর', 'ফিকহ', 'আকীদাহ',
  'আরবি', 'বাংলা', 'ইংরেজি', 'গণিত', 'বিজ্ঞান',
  'কুরআন', 'হিফজ', 'নামাজ', 'অন্যান্য',
];

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
/*  Helper                                                             */
/* ------------------------------------------------------------------ */

function getFileIcon(type: string) {
  switch (type) {
    case 'pdf': return <FileText className="size-5 text-red-500" />;
    case 'video': return <Video className="size-5 text-purple-500" />;
    case 'audio': return <Music className="size-5 text-yellow-500" />;
    case 'image': return <Image className="size-5 text-green-500" />;
    case 'document': return <FileText className="size-5 text-blue-500" />;
    case 'link': return <Link2 className="size-5 text-orange-500" />;
    default: return <FileText className="size-5 text-gray-500" />;
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminMaterials() {
  const { departments: storeDepartments } = useAppStore();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  /* Dialog */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StudyMaterial | null>(null);
  const [form, setForm] = useState<MaterialForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  /* Delete */
  const [deleteTarget, setDeleteTarget] = useState<StudyMaterial | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  /* Filtered */
  const filtered = useMemo(() => {
    return materials.filter((m) => {
      const catMatch = categoryFilter === 'all' || m.category === categoryFilter;
      const deptMatch = departmentFilter === 'all' || m.department === departmentFilter;
      return catMatch && deptMatch;
    });
  }, [materials, categoryFilter, departmentFilter]);

  /* Summary */
  const pdfCount = useMemo(() => materials.filter((m) => m.fileType === 'pdf').length, [materials]);
  const videoCount = useMemo(() => materials.filter((m) => m.fileType === 'video').length, [materials]);
  const linkCount = useMemo(() => materials.filter((m) => m.fileType === 'link').length, [materials]);

  /* Handlers */
  const resetAndOpen = useCallback(() => {
    setEditing(null);
    setForm(EMPTY_FORM);
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

  const handleSubmit = async () => {
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
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-islamic-dark">{materials.length}</p>
            <p className="text-xs text-muted-foreground">{t('adminMaterials.total')}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{pdfCount}</p>
            <p className="text-xs text-muted-foreground">{t('adminMaterials.typePdf')}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{videoCount}</p>
            <p className="text-xs text-muted-foreground">{t('adminMaterials.typeVideo')}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{linkCount}</p>
            <p className="text-xs text-muted-foreground">{t('adminMaterials.typeLink')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex flex-wrap gap-2 flex-1">
          <span className="text-sm text-muted-foreground self-center">{t('adminMaterials.filterCategory')}</span>
          <Button size="sm" variant={categoryFilter === 'all' ? 'default' : 'outline'} onClick={() => setCategoryFilter('all')} className={`text-xs cursor-pointer ${categoryFilter === 'all' ? 'bg-islamic hover:bg-islamic-light text-white' : ''}`}>{t('adminMaterials.all')}</Button>
          {MATERIAL_CATEGORIES.map((cat) => (
            <Button key={cat} size="sm" variant={categoryFilter === cat ? 'default' : 'outline'} onClick={() => setCategoryFilter(cat)} className={`text-xs cursor-pointer ${categoryFilter === cat ? 'bg-islamic hover:bg-islamic-light text-white' : ''}`}>
              {cat}
            </Button>
          ))}
        </div>
        {departments.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('adminMaterials.filterDepartment')}</span>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t('adminMaterials.all')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('adminMaterials.all')}</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
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
                          <div className="flex items-center gap-2">
                            {getFileIcon(item.fileType)}
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
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs gap-1">
                              <Layers className="size-3" />
                              {t('adminMaterials.volumeCount', { count: item.volumes.length })}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          <Badge variant="secondary" className="text-xs">{item.downloadCount || 0}</Badge>
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
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      {getFileIcon(item.fileType)}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-islamic-dark truncate">{item.title}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                        )}
                      </div>
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
                    <Badge className={`text-[10px] ${FILE_TYPE_COLORS[item.fileType] || ''}`}>
                      {t(FILE_TYPE_LABEL_KEYS[item.fileType] || item.fileType)}
                    </Badge>
                    {item.category && (
                      <span className="inline-flex items-center rounded-full bg-islamic-lighter px-2 py-0.5 text-[10px] font-medium text-islamic-dark">
                        {item.category}
                      </span>
                    )}
                    {item.department && (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                        {item.department}
                      </span>
                    )}
                    {item.hasVolumes && item.volumes && item.volumes.length > 0 && (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 gap-0.5">
                        <Layers className="size-2.5" />
                        {t('adminMaterials.volumeCount', { count: item.volumes.length })}
                      </span>
                    )}
                  </div>
                  {(item.downloadCount || 0) > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-2">{t('adminMaterials.downloadCount', { count: item.downloadCount })}</p>
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
              <FolderOpen className="size-12 opacity-20 mb-3" />
              <p className="text-sm">{t('adminMaterials.noMaterials')}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) { setEditing(null); setForm(EMPTY_FORM); }
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
                </div>
              </div>
            )}

            {/* Volumes Section (when volumes is ON) */}
            {form.hasVolumes && (
              <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center justify-between">
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
                      <span className="text-sm font-semibold text-islamic">
                        {t('adminMaterials.volumeLabel', { index: index + 1 })}
                      </span>
                      {form.volumes.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-red-600 cursor-pointer"
                          onClick={() => removeVolume(index)}
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
                        <Input
                          placeholder={t('adminMaterials.labelFileUrl')}
                          value={volume.fileUrl}
                          onChange={(e) => updateVolume(index, 'fileUrl', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); setEditing(null); setForm(EMPTY_FORM); }}>{t('common.cancel')}</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer">
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {editing ? t('adminMaterials.updateBtn') : t('adminMaterials.saveBtn')}
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
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white gap-2 cursor-pointer">
              {deleting && <Loader2 className="size-4 animate-spin" />}
              {t('common.confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
