'use client';

import { motion } from 'framer-motion';
import { Clock, BookOpen, Users, Timer, FolderOpen, CalendarDays } from 'lucide-react';
import PageBanner from '@/components/pages/PageBanner';
import BackToTop from '@/components/pages/BackToTop';
import PageSkeleton from '@/components/pages/PageSkeleton';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';

export default function ClassRoutinePage() {
  const { classRoutine, dataLoaded } = useAppStore();
  const { t } = useTranslation();

  if (!dataLoaded) return <PageSkeleton />;

  return (
    <div className="pt-0">
      <PageBanner
        titleKey="classRoutine.title"
        arabicText="جدول الحصص"
        subtitleKey="classRoutine.subtitle"
      />

      <section className="py-12 md:py-16 bg-gradient-to-b from-white to-islamic-lighter/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {classRoutine.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-16 text-muted-foreground"
            >
              <FolderOpen className="size-16 opacity-20 mb-4" />
              <p className="text-lg font-medium">{t('classRoutine.noData')}</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl overflow-hidden shadow-xl border border-islamic/10 bg-white"
            >
              {/* Table header decoration */}
              <div className="h-1 bg-gradient-to-r from-islamic-dark via-golden to-islamic-dark" />

              {/* Responsive table wrapper */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <caption className="sr-only">{t('classRoutine.title')}</caption>
                  <thead>
                    <tr className="bg-gradient-to-r from-islamic-dark via-islamic to-islamic-light">
                      <th className="text-left py-4 px-4 md:px-6 text-sm font-semibold text-white whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-golden" />
                          {t('classRoutine.time')}
                        </div>
                      </th>
                      <th className="text-left py-4 px-4 md:px-6 text-sm font-semibold text-white whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-golden" />
                          {t('classRoutine.subject')}
                        </div>
                      </th>
                      <th className="text-left py-4 px-4 md:px-6 text-sm font-semibold text-white whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-golden" />
                          {t('classRoutine.teacher')}
                        </div>
                      </th>
                      <th className="text-left py-4 px-4 md:px-6 text-sm font-semibold text-white whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Timer className="w-4 h-4 text-golden" />
                          {t('classRoutine.duration')}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* eslint-disable-next-line react/no-array-index-key -- no unique id available on routine items */}
                    {classRoutine.map((item, index) => (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={`border-b border-islamic/5 transition-colors hover:bg-islamic-lighter/20 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-islamic-lighter/5'
                        }`}
                      >
                        <td className="py-4 px-4 md:px-6">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-golden/10 flex items-center justify-center flex-shrink-0">
                              <CalendarDays className="w-4 h-4 text-golden" />
                            </div>
                            <span className="text-sm font-medium text-islamic-dark whitespace-nowrap">
                              {item.time}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 md:px-6">
                          <span className="text-sm font-semibold text-islamic-dark">
                            {item.subject}
                          </span>
                        </td>
                        <td className="py-4 px-4 md:px-6">
                          <span className="text-sm text-gray-600 whitespace-nowrap">
                            {item.teacher}
                          </span>
                        </td>
                        <td className="py-4 px-4 md:px-6">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-islamic/5 text-islamic text-xs font-medium whitespace-nowrap">
                            {item.duration}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottom decoration */}
              <div className="h-1 bg-gradient-to-r from-islamic-dark via-golden to-islamic-dark" />
            </motion.div>
          )}

          {/* Decorative bottom element */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-12 flex items-center justify-center gap-3 text-muted-foreground/40"
          >
            <div className="w-16 h-px bg-islamic/20" />
            <Clock className="w-4 h-4" />
            <div className="w-16 h-px bg-islamic/20" />
          </motion.div>
        </div>
      </section>

      <BackToTop />
    </div>
  );
}
