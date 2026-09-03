'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { useTranslation } from '@/lib/i18n-context';

export default function BackToTop() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-islamic text-white shadow-lg hover:bg-islamic-dark transition-all duration-300 flex items-center justify-center cursor-pointer"
      aria-label={t('backToTop.ariaLabel')}
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}
