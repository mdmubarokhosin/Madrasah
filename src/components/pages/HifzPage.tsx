'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Filter, Search } from 'lucide-react';
import { Card } from '@heroui/react/card';
import { Chip } from '@heroui/react/chip';
import { Input } from '@heroui/react/input';
import { Select } from '@heroui/react/select';
import { ListBox } from '@heroui/react/list-box';
import PageBanner from '@/components/pages/PageBanner';
import BackToTop from '@/components/pages/BackToTop';
import { useAppStore } from '@/store/app-store';
import { StatCard } from '@/components/heroui/islamic';
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
  memorizing: 'bg-golden-lighter text-golden border-golden/30',
  reviewed: 'bg-islamic-lighter text-islamic-dark border-islamic/20',
  tested: 'bg-golden text-white border-golden',
  completed: 'bg-emerald-deep text-white border-emerald-deep',
};

export default function HifzPage() {
  const { hifzRecords, departments } = useAppStore();
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
              { label: t('hifz.memorizing'), value: hifzRecords.filter((r) => r.status === 'memorizing').length.toString(), icon: BookOpen },
              { label: t('hifz.completed'), value: hifzRecords.filter((r) => r.status === 'completed').length.toString(), icon: BookOpen },
              { label: t('hifz.reviewed'), value: hifzRecords.filter((r) => r.status === 'reviewed').length.toString(), icon: BookOpen },
            ].map((stat, i) => (
              <motion.div key={i} variants={itemVariants}>
                <StatCard dark tone={i % 2 === 0 ? 'emerald' : 'gold'} icon={stat.icon} value={stat.value} label={stat.label} />
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
                      fullWidth
                placeholder={t('hifz.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label={t('hifz.searchPlaceholder')}
                className="pl-10"
              />
            </div>
            <Select
              aria-label={t('hifz.department')}
              placeholder={t('hifz.department')}
              value={filterDept || null}
              onChange={(val) => setFilterDept(val == null ? '' : String(val))}
            >
              <Select.Trigger className="w-full sm:w-44">
                <Filter className="w-4 h-4 mr-2" />
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover className="rounded-xl border border-islamic/15 bg-white shadow-xl">
                <ListBox aria-label={t('hifz.department')}>
                  <ListBox.Item id="all" textValue={t('hifz.allDepartments')} className="rounded-lg px-3 py-2 text-sm data-[selected=true]:bg-islamic-lighter data-[hovered=true]:bg-islamic-lighter/60">
                    {t('hifz.allDepartments')}
                  </ListBox.Item>
                  {departments.map((d) => (
                    <ListBox.Item key={d.id} id={d.name} textValue={d.name} className="rounded-lg px-3 py-2 text-sm data-[selected=true]:bg-islamic-lighter data-[hovered=true]:bg-islamic-lighter/60">
                      {d.name}
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
            <Select
              aria-label={t('hifz.status')}
              placeholder={t('hifz.status')}
              value={filterStatus || null}
              onChange={(val) => setFilterStatus(val == null ? '' : String(val))}
            >
              <Select.Trigger className="w-full sm:w-44">
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover className="rounded-xl border border-islamic/15 bg-white shadow-xl">
                <ListBox aria-label={t('hifz.status')}>
                  <ListBox.Item id="all" textValue={t('hifz.allStatus')} className="rounded-lg px-3 py-2 text-sm data-[selected=true]:bg-islamic-lighter data-[hovered=true]:bg-islamic-lighter/60">
                    {t('hifz.allStatus')}
                  </ListBox.Item>
                  <ListBox.Item id="memorizing" textValue={t('hifz.memorizing')} className="rounded-lg px-3 py-2 text-sm data-[selected=true]:bg-islamic-lighter data-[hovered=true]:bg-islamic-lighter/60">
                    {t('hifz.memorizing')}
                  </ListBox.Item>
                  <ListBox.Item id="reviewed" textValue={t('hifz.reviewed')} className="rounded-lg px-3 py-2 text-sm data-[selected=true]:bg-islamic-lighter data-[hovered=true]:bg-islamic-lighter/60">
                    {t('hifz.reviewed')}
                  </ListBox.Item>
                  <ListBox.Item id="tested" textValue={t('hifz.tested')} className="rounded-lg px-3 py-2 text-sm data-[selected=true]:bg-islamic-lighter data-[hovered=true]:bg-islamic-lighter/60">
                    {t('hifz.tested')}
                  </ListBox.Item>
                  <ListBox.Item id="completed" className="rounded-lg px-3 py-2 text-sm data-[selected=true]:bg-islamic-lighter data-[hovered=true]:bg-islamic-lighter/60">
                    {t('hifz.completed')}
                  </ListBox.Item>
                </ListBox>
              </Select.Popover>
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
                  <Card className="h-full hover:shadow-lg transition-shadow border border-border">
                    <Card.Content className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-base font-bold text-islamic-dark">{record.studentName}</h3>
                          <p className="text-sm text-muted-foreground">{t('exam.roll')} {record.studentRoll}</p>
                          <p className="text-xs text-muted-foreground">{record.department}</p>
                        </div>
                        <Chip className={`${statusColorMap[record.status] || 'bg-surface-tertiary text-muted-foreground border-border'} text-xs border-0`}>
                          {t(`hifz.${record.status}`)}
                        </Chip>
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
                        <Chip className="mt-2 text-xs">
                          {t('hifz.grade')} {record.grade}
                        </Chip>
                      )}
                    </Card.Content>
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
