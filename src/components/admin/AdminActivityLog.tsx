'use client';

import { useState } from 'react';
import { History, Search } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// Bengali keywords below match `log.action` values stored in Firebase
// (activity-log data is written in Bengali) — used only for color-coding,
// NOT for display. Do not translate.
const actionColors: Record<string, string> = {
  'লগইন': 'bg-islamic-lighter text-islamic-dark',
  'লগআউট': 'bg-surface-tertiary text-muted-foreground',
  'নোটিশ': 'bg-warning/20 text-warning-foreground',
  'শিক্ষক': 'bg-primary/10 text-primary',
  'বিভাগ': 'bg-golden-lighter text-golden',
  'ছাত্র': 'bg-accent/10 text-accent',
  'পরীক্ষা': 'bg-warning/20 text-warning-foreground',
  'রেজাল্ট': 'bg-danger/10 text-danger',
  'ব্লগ': 'bg-accent/10 text-accent',
  'গ্যালারি': 'bg-islamic-lighter text-islamic-dark',
  'ভর্তি': 'bg-primary/10 text-primary',
  'দান': 'bg-danger/10 text-danger',
  'সেটিংস': 'bg-surface-tertiary text-muted-foreground',
  'মেসেজ': 'bg-golden-lighter text-golden',
  'ইভেন্ট': 'bg-success/15 text-success-foreground',
  'ভর্তি আবেদন': 'bg-islamic-lighter text-islamic-dark',
};

export default function AdminActivityLog() {
  const { activityLogs } = useAppStore();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const filtered = activityLogs.filter((log) =>
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.details.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (timestamp: number) => {
    try {
      return new Date(timestamp).toLocaleString('bn-BD', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const getActionColor = (action: string) => {
    for (const [key, color] of Object.entries(actionColors)) {
      if (action.includes(key)) return color;
    }
    return 'bg-surface-tertiary text-muted-foreground';
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-bold text-islamic-dark">{t('admin.activityLog')}</h2>
        <p className="text-muted-foreground text-sm mt-1">
          {t('adminActivityLog.subtitle')}
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t('adminActivityLog.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Activity Timeline */}
      {filtered.length > 0 ? (
        <div className="space-y-0">
          {filtered.map((log, index) => (
            <div
              key={log.id}
              className={`flex gap-4 py-3 ${index < filtered.length - 1 ? 'border-b border-border' : ''}`}
            >
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getActionColor(log.action)}`}>
                  {log.action.charAt(0)}
                </div>
                {index < filtered.length - 1 && (
                  <div className="w-px flex-1 bg-border mt-1" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={`${getActionColor(log.action)} text-xs px-2 py-0`}>
                    {log.action}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(log.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{log.details}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <History className="w-12 h-12 text-muted-foreground/70 mx-auto mb-3" />
          <p className="text-muted-foreground">
            {search ? t('adminActivityLog.noResults') : t('adminActivityLog.noLogs')}
          </p>
        </div>
      )}
    </div>
  );
}
