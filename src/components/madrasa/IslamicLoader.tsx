'use client';

import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';

export default function IslamicLoader() {
  const { siteInfo } = useAppStore();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-islamic-lighter via-white to-golden-lighter/30">
      <div className="text-center space-y-6">
        {/* Islamic geometric spinner */}
        <div className="relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 border-4 border-islamic/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-transparent border-t-islamic rounded-full animate-spin" />
          <div className="absolute inset-2 border-4 border-transparent border-b-golden rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          {/* Center Bismillah */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-islamic text-lg font-semibold">بِسْمِ</span>
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-islamic-dark font-semibold text-lg">{siteInfo?.name || t('common.appName')}</h2>
          <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
        </div>
        {/* Decorative divider */}
        <div className="islamic-divider max-w-[200px] mx-auto">
          <span className="text-golden text-sm">&#9733;</span>
        </div>
      </div>
    </div>
  );
}
