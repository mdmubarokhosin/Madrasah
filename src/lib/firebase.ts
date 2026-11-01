import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';
import { getAuth, signInAnonymously, onAuthStateChanged, type Auth } from 'firebase/auth';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';

// Firebase config with safe defaults for build time
// During build, env vars may not be set - this is fine as Firebase is only used client-side
// Defaults point to the active project (madrasahbd); NEXT_PUBLIC_FIREBASE_* env vars override them.
// Note: Firebase web config values are public client identifiers by design —
// access control is enforced by Realtime Database security rules, not by these values.
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCrX39L0zmXf5CPjMVdU98rKJWPJfGQ46s',
  authDomain: 'madrasahbd.firebaseapp.com',
  databaseURL: 'https://madrasahbd-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'madrasahbd',
  storageBucket: 'madrasahbd.firebasestorage.app',
  messagingSenderId: '519177169756',
  appId: '1:519177169756:web:639a225b6a3a6e273f2f99',
  measurementId: 'G-EQ62T9HF82',
};

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || DEFAULT_FIREBASE_CONFIG.databaseURL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || DEFAULT_FIREBASE_CONFIG.measurementId,
};

// Lazy initialization - only create Firebase instances when needed and in browser
let _app: FirebaseApp | null = null;
let _db: Database | null = null;
let _auth: Auth | null = null;
let _analytics: Analytics | null = null;

function getAppInstance(): FirebaseApp {
  if (!_app) {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      _app = existingApps[0];
    } else if (firebaseConfig.databaseURL) {
      _app = initializeApp(firebaseConfig);
    } else {
      // Provide minimal config for build time - will be re-initialized client-side
      _app = initializeApp({
        apiKey: 'build-time-placeholder',
        authDomain: 'build-time.firebaseapp.com',
        databaseURL: 'https://build-time.firebaseio.com',
        projectId: 'build-time',
      });
    }
  }
  return _app;
}

export const app = getAppInstance();

/**
 * PERFORMANCE: preconnect/dns-prefetch to the RTDB + auth origins as soon as
 * this module loads in the browser — cuts hundreds of ms off the first
 * database round-trip. URLs come from the resolved config (env or default),
 * so a new owner's own Firebase is used automatically (white-label safe).
 */
if (typeof window !== 'undefined' && firebaseConfig.databaseURL) {
  try {
    const dbOrigin = new URL(firebaseConfig.databaseURL).origin;
    const heads: Array<[string, string, boolean]> = [
      ['preconnect', dbOrigin, true],
      ['dns-prefetch', dbOrigin, false],
      ['preconnect', 'https://securetoken.googleapis.com', true],
      ['preconnect', 'https://apis.google.com', false],
    ];
    for (const [rel, href, cors] of heads) {
      const link = document.createElement('link');
      link.rel = rel;
      link.href = href;
      if (cors) link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
  } catch {
    // malformed URL — preconnect is a best-effort optimization only
  }
}

export function getDb(): Database {
  if (!_db) {
    _db = getDatabase(getAppInstance());
  }
  return _db;
}

// Use a getter pattern so db is lazily accessed
export const db: Database = new Proxy({} as Database, {
  get(_target, prop) {
    return (getDb() as any)[prop];
  },
});

export function getAuthInstance(): Auth {
  if (!_auth) {
    _auth = getAuth(getAppInstance());
  }
  return _auth;
}

// Use a getter pattern for auth
export const auth: Auth = new Proxy({} as Auth, {
  get(_target, prop) {
    return (getAuthInstance() as any)[prop];
  },
});

// Initialize Firebase Analytics (browser only, silently skipped where unsupported)
export function initAnalytics(): Analytics | null {
  if (typeof window === 'undefined') return null;
  if (_analytics) return _analytics;
  try {
    isSupported()
      .then((supported) => {
        if (!supported) {
          console.warn('Firebase Analytics is not supported in this browser.');
          return;
        }
        if (!firebaseConfig.measurementId) {
          console.warn('Firebase Analytics measurementId missing. Skipping analytics.');
          return;
        }
        _analytics = getAnalytics(getAppInstance());
      })
      .catch((error) => {
        console.warn('Firebase Analytics init failed:', error);
      });
  } catch (error) {
    console.warn('Firebase Analytics init error:', error);
  }
  return _analytics;
}

// Helper: sign in anonymously (required for RTDB write when rules use auth != null)
export async function anonymousSignIn(): Promise<void> {
  try {
    if (!firebaseConfig.databaseURL) {
      console.warn('Firebase not configured. Skipping anonymous sign-in.');
      return;
    }
    const authInstance = getAuthInstance();
    if (authInstance.currentUser) return;
    await signInAnonymously(authInstance);
  } catch (error) {
    // NOTE: console.debug (NOT console.error) — when Anonymous Authentication
    // is still disabled in the Firebase console this failure is EXPECTED and
    // harmless (writes work via RTDB rules). A console.error would raise the
    // Next.js dev "Issue" badge — the site must never show error/progress UI.
    if (typeof console !== 'undefined' && console.debug) {
      console.debug(
        'Anonymous sign-in skipped (enable Anonymous Auth in Firebase console to use it):',
        error instanceof Error ? error.message : error
      );
    }
  }
}

export { onAuthStateChanged };
