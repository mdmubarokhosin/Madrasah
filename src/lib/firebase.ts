import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';
import { getAuth, signInAnonymously, onAuthStateChanged, type Auth } from 'firebase/auth';

// Firebase config with safe defaults for build time
// During build, env vars may not be set - this is fine as Firebase is only used client-side
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// Lazy initialization - only create Firebase instances when needed and in browser
let _app: FirebaseApp | null = null;
let _db: Database | null = null;
let _auth: Auth | null = null;

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
    console.error('Anonymous sign-in failed:', error);
  }
}

export { onAuthStateChanged };
