import { db, anonymousSignIn } from './firebase';
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

// Ensure authenticated before any write operation
let authReady: boolean = false;
let authPromise: Promise<void> | null = null;

async function ensureAuth() {
  // If already authenticated and promise resolved, skip
  if (authReady) return;

  // If a sign-in is in progress, wait for it
  if (authPromise) return authPromise;

  // Start a new sign-in attempt
  authPromise = anonymousSignIn()
    .then(() => {
      authReady = true;
    })
    .catch((err) => {
      console.error('Anonymous auth failed, will retry on next operation:', err);
      authPromise = null; // Reset so next call retries
      throw err;
    });

  return authPromise;
}

// ============ Timeout Helper ============

const DB_TIMEOUT_MS = 15000; // 15 seconds

function withTimeout<T>(promise: Promise<T>, ms: number = DB_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Database operation timed out after ${ms}ms`)), ms)
    ),
  ]);
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
  githubConfig: { token: string; owner: string; repo: string; branch: string }
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
  githubConfig: { token: string; owner: string; repo: string; branch: string }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const url = await uploadToGithub(reader.result as ArrayBuffer, file.name, githubConfig);
        resolve(url);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsArrayBuffer(file);
  });
}
