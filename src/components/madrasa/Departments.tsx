'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Book, Scale, Star, GraduationCap, FolderOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import SectionHeading from './SectionHeading';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { loc } from '@/lib/multilingual';

const iconMap: Record<string, React.ComponentType<any>> = { BookOpen, Book, Scale, Star, GraduationCap };

export default function Departments({ hideHeading }: { hideHeading?: boolean }) {
  const { departments: storeDepts } = useAppStore();
  const { t, language } = useTranslation();

  const departments = storeDepts.map((dept) => ({
    icon: iconMap[dept.icon] || BookOpen,
    title: loc(language, dept, 'name'),
    titleAr: dept.nameAr,
    description: loc(language, dept, 'description'),
    imageUrl: dept.imageUrl || '',
    color: 'bg-islamic-lighter text-islamic',
    borderColor: 'border-islamic/20',
  }));

  return (
    <section id="departments" className="py-12 md:py-20 bg-islamic-lighter/30 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!hideHeading && (
          <SectionHeading
            title={t('departments.title')}
            subtitle={t('departments.subtitle')}
            arabicText={t('departments.arabic')}
          />
        )}

        {departments.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {departments.map((dept, index) => (
              <motion.div
                key={dept.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card
                  className={`h-full border ${dept.borderColor} hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white group overflow-hidden`}
                >
                  {dept.imageUrl && (
                    <div className="h-40 overflow-hidden">
                      <img
                        src={dept.imageUrl}
                        alt={dept.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <CardContent className={`p-6 text-center ${!dept.imageUrl ? '' : 'pt-4'}`}>
                    {!dept.imageUrl && (
                      <div
                        className={`w-16 h-16 rounded-full ${dept.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}
                      >
                        <dept.icon className="w-8 h-8" />
                      </div>
                    )}
                    <p className="text-golden font-serif text-sm mb-1" dir="rtl">
                      {dept.titleAr}
                    </p>
                    <h3 className="text-lg font-bold text-islamic-dark mb-3">
                      {dept.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {dept.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FolderOpen className="size-12 opacity-20 mb-3" />
            <p className="text-sm">{t('departments.noData')}</p>
          </div>
        )}
      </div>
    </section>
  );
}
