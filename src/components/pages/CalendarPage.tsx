'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CalendarDays, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import PageBanner from '@/components/pages/PageBanner';
import BackToTop from '@/components/pages/BackToTop';
import PageSkeleton from '@/components/pages/PageSkeleton';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';

const typeColorMap: Record<string, { bg: string; text: string; dot: string }> = {
  holiday: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', dot: 'bg-red-500' },
  exam: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' },
  event: { bg: 'bg-green-50 border-green-200', text: 'text-green-700', dot: 'bg-green-500' },
  deadline: { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', dot: 'bg-orange-500' },
  academic: { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700', dot: 'bg-purple-500' },
};

const typeBadgeMap: Record<string, string> = {
  holiday: 'bg-red-100 text-red-800 border-red-200',
  exam: 'bg-blue-100 text-blue-800 border-blue-200',
  event: 'bg-green-100 text-green-800 border-green-200',
  deadline: 'bg-orange-100 text-orange-800 border-orange-200',
  academic: 'bg-purple-100 text-purple-800 border-purple-200',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function CalendarPage() {
  const { calendarEvents, dataLoaded } = useAppStore();
  const { t, language } = useTranslation();
  const [filterType, setFilterType] = useState('all');

  // Language-aware month/date formatting (bn-BD / ar-EG / en-US)
  const locale = language === 'bn' ? 'bn-BD' : language === 'ar' ? 'ar-EG' : 'en-US';
  const monthYearLabel = (year: number, monthIndex: number) =>
    new Date(year, monthIndex, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  const monthShort = (monthIndex: number) =>
    new Date(2000, monthIndex, 1).toLocaleDateString(locale, { month: 'short' });

  const sorted = useMemo(() => {
    return [...calendarEvents]
      .filter((e) => filterType === 'all' || e.type === filterType)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [calendarEvents, filterType]);

  // Group by month
  const grouped = useMemo(() => {
    const groups: Record<string, typeof calendarEvents> = {};
    sorted.forEach((ev) => {
      const d = new Date(ev.date);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(ev);
    });
    return groups;
  }, [sorted]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (!dataLoaded) return <PageSkeleton cards={5} showStats />;

  return (
    <div className="pt-0">
      <PageBanner
        titleKey="calendar.title"
        arabicText="التقويم الأكاديمي"
        subtitleKey="calendar.subtitle"
      />

      <section className="py-12 bg-islamic-lighter/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-8"
          >
            {[
              { type: 'holiday', label: t('calendar.holiday'), count: calendarEvents.filter((e) => e.type === 'holiday').length },
              { type: 'exam', label: t('calendar.exam'), count: calendarEvents.filter((e) => e.type === 'exam').length },
              { type: 'event', label: t('calendar.event'), count: calendarEvents.filter((e) => e.type === 'event').length },
              { type: 'deadline', label: t('calendar.deadline'), count: calendarEvents.filter((e) => e.type === 'deadline').length },
              { type: 'academic', label: t('calendar.academic'), count: calendarEvents.filter((e) => e.type === 'academic').length },
            ].map((s) => (
              <div
                key={s.type}
                role="button"
                tabIndex={0}
                aria-label={`${s.label}: ${s.count}`}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFilterType(filterType === s.type ? 'all' : s.type); } }}
                className={`${typeColorMap[s.type].bg} border rounded-lg p-3 text-center cursor-pointer hover:shadow-md transition-shadow`}
                onClick={() => setFilterType(filterType === s.type ? 'all' : s.type)}
              >
                <p className={`text-xl font-bold ${typeColorMap[s.type].text}`}>{s.count}</p>
                <p className={`text-xs ${typeColorMap[s.type].text}`}>{s.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Filter */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-6"
          >
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-56" aria-label={t('calendar.filterByType')}>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder={t('calendar.filterByType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('calendar.allTypes')}</SelectItem>
                <SelectItem value="holiday">{t('calendar.holiday')}</SelectItem>
                <SelectItem value="exam">{t('calendar.exam')}</SelectItem>
                <SelectItem value="event">{t('calendar.event')}</SelectItem>
                <SelectItem value="deadline">{t('calendar.deadline')}</SelectItem>
                <SelectItem value="academic">{t('calendar.academic')}</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>

          {/* Grouped Events */}
          {Object.keys(grouped).length > 0 ? (
            <div className="space-y-8">
              {Object.entries(grouped).map(([monthKey, events]) => {
                const [year, month] = monthKey.split('-').map(Number);
                return (
                  <motion.div
                    key={monthKey}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                  >
                    {/* Month Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <CalendarDays className="w-5 h-5 text-islamic" />
                      <h3 className="text-lg font-bold text-islamic-dark">
                        {monthYearLabel(year, month - 1)}
                      </h3>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    {/* Events List */}
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      className="space-y-3"
                    >
                      {events.map((ev) => {
                        const colors = typeColorMap[ev.type] || typeColorMap.academic;
                        return (
                          <motion.div key={ev.id} variants={itemVariants}>
                            <Card className={`${colors.bg} border overflow-hidden`}>
                              <CardContent className="p-4 flex items-start gap-4">
                                <div className="flex flex-col items-center bg-white rounded-lg p-2 min-w-[56px] shadow-sm">
                                  <span className="text-xl font-bold text-islamic-dark">
                                    {new Date(ev.date).toLocaleDateString(locale, { day: 'numeric' })}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {monthShort(new Date(ev.date).getMonth())}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                                    <h4 className="font-semibold text-islamic-dark text-sm truncate">
                                      {ev.title}
                                    </h4>
                                  </div>
                                  {ev.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                      {ev.description}
                                    </p>
                                  )}
                                  {ev.endDate && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {formatDate(ev.date)} - {formatDate(ev.endDate)}
                                    </p>
                                  )}
                                </div>
                                <Badge className={`${typeBadgeMap[ev.type] || typeBadgeMap.academic} text-xs border-0 flex-shrink-0`}>
                                  {t(`calendar.${ev.type}`)}
                                </Badge>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Calendar className="size-16 opacity-15 mb-4" />
              <p className="text-base font-medium">{t('calendar.noData')}</p>
            </div>
          )}
        </div>
      </section>

      <BackToTop />
    </div>
  );
}
