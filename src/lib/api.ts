import { useAppStore } from '@/store/app';

/**
 * Authenticated fetch wrapper - automatically adds Authorization header
 * from the Zustand store (localStorage-persisted token).
 */
export async function authFetch(url: string, options: RequestInit = {}) {
  const token = useAppStore.getState().token;
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(url, { ...options, headers });
}
