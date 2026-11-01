'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import JSZip from 'jszip';
import {
  Download,
  UploadCloud,
  Loader2,
  Database,
  RotateCcw,
  Archive,
  FileJson,
  HardDrive,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  FileText,
  ImageIcon,
  Music,
  Video,
  FolderOpen,
  History,
  Terminal,
  RefreshCw,
  ShieldAlert,
  Inbox,
  Trash2,
  Search,
} from 'lucide-react';
import { dbGet, dbSet, dbPush, dbRemove, uploadToGithub } from '@/lib/db-service';
import { useTranslation } from '@/lib/i18n-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ProgressLog {
  id: number;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  timestamp: number;
}

interface BackupStats {
  recordCount: number;
  fileCount: number;
  totalSize: number;
}

interface RestorePreview {
  fileName: string;
  fileType: 'zip' | 'json';
  estimatedRecords: number;
  estimatedFiles: number;
  paths: string[];
}

interface ManifestFileEntry {
  path: string;
  url: string;
  category: string;
}

interface BackupManifest {
  _meta?: {
    version?: number;
    kind?: string;
    createdAt?: number;
    app?: string;
    sensitiveExcluded?: boolean;
  };
  files?: ManifestFileEntry[];
}

type BackupHistoryRecord = {
  filename?: string;
  size?: string;
  nodeCount?: number;
  fileCount?: number;
  type?: string;
  createdAt?: number;
};

interface BackupHistoryEntry extends BackupHistoryRecord {
  id: string;
}

/** Error thrown when the user cancels a running backup/restore. */
class CancelledError extends Error {
  constructor() {
    super('Operation cancelled');
    this.name = 'CancelledError';
  }
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/**
 * AUTHORITATIVE backup path list.
 *
 * Derived from `loadAllData()` in `src/store/app-store.ts` (every node the
 * app subscribes to / reads) plus every `config/*` child written anywhere in
 * `src/` (grep `dbGet('/config` / `dbSet('/config` / `dbUpdate('/config`).
 *
 * ⚠️ When you add a NEW collection or db path in the app you MUST add it here
 * too — exports, restores, pre-restore safety snapshots and the Live Console
 * quick-jump chips all rely on this single list.
 */
export const BACKUP_PATHS = [
  // Whole config node: siteInfo, paymentMethods, classRoutine, syllabus,
  // prayerConfig, prayerTimes, qrPaymentConfig, smsConfig, hifzMigrated,
  // githubConfig (SENSITIVE), adminAuth (SENSITIVE), …
  'config',
  'notices',
  'departments',
  'teachers',
  'students',
  'exams',
  'results',
  'blogs',
  'gallery',
  'admission',
  'donations',
  'events',
  'contactMessages',
  'admissionApplications',
  'activityLogs',
  'hifzRecords',
  'onlineExams',
  'examSubmissions',
  'attendance',
  'libraryBooks',
  'libraryIssues',
  'calendarEvents',
  'feeConfigs',
  'feePayments',
  'alumni',
  'hadithDuas',
  'expenses',
  'expenseCategories',
  'salaryRecords',
  'donationSubscriptions',
  'vouchers',
  'hostelRooms',
  'hostelAllocations',
  'hostelMeals',
  'dawahPrograms',
  'dawahJamats',
  'studyMaterials',
  'adminRoles',
  'adminUsers',
  // settings/adminAuth (SENSITIVE — password hash)
  'settings',
];

/**
 * Sensitive child paths stripped from exports/restores unless the explicit
 * "include sensitive config" toggle is ON.
 *  - config/githubConfig → GitHub repo write token
 *  - config/adminAuth + settings/adminAuth → password hashes
 *  - adminUsers/passwordHash + legacy adminUsers/password → per-admin
 *    credentials. /adminUsers is a map of uid → profile, so its sensitive
 *    keys live one level deeper — see SENSITIVE_PROFILE_PATHS below.
 */
const SENSITIVE_CHILD_KEYS: Record<string, string[]> = {
  config: ['githubConfig', 'adminAuth'],
  settings: ['adminAuth'],
  adminUsers: ['passwordHash', 'password'],
};

/**
 * Paths in SENSITIVE_CHILD_KEYS whose sensitive keys are NOT direct children
 * of the node but live inside each child profile (e.g. /adminUsers/<uid>/
 * passwordHash). nodeHasSensitive / stripSensitiveFromNode /
 * reMergeLiveSensitive therefore operate per profile for these paths,
 * while config/settings keep the original direct-child behaviour.
 */
const SENSITIVE_PROFILE_PATHS = new Set(['adminUsers']);

/** Top-level nodes that must never be deletable from the Live Console. */
const PROTECTED_DELETE_PATHS = new Set(['', 'config', 'settings', 'adminUsers', 'adminRoles']);

/** Quick-jump chips for the Live Console (top-level segments + 'config'). */
const CONSOLE_QUICK_NODES = [
  ...new Set([...BACKUP_PATHS.map((p) => p.split('/')[0]), 'config']),
];

const BACKUP_POOL_LIMIT = 5; // parallel file downloads

const FILE_EXTENSIONS: Record<string, string> = {
  jpg: 'images',
  jpeg: 'images',
  png: 'images',
  gif: 'images',
  webp: 'images',
  svg: 'images',
  mp3: 'audio',
  wav: 'audio',
  ogg: 'audio',
  mp4: 'video',
  webm: 'video',
  avi: 'video',
  pdf: 'documents',
  doc: 'documents',
  docx: 'documents',
  xls: 'documents',
  xlsx: 'documents',
};

/* ------------------------------------------------------------------ */
/*  Helper Functions                                                   */
/* ------------------------------------------------------------------ */

function countNodes(obj: unknown): number {
  if (obj === null || obj === undefined) return 0;
  if (typeof obj !== 'object') return 1;
  if (Array.isArray(obj)) return obj.reduce((sum, item) => sum + countNodes(item), 0);
  let count = 0;
  for (const value of Object.values(obj as Record<string, unknown>)) {
    count += countNodes(value);
  }
  return count;
}

function extractFileUrls(data: unknown): string[] {
  const urls: string[] = [];
  if (data === null || data === undefined) return urls;
  if (typeof data === 'string') {
    try {
      const url = new URL(data);
      const pathname = url.pathname.toLowerCase();
      const ext = pathname.split('.').pop() || '';
      if (FILE_EXTENSIONS[ext]) {
        urls.push(data);
      }
    } catch {
      // Not a valid URL, skip
    }
    return urls;
  }
  if (typeof data === 'object') {
    if (Array.isArray(data)) {
      for (const item of data) {
        urls.push(...extractFileUrls(item));
      }
    } else {
      for (const value of Object.values(data as Record<string, unknown>)) {
        urls.push(...extractFileUrls(value));
      }
    }
  }
  return urls;
}

function getFileCategory(url: string): string {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    const ext = pathname.split('.').pop() || '';
    return FILE_EXTENSIONS[ext] || 'other';
  } catch {
    return 'other';
  }
}

function getFileNameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    return decodeURIComponent(pathname.split('/').pop() || 'unknown-file');
  } catch {
    return 'unknown-file';
  }
}

/** Monospace HH:mm:ss timestamp for progress-log entries. */
function formatClock(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** restore-safety-snapshot-YYYY-MM-DD-HHmm style stamp. */
function timestampSlug(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

/**
 * Small concurrency pool — runs `worker` over `items` with at most `limit`
 * promises in flight. Worker errors propagate (Promise.all rejects).
 */
async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<void>
): Promise<void> {
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next;
      next++;
      await worker(items[index], index);
    }
  });
  await Promise.all(runners);
}

function downloadText(text: string, filename: string, mime: string = 'application/json'): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/** Returns true when `value` (a fetched node) contains sensitive children. */
function nodeHasSensitive(path: string, value: unknown): boolean {
  const keys = SENSITIVE_CHILD_KEYS[path];
  if (!keys || value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (keys.some((k) => k in record)) return true;
  // Per-profile paths (adminUsers): the credentials sit inside each child
  // profile (/adminUsers/<uid>/passwordHash), not on the node itself.
  if (!SENSITIVE_PROFILE_PATHS.has(path)) return false;
  return Object.values(record).some(
    (profile) =>
      profile !== null &&
      typeof profile === 'object' &&
      !Array.isArray(profile) &&
      keys.some((k) => k in (profile as Record<string, unknown>)),
  );
}

/**
 * Shallow copy of `value` with the sensitive children removed. For
 * per-profile paths (adminUsers) the sensitive keys are also stripped from
 * each child profile, keeping the rest of every admin profile intact.
 */
function stripSensitiveFromNode(path: string, value: unknown): unknown {
  const keys = SENSITIVE_CHILD_KEYS[path];
  if (!keys || value === null || typeof value !== 'object' || Array.isArray(value)) return value;
  const copy = { ...(value as Record<string, unknown>) };
  for (const k of keys) delete copy[k];
  if (SENSITIVE_PROFILE_PATHS.has(path)) {
    for (const [id, profile] of Object.entries(copy)) {
      if (profile === null || typeof profile !== 'object' || Array.isArray(profile)) continue;
      const profileCopy = { ...(profile as Record<string, unknown>) };
      for (const k of keys) delete profileCopy[k];
      copy[id] = profileCopy;
    }
  }
  return copy;
}

/**
 * SECURITY: when restoring with "include sensitive" OFF, the payload's
 * config/settings/adminUsers nodes carry NO sensitive children — writing such
 * a node as-is would WIPE the live GitHub token, the admin password hashes
 * and every live admin's login credentials. Before that write, read the
 * CURRENT live node and re-attach its existing sensitive children (only ones
 * actually present live and absent from the restore payload) so a
 * non-sensitive restore can never destroy credentials. For per-profile paths
 * (adminUsers) the live passwordHash/password of each admin uid present in
 * the payload is merged back into that profile.
 */
async function reMergeLiveSensitive(
  path: string,
  value: unknown,
): Promise<{ value: unknown; merged: boolean }> {
  const keys = SENSITIVE_CHILD_KEYS[path];
  if (!keys) return { value, merged: false };
  let live: Record<string, unknown> | null = null;
  try {
    live = await dbGet<Record<string, unknown>>(`/${path}`);
  } catch {
    return { value, merged: false };
  }
  if (!live || typeof live !== 'object' || Array.isArray(live)) {
    return { value, merged: false };
  }
  const base: Record<string, unknown> =
    value !== null && typeof value === 'object' && !Array.isArray(value)
      ? { ...(value as Record<string, unknown>) }
      : {};
  let merged = false;
  if (SENSITIVE_PROFILE_PATHS.has(path)) {
    // Per-profile merge (adminUsers): for every admin uid present in the
    // restore payload, re-attach the LIVE passwordHash/password when the
    // payload's profile lacks them (they were stripped from the backup).
    // With the sensitive toggle ON the payload's own hashes win — same
    // precedence as the direct-child branch below.
    for (const [id, profile] of Object.entries(base)) {
      if (profile === null || typeof profile !== 'object' || Array.isArray(profile)) continue;
      const liveProfile = live[id];
      if (liveProfile === null || typeof liveProfile !== 'object' || Array.isArray(liveProfile)) {
        continue;
      }
      const liveRecord = liveProfile as Record<string, unknown>;
      const profileCopy = { ...(profile as Record<string, unknown>) };
      let profileMerged = false;
      for (const k of keys) {
        if (
          k in liveRecord &&
          liveRecord[k] !== null &&
          liveRecord[k] !== undefined &&
          !(k in profileCopy)
        ) {
          profileCopy[k] = liveRecord[k];
          profileMerged = true;
        }
      }
      if (profileMerged) {
        base[id] = profileCopy;
        merged = true;
      }
    }
    return merged ? { value: base, merged: true } : { value, merged: false };
  }
  for (const k of keys) {
    if (k in live && live[k] !== null && live[k] !== undefined && !(k in base)) {
      base[k] = live[k];
      merged = true;
    }
  }
  return merged ? { value: base, merged: true } : { value, merged: false };
}

/** Maximum entries kept in /backupHistory (oldest are pruned after each push). */
const MAX_BACKUP_HISTORY = 30;

/**
 * Keep /backupHistory bounded: retain only the 30 newest entries by createdAt
 * (same record shape, whole node rewritten once). Best-effort — failures are
 * swallowed so history pruning can never break a backup that already succeeded.
 */
async function pruneBackupHistory(): Promise<void> {
  try {
    const data = await dbGet<Record<string, BackupHistoryRecord>>('/backupHistory');
    if (!data) return;
    const entries = Object.entries(data);
    if (entries.length <= MAX_BACKUP_HISTORY) return;
    entries.sort((a, b) => (b[1]?.createdAt || 0) - (a[1]?.createdAt || 0));
    const pruned: Record<string, BackupHistoryRecord> = {};
    for (const [id, rec] of entries.slice(0, MAX_BACKUP_HISTORY)) {
      pruned[id] = rec;
    }
    await dbSet('/backupHistory', pruned);
  } catch (err) {
    console.warn('backupHistory prune failed:', err);
  }
}

function normalizeDbPath(raw: string): string {
  return raw.trim().replace(/^\/+|\/+$/g, '');
}

/**
 * urlMapping entries sorted LONGEST original-URL first.
 *
 * URL replacement is plain string split/join, so when one original URL is a
 * PREFIX of another (e.g. `.../uploads/173…_file.jpg` and
 * `.../uploads/173…_file.jpg2` — upload paths are
 * `uploads/${Date.now()}_${filename}`, so same-millisecond stems are
 * realistic), replacing the shorter one first corrupts the longer URL into
 * `<newUrl>2`, which then matches nothing and silently ships a broken link.
 * Longest-first ordering guarantees the more specific URL is rewritten
 * before its prefix, so every mapping still matches.
 */
function getSortedUrlEntries(urlMapping: Record<string, string>): [string, string][] {
  return Object.entries(urlMapping).sort((a, b) => b[0].length - a[0].length);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminBackup() {
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const locale = language === 'ar' ? 'ar-EG' : language === 'en' ? 'en-GB' : 'bn-BD';
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Refs: cancellation (AbortController / cancel flag) */
  const cancelRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  /* State: operations */
  const [isFullBackup, setIsFullBackup] = useState(false);
  const [isDbBackup, setIsDbBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  /* State: progress */
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [progressValue, setProgressValue] = useState(0);
  const [stats, setStats] = useState<BackupStats | null>(null);

  /* State: restore */
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePreview, setRestorePreview] = useState<RestorePreview | null>(null);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);

  /* State: sensitive data toggle (SECURITY — default OFF) */
  const [includeSensitive, setIncludeSensitive] = useState(false);

  /* State: backup history */
  const [history, setHistory] = useState<BackupHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  /* State: live console */
  const [consoleInput, setConsoleInput] = useState('config');
  const [consoleStatus, setConsoleStatus] = useState<'idle' | 'loading' | 'loaded' | 'notfound'>('idle');
  const [consoleData, setConsoleData] = useState<unknown>(null);
  const [consoleLoadedPath, setConsoleLoadedPath] = useState<string | null>(null);
  const [consoleEditing, setConsoleEditing] = useState(false);
  const [consoleDraft, setConsoleDraft] = useState('');
  const [consoleJsonError, setConsoleJsonError] = useState<string | null>(null);
  const [consoleSaving, setConsoleSaving] = useState(false);
  const [consolePendingData, setConsolePendingData] = useState<unknown>(undefined);
  const [consoleSaveOpen, setConsoleSaveOpen] = useState(false);
  const [consoleDeleting, setConsoleDeleting] = useState(false);
  const [consoleDeleteOpen, setConsoleDeleteOpen] = useState(false);

  /* ---------------------------------------------------------------- */
  /*  Formatting helpers (i18n-aware)                                  */
  /* ---------------------------------------------------------------- */

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return t('adminBackup.zeroBytes');
    const units = [t('adminBackup.bytes'), 'KB', 'MB', 'GB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = bytes / Math.pow(k, i);
    const formatted = value.toFixed(1);
    // Bengali numerals only for the Bengali UI
    const display = language === 'bn'
      ? formatted.split('').map((c) => (/\d/.test(c) ? String.fromCharCode(0x09e6 + Number(c)) : c)).join('')
      : formatted;
    return display + ' ' + units[i];
  }, [t, language]);

  /* ---------------------------------------------------------------- */
  /*  Logging helpers                                                  */
  /* ---------------------------------------------------------------- */

  const addLog = useCallback(
    (message: string, type: ProgressLog['type'] = 'info') => {
      setLogs((prev) => [
        ...prev,
        { id: Date.now() + Math.random(), message, type, timestamp: Date.now() },
      ]);
    },
    [],
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
    setProgressValue(0);
    setStats(null);
  }, []);

  const requestCancel = useCallback(() => {
    cancelRef.current = true;
    abortRef.current?.abort();
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Fetch GitHub config from Firebase                                */
  /* ---------------------------------------------------------------- */

  const getGithubConfig = useCallback(async () => {
    try {
      // AdminSettings saves the repo config at /config/githubConfig — read the
      // narrow node directly instead of the whole /config tree.
      const github = await dbGet<{
        token: string;
        owner: string;
        repo: string;
        branch: string;
      }>('/config/githubConfig');
      if (!github || !github.token || !github.owner || !github.repo) {
        addLog(t('adminBackup.logGithubMissing'), 'warning');
        return null;
      }
      return github;
    } catch {
      addLog(t('adminBackup.logGithubError'), 'error');
      return null;
    }
  }, [addLog, t]);

  /* ---------------------------------------------------------------- */
  /*  Shared: collect data for every authoritative path                */
  /* ---------------------------------------------------------------- */

  const collectBackupData = useCallback(
    async (opts: {
      includeSensitive: boolean;
      checkCancel: () => void;
      onProgress?: (percent: number) => void;
      onPathLoaded?: (path: string, loaded: number, total: number) => void;
    }): Promise<{
      backupData: Record<string, unknown>;
      totalNodes: number;
      pathsLoaded: number;
      sensitiveFound: boolean;
    }> => {
      const { includeSensitive, checkCancel, onProgress, onPathLoaded } = opts;
      const backupData: Record<string, unknown> = {};
      let totalNodes = 0;
      let pathsLoaded = 0;
      let sensitiveFound = false;

      for (const path of BACKUP_PATHS) {
        checkCancel();
        try {
          const data = await dbGet<unknown>(path);
          if (data !== null && data !== undefined) {
            let value: unknown = data;
            if (!includeSensitive && nodeHasSensitive(path, value)) {
              value = stripSensitiveFromNode(path, value);
              sensitiveFound = true;
            }
            backupData[path] = value;
            totalNodes += countNodes(value);
          }
          pathsLoaded++;
          onProgress?.(Math.round((pathsLoaded / BACKUP_PATHS.length) * 100));
          onPathLoaded?.(path, pathsLoaded, BACKUP_PATHS.length);
        } catch (err) {
          addLog(t('adminBackup.logPathLoadFailed', { path, error: String(err) }), 'warning');
        }
      }
      return { backupData, totalNodes, pathsLoaded, sensitiveFound };
    },
    [addLog, t],
  );

  /* ---------------------------------------------------------------- */
  /*  1. Full Backup (ZIP)                                            */
  /* ---------------------------------------------------------------- */

  const handleFullBackup = useCallback(async () => {
    setIsFullBackup(true);
    cancelRef.current = false;
    const controller = new AbortController();
    abortRef.current = controller;
    const checkCancel = () => {
      if (cancelRef.current) throw new CancelledError();
    };
    clearLogs();
    addLog(t('adminBackup.logFullStart'), 'info');

    try {
      /* Step 1: Load all database paths */
      addLog(t('adminBackup.logLoadingData'), 'info');
      const { backupData, totalNodes, pathsLoaded, sensitiveFound } = await collectBackupData({
        includeSensitive,
        checkCancel,
        onProgress: (p) => setProgressValue(Math.round(p * 0.3)),
      });
      addLog(t('adminBackup.logPathsLoaded', { loaded: pathsLoaded, total: BACKUP_PATHS.length }), 'success');
      if (sensitiveFound) addLog(t('adminBackup.logSensitiveExcluded'), 'warning');

      /* Step 2: Extract file URLs */
      addLog(t('adminBackup.logDetectingUrls'), 'info');
      const allUrls = extractFileUrls(backupData);
      const uniqueUrls = [...new Set(allUrls)];
      addLog(t('adminBackup.logUniqueUrls', { count: uniqueUrls.length }), 'info');

      /* Step 3: Download files in parallel (pool of 5) and build ZIP */
      addLog(t('adminBackup.logBuildingZip'), 'info');
      addLog(t('adminBackup.logFetchingFiles'), 'info');
      const zip = new JSZip();
      const manifestFiles: ManifestFileEntry[] = [];
      let filesDownloaded = 0;
      let totalBytes = 0;
      let doneFiles = 0;

      await runWithConcurrency(uniqueUrls, BACKUP_POOL_LIMIT, async (url) => {
        checkCancel();
        try {
          const response = await fetch(url, { signal: controller.signal });
          const category = getFileCategory(url);
          const fileName = getFileNameFromUrl(url);
          if (response.ok) {
            const blob = await response.blob();
            const zipPath = `files/${category}/${fileName}`;
            zip.file(zipPath, blob);
            manifestFiles.push({ path: zipPath, url, category });
            totalBytes += blob.size;
            filesDownloaded++;
          } else {
            addLog(t('adminBackup.logFileDlFailedStatus', { status: response.status, file: fileName }), 'warning');
          }
        } catch (err) {
          if (cancelRef.current) throw new CancelledError();
          if (err instanceof DOMException && err.name === 'AbortError') throw new CancelledError();
          addLog(t('adminBackup.logFileDlFailed', { file: getFileNameFromUrl(url) }), 'warning');
        } finally {
          doneFiles++;
          setProgressValue(30 + Math.round((doneFiles / Math.max(uniqueUrls.length, 1)) * 50));
        }
      });
      setProgressValue(80);
      addLog(t('adminBackup.logFilesDlDone', { done: filesDownloaded, total: uniqueUrls.length }), 'success');

      /* Step 4: Add manifest.json (original URLs kept for future restores) */
      const manifest = {
        _meta: {
          version: 2,
          kind: 'full-backup',
          createdAt: Date.now(),
          app: 'madrasa-admin',
          sensitiveExcluded: !includeSensitive,
        },
        files: manifestFiles,
      };
      zip.file('manifest.json', JSON.stringify(manifest, null, 2));
      addLog(t('adminBackup.logManifestAdded'), 'info');

      /* Step 5: Add database.json */
      const dbPayload = {
        _meta: {
          version: 2,
          type: 'full-zip',
          createdAt: Date.now(),
          createdBy: 'admin',
          nodeCount: totalNodes,
          paths: BACKUP_PATHS,
          sensitiveExcluded: !includeSensitive,
        },
        ...backupData,
      };
      zip.file('database.json', JSON.stringify(dbPayload, null, 2));
      addLog(t('adminBackup.logDbAdded'), 'info');

      /* Step 6: Generate ZIP */
      addLog(t('adminBackup.logZipGenerating'), 'info');
      checkCancel();
      setProgressValue(85);
      const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      setProgressValue(95);

      /* Step 7: Trigger download */
      checkCancel();
      const zipUrl = URL.createObjectURL(zipBlob);
      const filename = `qawmi-full-backup-${new Date().toISOString().split('T')[0]}.zip`;
      const anchor = document.createElement('a');
      anchor.href = zipUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(zipUrl);

      /* Step 8: Save to backup history */
      try {
        checkCancel();
        await dbPush('/backupHistory', {
          filename,
          size: formatFileSize(zipBlob.size),
          nodeCount: totalNodes,
          fileCount: filesDownloaded,
          type: 'full-zip',
          createdAt: Date.now(),
        });
        // Keep /backupHistory bounded (best-effort, never fatal)
        await pruneBackupHistory();
        addLog(t('adminBackup.logHistorySaved'), 'success');
      } catch (err) {
        if (err instanceof CancelledError) throw err;
        addLog(t('adminBackup.logHistoryFailed'), 'warning');
      }

      /* Step 9: Final stats */
      setProgressValue(100);
      setStats({ recordCount: totalNodes, fileCount: filesDownloaded, totalSize: totalBytes });
      addLog(t('adminBackup.logFullDone', { records: totalNodes, files: filesDownloaded, size: formatFileSize(totalBytes) }), 'success');
      toast({
        title: t('adminBackup.fullDoneTitle'),
        description: t('adminBackup.fullDoneDesc', { records: totalNodes, files: filesDownloaded }),
      });
    } catch (err) {
      if (err instanceof CancelledError || cancelRef.current) {
        addLog(t('adminBackup.cancelled'), 'warning');
        setProgressValue(0);
      } else {
        addLog(t('adminBackup.logBackupFailed', { error: String(err) }), 'error');
        toast({
          title: t('common.error'),
          description: t('adminBackup.fullFailedDesc'),
          variant: 'destructive',
        });
      }
    } finally {
      setIsFullBackup(false);
      abortRef.current = null;
    }
  }, [addLog, clearLogs, collectBackupData, includeSensitive, toast, t, formatFileSize]);

  /* ---------------------------------------------------------------- */
  /*  2. Database Backup (JSON)                                       */
  /* ---------------------------------------------------------------- */

  const handleDatabaseBackup = useCallback(async () => {
    setIsDbBackup(true);
    cancelRef.current = false;
    const checkCancel = () => {
      if (cancelRef.current) throw new CancelledError();
    };
    clearLogs();
    addLog(t('adminBackup.logDbStart'), 'info');

    try {
      /* Step 1: Load all database paths */
      addLog(t('adminBackup.logLoadingData'), 'info');
      const { backupData, totalNodes, sensitiveFound } = await collectBackupData({
        includeSensitive,
        checkCancel,
        onProgress: (p) => setProgressValue(Math.round(p * 0.8)),
        onPathLoaded: (path, loaded, total) =>
          addLog(t('adminBackup.logPathLoaded', { path, loaded, total }), 'info'),
      });
      if (sensitiveFound) addLog(t('adminBackup.logSensitiveExcluded'), 'warning');

      /* Step 2: Build JSON payload */
      checkCancel();
      setProgressValue(85);
      const backupPayload = {
        _meta: {
          version: 2,
          type: 'database-only',
          createdAt: Date.now(),
          createdBy: 'admin',
          nodeCount: totalNodes,
          paths: BACKUP_PATHS,
          sensitiveExcluded: !includeSensitive,
        },
        ...backupData,
      };
      const jsonStr = JSON.stringify(backupPayload, null, 2);

      /* Step 3: Trigger download */
      setProgressValue(90);
      const filename = `qawmi-database-backup-${new Date().toISOString().split('T')[0]}.json`;
      downloadText(jsonStr, filename);

      /* Step 4: Save to backup history */
      const sizeKB = (jsonStr.length / 1024).toFixed(1);
      try {
        await dbPush('/backupHistory', {
          filename,
          size: `${sizeKB} KB`,
          nodeCount: totalNodes,
          fileCount: 0,
          type: 'database-json',
          createdAt: Date.now(),
        });
        // Keep /backupHistory bounded (best-effort, never fatal)
        await pruneBackupHistory();
      } catch {
        // Silently ignore history save failure
      }

      /* Step 5: Final stats */
      setProgressValue(100);
      setStats({ recordCount: totalNodes, fileCount: 0, totalSize: jsonStr.length });
      addLog(t('adminBackup.logDbDone', { records: totalNodes, size: sizeKB }), 'success');
      toast({
        title: t('adminBackup.dbDoneTitle'),
        description: t('adminBackup.dbDoneDesc', { count: totalNodes, size: sizeKB }),
      });
    } catch (err) {
      if (err instanceof CancelledError || cancelRef.current) {
        addLog(t('adminBackup.cancelled'), 'warning');
        setProgressValue(0);
      } else {
        addLog(t('adminBackup.logDbFailed', { error: String(err) }), 'error');
        toast({
          title: t('common.error'),
          description: t('adminBackup.dbFailedDesc'),
          variant: 'destructive',
        });
      }
    } finally {
      setIsDbBackup(false);
    }
  }, [addLog, clearLogs, collectBackupData, includeSensitive, toast, t]);

  /* ---------------------------------------------------------------- */
  /*  Restore Helper: upload files from ZIP to GitHub (parallel)      */
  /* ---------------------------------------------------------------- */

  const uploadFilesFromZip = useCallback(
    async (
      zip: JSZip,
      zipPathToUrl: Map<string, string>,
      checkCancel: () => void,
      onProgress: (completed: number, total: number) => void,
    ): Promise<{ urlMapping: Record<string, string>; uploaded: number; unmapped: number; total: number }> => {
      const fileEntries: string[] = [];
      zip.forEach((relativePath, file) => {
        if (relativePath.startsWith('files/') && !file.dir) {
          fileEntries.push(relativePath);
        }
      });

      const urlMapping: Record<string, string> = {};
      let uploaded = 0;
      let unmapped = 0;
      let completed = 0;

      const githubConfig = await getGithubConfig();
      if (!githubConfig) {
        addLog(t('adminBackup.logGithubSkip'), 'warning');
        return { urlMapping, uploaded, unmapped, total: fileEntries.length };
      }

      addLog(t('adminBackup.logFetchingFiles'), 'info');
      await runWithConcurrency(fileEntries, BACKUP_POOL_LIMIT, async (zipPath) => {
        checkCancel();
        const fileData = await zip.file(zipPath)?.async('arraybuffer');
        if (fileData) {
          const fileName = zipPath.split('/').pop() || 'unknown';
          try {
            // Signal lets Cancel abort the IN-FLIGHT GitHub request too, not
            // just the between-item checkCancel() above. handleRestore owns
            // the AbortController via abortRef (aborted by requestCancel).
            const newUrl = await uploadToGithub(fileData, fileName, githubConfig, {
              signal: abortRef.current?.signal,
            });
            const originalUrl = zipPathToUrl.get(zipPath);
            if (originalUrl) {
              urlMapping[originalUrl] = newUrl;
            } else {
              unmapped++;
            }
            uploaded++;
          } catch (err) {
            // Cancel while this upload was in flight → surface as the normal
            // cancel flow (same translation pattern as the export fetch loop)
            // instead of a per-file failure warning.
            if (cancelRef.current) throw new CancelledError();
            if (err instanceof DOMException && err.name === 'AbortError') throw new CancelledError();
            addLog(t('adminBackup.logFileUlFailed', { file: fileName }), 'warning');
          }
        }
        completed++;
        onProgress(completed, fileEntries.length);
      });

      addLog(t('adminBackup.logFilesUlDone', { done: uploaded, total: fileEntries.length }), 'success');
      return { urlMapping, uploaded, unmapped, total: fileEntries.length };
    },
    [addLog, getGithubConfig, t],
  );

  /* ---------------------------------------------------------------- */
  /*  Restore Helper: replace ORIGINAL URLs in database data          */
  /*  (urlMapping: originalUrl → newUrl)                              */
  /* ---------------------------------------------------------------- */

  const replaceUrlsInData = useCallback(
    (data: unknown, urlMapping: Record<string, string>): unknown => {
      // Longest originalUrl first — prevents prefix collisions from corrupting
      // sibling URLs that merely extend a shorter one (see getSortedUrlEntries).
      const entries = getSortedUrlEntries(urlMapping);
      if (entries.length === 0) return data;
      const walk = (value: unknown): unknown => {
        if (typeof value === 'string') {
          let result = value;
          for (const [oldUrl, newUrl] of entries) {
            if (result.includes(oldUrl)) {
              result = result.split(oldUrl).join(newUrl);
            }
          }
          return result;
        }
        if (Array.isArray(value)) return value.map(walk);
        if (value !== null && typeof value === 'object') {
          const out: Record<string, unknown> = {};
          for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
            out[key] = walk(val);
          }
          return out;
        }
        return value;
      };
      return walk(data);
    },
    [],
  );

  /* ---------------------------------------------------------------- */
  /*  Restore Helper: pre-restore safety snapshot (undo guarantee)    */
  /* ---------------------------------------------------------------- */

  const generateSafetySnapshot = useCallback(
    async (checkCancel: () => void) => {
      addLog(t('adminBackup.logSnapshotStart'), 'info');
      const { backupData, totalNodes, sensitiveFound } = await collectBackupData({
        includeSensitive,
        checkCancel,
        onProgress: (p) => setProgressValue(Math.round(p * 0.3)),
      });
      if (sensitiveFound) addLog(t('adminBackup.logSensitiveExcluded'), 'warning');

      const payload = {
        _meta: {
          version: 2,
          type: 'database-only',
          kind: 'pre-restore-snapshot',
          createdAt: Date.now(),
          createdBy: 'admin',
          nodeCount: totalNodes,
          paths: BACKUP_PATHS,
          sensitiveExcluded: !includeSensitive,
        },
        ...backupData,
      };
      downloadText(JSON.stringify(payload, null, 2), `restore-safety-snapshot-${timestampSlug()}.json`);
      addLog(t('adminBackup.logSafetySnapshot'), 'success');
    },
    [addLog, collectBackupData, includeSensitive, t],
  );

  /* ---------------------------------------------------------------- */
  /*  3. Restore (ZIP or JSON)                                        */
  /* ---------------------------------------------------------------- */

  const handleRestore = useCallback(async () => {
    if (!restoreFile) return;
    setIsRestoring(true);
    cancelRef.current = false;
    abortRef.current = new AbortController();
    const checkCancel = () => {
      if (cancelRef.current) throw new CancelledError();
    };
    clearLogs();
    addLog(t('adminBackup.logRestoreStart'), 'info');

    try {
      /* ---- Safety snapshot of the CURRENT database (undo guarantee) ---- */
      try {
        await generateSafetySnapshot(checkCancel);
      } catch (err) {
        if (err instanceof CancelledError || cancelRef.current) throw err;
        addLog(t('adminBackup.snapshotFailed', { error: String(err) }), 'error');
        toast({
          title: t('common.error'),
          description: t('adminBackup.snapshotFailed', { error: String(err) }),
          variant: 'destructive',
        });
        return;
      }

      const fileName = restoreFile.name.toLowerCase();

      if (fileName.endsWith('.json')) {
        /* ---------- JSON Restore ---------- */
        addLog(t('adminBackup.logJsonParsing'), 'info');
        const text = await restoreFile.text();
        checkCancel();
        const data = JSON.parse(text) as Record<string, unknown> & {
          _meta?: { version?: number; nodeCount?: number; createdAt?: number };
        };

        if (!data._meta || !data._meta.version) {
          toast({
            title: t('common.error'),
            description: t('adminBackup.invalidFile'),
            variant: 'destructive',
          });
          return;
        }

        addLog(t('adminBackup.logVersion', { version: data._meta.version }), 'info');
        addLog(t('adminBackup.logTotalRecords', { count: data._meta.nodeCount || t('adminBackup.unknown') }), 'info');
        addLog(t('adminBackup.logCreated', { date: data._meta.createdAt ? new Date(data._meta.createdAt).toLocaleString(locale) : t('adminBackup.unknown') }), 'info');

        /* Skip sensitive paths unless the explicit toggle is ON */
        const sensitivePresent =
          !includeSensitive &&
          (nodeHasSensitive('config', data.config) ||
            nodeHasSensitive('settings', data.settings) ||
            nodeHasSensitive('adminUsers', data.adminUsers));
        if (sensitivePresent) addLog(t('adminBackup.logSensitiveSkip'), 'warning');

        const paths = BACKUP_PATHS.filter((p) => data[p] !== undefined);
        addLog(t('adminBackup.logPathsToRestore', { count: paths.length }), 'info');

        for (let i = 0; i < paths.length; i++) {
          checkCancel();
          const path = paths[i];
          try {
            let value: unknown = data[path];
            if (!includeSensitive) value = stripSensitiveFromNode(path, value);
            // SECURITY: with sensitive-inclusion OFF, re-attach the LIVE
            // github token / admin password hashes / admin credentials before
            // overwriting the config/settings/adminUsers nodes — the restore
            // payload has them stripped.
            if (!includeSensitive && SENSITIVE_CHILD_KEYS[path]) {
              const reMerged = await reMergeLiveSensitive(path, value);
              value = reMerged.value;
              if (reMerged.merged) addLog(t('adminBackup.logSensitiveReMerged'), 'warning');
            }
            await dbSet(path, value);
            addLog(t('adminBackup.logPathRestored', { path, index: i + 1, total: paths.length }), 'success');
          } catch (err) {
            if (err instanceof CancelledError) throw err;
            addLog(t('adminBackup.logPathRestoreFailed', { path, error: String(err) }), 'error');
          }
          setProgressValue(30 + Math.round(((i + 1) / Math.max(paths.length, 1)) * 70));
        }
        if (paths.length === 0) setProgressValue(100);

        setStats({ recordCount: countNodes(data), fileCount: 0, totalSize: text.length });
        addLog(t('adminBackup.logJsonRestoreDone', { count: paths.length }), 'success');
        toast({
          title: t('adminBackup.restoreDoneTitle'),
          description: t('adminBackup.restoreDoneDesc', { count: paths.length }),
        });
      } else if (fileName.endsWith('.zip')) {
        /* ---------- ZIP Restore ---------- */
        addLog(t('adminBackup.logZipOpening'), 'info');
        const arrayBuffer = await restoreFile.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);
        checkCancel();

        /* ---- Archive validation (_meta check, garbage rejection) ---- */
        const manifestFile = zip.file('manifest.json');
        if (!manifestFile) {
          addLog(t('adminBackup.logManifestMissing'), 'warning');
          addLog(t('adminBackup.logManifestInvalid'), 'error');
          toast({
            title: t('common.error'),
            description: t('adminBackup.invalidArchive'),
            variant: 'destructive',
          });
          return;
        }
        let manifest: unknown;
        try {
          manifest = JSON.parse(await manifestFile.async('text'));
        } catch {
          manifest = null;
        }
        if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
          addLog(t('adminBackup.logManifestInvalid'), 'error');
          toast({
            title: t('common.error'),
            description: t('adminBackup.invalidArchive'),
            variant: 'destructive',
          });
          return;
        }
        const m = manifest as BackupManifest & Record<string, unknown>;
        if (m._meta && typeof m._meta === 'object') {
          if (m._meta.kind !== 'full-backup') {
            addLog(t('adminBackup.logManifestInvalid'), 'error');
            toast({
              title: t('common.error'),
              description: t('adminBackup.invalidArchive'),
              variant: 'destructive',
            });
            return;
          }
          addLog(t('adminBackup.logManifestFound'), 'info');
        } else {
          /* Legacy manifest: flat { originalUrl: zipPath } map */
          const legacyEntries = Object.entries(m).filter(
            ([, v]) => typeof v === 'string' && (v as string).startsWith('files/'),
          );
          if (legacyEntries.length === 0) {
            addLog(t('adminBackup.logManifestInvalid'), 'error');
            toast({
              title: t('common.error'),
              description: t('adminBackup.invalidArchive'),
              variant: 'destructive',
            });
            return;
          }
          addLog(t('adminBackup.logLegacyManifest'), 'warning');
        }

        /* Build zipPath → originalUrl map (works for both manifest shapes) */
        const zipPathToUrl = new Map<string, string>();
        if (Array.isArray(m.files)) {
          for (const f of m.files) {
            if (f && typeof f.path === 'string' && typeof f.url === 'string' && f.url.length > 0) {
              zipPathToUrl.set(f.path, f.url);
            }
          }
        } else {
          for (const [url, p] of Object.entries(m)) {
            if (typeof p === 'string' && p.startsWith('files/')) {
              zipPathToUrl.set(p, url);
            }
          }
        }

        /* Count files in ZIP */
        let zipFileCount = 0;
        zip.forEach((path) => {
          if (path.startsWith('files/') && !path.endsWith('/')) zipFileCount++;
        });
        addLog(t('adminBackup.logZipFiles', { count: zipFileCount }), 'info');

        /* Read database.json */
        setProgressValue(32);
        addLog(t('adminBackup.logDbReading'), 'info');
        const dbFile = zip.file('database.json');
        if (!dbFile) {
          toast({
            title: t('common.error'),
            description: t('adminBackup.noDbInZip'),
            variant: 'destructive',
          });
          return;
        }
        const dbText = await dbFile.async('text');
        const dbData = JSON.parse(dbText) as Record<string, unknown>;
        addLog(t('adminBackup.logDbRecords', { count: countNodes(dbData) }), 'info');

        /* Upload files to GitHub (parallel pool) */
        setProgressValue(34);
        const { urlMapping, unmapped } = await uploadFilesFromZip(
          zip,
          zipPathToUrl,
          checkCancel,
          (done, total) => {
            if (total > 0) setProgressValue(32 + Math.round((done / total) * 33));
          },
        );
        if (unmapped > 0) {
          addLog(t('adminBackup.logUrlNoMapping', { count: unmapped }), 'warning');
        }

        /* Replace ORIGINAL URLs in database data */
        setProgressValue(68);
        addLog(t('adminBackup.logUrlReplacing'), 'info');
        const updatedData = replaceUrlsInData(dbData, urlMapping) as Record<string, unknown>;
        const rewriteCount = Object.keys(urlMapping).length;
        if (rewriteCount > 0) {
          addLog(t('adminBackup.logUrlRewritten', { count: rewriteCount }), 'success');
        }

        /* Skip sensitive paths unless the explicit toggle is ON */
        const sensitivePresent =
          !includeSensitive &&
          (nodeHasSensitive('config', updatedData.config) ||
            nodeHasSensitive('settings', updatedData.settings) ||
            nodeHasSensitive('adminUsers', updatedData.adminUsers));
        if (sensitivePresent) addLog(t('adminBackup.logSensitiveSkip'), 'warning');

        /* Restore each database path */
        setProgressValue(70);
        const paths = BACKUP_PATHS.filter((p) => updatedData[p] !== undefined);
        addLog(t('adminBackup.logPathsToRestore2', { count: paths.length }), 'info');

        for (let i = 0; i < paths.length; i++) {
          checkCancel();
          const path = paths[i];
          try {
            let value: unknown = updatedData[path];
            if (!includeSensitive) value = stripSensitiveFromNode(path, value);
            // SECURITY: with sensitive-inclusion OFF, re-attach the LIVE
            // github token / admin password hashes / admin credentials before
            // overwriting the config/settings/adminUsers nodes — the restore
            // payload has them stripped.
            if (!includeSensitive && SENSITIVE_CHILD_KEYS[path]) {
              const reMerged = await reMergeLiveSensitive(path, value);
              value = reMerged.value;
              if (reMerged.merged) addLog(t('adminBackup.logSensitiveReMerged'), 'warning');
            }
            await dbSet(path, value);
            addLog(t('adminBackup.logPathRestored', { path, index: i + 1, total: paths.length }), 'success');
          } catch (err) {
            if (err instanceof CancelledError) throw err;
            addLog(t('adminBackup.logPathRestoreFailed', { path, error: String(err) }), 'error');
          }
          setProgressValue(70 + Math.round(((i + 1) / Math.max(paths.length, 1)) * 30));
        }
        if (paths.length === 0) setProgressValue(100);

        setStats({
          recordCount: countNodes(updatedData),
          fileCount: rewriteCount,
          totalSize: arrayBuffer.byteLength,
        });
        addLog(t('adminBackup.logZipRestoreDone', { paths: paths.length, files: rewriteCount }), 'success');
        toast({
          title: t('adminBackup.restoreDoneTitle'),
          description: t('adminBackup.restoreDoneDescZip', { count: paths.length, files: rewriteCount }),
        });
      } else {
        toast({
          title: t('common.error'),
          description: t('adminBackup.onlyZipJson'),
          variant: 'destructive',
        });
        return;
      }

      setRestoreDialogOpen(false);
      setRestoreFile(null);
      setRestorePreview(null);
    } catch (err) {
      if (err instanceof CancelledError || cancelRef.current) {
        addLog(t('adminBackup.cancelled'), 'warning');
        setProgressValue(0);
      } else {
        addLog(t('adminBackup.logRestoreFailed', { error: String(err) }), 'error');
        toast({
          title: t('common.error'),
          description: t('adminBackup.restoreFailedDesc'),
          variant: 'destructive',
        });
      }
    } finally {
      setIsRestoring(false);
      abortRef.current = null;
    }
  }, [restoreFile, addLog, clearLogs, generateSafetySnapshot, uploadFilesFromZip, replaceUrlsInData, includeSensitive, toast, t, locale]);

  /* ---------------------------------------------------------------- */
  /*  File Selection & Preview                                         */
  /* ---------------------------------------------------------------- */

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const name = file.name.toLowerCase();
    if (!name.endsWith('.zip') && !name.endsWith('.json')) {
      toast({
        title: t('common.error'),
        description: t('adminBackup.onlyZipJson'),
        variant: 'destructive',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setRestoreFile(file);

    /* Build preview */
    if (name.endsWith('.json')) {
      try {
        const text = await file.text();
        const data = JSON.parse(text) as Record<string, unknown> & { _meta?: { nodeCount?: number } };
        const paths = BACKUP_PATHS.filter((p) => data[p] !== undefined);
        setRestorePreview({
          fileName: file.name,
          fileType: 'json',
          estimatedRecords: data._meta?.nodeCount || countNodes(data),
          estimatedFiles: 0,
          paths,
        });
      } catch {
        toast({
          title: t('common.error'),
          description: t('adminBackup.jsonParseFailed'),
          variant: 'destructive',
        });
      }
    } else {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);
        let fileCount = 0;
        zip.forEach((path) => {
          if (path.startsWith('files/') && !path.endsWith('/')) fileCount++;
        });
        const dbFile = zip.file('database.json');
        const dbData = dbFile ? (JSON.parse(await dbFile.async('text')) as Record<string, unknown>) : {};
        const paths = BACKUP_PATHS.filter((p) => dbData[p] !== undefined);
        setRestorePreview({
          fileName: file.name,
          fileType: 'zip',
          estimatedRecords: countNodes(dbData),
          estimatedFiles: fileCount,
          paths,
        });
      } catch {
        toast({
          title: t('common.error'),
          description: t('adminBackup.zipReadFailed'),
          variant: 'destructive',
        });
      }
    }

    setRestoreDialogOpen(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ---------------------------------------------------------------- */
  /*  Backup History (real data from /backupHistory)                  */
  /* ---------------------------------------------------------------- */

  const loadBackupHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await dbGet<Record<string, BackupHistoryRecord>>('/backupHistory');
      const entries: BackupHistoryEntry[] = data
        ? Object.entries(data).map(([id, item]) => ({ ...(item as BackupHistoryRecord), id }))
        : [];
      entries.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setHistory(entries.slice(0, 20));
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBackupHistory();
  }, [loadBackupHistory]);

  /* ---------------------------------------------------------------- */
  /*  Live Firebase Console                                           */
  /* ---------------------------------------------------------------- */

  const loadConsoleNode = useCallback(
    async (rawPath?: string) => {
      const path = normalizeDbPath(rawPath ?? consoleInput);
      if (!path) {
        toast({
          title: t('common.error'),
          description: t('adminBackup.consolePathPlaceholder'),
          variant: 'destructive',
        });
        return;
      }
      setConsoleInput(path);
      setConsoleStatus('loading');
      setConsoleEditing(false);
      setConsoleJsonError(null);
      try {
        const data = await dbGet<unknown>(path);
        setConsoleLoadedPath(path);
        if (data === null) {
          setConsoleData(null);
          setConsoleStatus('notfound');
        } else {
          setConsoleData(data);
          setConsoleStatus('loaded');
          addLog(t('adminBackup.consoleLoadedLog', { path }), 'info');
        }
      } catch (err) {
        setConsoleStatus('idle');
        toast({
          title: t('common.error'),
          description: String(err),
          variant: 'destructive',
        });
      }
    },
    [consoleInput, addLog, t, toast],
  );

  const toggleConsoleEdit = useCallback(
    (checked: boolean) => {
      setConsoleEditing(checked);
      if (checked) {
        setConsoleJsonError(null);
        setConsoleDraft(
          consoleStatus === 'loaded' && consoleData !== null && consoleData !== undefined
            ? JSON.stringify(consoleData, null, 2)
            : '{}',
        );
      }
    },
    [consoleData, consoleStatus],
  );

  const handleConsoleSaveRequest = useCallback(() => {
    const path = consoleLoadedPath;
    if (!path) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(consoleDraft);
    } catch (err) {
      setConsoleJsonError(
        t('adminBackup.consoleInvalidJson', { error: err instanceof Error ? err.message : String(err) }),
      );
      return;
    }
    setConsoleJsonError(null);
    setConsolePendingData(parsed);
    setConsoleSaveOpen(true);
  }, [consoleLoadedPath, consoleDraft, t]);

  const handleConsoleSaveConfirm = useCallback(async () => {
    const path = consoleLoadedPath;
    if (!path || consolePendingData === undefined) return;
    setConsoleSaving(true);
    try {
      await dbSet(path, consolePendingData);
      addLog(t('adminBackup.consoleSavedLog', { path }), 'success');
      toast({
        title: t('adminBackup.consoleSaved'),
        description: t('adminBackup.consoleSavedLog', { path }),
      });
      setConsoleData(consolePendingData);
      setConsoleStatus('loaded');
      setConsoleEditing(false);
      setConsoleSaveOpen(false);
    } catch (err) {
      toast({
        title: t('common.error'),
        description: String(err),
        variant: 'destructive',
      });
    } finally {
      setConsoleSaving(false);
    }
  }, [consoleLoadedPath, consolePendingData, addLog, t, toast]);

  const handleConsoleDeleteClick = useCallback(() => {
    const path = consoleLoadedPath;
    if (!path || consoleStatus !== 'loaded') return;
    if (PROTECTED_DELETE_PATHS.has(normalizeDbPath(path))) {
      addLog(t('adminBackup.consoleDeleteBlocked'), 'error');
      toast({
        title: t('common.error'),
        description: t('adminBackup.consoleDeleteBlocked'),
        variant: 'destructive',
      });
      return;
    }
    setConsoleDeleteOpen(true);
  }, [consoleLoadedPath, consoleStatus, addLog, t, toast]);

  const handleConsoleDeleteConfirm = useCallback(async () => {
    const path = consoleLoadedPath;
    if (!path) return;
    // DEFENSE-IN-DEPTH: PROTECTED_DELETE_PATHS was already checked when the
    // dialog opened — re-check right before executing so a path swapped in
    // the meantime can never be deleted.
    if (PROTECTED_DELETE_PATHS.has(normalizeDbPath(path))) {
      addLog(t('adminBackup.consoleDeleteBlocked'), 'error');
      toast({
        title: t('common.error'),
        description: t('adminBackup.consoleDeleteBlocked'),
        variant: 'destructive',
      });
      setConsoleDeleteOpen(false);
      return;
    }
    setConsoleDeleting(true);
    try {
      await dbRemove(path);
      addLog(t('adminBackup.consoleDeletedLog', { path }), 'success');
      toast({
        title: t('adminBackup.consoleDelete'),
        description: t('adminBackup.consoleDeletedLog', { path }),
      });
      setConsoleData(null);
      setConsoleStatus('notfound');
      setConsoleEditing(false);
      setConsoleDeleteOpen(false);
    } catch (err) {
      toast({
        title: t('common.error'),
        description: String(err),
        variant: 'destructive',
      });
    } finally {
      setConsoleDeleting(false);
    }
  }, [consoleLoadedPath, addLog, t, toast]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  const isBusy = isFullBackup || isDbBackup || isRestoring;

  const renderHistoryType = (type?: string) =>
    type === 'full-zip' ? (
      <Badge variant="secondary" className="text-[10px] gap-1">
        <Archive className="size-3" /> {t('adminBackup.typeFullZip')}
      </Badge>
    ) : (
      <Badge variant="secondary" className="text-[10px] gap-1">
        <FileJson className="size-3" /> {t('adminBackup.typeDbJson')}
      </Badge>
    );

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* ============================================================ */}
      {/* Header                                                        */}
      {/* ============================================================ */}
      <div>
        <h2 className="text-2xl font-bold text-islamic-dark">{t('adminBackup.title')}</h2>
        <p className="text-muted-foreground text-sm mt-1">
          {t('adminBackup.subtitle')}
        </p>
      </div>

      {/* ============================================================ */}
      {/* Warning Card                                                  */}
      {/* ============================================================ */}
      <Card className="shadow-sm border-warning/40 bg-warning/15">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="size-5 text-warning-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-warning-foreground">{t('adminBackup.warningTitle')}</p>
            <p className="text-sm text-warning-foreground mt-1">
              {t('adminBackup.warningText')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* Sensitive Data Toggle (SECURITY)                              */}
      {/* ============================================================ */}
      <Card className="shadow-sm border-islamic/10">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="p-2 rounded-lg bg-islamic-lighter shrink-0 self-start">
            <ShieldAlert className="size-5 text-islamic-dark" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-islamic-dark">{t('adminBackup.sensitiveTitle')}</p>
            <p className={`text-xs mt-0.5 ${includeSensitive ? 'text-danger' : 'text-muted-foreground'}`}>
              {includeSensitive ? t('adminBackup.sensitiveDescOn') : t('adminBackup.sensitiveDescOff')}
            </p>
            <p dir="ltr" className="text-[10px] font-mono text-muted-foreground/70 mt-1 text-left">
              config/githubConfig · config/adminAuth · settings/adminAuth
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none shrink-0">
            <Switch
              checked={includeSensitive}
              onCheckedChange={(checked) => setIncludeSensitive(checked)}
              disabled={isBusy}
            />
            <span className="text-xs font-medium text-islamic-dark max-w-[220px] sm:text-right">
              {t('adminBackup.sensitiveLabel')}
            </span>
          </label>
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* Action Cards Grid                                             */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card 1: Full Backup (ZIP) */}
        <Card className="shadow-sm border-border hover:border-islamic/30 hover:shadow-md hover:ring-1 hover:ring-islamic/20 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-islamic-dark">
              <span className="p-1.5 rounded-lg bg-islamic-lighter">
                <Download className="size-4" />
              </span>
              {t('adminBackup.fullTitle')}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{t('adminBackup.fullDesc')}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="text-[10px] gap-1">
                <ImageIcon className="size-3" /> {t('adminBackup.badgeImages')}
              </Badge>
              <Badge variant="secondary" className="text-[10px] gap-1">
                <Music className="size-3" /> {t('adminBackup.badgeAudio')}
              </Badge>
              <Badge variant="secondary" className="text-[10px] gap-1">
                <Video className="size-3" /> {t('adminBackup.badgeVideo')}
              </Badge>
              <Badge variant="secondary" className="text-[10px] gap-1">
                <FileText className="size-3" /> {t('adminBackup.badgeDocs')}
              </Badge>
            </div>
            <Button
              onClick={handleFullBackup}
              disabled={isBusy}
              className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer w-full"
            >
              {isFullBackup ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              {isFullBackup ? t('adminBackup.creating') : t('adminBackup.fullBtn')}
            </Button>
          </CardContent>
        </Card>

        {/* Card 2: Database Backup (JSON) */}
        <Card className="shadow-sm border-border hover:border-islamic/30 hover:shadow-md hover:ring-1 hover:ring-islamic/20 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-islamic-dark">
              <span className="p-1.5 rounded-lg bg-islamic-lighter">
                <FileJson className="size-4" />
              </span>
              {t('adminBackup.dbTitle')}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{t('adminBackup.dbDesc')}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="text-[10px] gap-1">
                <Database className="size-3" /> {t('adminBackup.badgeDataOnly')}
              </Badge>
              <Badge variant="secondary" className="text-[10px] gap-1">
                <HardDrive className="size-3" /> {t('adminBackup.badgeLight')}
              </Badge>
            </div>
            <Button
              onClick={handleDatabaseBackup}
              disabled={isBusy}
              className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer w-full"
            >
              {isDbBackup ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              {isDbBackup ? t('adminBackup.creating') : t('adminBackup.dbBtn')}
            </Button>
          </CardContent>
        </Card>

        {/* Card 3: Restore */}
        <Card className="shadow-sm border-border hover:border-islamic/30 hover:shadow-md hover:ring-1 hover:ring-islamic/20 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-islamic-dark">
              <span className="p-1.5 rounded-lg bg-islamic-lighter">
                <UploadCloud className="size-4" />
              </span>
              {t('adminBackup.restoreTitle')}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{t('adminBackup.restoreDesc')}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="text-[10px] gap-1">
                <Archive className="size-3" /> ZIP
              </Badge>
              <Badge variant="secondary" className="text-[10px] gap-1">
                <FileJson className="size-3" /> JSON
              </Badge>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,.json"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
              className="gap-2 cursor-pointer w-full"
            >
              <UploadCloud className="size-4" />
              {t('adminBackup.uploadBtn')}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ============================================================ */}
      {/* Progress Section                                               */}
      {/* ============================================================ */}
      {(isBusy || logs.length > 0) && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-islamic-dark flex-wrap">
              {isBusy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4 text-primary" />
              )}
              {t('adminBackup.progressLog')}
              {isBusy && (
                <>
                  <Badge variant="secondary" className="text-[10px] ml-auto">
                    {t('adminBackup.inProgress')}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={requestCancel}
                    className="h-7 gap-1 border-danger/40 text-danger hover:bg-danger/10 hover:text-danger cursor-pointer"
                  >
                    <XCircle className="size-3.5" />
                    {t('adminBackup.cancelBtn')}
                  </Button>
                </>
              )}
              {!isBusy && logs.length > 0 && (
                <Badge className="text-[10px] ml-auto bg-primary/10 text-primary border-primary/25">
                  {t('adminBackup.completed')}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Progress Bar */}
            {isBusy && (
              <Progress value={progressValue} className="h-2.5" />
            )}
            {!isBusy && progressValue === 100 && (
              <Progress value={100} className="h-2.5" />
            )}

            {/* Scrollable Logs with monospace timestamps */}
            <div className="max-h-96 overflow-y-auto results-scroll rounded-lg border bg-surface-tertiary/30 p-2 space-y-1">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-2 text-xs py-1 px-2 rounded"
                >
                  <span className="font-mono text-[10px] text-muted-foreground/70 shrink-0 mt-0.5" dir="ltr">
                    {formatClock(log.timestamp)}
                  </span>
                  {log.type === 'success' && (
                    <CheckCircle2 className="size-3.5 text-primary shrink-0 mt-0.5" />
                  )}
                  {log.type === 'error' && (
                    <XCircle className="size-3.5 text-danger shrink-0 mt-0.5" />
                  )}
                  {log.type === 'warning' && (
                    <AlertTriangle className="size-3.5 text-warning-foreground shrink-0 mt-0.5" />
                  )}
                  {log.type === 'info' && (
                    <Info className="size-3.5 text-islamic-dark shrink-0 mt-0.5" />
                  )}
                  <span
                    className={
                      log.type === 'success'
                        ? 'text-primary'
                        : log.type === 'error'
                          ? 'text-danger'
                          : log.type === 'warning'
                            ? 'text-warning-foreground'
                            : 'text-muted-foreground'
                    }
                  >
                    {log.message}
                  </span>
                </div>
              ))}
            </div>

            {/* Clear Logs */}
            {!isBusy && logs.length > 0 && (
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearLogs}
                  className="text-xs text-muted-foreground gap-1 cursor-pointer"
                >
                  {t('adminBackup.clearLogs')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ============================================================ */}
      {/* Statistics Cards                                               */}
      {/* ============================================================ */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Database className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-islamic-dark">{stats.recordCount.toLocaleString(locale)}</p>
                <p className="text-xs text-muted-foreground">{t('adminBackup.statRecords')}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-islamic-lighter">
                <FolderOpen className="size-5 text-islamic-dark" />
              </div>
              <div>
                <p className="text-2xl font-bold text-islamic-dark">{stats.fileCount.toLocaleString(locale)}</p>
                <p className="text-xs text-muted-foreground">{t('adminBackup.statFiles')}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/20">
                <HardDrive className="size-5 text-warning-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-islamic-dark">{formatFileSize(stats.totalSize)}</p>
                <p className="text-xs text-muted-foreground">{t('adminBackup.statSize')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/* Backup History (real data)                                    */}
      {/* ============================================================ */}
      <Card className="shadow-sm border-islamic/10">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <CardTitle className="text-lg flex items-center gap-2 text-islamic-dark">
                <span className="p-1.5 rounded-lg bg-islamic-lighter">
                  <History className="size-4" />
                </span>
                {t('adminBackup.historyTitle')}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">{t('adminBackup.historyDesc')}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadBackupHistory()}
              disabled={historyLoading}
              className="gap-1.5 cursor-pointer shrink-0"
            >
              <RefreshCw className={`size-3.5 ${historyLoading ? 'animate-spin' : ''}`} />
              {t('adminBackup.historyRefresh')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {historyLoading && history.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-islamic" />
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <Inbox className="size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">{t('adminBackup.historyEmpty')}</p>
            </div>
          ) : (
            <>
              {/* Table (md+) */}
              <div className="hidden md:block max-h-80 overflow-y-auto results-scroll rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-surface-tertiary/50 sticky top-0 z-10">
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="px-3 py-2 font-medium">{t('adminBackup.historyDate')}</th>
                      <th className="px-3 py-2 font-medium">{t('adminBackup.historyType')}</th>
                      <th className="px-3 py-2 font-medium">{t('adminBackup.historyRecords')}</th>
                      <th className="px-3 py-2 font-medium">{t('adminBackup.historyFiles')}</th>
                      <th className="px-3 py-2 font-medium">{t('adminBackup.historySize')}</th>
                      <th className="px-3 py-2 font-medium">{t('adminBackup.historyFile')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {history.map((item) => (
                      <tr key={item.id} className="hover:bg-surface-tertiary/30">
                        <td className="px-3 py-2 whitespace-nowrap text-xs">
                          {item.createdAt ? new Date(item.createdAt).toLocaleString(locale) : '—'}
                        </td>
                        <td className="px-3 py-2">{renderHistoryType(item.type)}</td>
                        <td className="px-3 py-2">{(item.nodeCount ?? 0).toLocaleString(locale)}</td>
                        <td className="px-3 py-2">{(item.fileCount ?? 0).toLocaleString(locale)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs">{item.size || '—'}</td>
                        <td className="px-3 py-2 max-w-[220px]">
                          <span className="block truncate font-mono text-xs text-muted-foreground" dir="ltr" title={item.filename}>
                            {item.filename || '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Card list (mobile) */}
              <div className="md:hidden space-y-2 max-h-96 overflow-y-auto results-scroll">
                {history.map((item) => (
                  <div key={item.id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      {renderHistoryType(item.type)}
                      <span className="text-xs text-muted-foreground">
                        {item.createdAt ? new Date(item.createdAt).toLocaleString(locale) : '—'}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground truncate" dir="ltr">
                      {item.filename || '—'}
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-surface-tertiary/40 rounded p-1.5">
                        <p className="text-sm font-bold text-islamic-dark">{(item.nodeCount ?? 0).toLocaleString(locale)}</p>
                        <p className="text-[10px] text-muted-foreground">{t('adminBackup.historyRecords')}</p>
                      </div>
                      <div className="bg-surface-tertiary/40 rounded p-1.5">
                        <p className="text-sm font-bold text-islamic-dark">{(item.fileCount ?? 0).toLocaleString(locale)}</p>
                        <p className="text-[10px] text-muted-foreground">{t('adminBackup.historyFiles')}</p>
                      </div>
                      <div className="bg-surface-tertiary/40 rounded p-1.5">
                        <p className="text-sm font-bold text-islamic-dark">{item.size || '—'}</p>
                        <p className="text-[10px] text-muted-foreground">{t('adminBackup.historySize')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* Live Firebase Console                                         */}
      {/* ============================================================ */}
      <Card className="shadow-sm border-islamic/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-islamic-dark">
            <span className="p-1.5 rounded-lg bg-islamic-lighter">
              <Terminal className="size-4" />
            </span>
            {t('adminBackup.consoleLabel')}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">{t('adminBackup.consoleDesc')}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Path input + actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              dir="ltr"
              value={consoleInput}
              onChange={(e) => setConsoleInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void loadConsoleNode();
              }}
              placeholder={t('adminBackup.consolePathPlaceholder')}
              disabled={consoleStatus === 'loading'}
              className="font-mono text-xs flex-1"
            />
            <Button
              onClick={() => void loadConsoleNode()}
              disabled={consoleStatus === 'loading' || !consoleInput.trim()}
              className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
            >
              {consoleStatus === 'loading' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              {t('adminBackup.consoleLoad')}
            </Button>
            <label className="flex items-center justify-center gap-2 cursor-pointer select-none whitespace-nowrap px-2">
              <Switch
                checked={consoleEditing}
                disabled={consoleStatus === 'idle' || consoleStatus === 'loading' || isBusy}
                onCheckedChange={toggleConsoleEdit}
              />
              <span className="text-xs font-medium text-islamic-dark">{t('adminBackup.consoleEditJson')}</span>
            </label>
            <Button
              variant="outline"
              onClick={handleConsoleDeleteClick}
              disabled={consoleStatus !== 'loaded' || consoleDeleting || isBusy}
              className="gap-2 border-danger/40 text-danger hover:bg-danger/10 hover:text-danger cursor-pointer"
            >
              <Trash2 className="size-4" />
              {t('adminBackup.consoleDelete')}
            </Button>
          </div>

          {/* Quick-jump chips */}
          <div className="flex flex-wrap gap-1.5">
            {CONSOLE_QUICK_NODES.map((node) => (
              <button
                key={node}
                type="button"
                dir="ltr"
                onClick={() => void loadConsoleNode(node)}
                className={`rounded-full border px-2.5 py-1 font-mono text-[11px] transition-colors cursor-pointer ${
                  consoleLoadedPath === node
                    ? 'border-islamic bg-islamic text-white'
                    : 'border-border bg-surface-tertiary/40 text-islamic-dark hover:border-islamic/40 hover:bg-islamic-lighter'
                }`}
              >
                {node}
              </button>
            ))}
          </div>

          {/* Node viewer / editor */}
          {consoleStatus === 'loading' ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-6 animate-spin text-islamic" />
            </div>
          ) : consoleStatus === 'idle' ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <Database className="size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">{t('adminBackup.consoleIdle')}</p>
            </div>
          ) : consoleStatus === 'notfound' ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <Inbox className="size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">{t('adminBackup.consoleNotFound')}</p>
              <p className="text-xs text-muted-foreground/80">{t('adminBackup.consoleCreateHint')}</p>
            </div>
          ) : consoleEditing ? (
            <div className="space-y-2">
              <Textarea
                dir="ltr"
                value={consoleDraft}
                onChange={(e) => setConsoleDraft(e.target.value)}
                className="h-64 font-mono text-xs bg-surface-tertiary/30 results-scroll resize-y"
              />
              {consoleJsonError && (
                <p className="text-xs text-danger flex items-center gap-1">
                  <XCircle className="size-3.5 shrink-0" />
                  {consoleJsonError}
                </p>
              )}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setConsoleEditing(false);
                    setConsoleJsonError(null);
                  }}
                  disabled={consoleSaving}
                  className="cursor-pointer"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={handleConsoleSaveRequest}
                  disabled={consoleSaving}
                  className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="size-4" />
                  {t('adminBackup.consoleSave')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Badge variant="secondary" className="font-mono text-[10px]" dir="ltr">
                  {consoleLoadedPath}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {t(
                    'adminBackup.consoleKeys',
                    {
                      count:
                        typeof consoleData === 'object' && consoleData !== null
                          ? Object.keys(consoleData as Record<string, unknown>).length
                          : 0,
                    },
                  )}
                </Badge>
              </div>
              <pre
                dir="ltr"
                className="max-h-96 overflow-auto results-scroll rounded-lg border bg-surface-tertiary/30 p-4 text-xs font-mono whitespace-pre-wrap break-all text-left"
              >
                {JSON.stringify(consoleData, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* Info Card                                                     */}
      {/* ============================================================ */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="size-5 text-islamic-dark shrink-0 mt-0.5" />
            <div className="space-y-2 min-w-0">
              <p className="text-sm font-semibold text-islamic-dark">{t('adminBackup.infoTitle')}</p>
              <div className="text-sm text-muted-foreground space-y-1.5">
                <p>
                  <strong className="text-foreground">{t('adminBackup.fullTitle')}:</strong>{' '}
                  {t('adminBackup.infoFullText')}
                </p>
                <p>
                  <strong className="text-foreground">{t('adminBackup.dbTitle')}:</strong>{' '}
                  {t('adminBackup.infoDbText')}
                </p>
                <p>
                  <strong className="text-foreground">{t('adminBackup.restoreWord')}:</strong>{' '}
                  {t('adminBackup.infoRestoreText')}
                </p>
              </div>
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  {t('adminBackup.totalPathsLabel')}{' '}
                  <strong>{t('adminBackup.pathsCount', { count: BACKUP_PATHS.length })}</strong> —{' '}
                  <span dir="ltr">{BACKUP_PATHS.join(', ')}</span>.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* Restore Confirmation Dialog                                   */}
      {/* ============================================================ */}
      <AlertDialog
        open={restoreDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setRestoreDialogOpen(false);
            setRestoreFile(null);
            setRestorePreview(null);
          }
        }}
      >
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-islamic-dark flex items-center gap-2">
              <AlertTriangle className="size-5 text-warning-foreground" />
              {t('adminBackup.dialogTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-1">
                <p className="text-sm">
                  {t('adminBackup.dialogDesc')}
                </p>

                {/* File Info */}
                {restorePreview && (
                  <div className="bg-surface-tertiary/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      {restorePreview.fileType === 'zip' ? (
                        <Archive className="size-4 text-islamic" />
                      ) : (
                        <FileJson className="size-4 text-islamic" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {restorePreview.fileName}
                        </p>
                        <Badge
                          variant="secondary"
                          className="text-[10px] mt-1"
                        >
                          {restorePreview.fileType.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="bg-background rounded p-2">
                        <p className="text-lg font-bold text-islamic-dark">
                          {restorePreview.estimatedRecords.toLocaleString(locale)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{t('adminBackup.estRecords')}</p>
                      </div>
                      <div className="bg-background rounded p-2">
                        <p className="text-lg font-bold text-islamic-dark">
                          {restorePreview.estimatedFiles.toLocaleString(locale)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{t('adminBackup.estFiles')}</p>
                      </div>
                    </div>
                    <div className="pt-1">
                      <p className="text-xs text-muted-foreground">
                        <strong>{t('adminBackup.dataPathsLabel')}</strong> {t('adminBackup.pathsWillRestore', { count: restorePreview.paths.length })}
                      </p>
                    </div>
                  </div>
                )}

                {/* Warning */}
                <div className="flex items-start gap-2 bg-warning/15 border border-warning/40 rounded-lg p-3">
                  <AlertTriangle className="size-4 text-warning-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-warning-foreground">
                    {t('adminBackup.dialogWarning')}
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRestoring}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              disabled={isRestoring}
              className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
            >
              {isRestoring ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RotateCcw className="size-4" />
              )}
              {isRestoring ? t('adminBackup.restoring') : t('adminBackup.restoreBtn')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ============================================================ */}
      {/* Console: Save Confirmation Dialog                             */}
      {/* ============================================================ */}
      <AlertDialog open={consoleSaveOpen} onOpenChange={setConsoleSaveOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-islamic-dark flex items-center gap-2">
              <AlertTriangle className="size-5 text-warning-foreground" />
              {t('adminBackup.consoleSaveConfirm')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('adminBackup.consoleSaveConfirmDesc', { path: consoleLoadedPath ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={consoleSaving}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleConsoleSaveConfirm();
              }}
              disabled={consoleSaving}
              className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
            >
              {consoleSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              {t('adminBackup.consoleSave')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ============================================================ */}
      {/* Console: Delete Confirmation Dialog                           */}
      {/* ============================================================ */}
      <AlertDialog open={consoleDeleteOpen} onOpenChange={setConsoleDeleteOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-islamic-dark flex items-center gap-2">
              <AlertTriangle className="size-5 text-danger" />
              {t('adminBackup.consoleDeleteConfirm')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('adminBackup.consoleDeleteConfirmDesc', { path: consoleLoadedPath ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={consoleDeleting}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleConsoleDeleteConfirm();
              }}
              disabled={consoleDeleting}
              className="bg-danger hover:bg-danger/90 text-danger-foreground gap-2 cursor-pointer"
            >
              {consoleDeleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              {t('adminBackup.consoleDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
