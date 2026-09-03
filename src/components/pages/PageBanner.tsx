'use client';

import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/i18n-context';

interface PageBannerProps {
  titleKey: string;
  arabicText: string;
  subtitleKey?: string;
}

export default function PageBanner({ titleKey, arabicText, subtitleKey }: PageBannerProps) {
  const { t } = useTranslation();

  return (
    <div className="relative bg-gradient-to-br from-islamic-dark via-islamic to-islamic-light overflow-hidden">
      {/* Islamic pattern overlay */}
      <div className="absolute inset-0 islamic-pattern-overlay opacity-[0.06]" aria-hidden="true" />
      {/* Decorative circles */}
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-golden/5" aria-hidden="true" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/5" aria-hidden="true" />
      {/* Bottom gold border */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-golden via-golden-light to-golden" aria-hidden="true" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Arabic text */}
          <p className="text-golden text-lg sm:text-xl md:text-2xl font-serif mb-3" dir="rtl" lang="ar">
            {arabicText}
          </p>
          {/* Main title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
            {t(titleKey)}
          </h1>
          {/* Subtitle */}
          {subtitleKey && (
            <p className="text-white/70 text-base md:text-lg max-w-2xl mx-auto">
              {t(subtitleKey)}
            </p>
          )}
          {/* Decorative divider */}
          <div className="mt-6 flex items-center justify-center gap-2" aria-hidden="true">
            <div className="w-16 h-[1px] bg-golden/50" />
            <div className="w-2 h-2 rounded-full bg-golden" />
            <div className="w-16 h-[1px] bg-golden/50" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
