'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertOctagon, Home, ArrowLeft, RefreshCw, Copy, Terminal,
  CheckCircle, ChevronDown, ChevronUp, Globe, Clock, Monitor,
  Wifi
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { navigateTo } from '@/lib/navigate';

/* ------------------------------------------------------------------ */
/*  Translations for 3 languages (bn / en / ar)                        */
/* ------------------------------------------------------------------ */
type Lang = 'bn' | 'en' | 'ar';

const translations: Record<Lang, Record<string, string>> = {
  bn: {
    bismillah: 'بسم الله الرحمن الرحيم',
    title: 'একটি ত্রুটি ঘটেছে!',
    subtitle: 'অ্যাপ্লিকেশনটি সঠিকভাবে চলছে না। এটি একটি সাময়িক সমস্যা হতে পারে।',
    errorDetails: 'ত্রুটির বিবরণ',
    whatHappened: 'কী ঘটেছে ও করণীয়',
    action1: 'পৃষ্ঠা লোড করার সময় একটি অপ্রত্যাশিত ত্রুটি হয়েছে',
    action2: 'এটি একটি সাময়িক সমস্যা — নিচের "আবার চেষ্টা করুন" বাটনে ক্লিক করুন',
    action3: 'ব্রাউজারের ক্যাশে মুছে ফেলে আবার চেষ্টা করুন',
    action4: 'ইন্টারনেট সংযোগ স্থিতিশীল কিনা পরীক্ষা করুন',
    action5: 'যদি সমস্যাটি থাকে তবে ত্রুটি রিপোর্ট কপি করে এডমিনকে পাঠান',
    online: 'সংযুক্ত',
    offline: 'বিচ্ছিন্ন',
    tryAgain: 'আবার চেষ্টা করুন',
    copyReport: 'ত্রুটি রিপোর্ট কপি করুন',
    copied: 'কপি হয়েছে!',
    homePage: 'হোম পেজ',
    prevPage: 'আগের পৃষ্ঠা',
    techDetails: 'টেকনিক্যাল বিবরণ (Stack Trace)',
    runtimeError: 'Runtime Error',
    helpText1: 'যদি সমস্যাটি বারবার ঘটে, অনুগ্রহ করে',
    helpText2: 'থেকে আমাদের জানান।',
    contactPage: 'যোগাযোগ পৃষ্ঠা',
  },
  en: {
    bismillah: 'بسم الله الرحمن الرحيم',
    title: 'An Error Occurred!',
    subtitle: 'The application is not running correctly. This may be a temporary issue.',
    errorDetails: 'Error Details',
    whatHappened: 'What Happened & What To Do',
    action1: 'An unexpected error occurred while loading the page',
    action2: 'This is a temporary issue — click the "Try Again" button below',
    action3: 'Clear your browser cache and try again',
    action4: 'Check if your internet connection is stable',
    action5: 'If the problem persists, copy the error report and send it to the admin',
    online: 'Online',
    offline: 'Offline',
    tryAgain: 'Try Again',
    copyReport: 'Copy Error Report',
    copied: 'Copied!',
    homePage: 'Home Page',
    prevPage: 'Previous Page',
    techDetails: 'Technical Details (Stack Trace)',
    runtimeError: 'Runtime Error',
    helpText1: 'If the problem occurs repeatedly, please',
    helpText2: 'let us know.',
    contactPage: 'Contact Page',
  },
  ar: {
    bismillah: 'بسم الله الرحمن الرحيم',
    title: 'حدث خطأ!',
    subtitle: 'التطبيق لا يعمل بشكل صحيح. قد تكون مشكلة مؤقتة.',
    errorDetails: 'تفاصيل الخطأ',
    whatHappened: 'ماذا حدث وماذا تفعل',
    action1: 'حدث خطأ غير متوقع أثناء تحميل الصفحة',
    action2: 'هذه مشكلة مؤقتة — انقر على زر "المحاولة مرة أخرى" أدناه',
    action3: 'امسح ذاكرة التخزين المؤقت للمتصفح وحاول مرة أخرى',
    action4: 'تحقق من استقرار اتصال الإنترنت',
    action5: 'إذا استمرت المشكلة، انسخ تقرير الخطأ وأرسله للمسؤول',
    online: 'متصل',
    offline: 'غير متصل',
    tryAgain: 'المحاولة مرة أخرى',
    copyReport: 'نسخ تقرير الخطأ',
    copied: 'تم النسخ!',
    homePage: 'الصفحة الرئيسية',
    prevPage: 'الصفحة السابقة',
    techDetails: 'التفاصيل التقنية (تتبع المكدس)',
    runtimeError: 'خطأ وقت التشغيل',
    helpText1: 'إذا تكررت المشكلة، يرجى',
    helpText2: 'إبلاغنا.',
    contactPage: 'صفحة الاتصال',
  },
};

function detectLanguage(): Lang {
  if (typeof window === 'undefined') return 'bn';
  const stored = localStorage.getItem('preferred-language');
  if (stored === 'en' || stored === 'ar') return stored;
  return 'bn';
}

function isRtl(lang: Lang): boolean {
  return lang === 'ar';
}

/** Timestamp (bn-BD) captured at the moment an error is reported */
function formatErrorTime(): string {
  return new Date().toLocaleString('bn-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [showStack, setShowStack] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  // Browser-only values (preferred language, error time, online status) start as
  // deterministic placeholders so the first render matches between server and
  // client; the real values are computed in the mount effect below.
  const [lang, setLang] = useState<Lang>('bn');
  const [timestamp, setTimestamp] = useState<string>('');
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Re-capture the error time when a new error object is reported
  // (state adjusted during render instead of a synchronous setState in an effect)
  const [reportedError, setReportedError] = useState(error);
  if (error !== reportedError) {
    setReportedError(error);
    setTimestamp(formatErrorTime());
  }

  useEffect(() => {
    // After mount: compute the real browser-only values (placeholders above).
    // Deferred to a microtask to avoid a synchronous setState inside the
    // effect (cascading renders) — the first render stays deterministic.
    queueMicrotask(() => {
      setLang(detectLanguage());
      setTimestamp(formatErrorTime());
      setIsOnline(typeof navigator === 'undefined' ? true : navigator.onLine);
    });
  }, []);

  useEffect(() => {
    console.error('Application error:', error);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [error]);

  // Auto-increment elapsed time
  useEffect(() => {
    const timer = setInterval(() => setElapsed(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const t = translations[lang];
  const rtl = isRtl(lang);

  const errorMessage = error.message || 'Unknown error occurred';
  const errorStack = error.stack || '';
  const errorDigest = error.digest || '';
  const errorName = error.name || 'Error';

  const handleCopyError = () => {
    const info = [
      '=== Runtime Error Report ===',
      '',
      `Timestamp: ${timestamp}`,
      `Internet: ${isOnline ? 'Online' : 'Offline'}`,
      `URL: ${typeof window !== 'undefined' ? window.location.href : 'N/A'}`,
      `Browser: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}`,
      '',
      '--- Error Details ---',
      `Type: ${errorName}`,
      `Message: ${errorMessage}`,
      errorDigest ? `Digest: ${errorDigest}` : '',
      '',
      '--- Suggested Actions ---',
      '1. Refresh the page (click Try Again button)',
      '2. Clear browser cache',
      '3. Check internet connection',
      '4. Try a different browser',
      '5. Send this report to the admin if the problem persists',
      '',
      '--- Stack Trace ---',
      errorStack,
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(info).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }).catch(() => {
      // Clipboard permission denied — select nothing silently but inform user
      setCopied(false);
    });
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-b from-surface-secondary via-background to-danger/10 relative overflow-hidden${rtl ? ' rtl' : ''}`}>
      {/* Background */}
      <div className="absolute inset-0 islamic-pattern-bg pointer-events-none opacity-[0.015]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-radial from-danger/10 via-transparent to-transparent rounded-full blur-3xl" />
      <div className="absolute top-32 right-0 w-72 h-72 bg-danger/15 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-warning/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

      <div className="max-w-2xl w-full relative z-10">
        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-sm border border-white/60 shadow-2xl shadow-danger/5 rounded-3xl overflow-hidden">
          {/* Error Header Banner */}
          <div className="relative bg-danger px-6 sm:px-8 py-7 sm:py-9 text-white overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.04)_25%,rgba(255,255,255,0.04)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.04)_75%)] bg-[length:20px_20px]" />
            <div className="absolute inset-0 islamic-pattern-overlay opacity-[0.04]" />
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              {/* Arabic */}
              <p className="text-warning/60 text-sm font-serif text-center mb-4" dir="rtl">
                {t.bismillah}
              </p>

              {/* Error icon */}
              <div className="flex items-center justify-center mb-5">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-xl">
                  <AlertOctagon className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                </div>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-center mb-2">{t.title}</h1>
              <p className="text-xs sm:text-sm text-white/70 text-center max-w-md mx-auto leading-relaxed">
                {t.subtitle}
              </p>
            </div>
          </div>

          <div className="px-6 sm:px-8 py-5 sm:py-7 space-y-4">
            {/* Error Message */}
            <div className="bg-danger/10 border border-danger/40 rounded-2xl p-4">
              <div className={`flex items-start gap-3${rtl ? ' flex-row-reverse' : ''}`}>
                <div className="w-8 h-8 rounded-xl bg-danger/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Terminal className="w-4 h-4 text-danger" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-bold text-danger mb-1.5">{t.errorDetails}</h3>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[10px] text-danger/80" dir="ltr">
                      <span className="font-mono">{errorName}</span>
                      {errorDigest && (
                        <>
                          <span>|</span>
                          <span>ID: {errorDigest}</span>
                        </>
                      )}
                    </div>
                    <div className="bg-white rounded-lg border border-danger/40 px-3 py-2.5">
                      <code className="text-xs text-danger font-mono break-words leading-relaxed" dir="ltr">
                        {errorMessage}
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* What happened */}
            <div className="bg-warning/15 border border-warning/40 rounded-2xl p-4">
              <h3 className={`text-xs font-bold text-warning-foreground mb-2.5${rtl ? ' text-right' : ''}`}>{t.whatHappened}</h3>
              <ul className="space-y-2">
                {[
                  t.action1,
                  t.action2,
                  t.action3,
                  t.action4,
                  t.action5,
                ].map((text, idx) => (
                  <li key={idx} className={`flex items-start gap-2${rtl ? ' flex-row-reverse text-right' : ''}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 flex-shrink-0" />
                    <span className="text-[11px] text-warning-foreground leading-relaxed">{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Status Indicators */}
            <div className={`flex items-center gap-3 px-1${rtl ? ' flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1.5 rounded-lg ${
                isOnline
                  ? 'bg-success/15 text-success border border-success/30'
                  : 'bg-danger/10 text-danger border border-danger/40'
              }`}>
                <Wifi className="w-3 h-3" />
                {isOnline ? t.online : t.offline}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1.5 rounded-lg bg-surface-secondary text-muted-foreground border border-border" dir="ltr">
                <Monitor className="w-3 h-3" />
                {typeof window !== 'undefined' ? window.location.pathname : 'N/A'}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1.5 rounded-lg bg-surface-secondary text-muted-foreground border border-border">
                <Clock className="w-3 h-3" />
                {timestamp ? timestamp.split(',')[0] : '\u2014'}
              </div>
            </div>

            {/* Collapsible Stack Trace */}
            {errorStack && (
              <div className="border border-border/80 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setShowStack(!showStack)}
                  className={`w-full flex items-center justify-between px-4 py-3 bg-surface-secondary hover:bg-surface-tertiary transition-colors cursor-pointer${rtl ? ' flex-row-reverse' : ''}`}
                >
                  <span className={`text-[11px] font-semibold text-foreground flex items-center gap-2${rtl ? ' flex-row-reverse' : ''}`}>
                    <Terminal className="w-3.5 h-3.5" />
                    {t.techDetails}
                  </span>
                  {showStack
                    ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  }
                </button>
                {showStack && (
                  <div className="px-4 pb-4">
                    <div className="bg-surface-secondary border border-border rounded-xl p-4 max-h-64 overflow-auto">
                      <pre className="text-[11px] text-danger font-mono whitespace-pre-wrap break-words leading-relaxed" dir="ltr">
                        {errorStack}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Primary Action Buttons */}
            <div className={`flex flex-col sm:flex-row gap-3 pt-1${rtl ? ' sm:flex-row-reverse' : ''}`}>
              <Button
                onClick={() => reset()}
                className="flex-1 bg-danger hover:bg-danger/90 text-white py-2.5 text-sm font-bold shadow-lg shadow-danger/30 rounded-xl gap-2 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                {t.tryAgain}
              </Button>
              <Button
                variant="outline"
                onClick={handleCopyError}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl gap-2 border-danger/40 text-danger hover:bg-danger/10 cursor-pointer"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-success" />
                    {t.copied}
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    {t.copyReport}
                  </>
                )}
              </Button>
            </div>

            {/* Secondary Action Buttons */}
            <div className={`flex gap-3${rtl ? ' flex-row-reverse' : ''}`}>
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="flex-1 py-2.5 text-sm font-medium rounded-xl gap-2 border-border text-foreground hover:bg-surface-secondary cursor-pointer"
              >
                <Home className="w-4 h-4" />
                {t.homePage}
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="flex-1 py-2.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                {t.prevPage}
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 sm:px-8 py-3 bg-surface-secondary/80 border-t border-border">
            <div className={`flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground${rtl ? ' flex-row-reverse' : ''}`}>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-danger" />
                  {t.runtimeError}
                </span>
                {errorDigest && (
                  <span className="font-mono">ID: {errorDigest}</span>
                )}
              </div>
              <span>{timestamp}</span>
            </div>
          </div>
        </div>

        {/* Help text */}
        <p className={`text-center text-[11px] text-muted-foreground mt-5${rtl ? ' rtl' : ''}`}>
          {t.helpText1}{' '}
          <button onClick={() => navigateTo('public', 'contact')} className="text-primary hover:underline font-medium bg-transparent border-0 p-0 cursor-pointer">
            {t.contactPage}
          </button>
          {' '}{t.helpText2}
        </p>
      </div>
    </div>
  );
}
