'use client';

import { useState } from 'react';
import {
  Home, ArrowLeft, Search, AlertTriangle, FileQuestion,
  Globe, Link2, ExternalLink, Copy, CheckCircle, Compass,
  BookOpen, Users, Phone, Calendar, MessageCircle, RefreshCw
} from 'lucide-react';
import { HButton } from '@/components/heroui/islamic';
import { useTranslation } from '@/lib/i18n-context';
import { navigateTo } from '@/lib/navigate';
import type { PublicPage } from '@/types/database';

interface NotFoundPageProps {
  path?: string;
}

/* ------------------------------------------------------------------ */
/*  URL Analysis – suggest similar pages                              */
/* ------------------------------------------------------------------ */
type TranslateFn = (key: string) => string;

function analyzeUrl(pathname: string, t: TranslateFn): Array<{ label: string; page: PublicPage; view?: 'student' }> {
  const path = pathname.toLowerCase().replace(/\/+$/, '');
  const suggestions: Array<{ label: string; page: PublicPage; view?: 'student'; keywords: string[] }> = [
    { label: t('notFound.suggHome'), page: 'home', keywords: ['home', 'index'] },
    { label: t('nav.about'), page: 'about', keywords: ['about'] },
    { label: t('nav.departments'), page: 'departments', keywords: ['department', 'dept'] },
    { label: t('notFound.suggTeachers'), page: 'teachers', keywords: ['teacher'] },
    { label: t('nav.admission'), page: 'admission', keywords: ['admission'] },
    { label: t('nav.notices'), page: 'notices', keywords: ['notice'] },
    { label: t('nav.events'), page: 'events', keywords: ['event'] },
    { label: t('nav.gallery'), page: 'gallery', keywords: ['gallery', 'photo'] },
    { label: t('nav.donation'), page: 'donation', keywords: ['donation'] },
    { label: t('notFound.suggBlog'), page: 'blog', keywords: ['blog', 'article'] },
    { label: t('nav.contact'), page: 'contact', keywords: ['contact'] },
    { label: t('nav.results'), page: 'results', keywords: ['result'] },
    { label: t('notFound.suggClassRoutine'), page: 'classRoutine', keywords: ['routine', 'class'] },
    { label: t('notFound.suggSyllabus'), page: 'syllabus', keywords: ['syllabus'] },
    { label: t('notFound.suggHifz'), page: 'hifz', keywords: ['hifz', 'quran'] },
    { label: t('notFound.suggExam'), page: 'exam', keywords: ['exam'] },
    { label: t('notFound.suggCalendar'), page: 'calendar', keywords: ['calendar'] },
    { label: t('notFound.suggAlumni'), page: 'alumni', keywords: ['alumni'] },
    { label: t('notFound.suggPrayer'), page: 'prayer', keywords: ['prayer', 'salat'] },
    { label: t('notFound.suggHadith'), page: 'hadith', keywords: ['hadith'] },
    { label: t('notFound.suggQuran'), page: 'quran', keywords: ['quran'] },
    { label: t('notFound.suggFee'), page: 'feePayment', keywords: ['fee', 'payment'] },
    { label: t('notFound.suggTrack'), page: 'admissionTrack', keywords: ['track'] },
    { label: t('notFound.suggLibrary'), page: 'library', keywords: ['library', 'book'] },
    { label: t('notFound.suggAttendance'), page: 'attendance', keywords: ['attendance'] },
    { label: t('notFound.suggHostel'), page: 'hostel', keywords: ['hostel'] },
    { label: t('notFound.suggDawah'), page: 'dawah', keywords: ['dawah'] },
    { label: t('notFound.suggMaterials'), page: 'materials', keywords: ['material', 'study'] },
    { label: t('notFound.suggStudentPortal'), page: 'home', view: 'student', keywords: ['student', 'portal'] },
  ];

  const matched: Array<{ label: string; page: PublicPage; view?: 'student' }> = [];
  for (const s of suggestions) {
    for (const kw of s.keywords) {
      if (path.includes(kw)) {
        matched.push({ label: s.label, page: s.page, view: s.view });
        break;
      }
    }
  }
  const unique = Array.from(new Map(matched.map(m => [m.page + (m.view || ''), m])).values());
  return unique.slice(0, 4);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function NotFoundPage({ path }: NotFoundPageProps) {
  const { t, language } = useTranslation();
  const [copied, setCopied] = useState(false);
  const locale = language === 'bn' ? 'bn-BD' : language === 'ar' ? 'ar-EG' : 'en-US';

  const suggestions = analyzeUrl(path || '', t);
  const displayPath = path || window.location.pathname;

  const handleCopyReport = () => {
    const report = [
      t('notFound.reportTitle'),
      `URL: ${displayPath}`,
      `${t('common.time')}: ${new Date().toLocaleString(locale)}`,
      `${t('notFound.reportReferrer')}: ${document.referrer || t('notFound.direct')}`,
    ].join('\n');

    navigator.clipboard.writeText(report).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }).catch(() => {});
  };

  const quickLinks = [
    { label: t('nav.home'), page: 'home' as const, icon: Home },
    { label: t('nav.about'), page: 'about' as const, icon: BookOpen },
    { label: t('nav.departments'), page: 'departments' as const, icon: Users },
    { label: t('nav.notices'), page: 'notices' as const, icon: MessageCircle },
    { label: t('nav.contact'), page: 'contact' as const, icon: Phone },
    { label: t('nav.results'), page: 'results' as const, icon: Calendar },
  ];

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 islamic-pattern-bg pointer-events-none opacity-[0.02]" />
      <div className="absolute top-10 left-10 w-72 h-72 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-warning/15 rounded-full translate-x-1/3 translate-y-1/3 blur-2xl" />

      <div className="max-w-2xl w-full relative z-10">
        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-sm border border-white/60 shadow-xl rounded-3xl overflow-hidden">
          {/* Top Banner */}
          <div className="relative bg-primary px-6 sm:px-8 py-7 sm:py-9 text-white overflow-hidden">
            <div className="absolute inset-0 islamic-pattern-overlay opacity-[0.06]" />
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />

            <div className="relative z-10 text-center">
              <p className="text-golden/70 text-sm font-serif mb-3" dir="rtl">بسم الله الرحمن الرحيم</p>

              {/* Large 404 with icon */}
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <span className="text-[90px] sm:text-[110px] font-black text-white/10 leading-none select-none tracking-tighter">
                    404
                  </span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-xl rotate-3 hover:rotate-0 transition-transform duration-300">
                      <FileQuestion className="w-8 h-8 sm:w-10 sm:h-10 text-golden" />
                    </div>
                  </div>
                </div>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold mb-2">{t('notFound.title')}</h1>
              <p className="text-xs sm:text-sm text-white/70 max-w-md mx-auto leading-relaxed">
                {t('notFound.desc')}
              </p>
            </div>
          </div>

          <div className="px-6 sm:px-8 py-5 sm:py-7 space-y-4">
            {/* Error Details Box */}
            {displayPath && displayPath !== '/' && (
              <div className="bg-danger/10 border border-danger/40 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-danger/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4 text-danger" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-bold text-danger mb-1.5">{t('notFound.errorDetails')}</h3>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Globe className="w-3 h-3 text-danger" />
                      <span className="text-[10px] text-danger font-medium">{t('notFound.requestedUrl')}</span>
                    </div>
                    <div className="bg-white rounded-lg border border-danger/40 px-3 py-2">
                      <code className="text-xs text-danger font-mono font-semibold break-all">
                        {displayPath}
                      </code>
                    </div>
                    <p className="text-[11px] text-danger leading-relaxed mt-2">
                      {t('notFound.urlHelp')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Possible Causes */}
            <div className="bg-warning/15 border border-warning/40 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-7 h-7 rounded-lg bg-warning/20 flex items-center justify-center">
                  <Search className="w-3.5 h-3.5 text-warning-foreground" />
                </div>
                <h3 className="text-xs font-bold text-warning-foreground">{t('notFound.causesTitle')}</h3>
              </div>
              <ul className="space-y-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <li key={n} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 flex-shrink-0" />
                    <span className="text-[11px] text-warning-foreground leading-relaxed">{t(`notFound.cause${n}`)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Smart Suggestions */}
            {suggestions.length > 0 && (
              <div className="bg-primary/5 border border-primary/25 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Compass className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <h3 className="text-xs font-bold text-primary">{t('notFound.suggestionsTitle')}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s.page + (s.view || '')}
                      onClick={() => s.view === 'student' ? navigateTo('student') : navigateTo('public', s.page)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-primary/25 text-[11px] font-medium text-primary rounded-lg hover:bg-primary/10 transition-all cursor-pointer shadow-sm"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Navigation */}
            <div className="bg-surface-secondary border border-border rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-7 h-7 rounded-lg bg-surface-tertiary flex items-center justify-center">
                  <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <h3 className="text-xs font-bold text-foreground">{t('notFound.popularTitle')}</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {quickLinks.map((item) => (
                  <button
                    key={item.page}
                    onClick={() => navigateTo('public', item.page)}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-border text-[11px] font-medium text-foreground rounded-lg hover:bg-primary/10 hover:border-primary/25 hover:text-primary transition-all cursor-pointer shadow-sm group"
                  >
                    <item.icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <HButton
                variant="primary"
                onPress={() => navigateTo('public')}
                className="flex-1 bg-primary text-white px-5 py-2.5 text-sm font-bold shadow-lg shadow-primary/25 rounded-xl gap-2 transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                {t('paymentCallback.goHome')}
              </HButton>
              <HButton
                variant="outline"
                onPress={() => window.history.back()}
                className="flex-1 px-5 py-2.5 text-sm font-semibold rounded-xl gap-2 border-primary/25 text-primary hover:bg-primary/10 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('notFound.backButton')}
              </HButton>
              <HButton
                variant="ghost"
                onPress={() => window.location.reload()}
                className="px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {t('common.refresh')}
              </HButton>
            </div>

            {/* Copy Report */}
            <button
              onClick={handleCopyReport}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-[11px] font-medium text-muted-foreground hover:text-primary bg-surface-tertiary hover:bg-primary/10 rounded-xl border border-border hover:border-primary/25 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-primary" />
                  {t('notFound.reportCopied')}
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  {t('notFound.copyReport')}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Help text */}
        <p className="text-center text-[11px] text-muted-foreground mt-5">
          {t('notFound.helpPrefix')}{' '}
          <button
            onClick={() => navigateTo('public', 'contact')}
            className="text-primary hover:underline font-medium cursor-pointer"
          >
            {t('notFound.contactLink')}
          </button>
          {' '}{t('notFound.helpSuffix')}
        </p>
      </div>
    </div>
  );
}
