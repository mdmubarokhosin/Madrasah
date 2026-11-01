'use client';

// ============ Light / Dark Theme System ============
// Class-based (.dark on <html>), persisted in localStorage.
// The pre-paint script in layout.tsx applies the saved theme before
// hydration so there is never a flash of the wrong theme.

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'madrasa-theme';

/** Read the saved theme synchronously (browser only). Defaults to light. */
export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

/** Apply the theme class to <html> and persist the choice. */
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
  // Keep the browser UI (PWA status bar) in sync with the site theme.
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0b1120' : '#134e4a');
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* private mode — theme still applies for this session */
  }
  // Sync every mounted ThemeToggle (header + drawer + admin) in one tick.
  window.dispatchEvent(new CustomEvent<Theme>('madrasa:theme-change', { detail: theme }));
}
