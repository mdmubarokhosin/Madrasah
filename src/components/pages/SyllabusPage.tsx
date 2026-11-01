'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  CalendarDays,
  Download,
  File as FileIcon,
  FileAudio,
  FileText,
  FileVideo,
  Filter,
  GraduationCap,
  ImageIcon,
  Search,
  SearchX,
  X,
} from 'lucide-react';
import { Card } from '@heroui/react/card';
import { Chip } from '@heroui/react/chip';
import { Input } from '@heroui/react/input';
import BackToTop from '@/components/pages/BackToTop';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { HButton, StatCard } from '@/components/heroui/islamic';
import { dbUpdate } from '@/lib/db-service';
import type { SyllabusItem } from '@/types/database';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

/**
 * Admin config items are { name, year }. Firebase data may carry optional
 * extras (fileUrl / url, id, downloadCount, class, subject) — the download
 * button, counting badge and extra chips surface automatically whenever
 * the data provides those fields.
 */
type SyllabusRow = SyllabusItem & {
  id?: string;
  fileUrl?: string;
  url?: string;
  downloadCount?: number;
  class?: string;
  subject?: string;
};

/** Distinct non-empty trimmed values, preserving the admin's original order. */
const distinctValues = (rows: SyllabusRow[], key: keyof SyllabusRow): string[] => {
  const seen = new Set<string>();
  for (const row of rows) {
    const value = (row[key] || '').toString().trim();
    if (value) seen.add(value);
  }
  return [...seen];
};

const resolveFileUrl = (item: SyllabusRow): string => (item.fileUrl || item.url || '').trim();

/* File-type icon + short label from the URL extension (downloadable items). */
const EXT_META: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string }> = {
  pdf: { icon: FileText, label: 'PDF' },
  doc: { icon: FileIcon, label: 'DOC' },
  docx: { icon: FileIcon, label: 'DOCX' },
  ppt: { icon: FileIcon, label: 'PPT' },
  pptx: { icon: FileIcon, label: 'PPTX' },
  jpg: { icon: ImageIcon, label: 'IMG' },
  jpeg: { icon: ImageIcon, label: 'IMG' },
  png: { icon: ImageIcon, label: 'IMG' },
  webp: { icon: ImageIcon, label: 'IMG' },
  gif: { icon: ImageIcon, label: 'IMG' },
  mp4: { icon: FileVideo, label: 'VIDEO' },
  webm: { icon: FileVideo, label: 'VIDEO' },
  mov: { icon: FileVideo, label: 'VIDEO' },
  mp3: { icon: FileAudio, label: 'AUDIO' },
  wav: { icon: FileAudio, label: 'AUDIO' },
  m4a: { icon: FileAudio, label: 'AUDIO' },
};

const fileMeta = (url: string): { icon: React.ComponentType<{ className?: string }>; label: string } => {
  const ext = url.split(/[#?]/)[0].split('.').pop()?.toLowerCase() ?? '';
  return EXT_META[ext] || { icon: FileIcon, label: ext ? ext.toUpperCase() : 'FILE' };
};

/* Pill-shaped filter chip — token-based colors so it holds up in dark mode. */
function FilterChipButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
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
      <span className="whitespace-nowrap">{label}</span>
      {typeof count === 'number' && (
        <span
          className={`ml-0.5 rounded-full px-1.5 text-[10px] font-semibold leading-4 ${
            active
              ? 'bg-white/20 text-white'
              : 'bg-islamic-lighter text-islamic-dark dark:bg-white/10 dark:text-foreground/70'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export default function SyllabusPage() {
  const { syllabus } = useAppStore();
  const { t } = useTranslation();

  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');

  const rows: SyllabusRow[] = syllabus;

  /* ── Derived data (defensive: blanks never create chips or inflate stats) ── */
  const years = useMemo(() => distinctValues(rows, 'year'), [rows]);
  const classOptions = useMemo(() => distinctValues(rows, 'class'), [rows]);
  const downloadableCount = useMemo(
    () => rows.reduce((sum, row) => sum + (resolveFileUrl(row) ? 1 : 0), 0),
    [rows]
  );

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return rows.filter((row) => {
      const matchSearch =
        !term ||
        [row.name, row.year, row.class, row.subject].some(
          (value) => (value || '').toLowerCase().includes(term)
        );
      const matchYear = yearFilter === 'all' || (row.year || '').trim() === yearFilter;
      const matchClass = classFilter === 'all' || (row.class || '').trim() === classFilter;
      return matchSearch && matchYear && matchClass;
    });
  }, [rows, searchTerm, yearFilter, classFilter]);

  const hasActiveFilters = searchTerm.trim() !== '' || yearFilter !== 'all' || classFilter !== 'all';

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setYearFilter('all');
    setClassFilter('all');
  }, []);

  /* Download counting — only fires when the item actually has an id
     (i.e. the admin data supports per-item counters). Debounced. */
  const downloadDebounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  useEffect(() => {
    const pending = downloadDebounceRef.current;
    return () => {
      Object.values(pending).forEach(clearTimeout);
    };
  }, []);

  const handleOpen = useCallback((item: SyllabusRow) => {
    const id = item.id;
    if (!id) return;
    if (downloadDebounceRef.current[id]) return;
    downloadDebounceRef.current[id] = setTimeout(() => {
      delete downloadDebounceRef.current[id];
    }, 3000);
    dbUpdate('/config/syllabus/' + id, {
      downloadCount: (item.downloadCount || 0) + 1,
    }).catch(() => {});
  }, []);

  return (
    <div className="pt-0">
      {/* ── Header band ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-islamic-dark via-islamic to-islamic-light print:hidden">
        <div className="absolute inset-0 islamic-pattern-overlay opacity-[0.06]" />
        <div className="absolute -top-20 -right-20 size-64 rounded-full bg-golden/5" />
        <div className="absolute -bottom-10 -left-10 size-40 rounded-full bg-white/5" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="text-center"
          >
            <p className="mb-3 font-serif text-xl text-golden md:text-2xl" dir="rtl" lang="ar">
              المنهج الدراسي
            </p>
            <h1 className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
              {t('syllabus.title')}
            </h1>
            <p className="mx-auto max-w-2xl text-base text-white/70 md:text-lg">
              {t('syllabus.subtitle')}
            </p>
            <div className="mt-6 flex items-center justify-center gap-2">
              <div className="h-px w-16 bg-golden/50" />
              <div className="size-2 rounded-full bg-golden" />
              <div className="h-px w-16 bg-golden/50" />
            </div>
          </motion.div>

          {/* Stats row */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3"
          >
            <motion.div variants={itemVariants}>
              <StatCard dark tone="emerald" icon={BookOpen} value={rows.length} label={t('syllabusPage.statTotal')} />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard dark tone="gold" icon={Download} value={downloadableCount} label={t('syllabusPage.statDownloadable')} />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard dark tone="emerald" icon={CalendarDays} value={years.length} label={t('syllabusPage.statYears')} />
            </motion.div>
          </motion.div>
        </div>

        <div className="gold-flow-line absolute bottom-0 left-0 right-0" aria-hidden="true" />
      </div>

      {/* ── Content ── */}
      <section className="bg-islamic-lighter/20 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {rows.length === 0 ? (
            /* Empty state — no syllabus published at all */
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ease: EASE }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <span className="mb-5 inline-flex size-20 items-center justify-center rounded-full bg-islamic-lighter/70 ring-1 ring-islamic/15 dark:bg-white/5">
                <GraduationCap className="size-9 text-islamic/70" aria-hidden="true" />
              </span>
              <p className="text-base font-semibold text-islamic-dark dark:text-foreground">
                {t('syllabus.noData')}
              </p>
              <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
                {t('syllabus.noAdminData')}
              </p>
            </motion.div>
          ) : (
            <>
              {/* Search */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ ease: EASE }}
                className="mb-4 print:hidden"
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input
                    fullWidth
                    placeholder={t('syllabusPage.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    aria-label={t('syllabusPage.searchPlaceholder')}
                    className="pl-10"
                  />
                </div>
              </motion.div>

              {/* Year filter chips */}
              {years.length > 0 && (
                <div
                  className="mb-3 flex flex-wrap items-center gap-2 print:hidden"
                  role="group"
                  aria-label={t('syllabus.year')}
                >
                  <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground">
                    <Filter className="size-3.5" aria-hidden="true" />
                    {t('syllabus.year')}
                  </span>
                  <FilterChipButton
                    active={yearFilter === 'all'}
                    onClick={() => setYearFilter('all')}
                    label={t('syllabusPage.all')}
                    count={rows.length}
                  />
                  {years.map((year) => (
                    <FilterChipButton
                      key={year}
                      active={yearFilter === year}
                      onClick={() => setYearFilter(year)}
                      label={year}
                    />
                  ))}
                </div>
              )}

              {/* Class chips — rendered when the data provides a class field */}
              {classOptions.length > 0 && (
                <div
                  className="mb-3 flex flex-wrap items-center gap-2 print:hidden"
                  role="group"
                  aria-label={t('syllabusPage.filterClass')}
                >
                  <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground">
                    <Filter className="size-3.5" aria-hidden="true" />
                    {t('syllabusPage.filterClass')}
                  </span>
                  <FilterChipButton
                    active={classFilter === 'all'}
                    onClick={() => setClassFilter('all')}
                    label={t('syllabusPage.all')}
                  />
                  {classOptions.map((option) => (
                    <FilterChipButton
                      key={option}
                      active={classFilter === option}
                      onClick={() => setClassFilter(option)}
                      label={option}
                    />
                  ))}
                </div>
              )}

              {/* Results count + clear filters */}
              <div className="mb-5 flex flex-wrap items-center justify-between gap-2 print:hidden">
                <p className="text-sm text-muted-foreground" aria-live="polite">
                  {t('syllabusPage.resultsCount', { count: filtered.length })}
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-islamic transition-colors hover:bg-islamic-lighter/60 hover:text-islamic-dark dark:hover:bg-white/10"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                    {t('syllabusPage.clearFilters')}
                  </button>
                )}
              </div>

              {filtered.length === 0 ? (
                /* No-match state */
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ease: EASE }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <span className="mb-5 inline-flex size-20 items-center justify-center rounded-full bg-islamic-lighter/70 ring-1 ring-islamic/15 dark:bg-white/5">
                    <SearchX className="size-9 text-islamic/70" aria-hidden="true" />
                  </span>
                  <p className="text-base font-semibold text-islamic-dark dark:text-foreground">
                    {t('syllabusPage.noMatch')}
                  </p>
                  <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
                    {t('syllabusPage.noMatchHint')}
                  </p>
                  <HButton variant="outline" onPress={clearFilters} className="mt-5 min-h-11 gap-2">
                    <X className="size-4" aria-hidden="true" />
                    {t('syllabusPage.clearFilters')}
                  </HButton>
                </motion.div>
              ) : (
                /* Syllabus cards grid */
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {filtered.map((item, index) => {
                    const fileUrl = resolveFileUrl(item);
                    const meta = fileUrl ? fileMeta(fileUrl) : null;
                    const FileGlyph = meta ? meta.icon : BookOpen;

                    return (
                      <motion.div key={`${item.name}-${item.year}-${index}`} variants={itemVariants} className="h-full">
                        <Card className="card-cinema group h-full rounded-2xl">
                          <Card.Content className="flex h-full flex-col p-5">
                            {/* Title block */}
                            <div className="mb-3 flex items-start gap-3.5">
                              <span
                                className={`relative inline-flex size-12 shrink-0 items-center justify-center rounded-xl transition-colors ${
                                  meta
                                    ? 'bg-golden-lighter text-golden ring-1 ring-golden/30 group-hover:bg-golden group-hover:text-white dark:bg-golden/10'
                                    : 'bg-islamic-lighter text-islamic ring-1 ring-islamic/20 group-hover:bg-islamic group-hover:text-white'
                                }`}
                              >
                                <FileGlyph className="size-6" aria-hidden="true" />
                              </span>
                              <div className="min-w-0 flex-1">
                                <h3 className="break-words text-sm font-bold text-islamic-dark line-clamp-2 dark:text-foreground">
                                  {item.name}
                                </h3>
                              </div>
                            </div>

                            {/* Meta chips */}
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                              {meta && (
                                <Chip className="border-0 bg-islamic/10 text-xs font-semibold text-islamic dark:bg-islamic/20">
                                  {meta.label}
                                </Chip>
                              )}
                              {(item.class || '').trim() && (
                                <Chip className="border-0 bg-islamic-lighter text-xs text-islamic-dark dark:bg-white/10 dark:text-foreground/80">
                                  {(item.class || '').trim()}
                                </Chip>
                              )}
                              {(item.subject || '').trim() && (
                                <Chip className="border-0 bg-primary/10 text-xs text-primary">
                                  {(item.subject || '').trim()}
                                </Chip>
                              )}
                              {(item.year || '').trim() && (
                                <Chip className="gap-1 border-0 bg-golden-lighter text-xs font-semibold text-golden dark:bg-golden/10 dark:text-gold-soft">
                                  <CalendarDays className="size-3" aria-hidden="true" />
                                  {t('syllabus.year')}: {(item.year || '').trim()}
                                </Chip>
                              )}
                            </div>

                            {/* Download / open action — only when a file exists */}
                            {fileUrl ? (
                              <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/70 pt-3">
                                {item.id && (
                                  <span
                                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
                                    title={t('syllabusPage.downloadsAria')}
                                  >
                                    <Download className="size-3.5" aria-hidden="true" />
                                    {item.downloadCount || 0}
                                  </span>
                                )}
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => handleOpen(item)}
                                  aria-label={`${t('syllabusPage.downloadAria')} — ${item.name}`}
                                  className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-islamic transition-colors hover:bg-islamic-lighter/60 hover:text-islamic-dark dark:hover:bg-white/10 dark:hover:text-gold-soft"
                                >
                                  <Download className="size-3.5" aria-hidden="true" />
                                  {t('syllabusPage.download')}
                                </a>
                              </div>
                            ) : (
                              <div className="mt-auto border-t border-border/70 pt-3">
                                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <BookOpen className="size-3.5" aria-hidden="true" />
                                  {t('syllabusPage.noFileNote')}
                                </span>
                              </div>
                            )}
                          </Card.Content>
                        </Card>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </>
          )}
        </div>
      </section>

      <BackToTop />
    </div>
  );
}
