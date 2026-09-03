'use client';

import { useState, useEffect, type ReactNode } from 'react';
import {
  Menu, X, Home, Info, GraduationCap, Users, ClipboardList,
  Bell, CalendarDays, Camera, Heart, MessageCircle, Search,
  BookOpen, Globe, ChevronRight, Star, Sparkles,
  Shield, ArrowRight, ListChecks, Clock, BedDouble, Megaphone, FolderOpen
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { navigateTo } from '@/lib/navigate';
import { type Language, LANGUAGE_NAMES } from '@/lib/i18n';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { PublicPage } from '@/types/database';

/* ============ Navigation Links ============ */
interface NavLink {
  labelKey: string;
  page: PublicPage | 'student' | 'admin';
  icon: ReactNode;
  group: 'main' | 'info' | 'quick';
}

const navLinks: NavLink[] = [
  { labelKey: 'nav.home', page: 'home', icon: <Home className="size-[18px]" />, group: 'main' },
  { labelKey: 'nav.about', page: 'about', icon: <Info className="size-[18px]" />, group: 'main' },
  { labelKey: 'nav.departments', page: 'departments', icon: <GraduationCap className="size-[18px]" />, group: 'main' },
  { labelKey: 'nav.teachers', page: 'teachers', icon: <Users className="size-[18px]" />, group: 'main' },
  { labelKey: 'nav.admission', page: 'admission', icon: <BookOpen className="size-[18px]" />, group: 'info' },
  { labelKey: 'nav.notices', page: 'notices', icon: <Bell className="size-[18px]" />, group: 'info' },
  { labelKey: 'nav.events', page: 'events', icon: <CalendarDays className="size-[18px]" />, group: 'info' },
  { labelKey: 'nav.results', page: 'results', icon: <ClipboardList className="size-[18px]" />, group: 'info' },
  { labelKey: 'nav.gallery', page: 'gallery', icon: <Camera className="size-[18px]" />, group: 'info' },
  { labelKey: 'nav.donation', page: 'donation', icon: <Heart className="size-[18px]" />, group: 'info' },
  { labelKey: 'nav.blog', page: 'blog', icon: <BookOpen className="size-[18px]" />, group: 'info' },
  { labelKey: 'nav.contact', page: 'contact', icon: <MessageCircle className="size-[18px]" />, group: 'info' },
  { labelKey: 'nav.syllabus', page: 'syllabus', icon: <ListChecks className="size-[18px]" />, group: 'info' },
  { labelKey: 'nav.classRoutine', page: 'classRoutine', icon: <Clock className="size-[18px]" />, group: 'info' },
  { labelKey: 'hostel.title', page: 'hostel', icon: <BedDouble className="size-[18px]" />, group: 'quick' },
  { labelKey: 'dawah.title', page: 'dawah', icon: <Megaphone className="size-[18px]" />, group: 'quick' },
  { labelKey: 'materials.title', page: 'materials', icon: <FolderOpen className="size-[18px]" />, group: 'quick' },
];

/* ============ Language Switcher Component ============ */
export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useTranslation();
  const languages: Language[] = ['bn', 'en', 'ar'];

  return (
    <div className={`flex items-center ${compact ? 'gap-1' : 'gap-1.5'}`}>
      <Globe className={`text-islamic ${compact ? 'size-3.5' : 'size-4'} flex-shrink-0`} />
      {languages.map((lang) => (
        <button
          key={lang}
          onClick={() => setLanguage(lang)}
          className={`px-2.5 sm:px-2 py-1.5 sm:py-1 rounded-md text-xs font-medium transition-all duration-200 min-h-[36px] sm:min-h-0 min-w-[36px] sm:min-w-0 flex items-center ${
            compact ? 'text-[10px]' : 'text-xs'
          } ${
            language === lang
              ? 'bg-islamic text-white shadow-sm scale-105'
              : 'text-muted-foreground hover:bg-islamic-lighter/70 hover:text-islamic-dark'
          }`}
          title={LANGUAGE_NAMES[lang].english}
          aria-label={`Switch to ${LANGUAGE_NAMES[lang].english}`}
        >
          {compact ? LANGUAGE_NAMES[lang].native : LANGUAGE_NAMES[lang].native}
        </button>
      ))}
    </div>
  );
}

/* ============ Islamic SVG Pattern ============ */
function IslamicCrescent({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 5C25.1 5 5 25.1 5 50s20.1 45 45 45c8.3 0 16-2.3 22.6-6.2C63.2 93 51.5 87.5 43 78.5c-10-10.5-16-24.5-16-39.5S33 9.5 43 0C43 0 46.5 0 50 5z" fill="currentColor" opacity="0.15" />
      <circle cx="60" cy="35" r="6" fill="currentColor" opacity="0.2" />
      <path d="M10 50 Q50 10 90 50 Q50 90 10 50Z" stroke="currentColor" strokeWidth="0.5" opacity="0.1" fill="none" />
    </svg>
  );
}

/* ============ Drawer Nav Item ============ */
function DrawerNavItem({
  link,
  isActive,
  onClick,
  index,
}: {
  link: NavLink;
  isActive: boolean;
  onClick: (page: PublicPage | 'student' | 'admin') => void;
  index: number;
}) {
  const { t } = useTranslation();

  return (
    <button
      onClick={() => onClick(link.page)}
      className={`
        w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
        transition-all duration-200 group relative overflow-hidden
        ${isActive
          ? 'bg-gradient-to-r from-islamic to-islamic-light text-white shadow-md shadow-islamic/20'
          : 'text-gray-600 hover:text-islamic-dark hover:bg-gradient-to-r hover:from-islamic-lighter/80 hover:to-transparent'
        }
      `}
      style={{ animationDelay: `${index * 50}ms` }}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-golden rounded-r" />
      )}
      <span className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-islamic'}`}>
        {link.icon}
      </span>
      <span className="flex-1 text-left">{t(link.labelKey)}</span>
      {isActive && <ChevronRight className="size-4 opacity-70" />}
    </button>
  );
}

/* ============ Main Header Component ============ */
export default function Header() {
  const { publicPage, setPublicPage, setView, siteInfo } = useAppStore();
  const { t, language, isRTL } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Site name per selected language — comes from Firebase only (no hardcoded fallback)
  const siteName =
    language === 'ar'
      ? siteInfo?.nameAr || siteInfo?.name
      : language === 'en'
        ? siteInfo?.nameEn || siteInfo?.name
        : siteInfo?.name;
  const siteNameAr = siteInfo?.nameAr || siteName;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (page: PublicPage | 'student' | 'admin') => {
    setIsOpen(false);
    if (page === 'admin') {
      navigateTo('admin');
      return;
    }
    if (page === 'student') {
      navigateTo('student');
      return;
    }
    navigateTo('public', page);
  };

  const mediumLinks = navLinks.slice(0, 6); // Show fewer links on medium screens
  const desktopLinks = navLinks.slice(0, 12); // Show more links on desktop

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-background/95 backdrop-blur-lg shadow-lg shadow-islamic/5'
          : 'bg-background/70 backdrop-blur-sm'
      }`}
    >
      {/* Top decorative bar - Islamic pattern */}
      <div className="h-[3px] bg-gradient-to-r from-islamic-dark via-golden via-islamic to-golden relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_3s_linear_infinite] bg-[length:200%_100%]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo + Site Title (responsive, visible on mobile too) */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink group"
          >
            <div className="relative flex-shrink-0">
              <img
                src="/logo.png"
                alt={siteName || 'Logo'}
                className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 object-contain transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-golden rounded-full border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="min-w-0 max-w-[42vw] sm:max-w-[240px] md:max-w-[320px] lg:max-w-none">
              <h1 className="text-islamic-dark font-bold text-[12px] sm:text-sm md:text-base leading-tight truncate transition-colors group-hover:text-islamic">
                {siteName || t('common.appName')}
              </h1>
              <p className="text-golden text-[10px] sm:text-xs font-serif leading-tight truncate" dir="rtl">
                {siteNameAr}
              </p>
            </div>
          </button>

          {/* Medium Screen Navigation (fewer links) */}
          <nav className="hidden md:flex lg:hidden items-center gap-0.5">
            {mediumLinks.map((link) => (
              <button
                key={link.labelKey}
                onClick={() => handleNavClick(link.page)}
                className={`px-2 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
                  publicPage === link.page
                    ? 'text-islamic-dark bg-islamic-lighter shadow-sm'
                    : 'text-gray-600 hover:text-islamic-dark hover:bg-islamic-lighter/40'
                }`}
                aria-current={publicPage === link.page ? 'page' : undefined}
              >
                {t(link.labelKey)}
              </button>
            ))}
          </nav>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {desktopLinks.map((link) => (
              <button
                key={link.labelKey}
                onClick={() => handleNavClick(link.page)}
                className={`px-3 py-2 text-[13px] font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                  publicPage === link.page
                    ? 'text-islamic-dark bg-islamic-lighter shadow-sm'
                    : 'text-gray-600 hover:text-islamic-dark hover:bg-islamic-lighter/40'
                }`}
                aria-current={publicPage === link.page ? 'page' : undefined}
              >
                <span className="hidden xl:inline">{link.icon}</span>
                {t(link.labelKey)}
              </button>
            ))}
            {/* Results & Admin quick buttons */}
            <div className="flex items-center gap-1 ml-2 pl-2 border-l border-islamic/10">
              <button
                onClick={() => handleNavClick('student')}
                className="px-3 py-2 text-[13px] font-medium rounded-lg text-golden hover:bg-golden-lighter/50 transition-all duration-200 flex items-center gap-1.5"
              >
                <Search className="size-3.5" />
                {t('nav.studentResult')}
              </button>
              <button
                onClick={() => handleNavClick('admin')}
                className="px-3 py-2 text-[13px] font-medium rounded-lg text-islamic hover:bg-islamic-lighter/50 transition-all duration-200 flex items-center gap-1.5"
              >
                <Shield className="size-3.5" />
                {t('nav.admin')}
              </button>
            </div>
          </nav>

          {/* Right side: Language + Mobile Menu */}
          <div className="flex items-center gap-1.5">

            {/* Desktop Language Switcher */}
            <div className="hidden md:block">
              <LanguageSwitcher compact />
            </div>

            {/* Mobile Menu Button */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-islamic-dark hover:bg-islamic-lighter/50 rounded-xl"
                  aria-label="Open navigation menu"
                >
                  <Menu className="size-6" />
                </Button>
              </SheetTrigger>

              {/* ===== Beautiful Islamic Drawer ===== */}
              <SheetContent
                side={isRTL ? 'left' : 'right'}
                className={`w-80 sm:w-96 max-w-[90vw] p-0 bg-background overflow-hidden ${isRTL ? '[&>button]:right-auto [&>button]:left-4' : ''}`}
              >
                <SheetTitle className="sr-only">{t('drawer.navigationMenu')}</SheetTitle>

                {/* Drawer Header - Islamic themed */}
                <div className="relative overflow-hidden">
                  {/* Background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-islamic-dark via-islamic to-islamic-light" />
                  {/* Islamic pattern overlay */}
                  <div className="absolute inset-0 islamic-pattern-overlay opacity-[0.08]" />
                  {/* Crescent decoration */}
                  <IslamicCrescent className="absolute top-2 right-2 w-24 h-24 text-golden/20 rotate-12" />
                  <IslamicCrescent className="absolute bottom-4 left-4 w-16 h-16 text-white/10 -rotate-45" />
                  {/* Golden accent line */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-golden via-golden-light to-golden" />

                  <div className="relative p-6 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg">
                          <img
                            src="/logo.png"
                            alt="লোগো"
                            className="w-11 h-11 object-contain"
                          />
                        </div>
                        <div className="absolute -top-1 -right-1">
                          <Sparkles className="size-4 text-golden" />
                        </div>
                      </div>
                      <div>
                        <p className="text-golden/80 text-xs font-medium mb-0.5">
                          {t('drawer.marhaba')}
                        </p>
                        <h2 className="text-white font-bold text-sm leading-tight">
                          {siteName || t('common.appName')}
                        </h2>
                        <p className="text-white/50 text-xs mt-1" dir="rtl">
                          {siteNameAr}
                        </p>
                      </div>
                    </div>
                    <SheetClose asChild className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors">
                      <Button variant="ghost" size="icon" className="size-8">
                        <X className="size-4" />
                      </Button>
                    </SheetClose>
                  </div>
                </div>

                {/* Language Switcher in Drawer */}
                <div className="px-5 py-3 bg-gradient-to-r from-islamic-lighter/50 to-transparent border-b border-islamic/5">
                  <LanguageSwitcher />
                </div>

                {/* Quick Access Buttons */}
                <div className="px-5 py-3 flex gap-2">
                  <button
                    onClick={() => handleNavClick('student')}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-golden/10 border border-golden/20 rounded-xl text-golden text-xs font-semibold hover:bg-golden/20 transition-all"
                  >
                    <Search className="size-3.5" />
                    {t('nav.studentResult')}
                  </button>
                  <button
                    onClick={() => handleNavClick('admin')}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-islamic/5 border border-islamic/15 rounded-xl text-islamic text-xs font-semibold hover:bg-islamic/10 transition-all"
                  >
                    <Shield className="size-3.5" />
                    {t('nav.admin')}
                  </button>
                </div>

                {/* Navigation Groups */}
                <nav className="flex-1 overflow-y-auto px-4 py-3" aria-label="Main navigation">
                  {/* Main Menu Group */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 px-3 mb-2">
                      <Star className="size-3 text-golden" />
                      <span className="text-[11px] font-semibold text-golden uppercase tracking-wider">
                        {t('drawer.mainMenu')}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {navLinks.filter(l => l.group === 'main').map((link, index) => (
                        <DrawerNavItem
                          key={link.labelKey}
                          link={link}
                          isActive={publicPage === link.page}
                          onClick={handleNavClick}
                          index={index}
                        />
                      ))}
                    </div>
                  </div>

                  <Separator className="my-3 bg-islamic/5" />

                  {/* Information & Services Group */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 px-3 mb-2">
                      <BookOpen className="size-3 text-islamic" />
                      <span className="text-[11px] font-semibold text-islamic uppercase tracking-wider">
                        {t('drawer.information')}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {navLinks.filter(l => l.group === 'info').map((link, index) => (
                        <DrawerNavItem
                          key={link.labelKey}
                          link={link}
                          isActive={publicPage === link.page}
                          onClick={handleNavClick}
                          index={index}
                        />
                      ))}
                    </div>

                    {/* Quick Access */}
                    <div className="pt-4">
                      <div className="flex items-center gap-2 px-3 mb-2">
                        <Sparkles className="size-3 text-golden" />
                        <span className="text-[11px] font-semibold text-golden uppercase tracking-wider">
                          {t('drawer.quickAccess')}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {navLinks.filter(l => l.group === 'quick').map((link, index) => (
                          <DrawerNavItem
                            key={link.labelKey}
                            link={link}
                            isActive={publicPage === link.page}
                            onClick={handleNavClick}
                            index={index}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </nav>
                {/* Drawer Footer */}
                <div className="border-t border-islamic/5 p-4 bg-islamic-lighter/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-islamic/10 flex items-center justify-center">
                        <Heart className="size-4 text-islamic" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-islamic-dark">
                          {t('nav.donation')}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{t('header.sadaqah')}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleNavClick('donation')}
                      className="px-3 py-1.5 bg-islamic text-white text-xs font-semibold rounded-lg hover:bg-islamic-light transition-colors shadow-sm flex items-center gap-1"
                    >
                      {t('donation.donate')}
                      <ArrowRight className="size-3" />
                    </button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
