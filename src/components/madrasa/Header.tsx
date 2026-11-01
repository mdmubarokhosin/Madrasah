'use client';

import { useState, useEffect, type ReactNode } from 'react';
import {
  Menu, X, Home, Info, GraduationCap, Users, ClipboardList,
  Bell, CalendarDays, Camera, Heart, MessageCircle, Search,
  BookOpen, Globe, ChevronRight, Star, Sparkles,
  ArrowRight, ListChecks, Clock, BedDouble, Megaphone, FolderOpen
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { navigateTo } from '@/lib/navigate';
import { type Language, LANGUAGE_NAMES } from '@/lib/i18n';

import { Sheet } from '@heroui/react/sheet';
import { Button } from '@heroui/react/button';
import { Select } from '@heroui/react/select';
import { ListBox } from '@heroui/react/list-box';
import ThemeToggle from '@/components/madrasa/ThemeToggle';
import type { PublicPage } from '@/types/database';

/* ============ Navigation Links ============ */
interface NavLink {
  labelKey: string;
  page: PublicPage | 'student';
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

/* ============ Language Switcher — Dropdown Menu ============ */
export function LanguageSwitcher({ compact = false, onDark = false }: { compact?: boolean; onDark?: boolean }) {
  const { language, setLanguage } = useTranslation();
  const languages: Language[] = ['bn', 'en', 'ar'];
  const current = LANGUAGE_NAMES[language];

  return (
    <Select
      aria-label={`Language: ${current.english} — change language`}
      value={language}
      onChange={(value) => { if (value != null) setLanguage(String(value) as Language); }}
      placeholder={current.native}
      className="w-fit"
    >
      <Select.Trigger
        className={`h-9 min-h-[36px] w-fit cursor-pointer gap-1.5 rounded-full border-0 px-2.5 shadow-none outline-none transition-colors data-[focus-visible=true]:ring-2 ${
          compact ? 'text-[11px]' : 'text-xs'
        } ${
          onDark
            ? 'bg-white/10 text-white hover:bg-white/20 data-[focus-visible=true]:ring-white/30 [&_[data-slot=select-indicator]]:text-white/70'
            : 'bg-islamic-lighter/70 text-islamic-dark hover:bg-islamic-lighter data-[focus-visible=true]:ring-islamic/30'
        }`}
      >
        <Select.Value>
          <span className="flex min-w-0 items-center gap-1.5">
            <Globe className={`size-3.5 flex-shrink-0 ${onDark ? 'text-gold-soft' : 'text-islamic'}`} aria-hidden="true" />
            <span className="truncate font-semibold">{current.native}</span>
          </span>
        </Select.Value>
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover className="min-w-[13rem] rounded-xl border border-islamic/15 shadow-xl shadow-islamic/10">
        <ListBox aria-label="Language">
          {languages.map((lang) => (
            <ListBox.Item
              key={lang}
              id={lang}
              textValue={LANGUAGE_NAMES[lang].native}
              className="flex items-center gap-2 rounded-lg py-2.5 pl-3 pr-8 text-sm rtl:pl-8 rtl:pr-3 data-[selected=true]:bg-islamic-lighter data-[selected=true]:font-semibold data-[hovered=true]:bg-islamic-lighter/60"
            >
              <span aria-hidden="true" className="text-base leading-none">{LANGUAGE_NAMES[lang].flag}</span>
              <span className="font-semibold">{LANGUAGE_NAMES[lang].native}</span>
              <span className="text-[11px] font-normal text-muted-foreground">{LANGUAGE_NAMES[lang].english}</span>
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
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

/* ============ Drawer Section Label ============ */
function DrawerSectionLabel({ icon, label, className = '' }: { icon: ReactNode; label: string; className?: string }) {
  return (
    <div className={`mb-1.5 flex items-center gap-2 px-2.5 ${className}`}>
      <span className="text-gold-soft" aria-hidden="true">{icon}</span>
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-soft/90">{label}</span>
      <span className="h-px flex-1 bg-gradient-to-r from-gold-soft/25 to-transparent" aria-hidden="true" />
    </div>
  );
}

/* ============ Drawer Nav Item (dark glass) ============ */
function DrawerNavItem({
  link,
  isActive,
  onClick,
}: {
  link: NavLink;
  isActive: boolean;
  onClick: (page: PublicPage | 'student') => void;
}) {
  const { t } = useTranslation();

  return (
    <button
      onClick={() => onClick(link.page)}
      className={`group relative flex w-full items-center gap-3 rounded-2xl px-2.5 py-2.5 text-[13px] font-semibold transition-all duration-300 ${
        isActive
          ? 'bg-gradient-to-r from-gold-soft/20 via-gold-soft/10 to-transparent text-gold-bright ring-1 ring-gold-soft/25'
          : 'text-white/70 ring-1 ring-transparent hover:bg-white/[0.06] hover:text-white hover:ring-white/10'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      {isActive && (
        <span
          className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-gold-bright to-gold-soft"
          aria-hidden="true"
        />
      )}
      <span
        className={`grid size-9 flex-shrink-0 place-items-center rounded-xl transition-all duration-300 group-hover:scale-105 ${
          isActive
            ? 'bg-gold-soft/15 text-gold-bright ring-1 ring-gold-soft/25'
            : 'bg-white/[0.06] text-gold-soft ring-1 ring-white/10'
        }`}
        aria-hidden="true"
      >
        {link.icon}
      </span>
      <span className="flex-1 truncate text-start">{t(link.labelKey)}</span>
      <ChevronRight
        className={`size-3.5 flex-shrink-0 rtl:-scale-x-100 transition-all duration-300 ${
          isActive ? 'text-gold-bright/90' : 'text-white/30 opacity-0 group-hover:opacity-100'
        }`}
        aria-hidden="true"
      />
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

  // Transparent-over-film only where a dark hero sits directly below the header
  const overHero = publicPage === 'home' && !scrolled;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 24);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mobile app shell (BottomNav) opens this same drawer via broadcast —
  // keeps Sheet state owned by the Header while both entry points work.
  useEffect(() => {
    const openDrawer = () => setIsOpen(true);
    window.addEventListener('madrasa:open-drawer', openDrawer);
    return () => window.removeEventListener('madrasa:open-drawer', openDrawer);
  }, []);

  const handleNavClick = (page: PublicPage | 'student') => {
    setIsOpen(false);
    if (page === 'student') {
      navigateTo('student');
      return;
    }
    navigateTo('public', page);
  };

  const mediumLinks = navLinks.slice(0, 5); // md → xl: compact set
  const desktopLinks = navLinks.slice(0, 8); // xl+: full priority set (rest in drawer/footer)

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        overHero ? 'bg-transparent' : 'glass shadow-lg shadow-islamic/8'
      }`}
    >
      {/* Top cinematic gold hairline */}
      <div className="gold-flow-line" aria-hidden="true" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-[4.5rem]">
          {/* Logo + Site Title (responsive, visible on mobile too) */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink group"
          >
            <div className="relative flex-shrink-0">
              <div className={`rounded-2xl p-0.5 ${overHero ? 'bg-white/10 ring-1 ring-white/15' : ''}`}>
                <img
                  src={siteInfo?.logoUrl || '/logo.png'}
                  alt={siteName || 'Logo'}
                  className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 object-contain transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110"
                />
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 transition-opacity ${overHero ? 'bg-gold-bright border-night opacity-100' : 'bg-gold-bright border-white opacity-0'} group-hover:opacity-100`} />
            </div>
            <div className="min-w-0 max-w-[42vw] sm:max-w-[240px] md:max-w-[320px] lg:max-w-none text-left">
              <p className={`font-bold text-[12px] sm:text-sm md:text-[15px] leading-tight truncate transition-colors ${
                overHero ? 'text-white' : 'text-islamic-dark group-hover:text-islamic'
              }`}>
                {siteName || t('common.appName')}
              </p>
              <p className={`text-[10px] sm:text-xs font-serif leading-tight truncate transition-colors ${overHero ? 'text-gold-soft' : 'text-golden'}`} dir="rtl" lang="ar">
                {siteNameAr}
              </p>
            </div>
          </button>

          {/* Medium Screen Navigation (compact set) */}
          <nav className="hidden md:flex xl:hidden items-center gap-0.5">
            {mediumLinks.map((link) => (
              <button
                key={link.labelKey}
                onClick={() => handleNavClick(link.page)}
                className={`px-2 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  publicPage === link.page
                    ? 'text-islamic-dark bg-islamic-lighter shadow-sm'
                    : overHero
                      ? 'text-white/75 hover:text-white hover:bg-white/10'
                      : 'text-muted-foreground hover:text-islamic-dark hover:bg-islamic-lighter/40'
                }`}
                aria-current={publicPage === link.page ? 'page' : undefined}
              >
                {t(link.labelKey)}
              </button>
            ))}
          </nav>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-0.5">
            {desktopLinks.map((link) => (
              <button
                key={link.labelKey}
                onClick={() => handleNavClick(link.page)}
                className={`relative px-3 py-2 text-[13px] font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                  publicPage === link.page
                    ? overHero
                      ? 'text-gold-soft'
                      : 'text-islamic-dark bg-islamic-lighter shadow-sm'
                    : overHero
                      ? 'text-white/75 hover:text-white hover:bg-white/10'
                      : 'text-muted-foreground hover:text-islamic-dark hover:bg-islamic-lighter/40'
                }`}
                aria-current={publicPage === link.page ? 'page' : undefined}
              >
                <span className="hidden xl:inline">{link.icon}</span>
                {t(link.labelKey)}
                {publicPage === link.page && overHero && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gold-bright" aria-hidden="true" />
                )}
              </button>
            ))}
            {/* Student result quick button */}
            <div className={`flex items-center gap-1 ml-2 pl-2 ${overHero ? 'border-white/15' : 'border-islamic/10'} border-l`}>
              <button
                onClick={() => handleNavClick('student')}
                className={`px-2.5 py-2 text-[13px] font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                  overHero ? 'text-gold-soft hover:bg-white/10' : 'text-golden hover:bg-golden-lighter/50'
                }`}
              >
                <Search className="size-4" />
                <span className="hidden 2xl:inline">{t('nav.studentResult')}</span>
              </button>
            </div>
          </nav>

          {/* Right side: Theme + Language + Mobile Menu */}
          <div className="flex items-center gap-1.5">
            {/* Desktop theme toggle (hidden over the transparent hero — the
                drawer carries the full control on every screen size) */}
            <div className={`hidden md:block ${overHero ? 'invisible' : ''}`}>
              <ThemeToggle variant="icon" />
            </div>

            {/* Desktop Language Switcher */}
            <div className="hidden md:block">
              <LanguageSwitcher compact onDark={overHero} />
            </div>

            {/* Mobile Menu Button */}
            <Sheet isOpen={isOpen} onOpenChange={setIsOpen} placement={isRTL ? 'left' : 'right'}>
              <Sheet.Trigger>
                <Button
                  type="button"
                  variant="ghost"
                  isIconOnly
                  className={`size-9 min-w-9 rounded-xl bg-transparent px-0 shadow-none transition-colors data-[hovered=true]:bg-white/10 data-[pressed=true]:bg-white/10 xl:hidden ${
                    overHero ? 'text-white hover:text-white' : 'text-islamic-dark hover:bg-islamic-lighter/50 data-[hovered=true]:bg-islamic-lighter/50'
                  }`}
                  aria-label="Open navigation menu"
                >
                  <Menu className="size-6" />
                </Button>
              </Sheet.Trigger>

              {/* ===== Cinematic Dark Drawer ===== */}
              <Sheet.Backdrop variant="opaque" className="bg-night/70 backdrop-blur-sm">
                <Sheet.Content className="w-[21.5rem] sm:w-96 max-w-[92vw] gap-0 overflow-hidden border-0 bg-night p-0">
                  <Sheet.Dialog aria-label={t('drawer.navigationMenu')} className="gap-0 overflow-hidden border-0 bg-night p-0">

                {/* Ambient backdrop — night gradient, pattern, glow */}
                <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                  <div className="absolute inset-0 bg-gradient-to-b from-night via-emerald-deep/90 to-night-2" />
                  <div className="absolute inset-0 islamic-pattern-overlay opacity-[0.07]" />
                  <div className="absolute -top-24 end-[-18%] w-72 h-72 rounded-full bg-gold-bright/10 blur-[90px]" />
                  <div className="absolute bottom-0 start-[-15%] w-80 h-80 rounded-full bg-islamic/25 blur-[100px]" />
                  <IslamicCrescent className="absolute top-28 end-5 w-20 h-20 rotate-12 text-gold-soft/10" />
                  <div className="absolute left-0 right-0 top-0 gold-flow-line" />
                </div>

                <div className="relative flex h-full flex-col">
                  {/* Drawer Header */}
                  <div className="px-5 pb-5 pt-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3.5">
                        <div className="relative flex-shrink-0">
                          <div className="rounded-2xl bg-gradient-to-br from-gold-bright/50 via-gold-soft/25 to-transparent p-[1.5px]">
                            <div className="rounded-2xl bg-white/[0.06] p-1.5 backdrop-blur-md">
                              <img
                                src={siteInfo?.logoUrl || '/logo.png'}
                                alt={siteName || 'Logo'}
                                className="size-12 rounded-xl object-contain"
                              />
                            </div>
                          </div>
                          <span
                            className="absolute -end-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-gold-bright text-eclipse shadow-md shadow-gold-bright/30"
                            aria-hidden="true"
                          >
                            <Sparkles className="size-2.5" />
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold-soft">
                            {t('drawer.marhaba')}
                          </p>
                          <h2 className="mt-1 line-clamp-2 text-[15px] font-bold leading-snug text-white">
                            {siteName || t('common.appName')}
                          </h2>
                          <p className="mt-0.5 truncate text-[11px] text-white/45" dir="rtl">
                            {siteNameAr}
                          </p>
                        </div>
                      </div>
                      <Sheet.CloseTrigger
                        aria-label="Close navigation menu"
                        className="size-8 flex-shrink-0 rounded-xl bg-white/[0.06] text-white/70 shadow-none ring-1 ring-white/10 hover:bg-white/15 hover:text-white"
                      >
                        <X className="size-4" />
                      </Sheet.CloseTrigger>
                    </div>
                  </div>

                  {/* Language + Theme + Quick Access */}
                  <div className="space-y-2.5 px-5 pb-4">
                    <div className="flex justify-center rounded-2xl bg-white/[0.05] px-3 py-2 ring-1 ring-white/10">
                      <LanguageSwitcher compact onDark />
                    </div>
                    {/* Light / Dark mode — right beside the language switcher */}
                    <ThemeToggle variant="segment" />
                    <div className="grid grid-cols-1 gap-2.5">
                      <button
                        onClick={() => handleNavClick('student')}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-gold-soft/10 px-3 py-3 text-xs font-bold text-gold-bright ring-1 ring-gold-soft/25 transition-all duration-300 hover:bg-gold-soft/20"
                      >
                        <Search className="size-4" />
                        {t('nav.studentResult')}
                      </button>
                    </div>
                  </div>

                  {/* Navigation Groups */}
                  <nav className="flex-1 overflow-y-auto px-3.5 pb-5" aria-label="Main navigation">
                    <DrawerSectionLabel icon={<Star className="size-3" />} label={t('drawer.mainMenu')} />
                    <div className="space-y-1">
                      {navLinks.filter((l) => l.group === 'main').map((link) => (
                        <DrawerNavItem
                          key={link.labelKey}
                          link={link}
                          isActive={publicPage === link.page}
                          onClick={handleNavClick}
                        />
                      ))}
                    </div>

                    <DrawerSectionLabel icon={<BookOpen className="size-3" />} label={t('drawer.information')} className="mt-5" />
                    <div className="space-y-1">
                      {navLinks.filter((l) => l.group === 'info').map((link) => (
                        <DrawerNavItem
                          key={link.labelKey}
                          link={link}
                          isActive={publicPage === link.page}
                          onClick={handleNavClick}
                        />
                      ))}
                    </div>

                    <DrawerSectionLabel icon={<Sparkles className="size-3" />} label={t('drawer.quickAccess')} className="mt-5" />
                    <div className="space-y-1">
                      {navLinks.filter((l) => l.group === 'quick').map((link) => (
                        <DrawerNavItem
                          key={link.labelKey}
                          link={link}
                          isActive={publicPage === link.page}
                          onClick={handleNavClick}
                        />
                      ))}
                    </div>
                  </nav>

                  {/* Drawer Footer — Donation CTA */}
                  <div className="border-t border-white/10 p-4">
                    <button
                      onClick={() => handleNavClick('donation')}
                      className="group flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-gold-soft/20 via-gold-soft/10 to-transparent p-3 text-left ring-1 ring-gold-soft/25 transition-all duration-300 hover:from-gold-soft/25 hover:ring-gold-soft/50"
                    >
                      <span
                        className="grid size-10 flex-shrink-0 place-items-center rounded-xl bg-gold-bright/15 text-gold-bright ring-1 ring-gold-soft/30 transition-transform duration-300 group-hover:scale-110"
                        aria-hidden="true"
                      >
                        <Heart className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-white">{t('nav.donation')}</span>
                        <span className="block truncate text-[11px] text-white/50">{t('header.sadaqah')}</span>
                      </span>
                      <span className="btn-gold flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold">
                        {t('donation.donate')}
                        <ArrowRight className="size-3 rtl:-scale-x-100" />
                      </span>
                    </button>
                  </div>
                </div>
                  </Sheet.Dialog>
                </Sheet.Content>
              </Sheet.Backdrop>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Bottom hairline when transparent over the film */}
      {overHero && <div className="hairline-gold" aria-hidden="true" />}
    </header>
  );
}
