'use client';

import { createContext, useContext, useCallback, useEffect, ReactNode } from 'react';
import { useAppStore } from '@/store/app-store';
import { type Language, t as translate, interpolate, LANGUAGE_NAMES } from '@/lib/i18n';

interface I18nContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  dir: 'ltr' | 'rtl';
  isRTL: boolean;
  languageNames: typeof LANGUAGE_NAMES;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const { language, setLanguage: storeSetLanguage } = useAppStore();

  const setLanguage = useCallback((lang: Language) => {
    storeSetLanguage(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = LANGUAGE_NAMES[lang].dir;
    localStorage.setItem('preferred-language', lang);
  }, [storeSetLanguage]);

  // Initialize language from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('preferred-language') as Language | null;
    if (saved && (saved === 'bn' || saved === 'en' || saved === 'ar')) {
      setLanguage(saved);
    } else {
      document.documentElement.lang = language;
      document.documentElement.dir = LANGUAGE_NAMES[language].dir;
    }
  }, [language, setLanguage]);

  const dir = LANGUAGE_NAMES[language].dir;
  const isRTL = dir === 'rtl';

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const str = translate(key, language);
      return params ? interpolate(str, params) : str;
    },
    [language]
  );

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, dir, isRTL, languageNames: LANGUAGE_NAMES }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}
