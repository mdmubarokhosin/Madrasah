'use client';

import { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  CalendarDays,
  Clock,
  Filter,
  FolderOpen,
  Printer,
  Search,
  SearchX,
  Timer,
  User,
  Users,
  X,
} from 'lucide-react';
import { Input } from '@heroui/react/input';
import BackToTop from '@/components/pages/BackToTop';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { HButton, StatCard } from '@/components/heroui/islamic';
import type { ClassRoutineItem } from '@/types/database';

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
 * Admin config rows are { time, subject, teacher, duration }. Firebase data
 * may carry optional extras (class / day) — filter chips for them appear
 * automatically whenever the data provides those fields.
 */
type RoutineRow = ClassRoutineItem & { class?: string; day?: string };

/** Distinct non-empty trimmed values, preserving the admin's original order. */
const distinctValues = (rows: RoutineRow[], key: keyof RoutineRow): string[] => {
  const seen = new Set<string>();
  for (const row of rows) {
    const value = (row[key] || '').toString().trim();
    if (value) seen.add(value);
  }
  return [...seen];
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

export default function ClassRoutinePage() {
  const { classRoutine } = useAppStore();
  const { t } = useTranslation();

  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [dayFilter, setDayFilter] = useState('all');

  const rows: RoutineRow[] = classRoutine;

  /* ── Derived data (defensive: blanks never create chips or inflate stats) ── */
  const subjects = useMemo(() => distinctValues(rows, 'subject'), [rows]);
  const classOptions = useMemo(() => distinctValues(rows, 'class'), [rows]);
  const dayOptions = useMemo(() => distinctValues(rows, 'day'), [rows]);
  const teacherCount = useMemo(() => distinctValues(rows, 'teacher').length, [rows]);
  const timeSlotCount = useMemo(() => distinctValues(rows, 'time').length, [rows]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return rows.filter((row) => {
      const matchSearch =
        !term ||
        [row.subject, row.teacher, row.time, row.duration].some(
          (value) => (value || '').toLowerCase().includes(term)
        );
      const matchSubject = subjectFilter === 'all' || (row.subject || '').trim() === subjectFilter;
      const matchClass = classFilter === 'all' || (row.class || '').trim() === classFilter;
      const matchDay = dayFilter === 'all' || (row.day || '').trim() === dayFilter;
      return matchSearch && matchSubject && matchClass && matchDay;
    });
  }, [rows, searchTerm, subjectFilter, classFilter, dayFilter]);

  const hasActiveFilters =
    searchTerm.trim() !== '' || subjectFilter !== 'all' || classFilter !== 'all' || dayFilter !== 'all';

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSubjectFilter('all');
    setClassFilter('all');
    setDayFilter('all');
  }, []);

  /* "Days covered" from the day field when present; falls back to unique time slots. */
  const daysCovered = dayOptions.length > 0 ? dayOptions.length : timeSlotCount;
  const daysLabel = dayOptions.length > 0 ? t('routinePage.statDays') : t('routinePage.statSlots');

  const printRoutine = useCallback(() => window.print(), []);

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
              جدول الحصص
            </p>
            <h1 className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
              {t('classRoutine.title')}
            </h1>
            <p className="mx-auto max-w-2xl text-base text-white/70 md:text-lg">
              {t('classRoutine.subtitle')}
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
            className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4"
          >
            <motion.div variants={itemVariants}>
              <StatCard dark tone="emerald" icon={Clock} value={rows.length} label={t('routinePage.statPeriods')} />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard dark tone="gold" icon={BookOpen} value={subjects.length} label={t('routinePage.statSubjects')} />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard dark tone="emerald" icon={Users} value={teacherCount} label={t('routinePage.statTeachers')} />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard dark tone="gold" icon={CalendarDays} value={daysCovered} label={daysLabel} />
            </motion.div>
          </motion.div>
        </div>

        <div className="gold-flow-line absolute bottom-0 left-0 right-0" aria-hidden="true" />
      </div>

      {/* ── Content ── */}
      <section className="bg-islamic-lighter/20 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Print-only heading (screen header band is print-hidden) */}
          <h1 className="mb-4 hidden text-2xl font-bold text-islamic-dark print:block">
            {t('classRoutine.title')}
          </h1>

          {rows.length === 0 ? (
            /* Empty state — no routine published at all */
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ease: EASE }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <span className="mb-5 inline-flex size-20 items-center justify-center rounded-full bg-islamic-lighter/70 ring-1 ring-islamic/15 dark:bg-white/5">
                <FolderOpen className="size-9 text-islamic/70" aria-hidden="true" />
              </span>
              <p className="text-base font-semibold text-islamic-dark dark:text-foreground">
                {t('classRoutine.noData')}
              </p>
              <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
                {t('routinePage.noDataHint')}
              </p>
            </motion.div>
          ) : (
            <>
              {/* Toolbar: search + print */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ ease: EASE }}
                className="mb-4 flex flex-col gap-3 sm:flex-row print:hidden"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input
                    fullWidth
                    placeholder={t('routinePage.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    aria-label={t('routinePage.searchPlaceholder')}
                    className="pl-10"
                  />
                </div>
                <HButton variant="outline" onPress={printRoutine} className="min-h-11 gap-2 sm:w-48">
                  <Printer className="size-4" aria-hidden="true" />
                  {t('routinePage.print')}
                </HButton>
              </motion.div>

              {/* Subject filter chips */}
              {subjects.length > 0 && (
                <div
                  className="mb-3 flex flex-wrap items-center gap-2 print:hidden"
                  role="group"
                  aria-label={t('classRoutine.subject')}
                >
                  <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground">
                    <Filter className="size-3.5" aria-hidden="true" />
                    {t('classRoutine.subject')}
                  </span>
                  <FilterChipButton
                    active={subjectFilter === 'all'}
                    onClick={() => setSubjectFilter('all')}
                    label={t('routinePage.all')}
                    count={rows.length}
                  />
                  {subjects.map((subject) => (
                    <FilterChipButton
                      key={subject}
                      active={subjectFilter === subject}
                      onClick={() => setSubjectFilter(subject)}
                      label={subject}
                    />
                  ))}
                </div>
              )}

              {/* Class chips — rendered when the data provides a class field */}
              {classOptions.length > 0 && (
                <div
                  className="mb-3 flex flex-wrap items-center gap-2 print:hidden"
                  role="group"
                  aria-label={t('routinePage.filterClass')}
                >
                  <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground">
                    <Filter className="size-3.5" aria-hidden="true" />
                    {t('routinePage.filterClass')}
                  </span>
                  <FilterChipButton
                    active={classFilter === 'all'}
                    onClick={() => setClassFilter('all')}
                    label={t('routinePage.all')}
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

              {/* Day chips — rendered when the data provides a day field */}
              {dayOptions.length > 0 && (
                <div
                  className="mb-3 flex flex-wrap items-center gap-2 print:hidden"
                  role="group"
                  aria-label={t('routinePage.filterDay')}
                >
                  <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground">
                    <CalendarDays className="size-3.5" aria-hidden="true" />
                    {t('routinePage.filterDay')}
                  </span>
                  <FilterChipButton
                    active={dayFilter === 'all'}
                    onClick={() => setDayFilter('all')}
                    label={t('routinePage.all')}
                  />
                  {dayOptions.map((option) => (
                    <FilterChipButton
                      key={option}
                      active={dayFilter === option}
                      onClick={() => setDayFilter(option)}
                      label={option}
                    />
                  ))}
                </div>
              )}

              {/* Results count + clear filters */}
              <div className="mb-5 flex flex-wrap items-center justify-between gap-2 print:hidden">
                <p className="text-sm text-muted-foreground" aria-live="polite">
                  {t('routinePage.resultsCount', { count: filtered.length })}
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-islamic transition-colors hover:bg-islamic-lighter/60 hover:text-islamic-dark dark:hover:bg-white/10"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                    {t('routinePage.clearFilters')}
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
                    {t('routinePage.noMatch')}
                  </p>
                  <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
                    {t('routinePage.noMatchHint')}
                  </p>
                  <HButton variant="outline" onPress={clearFilters} className="mt-5 min-h-11 gap-2">
                    <X className="size-4" aria-hidden="true" />
                    {t('routinePage.clearFilters')}
                  </HButton>
                </motion.div>
              ) : (
                <>
                  {/* Desktop: styled table */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, ease: EASE }}
                    className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-islamic-dark/5 print:shadow-none md:block"
                  >
                    <div
                      className="h-1 bg-gradient-to-r from-islamic-dark via-golden to-islamic-dark"
                      aria-hidden="true"
                    />
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <caption className="sr-only">{t('classRoutine.title')}</caption>
                        <thead>
                          <tr className="bg-gradient-to-r from-islamic-dark via-islamic to-islamic-light">
                            <th scope="col" className="whitespace-nowrap px-4 py-4 text-left text-sm font-semibold text-white md:px-6">
                              <span className="flex items-center gap-2">
                                <Clock className="size-4 text-golden" aria-hidden="true" />
                                {t('classRoutine.time')}
                              </span>
                            </th>
                            <th scope="col" className="whitespace-nowrap px-4 py-4 text-left text-sm font-semibold text-white md:px-6">
                              <span className="flex items-center gap-2">
                                <BookOpen className="size-4 text-golden" aria-hidden="true" />
                                {t('classRoutine.subject')}
                              </span>
                            </th>
                            <th scope="col" className="whitespace-nowrap px-4 py-4 text-left text-sm font-semibold text-white md:px-6">
                              <span className="flex items-center gap-2">
                                <Users className="size-4 text-golden" aria-hidden="true" />
                                {t('classRoutine.teacher')}
                              </span>
                            </th>
                            <th scope="col" className="whitespace-nowrap px-4 py-4 text-left text-sm font-semibold text-white md:px-6">
                              <span className="flex items-center gap-2">
                                <Timer className="size-4 text-golden" aria-hidden="true" />
                                {t('classRoutine.duration')}
                              </span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((row, index) => (
                            <motion.tr
                              key={`${row.subject}-${row.time}-${index}`}
                              initial={{ opacity: 0, x: -10 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.04, ease: EASE }}
                              className={`border-b border-border/60 transition-colors last:border-b-0 hover:bg-islamic-lighter/40 dark:hover:bg-white/5 ${
                                index % 2 === 0 ? 'bg-card' : 'bg-islamic-lighter/40 dark:bg-white/[0.03]'
                              }`}
                            >
                              <td className="px-4 py-4 md:px-6">
                                <span className="flex items-center gap-2.5">
                                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-golden/10 text-golden dark:text-gold-soft">
                                    <CalendarDays className="size-4" aria-hidden="true" />
                                  </span>
                                  <span className="text-sm font-semibold text-islamic-dark dark:text-foreground">
                                    {row.time || '—'}
                                  </span>
                                </span>
                              </td>
                              <td className="px-4 py-4 md:px-6">
                                <span className="break-words text-sm font-bold text-islamic-dark dark:text-foreground">
                                  {row.subject || '—'}
                                </span>
                              </td>
                              <td className="px-4 py-4 md:px-6">
                                <span className="flex items-center gap-1.5 break-words text-sm text-muted-foreground">
                                  <User className="size-3.5 shrink-0" aria-hidden="true" />
                                  {row.teacher || '—'}
                                </span>
                              </td>
                              <td className="px-4 py-4 md:px-6">
                                {row.duration ? (
                                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-islamic/5 px-2.5 py-1 text-xs font-medium text-islamic dark:bg-islamic/20">
                                    <Timer className="size-3" aria-hidden="true" />
                                    {row.duration}
                                  </span>
                                ) : (
                                  <span className="text-sm text-muted-foreground/50">—</span>
                                )}
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div
                      className="h-1 bg-gradient-to-r from-islamic-dark via-golden to-islamic-dark"
                      aria-hidden="true"
                    />
                  </motion.div>

                  {/* Mobile: stacked cards (same data, no horizontal overflow) */}
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid gap-3 md:hidden"
                  >
                    {filtered.map((row, index) => (
                      <motion.article
                        key={`${row.subject}-${row.time}-${index}`}
                        variants={itemVariants}
                        className="rounded-2xl border border-border bg-card p-4 shadow-sm shadow-islamic-dark/5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-golden/10 px-2.5 py-1.5 text-xs font-bold text-golden dark:text-gold-soft">
                            <Clock className="size-3.5" aria-hidden="true" />
                            {row.time || '—'}
                          </span>
                          {row.duration && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-islamic/10 px-2.5 py-1 text-[11px] font-medium text-islamic dark:bg-islamic/20">
                              <Timer className="size-3" aria-hidden="true" />
                              {row.duration}
                            </span>
                          )}
                        </div>
                        <p className="mt-2.5 break-words text-base font-bold text-islamic-dark dark:text-foreground">
                          {row.subject || '—'}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 break-words text-sm text-muted-foreground">
                          <User className="size-3.5 shrink-0" aria-hidden="true" />
                          {row.teacher || '—'}
                        </p>
                      </motion.article>
                    ))}
                  </motion.div>
                </>
              )}
            </>
          )}
        </div>
      </section>

      <BackToTop />
    </div>
  );
}
