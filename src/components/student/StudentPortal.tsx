'use client';

import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ArrowLeft, Download, Award, User, FileText,
  Loader2, GraduationCap, X, Hash, BookOpen, CheckCircle,
  TrendingUp, Shield, Printer, ChevronRight,
  BarChart3, Target, FileSpreadsheet, Share2, Trophy,
  AlertCircle, Star, Clock, Medal, SearchX, Info,
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { navigateTo } from '@/lib/navigate';
import { useToast } from '@/hooks/use-toast';
import type { ExamResult } from '@/types/database';
import { HButton, IconMedallion } from '@/components/heroui/islamic';
import { Input } from '@heroui/react/input';
import { Label } from '@heroui/react/label';
import { Card } from '@heroui/react/card';
import { Chip } from '@heroui/react/chip';
import { Separator } from '@heroui/react/separator';
import { ProgressBar } from '@heroui/react/progress-bar';
import { Select } from '@heroui/react/select';
import { ListBox } from '@heroui/react/list-box';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useTranslation } from '@/lib/i18n-context';
import { loc } from '@/lib/multilingual';
import { escapeHtml } from '@/lib/format';
import { isExamPublished, sortExamsNewestFirst } from '@/lib/results-service';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const toBangla = (n: number) => n.toString().replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[parseInt(d)]);

function getGradeColor(grade: string) {
  switch (grade) {
    case 'A+': return { bg: 'bg-primary', text: 'text-primary', bgLight: 'bg-primary/10', border: 'border-primary/25', progress: 'bg-primary' };
    case 'A': return { bg: 'bg-primary', text: 'text-primary', bgLight: 'bg-primary/10', border: 'border-primary/25', progress: 'bg-primary' };
    case 'A-': return { bg: 'bg-primary', text: 'text-primary', bgLight: 'bg-primary/10', border: 'border-primary/25', progress: 'bg-primary' };
    case 'B': return { bg: 'bg-warning', text: 'text-warning-foreground', bgLight: 'bg-warning/15', border: 'border-warning/40', progress: 'bg-warning' };
    case 'C': return { bg: 'bg-warning', text: 'text-warning-foreground', bgLight: 'bg-warning/15', border: 'border-warning/40', progress: 'bg-warning' };
    case 'D': return { bg: 'bg-warning', text: 'text-warning-foreground', bgLight: 'bg-warning/15', border: 'border-warning/40', progress: 'bg-warning' };
    case 'F': return { bg: 'bg-danger', text: 'text-danger', bgLight: 'bg-danger/10', border: 'border-danger/40', progress: 'bg-danger' };
    default: return { bg: 'bg-gradient-to-r from-muted-foreground/40 to-muted-foreground/60', text: 'text-muted-foreground', bgLight: 'bg-surface-tertiary/50', border: 'border-border', progress: 'from-muted-foreground/40 to-muted-foreground/60' };
  }
}

function getGradeLabel(grade: string, t: (key: string) => string): string {
  switch (grade) {
    case 'A+': return t('studentPortal.gradeExcellent');
    case 'A': return t('studentPortal.gradeGood');
    case 'A-': return t('studentPortal.gradeGood');
    case 'B': return t('studentPortal.gradeFair');
    case 'C': return t('studentPortal.gradeAverage');
    case 'D': return t('studentPortal.gradeSatisfactory');
    case 'F': return t('studentPortal.failed');
    default: return '—';
  }
}

function getGradePoint(marks: number): number {
  if (marks >= 80) return 5.00;
  if (marks >= 70) return 4.00;
  if (marks >= 60) return 3.50;
  if (marks >= 50) return 3.00;
  if (marks >= 40) return 2.00;
  if (marks >= 33) return 1.00;
  return 0.00;
}

function getGradeFromMarks(marks: number): string {
  if (marks >= 80) return 'A+';
  if (marks >= 70) return 'A';
  if (marks >= 60) return 'A-';
  if (marks >= 50) return 'B';
  if (marks >= 40) return 'C';
  if (marks >= 33) return 'D';
  return 'F';
}

function getMarkColor(obtained: number, full: number) {
  const pct = full > 0 ? (obtained / full) * 100 : 0;
  if (pct >= 80) return 'text-primary';
  if (pct >= 60) return 'text-primary';
  if (pct >= 40) return 'text-warning-foreground';
  if (pct >= 33) return 'text-warning-foreground';
  return 'text-danger';
}

function getMarkBg(obtained: number, full: number) {
  const pct = full > 0 ? (obtained / full) * 100 : 0;
  if (pct >= 80) return 'bg-primary/5';
  if (pct >= 60) return 'bg-primary/5';
  if (pct >= 40) return 'bg-warning/15';
  if (pct >= 33) return 'bg-warning/15';
  return 'bg-danger/10';
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

type ViewMode = 'marksheet' | 'transcript';

export default function StudentPortal() {
  const { results, departments, siteInfo, exams } = useAppStore();
  const { toast } = useToast();
  const { t, language } = useTranslation();

  // Site name per selected language — Firebase only, no hardcoded fallback
  const siteName = language === 'ar' ? siteInfo?.nameAr || siteInfo?.name : language === 'en' ? siteInfo?.nameEn || siteInfo?.name : siteInfo?.name;

  // Localized exam display name (multilingual exam record preferred)
  const examDisplayName = (r: ExamResult) => {
    const exam = exams.find((e) => e.id === r.examId);
    return exam ? loc(language, exam, 'name') || r.examName : r.examName;
  };

  // Language-aware digits (Bangla numerals for bn) and date locale
  const num = (n: number) => (language === 'bn' ? toBangla(n) : String(n));
  const dateLocale = language === 'bn' ? 'bn-BD' : language;

  const marksheetRef = useRef<HTMLDivElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const [rollInput, setRollInput] = useState('');
  const [departmentInput, setDepartmentInput] = useState('');
  const [classInput, setClassInput] = useState('');
  const [regInput, setRegInput] = useState('');
  const [examFilter, setExamFilter] = useState('');
  const [searchResults, setSearchResults] = useState<ExamResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [searching, setSearching] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('marksheet');

  /* ---------- published-exam visibility (mirrors public Results page) ---------- */

  const examById = useMemo(() => new Map(exams.map((e) => [e.id, e])), [exams]);

  // Only results of published exams are searchable publicly.
  const publicResults = useMemo(
    () => results.filter((r) => isExamPublished(examById.get(r.examId))),
    [results, examById]
  );

  // Published exams (newest first) for the optional exam filter select.
  const publishedExams = useMemo(
    () => sortExamsNewestFirst(exams).filter((e) => isExamPublished(e)),
    [exams]
  );

  /* ---------- form options ---------- */

  const departmentOptions = useMemo(() => {
    return [...departments]
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((d) => d.name);
  }, [departments]);

  const classOptions = useMemo(() => {
    if (departmentInput) {
      const selectedDept = departments.find((d) => d.name === departmentInput);
      if (selectedDept && selectedDept.classes && selectedDept.classes.length > 0) {
        return [...selectedDept.classes].sort();
      }
      const classSet = new Set<string>();
      publicResults.forEach((r) => {
        if (r.department === departmentInput && r.class) {
          classSet.add(r.class);
        }
      });
      return Array.from(classSet).sort();
    }
    const classSet = new Set<string>();
    publicResults.forEach((r) => {
      if (r.class) classSet.add(r.class);
    });
    return Array.from(classSet).sort();
  }, [departments, departmentInput, publicResults]);

  /* ---------- aggregation for transcript (published results only) ---------- */

  const allStudentResults = useMemo(() => {
    if (!selectedResult) return [];
    const regNum = selectedResult.registrationNumber;
    const roll = selectedResult.studentRoll;
    const name = selectedResult.studentName.toLowerCase();

    const aggregated = publicResults.filter((r) => {
      // Match by registration number if available
      if (regNum && r.registrationNumber === regNum) return true;
      // Match by roll number
      if (roll && r.studentRoll === roll && r.studentName.toLowerCase() === name) return true;
      return false;
    });

    // Sort by createdAt ascending (chronological)
    aggregated.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    return aggregated;
  }, [selectedResult, publicResults]);

  /* ---------- GPA for current selected result ---------- */

  const currentGPA = useMemo(() => {
    if (!selectedResult || !selectedResult.subjects?.length) return 0;
    let totalGP = 0;
    let count = 0;
    selectedResult.subjects.forEach((s) => {
      const pct = s.fullMarks > 0 ? (s.obtainedMarks / s.fullMarks) * 100 : 0;
      totalGP += getGradePoint(pct >= 80 ? 80 : pct >= 70 ? 70 : pct >= 60 ? 60 : pct >= 50 ? 50 : pct >= 40 ? 40 : pct >= 33 ? 33 : 0);
      count++;
    });
    return count > 0 ? totalGP / count : 0;
  }, [selectedResult]);

  /* ---------- merit position (published cohort only) ---------- */

  const meritPosition = useMemo(() => {
    if (!selectedResult) return null;
    const sameExamResults = publicResults.filter((r) =>
      r.examId === selectedResult.examId && r.department === selectedResult.department && r.class === selectedResult.class
    );
    if (sameExamResults.length <= 1) return null;
    sameExamResults.sort((a, b) => (b.obtainedTotal || 0) - (a.obtainedTotal || 0));
    const idx = sameExamResults.findIndex((r) => r.id === selectedResult.id);
    return idx >= 0 ? idx + 1 : null;
  }, [selectedResult, publicResults]);

  /* ---------- transcript analysis ---------- */

  const transcriptAnalysis = useMemo(() => {
    if (allStudentResults.length === 0) return { gpaTrend: [] as { examName: string; gpa: number; grade: string; createdAt: number }[], bestSubject: '', worstSubject: '', overallGPA: 0 };

    const gpaTrend = allStudentResults.map((r) => {
      const subjects = r.subjects || [];
      let totalGP = 0;
      let count = 0;
      subjects.forEach((s) => {
        const pct = s.fullMarks > 0 ? (s.obtainedMarks / s.fullMarks) * 100 : 0;
        const marksForGP = pct >= 80 ? 80 : pct >= 70 ? 70 : pct >= 60 ? 60 : pct >= 50 ? 50 : pct >= 40 ? 40 : pct >= 33 ? 33 : 0;
        totalGP += getGradePoint(marksForGP);
        count++;
      });
      const gpa = count > 0 ? totalGP / count : 0;
      return { examName: examDisplayName(r), gpa, grade: r.grade, createdAt: r.createdAt };
    });

    // Aggregate subject performance across all exams
    const subjectScores: Record<string, { total: number; count: number; totalMarks: number }> = {};
    allStudentResults.forEach((r) => {
      (r.subjects || []).forEach((s) => {
        if (!subjectScores[s.name]) {
          subjectScores[s.name] = { total: 0, count: 0, totalMarks: 0 };
        }
        subjectScores[s.name].total += s.obtainedMarks;
        subjectScores[s.name].count += 1;
        subjectScores[s.name].totalMarks += s.fullMarks;
      });
    });

    let bestSubject = '';
    let worstSubject = '';
    let bestPct = -1;
    let worstPct = 101;

    Object.entries(subjectScores).forEach(([name, data]) => {
      const avgPct = data.totalMarks > 0 ? (data.total / data.totalMarks) * 100 : 0;
      if (avgPct > bestPct) { bestPct = avgPct; bestSubject = name; }
      if (avgPct < worstPct) { worstPct = avgPct; worstSubject = name; }
    });

    const overallGPA = gpaTrend.length > 0
      ? gpaTrend.reduce((sum, g) => sum + g.gpa, 0) / gpaTrend.length
      : 0;

    return { gpaTrend, bestSubject, worstSubject, overallGPA };
  }, [allStudentResults]);

  /* ================================================================== */
  /*  Search                                                             */
  /* ================================================================== */

  const handleSearch = async () => {
    if (searching) return;
    const roll = rollInput.trim().toLowerCase();
    const dept = departmentInput.trim().toLowerCase();
    const cls = classInput.trim().toLowerCase();
    const reg = regInput.trim().toLowerCase();

    if (!reg && !roll) {
      toast({ title: t('common.error'), description: t('student.validation.rollRequired'), variant: 'destructive' });
      return;
    }
    if (!reg && (!dept || !cls)) {
      if (!dept) {
        toast({ title: t('common.error'), description: t('student.validation.regOrDept'), variant: 'destructive' });
      } else {
        toast({ title: t('common.error'), description: t('student.validation.selectClass'), variant: 'destructive' });
      }
      return;
    }

    setSearching(true);
    setSearched(true);
    setSearchResults([]);
    await new Promise((r) => setTimeout(r, 350));

    // Optional extra filters (exam / department / class) apply in both modes.
    const inExam = (r: ExamResult) => !examFilter || r.examId === examFilter;
    const inDept = (r: ExamResult) => !dept || (r.department || '').toLowerCase() === dept;
    const inClass = (r: ExamResult) => !cls || (r.class || '').toLowerCase() === cls;

    const pool = publicResults.filter((r) => inExam(r) && inDept(r) && inClass(r));

    let filtered: ExamResult[] = [];
    if (reg) {
      // Registration: exact match wins, then partial (only useful for longer input).
      const exact = pool.filter((r) => (r.registrationNumber || '').toLowerCase() === reg);
      filtered = exact.length > 0
        ? exact
        : pool.filter((r) => (r.registrationNumber || '').toLowerCase().includes(reg));
    } else {
      // Roll: exact match wins; partial match only as a fallback so that
      // searching "1" no longer surfaces every roll containing a 1.
      const exact = pool.filter((r) => (r.studentRoll || '').toLowerCase() === roll);
      filtered = exact.length > 0
        ? exact
        : pool.filter((r) => (r.studentRoll || '').toLowerCase().includes(roll));
    }

    filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    setSearchResults(filtered);
    setSelectedResult(null);
    setViewMode('marksheet');
    setSearching(false);
  };

  const handleReset = () => {
    setRollInput('');
    setDepartmentInput('');
    setClassInput('');
    setRegInput('');
    setExamFilter('');
    setSearchResults([]);
    setSearched(false);
    setSelectedResult(null);
    setViewMode('marksheet');
  };

  const handleSelectResult = (result: ExamResult) => {
    setSelectedResult(result);
    setViewMode('marksheet');
  };

  const handleBackToResults = () => {
    setSelectedResult(null);
    setViewMode('marksheet');
  };

  /* ================================================================== */
  /*  Share / print / pdf                                                */
  /* ================================================================== */

  const percentage = selectedResult && selectedResult.totalMarks > 0
    ? ((selectedResult.obtainedTotal || 0) / selectedResult.totalMarks) * 100
    : 0;
  const gradeColor = selectedResult ? getGradeColor(selectedResult.grade) : getGradeColor('F');

  /* WhatsApp share */
  const handleWhatsAppShare = () => {
    if (!selectedResult) return;
    const message = `📚 *${siteName || t('student.schoolName')}*\n\n` +
      `👤 ${t('studentPortal.student')}: ${selectedResult.studentName}\n` +
      `🔢 ${t('student.rollNumber')}: ${selectedResult.studentRoll}\n` +
      `📖 ${t('studentPortal.exam')}: ${examDisplayName(selectedResult)}\n` +
      `📊 ${t('studentPortal.marks')}: ${selectedResult.obtainedTotal}/${selectedResult.totalMarks}\n` +
      `🏆 ${t('studentPortal.grade')}: ${selectedResult.grade}\n` +
      `✅ ${t('studentPortal.result')}: ${selectedResult.grade !== 'F' ? t('studentPortal.passed') : t('studentPortal.failed')}`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  /* Print marksheet in a new clean window */
  const handlePrint = () => {
    if (!selectedResult) return;
    const subPct = (full: number, obtained: number) => full > 0 ? ((obtained / full) * 100) : 0;
    const markColor = (pct: number) => pct >= 80 ? '#0f766e' : pct >= 60 ? '#0f766e' : pct >= 50 ? '#f5a524' : pct >= 33 ? '#f5a524' : '#dc2626';
    const markBg = (pct: number) => pct >= 80 ? 'rgba(15, 118, 110, 0.12)' : pct >= 60 ? 'rgba(15, 118, 110, 0.12)' : pct >= 50 ? 'rgba(245, 165, 36, 0.18)' : pct >= 33 ? 'rgba(245, 165, 36, 0.18)' : 'rgba(220, 38, 38, 0.12)';
    const rowBg = (idx: number) => idx % 2 === 0 ? '#ffffff' : '#EAEAEB';
    const getGP = (obt: number, full: number) => {
      const p = full > 0 ? (obt / full) * 100 : 0;
      if (p >= 80) return '5.00';
      if (p >= 70) return '4.00';
      if (p >= 60) return '3.50';
      if (p >= 50) return '3.00';
      if (p >= 40) return '2.00';
      if (p >= 33) return '1.00';
      return '0.00';
    };
    const getGFromM = (obt: number, full: number) => {
      const p = full > 0 ? (obt / full) * 100 : 0;
      if (p >= 80) return 'A+'; if (p >= 70) return 'A'; if (p >= 60) return 'A-';
      if (p >= 50) return 'B'; if (p >= 40) return 'C'; if (p >= 33) return 'D'; return 'F';
    };

    const subjectsRows = (selectedResult.subjects || []).map((s, idx) => {
      const pct = subPct(s.fullMarks, s.obtainedMarks);
      const mc = markColor(pct);
      const mbg = markBg(pct);
      const rbg = rowBg(idx);
      const gp = getGP(s.obtainedMarks, s.fullMarks);
      const gr = getGFromM(s.obtainedMarks, s.fullMarks);
      return `<tr style="background:${rbg}">
        <td style="padding:9px 12px;border-bottom:1px solid #e4e4e7;font-size:12px">${escapeHtml(s.name)}</td>
        <td style="padding:9px 12px;text-align:center;border-bottom:1px solid #e4e4e7;color:#71717a;font-size:12px">${s.fullMarks}</td>
        <td style="padding:9px 12px;text-align:center;border-bottom:1px solid #e4e4e7;font-weight:bold;color:${mc};font-size:12px">${s.obtainedMarks}</td>
        <td style="padding:9px 12px;text-align:center;border-bottom:1px solid #e4e4e7;font-size:12px">${gr}</td>
        <td style="padding:9px 12px;text-align:center;border-bottom:1px solid #e4e4e7;font-size:12px">${gp}</td>
        <td style="padding:9px 12px;text-align:center;border-bottom:1px solid #e4e4e7">
          <span style="display:inline-block;background:${mbg};padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;color:${mc}">${pct.toFixed(0)}%</span>
        </td>
      </tr>`;
    }).join('');

    const gradeBannerBg = selectedResult.grade !== 'F'
      ? '#0f766e'
      : '#dc2626';
    const gradeResult = selectedResult.grade !== 'F'
      ? t('studentPortal.passed')
      : t('studentPortal.failed');
    const pct = percentage;
    const totalExaminees = publicResults.filter((r) => r.examId === selectedResult.examId && r.department === selectedResult.department && r.class === selectedResult.class).length;
    const meritStr = meritPosition ? `<div>
      <p style="font-size:10px;color:#71717a;margin-bottom:2px;text-transform:uppercase;letter-spacing:0.5px">${t('studentPortal.position')}</p>
      <p style="font-size:15px;font-weight:bold;color:#0f766e"> ${t('studentPortal.meritOutOf', { position: num(meritPosition), total: num(totalExaminees) })}</p>
    </div>` : '';

    const htmlContent = `<!DOCTYPE html>
<html lang="${language}">
<head>
<meta charset="UTF-8">
<title>${t('studentPortal.marksheet')} - ${escapeHtml(selectedResult.studentName)}</title>
<link rel="stylesheet" href="https://cdnmx.pages.dev/assets/fonts/noto_serif_bengali/font.css">
<style>
  @page { size: A4; margin: 10mm; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Noto Serif Bengali', Arial, sans-serif !important; color: #18181b; background: #ffffff; padding: 40px; max-width: 800px; margin: 0 auto; }
  table { width: 100%; border-collapse: collapse; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <div style="height:6px;background:#0f766e;border-radius:3px;margin-bottom:24px"></div>
  <div style="text-align:center;padding-bottom:20px;margin-bottom:24px;border-bottom:2px solid #0f766e">
    <p style="font-size:18px;color:#f5a524;font-family:serif;direction:rtl;margin-bottom:8px">بسم الله الرحمن الرحيم</p>
    <h1 style="font-size:22px;font-weight:bold;color:#0f766e;margin:8px 0 4px;line-height:1.4">${escapeHtml(siteName)}</h1>
    ${siteInfo?.address ? `<p style="font-size:12px;color:#71717a;margin-top:4px">${escapeHtml(siteInfo.address)}</p>` : ''}
    <div style="display:inline-block;margin-top:12px;background:#0f766e;color:#fff;padding:6px 24px;border-radius:6px;letter-spacing:1px">
      <span style="font-size:13px;font-weight:bold">${t('studentPortal.marksheetBanner')}</span>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;background:rgba(15,118,110,0.05);padding:16px;border-radius:10px;border:1px solid rgba(15,118,110,0.25)">
    <div>
      <p style="font-size:10px;color:#71717a;margin-bottom:2px;text-transform:uppercase;letter-spacing:0.5px">${t('studentPortal.studentName')}</p>
      <p style="font-size:15px;font-weight:bold;color:#0f766e">${escapeHtml(selectedResult.studentName)}</p>
    </div>
    <div>
      <p style="font-size:10px;color:#71717a;margin-bottom:2px;text-transform:uppercase;letter-spacing:0.5px">${t('student.rollNumber')}</p>
      <p style="font-size:15px;font-weight:bold;color:#0f766e">${escapeHtml(selectedResult.studentRoll)}</p>
    </div>
    <div>
      <p style="font-size:10px;color:#71717a;margin-bottom:2px;text-transform:uppercase;letter-spacing:0.5px">${t('studentPortal.department')}</p>
      <p style="font-size:14px;font-weight:600;color:#0f766e">${escapeHtml(selectedResult.department || '—')}</p>
    </div>
    <div>
      <p style="font-size:10px;color:#71717a;margin-bottom:2px;text-transform:uppercase;letter-spacing:0.5px">${t('student.class')}</p>
      <p style="font-size:14px;font-weight:600;color:#0f766e">${escapeHtml(selectedResult.class || '—')}</p>
    </div>
    ${selectedResult.registrationNumber ? `<div>
      <p style="font-size:10px;color:#71717a;margin-bottom:2px;text-transform:uppercase;letter-spacing:0.5px">${t('studentPortal.regNo')}</p>
      <p style="font-size:14px;font-weight:600;color:#0f766e">${escapeHtml(selectedResult.registrationNumber)}</p>
    </div>` : ''}
    ${meritStr}
    <div style="grid-column:1/-1">
      <p style="font-size:10px;color:#71717a;margin-bottom:2px;text-transform:uppercase;letter-spacing:0.5px">${t('studentPortal.examName')}</p>
      <p style="font-size:15px;font-weight:bold;color:#0f766e">${escapeHtml(examDisplayName(selectedResult))}</p>
    </div>
  </div>
  <table style="margin-bottom:20px;font-size:12px">
    <thead>
      <tr>
        <th style="background:#0f766e;color:#fff;padding:10px 12px;text-align:left;border-bottom:2px solid #0f766e;border-radius:8px 0 0 0">${t('studentPortal.subject')}</th>
        <th style="background:#0f766e;color:#fff;padding:10px 12px;text-align:center;border-bottom:2px solid #0f766e">${t('studentPortal.fullMarks')}</th>
        <th style="background:#0f766e;color:#fff;padding:10px 12px;text-align:center;border-bottom:2px solid #0f766e">${t('studentPortal.obtained')}</th>
        <th style="background:#0f766e;color:#fff;padding:10px 12px;text-align:center;border-bottom:2px solid #0f766e">${t('studentPortal.grade')}</th>
        <th style="background:#0f766e;color:#fff;padding:10px 12px;text-align:center;border-bottom:2px solid #0f766e">${t('studentPortal.gpa')}</th>
        <th style="background:#0f766e;color:#fff;padding:10px 12px;text-align:center;border-bottom:2px solid #0f766e;border-radius:0 8px 0 0">${t('studentPortal.percentage')}</th>
      </tr>
    </thead>
    <tbody>${subjectsRows}</tbody>
    <tfoot>
      <tr style="background:rgba(15,118,110,0.06);font-weight:bold">
        <td style="padding:12px 12px;font-size:13px;border-bottom:2px solid #0f766e">${t('common.total')}</td>
        <td style="padding:12px 12px;text-align:center;border-bottom:2px solid #0f766e">${escapeHtml(String(selectedResult.totalMarks))}</td>
        <td style="padding:12px 12px;text-align:center;border-bottom:2px solid #0f766e;color:#0f766e;font-size:14px">${escapeHtml(String(selectedResult.obtainedTotal))}</td>
        <td style="padding:12px 12px;text-align:center;border-bottom:2px solid #0f766e;color:#0f766e">${escapeHtml(selectedResult.grade)}</td>
        <td style="padding:12px 12px;text-align:center;border-bottom:2px solid #0f766e;color:#0f766e">${currentGPA.toFixed(2)}</td>
        <td style="padding:12px 12px;text-align:center;border-bottom:2px solid #0f766e;color:#0f766e">${pct.toFixed(1)}%</td>
      </tr>
    </tfoot>
  </table>
  <div style="display:flex;align-items:center;justify-content:space-between;background:${gradeBannerBg};border-radius:12px;padding:20px 24px;color:#fff;margin-bottom:20px">
    <div>
      <p style="font-size:11px;opacity:0.7;margin-bottom:4px">${t('studentPortal.grade')}</p>
      <p style="font-size:32px;font-weight:900;line-height:1;margin:4px 0">${escapeHtml(selectedResult.grade)}</p>
      <p style="font-size:12px;opacity:0.8;margin-top:4px">${getGradeLabel(selectedResult.grade, t)}</p>
    </div>
    <div style="text-align:center">
      <p style="font-size:11px;opacity:0.7;margin-bottom:4px">${t('studentPortal.gpa')}</p>
      <p style="font-size:28px;font-weight:900;line-height:1">${currentGPA.toFixed(2)}</p>
      <p style="font-size:11px;opacity:0.8;margin-top:4px">${t('studentPortal.outOf5')}</p>
    </div>
    <div style="text-align:right">
      <p style="font-size:11px;opacity:0.7;margin-bottom:4px">${t('studentPortal.result')}</p>
      <p style="font-size:20px;font-weight:bold">${gradeResult}</p>
    </div>
  </div>
  <div style="display:flex;justify-content:space-between;align-items:center;font-size:10px;color:#71717a;border-top:1px solid #e4e4e7;padding-top:12px;margin-top:16px">
    <p>${t('studentPortal.cgMarksheet')}</p>
    <p>${t('common.date')}: ${new Date().toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>
  <div style="height:6px;background:#0f766e;border-radius:3px;margin-top:20px"></div>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.onafterprint = () => printWindow.close();
        }, 800);
      };
    } else {
      toast({ title: t('common.error'), description: t('student.validation.popupBlocked'), variant: 'destructive' });
    }
  };

  /* Print transcript */
  const handlePrintTranscript = () => {
    if (!selectedResult) return;
    const getGP = (obt: number, full: number) => {
      const p = full > 0 ? (obt / full) * 100 : 0;
      if (p >= 80) return '5.00'; if (p >= 70) return '4.00'; if (p >= 60) return '3.50';
      if (p >= 50) return '3.00'; if (p >= 40) return '2.00'; if (p >= 33) return '1.00'; return '0.00';
    };
    const getGFromM = (obt: number, full: number) => {
      const p = full > 0 ? (obt / full) * 100 : 0;
      if (p >= 80) return 'A+'; if (p >= 70) return 'A'; if (p >= 60) return 'A-';
      if (p >= 50) return 'B'; if (p >= 40) return 'C'; if (p >= 33) return 'D'; return 'F';
    };

    let examTables = '';
    allStudentResults.forEach((r) => {
      const subjects = r.subjects || [];
      let gpSum = 0;
      subjects.forEach((s) => { gpSum += parseFloat(getGP(s.obtainedMarks, s.fullMarks)); });
      const examGPA = subjects.length > 0 ? (gpSum / subjects.length) : 0;

      const rows = subjects.map((s, idx) => {
        const gr = getGFromM(s.obtainedMarks, s.fullMarks);
        const gp = getGP(s.obtainedMarks, s.fullMarks);
        const bg = idx % 2 === 0 ? '#ffffff' : '#EAEAEB';
        return `<tr style="background:${bg}">
          <td style="padding:8px 12px;border-bottom:1px solid #e4e4e7;font-size:12px">${escapeHtml(s.name)}</td>
          <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #e4e4e7;font-size:12px">${s.fullMarks}</td>
          <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #e4e4e7;font-weight:bold;font-size:12px">${s.obtainedMarks}</td>
          <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #e4e4e7;font-size:12px">${gr}</td>
          <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #e4e4e7;font-size:12px">${gp}</td>
        </tr>`;
      }).join('');

      examTables += `
        <div style="margin-bottom:20px;page-break-inside:avoid">
          <h3 style="font-size:14px;font-weight:bold;color:#0f766e;margin-bottom:8px;padding:6px 12px;background:rgba(15,118,110,0.06);border-left:3px solid #0f766e;border-radius:0 6px 6px 0">
            ${t('studentPortal.exam')}: ${escapeHtml(examDisplayName(r))} ${r.department ? '(' + escapeHtml(r.department) + ')' : ''} ${r.class ? '- ' + escapeHtml(r.class) : ''}
          </h3>
          <table style="width:100%;border-collapse:collapse;margin-bottom:8px">
            <thead>
              <tr>
                <th style="background:#0f766e;color:#fff;padding:8px 12px;text-align:left;font-size:11px">${t('studentPortal.subject')}</th>
                <th style="background:#0f766e;color:#fff;padding:8px 12px;text-align:center;font-size:11px">${t('studentPortal.fullMarks')}</th>
                <th style="background:#0f766e;color:#fff;padding:8px 12px;text-align:center;font-size:11px">${t('studentPortal.obtained')}</th>
                <th style="background:#0f766e;color:#fff;padding:8px 12px;text-align:center;font-size:11px">${t('studentPortal.grade')}</th>
                <th style="background:#0f766e;color:#fff;padding:8px 12px;text-align:center;font-size:11px">${t('studentPortal.gpa')}</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
            <tfoot>
              <tr style="background:rgba(15,118,110,0.06);font-weight:bold">
                <td style="padding:8px 12px;border-top:2px solid #0f766e;font-size:12px">${t('common.total')}</td>
                <td style="padding:8px 12px;text-align:center;border-top:2px solid #0f766e;font-size:12px">${r.totalMarks}</td>
                <td style="padding:8px 12px;text-align:center;border-top:2px solid #0f766e;color:#0f766e;font-size:12px">${r.obtainedTotal}</td>
                <td style="padding:8px 12px;text-align:center;border-top:2px solid #0f766e;color:#0f766e;font-size:12px">${r.grade}</td>
                <td style="padding:8px 12px;text-align:center;border-top:2px solid #0f766e;color:#0f766e;font-size:12px">${examGPA.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>`;
    });

    const htmlContent = `<!DOCTYPE html>
<html lang="${language}">
<head>
<meta charset="UTF-8">
<title>${t('studentPortal.academicTranscript')} - ${escapeHtml(selectedResult.studentName)}</title>
<link rel="stylesheet" href="https://cdnmx.pages.dev/assets/fonts/noto_serif_bengali/font.css">
<style>
  @page { size: A4; margin: 10mm; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Noto Serif Bengali', Arial, sans-serif !important; color: #18181b; background: #ffffff; padding: 40px; max-width: 800px; margin: 0 auto; }
  table { width: 100%; border-collapse: collapse; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <div style="height:6px;background:#0f766e;border-radius:3px;margin-bottom:24px"></div>
  <div style="text-align:center;padding-bottom:20px;margin-bottom:24px;border-bottom:2px solid #0f766e">
    <p style="font-size:18px;color:#f5a524;font-family:serif;direction:rtl;margin-bottom:8px">بسم الله الرحمن الرحيم</p>
    <h1 style="font-size:22px;font-weight:bold;color:#0f766e;margin:8px 0 4px;line-height:1.4">${escapeHtml(siteName)}</h1>
    ${siteInfo?.address ? `<p style="font-size:12px;color:#71717a;margin-top:4px">${escapeHtml(siteInfo.address)}</p>` : ''}
    <div style="display:inline-block;margin-top:12px;background:#0f766e;color:#fff;padding:6px 24px;border-radius:6px;letter-spacing:1px">
      <span style="font-size:13px;font-weight:bold">${t('studentPortal.transcriptBanner')}</span>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;background:rgba(15,118,110,0.05);padding:16px;border-radius:10px;border:1px solid rgba(15,118,110,0.25)">
    <div>
      <p style="font-size:10px;color:#71717a;margin-bottom:2px;text-transform:uppercase;letter-spacing:0.5px">${t('studentPortal.studentName')}</p>
      <p style="font-size:15px;font-weight:bold;color:#0f766e">${escapeHtml(selectedResult.studentName)}</p>
    </div>
    <div>
      <p style="font-size:10px;color:#71717a;margin-bottom:2px;text-transform:uppercase;letter-spacing:0.5px">${t('student.rollNumber')}</p>
      <p style="font-size:15px;font-weight:bold;color:#0f766e">${escapeHtml(selectedResult.studentRoll)}</p>
    </div>
    ${selectedResult.registrationNumber ? `<div>
      <p style="font-size:10px;color:#71717a;margin-bottom:2px;text-transform:uppercase;letter-spacing:0.5px">${t('studentPortal.regNo')}</p>
      <p style="font-size:14px;font-weight:600;color:#0f766e">${escapeHtml(selectedResult.registrationNumber)}</p>
    </div>` : ''}
    <div>
      <p style="font-size:10px;color:#71717a;margin-bottom:2px;text-transform:uppercase;letter-spacing:0.5px">${t('studentPortal.department')}</p>
      <p style="font-size:14px;font-weight:600;color:#0f766e">${escapeHtml(selectedResult.department || '—')}</p>
    </div>
    <div style="grid-column:1/-1">
      <p style="font-size:10px;color:#71717a;margin-bottom:2px;text-transform:uppercase;letter-spacing:0.5px">${t('studentPortal.totalExams')}</p>
      <p style="font-size:15px;font-weight:bold;color:#0f766e">${t('studentPortal.examCount', { count: num(allStudentResults.length) })}</p>
    </div>
    <div style="grid-column:1/-1">
      <p style="font-size:10px;color:#71717a;margin-bottom:2px;text-transform:uppercase;letter-spacing:0.5px">${t('studentPortal.overallGpa')}</p>
      <p style="font-size:20px;font-weight:900;color:#0f766e">${transcriptAnalysis.overallGPA.toFixed(2)} <span style="font-size:12px;font-weight:normal;color:#71717a">${t('studentPortal.outOf5')}</span></p>
    </div>
  </div>
  ${examTables}
  <div style="margin-top:30px">
    <h3 style="font-size:13px;font-weight:bold;color:#0f766e;margin-bottom:12px">${t('studentPortal.gpaTrend')}</h3>
    <table style="border-collapse:collapse;font-size:12px">
      <thead>
        <tr>
          <th style="background:#0f766e;color:#fff;padding:8px 12px;text-align:left;font-size:11px">${t('studentPortal.exam')}</th>
          <th style="background:#0f766e;color:#fff;padding:8px 12px;text-align:center;font-size:11px">${t('studentPortal.gpa')}</th>
          <th style="background:#0f766e;color:#fff;padding:8px 12px;text-align:center;font-size:11px">${t('studentPortal.grade')}</th>
          <th style="background:#0f766e;color:#fff;padding:8px 12px;text-align:center;font-size:11px">${t('studentPortal.result')}</th>
        </tr>
      </thead>
      <tbody>
        ${transcriptAnalysis.gpaTrend.map((g, idx) => {
          const bg = idx % 2 === 0 ? '#ffffff' : '#EAEAEB';
          return `<tr style="background:${bg}">
            <td style="padding:8px 12px;border-bottom:1px solid #e4e4e7">${escapeHtml(g.examName)}</td>
            <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #e4e4e7;font-weight:bold;color:#0f766e">${g.gpa.toFixed(2)}</td>
            <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #e4e4e7">${escapeHtml(g.grade)}</td>
            <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #e4e4e7;color:${g.grade !== 'F' ? '#0f766e' : '#dc2626'}">${g.grade !== 'F' ? t('studentPortal.passed') : t('studentPortal.failed')}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>
  ${transcriptAnalysis.bestSubject ? `
  <div style="margin-top:20px;padding:12px;background:rgba(15,118,110,0.06);border-radius:8px;border:1px solid rgba(15,118,110,0.25);font-size:12px">
    <strong style="color:#0f766e">${t('studentPortal.bestSubject')}:</strong> ${escapeHtml(transcriptAnalysis.bestSubject)}
    ${transcriptAnalysis.worstSubject ? `<br><strong style="color:#dc2626">${t('studentPortal.worstSubject')}:</strong> ${escapeHtml(transcriptAnalysis.worstSubject)}` : ''}
  </div>` : ''}
  <div style="margin-top:40px;display:flex;justify-content:space-between">
    <div style="text-align:center">
      <div style="border-bottom:1px solid #18181b;width:180px;margin-bottom:4px;padding-bottom:4px">&nbsp;</div>
      <p style="font-size:11px;color:#71717a">${t('studentPortal.guardian')}</p>
    </div>
    <div style="text-align:center">
      <div style="border-bottom:1px solid #18181b;width:180px;margin-bottom:4px;padding-bottom:4px">&nbsp;</div>
      <p style="font-size:11px;color:#71717a">${t('studentPortal.principal')}</p>
    </div>
  </div>
  <div style="display:flex;justify-content:space-between;align-items:center;font-size:10px;color:#71717a;border-top:1px solid #e4e4e7;padding-top:12px;margin-top:16px">
    <p>${t('studentPortal.cgTranscript')}</p>
    <p>${t('common.date')}: ${new Date().toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>
  <div style="height:6px;background:#0f766e;border-radius:3px;margin-top:20px"></div>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.onafterprint = () => printWindow.close();
        }, 800);
      };
    } else {
      toast({ title: t('common.error'), description: t('student.validation.popupBlocked'), variant: 'destructive' });
    }
  };

  /* Generate PDF using html2canvas */
  const handleDownloadPdf = async (result: ExamResult) => {
    setGeneratingPdf(true);
    try {
      const refEl = viewMode === 'transcript' ? transcriptRef.current : marksheetRef.current;
      if (!refEl) {
        toast({ title: t('common.error'), description: t('student.validation.marksheetNotFound'), variant: 'destructive' });
        return;
      }

      await document.fonts.ready;

      const canvas = await html2canvas(refEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          const linkEl = clonedDoc.createElement('link');
          linkEl.rel = 'stylesheet';
          linkEl.href = 'https://cdnmx.pages.dev/assets/fonts/noto_serif_bengali/font.css';
          clonedDoc.head.appendChild(linkEl);

          const styleEl = clonedDoc.createElement('style');
          styleEl.textContent = `
            @font-face {
              font-family: 'Noto Serif Bengali';
              font-display: swap;
              font-style: normal;
              font-weight: 700;
              src: url('https://cdnmx.pages.dev/assets/fonts/noto_serif_bengali/noto-serif-bengali-bold.woff2') format('woff2'),
                   url('https://cdnmx.pages.dev/assets/fonts/noto_serif_bengali/noto-serif-bengali-bold.ttf') format('truetype');
            }
            @font-face {
              font-family: 'Noto Serif Bengali';
              font-display: swap;
              font-style: normal;
              font-weight: 100;
              src: url('https://cdnmx.pages.dev/assets/fonts/noto_serif_bengali/noto-serif-bengali-light.woff2') format('woff2'),
                   url('https://cdnmx.pages.dev/assets/fonts/noto_serif_bengali/noto-serif-bengali-light.ttf') format('truetype');
            }
            @font-face {
              font-family: 'Noto Serif Bengali';
              font-display: swap;
              font-style: normal;
              font-weight: 400;
              src: url('https://cdnmx.pages.dev/assets/fonts/noto_serif_bengali/noto-serif-bengali-regular.woff2') format('woff2'),
                   url('https://cdnmx.pages.dev/assets/fonts/noto_serif_bengali/noto-serif-bengali-regular.ttf') format('truetype');
            }
          `;
          clonedDoc.head.appendChild(styleEl);

          const printId = viewMode === 'transcript' ? 'transcript-print' : 'marksheet-print';
          const el = clonedDoc.getElementById(printId);
          if (el) {
            let node: HTMLElement | null = el.parentElement;
            while (node && node !== clonedDoc.body) {
              if (node.style.opacity === '0' || getComputedStyle(node).opacity === '0') {
                node.style.opacity = '1';
              }
              if (node.style.position === 'fixed') {
                node.style.position = 'absolute';
              }
              node.style.left = '0';
              node.style.top = '0';
              node.style.zIndex = '9999';
              node.style.pointerEvents = 'auto';
              node = node.parentElement;
            }
            el.style.opacity = '1';
            el.style.position = 'relative';
            el.style.left = '0';
            el.style.top = '0';
            el.style.zIndex = '9999';

            const allElements = el.querySelectorAll('*');
            allElements.forEach((child) => {
              (child as HTMLElement).style.fontFamily = "'Noto Serif Bengali', Arial, sans-serif";
            });
            el.style.fontFamily = "'Noto Serif Bengali', Arial, sans-serif";
          }
        },
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      const safeRoll = (result.studentRoll || 'unknown').replace(/[^a-zA-Z0-9]/g, '_');
      const prefix = viewMode === 'transcript' ? 'transcript' : 'marksheet';
      pdf.save(`${prefix}_${safeRoll}.pdf`);

      toast({ title: t('student.downloadPdf') });
    } catch (err) {
      console.error('PDF generation error:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      toast({
        title: t('common.error'),
        description: `${t('student.validation.pdfError')}: ${errMsg}`,
        variant: 'destructive'
      });
    } finally {
      setGeneratingPdf(false);
    }
  };

  /* ================================================================== */
  /*  Render                                                             */
  /* ================================================================== */

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient wash (dark-safe: tokens only) */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-islamic-lighter/30 via-transparent to-transparent" />

      {/* Header */}
      <header className="bg-gradient-to-br from-islamic-dark via-islamic to-islamic-light text-white py-6 sm:py-8 px-4 relative overflow-hidden">
        <div className="absolute inset-0 islamic-pattern-overlay opacity-[0.06]" aria-hidden="true" />
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-golden/5" aria-hidden="true" />
        <div className="absolute bottom-2 left-4 w-20 h-20 rounded-full bg-white/5" aria-hidden="true" />

        <div className="max-w-4xl mx-auto relative z-10">
          <button
            onClick={() => navigateTo('public')}
            className="flex items-center gap-2 text-white/60 hover:text-white text-sm mb-4 transition-colors cursor-pointer min-h-[44px]"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t('student.back')}
          </button>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg shrink-0">
              <GraduationCap className="size-6 sm:size-8 text-golden" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold">{t('student.title')}</h1>
              <p className="text-sm text-white/70">{t('student.subtitle')}</p>
            </div>
          </div>
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1.5 text-[11px] sm:text-xs text-white/80">
            <Info className="size-3.5 text-golden shrink-0" aria-hidden="true" />
            {t('portal.publishedNote')}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <AnimatePresence mode="wait">
          {/* ==================== MARKSHEET / TRANSCRIPT DETAIL VIEW ==================== */}
          {selectedResult ? (
            <motion.div
              key={viewMode === 'transcript' ? 'transcript' : 'marksheet'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              {/* Back button */}
              <button
                onClick={handleBackToResults}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-islamic-dark mb-5 transition-colors cursor-pointer min-h-[44px]"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                {t('student.back')}
              </button>

              {/* Hidden marksheet for PDF */}
              <div
                style={{ position: 'fixed', top: 0, left: 0, zIndex: -9999, opacity: 0, pointerEvents: 'none' }}
                aria-hidden="true"
              >
                <div ref={marksheetRef} id="marksheet-print" style={{
                  width: '800px',
                  background: '#ffffff',
                  padding: '40px',
                  fontFamily: "'Noto Serif Bengali', Arial, sans-serif",
                  color: '#18181b',
                }}>
                  <div style={{ height: '6px', background: '#0f766e', borderRadius: '3px', marginBottom: '24px' }} />
                  <div style={{ textAlign: 'center', paddingBottom: '20px', marginBottom: '24px', borderBottom: '2px solid #0f766e' }}>
                    <p style={{ fontSize: '18px', color: '#f5a524', fontFamily: 'serif', direction: 'rtl', marginBottom: '8px' }}>بسم الله الرحمن الرحيم</p>
                    <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#0f766e', margin: '8px 0 4px', lineHeight: '1.4' }}>
                      {siteName || t('common.appName')}
                    </h1>
                    {siteInfo?.address && <p style={{ fontSize: '12px', color: '#71717a', marginTop: '4px' }}>{siteInfo.address}</p>}
                    <div style={{ display: 'inline-block', marginTop: '12px', background: '#0f766e', color: '#fff', padding: '6px 24px', borderRadius: '6px', letterSpacing: '1px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{t('studentPortal.marksheetBanner')}</span>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px', background: 'rgba(15,118,110,0.06)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(15,118,110,0.25)' }}>
                    <div>
                      <p style={{ fontSize: '10px', color: '#71717a', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('studentPortal.studentName')}</p>
                      <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f766e' }}>{selectedResult.studentName}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '10px', color: '#71717a', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('student.rollNumber')}</p>
                      <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f766e' }}>{selectedResult.studentRoll}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '10px', color: '#71717a', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('studentPortal.department')}</p>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#0f766e' }}>{selectedResult.department || '—'}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '10px', color: '#71717a', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('student.class')}</p>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#0f766e' }}>{selectedResult.class || '—'}</p>
                    </div>
                    {selectedResult.registrationNumber && <div>
                      <p style={{ fontSize: '10px', color: '#71717a', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('studentPortal.regNo')}</p>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#0f766e' }}>{selectedResult.registrationNumber}</p>
                    </div>}
                    {meritPosition && <div>
                      <p style={{ fontSize: '10px', color: '#71717a', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('studentPortal.position')}</p>
                      <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f766e' }}>{num(meritPosition)}</p>
                    </div>}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <p style={{ fontSize: '10px', color: '#71717a', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('studentPortal.examName')}</p>
                      <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f766e' }}>{examDisplayName(selectedResult)}</p>
                    </div>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '13px', display: 'block', overflowX: 'auto' }}>
                    <thead>
                      <tr>
                        <th style={{ background: '#0f766e', color: '#fff', padding: '10px 14px', textAlign: 'left', borderBottom: '2px solid #0f766e', borderRadius: '8px 0 0 0' }}>{t('studentPortal.subject')}</th>
                        <th style={{ background: '#0f766e', color: '#fff', padding: '10px 14px', textAlign: 'center', borderBottom: '2px solid #0f766e' }}>{t('studentPortal.fullMarks')}</th>
                        <th style={{ background: '#0f766e', color: '#fff', padding: '10px 14px', textAlign: 'center', borderBottom: '2px solid #0f766e' }}>{t('studentPortal.obtained')}</th>
                        <th style={{ background: '#0f766e', color: '#fff', padding: '10px 14px', textAlign: 'center', borderBottom: '2px solid #0f766e' }}>{t('studentPortal.grade')}</th>
                        <th style={{ background: '#0f766e', color: '#fff', padding: '10px 14px', textAlign: 'center', borderBottom: '2px solid #0f766e', borderRadius: '0 8px 0 0' }}>{t('studentPortal.gpa')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedResult.subjects?.map((subject, idx) => {
                        const subPct = subject.fullMarks > 0 ? ((subject.obtainedMarks / subject.fullMarks) * 100) : 0;
                        const rowBg = idx % 2 === 0 ? '#ffffff' : '#EAEAEB';
                        const markColor = subPct >= 80 ? '#0f766e' : subPct >= 60 ? '#0f766e' : subPct >= 50 ? '#f5a524' : subPct >= 33 ? '#f5a524' : '#dc2626';
                        const gr = getGradeFromMarks(subPct);
                        const gp = getGradePoint(subPct);
                        return (
                          <tr key={idx} style={{ background: rowBg }}>
                            <td style={{ padding: '9px 14px', borderBottom: '1px solid #e4e4e7' }}>{subject.name}</td>
                            <td style={{ padding: '9px 14px', textAlign: 'center', borderBottom: '1px solid #e4e4e7', color: '#71717a' }}>{subject.fullMarks}</td>
                            <td style={{ padding: '9px 14px', textAlign: 'center', borderBottom: '1px solid #e4e4e7', fontWeight: 'bold', color: markColor }}>{subject.obtainedMarks}</td>
                            <td style={{ padding: '9px 14px', textAlign: 'center', borderBottom: '1px solid #e4e4e7', fontWeight: 'bold', color: markColor }}>{gr}</td>
                            <td style={{ padding: '9px 14px', textAlign: 'center', borderBottom: '1px solid #e4e4e7', fontWeight: 'bold', color: markColor }}>{gp.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: 'rgba(15, 118, 110, 0.06)', fontWeight: 'bold' }}>
                        <td style={{ padding: '12px 14px', fontSize: '14px', borderBottom: '2px solid #0f766e' }}>{t('common.total')}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', borderBottom: '2px solid #0f766e' }}>{selectedResult.totalMarks}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', borderBottom: '2px solid #0f766e', color: '#0f766e', fontSize: '15px' }}>{selectedResult.obtainedTotal}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', borderBottom: '2px solid #0f766e', color: '#0f766e' }}>{selectedResult.grade}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', borderBottom: '2px solid #0f766e', color: '#0f766e' }}>{currentGPA.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: selectedResult.grade !== 'F' ? '#0f766e' : '#dc2626', borderRadius: '12px', padding: '20px 24px', color: '#fff', marginBottom: '20px' }}>
                    <div>
                      <p style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>{t('studentPortal.grade')}</p>
                      <p style={{ fontSize: '32px', fontWeight: '900', lineHeight: '1', margin: '4px 0' }}>{selectedResult.grade}</p>
                      <p style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>{getGradeLabel(selectedResult.grade, t)}</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>{t('studentPortal.gpa')}</p>
                      <p style={{ fontSize: '28px', fontWeight: '900', lineHeight: '1' }}>{currentGPA.toFixed(2)}</p>
                      <p style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>{t('studentPortal.outOf5')}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>{t('studentPortal.result')}</p>
                      <p style={{ fontSize: '20px', fontWeight: 'bold' }}>
                        {selectedResult.grade !== 'F' ? t('studentPortal.passed') : t('studentPortal.failed')}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#71717a', borderTop: '1px solid #e4e4e7', paddingTop: '12px', marginTop: '16px' }}>
                    <p>{t('studentPortal.cgMarksheet')}</p>
                    <p>{t('common.date')}: {new Date().toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div style={{ height: '6px', background: '#0f766e', borderRadius: '3px', marginTop: '20px' }} />
                </div>
              </div>

              {/* Hidden transcript for PDF */}
              <div
                style={{ position: 'fixed', top: 0, left: 0, zIndex: -9998, opacity: 0, pointerEvents: 'none' }}
                aria-hidden="true"
              >
                <div ref={transcriptRef} id="transcript-print" style={{
                  width: '800px',
                  background: '#ffffff',
                  padding: '40px',
                  fontFamily: "'Noto Serif Bengali', Arial, sans-serif",
                  color: '#18181b',
                }}>
                  <div style={{ border: '3px double #0f766e', borderRadius: '8px', padding: '30px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                      <p style={{ fontSize: '18px', color: '#f5a524', fontFamily: 'serif', direction: 'rtl', marginBottom: '8px' }}>بسم الله الرحمن الرحيم</p>
                      <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#0f766e', margin: '8px 0 4px', lineHeight: '1.4' }}>{siteName || t('common.appName')}</h1>
                      {siteInfo?.address && <p style={{ fontSize: '12px', color: '#71717a', marginTop: '4px' }}>{siteInfo.address}</p>}
                      <div style={{ display: 'inline-block', marginTop: '12px', background: '#0f766e', color: '#fff', padding: '6px 24px', borderRadius: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{t('studentPortal.transcriptBanner')}</span>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px', background: 'rgba(15,118,110,0.06)', padding: '14px', borderRadius: '8px' }}>
                      <div><p style={{ fontSize: '10px', color: '#71717a' }}>{t('studentPortal.studentName')}</p><p style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f766e' }}>{selectedResult.studentName}</p></div>
                      <div><p style={{ fontSize: '10px', color: '#71717a' }}>{t('student.rollNumber')}</p><p style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f766e' }}>{selectedResult.studentRoll}</p></div>
                      {selectedResult.registrationNumber && <div><p style={{ fontSize: '10px', color: '#71717a' }}>{t('studentPortal.regNo')}</p><p style={{ fontSize: '13px', color: '#0f766e' }}>{selectedResult.registrationNumber}</p></div>}
                      <div><p style={{ fontSize: '10px', color: '#71717a' }}>{t('studentPortal.department')}</p><p style={{ fontSize: '13px', color: '#0f766e' }}>{selectedResult.department || '—'}</p></div>
                      <div><p style={{ fontSize: '10px', color: '#71717a' }}>{t('studentPortal.totalExams')}</p><p style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f766e' }}>{t('studentPortal.examCount', { count: num(allStudentResults.length) })}</p></div>
                      <div><p style={{ fontSize: '10px', color: '#71717a' }}>{t('studentPortal.overallGpa')}</p><p style={{ fontSize: '18px', fontWeight: '900', color: '#0f766e' }}>{transcriptAnalysis.overallGPA.toFixed(2)}</p></div>
                    </div>
                    {allStudentResults.map((r) => {
                      return (
                        <div key={r.id} style={{ marginBottom: '16px' }}>
                          <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f766e', marginBottom: '6px', padding: '4px 10px', background: 'rgba(15,118,110,0.06)', borderLeft: '3px solid #0f766e', borderRadius: '0 4px 4px 0' }}>
                            {examDisplayName(r)} {r.class ? '- ' + r.class : ''}
                          </h3>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', display: 'block', overflowX: 'auto' }}>
                            <thead><tr>
                              <th style={{ background: '#0f766e', color: '#fff', padding: '7px 10px', textAlign: 'left', fontSize: '10px' }}>{t('studentPortal.subject')}</th>
                              <th style={{ background: '#0f766e', color: '#fff', padding: '7px 10px', textAlign: 'center', fontSize: '10px' }}>{t('studentPortal.obtainedFull')}</th>
                              <th style={{ background: '#0f766e', color: '#fff', padding: '7px 10px', textAlign: 'center', fontSize: '10px' }}>{t('studentPortal.grade')}</th>
                              <th style={{ background: '#0f766e', color: '#fff', padding: '7px 10px', textAlign: 'center', fontSize: '10px' }}>{t('studentPortal.gpa')}</th>
                            </tr></thead>
                            <tbody>
                              {(r.subjects || []).map((s, i) => {
                                const pct = s.fullMarks > 0 ? (s.obtainedMarks / s.fullMarks) * 100 : 0;
                                return (<tr key={i} style={{ background: i % 2 === 0 ? '#fff' : 'rgba(15,118,110,0.05)' }}>
                                  <td style={{ padding: '6px 10px', borderBottom: '1px solid #e4e4e7' }}>{s.name}</td>
                                  <td style={{ padding: '6px 10px', textAlign: 'center', borderBottom: '1px solid #e4e4e7' }}>{s.obtainedMarks}/{s.fullMarks}</td>
                                  <td style={{ padding: '6px 10px', textAlign: 'center', borderBottom: '1px solid #e4e4e7' }}>{getGradeFromMarks(pct)}</td>
                                  <td style={{ padding: '6px 10px', textAlign: 'center', borderBottom: '1px solid #e4e4e7' }}>{getGradePoint(pct).toFixed(2)}</td>
                                </tr>);
                              })}
                            </tbody>
                          </table>
                        </div>
                      );
                    })}
                    <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ textAlign: 'center' }}><div style={{ borderBottom: '1px solid #18181b', width: '160px', marginBottom: '4px', paddingBottom: '4px' }}>&nbsp;</div><p style={{ fontSize: '11px', color: '#71717a' }}>{t('studentPortal.guardian')}</p></div>
                      <div style={{ textAlign: 'center' }}><div style={{ borderBottom: '1px solid #18181b', width: '160px', marginBottom: '4px', paddingBottom: '4px' }}>&nbsp;</div><p style={{ fontSize: '11px', color: '#71717a' }}>{t('studentPortal.principal')}</p></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visible Content */}
              <div className="space-y-4 sm:space-y-5">
                {/* View Mode Toggle + Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {/* Toggle Buttons */}
                    <div className="flex bg-surface-tertiary rounded-xl p-1 gap-0.5">
                      <button
                        onClick={() => setViewMode('marksheet')}
                        className={`flex items-center gap-1.5 px-3 sm:px-4 min-h-[40px] rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                          viewMode === 'marksheet'
                            ? 'bg-islamic text-white shadow-sm'
                            : 'text-muted-foreground hover:text-islamic-dark'
                        }`}
                      >
                        <FileText className="size-3.5" aria-hidden="true" />
                        {t('studentPortal.marksheet')}
                      </button>
                      <button
                        onClick={() => setViewMode('transcript')}
                        className={`flex items-center gap-1.5 px-3 sm:px-4 min-h-[40px] rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                          viewMode === 'transcript'
                            ? 'bg-islamic text-white shadow-sm'
                            : 'text-muted-foreground hover:text-islamic-dark'
                        }`}
                      >
                        <FileSpreadsheet className="size-3.5" aria-hidden="true" />
                        {t('studentPortal.transcript')}
                      </button>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {t('studentPortal.examResultsCount', { count: num(allStudentResults.length) })}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <HButton
                      onPress={() => viewMode === 'transcript' ? handlePrintTranscript() : handlePrint()}
                      variant="outline"
                      size="sm"
                      aria-label={t('portal.printAria')}
                      className="gap-1.5 cursor-pointer text-xs min-h-[44px]"
                    >
                      <Printer className="size-3.5" aria-hidden="true" />
                      {t('common.print')}
                    </HButton>
                    <HButton
                      onPress={() => handleWhatsAppShare()}
                      variant="outline"
                      size="sm"
                      aria-label={t('portal.shareAria')}
                      className="gap-1.5 cursor-pointer text-xs border-primary/25 text-primary hover:bg-primary/10 min-h-[44px]"
                    >
                      <Share2 className="size-3.5" aria-hidden="true" />
                      WhatsApp
                    </HButton>
                    <HButton
                      onPress={() => handleDownloadPdf(selectedResult)}
                      isDisabled={generatingPdf}
                      variant="primary"
                      aria-label={t('portal.pdfAria')}
                      className="bg-gradient-to-r from-islamic to-islamic-dark hover:from-islamic-dark hover:to-islamic text-white gap-1.5 shadow-md cursor-pointer text-xs min-h-[44px]"
                    >
                      {generatingPdf ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <Download className="size-3.5" aria-hidden="true" />}
                      {t('student.downloadPdf')}
                    </HButton>
                  </div>
                </div>

                {/* ==================== MARKSHEET VIEW ==================== */}
                {viewMode === 'marksheet' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: EASE }}
                    className="space-y-4 sm:space-y-5"
                  >
                    {/* Marksheet Header */}
                    <Card className="overflow-hidden rounded-2xl shadow-lg border border-islamic/10 bg-surface">
                      <div className="bg-gradient-to-r from-islamic via-islamic-dark to-islamic p-4 sm:p-6 text-white text-center relative">
                        <div className="absolute inset-0 islamic-pattern-overlay opacity-[0.08]" aria-hidden="true" />
                        <span aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-golden/70 to-transparent" />
                        <div className="relative z-10">
                          <p className="text-sm sm:text-base text-golden font-serif" dir="rtl">بسم الله الرحمن الرحيم</p>
                          <h2 className="text-lg sm:text-xl font-bold mt-1">{siteName || t('common.appName')}</h2>
                          {siteInfo?.address && <p className="text-xs text-white/60 mt-0.5">{siteInfo.address}</p>}
                          <div className="inline-block mt-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 sm:px-6 py-1.5 sm:py-2">
                            <p className="text-xs sm:text-sm font-bold tracking-wider">{t('studentPortal.marksheetBanner')}</p>
                          </div>
                        </div>
                      </div>

                      <Card.Content className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                        {/* Student Info Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                          <div className="bg-gradient-to-br from-islamic-lighter/80 to-islamic/5 rounded-xl p-3 border border-islamic/10">
                            <div className="flex items-center gap-1.5 mb-1">
                              <User className="w-3 h-3 text-islamic" aria-hidden="true" />
                              <p className="text-[10px] sm:text-xs text-muted-foreground">{t('studentPortal.studentName')}</p>
                            </div>
                            <p className="text-xs sm:text-sm font-bold text-islamic-dark truncate">{selectedResult.studentName}</p>
                          </div>
                          <div className="bg-gradient-to-br from-islamic-lighter/80 to-islamic/5 rounded-xl p-3 border border-islamic/10">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Hash className="w-3 h-3 text-islamic" aria-hidden="true" />
                              <p className="text-[10px] sm:text-xs text-muted-foreground">{t('student.rollNumber')}</p>
                            </div>
                            <p className="text-xs sm:text-sm font-bold text-islamic-dark">{selectedResult.studentRoll}</p>
                          </div>
                          <div className="bg-gradient-to-br from-islamic-lighter/80 to-islamic/5 rounded-xl p-3 border border-islamic/10">
                            <div className="flex items-center gap-1.5 mb-1">
                              <BookOpen className="w-3 h-3 text-islamic" aria-hidden="true" />
                              <p className="text-[10px] sm:text-xs text-muted-foreground">{t('departments.title')}</p>
                            </div>
                            <p className="text-xs sm:text-sm font-bold text-islamic-dark truncate">{selectedResult.department}</p>
                          </div>
                          <div className="bg-gradient-to-br from-islamic-lighter/80 to-islamic/5 rounded-xl p-3 border border-islamic/10">
                            <div className="flex items-center gap-1.5 mb-1">
                              <GraduationCap className="w-3 h-3 text-islamic" aria-hidden="true" />
                              <p className="text-[10px] sm:text-xs text-muted-foreground">{t('student.class')}</p>
                            </div>
                            <p className="text-xs sm:text-sm font-bold text-islamic-dark truncate">{selectedResult.class}</p>
                          </div>
                        </div>

                        {/* Registration Number + Merit Position Row */}
                        {(selectedResult.registrationNumber || meritPosition) && (
                          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                            {selectedResult.registrationNumber && (
                              <div className="bg-gradient-to-br from-islamic-lighter/80 to-islamic/5 rounded-xl p-3 border border-islamic/10">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Shield className="w-3 h-3 text-islamic" aria-hidden="true" />
                                  <p className="text-[10px] sm:text-xs text-muted-foreground">{t('studentPortal.regNo')}</p>
                                </div>
                                <p className="text-xs sm:text-sm font-bold text-islamic-dark">{selectedResult.registrationNumber}</p>
                              </div>
                            )}
                            {meritPosition && (
                              <div className="bg-warning/15 rounded-xl p-3 border border-warning/40">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Medal className="w-3 h-3 text-warning-foreground" aria-hidden="true" />
                                  <p className="text-[10px] sm:text-xs text-muted-foreground">{t('studentPortal.position')}</p>
                                </div>
                                <p className="text-xs sm:text-sm font-bold text-warning-foreground">
                                  {num(meritPosition)}<span className="text-muted-foreground font-normal"> {t('studentPortal.outOf')}</span>
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Exam Name */}
                        <div className="bg-islamic-lighter/50 rounded-xl p-3 flex items-center gap-3 border border-islamic/5">
                          <div className="w-9 h-9 rounded-lg bg-islamic/10 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-islamic" aria-hidden="true" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] sm:text-xs text-muted-foreground">{t('studentPortal.examName')}</p>
                            <p className="text-sm font-bold text-islamic-dark truncate">{examDisplayName(selectedResult)}</p>
                          </div>
                        </div>

                        <Separator />

                        {/* Subject Marks with Grade Point */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-islamic-dark flex items-center gap-2">
                              <BarChart3 className="w-4 h-4 text-islamic" aria-hidden="true" />
                              {t('studentPortal.subjectMarks')}
                            </h3>
                            <span className="text-[11px] text-muted-foreground">
                              {t('portal.subjectCount', { count: num(selectedResult.subjects?.length || 0) })}
                            </span>
                          </div>
                          <div className="rounded-xl border border-border overflow-hidden">
                            {/* Table header */}
                            <div className="bg-surface-tertiary/50 grid grid-cols-12 gap-0 px-3 sm:px-4 py-2.5 text-[10px] sm:text-xs font-semibold text-muted-foreground border-b border-border">
                              <div className="col-span-4">{t('studentPortal.subject')}</div>
                              <div className="col-span-2 text-center hidden sm:block">{t('studentPortal.fullMarks')}</div>
                              <div className="col-span-3 sm:col-span-2 text-center">{t('studentPortal.obtained')}</div>
                              <div className="col-span-2 text-center hidden sm:block">{t('studentPortal.grade')}</div>
                              <div className="col-span-2 text-center hidden sm:block">{t('studentPortal.gpa')}</div>
                              <div className="col-span-5 sm:col-span-2 text-center hidden sm:block">{t('studentPortal.percentage')}</div>
                            </div>

                            {/* Table rows */}
                            {selectedResult.subjects && selectedResult.subjects.map((subject, idx) => {
                              const subPct = subject.fullMarks > 0 ? (subject.obtainedMarks / subject.fullMarks) * 100 : 0;
                              const grade = getGradeFromMarks(subPct);
                              const gp = getGradePoint(subPct);
                              const gc = getGradeColor(grade);
                              return (
                                <div
                                  key={idx}
                                  className={`grid grid-cols-12 gap-0 px-3 sm:px-4 py-3 items-center border-b border-border last:border-b-0 hover:bg-islamic-lighter/20 transition-colors ${idx % 2 === 0 ? '' : 'bg-surface-tertiary/25'}`}
                                >
                                  <div className="col-span-4 sm:col-span-4">
                                    <p className="text-xs sm:text-sm font-medium text-islamic-dark truncate">{subject.name}</p>
                                  </div>
                                  <div className="col-span-2 text-center text-xs text-muted-foreground hidden sm:block">
                                    {subject.fullMarks}
                                  </div>
                                  <div className="col-span-3 sm:col-span-2 text-center">
                                    <span className={`text-sm font-bold ${getMarkColor(subject.obtainedMarks, subject.fullMarks)}`}>
                                      {subject.obtainedMarks}
                                    </span>
                                    <span className="text-xs text-muted-foreground sm:hidden">/{subject.fullMarks}</span>
                                  </div>
                                  <div className="col-span-2 text-center hidden sm:block">
                                    <Chip className={`text-[10px] px-1.5 py-0 ${gc.bgLight} ${gc.text} ${gc.border} border`}>
                                      {grade}
                                    </Chip>
                                  </div>
                                  <div className="col-span-2 text-center hidden sm:block">
                                    <span className={`text-xs font-bold ${gc.text}`}>
                                      {gp.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="col-span-5 sm:col-span-2 text-center hidden sm:block">
                                    <div className="flex items-center gap-2 justify-center">
                                      <div className="w-14 sm:w-16 h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
                                        <div
                                          className={`h-full rounded-full ${gc.progress} transition-all duration-700`}
                                          style={{ width: `${Math.min(subPct, 100)}%` }}
                                        />
                                      </div>
                                      <span className="text-[10px] font-semibold text-muted-foreground w-8 text-right">{subPct.toFixed(0)}%</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <Separator />

                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                          <div className={`${getMarkBg(selectedResult.obtainedTotal, selectedResult.totalMarks)} rounded-xl p-3 sm:p-4 text-center border ${gradeColor.border}`}>
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Target className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                              <p className="text-[10px] sm:text-xs text-muted-foreground">{t('studentPortal.obtainedMarks')}</p>
                            </div>
                            <p className={`text-xl sm:text-2xl font-bold ${getMarkColor(selectedResult.obtainedTotal, selectedResult.totalMarks)}`}>
                              {num(selectedResult.obtainedTotal)}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">/{num(selectedResult.totalMarks)}</p>
                          </div>
                          <div className={`${gradeColor.bgLight} rounded-xl p-3 sm:p-4 text-center border ${gradeColor.border}`}>
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                              <p className="text-[10px] sm:text-xs text-muted-foreground">{t('studentPortal.percentage')}</p>
                            </div>
                            <p className={`text-xl sm:text-2xl font-bold ${gradeColor.text}`}>
                              {percentage.toFixed(1)}%
                            </p>
                            <div className="w-full h-1.5 bg-surface-tertiary rounded-full mt-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${gradeColor.progress} transition-all duration-1000`}
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              />
                            </div>
                          </div>
                          <div className={`${gradeColor.bgLight} rounded-xl p-3 sm:p-4 text-center border ${gradeColor.border} relative overflow-hidden`}>
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Award className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                              <p className="text-[10px] sm:text-xs text-muted-foreground">{t('studentPortal.gpa')}</p>
                            </div>
                            <p className={`text-xl sm:text-2xl font-bold ${gradeColor.text}`}>
                              {currentGPA.toFixed(2)}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{t('studentPortal.outOf5')}</p>
                          </div>
                          <div className={`${gradeColor.bgLight} rounded-xl p-3 sm:p-4 text-center border ${gradeColor.border} relative overflow-hidden`}>
                            <div className="absolute top-1 right-1">
                              <Shield className={`w-6 h-6 ${gradeColor.text} opacity-10`} aria-hidden="true" />
                            </div>
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Star className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                              <p className="text-[10px] sm:text-xs text-muted-foreground">{t('studentPortal.grade')}</p>
                            </div>
                            <p className={`text-2xl sm:text-3xl font-black ${gradeColor.text}`}>
                              {selectedResult.grade}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{getGradeLabel(selectedResult.grade, t)}</p>
                          </div>
                        </div>

                        {/* Pass/Fail Banner */}
                        <div className={`rounded-xl p-4 text-center ${
                          selectedResult.grade !== 'F'
                            ? 'bg-primary/5 border border-primary/25'
                            : 'bg-danger/10 border border-danger/40'
                        }`}>
                          <div className="flex items-center justify-center gap-2">
                            {selectedResult.grade !== 'F' ? (
                              <>
                                <CheckCircle className="w-5 h-5 text-primary" aria-hidden="true" />
                                <span className="font-bold text-primary">{t('studentPortal.passBanner')}</span>
                              </>
                            ) : (
                              <>
                                <X className="w-5 h-5 text-danger" aria-hidden="true" />
                                <span className="font-bold text-danger">{t('studentPortal.failBanner')}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </Card.Content>
                    </Card>
                  </motion.div>
                )}

                {/* ==================== TRANSCRIPT VIEW ==================== */}
                {viewMode === 'transcript' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: EASE }}
                    className="space-y-4 sm:space-y-5"
                  >
                    {/* Transcript Main Card */}
                    <Card className="overflow-hidden rounded-2xl shadow-lg border border-islamic/10 bg-surface">
                      {/* Double border transcript header */}
                      <div className="bg-gradient-to-r from-islamic-dark via-islamic to-islamic-dark p-5 sm:p-7 text-white text-center relative">
                        <div className="absolute inset-0 islamic-pattern-overlay opacity-[0.08]" aria-hidden="true" />
                        {/* Mosque SVG watermark */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none" aria-hidden="true">
                          <svg viewBox="0 0 200 200" className="w-40 h-40 sm:w-56 sm:h-56" fill="white">
                            <path d="M100 20 C100 20, 140 60, 140 80 C140 95, 125 100, 125 100 L125 140 L140 140 L140 160 L60 160 L60 140 L75 140 L75 100 C75 100, 60 95, 60 80 C60 60, 100 20, 100 20Z" />
                            <rect x="90" y="130" width="20" height="30" rx="10" />
                            <circle cx="100" cy="55" r="12" />
                          </svg>
                        </div>
                        <div className="relative z-10">
                          <p className="text-sm sm:text-base text-golden font-serif" dir="rtl">بسم الله الرحمن الرحيم</p>
                          <h2 className="text-lg sm:text-xl font-bold mt-1">{siteName || t('common.appName')}</h2>
                          {siteInfo?.address && <p className="text-xs text-white/60 mt-0.5">{siteInfo.address}</p>}
                          <div className="inline-block mt-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 sm:px-6 py-1.5 sm:py-2">
                            <p className="text-xs sm:text-sm font-bold tracking-wider">{t('studentPortal.transcriptBanner')}</p>
                          </div>
                        </div>
                      </div>

                      <Card.Content className="p-4 sm:p-6 space-y-5">
                        {/* Student Info - Double Border Style */}
                        <div className="border-2 border-islamic/20 rounded-xl p-4 sm:p-5 relative">
                          <div className="absolute inset-0 border-2 border-islamic/10 rounded-xl m-1 pointer-events-none" aria-hidden="true" />
                          <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                              <User className="w-4 h-4 text-islamic" aria-hidden="true" />
                              <h3 className="text-sm font-bold text-islamic-dark">{t('studentPortal.studentInfo')}</h3>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              <div>
                                <p className="text-[10px] text-muted-foreground mb-0.5">{t('studentPortal.studentName')}</p>
                                <p className="text-sm font-bold text-islamic-dark">{selectedResult.studentName}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-muted-foreground mb-0.5">{t('student.rollNumber')}</p>
                                <p className="text-sm font-bold text-islamic-dark">{selectedResult.studentRoll}</p>
                              </div>
                              {selectedResult.registrationNumber && (
                                <div>
                                  <p className="text-[10px] text-muted-foreground mb-0.5">{t('student.registrationNumber')}</p>
                                  <p className="text-sm font-bold text-islamic-dark">{selectedResult.registrationNumber}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-[10px] text-muted-foreground mb-0.5">{t('studentPortal.department')}</p>
                                <p className="text-sm font-semibold text-islamic">{selectedResult.department || '—'}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-muted-foreground mb-0.5">{t('studentPortal.totalExams')}</p>
                                <p className="text-sm font-bold text-islamic-dark">{t('studentPortal.examCount', { count: num(allStudentResults.length) })}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-muted-foreground mb-0.5">{t('studentPortal.overallGpa')}</p>
                                <p className="text-lg font-black text-islamic-dark">{transcriptAnalysis.overallGPA.toFixed(2)} <span className="text-[10px] text-muted-foreground font-normal">/ 5.00</span></p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* QR Code Placeholder */}
                        <div className="flex justify-end">
                          <div className="w-20 h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-surface-tertiary/50">
                            <div className="text-center">
                              <Shield className="w-6 h-6 text-muted-foreground/50 mx-auto" aria-hidden="true" />
                              <p className="text-[8px] text-muted-foreground/70 mt-0.5">{t('studentPortal.qrVerify')}</p>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* All Exam Results */}
                        <div>
                          <h3 className="text-sm font-bold text-islamic-dark mb-3 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-islamic" aria-hidden="true" />
                            {t('studentPortal.allExamResults')}
                          </h3>

                          <div className="space-y-4">
                            {allStudentResults.length === 0 ? (
                              <div className="text-center py-8 bg-surface-tertiary/50 rounded-xl">
                                <AlertCircle className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" aria-hidden="true" />
                                <p className="text-sm text-muted-foreground">{t('studentPortal.noExamResults')}</p>
                              </div>
                            ) : (
                              allStudentResults.map((result) => {
                                const examGPA = (result.subjects || []).reduce((sum, s) => {
                                  const pct = s.fullMarks > 0 ? (s.obtainedMarks / s.fullMarks) * 100 : 0;
                                  const marksBucket = pct >= 80 ? 80 : pct >= 70 ? 70 : pct >= 60 ? 60 : pct >= 50 ? 50 : pct >= 40 ? 40 : pct >= 33 ? 33 : 0;
                                  return sum + getGradePoint(marksBucket);
                                }, 0) / ((result.subjects || []).length || 1);
                                const examPct = result.totalMarks > 0 ? ((result.obtainedTotal || 0) / result.totalMarks) * 100 : 0;
                                const examGC = getGradeColor(result.grade);

                                return (
                                  <Card key={result.id} className="border border-border rounded-xl overflow-hidden bg-surface">
                                    {/* Exam header */}
                                    <div className={`${examGC.bgLight} px-4 py-2.5 border-b border-border flex items-center justify-between gap-2`}>
                                      <div className="flex items-center gap-2 min-w-0">
                                        <Trophy className={`w-4 h-4 ${examGC.text} shrink-0`} aria-hidden="true" />
                                        <p className="text-xs sm:text-sm font-bold text-islamic-dark truncate">{examDisplayName(result)}</p>
                                        <span className="text-[10px] text-muted-foreground hidden sm:inline shrink-0">— {result.department} {result.class ? '- ' + result.class : ''}</span>
                                      </div>
                                      <Chip className={`text-[10px] px-2 py-0.5 shrink-0 ${examGC.bgLight} ${examGC.text} ${examGC.border} border`}>
                                        {result.grade}
                                      </Chip>
                                    </div>

                                    <Card.Content className="p-3 sm:p-4">
                                      {/* Subject table */}
                                      <div className="rounded-lg border border-border overflow-hidden mb-3">
                                        <div className="bg-surface-tertiary/50 grid grid-cols-12 gap-0 px-3 py-2 text-[10px] font-semibold text-muted-foreground border-b border-border">
                                          <div className="col-span-4">{t('studentPortal.subject')}</div>
                                          <div className="col-span-3 text-center">{t('studentPortal.obtainedFull')}</div>
                                          <div className="col-span-2 text-center hidden sm:block">{t('studentPortal.grade')}</div>
                                          <div className="col-span-3 text-center hidden sm:block">{t('studentPortal.progress')}</div>
                                        </div>
                                        {result.subjects.map((subject, subIdx) => {
                                          const pct = subject.fullMarks > 0 ? (subject.obtainedMarks / subject.fullMarks) * 100 : 0;
                                          const gr = getGradeFromMarks(subject.obtainedMarks);
                                          const sgc = getGradeColor(gr);
                                          return (
                                            <div
                                              key={subIdx}
                                              className={`grid grid-cols-12 gap-0 px-3 py-2.5 items-center border-b border-border last:border-b-0 ${subIdx % 2 === 0 ? '' : 'bg-surface-tertiary/25'}`}
                                            >
                                              <div className="col-span-4">
                                                <p className="text-xs font-medium text-islamic-dark truncate">{subject.name}</p>
                                              </div>
                                              <div className="col-span-3 text-center">
                                                <span className={`text-xs font-bold ${getMarkColor(subject.obtainedMarks, subject.fullMarks)}`}>
                                                  {subject.obtainedMarks}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">/{subject.fullMarks}</span>
                                              </div>
                                              <div className="col-span-2 text-center hidden sm:block">
                                                <Chip className={`text-[9px] px-1.5 py-0 ${sgc.bgLight} ${sgc.text} ${sgc.border} border`}>
                                                  {gr}
                                                </Chip>
                                              </div>
                                              <div className="col-span-3 text-center hidden sm:block">
                                                <ProgressBar value={Math.min(pct, 100)} aria-label="progress" className="relative">
                                                  <ProgressBar.Track className={`h-1.5 ${pct >= 60 ? '[&>div]:bg-primary' : pct >= 33 ? '[&>div]:bg-warning' : '[&>div]:bg-danger'}`}>
                                                    <ProgressBar.Fill />
                                                  </ProgressBar.Track>
                                                </ProgressBar>
                                              </div>
                                            </div>
                                          );
                                        })}
                                        {/* Exam total row */}
                                        <div className="bg-surface-tertiary/50 grid grid-cols-12 gap-0 px-3 py-2.5 items-center font-bold text-xs">
                                          <div className="col-span-4 text-islamic-dark">{t('common.total')}</div>
                                          <div className="col-span-3 text-center">
                                            <span className="text-islamic-dark font-bold">{num(result.obtainedTotal)}</span>
                                            <span className="text-muted-foreground font-normal">/{num(result.totalMarks)}</span>
                                          </div>
                                          <div className="col-span-2 text-center hidden sm:block">
                                            <Chip className={`text-[9px] px-1.5 py-0 ${examGC.bgLight} ${examGC.text} ${examGC.border} border`}>
                                              {result.grade}
                                            </Chip>
                                          </div>
                                          <div className="col-span-3 text-center hidden sm:block">
                                            <ProgressBar value={Math.min(examPct, 100)} aria-label="progress" className="relative">
                                              <ProgressBar.Track className={`h-1.5 ${examPct >= 60 ? '[&>div]:bg-primary' : examPct >= 33 ? '[&>div]:bg-warning' : '[&>div]:bg-danger'}`}>
                                                <ProgressBar.Fill />
                                              </ProgressBar.Track>
                                            </ProgressBar>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Exam summary line */}
                                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs">
                                        <span className="flex items-center gap-1 text-muted-foreground">
                                          <Target className="w-3 h-3" aria-hidden="true" />
                                          {t('studentPortal.gpa')}: <strong className={examGC.text}>{examGPA.toFixed(2)}</strong>
                                        </span>
                                        <span className="flex items-center gap-1 text-muted-foreground">
                                          <BarChart3 className="w-3 h-3" aria-hidden="true" />
                                          {examPct.toFixed(1)}%
                                        </span>
                                        <span className="flex items-center gap-1">
                                          {result.grade !== 'F' ? (
                                            <CheckCircle className="w-3 h-3 text-primary" aria-hidden="true" />
                                          ) : (
                                            <X className="w-3 h-3 text-danger" aria-hidden="true" />
                                          )}
                                          <span className={`font-semibold ${result.grade !== 'F' ? 'text-primary' : 'text-danger'}`}>
                                            {result.grade !== 'F' ? t('studentPortal.passed') : t('studentPortal.failed')}
                                          </span>
                                        </span>
                                      </div>
                                    </Card.Content>
                                  </Card>
                                );
                              })
                            )}
                          </div>
                        </div>

                        {/* GPA Trend */}
                        {transcriptAnalysis.gpaTrend.length > 1 && (
                          <>
                            <Separator />
                            <div>
                              <h3 className="text-sm font-bold text-islamic-dark mb-3 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-islamic" aria-hidden="true" />
                                {t('studentPortal.gpaTrend')}
                              </h3>
                              <Card className="border border-border rounded-xl p-4 bg-surface">
                                <div className="space-y-2.5">
                                  {transcriptAnalysis.gpaTrend.map((g, idx) => {
                                    const maxGPA = 5.00;
                                    const pctOfMax = (g.gpa / maxGPA) * 100;
                                    const gc = getGradeColor(g.grade);
                                    return (
                                      <div key={idx} className="flex items-center gap-3">
                                        <div className="w-28 sm:w-36 shrink-0">
                                          <p className="text-[10px] sm:text-xs font-medium text-islamic-dark truncate">{g.examName}</p>
                                        </div>
                                        <div className="flex-1">
                                          <div className="w-full h-3 bg-surface-tertiary rounded-full overflow-hidden">
                                            <div
                                              className={`h-full rounded-full ${gc.progress} transition-all duration-700`}
                                              style={{ width: `${Math.min(pctOfMax, 100)}%` }}
                                            />
                                          </div>
                                        </div>
                                        <div className="w-16 text-right shrink-0">
                                          <span className={`text-xs sm:text-sm font-bold ${gc.text}`}>{g.gpa.toFixed(2)}</span>
                                        </div>
                                        <div className="w-8 shrink-0">
                                          <Chip className={`text-[9px] px-1.5 py-0 ${gc.bgLight} ${gc.text} ${gc.border} border`}>
                                            {g.grade}
                                          </Chip>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </Card>
                            </div>
                          </>
                        )}

                        {/* Performance Analysis */}
                        {allStudentResults.length > 0 && (
                          <>
                            <Separator />
                            <div>
                              <h3 className="text-sm font-bold text-islamic-dark mb-3 flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-islamic" aria-hidden="true" />
                                {t('studentPortal.performanceAnalysis')}
                              </h3>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {/* Best Subject */}
                                {transcriptAnalysis.bestSubject && (
                                  <div className="bg-primary/5 rounded-xl p-4 border border-primary/25 text-center">
                                    <Star className="w-5 h-5 text-primary mx-auto mb-1" aria-hidden="true" />
                                    <p className="text-[10px] text-primary mb-0.5">{t('studentPortal.bestSubject')}</p>
                                    <p className="text-sm font-bold text-primary">{transcriptAnalysis.bestSubject}</p>
                                  </div>
                                )}
                                {/* Worst Subject */}
                                {transcriptAnalysis.worstSubject && transcriptAnalysis.worstSubject !== transcriptAnalysis.bestSubject && (
                                  <div className="bg-danger/10 rounded-xl p-4 border border-danger/40 text-center">
                                    <AlertCircle className="w-5 h-5 text-danger mx-auto mb-1" aria-hidden="true" />
                                    <p className="text-[10px] text-danger mb-0.5">{t('studentPortal.worstSubject')}</p>
                                    <p className="text-sm font-bold text-danger">{transcriptAnalysis.worstSubject}</p>
                                  </div>
                                )}
                                {/* Overall Remarks */}
                                <div className="bg-islamic-lighter/50 rounded-xl p-4 border border-islamic/20 text-center">
                                  <Award className="w-5 h-5 text-islamic mx-auto mb-1" aria-hidden="true" />
                                  <p className="text-[10px] text-islamic mb-0.5">{t('studentPortal.remarks')}</p>
                                  <p className="text-sm font-bold text-islamic-dark">
                                    {transcriptAnalysis.overallGPA >= 4.5 ? t('studentPortal.remarkOutstanding') :
                                     transcriptAnalysis.overallGPA >= 4.0 ? t('studentPortal.remarkExcellent') :
                                     transcriptAnalysis.overallGPA >= 3.5 ? t('studentPortal.remarkGood') :
                                     transcriptAnalysis.overallGPA >= 3.0 ? t('studentPortal.remarkSatisfactory') :
                                     transcriptAnalysis.overallGPA >= 2.0 ? t('studentPortal.remarkNeedsImprovement') : t('studentPortal.remarkNeedsAttention')}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        {/* Result Status with Congratulatory Message */}
                        <div className={`rounded-xl p-5 text-center border-2 ${
                          selectedResult.grade !== 'F'
                            ? 'bg-primary/5 border-primary/25'
                            : 'bg-danger/10 border-danger/40'
                        }`}>
                          {selectedResult.grade !== 'F' ? (
                            <>
                              <div className="flex items-center justify-center gap-2 mb-1">
                                <Trophy className="w-6 h-6 text-primary" aria-hidden="true" />
                                <span className="text-lg font-black text-primary">{t('studentPortal.mashaAllah')}</span>
                              </div>
                              <p className="text-sm text-primary">{t('studentPortal.passedMessage')}</p>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center justify-center gap-2 mb-1">
                                <X className="w-6 h-6 text-danger" aria-hidden="true" />
                                <span className="text-lg font-black text-danger">{t('studentPortal.result')}: {t('studentPortal.failed')}</span>
                              </div>
                              <p className="text-sm text-danger">{t('studentPortal.failedMessage')}</p>
                            </>
                          )}
                        </div>

                        {/* Signature Lines */}
                        <div className="flex justify-between items-end pt-6 mt-4">
                          <div className="text-center">
                            <div className="w-40 sm:w-48 border-b-2 border-border mb-2" aria-hidden="true" />
                            <p className="text-xs text-muted-foreground font-medium">{t('studentPortal.guardian')}</p>
                            <p className="text-[10px] text-muted-foreground">{t('studentPortal.signatureDate')}</p>
                          </div>
                          <div className="text-center">
                            <div className="w-40 sm:w-48 border-b-2 border-border mb-2" aria-hidden="true" />
                            <p className="text-xs text-muted-foreground font-medium">{t('studentPortal.principal')}</p>
                            <p className="text-[10px] text-muted-foreground">{t('studentPortal.signatureSeal')}</p>
                          </div>
                        </div>
                      </Card.Content>
                    </Card>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : searching ? (
            /* ==================== SEARCHING SKELETON ==================== */
            <motion.div
              key="searching"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25, ease: EASE }}
              aria-busy="true"
            >
              <div className="max-w-lg mx-auto text-center mb-5">
                <Loader2 className="size-6 animate-spin text-islamic mx-auto mb-2" aria-hidden="true" />
                <p className="text-sm font-semibold text-islamic-dark">{t('portal.searchingTitle')}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t('portal.searchingSub')}</p>
              </div>
              <div className="space-y-3" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="rounded-xl border border-border bg-surface p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-surface-tertiary/70 animate-pulse shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 w-1/3 rounded bg-surface-tertiary/70 animate-pulse" />
                        <div className="h-2.5 w-1/2 rounded bg-surface-tertiary/50 animate-pulse" />
                      </div>
                      <div className="h-6 w-10 rounded-full bg-surface-tertiary/60 animate-pulse" />
                    </div>
                    <div className="mt-3 h-1.5 w-full rounded-full bg-surface-tertiary/50 animate-pulse" />
                  </div>
                ))}
              </div>
            </motion.div>
          ) : searched && searchResults.length === 0 ? (
            /* ==================== NOT FOUND STATE ==================== */
            <motion.div
              key="not-found"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              <Card className="max-w-lg mx-auto shadow-xl border border-danger/25 bg-surface overflow-hidden rounded-2xl">
                <Card.Content className="p-6 sm:p-8 text-center">
                  <IconMedallion icon={SearchX} tone="gold" className="mx-auto mb-4 size-14" />
                  <h2 className="text-base sm:text-lg font-bold text-islamic-dark">{t('portal.noResultsTitle')}</h2>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{t('portal.noResultsHint')}</p>
                  {(regInput.trim() || rollInput.trim()) && (
                    <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2 rounded-xl bg-surface-tertiary/60 border border-border px-4 py-2.5 text-xs text-muted-foreground max-w-full">
                      {regInput.trim() && (
                        <span className="flex items-center gap-1.5 min-w-0">
                          <FileText className="size-3.5 text-islamic shrink-0" aria-hidden="true" />
                          <span className="truncate">{regInput.trim()}</span>
                        </span>
                      )}
                      {!regInput.trim() && rollInput.trim() && (
                        <span className="flex items-center gap-1.5 min-w-0">
                          <Hash className="size-3.5 text-islamic shrink-0" aria-hidden="true" />
                          <span className="truncate">{rollInput.trim()}</span>
                        </span>
                      )}
                    </div>
                  )}
                  <div className="mt-6">
                    <HButton
                      onPress={handleReset}
                      variant="primary"
                      className="bg-gradient-to-r from-islamic to-islamic-dark hover:from-islamic-dark hover:to-islamic text-white gap-2 cursor-pointer min-h-[44px] rounded-xl px-6 shadow-md shadow-islamic/20"
                    >
                      <Search className="size-4" aria-hidden="true" />
                      {t('portal.searchAgain')}
                    </HButton>
                  </div>
                  <p className="mt-5 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Info className="size-3.5 shrink-0" aria-hidden="true" />
                    {t('portal.rollExactHint')}
                  </p>
                </Card.Content>
              </Card>
            </motion.div>
          ) : searchResults.length > 0 ? (
            /* ==================== SEARCH RESULTS VIEW ==================== */
            <motion.div
              key="search-results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              <button
                onClick={handleReset}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-islamic-dark mb-5 transition-colors cursor-pointer min-h-[44px]"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                {t('student.back')}
              </button>

              <div className="flex flex-wrap items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
                <h2 className="text-base sm:text-lg font-bold text-islamic-dark">
                  {t('portal.resultsFound', { count: num(searchResults.length) })}
                </h2>
              </div>

              <div className="space-y-3">
                <AnimatePresence>
                  {searchResults.map((result, idx) => {
                    const pct = result.totalMarks > 0 ? ((result.obtainedTotal || 0) / result.totalMarks * 100) : 0;
                    const gc = getGradeColor(result.grade);
                    const passed = result.grade !== 'F';
                    return (
                      <motion.div
                        key={result.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(idx * 0.05, 0.3), ease: EASE }}
                      >
                        <Card
                          className="hover:shadow-lg hover:border-islamic/30 transition-all border border-border group cursor-pointer rounded-xl overflow-hidden bg-surface"
                          onClick={() => handleSelectResult(result)}
                        >
                          <Card.Content className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl ${gc.bgLight} ${gc.border} border flex items-center justify-center shrink-0`}>
                                <span className={`text-sm font-black ${gc.text}`}>{num(idx + 1)}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-islamic-dark text-sm truncate">{result.studentName}</p>
                                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] sm:text-xs text-muted-foreground">{t('studentPortal.rollShort')}: {result.studentRoll}</span>
                                  <span className="text-[10px] text-muted-foreground" aria-hidden="true">|</span>
                                  <span className="text-[10px] sm:text-xs text-muted-foreground truncate">{examDisplayName(result)}</span>
                                </div>
                                <div className="mt-2 hidden sm:block">
                                  <div className="w-full h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${gc.progress} transition-all duration-700`}
                                      style={{ width: `${Math.min(pct, 100)}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-bold text-islamic-dark text-sm sm:text-base">
                                  {num(result.obtainedTotal)}<span className="text-[10px] sm:text-xs text-muted-foreground font-normal">/{num(result.totalMarks)}</span>
                                </p>
                                <div className="flex items-center justify-end gap-1 mt-0.5">
                                  <Chip className={`text-[10px] sm:text-xs px-2 py-0.5 ${gc.bgLight} ${gc.text} ${gc.border} border`}>
                                    {result.grade}
                                  </Chip>
                                  {passed ? (
                                    <CheckCircle className="w-3.5 h-3.5 text-primary" aria-label={t('studentPortal.passed')} />
                                  ) : (
                                    <X className="w-3.5 h-3.5 text-danger" aria-label={t('studentPortal.failed')} />
                                  )}
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-islamic group-hover:translate-x-1 transition-all shrink-0" aria-hidden="true" />
                            </div>
                          </Card.Content>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            /* ==================== SEARCH FORM VIEW ==================== */
            <motion.div
              key="search-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              <Card className="shadow-xl max-w-lg mx-auto border border-islamic/10 overflow-hidden rounded-2xl bg-surface">
                <div className="bg-gradient-to-r from-islamic via-islamic-dark to-islamic p-6 sm:p-8 text-center relative overflow-hidden">
                  <div className="absolute inset-0 islamic-pattern-overlay opacity-[0.08]" aria-hidden="true" />
                  <span aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-golden/70 to-transparent" />
                  <div className="relative z-10">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                      <Search className="size-7 sm:size-9 text-golden" aria-hidden="true" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">{t('student.title')}</h2>
                    <p className="text-xs sm:text-sm text-white/60 mt-1">{t('student.subtitle')}</p>
                  </div>
                </div>

                <Card.Content className="p-5 sm:p-6 space-y-4">
                  {/* Registration number (fast path) */}
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-input" className="text-xs sm:text-sm flex items-center gap-2 font-medium">
                      <FileText className="size-3.5 text-islamic" aria-hidden="true" />
                      {t('student.registrationNumber')}
                    </Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
                      <Input
                        id="reg-input"
                        placeholder={t('studentPortal.regPlaceholder')}
                        value={regInput}
                        onChange={(e) => setRegInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        aria-label={t('student.registrationNumber')}
                        className="pl-10 h-11 sm:h-12 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  <div className="relative" aria-hidden="true">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-surface px-3 text-muted-foreground">{t('studentPortal.orDivider')}</span>
                    </div>
                  </div>

                  {/* Department */}
                  <div className="space-y-1.5">
                    <Label htmlFor="dept-input" className="text-xs sm:text-sm flex items-center gap-2 font-medium">
                      <BookOpen className="size-3.5 text-islamic" aria-hidden="true" />
                      {t('departments.title')} <span className="text-danger" aria-hidden="true">*</span>
                    </Label>
                    <Select
                      aria-label={t('studentPortal.selectDept')}
                      placeholder={t('studentPortal.selectDept')}
                      value={departmentInput || null}
                      onChange={(val) => {
                        setDepartmentInput(val == null ? '' : String(val));
                        setClassInput('');
                      }}
                    >
                      <Select.Trigger id="dept-input" className="w-full h-11 sm:h-12 rounded-xl">
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover className="rounded-xl border border-islamic/15 bg-surface shadow-xl">
                        <ListBox aria-label={t('studentPortal.selectDept')}>
                          {departmentOptions.map((dept) => (
                            <ListBox.Item
                              key={dept}
                              id={dept}
                              textValue={dept}
                              className="rounded-lg px-3 py-2.5 text-sm data-[selected=true]:bg-islamic-lighter data-[hovered=true]:bg-islamic-lighter/60"
                            >
                              {dept}
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>

                  {/* Class */}
                  <div className="space-y-1.5">
                    <Label htmlFor="class-input" className="text-xs sm:text-sm flex items-center gap-2 font-medium">
                      <GraduationCap className="size-3.5 text-islamic" aria-hidden="true" />
                      {t('student.class')} <span className="text-danger" aria-hidden="true">*</span>
                    </Label>
                    {!departmentInput ? (
                      <Input
                        id="class-input"
                        placeholder={t('studentPortal.selectDeptFirst')}
                        disabled
                        className="h-11 sm:h-12 rounded-xl text-sm"
                      />
                    ) : classOptions.length > 0 ? (
                      <Select
                        aria-label={t('studentPortal.selectClass')}
                        placeholder={t('studentPortal.selectClass')}
                        value={classInput || null}
                        onChange={(val) => setClassInput(val == null ? '' : String(val))}
                      >
                        <Select.Trigger id="class-input" className="w-full h-11 sm:h-12 rounded-xl">
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover className="rounded-xl border border-islamic/15 bg-surface shadow-xl">
                          <ListBox aria-label={t('studentPortal.selectClass')}>
                            {classOptions.map((cls) => (
                              <ListBox.Item
                                key={cls}
                                id={cls}
                                textValue={cls}
                                className="rounded-lg px-3 py-2.5 text-sm data-[selected=true]:bg-islamic-lighter data-[hovered=true]:bg-islamic-lighter/60"
                              >
                                {cls}
                              </ListBox.Item>
                            ))}
                          </ListBox>
                        </Select.Popover>
                      </Select>
                    ) : (
                      <Input
                        id="class-input"
                        placeholder={t('studentPortal.noClasses')}
                        disabled
                        className="h-11 sm:h-12 rounded-xl text-sm"
                      />
                    )}
                  </div>

                  {/* Roll */}
                  <div className="space-y-1.5">
                    <Label htmlFor="roll-input" className="text-xs sm:text-sm flex items-center gap-2 font-medium">
                      <Hash className="size-3.5 text-islamic" aria-hidden="true" />
                      {t('student.rollNumber')} <span className="text-danger" aria-hidden="true">*</span>
                    </Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
                      <Input
                        id="roll-input"
                        placeholder={t('studentPortal.rollPlaceholder')}
                        value={rollInput}
                        onChange={(e) => setRollInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        aria-label={t('student.rollNumber')}
                        className="pl-10 h-11 sm:h-12 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  {/* Optional exam filter */}
                  <div className="space-y-1.5">
                    <Label htmlFor="exam-input" className="text-xs sm:text-sm flex items-center gap-2 font-medium text-muted-foreground">
                      <FileText className="size-3.5 text-islamic" aria-hidden="true" />
                      {t('portal.examOptional')}
                    </Label>
                    <Select
                      aria-label={t('portal.examOptional')}
                      placeholder={t('portal.examAll')}
                      value={examFilter || null}
                      onChange={(val) => setExamFilter(val == null ? '' : String(val))}
                    >
                      <Select.Trigger id="exam-input" className="w-full h-11 sm:h-12 rounded-xl">
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover className="rounded-xl border border-islamic/15 bg-surface shadow-xl">
                        <ListBox aria-label={t('portal.examOptional')}>
                          {publishedExams.map((exam) => (
                            <ListBox.Item
                              key={exam.id}
                              id={exam.id}
                              textValue={loc(language, exam, 'name') || exam.name}
                              className="rounded-lg px-3 py-2.5 text-sm data-[selected=true]:bg-islamic-lighter data-[hovered=true]:bg-islamic-lighter/60"
                            >
                              {loc(language, exam, 'name') || exam.name}
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <HButton
                      onPress={handleSearch}
                      isDisabled={searching}
                      variant="primary"
                      className="flex-1 bg-gradient-to-r from-islamic to-islamic-dark hover:from-islamic-dark hover:to-islamic text-white gap-2 cursor-pointer min-h-[44px] rounded-xl shadow-md shadow-islamic/20"
                    >
                      {searching ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Search className="size-4" aria-hidden="true" />
                      )}
                      {searching ? t('student.searching') : t('student.search')}
                    </HButton>
                    {(rollInput || departmentInput || classInput || regInput || examFilter) && (
                      <HButton
                        onPress={handleReset}
                        variant="outline"
                        aria-label={t('portal.backToSearch')}
                        className="min-h-[44px] min-w-[44px] rounded-xl cursor-pointer"
                      >
                        <X className="size-4" aria-hidden="true" />
                      </HButton>
                    )}
                  </div>

                  {/* Search tips */}
                  <div className="rounded-xl bg-islamic-lighter/40 border border-islamic/10 p-3.5 space-y-2">
                    <p className="flex items-start gap-2 text-[11px] sm:text-xs text-muted-foreground">
                      <Search className="size-3.5 text-islamic shrink-0 mt-0.5" aria-hidden="true" />
                      {t('portal.searchHint')}
                    </p>
                    <p className="flex items-start gap-2 text-[11px] sm:text-xs text-muted-foreground">
                      <Hash className="size-3.5 text-islamic shrink-0 mt-0.5" aria-hidden="true" />
                      {t('portal.rollExactHint')}
                    </p>
                    <p className="flex items-start gap-2 text-[11px] sm:text-xs text-muted-foreground">
                      <Info className="size-3.5 text-islamic shrink-0 mt-0.5" aria-hidden="true" />
                      {t('portal.publishedNote')}
                    </p>
                  </div>
                </Card.Content>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
