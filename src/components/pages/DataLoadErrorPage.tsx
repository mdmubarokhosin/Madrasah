'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { WifiOff, RefreshCw, CloudOff, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/madrasa/Header';

/**
 * Full-page "server data not loading" notice.
 * Shown when Firebase data could not be loaded (connection error,
 * permission denied, or the site was never set up).
 * All text is translated via i18n (bn / en / ar).
 */
export default function DataLoadErrorPage() {
  const { firebaseError, firebaseConnected, siteInfo, retryConnection, loading, dataLoaded } = useAppStore();
  const { t } = useTranslation();
  const [retrying, setRetrying] = useState(false);

  const isRetry = dataLoaded; // already tried at least once
  // Connection issue = Firebase errored. Not-configured = connected but no siteInfo.
  const isConnectionIssue = !!firebaseError || (dataLoaded && !loading && !siteInfo && !firebaseConnected);

  const handleRetry = async () => {
    setRetrying(true);
    retryConnection();
    // Wait for subscriptions to settle (safety timer is 3s)
    setTimeout(() => setRetrying(false), 3200);
  };

  const busy = retrying || loading;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-islamic-lighter/40 via-background to-background">
      {/* Top bar */}
      <header className="border-b border-islamic/10 bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
          </div>
          <LanguageSwitcher compact />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full text-center"
        >
          {/* Icon */}
          <div className="mx-auto mb-6 w-24 h-24 rounded-3xl bg-gradient-to-br from-islamic-lighter to-islamic-light/30 flex items-center justify-center shadow-lg shadow-islamic/10">
            {isRetry && firebaseConnected ? (
              <CheckCircle2 className="size-12 text-islamic" />
            ) : isConnectionIssue ? (
              <WifiOff className="size-12 text-islamic" />
            ) : (
              <CloudOff className="size-12 text-islamic" />
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-islamic-dark mb-3">
            {t('serverError.title')}
          </h1>

          {/* Arabic ornament */}
          <p className="text-golden/70 font-serif mb-4" dir="rtl">
            إنَّ مَعَ الْعُسْرِ يُسْرًا
          </p>

          {/* Message */}
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-8">
            {isConnectionIssue ? t('serverError.message') : t('serverError.notConfigured')}
          </p>

          {/* Retry button */}
          <Button
            onClick={handleRetry}
            disabled={busy}
            size="lg"
            className="bg-islamic hover:bg-islamic-light text-white px-8 gap-2 rounded-xl shadow-md"
          >
            <RefreshCw className={`size-4 ${busy ? 'animate-spin' : ''}`} />
            {busy ? t('serverError.retrying') : t('serverError.retry')}
          </Button>

          {/* Retry hint */}
          {isRetry && (
            <p className="text-xs text-muted-foreground/70 mt-6">
              {t('serverError.partialData')}
            </p>
          )}
        </motion.div>
      </main>
    </div>
  );
}
