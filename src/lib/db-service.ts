import { db, anonymousSignIn, getAuthInstance } from './firebase';
import {
  ref,
  set,
  get,
  push,
  update,
  remove,
  onValue,
  DataSnapshot,
} from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';

// Ensure authenticated before any write operation
let authReady: boolean = false;
let authPromise: Promise<void> | null = null;
// HARDENING: set when Anonymous Auth is disabled in the Firebase console
// ('auth/admin-restricted-operation'). Once known-unavailable, ensureAuth()
// returns immediately instead of retrying (and re-logging the same console
// debug noise) on every single write attempt. Cleared again whenever ANY user
// successfully signs in (see the onAuthStateChanged handler below).
let anonymousAuthUnavailable = false;

async function ensureAuth() {
  // If already authenticated and promise resolved, skip
  if (authReady) return;

  // Anonymous provider is known to be disabled — do not retry per call
  if (anonymousAuthUnavailable) return;

  // If a sign-in is in progress, wait for it
  if (authPromise) return authPromise;

  // Start a new sign-in attempt
  authPromise = anonymousSignIn()
    .then(() => {
      authReady = true;
    })
    .catch((err) => {
      // console.debug (NOT console.error) — expected when Anonymous Auth is
      // disabled in the Firebase console; a console.error would raise the
      // Next.js dev "Issue" badge (no error/progress UI is ever shown).
      if ((err as { code?: string })?.code === 'auth/admin-restricted-operation') {
        anonymousAuthUnavailable = true;
      }
      console.debug('Anonymous auth skipped (writes still allowed by RTDB rules):', err instanceof Error ? err.message : err);
      authPromise = null; // Reset so next call retries
      throw err;
    });

  return authPromise;
}

// ============ Global auth-state tracking ============
// Keep `authReady` truthful across the whole auth lifecycle: it must turn true
// whenever ANY user (anonymous or admin) is signed in and false again when the
// user signs out (adminLogout) — otherwise ensureAuth() would believe writes
// are still allowed after sign-out and never retry anonymous sign-in.
// Browser only, never throws, no top-level await.
if (typeof window !== 'undefined') {
  try {
    onAuthStateChanged(getAuthInstance(), (user) => {
      if (user) {
        authReady = true;
        // Any successful sign-in (admin or anonymous) proves the Auth provider
        // works — re-enable ensureAuth() retries in case anonymous auth was
        // enabled in the console since the last failed attempt.
        anonymousAuthUnavailable = false;
      } else {
        authReady = false;
        // Drop any cached sign-in promise so the next ensureAuth() call
        // retries anonymousSignIn() instead of assuming it already ran.
        authPromise = null;
      }
    });
  } catch (err) {
    console.debug('Auth state listener unavailable:', err instanceof Error ? err.message : err);
  }
}

// ============ Timeout Helper ============

const DB_TIMEOUT_MS = 15000; // 15 seconds

function withTimeout<T>(promise: Promise<T>, ms: number = DB_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Database operation timed out after ${ms}ms`)), ms);
  });
  // Clear the orphan timer as soon as the underlying promise settles so the
  // timeout handle doesn't linger for the full duration after success.
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

// ============ Generic CRUD Helpers ============

export async function dbGet<T>(path: string): Promise<T | null> {
  const snapshot = await withTimeout(get(ref(db, path)));
  return snapshot.exists() ? snapshot.val() : null;
}

export async function dbSet(path: string, data: unknown): Promise<void> {
  await ensureAuth();
  await withTimeout(set(ref(db, path), data));
}

export async function dbPush(path: string, data: unknown): Promise<string> {
  await ensureAuth();
  const newRef = push(ref(db, path));
  await withTimeout(set(newRef, data));
  return newRef.key || '';
}

export async function dbUpdate(path: string, data: Record<string, unknown>): Promise<void> {
  await ensureAuth();
  await withTimeout(update(ref(db, path), data));
}

export async function dbRemove(path: string): Promise<void> {
  await ensureAuth();
  await withTimeout(remove(ref(db, path)));
}

export function dbSubscribe(
  path: string,
  callback: (snapshot: DataSnapshot) => void,
  errorCallback?: (error: Error) => void
): () => void {
  const dbRef = ref(db, path);
  const unsubscribe = onValue(
    dbRef,
    callback,
    (error: Error) => {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`DB subscription error at ${path}:`, msg);
      errorCallback?.(error instanceof Error ? error : new Error(msg));
    }
  );
  return unsubscribe;
}

// ============ List Helpers ============

export async function dbGetList<T>(path: string): Promise<T[]> {
  const data = await dbGet<Record<string, T>>(path);
  if (!data) return [];
  return Object.entries(data).map(([id, item]) => ({ ...item, id } as T & { id: string }));
}

export async function dbGetOrdered<T extends { order?: number }>(path: string): Promise<T[]> {
  const list = await dbGetList<T>(path);
  return list.sort((a, b) => (a.order || 0) - (b.order || 0));
}

// ============ Upload helpers ============

function arrayBufferToBase64(buffer: ArrayBuffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([buffer]);
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.split(',')[1]);
    };
    reader.onerror = () => reject(new Error('Failed to convert to base64'));
    reader.readAsDataURL(blob);
  });
}

export async function uploadToGithub(
  content: string | ArrayBuffer,
  filename: string,
  githubConfig: { token: string; owner: string; repo: string; branch: string },
  options?: { signal?: AbortSignal }
): Promise<string> {
  const path = `uploads/${Date.now()}_${filename}`;
  const contentBase64 = typeof content === 'string'
    ? btoa(unescape(encodeURIComponent(content)))
    : await arrayBufferToBase64(content);

  const response = await fetch(
    `https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `token ${githubConfig.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        message: `Upload ${filename}`,
        content: contentBase64,
        branch: githubConfig.branch,
      }),
      // Abortable: a cancelled upload stops the in-flight request immediately.
      signal: options?.signal,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub upload failed: ${error}`);
  }

  const result = await response.json();
  return result.content.download_url;
}

export async function uploadFileToGithub(
  file: File,
  githubConfig: { token: string; owner: string; repo: string; branch: string },
  options?: { signal?: AbortSignal }
): Promise<string> {
  // Reject before any work (and before reading the file into memory) when the
  // signal has already fired.
  if (options?.signal?.aborted) {
    throw new DOMException('Upload aborted', 'AbortError');
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const onAbort = () => {
      reader.abort();
      reject(new DOMException('Upload aborted', 'AbortError'));
    };
    options?.signal?.addEventListener('abort', onAbort, { once: true });
    const cleanup = () => {
      options?.signal?.removeEventListener('abort', onAbort);
    };
    reader.onload = async () => {
      cleanup();
      try {
        const url = await uploadToGithub(reader.result as ArrayBuffer, file.name, githubConfig, options);
        resolve(url);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => {
      cleanup();
      reject(new Error('File read failed'));
    };
    reader.readAsArrayBuffer(file);
  });
}
