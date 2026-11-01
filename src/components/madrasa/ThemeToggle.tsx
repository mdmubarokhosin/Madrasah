'use client';

// ============ Theme Toggle (Light / Dark) ============
// Two visual variants:
//  - "segment": two-pill segmented control (drawer, next to language switcher)
//  - "icon"  : compact icon button (desktop header / admin bar)
// State syncs across every mounted instance via the madrasa:theme-change
// event dispatched by applyTheme() in src/lib/theme.ts (external store
// pattern with useSyncExternalStore — no hydration mismatch, no cascades).

import { useCallback, useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTranslation } from '@/lib/i18n-context';
import { applyTheme, getStoredTheme, type Theme } from '@/lib/theme';

const THEME_EVENT = 'madrasa:theme-change';

function subscribe(callback: () => void) {
  window.addEventListener(THEME_EVENT, callback);
  // Cross-tab sync
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(THEME_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

export default function ThemeToggle({
  variant = 'icon',
  onDark = false,
}: {
  variant?: 'icon' | 'segment';
  /** icon variant sits on a dark surface (hero / deep teal) */
  onDark?: boolean;
}) {
  const { t } = useTranslation();
  const theme = useSyncExternalStore(subscribe, getStoredTheme, () => 'light' as Theme);

  const toggle = useCallback((next: Theme) => applyTheme(next), []);

  if (variant === 'segment') {
    return (
      <div
        role="radiogroup"
        aria-label={t('theme.toggle')}
        className="flex w-full items-center gap-1 rounded-2xl bg-white/[0.05] p-1 ring-1 ring-white/10"
      >
        {(['light', 'dark'] as const).map((mode) => {
          const active = theme === mode;
          const Icon = mode === 'light' ? Sun : Moon;
          return (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => toggle(mode)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition-all duration-300 cursor-pointer ${
                active
                  ? 'bg-gold-soft/15 text-gold-bright ring-1 ring-gold-soft/30 shadow-sm'
                  : 'text-white/55 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <Icon className="size-4" aria-hidden="true" />
              {mode === 'light' ? t('theme.light') : t('theme.dark')}
            </button>
          );
        })}
      </div>
    );
  }

  const isDark = theme === 'dark';
  const Icon = isDark ? Sun : Moon;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? t('theme.light') : t('theme.dark')}
      title={isDark ? t('theme.light') : t('theme.dark')}
      onClick={() => toggle(isDark ? 'light' : 'dark')}
      className={`grid size-9 place-items-center rounded-xl transition-all duration-300 cursor-pointer ${
        onDark
          ? 'bg-white/10 text-gold-soft ring-1 ring-white/15 hover:bg-white/20'
          : 'bg-islamic-lighter/70 text-islamic-dark ring-1 ring-islamic/15 hover:bg-islamic-lighter dark:bg-white/10 dark:text-gold-soft dark:ring-white/15'
      }`}
    >
      <Icon className="size-[18px]" aria-hidden="true" />
    </button>
  );
}
