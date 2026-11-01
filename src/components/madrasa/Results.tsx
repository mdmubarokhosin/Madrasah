'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  FileText,
  Clock,
  Award,
  Search,
  FolderOpen,
  Trophy,
  Medal,
  Users,
  TrendingUp,
  ChevronRight,
  Star,
  BookOpen,
  Printer,
  Sparkles,
  X,
} from 'lucide-react';
import { Tabs } from '@heroui/react/tabs';
import { Heading } from '@heroui/react/typography';
import { HButton, HCard, HChip, IconMedallion, StatCard } from '@/components/heroui/islamic';
import SectionHeading from './SectionHeading';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { loc } from '@/lib/multilingual';
import { escapeHtml } from '@/lib/format';
import { navigateTo } from '@/lib/navigate';
import {
  getPublishedExamsWithResults,
  getLatestExam,
  buildMeritList,
  computeExamStats,
  getExamClasses,
  downloadMeritCsv,
  type MeritEntry,
} from '@/lib/results-service';

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
const toBn = (n: number | string) =>
  n.toString().replace(/\d/g, (d) => BN_DIGITS[parseInt(d)]);

/* Localized number: Bangla digits only in the Bangla UI. */
function num(n: number | string, language: string) {
  return language === 'bn' ? toBn(n) : n.toString();
}

function getGradeColor(grade: string) {
  switch (grade) {
    case 'A+': return 'from-islamic to-islamic-dark';
    case 'A': return 'from-islamic to-gold-bright';
    case 'B': return 'from-gold-bright to-gold-soft';
    case 'C': return 'from-golden to-gold-soft';
    case 'F': return 'from-golden/60 to-gold-soft/60';
    default: return 'from-islamic/30 to-golden/30';
  }
}

function getGradeLabel(grade: string, t: (k: string) => string) {
  switch (grade) {
    case 'A+': return t('adminResults.gradeAPlus');
    case 'A': return t('adminResults.gradeA');
    case 'B': return t('adminResults.gradeB');
    case 'C': return t('adminResults.gradeC');
    case 'F': return t('adminResults.gradeF');
    default: return grade;
  }
}

function getRankIcon(index: number, numFn: (n: number) => string) {
  if (index === 0) return <Trophy className="w-5 h-5 text-gold-bright" />;
  if (index === 1) return <Medal className="w-5 h-5 text-muted-foreground" />;
  if (index === 2) return <Medal className="w-5 h-5 text-golden" />;
  return <span className="text-xs font-bold text-islamic">{numFn(index + 1)}</span>;
}

function getRankBg(index: number) {
  if (index === 0) return 'bg-gradient-to-r from-golden-lighter/70 to-golden-lighter/20 border-golden/40';
  if (index === 1) return 'bg-gradient-to-r from-white to-islamic-lighter/50 border-border';
  if (index === 2) return 'bg-gradient-to-r from-golden-lighter/40 to-white border-golden/25';
  return 'bg-white border-border';
}

/* Eight-point star ornament */
function StarOrnament({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} aria-hidden="true">
      <path d="M50 2 L59 26 L83 17 L74 41 L98 50 L74 59 L83 83 L59 74 L50 98 L41 74 L17 83 L26 59 L2 50 L26 41 L17 17 L41 26 Z" stroke="currentColor" strokeWidth="1" />
      <circle cx="50" cy="50" r="14" stroke="currentColor" strokeWidth="1" />
      <circle cx="50" cy="50" r="5" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

export default function Results({ hideHeading }: { hideHeading?: boolean }) {
  const {
    results: storeResults,
    classRoutine: storeRoutine,
    syllabus: storeSyllabus,
    exams,
  } = useAppStore();
  const { t, language } = useTranslation();

  /* ---------- selection state ---------- */
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  /* ---------- derived data (publishable exams, latest first) ---------- */
  const publishableExams = getPublishedExamsWithResults(exams, storeResults);
  const latestExam = getLatestExam(exams, storeResults);

  const activeExamId = selectedExamId || latestExam?.id || '';
  const activeExam = publishableExams.find((e) => e.id === activeExamId) || null;
  const isLatestExam = !!latestExam && activeExamId === latestExam.id;

  const examName = (examId: string) => {
    const exam = exams.find((e) => e.id === examId);
    return exam ? loc(language, exam, 'name') || exam.name : '';
  };

  const examClasses = activeExamId ? getExamClasses(storeResults, activeExamId) : [];
  const meritList = activeExamId ? buildMeritList(storeResults, activeExamId, classFilter) : [];

  const q = searchQuery.trim().toLowerCase();
  const filteredMerit: MeritEntry[] = q
    ? meritList.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.roll.toLowerCase().includes(q) ||
          m.registrationNumber.toLowerCase().includes(q)
      )
    : meritList;

  const stats = activeExamId ? computeExamStats(storeResults, activeExamId, classFilter) : null;

  /* ---------- handlers ---------- */
  const handleExamSelect = (id: string) => {
    setSelectedExamId(id);
    setClassFilter('all');
    setSearchQuery('');
  };

  const handlePrint = () => {
    if (!activeExam || filteredMerit.length === 0) return;
    const title = examName(activeExam.id);
    const rows = filteredMerit
      .map(
        (m, i) => `<tr style="background:${i % 2 === 0 ? '#ffffff' : '#EAEAEB'}">
          <td style="padding:8px 10px;border-bottom:1px solid #e4e4e7;text-align:center;font-weight:${m.rank <= 3 ? '700' : '400'};color:#0485f7">${num(m.rank, language)}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e4e4e7;font-weight:600">${escapeHtml(m.name)}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e4e4e7;text-align:center">${escapeHtml(m.roll || '—')}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e4e4e7;text-align:center">${escapeHtml(m.className || '—')}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e4e4e7;text-align:center">${num(m.obtained, language)}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e4e4e7;text-align:center">${num(m.total, language)}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e4e4e7;text-align:center;font-weight:700;color:#0485f7">${escapeHtml(m.grade)}</td>
        </tr>`
      )
      .join('');
    const win = window.open('', '_blank', 'width=900,height=650');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>${escapeHtml(title)} — ${t('results.meritList')}</title>
      <style>body{font-family:system-ui,-apple-system,'Noto Serif Bangla',serif;padding:28px;color:#18181b}
      h1{color:#0485f7;font-size:20px;margin:0 0 4px}p.sub{color:#71717a;font-size:13px;margin:0 0 18px}
      table{width:100%;border-collapse:collapse;font-size:13px}
      thead th{background:#0485f7;color:#fff;padding:9px 10px;text-align:center;font-size:12px}
      th:first-child,td:first-child{width:56px}</style></head><body>
      <h1>${escapeHtml(title)}</h1><p class="sub">${t('results.meritList')}${activeExam.date ? ' · ' + escapeHtml(activeExam.date) : ''}</p>
      <table><thead><tr>
        <th>${t('results.rank')}</th><th>${t('results.nameCol')}</th><th>${t('student.rollNumber')}</th>
        <th>${t('student.class')}</th><th>${t('results.marksCol')}</th><th>${t('adminResults.totalMarks')}</th><th>${t('results.gradeCol')}</th>
      </tr></thead><tbody>${rows}</tbody></table>
      <script>window.onload=function(){window.print()}</script></body></html>`);
    win.document.close();
  };

  /* ---------- empty state (nothing published at all) ---------- */
  if (publishableExams.length === 0) {
    return (
      <section id="results" className="relative py-16 md:py-24 paper overflow-hidden">
        <div className="paper-decor absolute inset-0 islamic-pattern-bg pointer-events-none opacity-[0.04]" />
        <StarOrnament className="paper-decor animate-spin-slow absolute -top-10 -end-10 w-48 h-48 text-golden/10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {!hideHeading && (
            <SectionHeading
              title={t('results.title')}
              subtitle={t('results.subtitle')}
              arabicText={t('results.arabic')}
            />
          )}
          <HCard className="max-w-lg mx-auto text-muted-foreground">
            <div className="relative w-full flex flex-col items-center justify-center px-6 py-10">
              <div className="w-20 h-20 rounded-full bg-islamic-lighter/60 ring-1 ring-islamic/10 flex items-center justify-center mb-4">
                <FolderOpen className="size-9 opacity-30" />
              </div>
              <p className="text-sm font-semibold text-islamic-dark">{t('results.noData')}</p>
              <p className="text-xs mt-1.5 opacity-60">{t('results.addFromAdmin')}</p>
            </div>
          </HCard>
        </div>
      </section>
    );
  }

  const statCards = stats
    ? [
        { icon: Users, value: num(stats.total, language), label: t('results.totalExaminees'), tone: 'emerald' as const, extra: null as string | null },
        { icon: TrendingUp, value: `${stats.avgPercent.toFixed(1)}%`, label: t('results.averagePercentage'), tone: 'gold' as const, extra: null as string | null },
        { icon: Award, value: num(stats.passed, language), label: t('results.passed'), tone: 'emerald' as const, extra: `(${stats.passRate.toFixed(0)}%)` },
        { icon: Star, value: num(stats.aPlus, language), label: t('results.aPlusObtained'), tone: 'gold' as const, extra: null as string | null },
      ]
    : [];

  return (
    <section id="results" className="relative py-16 md:py-24 paper overflow-hidden">
      {/* Ambient ornaments */}
      <div className="paper-decor absolute inset-0 islamic-pattern-bg pointer-events-none opacity-[0.04]" />
      <StarOrnament className="paper-decor animate-spin-slow absolute -top-12 -end-12 w-56 h-56 text-golden/10" />
      <StarOrnament className="paper-decor animate-spin-slow absolute -bottom-16 -start-16 w-64 h-64 text-islamic/8 [animation-direction:reverse]" />
      <div className="paper-decor absolute top-24 start-1/4 w-64 h-64 bg-gold-bright/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {!hideHeading && (
          <SectionHeading
            title={t('results.title')}
            subtitle={t('results.subtitle')}
            arabicText={t('results.arabic')}
          />
        )}

        {/* Student Result Search CTA */}
        <div className="flex justify-center mb-10">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <HButton
              variant="primary"
              onClick={() => navigateTo('student')}
              className="inline-flex items-center justify-center gap-2.5 rounded-full px-8 py-4 text-sm sm:text-base font-bold min-h-[52px] cursor-pointer bg-gradient-to-br from-islamic to-islamic-dark shadow-lg shadow-islamic/30"
            >
              <Search className="size-4 sm:size-5" />
              {t('nav.studentResult')}
              <ChevronRight className="size-4 rtl:-scale-x-100" />
            </HButton>
          </motion.div>
        </div>

        <Tabs defaultSelectedKey="results" className="w-full">
          <Tabs.ListContainer className="w-fit mx-auto border-0 bg-transparent p-0 shadow-none">
            <Tabs.List aria-label="Results sections" className="mx-auto flex w-fit glass border border-islamic/10 p-1.5 rounded-full shadow-sm">
            <Tabs.Tab
              id="results"
              className="px-4 md:px-6 text-xs sm:text-sm font-semibold rounded-full transition-all cursor-pointer data-[selected=true]:text-white data-[focus-visible=true]:ring-2 data-[focus-visible=true]:ring-golden/50"
            >
              <Award className="w-3.5 h-3.5 mr-1.5 sm:mr-2 hidden sm:inline" />
              {t('results.title')}
              <Tabs.Indicator className="rounded-full bg-gradient-to-r from-islamic to-islamic-dark shadow-md" />
            </Tabs.Tab>
            <Tabs.Tab
              id="routine"
              className="px-4 md:px-6 text-xs sm:text-sm font-semibold rounded-full transition-all cursor-pointer data-[selected=true]:text-white data-[focus-visible=true]:ring-2 data-[focus-visible=true]:ring-golden/50"
            >
              <Clock className="w-3.5 h-3.5 mr-1.5 sm:mr-2 hidden sm:inline" />
              {t('footer.classRoutine')}
              <Tabs.Indicator className="rounded-full bg-gradient-to-r from-islamic to-islamic-dark shadow-md" />
            </Tabs.Tab>
            <Tabs.Tab
              id="syllabus"
              className="px-4 md:px-6 text-xs sm:text-sm font-semibold rounded-full transition-all cursor-pointer data-[selected=true]:text-white data-[focus-visible=true]:ring-2 data-[focus-visible=true]:ring-golden/50"
            >
              <FileText className="w-3.5 h-3.5 mr-1.5 sm:mr-2 hidden sm:inline" />
              {t('footer.syllabus')}
              <Tabs.Indicator className="rounded-full bg-gradient-to-r from-islamic to-islamic-dark shadow-md" />
            </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>

          {/* Results Tab */}
          <Tabs.Panel id="results" className="mt-8 md:mt-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="space-y-6">
                {/* ===== Exam selector: latest exam first (default) ===== */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {publishableExams.slice(0, 8).map((exam, idx) => {
                    const isActive = exam.id === activeExamId;
                    return (
                      <button
                        key={exam.id}
                        type="button"
                        onClick={() => handleExamSelect(exam.id)}
                        aria-pressed={isActive}
                        className="inline-flex rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-bright/50 focus-visible:ring-offset-1 transition-transform active:scale-[0.97] cursor-pointer"
                      >
                        <HChip
                          variant={isActive ? 'emerald' : 'soft'}
                          className={`gap-1.5 px-3.5 py-2 text-[13px] font-semibold cursor-pointer ${
                            isActive
                              ? 'bg-islamic text-white shadow-md shadow-islamic/30'
                              : 'bg-white ring-1 ring-islamic/15 text-islamic-dark'
                          }`}
                        >
                          {loc(language, exam, 'name') || exam.name}
                          {idx === 0 && (
                            <HChip variant="gold" size="sm" className="gap-0.5 px-1.5 py-0.5 text-[9px] font-bold">
                              <Sparkles className="w-2.5 h-2.5" />
                              {t('results.latestExam')}
                            </HChip>
                          )}
                          {exam.date && (
                            <span className="opacity-60 hidden sm:inline">
                              · {exam.date}
                            </span>
                          )}
                        </HChip>
                      </button>
                    );
                  })}
                </div>

                {/* ===== Class filter (only when the exam spans classes) ===== */}
                {examClasses.length > 1 && (
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    <button
                      type="button"
                      onClick={() => setClassFilter('all')}
                      aria-pressed={classFilter === 'all'}
                      className="inline-flex rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-bright/50 transition-transform active:scale-[0.97] cursor-pointer"
                    >
                      <HChip
                        variant={classFilter === 'all' ? 'emerald' : 'soft'}
                        size="sm"
                        className={`text-[11px] px-3 cursor-pointer ${
                          classFilter === 'all'
                            ? 'bg-islamic text-white shadow-md shadow-islamic/30'
                            : 'bg-white ring-1 ring-islamic/15 text-islamic-dark'
                        }`}
                      >
                        {t('results.allClasses')}
                      </HChip>
                    </button>
                    {examClasses.map((cls) => (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => setClassFilter(cls)}
                        aria-pressed={classFilter === cls}
                        className="inline-flex rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-bright/50 transition-transform active:scale-[0.97] cursor-pointer"
                      >
                        <HChip
                          variant={classFilter === cls ? 'emerald' : 'soft'}
                          size="sm"
                          className={`text-[11px] px-3 cursor-pointer ${
                            classFilter === cls
                              ? 'bg-islamic text-white shadow-md shadow-islamic/30'
                              : 'bg-white ring-1 ring-islamic/15 text-islamic-dark'
                          }`}
                        >
                          {cls}
                        </HChip>
                      </button>
                    ))}
                  </div>
                )}

                {/* ===== Stats (selected exam only) — editorial print figures ===== */}
                {statCards.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    {statCards.map((card, i) => (
                      <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full"
                      >
                        <StatCard
                          icon={card.icon}
                          tone={card.tone}
                          label={card.label}
                          value={
                            <>
                              {card.value}
                              {card.extra && (
                                <span className="text-sm font-medium text-muted-foreground"> {card.extra}</span>
                              )}
                            </>
                          }
                        />
                      </motion.div>
                    ))}
                  </div>
                )}

                {meritList.length > 0 ? (
                  <>
                    {/* ===== Top 3 Podium (only when no search narrows it) ===== */}
                    {!q && filteredMerit.length >= 3 && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto items-end">
                        {/* 2nd Place */}
                        <motion.div
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                          className="order-2 md:order-1 h-full"
                        >
                          <HCard className="h-full">
                            <div className="relative w-full flex flex-col items-center py-6 px-4">
                              <div className="relative mb-3">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-white to-gold-soft p-[3px] shadow-lg">
                                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                                    <Medal className="w-7 h-7 text-golden" />
                                  </div>
                                </div>
                                <span className="absolute -top-1.5 -end-1.5 w-6 h-6 rounded-full bg-gold-soft text-eclipse text-[10px] font-black grid place-items-center shadow">{num(2, language)}</span>
                              </div>
                              <p className="font-bold text-islamic-dark text-center">{filteredMerit[1]?.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{filteredMerit[1]?.className || filteredMerit[1]?.department}</p>
                              <div className="mt-3 bg-white ring-1 ring-border rounded-xl px-5 py-2.5 text-center">
                                <p className="text-xl font-black text-islamic-dark">{num(filteredMerit[1]?.obtained ?? 0, language)}</p>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('results.secondPlace')}</p>
                              </div>
                            </div>
                          </HCard>
                        </motion.div>

                        {/* 1st Place */}
                        <motion.div
                          initial={{ opacity: 0, y: 30, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                          className="order-1 md:order-2 relative h-full"
                        >
                          <HCard
                            topRule="gold"
                            className="h-full gap-0 rounded-3xl bg-gradient-to-b from-golden-lighter/90 via-white to-white border-2 border-gold-bright/40"
                          >
                            <div className="relative w-full flex flex-col items-center py-8 px-4">
                              <div className="relative mb-3">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold-soft via-gold-bright to-golden p-[3px] shadow-xl shadow-gold-bright/30">
                                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                                    <Trophy className="w-9 h-9 text-golden" />
                                  </div>
                                </div>
                                <div className="animate-breathe absolute -top-3 -end-2 w-9 h-9 rounded-full bg-gradient-to-br from-gold-bright to-golden text-eclipse text-xs font-black grid place-items-center shadow-lg ring-2 ring-white">
                                  {t('results.first')}
                                </div>
                              </div>
                              <p className="font-black text-lg text-islamic-dark text-center">{filteredMerit[0]?.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{filteredMerit[0]?.className || filteredMerit[0]?.department}</p>
                              <div className="mt-3 bg-gradient-to-r from-golden-lighter to-gold-soft/30 ring-1 ring-gold-bright/40 rounded-2xl px-6 py-3 text-center">
                                <p className="text-2xl font-black text-islamic-dark">{num(filteredMerit[0]?.obtained ?? 0, language)}</p>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-golden">{t('results.champion')}</p>
                              </div>
                            </div>
                          </HCard>
                        </motion.div>

                        {/* 3rd Place */}
                        <motion.div
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                          className="order-3 h-full"
                        >
                          <HCard className="h-full">
                            <div className="relative w-full flex flex-col items-center py-6 px-4">
                              <div className="relative mb-3">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-golden-lighter to-golden p-[3px] shadow-lg">
                                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                                    <Medal className="w-7 h-7 text-golden" />
                                  </div>
                                </div>
                                <span className="absolute -top-1.5 -end-1.5 w-6 h-6 rounded-full bg-golden text-eclipse text-[10px] font-black grid place-items-center shadow">{num(3, language)}</span>
                              </div>
                              <p className="font-bold text-islamic-dark text-center">{filteredMerit[2]?.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{filteredMerit[2]?.className || filteredMerit[2]?.department}</p>
                              <div className="mt-3 bg-golden-lighter/60 ring-1 ring-golden/30 rounded-xl px-5 py-2.5 text-center">
                                <p className="text-xl font-black text-islamic-dark">{num(filteredMerit[2]?.obtained ?? 0, language)}</p>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-golden">{t('results.thirdPlace')}</p>
                              </div>
                            </div>
                          </HCard>
                        </motion.div>
                      </div>
                    )}

                    {/* ===== Merit List card ===== */}
                    <HCard className="p-0 gap-0 rounded-3xl">
                      {/* Night header with gold flow */}
                      <div className="relative bg-night islamic-pattern-overlay px-4 sm:px-6 py-5">
                        <div className="absolute inset-0 bg-gradient-to-r from-night via-emerald-deep/80 to-night" aria-hidden="true" />
                        <div className="absolute inset-0 islamic-pattern-overlay opacity-[0.07]" aria-hidden="true" />
                        <div className="relative flex flex-wrap items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-gold-bright/15 ring-1 ring-gold-bright/40 flex items-center justify-center shrink-0">
                            <Award className="w-5 h-5 text-gold-soft" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center flex-wrap gap-2">
                              <Heading level={3} className="text-white font-black text-sm sm:text-base">{t('results.meritList')}</Heading>
                              {isLatestExam && (
                                <HChip variant="gold" className="gap-1 px-2 py-0.5 text-[10px] font-bold">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  {t('results.latestExam')}
                                </HChip>
                              )}
                            </div>
                            <p className="text-white/55 text-xs mt-0.5">
                              {examName(activeExamId)}
                              {activeExam?.date ? ` · ${activeExam.date}` : ''}
                              {' · '}
                              {t('results.meritSubtitle', { count: num(filteredMerit.length, language) })}
                            </p>
                          </div>
                          {/* Toolbar */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <HButton
                              variant="outline"
                              onClick={() => downloadMeritCsv(filteredMerit, examName(activeExamId))}
                              aria-label={t('results.downloadCsv')}
                              isIconOnly
                              size="sm"
                              className="h-9 md:h-9 w-9 rounded-xl bg-white/10 border-white/15 text-white hover:bg-gold-bright/25 hover:border-gold-bright/40 hover:text-gold-soft cursor-pointer"
                            >
                              <Download className="w-4 h-4" />
                            </HButton>
                            <HButton
                              variant="outline"
                              onClick={handlePrint}
                              aria-label={t('results.printList')}
                              isIconOnly
                              size="sm"
                              className="h-9 md:h-9 w-9 rounded-xl bg-white/10 border-white/15 text-white hover:bg-gold-bright/25 hover:border-gold-bright/40 hover:text-gold-soft cursor-pointer"
                            >
                              <Printer className="w-4 h-4" />
                            </HButton>
                          </div>
                        </div>
                        <div className="gold-flow-line mt-4" aria-hidden="true" />
                      </div>

                      {/* Search box */}
                      <div className="px-4 sm:px-6 py-3.5 bg-white border-b border-islamic/8">
                        <div className="relative max-w-md mx-auto sm:mx-0">
                          <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('results.searchMerit')}
                            className="w-full h-11 ps-10 pe-10 rounded-full border border-islamic/12 bg-paper/60 text-sm focus:outline-none focus:ring-2 focus:ring-gold-bright/40 focus:border-gold-bright/50 transition-all"
                          />
                          {q && (
                            <button
                              onClick={() => setSearchQuery('')}
                              className="absolute end-3 top-1/2 -translate-y-1/2 w-6 h-6 grid place-items-center rounded-full text-muted-foreground hover:text-islamic hover:bg-islamic-lighter cursor-pointer"
                              aria-label={t('common.cancel')}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="divide-y divide-islamic/5 max-h-[560px] overflow-y-auto results-scroll">
                          <AnimatePresence>
                            {filteredMerit.map((result, index) => (
                              <motion.div
                                key={result.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: Math.min(index * 0.04, 0.5) }}
                                className={`flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3.5 sm:py-4 hover:bg-golden-lighter/20 transition-colors ${
                                  !q && index < 3 ? getRankBg(index) : 'bg-white'
                                }`}
                              >
                                {/* Rank medallion */}
                                <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                                  !q && result.rank === 1
                                    ? 'bg-gradient-to-br from-gold-soft via-gold-bright to-golden shadow-md shadow-gold-bright/30 ring-2 ring-gold-bright/40'
                                    : !q && result.rank === 2
                                      ? 'bg-gradient-to-br from-white to-gold-soft shadow-md ring-2 ring-golden/30'
                                      : !q && result.rank === 3
                                        ? 'bg-gradient-to-br from-golden-lighter to-golden shadow-md ring-2 ring-golden/40'
                                        : 'bg-islamic-lighter/70 ring-1 ring-islamic/10'
                                }`}>
                                  {!q && index < 3 ? (
                                    getRankIcon(index, (n) => num(n, language))
                                  ) : (
                                    <span className="text-xs font-black text-islamic">{num(result.rank, language)}</span>
                                  )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-islamic-dark text-sm sm:text-base truncate">{result.name}</p>
                                    {!q && result.rank === 1 && (
                                      <HChip variant="gold" className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-bold">
                                        {t('results.champion')}
                                      </HChip>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
                                    {result.roll && (
                                      <span className="text-xs text-muted-foreground">{t('student.rollNumber')} {result.roll}</span>
                                    )}
                                    {result.className && (
                                      <span className="text-xs text-muted-foreground hidden sm:inline">| {result.className}</span>
                                    )}
                                    {result.department && (
                                      <span className="text-xs text-muted-foreground hidden md:inline">| {result.department}</span>
                                    )}
                                  </div>
                                  {/* Progress bar */}
                                  <div className="mt-2 hidden sm:block">
                                    <div className="w-full h-1.5 bg-islamic-lighter/60 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full bg-gradient-to-r ${getGradeColor(result.grade)} transition-all duration-700`}
                                        style={{ width: `${Math.min(result.percentage, 100)}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Marks & Grade */}
                                <div className="text-right shrink-0">
                                  <p className="font-black text-islamic-dark text-sm sm:text-lg leading-none">
                                    {num(result.obtained, language)}
                                    <span className="text-xs text-muted-foreground font-normal">/{num(result.total, language)}</span>
                                  </p>
                                  <span title={getGradeLabel(result.grade, t)} className="inline-flex">
                                    <HChip
                                      variant="soft"
                                      className={`mt-1.5 text-[10px] sm:text-xs px-2 py-0.5 rounded-full ring-1 ${
                                        result.grade === 'A+' ? 'bg-islamic-lighter text-islamic ring-islamic/30' :
                                        result.grade === 'A' ? 'bg-islamic-lighter/60 text-islamic-dark ring-islamic/20' :
                                        result.grade === 'B' ? 'bg-golden-lighter/70 text-golden ring-golden/30' :
                                        result.grade === 'C' ? 'bg-golden-lighter text-golden ring-golden/40' :
                                        result.grade === 'F' ? 'bg-golden-lighter text-islamic-dark ring-golden/50' :
                                        'bg-paper text-muted-foreground ring-border'
                                      }`}
                                    >
                                      {result.grade}
                                    </HChip>
                                  </span>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>

                        {q && filteredMerit.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <div className="w-14 h-14 rounded-full bg-paper grid place-items-center mb-2">
                              <Search className="size-6 opacity-25" />
                            </div>
                            <p className="text-sm">{t('results.notFoundInMerit')}</p>
                          </div>
                        )}
                      </div>
                    </HCard>
                  </>
                ) : (
                  <HCard className="max-w-lg mx-auto text-muted-foreground">
                    <div className="relative w-full flex flex-col items-center justify-center px-6 py-10">
                      <div className="w-20 h-20 rounded-full bg-islamic-lighter/60 ring-1 ring-islamic/10 flex items-center justify-center mb-4">
                        <FolderOpen className="size-9 opacity-30" />
                      </div>
                      <p className="text-sm font-semibold text-islamic-dark">{t('results.noResultsForExam')}</p>
                    </div>
                  </HCard>
                )}
              </div>
            </motion.div>
          </Tabs.Panel>

          {/* Routine Tab */}
          <Tabs.Panel id="routine" className="mt-8 md:mt-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {storeRoutine.length > 0 ? (
                <HCard className="p-0 gap-0 rounded-3xl">
                  <div className="relative bg-night islamic-pattern-overlay px-4 sm:px-6 py-5">
                    <div className="absolute inset-0 bg-gradient-to-r from-night via-emerald-deep/80 to-night" aria-hidden="true" />
                    <div className="relative flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gold-bright/15 ring-1 ring-gold-bright/40 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-gold-soft" />
                      </div>
                      <div>
                        <Heading level={3} className="text-white font-black text-sm sm:text-base">{t('footer.classRoutine')}</Heading>
                        <p className="text-white/55 text-xs mt-0.5">{t('results.weeklyActivities')}</p>
                      </div>
                    </div>
                    <div className="gold-flow-line mt-4" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="divide-y divide-islamic/5">
                      {storeRoutine.map((item, index) => (
                        <div key={index} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3.5 sm:py-4 hover:bg-golden-lighter/20 transition-colors">
                          <IconMedallion icon={Clock} tone="emerald" className="size-10" />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-islamic-dark text-sm">{item.subject}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">{item.teacher}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-bold text-islamic">{item.time}</p>
                            <p className="text-[10px] text-muted-foreground">{item.duration}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </HCard>
              ) : (
                <HCard className="max-w-lg mx-auto text-muted-foreground">
                  <div className="relative w-full flex flex-col items-center justify-center px-6 py-10">
                    <div className="w-20 h-20 rounded-full bg-islamic-lighter/60 ring-1 ring-islamic/10 flex items-center justify-center mb-4">
                      <FolderOpen className="size-9 opacity-30" />
                    </div>
                    <p className="text-sm font-semibold text-islamic-dark">{t('results.routineComingSoon')}</p>
                  </div>
                </HCard>
              )}
            </motion.div>
          </Tabs.Panel>

          {/* Syllabus Tab */}
          <Tabs.Panel id="syllabus" className="mt-8 md:mt-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {storeSyllabus.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {storeSyllabus.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="h-full"
                    >
                      <HCard className="h-full group cursor-pointer">
                        <div className="flex flex-col items-center gap-3 text-center w-full">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-islamic-lighter to-islamic/10 flex items-center justify-center shrink-0 group-hover:from-gold-soft group-hover:to-gold-bright transition-all">
                            <BookOpen className="w-5 h-5 text-islamic group-hover:text-warning transition-colors" />
                          </div>
                          <div className="w-full min-w-0">
                            <Heading level={4} className="text-sm font-bold text-islamic-dark group-hover:text-islamic transition-colors truncate">
                              {item.name}
                            </Heading>
                            <p className="text-xs text-muted-foreground">{item.year}</p>
                          </div>
                          <Download className="w-4 h-4 text-muted-foreground/40 group-hover:text-gold-bright group-hover:translate-x-0.5 transition-all rtl:-scale-x-100" />
                        </div>
                      </HCard>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <HCard className="max-w-lg mx-auto text-muted-foreground">
                  <div className="relative w-full flex flex-col items-center justify-center px-6 py-10">
                    <div className="w-20 h-20 rounded-full bg-islamic-lighter/60 ring-1 ring-islamic/10 flex items-center justify-center mb-4">
                      <FolderOpen className="size-9 opacity-30" />
                    </div>
                    <p className="text-sm font-semibold text-islamic-dark">{t('results.syllabusComingSoon')}</p>
                  </div>
                </HCard>
              )}
            </motion.div>
          </Tabs.Panel>
        </Tabs>
      </div>
    </section>
  );
}
