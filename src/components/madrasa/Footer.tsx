'use client';

import { Phone, Mail, MapPin, Facebook, Youtube, MessageCircle, Heart } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { loc } from '@/lib/multilingual';
import { navigateTo } from '@/lib/navigate';
import { LanguageSwitcher } from './Header';
import type { PublicPage } from '@/types/database';

export { LanguageSwitcher };

const quickLinks: { labelKey: string; page: PublicPage }[] = [
  { labelKey: 'nav.home', page: 'home' },
  { labelKey: 'nav.about', page: 'about' },
  { labelKey: 'nav.departments', page: 'departments' },
  { labelKey: 'nav.teachers', page: 'teachers' },
  { labelKey: 'nav.admission', page: 'admission' },
  { labelKey: 'nav.notices', page: 'notices' },
  { labelKey: 'nav.events', page: 'events' },
  { labelKey: 'nav.gallery', page: 'gallery' },
  { labelKey: 'nav.contact', page: 'contact' },
];

const usefulLinks: { labelKey: string; page: PublicPage }[] = [
  { labelKey: 'nav.results', page: 'results' },
  { labelKey: 'nav.donation', page: 'donation' },
  { labelKey: 'nav.blog', page: 'blog' },
  { labelKey: 'nav.syllabus', page: 'syllabus' },
  { labelKey: 'nav.classRoutine', page: 'classRoutine' },
];

export default function Footer() {
  const { siteInfo } = useAppStore();
  const { t, language } = useTranslation();

  // Site name per selected language — Firebase only, no hardcoded fallback
  const siteName =
    language === 'ar'
      ? siteInfo?.nameAr || siteInfo?.name
      : language === 'en'
        ? siteInfo?.nameEn || siteInfo?.name
        : siteInfo?.name;
  const siteNameAr = siteInfo?.nameAr || siteName;
  const aboutText = loc(language, siteInfo, 'aboutText');

  const handleNavClick = (page: PublicPage) => {
    navigateTo('public', page);
  };

  const handleSocialClick = (url: string | undefined) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const footerLinkClass =
    'group inline-flex items-center gap-0 text-white/65 hover:text-gold-soft text-sm transition-colors duration-300 text-left';

  return (
    <footer className="geo-dark text-white relative mt-auto pb-[calc(4.25rem+env(safe-area-inset-bottom,0px))] lg:pb-0" role="contentinfo">
      {/* Top cinematic flow line */}
      <div className="gold-flow-line" aria-hidden="true" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-16 pb-8">
        {/* Brand row */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 pb-10 border-b border-white/8">
          <div className="max-w-xl">
            <button onClick={() => handleNavClick('home')} className="flex items-center gap-3.5 mb-4 group text-left">
              <div className="rounded-2xl bg-white/8 ring-1 ring-white/15 p-1.5 transition-transform duration-500 group-hover:rotate-6">
                <img
                  src={siteInfo?.logoUrl || '/logo.png'}
                  alt={siteName || 'Logo'}
                  className="w-12 h-12 md:w-14 md:h-14 object-contain"
                />
              </div>
              <div>
                <h3 className="font-black text-base sm:text-lg leading-tight text-white">{siteName || t('common.appName')}</h3>
                <p className="text-gold-gradient gold-shimmer-slow text-sm font-serif" dir="rtl" lang="ar">
                  {siteNameAr}
                </p>
              </div>
            </button>
            {aboutText && (
              <p className="text-white/60 text-sm leading-relaxed line-clamp-3">{aboutText}</p>
            )}
          </div>

          {/* Socials + language */}
          <div className="flex flex-col items-start md:items-end gap-4">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => handleSocialClick(siteInfo?.facebook)}
                className={`w-10 h-10 rounded-xl bg-white/8 ring-1 ring-white/12 flex items-center justify-center transition-all duration-300 hover:bg-accent hover:ring-transparent hover:-translate-y-1 ${!siteInfo?.facebook ? 'opacity-40 cursor-default hover:bg-white/8 hover:ring-white/12 hover:translate-y-0' : 'cursor-pointer'}`}
                aria-label={t('footer.facebook')}
                aria-disabled={!siteInfo?.facebook ? 'true' : undefined}
              >
                <Facebook className="w-4 h-4 text-white/80" />
              </button>
              <button
                onClick={() => handleSocialClick(siteInfo?.youtube)}
                className={`w-10 h-10 rounded-xl bg-white/8 ring-1 ring-white/12 flex items-center justify-center transition-all duration-300 hover:bg-danger hover:ring-transparent hover:-translate-y-1 ${!siteInfo?.youtube ? 'opacity-40 cursor-default hover:bg-white/8 hover:ring-white/12 hover:translate-y-0' : 'cursor-pointer'}`}
                aria-label={t('footer.youtube')}
                aria-disabled={!siteInfo?.youtube ? 'true' : undefined}
              >
                <Youtube className="w-4 h-4 text-white/80" />
              </button>
              <button
                onClick={() => handleSocialClick(siteInfo?.whatsapp)}
                className={`w-10 h-10 rounded-xl bg-white/8 ring-1 ring-white/12 flex items-center justify-center transition-all duration-300 hover:bg-success hover:ring-transparent hover:-translate-y-1 ${!siteInfo?.whatsapp ? 'opacity-40 cursor-default hover:bg-white/8 hover:ring-white/12 hover:translate-y-0' : 'cursor-pointer'}`}
                aria-label={t('footer.whatsapp')}
                aria-disabled={!siteInfo?.whatsapp ? 'true' : undefined}
              >
                <MessageCircle className="w-4 h-4 text-white/80" />
              </button>
            </div>
            <div className="opacity-90">
              <LanguageSwitcher onDark />
            </div>
          </div>
        </div>

        {/* Link columns — hidden on mobile: the bottom app bar + drawer cover
            navigation on phones (native-app behavior); contact stays visible */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 py-8 md:py-10">
          <nav aria-label={t('footer.quickLinks')} className="hidden lg:block">
            <h4 className="text-gold-soft text-[11px] font-bold uppercase tracking-[0.22em] mb-5">{t('footer.quickLinks')}</h4>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.labelKey}>
                  <button onClick={() => handleNavClick(link.page)} className={footerLinkClass}>
                    <span className="w-0 overflow-hidden transition-all duration-300 group-hover:w-1.5 group-hover:me-1.5">
                      <span className="block w-1.5 h-1.5 rounded-full bg-gold-bright" />
                    </span>
                    {t(link.labelKey)}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={t('footer.usefulLinks')} className="hidden lg:block">
            <h4 className="text-gold-soft text-[11px] font-bold uppercase tracking-[0.22em] mb-5">{t('footer.usefulLinks')}</h4>
            <ul className="space-y-2.5">
              {usefulLinks.map((link) => (
                <li key={link.labelKey}>
                  <button onClick={() => handleNavClick(link.page)} className={footerLinkClass}>
                    <span className="w-0 overflow-hidden transition-all duration-300 group-hover:w-1.5 group-hover:me-1.5">
                      <span className="block w-1.5 h-1.5 rounded-full bg-gold-bright" />
                    </span>
                    {t(link.labelKey)}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h4 className="text-gold-soft text-[11px] font-bold uppercase tracking-[0.22em] mb-5">{t('footer.contactInfo')}</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-white/65">
                <span className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-white/8 ring-1 ring-white/12 flex items-center justify-center">
                  <MapPin className="w-3.5 h-3.5 text-gold-soft" />
                </span>
                <span className="leading-relaxed">{siteInfo?.address || t('contact.notSet')}</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-white/65">
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/8 ring-1 ring-white/12 flex items-center justify-center">
                  <Phone className="w-3.5 h-3.5 text-gold-soft" />
                </span>
                <a href={`tel:${siteInfo?.phone || ''}`} className="hover:text-gold-soft transition-colors" dir={language === 'ar' ? 'ltr' : undefined}>{siteInfo?.phone || t('contact.notSet')}</a>
              </li>
              <li className="flex items-center gap-3 text-sm text-white/65">
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/8 ring-1 ring-white/12 flex items-center justify-center">
                  <Mail className="w-3.5 h-3.5 text-gold-soft" />
                </span>
                <a href={`mailto:${siteInfo?.email || ''}`} className="break-all hover:text-gold-soft transition-colors">{siteInfo?.email || t('contact.notSet')}</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="hairline-gold" aria-hidden="true" />

        {/* Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6">
          <p className="text-xs sm:text-sm text-white/55">
            © {new Date().getFullYear()} {siteName || t('common.appName')}। {t('footer.rights')}
          </p>
          <p className="text-xs sm:text-sm text-white/55 flex items-center gap-1.5">
            {t('footer.madeWith')} <Heart className="w-3 h-3 text-gold-bright fill-gold-bright" aria-hidden="true" />
          </p>
        </div>
      </div>

      {/* Decorative bottom arch glow */}
      <div className="geo-decor pointer-events-none absolute -bottom-24 left-1/2 -translate-x-1/2 w-[42rem] h-24 rounded-[100%] bg-gold-bright/8 blur-2xl" aria-hidden="true" />

      {/* Scroll to Top is handled by BackToTop component in individual pages */}
    </footer>
  );
}
