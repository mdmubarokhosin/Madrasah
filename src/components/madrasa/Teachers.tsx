'use client';

import { motion } from 'framer-motion';
import { Users, FolderOpen } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import SectionHeading from './SectionHeading';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { loc } from '@/lib/multilingual';

export default function Teachers({ hideHeading }: { hideHeading?: boolean }) {
  const { teachers: storeTeachers } = useAppStore();
  const { t, language } = useTranslation();

  const getInitials = (name: string) => name.split(' ').filter(w => w.length > 0).slice(0, 2).map(w => w[0]).join('');

  return (
    <section id="teachers" className="py-12 md:py-20 bg-white relative">
      <div className="absolute inset-0 islamic-pattern-bg pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {!hideHeading && (
          <SectionHeading
            title={t('teachers.title')}
            subtitle={t('teachers.subtitle')}
            arabicText={t('teachers.arabic')}
          />
        )}

        {storeTeachers.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {storeTeachers.map((teacher, index) => (
              <motion.div
                key={teacher.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
              >
                <Card className="h-full text-center hover:shadow-lg transition-shadow duration-300 border-0 shadow-sm group">
                  <CardContent className="p-6">
                    <Avatar className="w-20 h-20 mx-auto mb-4 border-4 border-islamic-lighter group-hover:border-islamic transition-colors">
                      {teacher.imageUrl ? (
                        <img src={teacher.imageUrl} alt={teacher.name} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <AvatarFallback className="bg-islamic-lighter text-islamic-dark font-bold text-lg">
                          {getInitials(teacher.name)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <p className="text-golden text-xs font-serif mb-1" dir="rtl">
                      {teacher.nameAr}
                    </p>
                    <h3 className="text-base font-bold text-islamic-dark mb-1 leading-tight">
                      {loc(language, teacher, 'name')}
                    </h3>
                    <p className="text-sm font-medium text-islamic mb-2">
                      {loc(language, teacher, 'designation')}
                    </p>
                    <p className="text-xs text-muted-foreground">{loc(language, teacher, 'qualification')}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FolderOpen className="size-12 opacity-20 mb-3" />
            <p className="text-sm">{t('teachers.noData')}</p>
          </div>
        )}
      </div>
    </section>
  );
}
