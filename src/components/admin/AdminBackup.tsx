'use client';

import { useState, useRef, useCallback } from 'react';
import JSZip from 'jszip';
import {
  Download,
  Upload,
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
} from 'lucide-react';
import { dbGet, dbSet, dbPush, uploadToGithub } from '@/lib/db-service';
import { useTranslation } from '@/lib/i18n-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const BACKUP_PATHS = [
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
  'payments',
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
];

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

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminBackup() {
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const locale = language === 'ar' ? 'ar-EG' : language === 'en' ? 'en-GB' : 'bn-BD';
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [restoreLogId, setRestoreLogId] = useState(0);

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

  /* ---------------------------------------------------------------- */
  /*  Fetch GitHub config from Firebase                                */
  /* ---------------------------------------------------------------- */

  const getGithubConfig = useCallback(async () => {
    try {
      const config = await dbGet<Record<string, unknown>>('config');
      const github = config?.github as
        | { token: string; owner: string; repo: string; branch: string }
        | undefined;
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
  /*  1. Full Backup (ZIP)                                            */
  /* ---------------------------------------------------------------- */

  const handleFullBackup = useCallback(async () => {
    setIsFullBackup(true);
    clearLogs();
    addLog(t('adminBackup.logFullStart'), 'info');

    try {
      /* Step 1: Load all database paths */
      addLog(t('adminBackup.logLoadingData'), 'info');
      const backupData: Record<string, unknown> = {};
      let totalNodes = 0;
      let pathsLoaded = 0;

      for (const path of BACKUP_PATHS) {
        try {
          const data = await dbGet<unknown>(path);
          if (data) {
            backupData[path] = data;
            totalNodes += countNodes(data);
          }
          pathsLoaded++;
          setProgressValue(Math.round((pathsLoaded / BACKUP_PATHS.length) * 30));
        } catch (err) {
          addLog(t('adminBackup.logPathLoadFailed', { path, error: String(err) }), 'warning');
        }
      }
      addLog(t('adminBackup.logPathsLoaded', { loaded: pathsLoaded, total: BACKUP_PATHS.length }), 'success');

      /* Step 2: Extract file URLs */
      addLog(t('adminBackup.logDetectingUrls'), 'info');
      const allUrls = extractFileUrls(backupData);
      const uniqueUrls = [...new Set(allUrls)];
      addLog(t('adminBackup.logUniqueUrls', { count: uniqueUrls.length }), 'info');

      /* Step 3: Download files and build ZIP */
      addLog(t('adminBackup.logBuildingZip'), 'info');
      const zip = new JSZip();
      let filesDownloaded = 0;
      let totalBytes = 0;
      const manifest: Record<string, string> = {};

      for (let i = 0; i < uniqueUrls.length; i++) {
        const url = uniqueUrls[i];
        try {
          const response = await fetch(url);
          const category = getFileCategory(url);
          const fileName = getFileNameFromUrl(url);
          if (response.ok) {
            const blob = await response.blob();
            const zipPath = `files/${category}/${fileName}`;
            zip.file(zipPath, blob);
            manifest[url] = zipPath;
            totalBytes += blob.size;
            filesDownloaded++;
          } else {
            addLog(t('adminBackup.logFileDlFailedStatus', { status: response.status, file: fileName }), 'warning');
          }
        } catch {
          addLog(t('adminBackup.logFileDlFailed', { file: getFileNameFromUrl(url) }), 'warning');
        }
        setProgressValue(30 + Math.round((i / uniqueUrls.length) * 50));
      }
      addLog(t('adminBackup.logFilesDlDone', { done: filesDownloaded, total: uniqueUrls.length }), 'success');

      /* Step 4: Add database.json */
      zip.file('database.json', JSON.stringify(backupData, null, 2));
      addLog(t('adminBackup.logDbAdded'), 'info');

      /* Step 5: Add manifest.json */
      zip.file('manifest.json', JSON.stringify(manifest, null, 2));
      addLog(t('adminBackup.logManifestAdded'), 'info');

      /* Step 6: Generate ZIP */
      addLog(t('adminBackup.logZipGenerating'), 'info');
      setProgressValue(85);
      const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      setProgressValue(95);

      /* Step 7: Trigger download */
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
        await dbPush('/backupHistory', {
          filename,
          size: formatFileSize(zipBlob.size),
          nodeCount: totalNodes,
          fileCount: filesDownloaded,
          type: 'full-zip',
          createdAt: Date.now(),
        });
        addLog(t('adminBackup.logHistorySaved'), 'success');
      } catch {
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
      addLog(t('adminBackup.logBackupFailed', { error: String(err) }), 'error');
      toast({
        title: t('common.error'),
        description: t('adminBackup.fullFailedDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsFullBackup(false);
    }
  }, [addLog, clearLogs, toast, t, formatFileSize]);

  /* ---------------------------------------------------------------- */
  /*  2. Database Backup (JSON)                                       */
  /* ---------------------------------------------------------------- */

  const handleDatabaseBackup = useCallback(async () => {
    setIsDbBackup(true);
    clearLogs();
    addLog(t('adminBackup.logDbStart'), 'info');

    try {
      /* Step 1: Load all database paths */
      addLog(t('adminBackup.logLoadingData'), 'info');
      const backupData: Record<string, unknown> = {};
      let totalNodes = 0;
      let pathsLoaded = 0;

      for (const path of BACKUP_PATHS) {
        try {
          const data = await dbGet<unknown>(path);
          if (data) {
            backupData[path] = data;
            totalNodes += countNodes(data);
          }
          pathsLoaded++;
          setProgressValue(Math.round((pathsLoaded / BACKUP_PATHS.length) * 80));
          addLog(t('adminBackup.logPathLoaded', { path, loaded: pathsLoaded, total: BACKUP_PATHS.length }), 'info');
        } catch (err) {
          addLog(t('adminBackup.logPathLoadFailed', { path, error: String(err) }), 'warning');
        }
      }

      /* Step 2: Build JSON payload */
      setProgressValue(85);
      const backupPayload = {
        _meta: {
          version: 2,
          type: 'database-only',
          createdAt: Date.now(),
          createdBy: 'admin',
          nodeCount: totalNodes,
          paths: BACKUP_PATHS,
        },
        ...backupData,
      };
      const jsonStr = JSON.stringify(backupPayload, null, 2);

      /* Step 3: Trigger download */
      setProgressValue(90);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const filename = `qawmi-database-backup-${new Date().toISOString().split('T')[0]}.json`;
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

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
      addLog(t('adminBackup.logDbFailed', { error: String(err) }), 'error');
      toast({
        title: t('common.error'),
        description: t('adminBackup.dbFailedDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsDbBackup(false);
    }
  }, [addLog, clearLogs, toast, t]);

  /* ---------------------------------------------------------------- */
  /*  Restore Helper: upload files from ZIP to GitHub                  */
  /* ---------------------------------------------------------------- */

  const uploadFilesFromZip = useCallback(
    async (zip: JSZip) => {
      const githubConfig = await getGithubConfig();
      if (!githubConfig) {
        addLog(t('adminBackup.logGithubSkip'), 'warning');
        return {};
      }

      const fileEntries: [string, string][] = [];
      zip.forEach((relativePath, file) => {
        if (relativePath.startsWith('files/') && !file.dir) {
          fileEntries.push([relativePath, relativePath.replace('files/', '')]);
        }
      });

      const urlMapping: Record<string, string> = {};
      let uploaded = 0;

      for (const [zipPath, originalPath] of fileEntries) {
        const fileData = await zip.file(zipPath)?.async('arraybuffer');
        if (fileData) {
          const fileName = zipPath.split('/').pop() || 'unknown';
          try {
            const newUrl = await uploadToGithub(fileData, fileName, githubConfig);
            urlMapping[`files/${originalPath}`] = newUrl;
            uploaded++;
          } catch {
            addLog(t('adminBackup.logFileUlFailed', { file: fileName }), 'warning');
          }
        }
        setProgressValue(20 + Math.round((uploaded / fileEntries.length) * 40));
      }

      addLog(t('adminBackup.logFilesUlDone', { done: uploaded, total: fileEntries.length }), 'success');
      return urlMapping;
    },
    [addLog, getGithubConfig, t],
  );

  /* ---------------------------------------------------------------- */
  /*  Restore Helper: replace URLs in database data                   */
  /* ---------------------------------------------------------------- */

  const replaceUrlsInData = useCallback(
    (data: unknown, urlMapping: Record<string, string>): unknown => {
      if (data === null || data === undefined) return data;
      if (typeof data === 'string') {
        let result = data;
        for (const [oldPart, newUrl] of Object.entries(urlMapping)) {
          /* Match manifest keys (files/category/filename) inside URL-like strings */
          if (result.includes(oldPart)) {
            /* Try to replace the old full URL that contained this path */
            for (const key of Object.keys(urlMapping)) {
              result = result.split(key).join(urlMapping[key]);
            }
          }
        }
        return result;
      }
      if (Array.isArray(data)) {
        return data.map((item) => replaceUrlsInData(item, urlMapping));
      }
      if (typeof data === 'object') {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
          result[key] = replaceUrlsInData(value, urlMapping);
        }
        return result;
      }
      return data;
    },
    [],
  );

  /* ---------------------------------------------------------------- */
  /*  3. Restore (ZIP or JSON)                                        */
  /* ---------------------------------------------------------------- */

  const handleRestore = useCallback(async () => {
    if (!restoreFile) return;
    setIsRestoring(true);
    clearLogs();
    addLog(t('adminBackup.logRestoreStart'), 'info');

    try {
      const fileName = restoreFile.name.toLowerCase();

      if (fileName.endsWith('.json')) {
        /* ---------- JSON Restore ---------- */
        addLog(t('adminBackup.logJsonParsing'), 'info');
        const text = await restoreFile.text();
        const data = JSON.parse(text);

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

        const paths = BACKUP_PATHS.filter((p) => data[p] !== undefined);
        addLog(t('adminBackup.logPathsToRestore', { count: paths.length }), 'info');

        for (let i = 0; i < paths.length; i++) {
          const path = paths[i];
          try {
            await dbSet(path, data[path]);
            addLog(t('adminBackup.logPathRestored', { path, index: i + 1, total: paths.length }), 'success');
          } catch (err) {
            addLog(t('adminBackup.logPathRestoreFailed', { path, error: String(err) }), 'error');
          }
          setProgressValue(Math.round(((i + 1) / paths.length) * 100));
        }

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

        /* Read manifest.json if exists */
        let manifest: Record<string, string> = {};
        const manifestFile = zip.file('manifest.json');
        if (manifestFile) {
          const manifestText = await manifestFile.async('text');
          manifest = JSON.parse(manifestText);
          addLog(t('adminBackup.logManifestFound'), 'info');
        } else {
          addLog(t('adminBackup.logManifestMissing'), 'warning');
        }

        /* Count files in ZIP */
        let zipFileCount = 0;
        zip.forEach((path) => {
          if (path.startsWith('files/') && !path.endsWith('/')) zipFileCount++;
        });
        addLog(t('adminBackup.logZipFiles', { count: zipFileCount }), 'info');

        /* Read database.json */
        setProgressValue(10);
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
        const dbData = JSON.parse(dbText);
        addLog(t('adminBackup.logDbRecords', { count: countNodes(dbData) }), 'info');

        /* Upload files to GitHub */
        setProgressValue(15);
        const urlMapping = await uploadFilesFromZip(zip);

        /* Replace URLs in database data */
        setProgressValue(65);
        addLog(t('adminBackup.logUrlReplacing'), 'info');
        const updatedData = replaceUrlsInData(dbData, urlMapping) as Record<string, unknown>;

        /* Restore each database path */
        setProgressValue(70);
        const paths = BACKUP_PATHS.filter((p) => updatedData[p] !== undefined);
        addLog(t('adminBackup.logPathsToRestore2', { count: paths.length }), 'info');

        for (let i = 0; i < paths.length; i++) {
          const path = paths[i];
          try {
            await dbSet(path, updatedData[path]);
            addLog(t('adminBackup.logPathRestored', { path, index: i + 1, total: paths.length }), 'success');
          } catch (err) {
            addLog(t('adminBackup.logPathRestoreFailed', { path, error: String(err) }), 'error');
          }
          setProgressValue(70 + Math.round(((i + 1) / paths.length) * 30));
        }

        setStats({
          recordCount: countNodes(updatedData),
          fileCount: Object.keys(urlMapping).length,
          totalSize: arrayBuffer.byteLength,
        });
        addLog(t('adminBackup.logZipRestoreDone', { paths: paths.length, files: Object.keys(urlMapping).length }), 'success');
        toast({
          title: t('adminBackup.restoreDoneTitle'),
          description: t('adminBackup.restoreDoneDescZip', { count: paths.length, files: Object.keys(urlMapping).length }),
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
      addLog(t('adminBackup.logRestoreFailed', { error: String(err) }), 'error');
      toast({
        title: t('common.error'),
        description: t('adminBackup.restoreFailedDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsRestoring(false);
    }
  }, [restoreFile, addLog, clearLogs, uploadFilesFromZip, replaceUrlsInData, toast, t, locale]);

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
        const data = JSON.parse(text);
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
        const dbData = dbFile ? JSON.parse(await dbFile.async('text')) : {};
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
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  const isBusy = isFullBackup || isDbBackup || isRestoring;

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
      <Card className="shadow-sm border-yellow-200 bg-yellow-50">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="size-5 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-800">{t('adminBackup.warningTitle')}</p>
            <p className="text-sm text-yellow-700 mt-1">
              {t('adminBackup.warningText')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* Action Cards Grid                                             */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Full Backup (ZIP) */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-islamic-dark">
              <Archive className="size-5" />
              {t('adminBackup.fullTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t('adminBackup.fullDesc')}
            </p>
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
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-islamic-dark">
              <FileJson className="size-5" />
              {t('adminBackup.dbTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t('adminBackup.dbDesc')}
            </p>
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
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-islamic-dark">
              <RotateCcw className="size-5" />
              {t('adminBackup.restoreTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t('adminBackup.restoreDesc')}
            </p>
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
              <Upload className="size-4" />
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
            <CardTitle className="text-base flex items-center gap-2 text-islamic-dark">
              {isBusy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4 text-green-600" />
              )}
              {t('adminBackup.progressLog')}
              {isBusy && (
                <Badge variant="secondary" className="text-[10px] ml-auto">
                  {t('adminBackup.inProgress')}
                </Badge>
              )}
              {!isBusy && logs.length > 0 && (
                <Badge className="text-[10px] ml-auto bg-green-100 text-green-700 border-green-200">
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

            {/* Scrollable Logs */}
            <div className="max-h-96 overflow-y-auto rounded-lg border bg-muted/30 p-2 space-y-1">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-2 text-xs py-1 px-2 rounded"
                >
                  {log.type === 'success' && (
                    <CheckCircle2 className="size-3.5 text-green-600 shrink-0 mt-0.5" />
                  )}
                  {log.type === 'error' && (
                    <XCircle className="size-3.5 text-red-600 shrink-0 mt-0.5" />
                  )}
                  {log.type === 'warning' && (
                    <AlertTriangle className="size-3.5 text-yellow-600 shrink-0 mt-0.5" />
                  )}
                  {log.type === 'info' && (
                    <Info className="size-3.5 text-blue-600 shrink-0 mt-0.5" />
                  )}
                  <span
                    className={
                      log.type === 'success'
                        ? 'text-green-700'
                        : log.type === 'error'
                          ? 'text-red-700'
                          : log.type === 'warning'
                            ? 'text-yellow-700'
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
              <div className="p-2 rounded-lg bg-emerald-100">
                <Database className="size-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-islamic-dark">{stats.recordCount.toLocaleString(locale)}</p>
                <p className="text-xs text-muted-foreground">{t('adminBackup.statRecords')}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <FolderOpen className="size-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-islamic-dark">{stats.fileCount.toLocaleString(locale)}</p>
                <p className="text-xs text-muted-foreground">{t('adminBackup.statFiles')}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <HardDrive className="size-5 text-orange-600" />
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
      {/* Info Card                                                     */}
      {/* ============================================================ */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="size-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-2">
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
                  {t('adminBackup.totalPathsLabel')} <strong>{t('adminBackup.pathsCount', { count: BACKUP_PATHS.length })}</strong> — config, notices, departments,
                  teachers, students, exams, results, blogs, gallery, admission, donations, events,
                  contactMessages, admissionApplications, activityLogs, payments, hifzRecords, onlineExams,
                  examSubmissions, attendance, libraryBooks, libraryIssues, calendarEvents, feeConfigs,
                  feePayments, alumni, hadithDuas, expenses, expenseCategories, salaryRecords,
                  donationSubscriptions, vouchers, hostelRooms, hostelAllocations, hostelMeals, dawahPrograms,
                  dawahJamats, studyMaterials, adminRoles, adminUsers.
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
              <AlertTriangle className="size-5 text-yellow-600" />
              {t('adminBackup.dialogTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-1">
                <p className="text-sm">
                  {t('adminBackup.dialogDesc')}
                </p>

                {/* File Info */}
                {restorePreview && (
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
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
                <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <AlertTriangle className="size-4 text-yellow-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-800">
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
    </div>
  );
}
