// ============ Multilingual Content Helpers ============
// Content stored in Firebase keeps the original (Bengali) field as the base
// and adds `<field>En` / `<field>Ar` companions for English and Arabic.
// Example (Notice): { title, titleEn, titleAr, content, contentEn, contentAr }
//
// Display rule: use the field of the selected language; if it is empty fall
// back to Bengali (base), then English, then Arabic. This keeps old
// single-language data working without migration.

import type { Language } from './i18n';

/** Trilingual content value used by admin forms. */
export interface MLValue {
  bn: string;
  en: string;
  ar: string;
}

/** Object that may carry multilingual companion fields. */
export type MLRecord = object | null | undefined;

/** Field suffix used for each language (Bengali is the base field). */
const SUFFIX: Record<Language, string> = { bn: '', en: 'En', ar: 'Ar' };

/** Fallback order after the selected language misses. */
const FALLBACK: Record<Language, string[]> = {
  bn: ['bn', 'en', 'ar'],
  en: ['en', 'bn', 'ar'],
  ar: ['ar', 'bn', 'en'],
};

function readString(obj: MLRecord, key: string): string {
  if (!obj) return '';
  const v = (obj as Record<string, unknown>)[key];
  return typeof v === 'string' ? v.trim() : '';
}

function readArray(obj: MLRecord, key: string): unknown[] | null {
  if (!obj) return null;
  const v = (obj as Record<string, unknown>)[key];
  return Array.isArray(v) ? v : null;
}

/**
 * Returns the localized value of `field` on `obj` for `lang`,
 * falling back to the other languages when the preferred one is empty.
 */
export function loc(lang: Language, obj: MLRecord, field: string): string {
  if (!obj) return '';
  for (const l of FALLBACK[lang]) {
    const value = readString(obj, field + SUFFIX[l]);
    if (value) return value;
  }
  return '';
}

/**
 * Returns localized string arrays (e.g. AdmissionInfo.requirements).
 * The Bengali array is the index-aligned base; `fieldEn` / `fieldAr`
 * arrays (when present) override per index. Rows that are empty in every
 * language are dropped.
 */
export function locList(lang: Language, obj: MLRecord, field: string): string[] {
  if (!obj) return [];
  const base = readArray(obj, field) || [];
  const alt = readArray(obj, field + SUFFIX[lang]);

  const out: string[] = [];
  for (let i = 0; i < base.length; i++) {
    const bn = typeof base[i] === 'string' ? (base[i] as string).trim() : '';
    const localized = alt && typeof alt[i] === 'string' ? (alt[i] as string).trim() : '';
    const value = localized || bn;
    if (value) out.push(localized || (base[i] as string));
  }
  // Alt-only rows (no Bengali base) are rare; ignore them for alignment safety.
  return out;
}

/**
 * Returns an index-aligned localized schedule list.
 * Base: schedule = [{ item, date }]; alt: scheduleEn/scheduleAr = [{ item }].
 */
export function locSchedule(
  lang: Language,
  obj: MLRecord,
  field = 'schedule'
): { item: string; date: string }[] {
  if (!obj) return [];
  const base = (readArray(obj, field) || []) as { item?: unknown; date?: unknown }[];
  const alt = (readArray(obj, field + SUFFIX[lang]) || null) as { item?: unknown; date?: unknown }[] | null;

  const out: { item: string; date: string }[] = [];
  for (let i = 0; i < base.length; i++) {
    const bnItem = typeof base[i]?.item === 'string' ? (base[i].item as string).trim() : '';
    const altItem = alt && typeof alt[i]?.item === 'string' ? (alt[i].item as string).trim() : '';
    const item = altItem || bnItem;
    const date = typeof base[i]?.date === 'string' ? (base[i].date as string) : (alt?.[i]?.date as string) || '';
    if (item) out.push({ item, date });
  }
  return out;
}

/** True when at least one language version of `field` exists. */
export function hasML(obj: MLRecord, field: string): boolean {
  return !!(loc('bn', obj, field) || loc('en', obj, field) || loc('ar', obj, field));
}

/** Helper to build a {bn, en, ar} object from a DB record. */
export function toML(obj: MLRecord, field: string): { bn: string; en: string; ar: string } {
  return {
    bn: readString(obj, field),
    en: readString(obj, field + 'En'),
    ar: readString(obj, field + 'Ar'),
  };
}

/** Split parallel ML rows into the DB shape for string lists. */
export function mlListToDB(rows: { bn: string; en: string; ar: string }[]): {
  base: string[];
  en: string[];
  ar: string[];
} {
  const kept = rows.filter((r) => r.bn.trim() || r.en.trim() || r.ar.trim());
  return {
    base: kept.map((r) => r.bn.trim()),
    en: kept.map((r) => r.en.trim()),
    ar: kept.map((r) => r.ar.trim()),
  };
}

/** Read parallel string lists from DB into ML rows. */
export function mlListFromDB(
  obj: MLRecord,
  field: string
): { bn: string; en: string; ar: string }[] {
  const base = readArray(obj, field) || [];
  const en = readArray(obj, field + 'En') || [];
  const ar = readArray(obj, field + 'Ar') || [];
  const len = Math.max(base.length, en.length, ar.length);
  const rows: { bn: string; en: string; ar: string }[] = [];
  for (let i = 0; i < len; i++) {
    rows.push({
      bn: typeof base[i] === 'string' ? (base[i] as string) : '',
      en: typeof en[i] === 'string' ? (en[i] as string) : '',
      ar: typeof ar[i] === 'string' ? (ar[i] as string) : '',
    });
  }
  return rows;
}
