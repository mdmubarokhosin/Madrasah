'use client';

import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ArrowLeft, Download, Award, User, FileText,
  Loader2, GraduationCap, X, Hash, BookOpen, CheckCircle,
  TrendingUp, Shield, Printer, Eye, ChevronRight,
  BarChart3, Target, FileSpreadsheet, Share2, Trophy,
  AlertCircle, Star, Clock, Medal
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { navigateTo } from '@/lib/navigate';
import { useToast } from '@/hooks/use-toast';
import type { ExamResult } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useTranslation } from '@/lib/i18n-context';
import { loc } from '@/lib/multilingual';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const toBangla = (n: number) => n.toString().replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[parseInt(d)]);

function getGradeColor(grade: string) {
  switch (grade) {
    case 'A+': return { bg: 'bg-gradient-to-r from-emerald-500 to-green-600', text: 'text-emerald-700', bgLight: 'bg-emerald-50', border: 'border-emerald-200', progress: 'from-emerald-400 to-green-500' };
    case 'A': return { bg: 'bg-gradient-to-r from-emerald-400 to-teal-500', text: 'text-emerald-700', bgLight: 'bg-emerald-50', border: 'border-emerald-200', progress: 'from-emerald-400 to-teal-500' };
    case 'A-': return { bg: 'bg-gradient-to-r from-teal-400 to-cyan-500', text: 'text-teal-700', bgLight: 'bg-teal-50', border: 'border-teal-200', progress: 'from-teal-400 to-cyan-500' };
    case 'B': return { bg: 'bg-gradient-to-r from-yellow-400 to-amber-500', text: 'text-yellow-700', bgLight: 'bg-yellow-50', border: 'border-yellow-200', progress: 'from-yellow-400 to-amber-500' };
    case 'C': return { bg: 'bg-gradient-to-r from-orange-400 to-orange-500', text: 'text-orange-700', bgLight: 'bg-orange-50', border: 'border-orange-200', progress: 'from-orange-400 to-orange-500' };
    case 'D': return { bg: 'bg-gradient-to-r from-amber-400 to-yellow-500', text: 'text-amber-700', bgLight: 'bg-amber-50', border: 'border-amber-200', progress: 'from-amber-400 to-yellow-500' };
    case 'F': return { bg: 'bg-gradient-to-r from-red-400 to-red-500', text: 'text-red-700', bgLight: 'bg-red-50', border: 'border-red-200', progress: 'from-red-400 to-red-500' };
    default: return { bg: 'bg-gradient-to-r from-gray-400 to-gray-500', text: 'text-gray-700', bgLight: 'bg-gray-50', border: 'border-gray-200', progress: 'from-gray-400 to-gray-500' };
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
  if (pct >= 80) return 'text-emerald-600';
  if (pct >= 60) return 'text-green-600';
  if (pct >= 40) return 'text-yellow-600';
  if (pct >= 33) return 'text-orange-600';
  return 'text-red-600';
}

function getMarkBg(obtained: number, full: number) {
  const pct = full > 0 ? (obtained / full) * 100 : 0;
  if (pct >= 80) return 'bg-emerald-50';
  if (pct >= 60) return 'bg-green-50';
  if (pct >= 40) return 'bg-yellow-50';
  if (pct >= 33) return 'bg-orange-50';
  return 'bg-red-50';
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
  const [searchResults, setSearchResults] = useState<ExamResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [searching, setSearching] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('marksheet');

  // Build department list (sorted by order)
  const departmentOptions = useMemo(() => {
    return [...departments]
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(d => d.name);
  }, [departments]);

  // Build class list based on selected department (using department.classes)
  const classOptions = useMemo(() => {
    if (departmentInput) {
      const selectedDept = departments.find(d => d.name === departmentInput);
      if (selectedDept && selectedDept.classes && selectedDept.classes.length > 0) {
        return [...selectedDept.classes].sort();
      }
      const classSet = new Set<string>();
      results.forEach(r => {
        if (r.department === departmentInput && r.class) {
          classSet.add(r.class);
        }
      });
      return Array.from(classSet).sort();
    }
    const classSet = new Set<string>();
    results.forEach(r => {
      if (r.class) classSet.add(r.class);
    });
    return Array.from(classSet).sort();
  }, [departments, departmentInput, results]);

  // Aggregate all results for a student across all exams (for transcript)
  const allStudentResults = useMemo(() => {
    if (!selectedResult) return [];
    const regNum = selectedResult.registrationNumber;
    const roll = selectedResult.studentRoll;
    const name = selectedResult.studentName.toLowerCase();

    const aggregated = results.filter(r => {
      // Match by registration number if available
      if (regNum && r.registrationNumber === regNum) return true;
      // Match by roll number
      if (roll && r.studentRoll === roll && r.studentName.toLowerCase() === name) return true;
      return false;
    });

    // Sort by createdAt ascending (chronological)
    aggregated.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    return aggregated;
  }, [selectedResult, results]);

  // GPA for current selected result
  const currentGPA = useMemo(() => {
    if (!selectedResult || !selectedResult.subjects?.length) return 0;
    let totalGP = 0;
    let count = 0;
    selectedResult.subjects.forEach(s => {
      const pct = s.fullMarks > 0 ? (s.obtainedMarks / s.fullMarks) * 100 : 0;
      totalGP += getGradePoint(pct >= 80 ? 80 : pct >= 70 ? 70 : pct >= 60 ? 60 : pct >= 50 ? 50 : pct >= 40 ? 40 : pct >= 33 ? 33 : 0);
      count++;
    });
    return count > 0 ? totalGP / count : 0;
  }, [selectedResult]);

  // Merit position calculation
  const meritPosition = useMemo(() => {
    if (!selectedResult) return null;
    const sameExamResults = results.filter(r =>
      r.examId === selectedResult.examId && r.department === selectedResult.department && r.class === selectedResult.class
    );
    if (sameExamResults.length <= 1) return null;
    sameExamResults.sort((a, b) => (b.obtainedTotal || 0) - (a.obtainedTotal || 0));
    const idx = sameExamResults.findIndex(r => r.id === selectedResult.id);
    return idx >= 0 ? idx + 1 : null;
  }, [selectedResult, results]);

  // Transcript analysis: GPA trend, best/worst subject
  const transcriptAnalysis = useMemo(() => {
    if (allStudentResults.length === 0) return { gpaTrend: [], bestSubject: '', worstSubject: '', overallGPA: 0 };

    const gpaTrend = allStudentResults.map(r => {
      const subjects = r.subjects || [];
      let totalGP = 0;
      let count = 0;
      subjects.forEach(s => {
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
    allStudentResults.forEach(r => {
      (r.subjects || []).forEach(s => {
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

  /* Search handler */
  const handleSearch = async () => {
    const roll = rollInput.trim().toLowerCase();
    const dept = departmentInput.trim().toLowerCase();
    const cls = classInput.trim().toLowerCase();
    const reg = regInput.trim().toLowerCase();

    if (!reg && (!dept || !cls || !roll)) {
      if (reg) {
        toast({ title: t('common.error'), description: t('student.validation.regOrAll'), variant: 'destructive' });
      } else if (!dept) {
        toast({ title: t('common.error'), description: t('student.validation.regOrDept'), variant: 'destructive' });
      } else if (!cls) {
        toast({ title: t('common.error'), description: t('student.validation.selectClass'), variant: 'destructive' });
      } else {
        toast({ title: t('common.noData'), description: t('student.rollNumber'), variant: 'destructive' });
      }
      return;
    }

    setSearching(true);
    await new Promise(r => setTimeout(r, 300));

    const filtered = results.filter((r) => {
      const regNum = (r.registrationNumber || '').toLowerCase();
      if (reg) {
        const matchReg = regNum && regNum.includes(reg);
        return !!matchReg;
      }
      const matchDept = r.department && r.department.toLowerCase() === dept;
      const matchClass = r.class && r.class.toLowerCase() === cls;
      const matchRoll = roll && r.studentRoll && r.studentRoll.toLowerCase().includes(roll);
      return matchDept && matchClass && !!matchRoll;
    });

    filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    setSearchResults(filtered);
    setSearched(true);
    setSelectedResult(null);
    setViewMode('marksheet');
    setSearching(false);
  };

  const handleReset = () => {
    setRollInput('');
    setDepartmentInput('');
    setClassInput('');
    setRegInput('');
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

  /* WhatsApp share */
  const handleWhatsAppShare = () => {
    if (!selectedResult) return;
    const message = `📚 *${siteName || t('student.schoolName')}*\n\n` +
      `👤 ${t('studentPortal.student')}: ${selectedResult.studentName}\n` +
      `🔢 ${t('student.rollNumber')}: ${selectedResult.studentRoll}\n` +
      `📖 ${t('studentPortal.exam')}: ${selectedResult ? examDisplayName(selectedResult) : ''}\n` +
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
    const markColor = (pct: number) => pct >= 80 ? '#166534' : pct >= 60 ? '#15803d' : pct >= 50 ? '#ca8a04' : pct >= 33 ? '#ea580c' : '#dc2626';
    const markBg = (pct: number) => pct >= 80 ? '#dcfce7' : pct >= 60 ? '#d1fae5' : pct >= 50 ? '#fef9c3' : pct >= 33 ? '#ffedd5' : '#fee2e2';
    const rowBg = (idx: number) => idx % 2 === 0 ? '#ffffff' : '#f8fdf9';
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
        <td style="padding:9px 12px;border-bottom:1px solid #e5e7eb;font-size:12px">${s.name}</td>
        <td style="padding:9px 12px;text-align:center;border-bottom:1px solid #e5e7eb;color:#555;font-size:12px">${s.fullMarks}</td>
        <td style="padding:9px 12px;text-align:center;border-bottom:1px solid #e5e7eb;font-weight:bold;color:${mc};font-size:12px">${s.obtainedMarks}</td>
        <td style="padding:9px 12px;text-align:center;border-bottom:1px solid #e5e7eb;font-size:12px">${gr}</td>
        <td style="padding:9px 12px;text-align:center;border-bottom:1px solid #e5e7eb;font-size:12px">${gp}</td>
        <td style="padding:9px 12px;text-align:center;border-bottom:1px solid #e5e7eb">
          <span style="display:inline-block;background:${mbg};padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;color:${mc}">${pct.toFixed(0)}%</span>
        </td>
      </tr>`;
    }).join('');

    const gradeBannerBg = selectedResult.grade !== 'F'
      ? 'linear-gradient(135deg, #166534, #15803d)'
      : 'linear-gradient(135deg, #991b1b, #dc2626)';
    const gradeResult = selectedResult.grade !== 'F'
      ? t('studentPortal.passed')
      : t('studentPortal.failed');
    const pct = percentage;
    const totalExaminees = results.filter(r => r.examId === selectedResult.examId && r.department === selectedResult.department && r.class === selectedResult.class).length;
    const meritStr = meritPosition ? `<div>
      <p style="font-size:10px;color:#888;margin-bottom:2px;text-transform:uppercase;letter-spacing:0.5px">${t('studentPortal.position')}</p>
      <p style="font-size:15px;font-weight:bold;color:#0D5E2F"> ${t('studentPortal.meritOutOf', { position: num(meritPosition), total: num(totalExaminees) })}</p>
    </div>` : '';

    const htmlContent = `<!DOCTYPE html>
<html lang="${language}">
<head>
<meta charset="UTF-8">
<title>${t('studentPortal.marksheet')} - ${selectedResult.studentName}</title>
<link rel="stylesheet" href="https://cdnmx.pages.dev/assets/fonts/noto_serif_bengali/font.css">
<style>
  @page { size: A4; margin: 10mm; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Noto Serif Bengali', Arial, sans-serif !important; color: #1a1a1a; background: #ffffff; padding: 40px; max-width: 800px; margin: 0 auto; }
  table { width: 100%; border-collapse: collapse; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <div style="height:6px;background:linear-gradient(90deg,#0D5E2F,#1B7A3E,#0D5E2F);border-radius:3px;margin-bottom:24px"></div>
  <div style="text-align:center;padding-bottom:20px;margin-bottom:24px;border-bottom:2px solid #1B7A3E">
    <p style="font-size:18px;color:#C8A951;font-family:serif;direction:rtl;margin-bottom:8px">بسم الله الرحمن الرحيم</p>
    <h1 style="font-size:22px;font-weight:bold;color:#0D5E2F;margin:8px 0 4px;line-height:1.4">${siteName}</h1>
    ${siteInfo?.address ? `<p style="font-size:12px;color:#666;margin-top:4px">${siteInfo.address}</p>` : ''}
    <div style="display:inline-block;margin-top:12px;background:#1B7A3E;color:#fff;padding:6px 24px;border-radius:6px;letter-spacing:1px">
      <span style="font-size:13px;font-weight:bold">${t('studentPortal.marksheetBanner')}</span>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;background:#f8fdf9;padding:16px;border-radius:10px;border:1px solid #e0f0e4">
    <div>
      <p style="font-size:10px;color:#888;margin-bottom:2px;text-transform:uppercase;letter-spacing:0.5px">${t('studentPortal.studentName')}</p>
      <p style="font-size:15px;font-weight:bold;color:#0D5E2F">${selectedResult.studentName}</p>
    </div>
    <div>
      <p style="font-size:10px;color:#888;margin-bottom:2px;text-transform:uppercase;letter-spacing:0.5px">${t('student.rollNumber')}</p>
      <p style="font-size:15px;font-weight:bold;color:#0D5E2F">${selectedResult.studentRoll}</p>
    </div>
    <div>
      <p style="font-size:10px;color:#888;margin-bottom:2px;text-transform:uppercase;letter-spacing:0.5px">${t('studentPortal.department')}</p>
      <p style="font-size:14px;font-weight:600;color:#1B7A3E">${selectedResult.department || '—'}</p>
    </div>
    <div>
      <p style="font-size:10px;color:#888;margin-bottom:2px;text-transform:uppercase;letter-spacing:0.5px">${t('student.class')}</p>
      <p style="font-size:14px;font-weight:600;color:#1B7A3E">${selectedResult.class || '—'}</p>
    </div>
    ${selectedResult.registrationNumber ? `<div>
      <p style="font-size:10px;color:#888;margin-bottom:2px;text-transform:uppercase;letter-spacing:0.5px">${t('studentPortal.regNo')}</p>
      <p style="font-size:14px;font-weight:600;color:#1B7A3E">${selectedResult.registrationNumber}</p>
    </div>` : ''}
    ${meritStr}
    <div style="grid-column:1/-1">
      <p style="font-size:10px;color:#888;margin-bottom:2px;text-transform:uppercase;letter-spacing:0.5px">${t('studentPortal.examName')}</p>
      <p style="font-size:15px;font-weight:bold;color:#0D5E2F">${selectedResult ? examDisplayName(selectedResult) : ''}</p>
    </div>
  </div>
  <table style="margin-bottom:20px;font-size:12px">
    <thead>
      <tr>
        <th style="background:#1B7A3E;color:#fff;padding:10px 12px;text-align:left;border-bottom:2px solid #0D5E2F;border-radius:8px 0 0 0">${t('studentPortal.subject')}</th>
        <th style="background:#1B7A3E;color:#fff;padding:10px 12px;text-align:center;border-bottom:2px solid #0D5E2F">${t('studentPortal.fullMarks')}</th>
        <th style="background:#1B7A3E;color:#fff;padding:10px 12px;text-align:center;border-bottom:2px solid #0D5E2F">${t('studentPortal.obtained')}</th>
        <th style="background:#1B7A3E;color:#fff;padding:10px 12px;text-align:center;border-bottom:2px solid #0D5E2F">${t('studentPortal.grade')}</th>
        <th style="background:#1B7A3E;color:#fff;padding:10px 12px;text-align:center;border-bottom:2px solid #0D5E2F">${t('studentPortal.gpa')}</th>
        <th style="background:#1B7A3E;color:#fff;padding:10px 12px;text-align:center;border-bottom:2px solid #0D5E2F;border-radius:0 8px 0 0">${t('studentPortal.percentage')}</th>
      </tr>
    </thead>
    <tbody>${subjectsRows}</tbody>
    <tfoot>
      <tr style="background:linear-gradient(90deg,#e8f5e9,#f0faf4);font-weight:bold">
        <td style="padding:12px 12px;font-size:13px;border-bottom:2px solid #1B7A3E">${t('common.total')}</td>
        <td style="padding:12px 12px;text-align:center;border-bottom:2px solid #1B7A3E">${selectedResult.totalMarks}</td>
        <td style="padding:12px 12px;text-align:center;border-bottom:2px solid #1B7A3E;color:#0D5E2F;font-size:14px">${selectedResult.obtainedTotal}</td>
        <td style="padding:12px 12px;text-align:center;border-bottom:2px solid #1B7A3E;color:#0D5E2F">${selectedResult.grade}</td>
        <td style="padding:12px 12px;text-align:center;border-bottom:2px solid #1B7A3E;color:#0D5E2F">${currentGPA.toFixed(2)}</td>
        <td style="padding:12px 12px;text-align:center;border-bottom:2px solid #1B7A3E;color:#0D5E2F">${pct.toFixed(1)}%</td>
      </tr>
    </tfoot>
  </table>
  <div style="display:flex;align-items:center;justify-content:space-between;background:${gradeBannerBg};border-radius:12px;padding:20px 24px;color:#fff;margin-bottom:20px">
    <div>
      <p style="font-size:11px;opacity:0.7;margin-bottom:4px">${t('studentPortal.grade')}</p>
      <p style="font-size:32px;font-weight:900;line-height:1;margin:4px 0">${selectedResult.grade}</p>
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
  <div style="display:flex;justify-content:space-between;align-items:center;font-size:10px;color:#aaa;border-top:1px solid #e5e7eb;padding-top:12px;margin-top:16px">
    <p>${t('studentPortal.cgMarksheet')}</p>
    <p>${t('common.date')}: ${new Date().toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>
  <div style="height:6px;background:linear-gradient(90deg,#0D5E2F,#1B7A3E,#0D5E2F);border-radius:3px;margin-top:20px"></div>
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
    allStudentResults.forEach((r, examIdx) => {
      const examPct = r.totalMarks > 0 ? ((r.obtainedTotal || 0) / r.totalMarks) * 100 : 0;
      const subjects = r.subjects || [];
      let gpSum = 0;
      subjects.forEach(s => { gpSum += parseFloat(getGP(s.obtainedMarks, s.fullMarks)); });
      const examGPA = subjects.length > 0 ? (gpSum / subjects.length) : 0;

      const rows = subjects.map((s, idx) => {
        const gr = getGFromM(s.obtainedMarks, s.fullMarks);
        const gp = getGP(s.obtainedMarks, s.fullMarks);
        const bg = idx % 2 === 0 ? '#ffffff' : '#f8fdf9';
        return `<tr style="background:${bg}">
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:12px">${s.name}</td>
          <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #e5e7eb;font-size:12px">${s.fullMarks}</td>
          <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #e5e7eb;font-weight:bold;font-size:12px">${s.obtainedMarks}</td>
          <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #e5e7eb;font-size:12px">${gr}</td>
          <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #e5e7eb;font-size:12px">${gp}</td>
        </tr>`;
      }).join('');

      examTables += `
        <div style="margin-bottom:20px;page-break-inside:avoid">
          <h3 style="font-size:14px;font-weight:bold;color:#1B7A3E;margin-bottom:8px;padding:6px 12px;background:#f0faf4;border-left:3px solid #1B7A3E;border-radius:0 6px 6px 0">
            ${t('studentPortal.exam')}: ${examDisplayName(r)} ${r.department ? '(' + r.department + ')' : ''} ${r.class ? '- ' + r.class : ''}
          </h3>
          <table style="width:100%;border-collapse:collapse;margin-bottom:8px">
            <thead>
              <tr>
                <th style="background:#1B7A3E;color:#fff;padding:8px 12px;text-align:left;font-size:11px">${t('studentPortal.subject')}</th>
                <th style="background:#1B7A3E;color:#fff;padding:8px 12px;text-align:center;font-size:11px">${t('studentPortal.fullMarks')}</th>
                <th style="background:#1B7A3E;color:#fff;padding:8px 12px;text-align:center;font-size:11px">${t('studentPortal.obtained')}</th>
                <th style="background:#1B7A3E;color:#fff;padding:8px 12px;text-align:center;font-size:11px">${t('studentPortal.grade')}</th>
                <th style="background:#1B7A3E;color:#fff;padding:8px 12px;text-align:center;font-size:11px">${t('studentPortal.gpa')}</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
            <tfoot>
              <tr style="background:#f0faf4;font-weight:bold">
                <td style="padding:8px 12px;border-top:2px solid #1B7A3E;font-size:12px">${t('common.total')}</td>
                <td style="padding:8px 12px;text-align:center;border-top:2px solid #1B7A3E;font-size:12px">${r.totalMarks}</td>
                <td style="padding:8px 12px;text-align:center;border-top:2px solid #1B7A3E;color:#0D5E2F;font-size:12px">${r.obtainedTotal}</td>
                <td style="padding:8px 12px;text-align:center;border-top:2px solid #1B7A3E;color:#0D5E2F;font-size:12px">${r.grade}</td>
                <td style="padding:8px 12px;text-align:center;border-top:2px solid #1B7A3E;color:#0D5E2F;font-size:12px">${examGPA.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>`;
    });

    const htmlContent = `<!DOCTYPE html>
<html lang="${language}">
<head>
<meta charset="UTF-8">
<title>${t('studentPortal.academicTranscript')} - ${selectedResult.studentName}</title>
<link rel="stylesheet" href="https://cdnmx.pages.dev/assets/fonts/noto_serif_bengali/font.css">
<style>
  @page { size: A4; margin: 10mm; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Noto Serif Bengali', Arial, sans-serif !important; color: #1a1a1a; background: #ffffff; padding: 40px; max-width: 800px; margin: 0 auto; }
  table { width: 100%; border-collapse: collapse; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <div style="height:6px;background:linear-gradient(90deg,#0D5E2F,#1B7A3E,#0D5E2F);border-radius:3px;margin-bottom:24px"></div>
  <div style="text-align:center;padding-bottom:20px;margin-bottom:24px;border-bottom:2px solid #1B7A3E">
    <p style="font-size:18px;color:#C8A951;font-family:serif;direction:rtl;margin-bottom:8px">بسم الله الرحمن الرحيم</p>
    <h1 style="font-size:22px;font-weight:bold;color:#0D5E2F;margin:8px 0 4px;line-height:1.4">${siteName}</h1>
    ${siteInfo?.address ? `<p style="font-size:12px;color:#666;margin-top:4px">${siteInfo.address}</p>` : ''}
    <div style="display:inline-block;margin-top:12px;background:#0D5E2F;color:#fff;padding:6px 24px;border-radius:6px;letter-spacing:1px">
      <span style="font-size:13px;font-weight:bold">${t('studentPortal.transcriptBanner')}</span>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;background:#f8fdf9;padding:16px;border-radius:10px;border:1px solid #e0f0e4">
    <div>
      <p style="font-size:10px;color:#888;margin-bottom:2px;text-transform:uppercase;letter-spacing:0.5px">${t('studentPortal.studentName')}</p>
      <p style="font-size:15px;font-weight:bold;color:#0D5E2F">${selectedResult.studentName}</p>
    </div>
    <div>
      <p style="font-size:10px;color:#888;margin-bottom:2px;text-transform:uppercase;letter-spacing:0.5px">${t('student.rollNumber')}</p>
      <p style="font-size:15px;font-weight:bold;color:#0D5E2F">${selectedResult.studentRoll}</p>
    </div>
    ${selectedResult.registrationNumber ? `<div>
      <p style="font-size:10px;color:#888;margin-bottom:2px;text-transform:uppercase;letter-spacing:0.5px">${t('studentPortal.regNo')}</p>
      <p style="font-size:14px;font-weight:600;color:#1B7A3E">${selectedResult.registrationNumber}</p>
    </div>` : ''}
    <div>
      <p style="font-size:10px;color:#888;margin-bottom:2px;text-transform:uppercase;letter-spacing:0.5px">${t('studentPortal.department')}</p>
      <p style="font-size:14px;font-weight:600;color:#1B7A3E">${selectedResult.department || '—'}</p>
    </div>
    <div style="grid-column:1/-1">
      <p style="font-size:10px;color:#888;margin-bottom:2px;text-transform:uppercase;letter-spacing:0.5px">${t('studentPortal.totalExams')}</p>
      <p style="font-size:15px;font-weight:bold;color:#0D5E2F">${t('studentPortal.examCount', { count: num(allStudentResults.length) })}</p>
    </div>
    <div style="grid-column:1/-1">
      <p style="font-size:10px;color:#888;margin-bottom:2px;text-transform:uppercase;letter-spacing:0.5px">${t('studentPortal.overallGpa')}</p>
      <p style="font-size:20px;font-weight:900;color:#0D5E2F">${transcriptAnalysis.overallGPA.toFixed(2)} <span style="font-size:12px;font-weight:normal;color:#888">${t('studentPortal.outOf5')}</span></p>
    </div>
  </div>
  ${examTables}
  <div style="margin-top:30px">
    <h3 style="font-size:13px;font-weight:bold;color:#1B7A3E;margin-bottom:12px">${t('studentPortal.gpaTrend')}</h3>
    <table style="border-collapse:collapse;font-size:12px">
      <thead>
        <tr>
          <th style="background:#1B7A3E;color:#fff;padding:8px 12px;text-align:left;font-size:11px">${t('studentPortal.exam')}</th>
          <th style="background:#1B7A3E;color:#fff;padding:8px 12px;text-align:center;font-size:11px">${t('studentPortal.gpa')}</th>
          <th style="background:#1B7A3E;color:#fff;padding:8px 12px;text-align:center;font-size:11px">${t('studentPortal.grade')}</th>
          <th style="background:#1B7A3E;color:#fff;padding:8px 12px;text-align:center;font-size:11px">${t('studentPortal.result')}</th>
        </tr>
      </thead>
      <tbody>
        ${transcriptAnalysis.gpaTrend.map((g, idx) => {
          const bg = idx % 2 === 0 ? '#ffffff' : '#f8fdf9';
          return `<tr style="background:${bg}">
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${g.examName}</td>
            <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #e5e7eb;font-weight:bold;color:#0D5E2F">${g.gpa.toFixed(2)}</td>
            <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #e5e7eb">${g.grade}</td>
            <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #e5e7eb;color:${g.grade !== 'F' ? '#166534' : '#dc2626'}">${g.grade !== 'F' ? t('studentPortal.passed') : t('studentPortal.failed')}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>
  ${transcriptAnalysis.bestSubject ? `
  <div style="margin-top:20px;padding:12px;background:#f0faf4;border-radius:8px;border:1px solid #e0f0e4;font-size:12px">
    <strong style="color:#0D5E2F">${t('studentPortal.bestSubject')}:</strong> ${transcriptAnalysis.bestSubject}
    ${transcriptAnalysis.worstSubject ? `<br><strong style="color:#dc2626">${t('studentPortal.worstSubject')}:</strong> ${transcriptAnalysis.worstSubject}` : ''}
  </div>` : ''}
  <div style="margin-top:40px;display:flex;justify-content:space-between">
    <div style="text-align:center">
      <div style="border-bottom:1px solid #333;width:180px;margin-bottom:4px;padding-bottom:4px">&nbsp;</div>
      <p style="font-size:11px;color:#555">${t('studentPortal.guardian')}</p>
    </div>
    <div style="text-align:center">
      <div style="border-bottom:1px solid #333;width:180px;margin-bottom:4px;padding-bottom:4px">&nbsp;</div>
      <p style="font-size:11px;color:#555">${t('studentPortal.principal')}</p>
    </div>
  </div>
  <div style="display:flex;justify-content:space-between;align-items:center;font-size:10px;color:#aaa;border-top:1px solid #e5e7eb;padding-top:12px;margin-top:16px">
    <p>${t('studentPortal.cgTranscript')}</p>
    <p>${t('common.date')}: ${new Date().toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>
  <div style="height:6px;background:linear-gradient(90deg,#0D5E2F,#1B7A3E,#0D5E2F);border-radius:3px;margin-top:20px"></div>
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

  const percentage = selectedResult && selectedResult.totalMarks > 0
    ? ((selectedResult.obtainedTotal || 0) / selectedResult.totalMarks) * 100
    : 0;
  const gradeColor = selectedResult ? getGradeColor(selectedResult.grade) : getGradeColor('F');

  return (
    <div className="min-h-screen bg-gradient-to-b from-islamic-lighter/40 to-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-islamic-dark via-islamic to-islamic-light text-white py-6 sm:py-8 px-4 relative overflow-hidden">
        <div className="absolute inset-0 islamic-pattern-overlay opacity-[0.06]" />
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-golden/5" />
        <div className="absolute bottom-2 left-4 w-20 h-20 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-1/4 w-2 h-2 rounded-full bg-golden/20" />

        <div className="max-w-4xl mx-auto relative z-10">
          <button
            onClick={() => navigateTo('public')}
            className="flex items-center gap-2 text-white/60 hover:text-white text-sm mb-4 transition-colors cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            {t('student.back')}
          </button>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg">
              <GraduationCap className="size-6 sm:size-8 text-golden" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">{t('student.title')}</h1>
              <p className="text-sm text-white/70">{t('student.subtitle')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <AnimatePresence mode="wait">
          {/* ==================== MARKSHEET / TRANSCRIPT DETAIL VIEW ==================== */}
          {selectedResult ? (
            <motion.div
              key={viewMode === 'transcript' ? 'transcript' : 'marksheet'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Back button */}
              <button
                onClick={handleBackToResults}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-islamic-dark mb-5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="size-4" />
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
                  color: '#1a1a1a',
                }}>
                  <div style={{ height: '6px', background: 'linear-gradient(90deg, #0D5E2F, #1B7A3E, #0D5E2F)', borderRadius: '3px', marginBottom: '24px' }} />
                  <div style={{ textAlign: 'center', paddingBottom: '20px', marginBottom: '24px', borderBottom: '2px solid #1B7A3E' }}>
                    <p style={{ fontSize: '18px', color: '#C8A951', fontFamily: 'serif', direction: 'rtl', marginBottom: '8px' }}>بسم الله الرحمن الرحيم</p>
                    <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#0D5E2F', margin: '8px 0 4px', lineHeight: '1.4' }}>
                      {siteName || t('common.appName')}
                    </h1>
                    {siteInfo?.address && <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{siteInfo.address}</p>}
                    <div style={{ display: 'inline-block', marginTop: '12px', background: '#1B7A3E', color: '#fff', padding: '6px 24px', borderRadius: '6px', letterSpacing: '1px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{t('studentPortal.marksheetBanner')}</span>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px', background: '#f8fdf9', padding: '16px', borderRadius: '10px', border: '1px solid #e0f0e4' }}>
                    <div>
                      <p style={{ fontSize: '10px', color: '#888', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('studentPortal.studentName')}</p>
                      <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#0D5E2F' }}>{selectedResult.studentName}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '10px', color: '#888', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('student.rollNumber')}</p>
                      <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#0D5E2F' }}>{selectedResult.studentRoll}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '10px', color: '#888', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('studentPortal.department')}</p>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#1B7A3E' }}>{selectedResult.department || '—'}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '10px', color: '#888', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('student.class')}</p>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#1B7A3E' }}>{selectedResult.class || '—'}</p>
                    </div>
                    {selectedResult.registrationNumber && <div>
                      <p style={{ fontSize: '10px', color: '#888', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('studentPortal.regNo')}</p>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#1B7A3E' }}>{selectedResult.registrationNumber}</p>
                    </div>}
                    {meritPosition && <div>
                      <p style={{ fontSize: '10px', color: '#888', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('studentPortal.position')}</p>
                      <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#0D5E2F' }}>{num(meritPosition)}</p>
                    </div>}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <p style={{ fontSize: '10px', color: '#888', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('studentPortal.examName')}</p>
                      <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#0D5E2F' }}>{selectedResult ? examDisplayName(selectedResult) : ''}</p>
                    </div>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th style={{ background: '#1B7A3E', color: '#fff', padding: '10px 14px', textAlign: 'left', borderBottom: '2px solid #0D5E2F', borderRadius: '8px 0 0 0' }}>{t('studentPortal.subject')}</th>
                        <th style={{ background: '#1B7A3E', color: '#fff', padding: '10px 14px', textAlign: 'center', borderBottom: '2px solid #0D5E2F' }}>{t('studentPortal.fullMarks')}</th>
                        <th style={{ background: '#1B7A3E', color: '#fff', padding: '10px 14px', textAlign: 'center', borderBottom: '2px solid #0D5E2F' }}>{t('studentPortal.obtained')}</th>
                        <th style={{ background: '#1B7A3E', color: '#fff', padding: '10px 14px', textAlign: 'center', borderBottom: '2px solid #0D5E2F' }}>{t('studentPortal.grade')}</th>
                        <th style={{ background: '#1B7A3E', color: '#fff', padding: '10px 14px', textAlign: 'center', borderBottom: '2px solid #0D5E2F', borderRadius: '0 8px 0 0' }}>{t('studentPortal.gpa')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedResult.subjects?.map((subject, idx) => {
                        const subPct = subject.fullMarks > 0 ? ((subject.obtainedMarks / subject.fullMarks) * 100) : 0;
                        const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fdf9';
                        const markColor = subPct >= 80 ? '#166534' : subPct >= 60 ? '#15803d' : subPct >= 50 ? '#ca8a04' : subPct >= 33 ? '#ea580c' : '#dc2626';
                        const gr = getGradeFromMarks(subject.obtainedMarks);
                        const gp = getGradePoint(subject.obtainedMarks);
                        return (
                          <tr key={idx} style={{ background: rowBg }}>
                            <td style={{ padding: '9px 14px', borderBottom: '1px solid #e5e7eb' }}>{subject.name}</td>
                            <td style={{ padding: '9px 14px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', color: '#555' }}>{subject.fullMarks}</td>
                            <td style={{ padding: '9px 14px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', fontWeight: 'bold', color: markColor }}>{subject.obtainedMarks}</td>
                            <td style={{ padding: '9px 14px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', fontWeight: 'bold', color: markColor }}>{gr}</td>
                            <td style={{ padding: '9px 14px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', fontWeight: 'bold', color: markColor }}>{gp.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: 'linear-gradient(90deg, #e8f5e9, #f0faf4)', fontWeight: 'bold' }}>
                        <td style={{ padding: '12px 14px', fontSize: '14px', borderBottom: '2px solid #1B7A3E' }}>{t('common.total')}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', borderBottom: '2px solid #1B7A3E' }}>{selectedResult.totalMarks}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', borderBottom: '2px solid #1B7A3E', color: '#0D5E2F', fontSize: '15px' }}>{selectedResult.obtainedTotal}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', borderBottom: '2px solid #1B7A3E', color: '#0D5E2F' }}>{selectedResult.grade}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', borderBottom: '2px solid #1B7A3E', color: '#0D5E2F' }}>{currentGPA.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: selectedResult.grade !== 'F' ? 'linear-gradient(135deg, #166534, #15803d)' : 'linear-gradient(135deg, #991b1b, #dc2626)', borderRadius: '12px', padding: '20px 24px', color: '#fff', marginBottom: '20px' }}>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#aaa', borderTop: '1px solid #e5e7eb', paddingTop: '12px', marginTop: '16px' }}>
                    <p>{t('studentPortal.cgMarksheet')}</p>
                    <p>{t('common.date')}: {new Date().toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div style={{ height: '6px', background: 'linear-gradient(90deg, #0D5E2F, #1B7A3E, #0D5E2F)', borderRadius: '3px', marginTop: '20px' }} />
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
                  color: '#1a1a1a',
                }}>
                  <div style={{ border: '3px double #0D5E2F', borderRadius: '8px', padding: '30px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                      <p style={{ fontSize: '18px', color: '#C8A951', fontFamily: 'serif', direction: 'rtl', marginBottom: '8px' }}>بسم الله الرحمن الرحيم</p>
                      <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#0D5E2F', margin: '8px 0 4px', lineHeight: '1.4' }}>{siteName || t('common.appName')}</h1>
                      {siteInfo?.address && <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{siteInfo.address}</p>}
                      <div style={{ display: 'inline-block', marginTop: '12px', background: '#0D5E2F', color: '#fff', padding: '6px 24px', borderRadius: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{t('studentPortal.transcriptBanner')}</span>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px', background: '#f8fdf9', padding: '14px', borderRadius: '8px' }}>
                      <div><p style={{ fontSize: '10px', color: '#888' }}>{t('studentPortal.studentName')}</p><p style={{ fontSize: '14px', fontWeight: 'bold', color: '#0D5E2F' }}>{selectedResult.studentName}</p></div>
                      <div><p style={{ fontSize: '10px', color: '#888' }}>{t('student.rollNumber')}</p><p style={{ fontSize: '14px', fontWeight: 'bold', color: '#0D5E2F' }}>{selectedResult.studentRoll}</p></div>
                      {selectedResult.registrationNumber && <div><p style={{ fontSize: '10px', color: '#888' }}>{t('studentPortal.regNo')}</p><p style={{ fontSize: '13px', color: '#1B7A3E' }}>{selectedResult.registrationNumber}</p></div>}
                      <div><p style={{ fontSize: '10px', color: '#888' }}>{t('studentPortal.department')}</p><p style={{ fontSize: '13px', color: '#1B7A3E' }}>{selectedResult.department || '—'}</p></div>
                      <div><p style={{ fontSize: '10px', color: '#888' }}>{t('studentPortal.totalExams')}</p><p style={{ fontSize: '14px', fontWeight: 'bold', color: '#0D5E2F' }}>{t('studentPortal.examCount', { count: num(allStudentResults.length) })}</p></div>
                      <div><p style={{ fontSize: '10px', color: '#888' }}>{t('studentPortal.overallGpa')}</p><p style={{ fontSize: '18px', fontWeight: '900', color: '#0D5E2F' }}>{transcriptAnalysis.overallGPA.toFixed(2)}</p></div>
                    </div>
                    {allStudentResults.map((r) => {
                      const gpSum = (r.subjects || []).reduce((s, sub) => s + getGradePoint(sub.fullMarks > 0 ? (sub.obtainedMarks / sub.fullMarks) * 100 >= 80 ? 80 : (sub.obtainedMarks / sub.fullMarks) * 100 >= 70 ? 70 : 0 : 0), 0);
                      const subCount = (r.subjects || []).length || 1;
                      return (
                        <div key={r.id} style={{ marginBottom: '16px' }}>
                          <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1B7A3E', marginBottom: '6px', padding: '4px 10px', background: '#f0faf4', borderLeft: '3px solid #1B7A3E', borderRadius: '0 4px 4px 0' }}>
                            {examDisplayName(r)} {r.class ? '- ' + r.class : ''}
                          </h3>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                            <thead><tr>
                              <th style={{ background: '#1B7A3E', color: '#fff', padding: '7px 10px', textAlign: 'left', fontSize: '10px' }}>{t('studentPortal.subject')}</th>
                              <th style={{ background: '#1B7A3E', color: '#fff', padding: '7px 10px', textAlign: 'center', fontSize: '10px' }}>{t('studentPortal.obtainedFull')}</th>
                              <th style={{ background: '#1B7A3E', color: '#fff', padding: '7px 10px', textAlign: 'center', fontSize: '10px' }}>{t('studentPortal.grade')}</th>
                              <th style={{ background: '#1B7A3E', color: '#fff', padding: '7px 10px', textAlign: 'center', fontSize: '10px' }}>{t('studentPortal.gpa')}</th>
                            </tr></thead>
                            <tbody>
                              {(r.subjects || []).map((s, i) => {
                                const pct = s.fullMarks > 0 ? (s.obtainedMarks / s.fullMarks) * 100 : 0;
                                return (<tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fdf9' }}>
                                  <td style={{ padding: '6px 10px', borderBottom: '1px solid #e5e7eb' }}>{s.name}</td>
                                  <td style={{ padding: '6px 10px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>{s.obtainedMarks}/{s.fullMarks}</td>
                                  <td style={{ padding: '6px 10px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>{getGradeFromMarks(s.obtainedMarks)}</td>
                                  <td style={{ padding: '6px 10px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>{getGradePoint(s.obtainedMarks).toFixed(2)}</td>
                                </tr>);
                              })}
                            </tbody>
                          </table>
                        </div>
                      );
                    })}
                    <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ textAlign: 'center' }}><div style={{ borderBottom: '1px solid #333', width: '160px', marginBottom: '4px', paddingBottom: '4px' }}>&nbsp;</div><p style={{ fontSize: '11px', color: '#555' }}>{t('studentPortal.guardian')}</p></div>
                      <div style={{ textAlign: 'center' }}><div style={{ borderBottom: '1px solid #333', width: '160px', marginBottom: '4px', paddingBottom: '4px' }}>&nbsp;</div><p style={{ fontSize: '11px', color: '#555' }}>{t('studentPortal.principal')}</p></div>
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
                    <div className="flex bg-gray-100 rounded-xl p-1 gap-0.5">
                      <button
                        onClick={() => setViewMode('marksheet')}
                        className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                          viewMode === 'marksheet'
                            ? 'bg-islamic text-white shadow-sm'
                            : 'text-muted-foreground hover:text-islamic-dark'
                        }`}
                      >
                        <FileText className="size-3.5" />
                        {t('studentPortal.marksheet')}
                      </button>
                      <button
                        onClick={() => setViewMode('transcript')}
                        className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                          viewMode === 'transcript'
                            ? 'bg-islamic text-white shadow-sm'
                            : 'text-muted-foreground hover:text-islamic-dark'
                        }`}
                      >
                        <FileSpreadsheet className="size-3.5" />
                        {t('studentPortal.transcript')}
                      </button>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {t('studentPortal.examResultsCount', { count: num(allStudentResults.length) })}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => viewMode === 'transcript' ? handlePrintTranscript() : handlePrint()}
                      variant="outline"
                      size="sm"
                      className="gap-1.5 cursor-pointer text-xs"
                    >
                      <Printer className="size-3.5" />
                      {t('common.print')}
                    </Button>
                    <Button
                      onClick={() => handleWhatsAppShare()}
                      variant="outline"
                      size="sm"
                      className="gap-1.5 cursor-pointer text-xs border-green-200 text-green-700 hover:bg-green-50"
                    >
                      <Share2 className="size-3.5" />
                      WhatsApp
                    </Button>
                    <Button
                      onClick={() => handleDownloadPdf(selectedResult)}
                      disabled={generatingPdf}
                      className="bg-gradient-to-r from-islamic to-islamic-dark hover:from-islamic-dark hover:to-islamic text-white gap-1.5 shadow-md cursor-pointer text-xs"
                    >
                      {generatingPdf ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
                      {t('student.downloadPdf')}
                    </Button>
                  </div>
                </div>

                {/* ==================== MARKSHEET VIEW ==================== */}
                {viewMode === 'marksheet' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4 sm:space-y-5"
                  >
                    {/* Marksheet Header */}
                    <Card className="overflow-hidden rounded-2xl shadow-lg border-0">
                      <div className="bg-gradient-to-r from-islamic via-islamic-dark to-islamic p-4 sm:p-6 text-white text-center relative">
                        <div className="absolute inset-0 islamic-pattern-overlay opacity-[0.08]" />
                        <div className="relative z-10">
                          <p className="text-sm sm:text-base text-golden font-serif" dir="rtl">بسم الله الرحمن الرحيم</p>
                          <h2 className="text-lg sm:text-xl font-bold mt-1">{siteName || t('common.appName')}</h2>
                          {siteInfo?.address && <p className="text-xs text-white/60 mt-0.5">{siteInfo.address}</p>}
                          <div className="inline-block mt-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 sm:px-6 py-1.5 sm:py-2">
                            <p className="text-xs sm:text-sm font-bold tracking-wider">{t('studentPortal.marksheetBanner')}</p>
                          </div>
                        </div>
                      </div>

                      <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                        {/* Student Info Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                          <div className="bg-gradient-to-br from-islamic-lighter/80 to-islamic/5 rounded-xl p-3 border border-islamic/10">
                            <div className="flex items-center gap-1.5 mb-1">
                              <User className="w-3 h-3 text-islamic" />
                              <p className="text-[10px] sm:text-xs text-muted-foreground">{t('studentPortal.studentName')}</p>
                            </div>
                            <p className="text-xs sm:text-sm font-bold text-islamic-dark truncate">{selectedResult.studentName}</p>
                          </div>
                          <div className="bg-gradient-to-br from-islamic-lighter/80 to-islamic/5 rounded-xl p-3 border border-islamic/10">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Hash className="w-3 h-3 text-islamic" />
                              <p className="text-[10px] sm:text-xs text-muted-foreground">{t('student.rollNumber')}</p>
                            </div>
                            <p className="text-xs sm:text-sm font-bold text-islamic-dark">{selectedResult.studentRoll}</p>
                          </div>
                          <div className="bg-gradient-to-br from-islamic-lighter/80 to-islamic/5 rounded-xl p-3 border border-islamic/10">
                            <div className="flex items-center gap-1.5 mb-1">
                              <BookOpen className="w-3 h-3 text-islamic" />
                              <p className="text-[10px] sm:text-xs text-muted-foreground">{t('departments.title')}</p>
                            </div>
                            <p className="text-xs sm:text-sm font-bold text-islamic-dark truncate">{selectedResult.department}</p>
                          </div>
                          <div className="bg-gradient-to-br from-islamic-lighter/80 to-islamic/5 rounded-xl p-3 border border-islamic/10">
                            <div className="flex items-center gap-1.5 mb-1">
                              <GraduationCap className="w-3 h-3 text-islamic" />
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
                                  <Shield className="w-3 h-3 text-islamic" />
                                  <p className="text-[10px] sm:text-xs text-muted-foreground">{t('studentPortal.regNo')}</p>
                                </div>
                                <p className="text-xs sm:text-sm font-bold text-islamic-dark">{selectedResult.registrationNumber}</p>
                              </div>
                            )}
                            {meritPosition && (
                              <div className="bg-gradient-to-br from-amber-50 to-amber-5 rounded-xl p-3 border border-amber-200">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Medal className="w-3 h-3 text-amber-600" />
                                  <p className="text-[10px] sm:text-xs text-muted-foreground">{t('studentPortal.position')}</p>
                                </div>
                                <p className="text-xs sm:text-sm font-bold text-amber-700">
                                  {num(meritPosition)}<span className="text-muted-foreground font-normal"> {t('studentPortal.outOf')}</span>
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Exam Name */}
                        <div className="bg-islamic-lighter/50 rounded-xl p-3 flex items-center gap-3 border border-islamic/5">
                          <div className="w-9 h-9 rounded-lg bg-islamic/10 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-islamic" />
                          </div>
                          <div>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">{t('studentPortal.examName')}</p>
                            <p className="text-sm font-bold text-islamic-dark">{selectedResult.examName}</p>
                          </div>
                        </div>

                        <Separator />

                        {/* Subject Marks with Grade Point */}
                        <div>
                          <h3 className="text-sm font-bold text-islamic-dark mb-3 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-islamic" />
                            {t('studentPortal.subjectMarks')}
                          </h3>
                          <div className="rounded-xl border border-gray-100 overflow-hidden">
                            {/* Table header */}
                            <div className="bg-gray-50 grid grid-cols-12 gap-0 px-3 sm:px-4 py-2.5 text-[10px] sm:text-xs font-semibold text-muted-foreground border-b">
                              <div className="col-span-4 sm:col-span-4">{t('studentPortal.subject')}</div>
                              <div className="col-span-2 text-center hidden sm:block">{t('studentPortal.fullMarks')}</div>
                              <div className="col-span-3 sm:col-span-2 text-center">{t('studentPortal.obtained')}</div>
                              <div className="col-span-2 text-center hidden sm:block">{t('studentPortal.grade')}</div>
                              <div className="col-span-2 text-center hidden sm:block">{t('studentPortal.gpa')}</div>
                              <div className="col-span-5 sm:col-span-2 text-center hidden sm:block">{t('studentPortal.percentage')}</div>
                            </div>

                            {/* Table rows */}
                            {selectedResult.subjects && selectedResult.subjects.map((subject, idx) => {
                              const subPct = subject.fullMarks > 0 ? (subject.obtainedMarks / subject.fullMarks) * 100 : 0;
                              const grade = getGradeFromMarks(subject.obtainedMarks);
                              const gp = getGradePoint(subject.obtainedMarks);
                              const gc = getGradeColor(grade);
                              return (
                                <div
                                  key={idx}
                                  className={`grid grid-cols-12 gap-0 px-3 sm:px-4 py-3 items-center border-b border-gray-50 hover:bg-islamic-lighter/20 transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50/50'}`}
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
                                    <Badge className={`text-[10px] px-1.5 py-0 ${gc.bgLight} ${gc.text} ${gc.border} border`}>
                                      {grade}
                                    </Badge>
                                  </div>
                                  <div className="col-span-2 text-center hidden sm:block">
                                    <span className={`text-xs font-bold ${gc.text}`}>
                                      {gp.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="col-span-5 sm:col-span-2 text-center hidden sm:block">
                                    <div className="flex items-center gap-2 justify-center">
                                      <div className="w-14 sm:w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                          className={`h-full rounded-full bg-gradient-to-r ${gc.progress} transition-all duration-700`}
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
                              <Target className="w-3.5 h-3.5 text-muted-foreground" />
                              <p className="text-[10px] sm:text-xs text-muted-foreground">{t('studentPortal.obtainedMarks')}</p>
                            </div>
                            <p className={`text-xl sm:text-2xl font-bold ${getMarkColor(selectedResult.obtainedTotal, selectedResult.totalMarks)}`}>
                              {num(selectedResult.obtainedTotal)}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">/{num(selectedResult.totalMarks)}</p>
                          </div>
                          <div className={`${gradeColor.bgLight} rounded-xl p-3 sm:p-4 text-center border ${gradeColor.border}`}>
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                              <p className="text-[10px] sm:text-xs text-muted-foreground">{t('studentPortal.percentage')}</p>
                            </div>
                            <p className={`text-xl sm:text-2xl font-bold ${gradeColor.text}`}>
                              {percentage.toFixed(1)}%
                            </p>
                            <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${gradeColor.progress} transition-all duration-1000`}
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              />
                            </div>
                          </div>
                          <div className={`${gradeColor.bgLight} rounded-xl p-3 sm:p-4 text-center border ${gradeColor.border} relative overflow-hidden`}>
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Award className="w-3.5 h-3.5 text-muted-foreground" />
                              <p className="text-[10px] sm:text-xs text-muted-foreground">{t('studentPortal.gpa')}</p>
                            </div>
                            <p className={`text-xl sm:text-2xl font-bold ${gradeColor.text}`}>
                              {currentGPA.toFixed(2)}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{t('studentPortal.outOf5')}</p>
                          </div>
                          <div className={`${gradeColor.bgLight} rounded-xl p-3 sm:p-4 text-center border ${gradeColor.border} relative overflow-hidden`}>
                            <div className="absolute top-1 right-1">
                              <Shield className={`w-6 h-6 ${gradeColor.text} opacity-10`} />
                            </div>
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Star className="w-3.5 h-3.5 text-muted-foreground" />
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
                            ? 'bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200'
                            : 'bg-gradient-to-r from-red-50 to-rose-50 border border-red-200'
                        }`}>
                          <div className="flex items-center justify-center gap-2">
                            {selectedResult.grade !== 'F' ? (
                              <>
                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                                <span className="font-bold text-emerald-700">{t('studentPortal.passBanner')}</span>
                              </>
                            ) : (
                              <>
                                <X className="w-5 h-5 text-red-600" />
                                <span className="font-bold text-red-700">{t('studentPortal.failBanner')}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* ==================== TRANSCRIPT VIEW ==================== */}
                {viewMode === 'transcript' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4 sm:space-y-5"
                  >
                    {/* Transcript Main Card */}
                    <Card className="overflow-hidden rounded-2xl shadow-lg border-0">
                      {/* Double border transcript header */}
                      <div className="bg-gradient-to-r from-islamic-dark via-islamic to-islamic-dark p-5 sm:p-7 text-white text-center relative">
                        <div className="absolute inset-0 islamic-pattern-overlay opacity-[0.08]" />
                        {/* Mosque SVG watermark */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
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

                      <CardContent className="p-4 sm:p-6 space-y-5">
                        {/* Student Info - Double Border Style */}
                        <div className="border-2 border-islamic/20 rounded-xl p-4 sm:p-5 relative">
                          <div className="absolute inset-0 border-2 border-islamic/10 rounded-xl m-1 pointer-events-none" />
                          <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                              <User className="w-4 h-4 text-islamic" />
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
                          <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                            <div className="text-center">
                              <Shield className="w-6 h-6 text-gray-400 mx-auto" />
                              <p className="text-[8px] text-gray-400 mt-0.5">{t('studentPortal.qrVerify')}</p>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* All Exam Results */}
                        <div>
                          <h3 className="text-sm font-bold text-islamic-dark mb-3 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-islamic" />
                            {t('studentPortal.allExamResults')}
                          </h3>

                          <div className="space-y-4">
                            {allStudentResults.length === 0 ? (
                              <div className="text-center py-8 bg-gray-50 rounded-xl">
                                <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">{t('studentPortal.noExamResults')}</p>
                              </div>
                            ) : (
                              allStudentResults.map((result, examIdx) => {
                                const examGPA = (result.subjects || []).reduce((sum, s) => {
                                  const pct = s.fullMarks > 0 ? (s.obtainedMarks / s.fullMarks) * 100 : 0;
                                  const marksBucket = pct >= 80 ? 80 : pct >= 70 ? 70 : pct >= 60 ? 60 : pct >= 50 ? 50 : pct >= 40 ? 40 : pct >= 33 ? 33 : 0;
                                  return sum + getGradePoint(marksBucket);
                                }, 0) / ((result.subjects || []).length || 1);
                                const examPct = result.totalMarks > 0 ? ((result.obtainedTotal || 0) / result.totalMarks) * 100 : 0;
                                const examGC = getGradeColor(result.grade);

                                return (
                                  <Card key={result.id} className="border border-gray-100 rounded-xl overflow-hidden">
                                    {/* Exam header */}
                                    <div className={`bg-gradient-to-r ${examGC.bgLight} px-4 py-2.5 border-b flex items-center justify-between`}>
                                      <div className="flex items-center gap-2">
                                        <Trophy className={`w-4 h-4 ${examGC.text}`} />
                                        <p className="text-xs sm:text-sm font-bold text-islamic-dark">{result.examName}</p>
                                        <span className="text-[10px] text-muted-foreground hidden sm:inline">— {result.department} {result.class ? '- ' + result.class : ''}</span>
                                      </div>
                                      <Badge className={`text-[10px] px-2 py-0.5 ${examGC.bgLight} ${examGC.text} ${examGC.border} border`}>
                                        {result.grade}
                                      </Badge>
                                    </div>

                                    <CardContent className="p-3 sm:p-4">
                                      {/* Subject table */}
                                      <div className="rounded-lg border border-gray-100 overflow-hidden mb-3">
                                        <div className="bg-gray-50 grid grid-cols-12 gap-0 px-3 py-2 text-[10px] font-semibold text-muted-foreground border-b">
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
                                              className={`grid grid-cols-12 gap-0 px-3 py-2.5 items-center border-b border-gray-50 ${subIdx % 2 === 0 ? '' : 'bg-gray-50/50'}`}
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
                                                <Badge className={`text-[9px] px-1.5 py-0 ${sgc.bgLight} ${sgc.text} ${sgc.border} border`}>
                                                  {gr}
                                                </Badge>
                                              </div>
                                              <div className="col-span-3 text-center hidden sm:block">
                                                <Progress
                                                  value={Math.min(pct, 100)}
                                                  className={`h-1.5 ${pct >= 80 ? '[&>div]:bg-emerald-500' : pct >= 60 ? '[&>div]:bg-green-500' : pct >= 40 ? '[&>div]:bg-yellow-500' : pct >= 33 ? '[&>div]:bg-orange-500' : '[&>div]:bg-red-500'}`}
                                                />
                                              </div>
                                            </div>
                                          );
                                        })}
                                        {/* Exam total row */}
                                        <div className="bg-gray-50 grid grid-cols-12 gap-0 px-3 py-2.5 items-center font-bold text-xs">
                                          <div className="col-span-4 text-islamic-dark">{t('common.total')}</div>
                                          <div className="col-span-3 text-center">
                                            <span className="text-islamic-dark font-bold">{result.obtainedTotal}</span>
                                            <span className="text-muted-foreground font-normal">/{result.totalMarks}</span>
                                          </div>
                                          <div className="col-span-2 text-center hidden sm:block">
                                            <Badge className={`text-[9px] px-1.5 py-0 ${examGC.bgLight} ${examGC.text} ${examGC.border} border`}>
                                              {result.grade}
                                            </Badge>
                                          </div>
                                          <div className="col-span-3 text-center hidden sm:block">
                                            <Progress
                                              value={Math.min(examPct, 100)}
                                              className={`h-1.5 ${examPct >= 80 ? '[&>div]:bg-emerald-500' : examPct >= 60 ? '[&>div]:bg-green-500' : examPct >= 40 ? '[&>div]:bg-yellow-500' : examPct >= 33 ? '[&>div]:bg-orange-500' : '[&>div]:bg-red-500'}`}
                                            />
                                          </div>
                                        </div>
                                      </div>

                                      {/* Exam summary line */}
                                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs">
                                        <span className="flex items-center gap-1 text-muted-foreground">
                                          <Target className="w-3 h-3" />
                                          {t('studentPortal.gpa')}: <strong className={examGC.text}>{examGPA.toFixed(2)}</strong>
                                        </span>
                                        <span className="flex items-center gap-1 text-muted-foreground">
                                          <BarChart3 className="w-3 h-3" />
                                          {examPct.toFixed(1)}%
                                        </span>
                                        <span className="flex items-center gap-1">
                                          {result.grade !== 'F' ? (
                                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                                          ) : (
                                            <X className="w-3 h-3 text-red-600" />
                                          )}
                                          <span className={`font-semibold ${result.grade !== 'F' ? 'text-emerald-700' : 'text-red-700'}`}>
                                            {result.grade !== 'F' ? t('studentPortal.passed') : t('studentPortal.failed')}
                                          </span>
                                        </span>
                                      </div>
                                    </CardContent>
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
                                <TrendingUp className="w-4 h-4 text-islamic" />
                                {t('studentPortal.gpaTrend')}
                              </h3>
                              <Card className="border border-gray-100 rounded-xl p-4">
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
                                          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                              className={`h-full rounded-full bg-gradient-to-r ${gc.progress} transition-all duration-700`}
                                              style={{ width: `${Math.min(pctOfMax, 100)}%` }}
                                            />
                                          </div>
                                        </div>
                                        <div className="w-16 text-right shrink-0">
                                          <span className={`text-xs sm:text-sm font-bold ${gc.text}`}>{g.gpa.toFixed(2)}</span>
                                        </div>
                                        <div className="w-8 shrink-0">
                                          <Badge className={`text-[9px] px-1.5 py-0 ${gc.bgLight} ${gc.text} ${gc.border} border`}>
                                            {g.grade}
                                          </Badge>
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
                                <BarChart3 className="w-4 h-4 text-islamic" />
                                {t('studentPortal.performanceAnalysis')}
                              </h3>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {/* Best Subject */}
                                {transcriptAnalysis.bestSubject && (
                                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 text-center">
                                    <Star className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                                    <p className="text-[10px] text-emerald-600 mb-0.5">{t('studentPortal.bestSubject')}</p>
                                    <p className="text-sm font-bold text-emerald-800">{transcriptAnalysis.bestSubject}</p>
                                  </div>
                                )}
                                {/* Worst Subject */}
                                {transcriptAnalysis.worstSubject && transcriptAnalysis.worstSubject !== transcriptAnalysis.bestSubject && (
                                  <div className="bg-red-50 rounded-xl p-4 border border-red-200 text-center">
                                    <AlertCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
                                    <p className="text-[10px] text-red-600 mb-0.5">{t('studentPortal.worstSubject')}</p>
                                    <p className="text-sm font-bold text-red-800">{transcriptAnalysis.worstSubject}</p>
                                  </div>
                                )}
                                {/* Overall Remarks */}
                                <div className="bg-islamic-lighter/50 rounded-xl p-4 border border-islamic/20 text-center">
                                  <Award className="w-5 h-5 text-islamic mx-auto mb-1" />
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
                            ? 'bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 border-emerald-200'
                            : 'bg-gradient-to-r from-red-50 via-rose-50 to-red-50 border-red-200'
                        }`}>
                          {selectedResult.grade !== 'F' ? (
                            <>
                              <div className="flex items-center justify-center gap-2 mb-1">
                                <Trophy className="w-6 h-6 text-emerald-600" />
                                <span className="text-lg font-black text-emerald-800">{t('studentPortal.mashaAllah')}</span>
                              </div>
                              <p className="text-sm text-emerald-700">{t('studentPortal.passedMessage')}</p>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center justify-center gap-2 mb-1">
                                <X className="w-6 h-6 text-red-600" />
                                <span className="text-lg font-black text-red-800">{t('studentPortal.result')}: {t('studentPortal.failed')}</span>
                              </div>
                              <p className="text-sm text-red-700">{t('studentPortal.failedMessage')}</p>
                            </>
                          )}
                        </div>

                        {/* Signature Lines */}
                        <div className="flex justify-between items-end pt-6 mt-4">
                          <div className="text-center">
                            <div className="w-40 sm:w-48 border-b-2 border-gray-300 mb-2" />
                            <p className="text-xs text-muted-foreground font-medium">{t('studentPortal.guardian')}</p>
                            <p className="text-[10px] text-muted-foreground">{t('studentPortal.signatureDate')}</p>
                          </div>
                          <div className="text-center">
                            <div className="w-40 sm:w-48 border-b-2 border-gray-300 mb-2" />
                            <p className="text-xs text-muted-foreground font-medium">{t('studentPortal.principal')}</p>
                            <p className="text-[10px] text-muted-foreground">{t('studentPortal.signatureSeal')}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : searchResults.length > 0 ? (
            /* ==================== SEARCH RESULTS VIEW ==================== */
            <motion.div
              key="search-results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <button
                onClick={handleReset}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-islamic-dark mb-5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="size-4" />
                {t('student.back')}
              </button>

              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base sm:text-lg font-bold text-islamic-dark">
                  {t('results.title')} ({num(searchResults.length)})
                </h2>
              </div>

              <div className="space-y-3">
                <AnimatePresence>
                  {searchResults.map((result, idx) => {
                    const pct = result.totalMarks > 0 ? ((result.obtainedTotal || 0) / result.totalMarks * 100) : 0;
                    const gc = getGradeColor(result.grade);
                    return (
                      <motion.div
                        key={result.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <Card
                          className="hover:shadow-lg transition-all border border-gray-100 group cursor-pointer rounded-xl overflow-hidden"
                          onClick={() => handleSelectResult(result)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl ${gc.bgLight} ${gc.border} border flex items-center justify-center shrink-0`}>
                                <span className={`text-sm font-black ${gc.text}`}>{num(idx + 1)}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-islamic-dark text-sm truncate">{result.studentName}</p>
                                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] sm:text-xs text-muted-foreground">{t('studentPortal.rollShort')}: {result.studentRoll}</span>
                                  <span className="text-[10px] text-muted-foreground">|</span>
                                  <span className="text-[10px] sm:text-xs text-muted-foreground truncate">{result.examName}</span>
                                </div>
                                <div className="mt-2 hidden sm:block">
                                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full bg-gradient-to-r ${gc.progress} transition-all duration-700`}
                                      style={{ width: `${Math.min(pct, 100)}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-bold text-islamic-dark text-sm sm:text-base">
                                  {num(result.obtainedTotal)}<span className="text-[10px] sm:text-xs text-muted-foreground font-normal">/{num(result.totalMarks)}</span>
                                </p>
                                <Badge className={`text-[10px] sm:text-xs px-2 py-0.5 ${gc.bgLight} ${gc.text} ${gc.border} border`}>
                                  {result.grade}
                                </Badge>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-islamic group-hover:translate-x-1 transition-all shrink-0" />
                            </div>
                          </CardContent>
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
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-xl max-w-lg mx-auto border-0 overflow-hidden rounded-2xl">
                <div className="bg-gradient-to-r from-islamic via-islamic-dark to-islamic p-6 sm:p-8 text-center relative overflow-hidden">
                  <div className="absolute inset-0 islamic-pattern-overlay opacity-[0.08]" />
                  <div className="relative z-10">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                      <Search className="size-7 sm:size-9 text-golden" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">{t('student.title')}</h2>
                    <p className="text-xs sm:text-sm text-white/60 mt-1">{t('student.subtitle')}</p>
                  </div>
                </div>

                <CardContent className="p-5 sm:p-6 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-input" className="text-xs sm:text-sm flex items-center gap-2 font-medium">
                      <FileText className="size-3.5 text-islamic" />
                      {t('student.registrationNumber')}
                    </Label>
                    <Input
                      id="reg-input"
                      placeholder={t('studentPortal.regPlaceholder')}
                      value={regInput}
                      onChange={(e) => setRegInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="h-11 sm:h-12 rounded-xl text-sm"
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-card px-3 text-muted-foreground">{t('studentPortal.orDivider')}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="dept-input" className="text-xs sm:text-sm flex items-center gap-2 font-medium">
                      <BookOpen className="size-3.5 text-islamic" />
                      {t('departments.title')} <span className="text-red-500">*</span>
                    </Label>
                    <Select value={departmentInput} onValueChange={(val) => {
                      setDepartmentInput(val);
                      setClassInput('');
                    }}>
                      <SelectTrigger id="dept-input" className="w-full h-11 sm:h-12 rounded-xl">
                        <SelectValue placeholder={t('studentPortal.selectDept')} />
                      </SelectTrigger>
                      <SelectContent>
                        {departmentOptions.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="class-input" className="text-xs sm:text-sm flex items-center gap-2 font-medium">
                      <GraduationCap className="size-3.5 text-islamic" />
                      {t('student.class')} <span className="text-red-500">*</span>
                    </Label>
                    {!departmentInput ? (
                      <Input
                        id="class-input"
                        placeholder={t('studentPortal.selectDeptFirst')}
                        disabled
                        className="h-11 sm:h-12 rounded-xl text-sm"
                      />
                    ) : classOptions.length > 0 ? (
                      <Select value={classInput} onValueChange={setClassInput}>
                        <SelectTrigger id="class-input" className="w-full h-11 sm:h-12 rounded-xl">
                          <SelectValue placeholder={t('studentPortal.selectClass')} />
                        </SelectTrigger>
                        <SelectContent>
                          {classOptions.map((cls) => (
                            <SelectItem key={cls} value={cls}>
                              {cls}
                            </SelectItem>
                          ))}
                        </SelectContent>
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

                  <div className="space-y-1.5">
                    <Label htmlFor="roll-input" className="text-xs sm:text-sm flex items-center gap-2 font-medium">
                      <Hash className="size-3.5 text-islamic" />
                      {t('student.rollNumber')} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="roll-input"
                      placeholder={t('studentPortal.rollPlaceholder')}
                      value={rollInput}
                      onChange={(e) => setRollInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="h-11 sm:h-12 rounded-xl text-sm"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      onClick={handleSearch}
                      disabled={searching}
                      className="flex-1 bg-gradient-to-r from-islamic to-islamic-dark hover:from-islamic-dark hover:to-islamic text-white gap-2 cursor-pointer h-11 sm:h-12 rounded-xl shadow-md shadow-islamic/20"
                    >
                      {searching ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Search className="size-4" />
                      )}
                      {searching ? t('student.searching') : t('student.search')}
                    </Button>
                    {(rollInput || departmentInput || classInput || regInput) && (
                      <Button
                        onClick={handleReset}
                        variant="outline"
                        className="h-11 sm:h-12 rounded-xl cursor-pointer"
                      >
                        <X className="size-4" />
                      </Button>
                    )}
                  </div>

                  {searched && searchResults.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-5 bg-red-50 rounded-xl border border-red-100"
                    >
                      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-2">
                        <X className="size-5 text-red-400" />
                      </div>
                      <p className="text-sm font-medium text-red-600">{t('student.noResult')}</p>
                      <p className="text-xs text-red-400 mt-0.5">{t('studentPortal.tryAgainHint')}</p>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
