'use client';

import { useState } from 'react';
import {
  Home, ArrowLeft, Search, AlertTriangle, FileQuestion,
  Globe, Link2, ExternalLink, Copy, CheckCircle, Compass,
  BookOpen, Users, Phone, Calendar, MessageCircle, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-50 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-amber-50 rounded-full translate-x-1/3 translate-y-1/3 blur-2xl" />

      <div className="max-w-2xl w-full relative z-10">
        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-sm border border-white/60 shadow-xl rounded-3xl overflow-hidden">
          {/* Top Banner */}
          <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 px-6 sm:px-8 py-7 sm:py-9 text-white overflow-hidden">
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
              <div className="bg-red-50 border border-red-200/80 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-bold text-red-700 mb-1.5">{t('notFound.errorDetails')}</h3>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Globe className="w-3 h-3 text-red-400" />
                      <span className="text-[10px] text-red-500 font-medium">{t('notFound.requestedUrl')}</span>
                    </div>
                    <div className="bg-white rounded-lg border border-red-200/60 px-3 py-2">
                      <code className="text-xs text-red-700 font-mono font-semibold break-all">
                        {displayPath}
                      </code>
                    </div>
                    <p className="text-[11px] text-red-600 leading-relaxed mt-2">
                      {t('notFound.urlHelp')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Possible Causes */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Search className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <h3 className="text-xs font-bold text-amber-700">{t('notFound.causesTitle')}</h3>
              </div>
              <ul className="space-y-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <li key={n} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                    <span className="text-[11px] text-amber-700 leading-relaxed">{t(`notFound.cause${n}`)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Smart Suggestions */}
            {suggestions.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Compass className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <h3 className="text-xs font-bold text-emerald-700">{t('notFound.suggestionsTitle')}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s.page + (s.view || '')}
                      onClick={() => s.view === 'student' ? navigateTo('student') : navigateTo('public', s.page)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-200 text-[11px] font-medium text-emerald-700 rounded-lg hover:bg-emerald-100 transition-all cursor-pointer shadow-sm"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Navigation */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-200/80 flex items-center justify-center">
                  <BookOpen className="w-3.5 h-3.5 text-slate-600" />
                </div>
                <h3 className="text-xs font-bold text-slate-700">{t('notFound.popularTitle')}</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {quickLinks.map((item) => (
                  <button
                    key={item.page}
                    onClick={() => navigateTo('public', item.page)}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-[11px] font-medium text-slate-700 rounded-lg hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-all cursor-pointer shadow-sm group"
                  >
                    <item.icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <Button
                onClick={() => navigateTo('public')}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-5 py-2.5 text-sm font-bold shadow-lg shadow-emerald-200/50 rounded-xl gap-2 transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                {t('paymentCallback.goHome')}
              </Button>
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                className="flex-1 px-5 py-2.5 text-sm font-semibold rounded-xl gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('notFound.backButton')}
              </Button>
              <Button
                variant="ghost"
                onClick={() => window.location.reload()}
                className="px-4 py-2.5 text-sm text-slate-500 hover:text-slate-700 cursor-pointer gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {t('common.refresh')}
              </Button>
            </div>

            {/* Copy Report */}
            <button
              onClick={handleCopyReport}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-[11px] font-medium text-slate-400 hover:text-emerald-600 bg-slate-50 hover:bg-emerald-50 rounded-xl border border-slate-100 hover:border-emerald-200 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
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
        <p className="text-center text-[11px] text-slate-400 mt-5">
          {t('notFound.helpPrefix')}{' '}
          <button
            onClick={() => navigateTo('public', 'contact')}
            className="text-emerald-600 hover:underline font-medium cursor-pointer"
          >
            {t('notFound.contactLink')}
          </button>
          {' '}{t('notFound.helpSuffix')}
        </p>
      </div>
    </div>
  );
}
