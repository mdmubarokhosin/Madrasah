'use client';

import { motion } from 'framer-motion';
import { GraduationCap, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { loc } from '@/lib/multilingual';
import { navigateTo } from '@/lib/navigate';

export default function Hero() {
  const { siteInfo, setPublicPage } = useAppStore();
  const { t, language } = useTranslation();

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

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="/hero-bg.png"
          alt={t('hero.background')}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-islamic-dark/90 via-islamic-dark/70 to-islamic-dark/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-islamic-dark/60 to-transparent" />
      </div>

      {/* Islamic Pattern Overlay */}
      <div className="absolute inset-0 islamic-pattern-overlay opacity-[0.03]" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        {/* Arabic Bismillah */}
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-golden text-xl sm:text-2xl md:text-3xl font-serif mb-3 md:mb-4"
          dir="rtl"
        >
          {t('hero.bismillah')}
        </motion.p>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-2 sm:mb-3 leading-tight"
        >
          {siteName || t('common.appName')}
        </motion.h1>

        {/* Arabic Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-golden/80 text-base sm:text-lg md:text-xl font-serif mb-3 md:mb-4"
          dir="rtl"
        >
          {siteNameAr}
        </motion.p>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="w-16 sm:w-24 h-[2px] bg-golden mx-auto mb-6"
        />

        {/* Slogan */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-white/90 text-sm sm:text-base md:text-lg mb-8 sm:mb-10 max-w-2xl mx-auto px-2"
        >
          {slogan || loc(language, siteInfo, 'aboutText') || ''}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button
            onClick={() => handleNav('admission')}
            size="lg"
            className="bg-islamic hover:bg-islamic-light text-white px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
          >
            <GraduationCap className="w-5 h-5 mr-2" />
            {t('hero.admissionInfo')}
          </Button>
          <Button
            onClick={() => handleNav('donation')}
            size="lg"
            variant="outline"
            className="bg-golden/20 border-golden text-golden hover:bg-golden/30 px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base rounded-lg font-semibold transition-all w-full sm:w-auto"
          >
            <Heart className="w-5 h-5 mr-2" />
            {t('hero.donate')}
          </Button>
        </motion.div>
      </div>

      {/* Admission Marquee Badge */}
      <motion.div
        initial={{ opacity: 0, x: '100%' }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 1.5 }}
        className="absolute bottom-6 left-0 right-0"
      >
        <div className="bg-golden/90 backdrop-blur-sm text-islamic-dark text-xs sm:text-sm font-semibold py-2 px-4 overflow-hidden">
          <div className="animate-marquee whitespace-nowrap inline-block">
            {t('hero.marquee')}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
