'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { GraduationCap, Heart, ChevronDown, CalendarDays, Users, BookOpen, Landmark } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { loc } from '@/lib/multilingual';
import { navigateTo } from '@/lib/navigate';
import { HButton } from '@/components/heroui/islamic';

/** Hydration-safe entrance base — the hero scene is pure CSS now, so text
 * enters almost immediately on every view (no film to wait for). */
const INTRO_BASE_DELAY = 0.05;

/* Eight-point Islamic star ornament — pure SVG, decorative */
function StarOrnament({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} aria-hidden="true">
      <path d="M50 2 L59 26 L83 17 L74 41 L98 50 L74 59 L83 83 L59 74 L50 98 L41 74 L17 83 L26 59 L2 50 L26 41 L17 17 L41 26 Z" stroke="currentColor" strokeWidth="1" />
      <circle cx="50" cy="50" r="14" stroke="currentColor" strokeWidth="1" />
      <circle cx="50" cy="50" r="5" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

export default function Hero() {
  const { siteInfo } = useAppStore();
  const { t, language } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);

  /* Hydration-safe entrance choreography — decided after mount so the SSR
   * markup stays deterministic. The scene is CSS-only, so the delay is tiny. */
  const [introBase, setIntroBase] = useState<number | null>(null);
  useEffect(() => {
    queueMicrotask(() => setIntroBase(INTRO_BASE_DELAY));
  }, []);
  const introReady = introBase !== null;
  const d = (base: number) => base + (introBase ?? 0);

  // Scroll choreography — type and scene move together as the film leaves the viewport
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const sceneScale = useTransform(scrollYProgress, [0, 1], [1, 1.18]);
  const sceneY = useTransform(scrollYProgress, [0, 1], ['0%', '22%']);
  const scrimOpacity = useTransform(scrollYProgress, [0, 1], [1, 1.6]);
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '-38%']);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);
  const ornamentY = useTransform(scrollYProgress, [0, 1], ['0%', '-90%']);

  // Site name/slogan per selected language — Firebase only, no hardcoded fallback
  const siteName =
    language === 'ar'
      ? siteInfo?.nameAr || siteInfo?.name
      : language === 'en'
        ? siteInfo?.nameEn || siteInfo?.name
        : siteInfo?.name;
  const siteNameAr = siteInfo?.nameAr || siteName;
  const slogan =
    language === 'ar'
      ? siteInfo?.sloganAr || siteInfo?.slogan
      : language === 'en'
        ? siteInfo?.sloganEn || siteInfo?.slogan
        : siteInfo?.slogan;

  const handleNav = (page: 'admission' | 'donation') => {
    navigateTo('public', page);
  };

  /* Stat strip — only rendered with real DB values (never invented) */
  const stats = [
    { icon: Landmark, value: siteInfo?.established, label: t('about.established') },
    { icon: Users, value: siteInfo?.totalStudents, label: t('about.totalStudents') },
    { icon: GraduationCap, value: siteInfo?.totalTeachers, label: t('about.totalTeachers') },
    { icon: BookOpen, value: siteInfo?.totalDepts, label: t('about.departments') },
  ].filter((s) => s.value && String(s.value).trim() !== '' && String(s.value).trim() !== '—');

  return (
    <section
      id="home"
      ref={sectionRef}
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-night"
    >
      {/* framer-motion's useScroll measures the scroll *container*
          (document.scrollingElement) and warns in dev when it is
          position:static; the hero section itself is already `relative`.
          Root-level `relative` is visually inert but silences the warning. */}
      <style>{`html{position:relative}`}</style>
      {/* Cinematic color scene — pure HeroUI accent gradient (never black).
          Scales and drifts with scroll like the previous film layer. */}
      <motion.div
        style={{ scale: sceneScale, y: sceneY }}
        className="absolute inset-0 bg-gradient-to-br from-night via-emerald-deep to-night-2"
        aria-hidden="true"
      />
      {/* Light geometric dot weave — HeroUI accent-tinted pattern */}
      <div className="absolute inset-0 opacity-[0.35]" aria-hidden="true" style={{
        backgroundImage: 'radial-gradient(color-mix(in oklab, var(--snow) 45%, transparent) 0.5px, transparent 0.5px)',
        backgroundSize: '22px 22px',
      }} />

      {/* Layered scrims for readability */}
      <motion.div
        style={{ opacity: scrimOpacity }}
        className="absolute inset-0 bg-gradient-to-r from-night/95 via-night/75 to-night/40"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-night via-transparent to-night/60" aria-hidden="true" />
      <div className="absolute inset-0 islamic-pattern-overlay opacity-[0.04]" aria-hidden="true" />

      {/* Floating rotating ornaments — depth layer */}
      <motion.div style={{ y: ornamentY }} className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <StarOrnament className="animate-spin-slow absolute -top-8 end-[8%] w-40 h-40 md:w-64 md:h-64 text-gold-soft/15" />
        <StarOrnament className="animate-spin-slow absolute bottom-[18%] start-[4%] w-24 h-24 md:w-40 md:h-40 text-white/8 [animation-direction:reverse]" />
        <div className="animate-breathe absolute top-1/3 start-[12%] w-2 h-2 rounded-full bg-gold-soft/60" />
        <div className="animate-breathe absolute top-2/3 end-[18%] w-1.5 h-1.5 rounded-full bg-gold-soft/50 [animation-delay:1.2s]" />
      </motion.div>

      {/* Content — rises and fades as the scene scales.
          Gated on the intro decision so entrance delays are correct from the
          very first animation frame (fresh opening vs repeat visit). */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 w-full max-w-5xl mx-auto px-4 pt-24 pb-32 sm:px-6 text-center"
      >
        {introReady && (
          <>
        {/* Bismillah — always shown; the accent scene needs no film beat */}
        
          <motion.p
            initial={{ opacity: 0, y: -14, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.9, delay: d(0.15) }}
            className="text-gold-soft text-lg sm:text-2xl md:text-[1.7rem] font-serif mb-4 md:mb-5 tracking-wide"
            dir="rtl"
          >
            {t('hero.bismillah')}
          </motion.p>
        

        {/* Eyebrow line */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.8, delay: d(0.35) }}
          className="flex justify-center mb-5"
        >
          <span className="hairline-gold w-24 sm:w-40" aria-hidden="true" />
        </motion.div>

        {/* Main display title — choreographed scale + blur entrance */}
        <div className="overflow-visible">
          <motion.h1
            initial={{ opacity: 0, y: 34, scale: 0.94, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 1.1, delay: d(0.5), ease: [0.22, 1, 0.36, 1] }}
            className="text-[1.75rem] leading-[1.15] sm:text-4xl md:text-6xl lg:text-[4.25rem] font-black text-cream-gradient mb-3 sm:mb-4 tracking-tight"
          >
            {siteName || t('common.appName')}
          </motion.h1>
        </div>
        {/* Arabic name */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: d(0.75) }}
          className="text-gold-gradient gold-shimmer-slow text-lg sm:text-2xl md:text-3xl font-serif mb-5 md:mb-6"
          dir="rtl"
        >
          {siteNameAr}
        </motion.p>

        {/* Ornamental divider */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: d(0.9) }}
          className="ornament-divider mb-5 md:mb-6"
          aria-hidden="true"
        >
          <StarOrnament className="w-5 h-5 text-gold-bright" />
        </motion.div>

        {/* Slogan */}
        {slogan && (
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: d(1.0) }}
            className="text-white/85 text-sm sm:text-base md:text-lg mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-2"
          >
            {slogan || loc(language, siteInfo, 'aboutText') || ''}
          </motion.p>
        )}

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: d(1.15) }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-5"
        >
          <HButton
            onPress={() => handleNav('admission')}
            size="lg"
            className="btn-on-color rounded-full px-8 py-4 text-sm sm:text-base font-bold min-h-[52px] h-auto w-full sm:w-auto"
          >
            <GraduationCap className="size-5" />
            {t('hero.admissionInfo')}
          </HButton>
          <HButton
            variant="gold"
            onPress={() => handleNav('donation')}
            size="lg"
            className="btn-ghost-on-color rounded-full px-8 py-4 text-sm sm:text-base font-bold min-h-[52px] h-auto w-full sm:w-auto"
          >
            <Heart className="size-5" />
            {t('hero.donate')}
          </HButton>
        </motion.div>

        {/* Stat strip — glass cards over the film */}
        {stats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: d(1.4) }}
            className={`mt-10 sm:mt-14 grid gap-2.5 sm:gap-3 mx-auto max-w-3xl ${
              stats.length >= 4 ? 'grid-cols-2 lg:grid-cols-4' : stats.length === 3 ? 'grid-cols-3' : 'grid-cols-2'
            }`}
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: d(1.5 + i * 0.1) }}
                className="glass-dark rounded-2xl px-3 py-4 sm:px-4"
              >
                <stat.icon className="size-4 sm:size-5 mx-auto mb-1.5 text-gold-soft" aria-hidden="true" />
                <p className="text-base sm:text-xl md:text-2xl font-extrabold text-white leading-none">{stat.value}</p>
                <p className="text-[10px] sm:text-xs text-white/60 mt-1.5 leading-tight">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
          </>
        )}
      </motion.div>

      {/* Scroll cue — icon only (language-neutral) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: d(2), duration: 1 }}
        style={{ opacity: contentOpacity }}
        className="absolute bottom-14 sm:bottom-16 left-1/2 -translate-x-1/2 z-10 hidden sm:flex flex-col items-center gap-1.5 text-white/50"
        aria-hidden="true"
      >
        <span className="w-px h-8 bg-gradient-to-b from-transparent via-white/40 to-white/10" />
        <ChevronDown className="size-4 animate-scroll-cue" />
      </motion.div>

      {/* Admission marquee — seamless gold band */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: d(1.7) }}
        className="absolute bottom-0 left-0 right-0 z-20"
      >
        <div className="relative bg-gradient-to-r from-gold-bright via-gold-soft to-gold-bright text-warning-foreground text-xs sm:text-sm font-bold py-2.5 overflow-hidden">
          <div className="marquee-track gap-16">
            <span className="inline-flex items-center gap-16 pe-16">
              <span>{t('hero.marquee')}</span>
              <span aria-hidden="true">✦</span>
              <span>{t('hero.marquee')}</span>
              <span aria-hidden="true">✦</span>
            </span>
            <span className="inline-flex items-center gap-16 pe-16" aria-hidden="true">
              <span>{t('hero.marquee')}</span>
              <span>✦</span>
              <span>{t('hero.marquee')}</span>
              <span>✦</span>
            </span>
          </div>
        </div>
        <div className="gold-flow-line" aria-hidden="true" />
      </motion.div>
    </section>
  );
}
