'use client';

import { Phone, Mail, MapPin, Facebook, Youtube, MessageCircle, Heart } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
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
  const { siteInfo, setPublicPage } = useAppStore();
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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSocialClick = (url: string | undefined) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <footer className="bg-islamic-dark text-white relative">
      {/* Decorative top border */}
      <div className="h-1 bg-gradient-to-r from-golden via-islamic to-golden" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Madrasa Info */}
          <div className="sm:col-span-2 lg:col-span-1">
            <button
              onClick={() => handleNavClick('home')}
              className="flex items-center gap-3 mb-4 group"
            >
              <img
                src="/logo.png"
                alt={siteName || 'Logo'}
                className="w-12 h-12 object-contain"
              />
              <div>
                <h3 className="font-bold text-sm sm:text-base leading-tight">{siteName || t('common.appName')}</h3>
                <p className="text-golden text-xs font-serif" dir="rtl">
                  {siteNameAr}
                </p>
              </div>
            </button>
            <p className="text-white/70 text-sm leading-relaxed mb-4">
              {aboutText}
            </p>
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => handleSocialClick(siteInfo?.facebook)}
                className={`w-9 h-9 rounded-full bg-white/10 hover:bg-blue-600 text-white/70 hover:text-white flex items-center justify-center transition-all ${!siteInfo?.facebook ? 'opacity-40 cursor-default' : 'cursor-pointer'}`}
                aria-label={t('footer.facebook')}
                aria-disabled={!siteInfo?.facebook ? 'true' : undefined}
              >
                <Facebook className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleSocialClick(siteInfo?.youtube)}
                className={`w-9 h-9 rounded-full bg-white/10 hover:bg-red-600 text-white/70 hover:text-white flex items-center justify-center transition-all ${!siteInfo?.youtube ? 'opacity-40 cursor-default' : 'cursor-pointer'}`}
                aria-label={t('footer.youtube')}
                aria-disabled={!siteInfo?.youtube ? 'true' : undefined}
              >
                <Youtube className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleSocialClick(siteInfo?.whatsapp)}
                className={`w-9 h-9 rounded-full bg-white/10 hover:bg-green-600 text-white/70 hover:text-white flex items-center justify-center transition-all ${!siteInfo?.whatsapp ? 'opacity-40 cursor-default' : 'cursor-pointer'}`}
                aria-label={t('footer.whatsapp')}
                aria-disabled={!siteInfo?.whatsapp ? 'true' : undefined}
              >
                <MessageCircle className="w-4 h-4" />
              </button>
            </div>
            {/* Language Switcher in Footer */}
            <div className="opacity-80">
              <LanguageSwitcher />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-sm sm:text-base mb-4 text-golden">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.labelKey}>
                  <button
                    onClick={() => handleNavClick(link.page)}
                    className="text-white/70 hover:text-white text-sm transition-colors ltr:hover:translate-x-1 rtl:hover:-translate-x-1 inline-block"
                  >
                    {t(link.labelKey)}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Useful Links */}
          <div>
            <h4 className="font-semibold text-sm sm:text-base mb-4 text-golden">{t('footer.usefulLinks')}</h4>
            <ul className="space-y-2">
              {usefulLinks.map((link) => (
                <li key={link.labelKey}>
                  <button
                    onClick={() => handleNavClick(link.page)}
                    className="text-white/70 hover:text-white text-sm transition-colors ltr:hover:translate-x-1 rtl:hover:-translate-x-1 inline-block"
                  >
                    {t(link.labelKey)}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-sm sm:text-base mb-4 text-golden">{t('footer.contactInfo')}</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-white/70">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-golden" />
                <span>{siteInfo?.address || t('contact.notSet')}</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-white/70">
                <Phone className="w-4 h-4 flex-shrink-0 text-golden" />
                <span>{siteInfo?.phone || t('contact.notSet')}</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-white/70">
                <Mail className="w-4 h-4 flex-shrink-0 text-golden" />
                <span>{siteInfo?.email || t('contact.notSet')}</span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="bg-white/10 my-8" />

        {/* Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/50">
            © {new Date().getFullYear()} {siteName || t('common.appName')}। {t('footer.rights')}
          </p>
          <p className="text-sm text-white/50 flex items-center gap-1">
            {t('footer.madeWith')} <Heart className="w-3 h-3 text-red-400 fill-red-400" />
          </p>
        </div>
      </div>

      {/* Scroll to Top is handled by BackToTop component in individual pages */}
    </footer>
  );
}
