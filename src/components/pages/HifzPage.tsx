'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Filter, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const statusColorMap: Record<string, string> = {
  memorizing: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  reviewed: 'bg-blue-100 text-blue-800 border-blue-200',
  tested: 'bg-purple-100 text-purple-800 border-purple-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
};

export default function HifzPage() {
  const { hifzRecords, departments, dataLoaded } = useAppStore();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = useMemo(() => {
    return hifzRecords.filter((r) => {
      const matchSearch =
        !searchTerm ||
        r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.studentRoll.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.surahName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchDept = filterDept === 'all' || r.department === filterDept;
      const matchStatus = filterStatus === 'all' || r.status === filterStatus;
      return matchSearch && matchDept && matchStatus;
    });
  }, [hifzRecords, searchTerm, filterDept, filterStatus]);

  if (!dataLoaded) return <PageSkeleton cards={6} showStats />;

  return (
    <div className="pt-0">
      <PageBanner
        titleKey="hifz.title"
        arabicText="حافظ القرآن الكريم"
        subtitleKey="hifz.subtitle"
      />

      {/* Stats */}
      <section className="py-10 bg-gradient-to-r from-islamic-dark via-islamic to-islamic-light relative overflow-hidden">
        <div className="absolute inset-0 islamic-pattern-overlay opacity-[0.04]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { label: t('hifz.totalRecords'), value: hifzRecords.length.toString(), icon: BookOpen },
              { label: t('hifz.memorizing'), value: hifzRecords.filter((r) => r.status === 'active').length.toString(), icon: BookOpen },
              { label: t('hifz.completed'), value: hifzRecords.filter((r) => r.status === 'completed').length.toString(), icon: BookOpen },
              { label: t('hifzPage.paused'), value: hifzRecords.filter((r) => r.status === 'paused').length.toString(), icon: BookOpen },
            ].map((stat, i) => (
              <motion.div key={i} variants={itemVariants}>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 text-center border border-white/10 hover:bg-white/15 transition-colors">
                  <stat.icon className="w-6 h-6 text-golden mx-auto mb-2" />
                  <p className="text-xl md:text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-white/60 mt-1">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Filters & Content */}
      <section className="py-12 bg-islamic-lighter/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-3 mb-8"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('hifz.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label={t('hifz.searchPlaceholder')}
                className="pl-10"
              />
            </div>
            <Select value={filterDept} onValueChange={setFilterDept}>
              <SelectTrigger className="w-full sm:w-44" aria-label={t('hifz.department')}>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder={t('hifz.department')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('hifz.allDepartments')}</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.name}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-44" aria-label={t('hifz.status')}>
                <SelectValue placeholder={t('hifz.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('hifz.allStatus')}</SelectItem>
                <SelectItem value="memorizing">{t('hifz.memorizing')}</SelectItem>
                <SelectItem value="reviewed">{t('hifz.reviewed')}</SelectItem>
                <SelectItem value="tested">{t('hifz.tested')}</SelectItem>
                <SelectItem value="completed">{t('hifz.completed')}</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>

          {/* Cards Grid */}
          {filtered.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filtered.map((record) => (
                <motion.div key={record.id} variants={itemVariants}>
                  <Card className="h-full hover:shadow-lg transition-shadow border border-gray-100">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-base font-bold text-islamic-dark">{record.studentName}</h3>
                          <p className="text-sm text-muted-foreground">{t('exam.roll')} {record.studentRoll}</p>
                          <p className="text-xs text-muted-foreground">{record.department}</p>
                        </div>
                        <Badge className={`${statusColorMap[record.status] || 'bg-gray-100 text-gray-800'} text-xs border-0`}>
                          {t(`hifz.${record.status}`)}
                        </Badge>
                      </div>

                      <div className="bg-islamic-lighter/30 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <BookOpen className="w-4 h-4 text-islamic" />
                          <span className="font-semibold text-islamic-dark text-sm">{record.surahName}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t('hifz.fromAyah')} {String(record.fromAyah || '')} {t('hifz.toAyah')} {String(record.toAyah || '')}
                        </p>
                      </div>

                      {record.testedBy && (
                        <p className="text-xs text-muted-foreground">
                          {t('hifz.examiner')} {record.testedBy} {record.testDate && `| ${t('hifz.date')} ${record.testDate}`}
                        </p>
                      )}
                      {record.grade && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          {t('hifz.grade')} {record.grade}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <BookOpen className="size-16 opacity-15 mb-4" />
              <p className="text-base font-medium">{t('hifz.noData')}</p>
            </div>
          )}
        </div>
      </section>

      <BackToTop />
    </div>
  );
}
