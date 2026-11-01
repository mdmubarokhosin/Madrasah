'use client';

import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/i18n-context';

interface PageBannerProps {
  titleKey: string;
  arabicText: string;
  subtitleKey?: string;
}

/* Eight-point star ornament */
function StarOrnament({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} aria-hidden="true">
      <path d="M50 2 L59 26 L83 17 L74 41 L98 50 L74 59 L83 83 L59 74 L50 98 L41 74 L17 83 L26 59 L2 50 L26 41 L17 17 L41 26 Z" stroke="currentColor" strokeWidth="1" />
      <circle cx="50" cy="50" r="14" stroke="currentColor" strokeWidth="1" />
      <circle cx="50" cy="50" r="5" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

export default function PageBanner({ titleKey, arabicText, subtitleKey }: PageBannerProps) {
  const { t } = useTranslation();

  return (
    <div className="relative bg-night overflow-hidden">
      {/* Cinematic accent scene — pure HeroUI blue gradient (never black) */}
      <div className="absolute inset-0 bg-gradient-to-br from-night via-emerald-deep to-night-2" aria-hidden="true" />
      {/* Light geometric dot weave */}
      <div
        className="absolute inset-0 opacity-[0.3]"
        aria-hidden="true"
        style={{
          backgroundImage: 'radial-gradient(color-mix(in oklab, var(--snow) 45%, transparent) 0.5px, transparent 0.5px)',
          backgroundSize: '22px 22px',
        }}
      />
      {/* Layered scrims keep text readable over the film */}
      <div className="absolute inset-0 bg-gradient-to-b from-night/85 via-night/55 to-night/85" aria-hidden="true" />
      <div className="absolute inset-0 islamic-pattern-overlay opacity-[0.05]" aria-hidden="true" />

      {/* Floating ornaments */}
      <StarOrnament className="animate-spin-slow absolute -top-10 end-[6%] w-32 h-32 md:w-48 md:h-48 text-gold-soft/12" aria-hidden="true" />
      <div className="animate-breathe absolute -bottom-16 -start-16 w-56 h-56 rounded-full bg-gold-bright/8 blur-3xl" aria-hidden="true" />
      <div className="absolute -top-20 -right-24 w-72 h-72 rounded-full bg-islamic/20 blur-3xl" aria-hidden="true" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 md:pt-36 pb-14 sm:pb-16 md:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          {/* Arabic eyebrow */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="text-gold-soft text-lg sm:text-xl md:text-2xl font-serif mb-3.5"
            dir="rtl"
            lang="ar"
          >
            {arabicText}
          </motion.p>

          {/* Title — display scale with cream gradient */}
          <h1 className="text-[1.75rem] leading-tight sm:text-4xl md:text-5xl font-black text-cream-gradient mb-4 sm:mb-5 tracking-tight">
            {t(titleKey)}
          </h1>

          {/* Subtitle */}
          {subtitleKey && (
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="text-white/70 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed"
            >
              {t(subtitleKey)}
            </motion.p>
          )}

          {/* Ornamental divider */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-7 flex items-center justify-center gap-2.5"
            aria-hidden="true"
          >
            <div className="w-14 sm:w-20 h-px bg-gradient-to-r from-transparent to-gold-bright/70" />
            <StarOrnament className="w-4 h-4 text-gold-bright" />
            <div className="w-14 sm:w-20 h-px bg-gradient-to-l from-transparent to-gold-bright/70" />
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom cinematic edge */}
      <div className="gold-flow-line" aria-hidden="true" />
    </div>
  );
}
