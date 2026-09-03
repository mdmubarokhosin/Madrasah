'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Megaphone,
  Users,
  MapPin,
  Calendar,
  Phone,
  Filter,
  Globe,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

// type values come from Firebase; map them to i18n keys for display
const programTypeLabels: Record<string, string> = {
  jamat: 'dawahPage.typeJamat',
  bayan: 'dawahPage.typeBayan',
  tajweed: 'dawahPage.typeTajweed',
  dars: 'dawahPage.typeDars',
  other: 'dawahPage.typeOther',
};

// status values come from Firebase; map them to i18n keys for display
const programStatusConfig: Record<string, { labelKey: string; cls: string }> = {
  upcoming: { labelKey: 'dawah.upcoming', cls: 'bg-blue-100 text-blue-700' },
  ongoing: { labelKey: 'dawah.ongoing', cls: 'bg-green-100 text-green-700' },
  completed: { labelKey: 'dawah.completed', cls: 'bg-gray-100 text-gray-700' },
};

export default function DawahPage() {
  const { dawahPrograms, dawahJamats, dataLoaded } = useAppStore();
  const { t } = useTranslation();
  const [filterType, setFilterType] = useState('all');

  const filteredPrograms = useMemo(() => {
    if (filterType === 'all') return dawahPrograms;
    return dawahPrograms.filter((p) => p.type === filterType);
  }, [dawahPrograms, filterType]);

  const activeJamats = dawahJamats.filter((j) => j.status === 'active');
  const totalPrograms = dawahPrograms.length;

  const programTypes = useMemo(
    () => [...new Set(dawahPrograms.map((p) => p.type).filter(Boolean))],
    [dawahPrograms]
  );

  if (!dataLoaded) return <PageSkeleton cards={6} showStats />;

  return (
    <div className="pt-0">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-islamic-dark via-islamic to-islamic-light overflow-hidden">
        <div className="absolute inset-0 islamic-pattern-overlay opacity-[0.06]" />
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-golden/5" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-golden via-golden-light to-golden" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <p className="text-golden text-xl md:text-2xl font-serif mb-3" dir="rtl">
              الدعوة والتبليغ
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              {t('dawah.title')}
            </h1>
            <p className="text-white/70 text-base md:text-lg max-w-2xl mx-auto">
              {t('dawahPage.subtitle')}
            </p>
            <div className="mt-6 flex items-center justify-center gap-2">
              <div className="w-16 h-[1px] bg-golden/50" />
              <div className="w-2 h-2 rounded-full bg-golden" />
              <div className="w-16 h-[1px] bg-golden/50" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats */}
      <section className="py-10 bg-gradient-to-r from-islamic-dark via-islamic to-islamic-light relative overflow-hidden">
        <div className="absolute inset-0 islamic-pattern-overlay opacity-[0.04]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-4"
          >
            {[
              { label: t('dawah.totalPrograms'), value: totalPrograms.toString(), icon: Megaphone },
              { label: t('dawah.activeJamats'), value: activeJamats.length.toString(), icon: Users },
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

      {/* Programs */}
      <section className="py-12 bg-islamic-lighter/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <h2 className="text-xl font-bold text-islamic-dark flex items-center gap-2">
              <Megaphone className="w-5 h-5" />
              {t('dawah.programs')}
            </h2>
            {programTypes.length > 0 && (
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder={t('common.type')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('dawahPage.allTypes')}</SelectItem>
                  {programTypes.map((tp) => (
                    <SelectItem key={tp} value={tp}>
                      {programTypeLabels[tp] ? t(programTypeLabels[tp]) : tp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {filteredPrograms.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredPrograms.map((program) => (
                <motion.div key={program.id} variants={itemVariants}>
                  <Card className="h-full hover:shadow-lg transition-shadow border border-gray-100">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="font-bold text-islamic-dark text-sm line-clamp-2">{program.title}</h3>
                        <Badge
                          className={`text-xs border-0 whitespace-nowrap flex-shrink-0 ${programStatusConfig[program.status]?.cls || 'bg-gray-100 text-gray-700'}`}
                        >
                          {programStatusConfig[program.status]
                            ? t(programStatusConfig[program.status].labelKey)
                            : program.status}
                        </Badge>
                      </div>

                      {program.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{program.description}</p>
                      )}

                      <div className="space-y-1.5 text-sm text-muted-foreground">
                        <p className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="text-islamic-dark font-medium">{program.date}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{program.location}</span>
                        </p>
                        {program.coordinatorName && (
                          <p className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{program.coordinatorName}</span>
                          </p>
                        )}
                      </div>

                      <div className="mt-3 pt-3 border-t flex items-center justify-between">
                        <Badge className="bg-islamic/10 text-islamic border-0 text-xs">
                          {programTypeLabels[program.type] ? t(programTypeLabels[program.type]) : program.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {t('dawahPage.participants', { count: program.participantCount })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Megaphone className="size-16 opacity-15 mb-4" />
              <p className="text-base font-medium">{t('dawahPage.noPrograms')}</p>
            </div>
          )}
        </div>
      </section>

      {/* Active Jamats */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-islamic-dark mb-6 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            {t('dawah.activeJamats')}
          </h2>

          {activeJamats.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {activeJamats.map((jamat) => (
                <motion.div key={jamat.id} variants={itemVariants}>
                  <Card className="h-full hover:shadow-lg transition-shadow border border-gray-100">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-islamic-lighter flex items-center justify-center flex-shrink-0">
                          <Users className="w-5 h-5 text-islamic" />
                        </div>
                        <div>
                          <h3 className="font-bold text-islamic-dark text-sm">{jamat.name}</h3>
                          <p className="text-sm text-muted-foreground">{t('dawah.leader')}: {jamat.leaderName}</p>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-sm text-muted-foreground">
                        <p className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="text-islamic-dark font-medium">{jamat.currentLocation}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{t('dawahPage.departure')}: {jamat.departureDate}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{t('dawahPage.return')}: {jamat.returnDate}</span>
                        </p>
                      </div>

                      <div className="mt-3 pt-3 border-t flex items-center justify-between">
                        <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                          {t('common.active')}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {t('dawahPage.memberCount', { count: jamat.memberCount })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Globe className="size-16 opacity-15 mb-4" />
              <p className="text-base font-medium">{t('dawahPage.noActiveJamats')}</p>
            </div>
          )}
        </div>
      </section>

      <BackToTop />
    </div>
  );
}
