'use client';

import { motion } from 'framer-motion';
import { BookOpen, GraduationCap, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageBanner from '@/components/pages/PageBanner';
import BackToTop from '@/components/pages/BackToTop';
import PageSkeleton from '@/components/pages/PageSkeleton';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const syllabusColors = [
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-purple-100 text-purple-700 border-purple-200',
  'bg-rose-100 text-rose-700 border-rose-200',
  'bg-teal-100 text-teal-700 border-teal-200',
  'bg-orange-100 text-orange-700 border-orange-200',
  'bg-indigo-100 text-indigo-700 border-indigo-200',
];

export default function SyllabusPage() {
  const { syllabus, dataLoaded } = useAppStore();
  const { t } = useTranslation();

  if (!dataLoaded) {
    return <PageSkeleton cards={4} showBanner />;
  }

  return (
    <div className="pt-0">
      <PageBanner
        titleKey="syllabus.title"
        arabicText="المنهج الدراسي"
        subtitleKey="syllabus.subtitle"
      />

      <section className="py-12 md:py-16 bg-islamic-lighter/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {syllabus.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid sm:grid-cols-2 gap-4"
            >
              {syllabus.map((item, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="h-full hover:shadow-lg transition-all border border-gray-100 hover:border-islamic/20 group">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-islamic-lighter flex items-center justify-center flex-shrink-0 group-hover:bg-islamic group-hover:text-white transition-colors">
                          <BookOpen className="w-6 h-6 text-islamic group-hover:text-white transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-islamic-dark mb-1 truncate">
                            {item.name}
                          </h3>
                          <div className="flex items-center gap-2">
                            <Calendar className="size-3.5 text-muted-foreground" />
                            <Badge variant="outline" className={`text-xs ${syllabusColors[index % syllabusColors.length]}`}>
                              {t('syllabus.year')}: {item.year}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-20">
              <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">{t('syllabus.noData')}</p>
              <p className="text-sm text-muted-foreground/70 mt-1">{t('syllabus.noAdminData')}</p>
            </div>
          )}
        </div>
      </section>

      <BackToTop />
    </div>
  );
}
