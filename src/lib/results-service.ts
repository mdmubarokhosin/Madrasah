// ============ Results & Merit List Engine ============
// Shared, single-source-of-truth logic for the public merit list, public
// results page, student portal helpers and the admin results panel.
//
// Core rules:
// - The public merit list shows ONLY the latest exam (deterministic order),
//   ranked by obtained marks with proper tie handling.
// - Exams marked published === false are hidden from the public site.
// - A tie in obtainedTotal shares the same competition rank; the next
//   student's rank skips accordingly (1, 1, 3, 4, ...).

import type { Exam, ExamResult } from '@/types/database';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface MeritEntry {
  id: string;
  /** Competition rank (ties share the same rank). */
  rank: number;
  studentId: string;
  name: string;
  roll: string;
  registrationNumber: string;
  className: string;
  department: string;
  obtained: number;
  total: number;
  percentage: number;
  grade: string;
  passed: boolean;
  examId: string;
  examName: string;
}

export interface ExamStats {
  total: number;
  passed: number;
  failed: number;
  passRate: number;
  aPlus: number;
  avgPercent: number;
  highest: number;
  lowest: number;
}

/* ------------------------------------------------------------------ */
/*  Grade helper (single source of truth for the whole app)            */
/* ------------------------------------------------------------------ */

export function gradeFromPercent(percentage: number): string {
  if (percentage >= 80) return 'A+';
  if (percentage >= 70) return 'A';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  return 'F';
}

/* ------------------------------------------------------------------ */
/*  Publishing visibility                                              */
/* ------------------------------------------------------------------ */

/** Undefined/null `published` means published (backward compatible). */
export function isExamPublished(exam: Exam | undefined | null): boolean {
  if (!exam) return false;
  return exam.published !== false;
}

/* ------------------------------------------------------------------ */
/*  Exam ordering & "latest exam"                                      */
/* ------------------------------------------------------------------ */

function examTimestamp(exam: Exam): number {
  // Prefer an explicit exam date if it parses; fall back to createdAt.
  if (exam.date) {
    const parsed = Date.parse(exam.date);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return exam.createdAt || 0;
}

/** Newest exam first (by exam date, then createdAt as tiebreaker). */
export function sortExamsNewestFirst(examList: Exam[]): Exam[] {
  return [...examList].sort((a, b) => {
    const diff = examTimestamp(b) - examTimestamp(a);
    if (diff !== 0) return diff;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
}

/** Exams that are published AND have at least one result, newest first. */
export function getPublishedExamsWithResults(
  exams: Exam[],
  results: ExamResult[]
): Exam[] {
  const examIdsWithResults = new Set(results.map((r) => r.examId));
  const examMap = new Map(exams.map((e) => [e.id, e]));
  return sortExamsNewestFirst(
    Array.from(examIdsWithResults)
      .map((id) => examMap.get(id))
      .filter((e): e is Exam => !!e && isExamPublished(e))
  );
}

/**
 * The latest exam that actually has published results.
 * Falls back to null when nothing is publishable.
 */
export function getLatestExam(
  exams: Exam[],
  results: ExamResult[]
): Exam | null {
  const publishable = getPublishedExamsWithResults(exams, results);
  return publishable.length > 0 ? publishable[0] : null;
}

/* ------------------------------------------------------------------ */
/*  Merit list                                                         */
/* ------------------------------------------------------------------ */

/**
 * Build the ranked merit list for one exam, optionally restricted to a
 * single class. Sorted by obtainedTotal (desc). Equal totals share rank.
 */
export function buildMeritList(
  results: ExamResult[],
  examId: string,
  className?: string | null
): MeritEntry[] {
  const rows = results.filter(
    (r) =>
      r.examId === examId &&
      (!className || className === 'all' || r.class === className)
  );

  const sorted = [...rows].sort((a, b) => {
    const markDiff = (b.obtainedTotal || 0) - (a.obtainedTotal || 0);
    if (markDiff !== 0) return markDiff;
    // Stable tiebreaker: earlier creation wins the shared higher position.
    return (a.createdAt || 0) - (b.createdAt || 0);
  });

  let prevKey: number | null = null;
  let prevRank = 0;

  return sorted.map((r, index) => {
    const obtained = r.obtainedTotal || 0;
    const rank = obtained === prevKey ? prevRank : index + 1;
    prevKey = obtained;
    prevRank = rank;
    const total = r.totalMarks || 0;
    return {
      id: r.id,
      rank,
      studentId: r.studentId,
      name: r.studentName,
      roll: r.studentRoll,
      registrationNumber: r.registrationNumber || '',
      className: r.class || '',
      department: r.department || '',
      obtained,
      total,
      percentage: total > 0 ? (obtained / total) * 100 : 0,
      grade: r.grade || gradeFromPercent(total > 0 ? (obtained / total) * 100 : 0),
      passed: (r.grade || 'F') !== 'F',
      examId: r.examId,
      examName: r.examName,
    };
  });
}

/* ------------------------------------------------------------------ */
/*  Stats for one exam (optionally one class)                          */
/* ------------------------------------------------------------------ */

export function computeExamStats(
  results: ExamResult[],
  examId: string,
  className?: string | null
): ExamStats | null {
  const rows = results.filter(
    (r) =>
      r.examId === examId &&
      (!className || className === 'all' || r.class === className)
  );
  if (rows.length === 0) return null;

  const passed = rows.filter((r) => (r.grade || 'F') !== 'F').length;
  const aPlus = rows.filter((r) => r.grade === 'A+').length;
  const percents = rows.map((r) =>
    r.totalMarks ? ((r.obtainedTotal || 0) / r.totalMarks) * 100 : 0
  );
  const avgPercent = percents.reduce((s, p) => s + p, 0) / rows.length;
  const obtainedList = rows.map((r) => r.obtainedTotal || 0);

  return {
    total: rows.length,
    passed,
    failed: rows.length - passed,
    passRate: (passed / rows.length) * 100,
    aPlus,
    avgPercent,
    highest: Math.max(...obtainedList),
    lowest: Math.min(...obtainedList),
  };
}

/* ------------------------------------------------------------------ */
/*  Class discovery within one exam's results                          */
/* ------------------------------------------------------------------ */

export function getExamClasses(results: ExamResult[], examId: string): string[] {
  const classes = new Set<string>();
  results.forEach((r) => {
    if (r.examId === examId && r.class) classes.add(r.class);
  });
  return Array.from(classes).sort();
}

/* ------------------------------------------------------------------ */
/*  CSV export for the merit list                                      */
/* ------------------------------------------------------------------ */

export function meritListToCsv(entries: MeritEntry[], examName: string): string {
  const headers = ['Rank', 'Name', 'Roll', 'Registration', 'Class', 'Department', 'Obtained', 'Total', 'Percentage', 'Grade'];
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [
    escape(examName),
    headers.map(escape).join(','),
    ...entries.map((e) =>
      [
        e.rank,
        e.name,
        e.roll,
        e.registrationNumber,
        e.className,
        e.department,
        e.obtained,
        e.total,
        e.percentage.toFixed(2) + '%',
        e.grade,
      ]
        .map(escape)
        .join(',')
    ),
  ];
  // BOM so Excel renders Bangla correctly.
  return '\uFEFF' + lines.join('\r\n');
}

export function downloadMeritCsv(entries: MeritEntry[], examName: string) {
  const csv = meritListToCsv(entries, examName);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `merit-list-${examName.replace(/[^\p{L}\p{N}]+/gu, '-') || 'exam'}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
