'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Search,
  SearchX,
  Download,
  ExternalLink,
  FileVideo,
  FileAudio,
  ImageIcon,
  File,
  Link as LinkIcon,
  GraduationCap,
  Layers,
  BookOpen,
  MonitorPlay,
  Filter,
  ArrowDownUp,
  CalendarClock,
  Flame,
  Sparkles,
  X,
} from 'lucide-react';
import { Card } from '@heroui/react/card';
import { Chip } from '@heroui/react/chip';
import { Input } from '@heroui/react/input';
import { Select } from '@heroui/react/select';
import { ListBox } from '@heroui/react/list-box';
import BackToTop from '@/components/pages/BackToTop';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { StatCard, HButton } from '@/components/heroui/islamic';
import { dbUpdate } from '@/lib/db-service';
import type { StudyMaterial } from '@/types/database';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

// fileType values come from Firebase; labelKey is translated at render time.
// `cls` → chip tint, `tileCls` → card medallion tile.
const fileTypeConfig: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; labelKey?: string; label?: string; cls: string; tileCls: string }
> = {
  pdf: {
    icon: FileText,
    label: 'PDF',
    cls: 'bg-danger/10 text-danger',
    tileCls: 'bg-gradient-to-br from-danger/15 to-danger/5 text-danger ring-1 ring-danger/20',
  },
  video: {
    icon: FileVideo,
    labelKey: 'materialsPage.typeVideo',
    cls: 'bg-golden-lighter text-golden',
    tileCls: 'bg-gradient-to-br from-golden-lighter to-golden/5 text-golden ring-1 ring-golden/25',
  },
  audio: {
    icon: FileAudio,
    labelKey: 'materialsPage.typeAudio',
    cls: 'bg-warning/20 text-warning-foreground',
    tileCls: 'bg-gradient-to-br from-warning/25 to-warning/5 text-warning-foreground ring-1 ring-warning/25',
  },
  image: {
    icon: ImageIcon,
    labelKey: 'materialsPage.typeImage',
    cls: 'bg-islamic-lighter text-islamic-dark',
    tileCls: 'bg-gradient-to-br from-islamic-lighter to-islamic/5 text-islamic-dark ring-1 ring-islamic/20',
  },
  document: {
    icon: File,
    labelKey: 'materialsPage.typeDocument',
    cls: 'bg-primary/10 text-primary',
    tileCls: 'bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/20',
  },
  link: {
    icon: LinkIcon,
    labelKey: 'materialsPage.typeLink',
    cls: 'bg-islamic/10 text-islamic',
    tileCls: 'bg-gradient-to-br from-islamic/15 to-islamic/5 text-islamic ring-1 ring-islamic/25',
  },
};

type TypeFilterValue = 'all' | 'pdf' | 'video' | 'audio' | 'image' | 'document' | 'link';
type SortMode = 'newest' | 'popular';

const TYPE_FILTERS: TypeFilterValue[] = ['all', 'pdf', 'video', 'audio', 'image', 'document', 'link'];

function getVolumeIcon(type: string) {
  switch (type) {
    case 'video': return <FileVideo className="w-5 h-5" />;
    case 'audio': return <FileAudio className="w-5 h-5" />;
    case 'image': return <ImageIcon className="w-5 h-5" />;
    default: return <BookOpen className="w-5 h-5" />;
  }
}

/* Pill-shaped filter chip button — shared by the type & category rows.
   Token-based colors so it holds up in dark mode. */
function FilterChipButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300 ${
        active
          ? 'border-islamic bg-islamic text-white shadow-md shadow-islamic/25'
          : 'border-border bg-card text-islamic-dark hover:border-islamic/40 hover:bg-islamic-lighter/60 dark:bg-white/5 dark:text-foreground/80 dark:hover:bg-white/10'
      }`}
    >
      {Icon && <Icon className="size-3.5 shrink-0" aria-hidden="true" />}
      <span className="whitespace-nowrap">{label}</span>
      {typeof count === 'number' && (
        <span
          className={`ml-0.5 rounded-full px-1.5 text-[10px] font-semibold leading-4 ${
            active ? 'bg-white/20 text-white' : 'bg-islamic-lighter text-islamic-dark dark:bg-white/10 dark:text-foreground/70'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export default function MaterialsPage() {
  const { studyMaterials } = useAppStore();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState<TypeFilterValue>('all');
  const [sortMode, setSortMode] = useState<SortMode>('newest');

  const fileTypeLabel = useCallback(
    (type: string) => {
      const cfg = fileTypeConfig[type];
      if (!cfg) return type;
      return cfg.labelKey ? t(cfg.labelKey) : cfg.label || type;
    },
    [t]
  );

  const categories = useMemo(
    () => [...new Set(studyMaterials.map((m) => m.category).filter(Boolean))],
    [studyMaterials]
  );

  /* Header stats */
  const totalDownloads = useMemo(
    () => studyMaterials.reduce((sum, m) => sum + (m.downloadCount || 0), 0),
    [studyMaterials]
  );
  const pdfCount = useMemo(() => studyMaterials.filter((m) => m.fileType === 'pdf').length, [studyMaterials]);
  const videoCount = useMemo(() => studyMaterials.filter((m) => m.fileType === 'video').length, [studyMaterials]);

  /* Per-type counts for the filter chips */
  const typeCounts = useMemo(
    () =>
      studyMaterials.reduce<Record<string, number>>((acc, m) => {
        acc[m.fileType] = (acc[m.fileType] || 0) + 1;
        return acc;
      }, {}),
    [studyMaterials]
  );

  const filtered = useMemo(() => {
    return studyMaterials.filter((mat) => {
      const term = searchTerm.toLowerCase();
      const matchSearch =
        !term ||
        mat.title.toLowerCase().includes(term) ||
        (mat.description || '').toLowerCase().includes(term) ||
        (mat.department || '').toLowerCase().includes(term);
      const matchCategory = filterCategory === 'all' || mat.category === filterCategory;
      const matchType = filterType === 'all' || mat.fileType === filterType;
      return matchSearch && matchCategory && matchType;
    });
  }, [studyMaterials, searchTerm, filterCategory, filterType]);

  const visible = useMemo(() => {
    if (sortMode === 'popular') {
      return [...filtered].sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0));
    }
    return [...filtered].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [filtered, sortMode]);

  const hasActiveFilters = searchTerm.trim() !== '' || filterCategory !== 'all' || filterType !== 'all';

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setFilterCategory('all');
    setFilterType('all');
  }, []);

  // Debounce download counter to avoid multiple rapid increments
  const downloadDebounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Guard against post-unmount work from debounced callbacks
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      Object.values(downloadDebounceRef.current).forEach(clearTimeout);
      downloadDebounceRef.current = {};
    };
  }, []);

  const handleClick = useCallback((material: StudyMaterial) => {
    if (material.fileUrl) {
      window.open(material.fileUrl, '_blank', 'noopener,noreferrer');
      if (material.id) {
        if (downloadDebounceRef.current[material.id]) return;
        downloadDebounceRef.current[material.id] = setTimeout(() => {
          if (!mountedRef.current) return;
          delete downloadDebounceRef.current[material.id];
        }, 3000);
        dbUpdate('/studyMaterials/' + material.id, {
          downloadCount: (material.downloadCount || 0) + 1,
        }).catch(() => {});
      }
    }
  }, []);

  const handleVolumeClick = useCallback((material: StudyMaterial) => {
    if (material.id) {
      if (downloadDebounceRef.current[material.id]) return;
      downloadDebounceRef.current[material.id] = setTimeout(() => {
        if (!mountedRef.current) return;
        delete downloadDebounceRef.current[material.id];
      }, 3000);
      dbUpdate('/studyMaterials/' + material.id, {
        downloadCount: (material.downloadCount || 0) + 1,
      }).catch(() => {});
    }
  }, []);

  return (
    <div className="pt-0">
      {/* ── Header band ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-islamic-dark via-islamic to-islamic-light">
        <div className="absolute inset-0 islamic-pattern-overlay opacity-[0.06]" />
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-golden/5" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/5" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="text-center"
          >
            <p className="text-golden text-xl md:text-2xl font-serif mb-3" dir="rtl" lang="ar">
              الدراسة
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              {t('materials.title')}
            </h1>
            <p className="text-white/70 text-base md:text-lg max-w-2xl mx-auto">
              {t('materialsPage.subtitle')}
            </p>
            <div className="mt-6 flex items-center justify-center gap-2">
              <div className="w-16 h-[1px] bg-golden/50" />
              <div className="w-2 h-2 rounded-full bg-golden" />
              <div className="w-16 h-[1px] bg-golden/50" />
            </div>
          </motion.div>

          {/* Stats row */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4"
          >
            <motion.div variants={itemVariants}>
              <StatCard dark tone="emerald" icon={BookOpen} value={studyMaterials.length} label={t('materialsPage.statTotal')} />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard dark tone="gold" icon={FileText} value={pdfCount} label={t('materialsPage.statPdf')} />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard dark tone="emerald" icon={MonitorPlay} value={videoCount} label={t('materialsPage.statVideo')} />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard dark tone="gold" icon={Download} value={totalDownloads} label={t('materialsPage.statDownloads')} />
            </motion.div>
          </motion.div>
        </div>

        <div className="gold-flow-line absolute bottom-0 left-0 right-0" aria-hidden="true" />
      </div>

      {/* ── Content ── */}
      <section className="bg-islamic-lighter/20 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Search + sort */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ ease: EASE }}
            className="mb-4 flex flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                fullWidth
                placeholder={t('materialsPage.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label={t('materialsPage.searchPlaceholder')}
                className="pl-10"
              />
            </div>
            <Select
              aria-label={t('materialsPage.sortBy')}
              value={sortMode}
              onChange={(val) => setSortMode(String(val) === 'popular' ? 'popular' : 'newest')}
            >
              <Select.Trigger className="w-full sm:w-52" aria-label={t('materialsPage.sortBy')}>
                <ArrowDownUp className="mr-2 size-4 shrink-0 text-islamic" aria-hidden="true" />
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover className="rounded-xl border border-islamic/15 bg-card shadow-xl">
                <ListBox aria-label={t('materialsPage.sortBy')}>
                  <ListBox.Item
                    id="newest"
                    textValue={t('materialsPage.sortNewest')}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm data-[selected=true]:bg-islamic-lighter data-[hovered=true]:bg-islamic-lighter/60"
                  >
                    <CalendarClock className="size-4 text-islamic" aria-hidden="true" />
                    {t('materialsPage.sortNewest')}
                  </ListBox.Item>
                  <ListBox.Item
                    id="popular"
                    textValue={t('materialsPage.sortPopular')}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm data-[selected=true]:bg-islamic-lighter data-[hovered=true]:bg-islamic-lighter/60"
                  >
                    <Flame className="size-4 text-golden" aria-hidden="true" />
                    {t('materialsPage.sortPopular')}
                  </ListBox.Item>
                </ListBox>
              </Select.Popover>
            </Select>
          </motion.div>

          {/* File-type filter chips */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ ease: EASE }}
            className="mb-3 flex flex-wrap items-center gap-2"
            role="group"
            aria-label={t('materialsPage.filterType')}
          >
            <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground">
              <Filter className="size-3.5" aria-hidden="true" />
              {t('materialsPage.filterType')}
            </span>
            {TYPE_FILTERS.map((type) => (
              <FilterChipButton
                key={type}
                active={filterType === type}
                onClick={() => setFilterType(type)}
                icon={type === 'all' ? undefined : fileTypeConfig[type]?.icon}
                label={type === 'all' ? t('materialsPage.typeAll') : fileTypeLabel(type)}
                count={type === 'all' ? studyMaterials.length : typeCounts[type] || 0}
              />
            ))}
          </motion.div>

          {/* Category filter chips */}
          {categories.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-2" role="group" aria-label={t('common.category')}>
              <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground">
                <Layers className="size-3.5" aria-hidden="true" />
                {t('common.category')}
              </span>
              <FilterChipButton active={filterCategory === 'all'} onClick={() => setFilterCategory('all')} label={t('common.all')} />
              {categories.map((cat) => (
                <FilterChipButton
                  key={cat}
                  active={filterCategory === cat}
                  onClick={() => setFilterCategory(cat)}
                  label={cat}
                />
              ))}
            </div>
          )}

          {/* Results count + clear filters */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {t('materialsPage.resultsCount', { count: visible.length })}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-islamic transition-colors hover:bg-islamic-lighter/60 hover:text-islamic-dark"
              >
                <X className="size-3.5" aria-hidden="true" />
                {t('materialsPage.clearFilters')}
              </button>
            )}
          </div>

          {/* Materials grid */}
          {visible.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {visible.map((material) => {
                const ftc = fileTypeConfig[material.fileType] || fileTypeConfig.document;
                const FileIcon = ftc.icon;
                const hasVolumes = material.hasVolumes && material.volumes && material.volumes.length > 0;
                const isNew = !!material.createdAt && Date.now() - material.createdAt < 7 * 24 * 60 * 60 * 1000;

                return (
                  <motion.div key={material.id} variants={itemVariants} className="h-full">
                    <Card className="card-cinema group h-full rounded-2xl">
                      <Card.Content className="flex h-full flex-col p-5">
                        {/* Title block */}
                        <div className="mb-3 flex items-start gap-3.5">
                          <span
                            className={`relative inline-flex size-12 shrink-0 items-center justify-center rounded-xl ${ftc.tileCls}`}
                          >
                            {hasVolumes ? <Layers className="size-6" /> : <FileIcon className="size-6" />}
                            {isNew && (
                              <span className="absolute -right-2 -top-2 inline-flex items-center gap-0.5 rounded-full bg-golden px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm ring-1 ring-white/40">
                                <Sparkles className="size-2.5" aria-hidden="true" />
                                {t('materialsPage.newBadge')}
                              </span>
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-bold text-islamic-dark line-clamp-2 dark:text-foreground">{material.title}</h3>
                            {material.department && (
                              <p className="mt-0.5 text-xs text-muted-foreground">{material.department}</p>
                            )}
                          </div>
                        </div>

                        {material.description && (
                          <p className="mb-3 text-sm text-muted-foreground line-clamp-2">{material.description}</p>
                        )}

                        {/* Meta chips */}
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          {material.category && (
                            <Chip className="border-0 bg-islamic/10 text-xs text-islamic dark:bg-islamic/20">
                              {material.category}
                            </Chip>
                          )}
                          <Chip className={`border-0 text-xs ${ftc.cls}`}>
                            {ftc.labelKey ? t(ftc.labelKey) : ftc.label || ''}
                          </Chip>
                          {hasVolumes && (
                            <Chip className="gap-1 border-0 bg-primary/10 text-xs text-primary">
                              <Layers className="size-3" />
                              {t('materialsPage.volumes', { count: material.volumes?.length ?? 0 })}
                            </Chip>
                          )}
                        </div>

                        {/* Single file — simple open button */}
                        {!hasVolumes && material.fileUrl && (
                          <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/70 pt-3">
                            <span
                              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
                              title={t('materialsPage.downloadsAria')}
                            >
                              <Download className="size-3.5" aria-hidden="true" />
                              {material.downloadCount || 0}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleClick(material)}
                              aria-label={t('materialsPage.openAria')}
                              className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-islamic transition-colors hover:bg-islamic-lighter/60 hover:text-islamic-dark"
                            >
                              <ExternalLink className="size-3.5" aria-hidden="true" />
                              {t('materials.open')}
                            </button>
                          </div>
                        )}

                        {/* Volumes section */}
                        {hasVolumes && material.volumes && material.volumes.length > 0 && (
                          <div className="mt-auto border-t border-border/70 pt-3">
                            <div className="mb-3 flex items-center justify-between gap-2">
                              <p className="flex items-center gap-1 text-xs font-semibold text-islamic-dark dark:text-foreground">
                                <Layers className="size-3.5" aria-hidden="true" />
                                {t('materialsPage.volumesList')}
                              </p>
                              <div
                                className="flex items-center gap-1 text-xs text-muted-foreground"
                                title={t('materialsPage.downloadsAria')}
                              >
                                <Download className="size-3.5" aria-hidden="true" />
                                {material.downloadCount || 0}
                              </div>
                            </div>
                            <div className="space-y-2">
                              {material.volumes.map((volume, volIndex) => (
                                <a
                                  key={volIndex}
                                  href={volume.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => handleVolumeClick(material)}
                                  className="group/vol flex cursor-pointer items-center gap-3 rounded-xl border border-border/80 p-2.5 no-underline transition-all hover:border-islamic/30 hover:bg-islamic-lighter/40"
                                >
                                  <span
                                    className={`inline-flex size-9 shrink-0 items-center justify-center rounded-lg ${
                                      fileTypeConfig[volume.fileType]?.tileCls || 'bg-surface-tertiary text-muted-foreground ring-1 ring-border'
                                    }`}
                                  >
                                    {getVolumeIcon(volume.fileType)}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-islamic-dark group-hover/vol:text-islamic dark:text-foreground">
                                      {volume.volumeTitle}
                                    </p>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-1.5">
                                    {fileTypeConfig[volume.fileType] && (
                                      <Chip className={`border-0 text-[10px] ${fileTypeConfig[volume.fileType].cls}`}>
                                        {fileTypeLabel(volume.fileType)}
                                      </Chip>
                                    )}
                                    <ExternalLink className="size-3.5 text-muted-foreground group-hover/vol:text-islamic" aria-hidden="true" />
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </Card.Content>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            /* Empty states */
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ease: EASE }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <span className="mb-5 inline-flex size-20 items-center justify-center rounded-full bg-islamic-lighter/70 ring-1 ring-islamic/15 dark:bg-white/5">
                {hasActiveFilters || searchTerm ? (
                  <SearchX className="size-9 text-islamic/70" aria-hidden="true" />
                ) : (
                  <GraduationCap className="size-9 text-islamic/70" aria-hidden="true" />
                )}
              </span>
              <p className="text-base font-semibold text-islamic-dark dark:text-foreground">
                {searchTerm || hasActiveFilters
                  ? t('materialsPage.noMatch')
                  : t('materialsPage.noDataFound')}
              </p>
              <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
                {searchTerm || hasActiveFilters
                  ? t('materialsPage.noMatchHint')
                  : t('materialsPage.noDataHint')}
              </p>
              {(searchTerm || hasActiveFilters) && (
                <HButton variant="outline" onPress={clearFilters} className="mt-5 min-h-11 gap-2">
                  <X className="size-4" aria-hidden="true" />
                  {t('materialsPage.clearFilters')}
                </HButton>
              )}
            </motion.div>
          )}
        </div>
      </section>

      <BackToTop />
    </div>
  );
}
