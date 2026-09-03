'use client';

import { useState } from 'react';
import { History, Search, Filter } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Bengali keywords below match `log.action` values stored in Firebase
// (activity-log data is written in Bengali) — used only for color-coding,
// NOT for display. Do not translate.
const actionColors: Record<string, string> = {
  'লগইন': 'bg-blue-100 text-blue-700',
  'লগআউট': 'bg-gray-100 text-gray-700',
  'নোটিশ': 'bg-amber-100 text-amber-700',
  'শিক্ষক': 'bg-emerald-100 text-emerald-700',
  'বিভাগ': 'bg-purple-100 text-purple-700',
  'ছাত্র': 'bg-cyan-100 text-cyan-700',
  'পরীক্ষা': 'bg-orange-100 text-orange-700',
  'রেজাল্ট': 'bg-red-100 text-red-700',
  'ব্লগ': 'bg-pink-100 text-pink-700',
  'গ্যালারি': 'bg-indigo-100 text-indigo-700',
  'ভর্তি': 'bg-teal-100 text-teal-700',
  'দান': 'bg-rose-100 text-rose-700',
  'সেটিংস': 'bg-slate-100 text-slate-700',
  'মেসেজ': 'bg-violet-100 text-violet-700',
  'ইভেন্ট': 'bg-lime-100 text-lime-700',
  'ভর্তি আবেদন': 'bg-sky-100 text-sky-700',
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
    return 'bg-gray-100 text-gray-700';
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
              className={`flex gap-4 py-3 ${index < filtered.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getActionColor(log.action)}`}>
                  {log.action.charAt(0)}
                </div>
                {index < filtered.length - 1 && (
                  <div className="w-px flex-1 bg-gray-200 mt-1" />
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
                <p className="text-sm text-gray-600 truncate">{log.details}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-muted-foreground">
            {search ? t('adminActivityLog.noResults') : t('adminActivityLog.noLogs')}
          </p>
        </div>
      )}
    </div>
  );
}
