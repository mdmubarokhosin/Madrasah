'use client';

import { motion } from 'framer-motion';
import { FolderOpen } from 'lucide-react';
import { Heading } from '@heroui/react/typography';
import { Avatar } from '@heroui/react/avatar';
import SectionHeading from './SectionHeading';
import { HCard, HChip } from '@/components/heroui/islamic';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { loc } from '@/lib/multilingual';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function Teachers({ hideHeading }: { hideHeading?: boolean }) {
  const { teachers: storeTeachers } = useAppStore();
  const { t, language } = useTranslation();

  const getInitials = (name: string) => name.split(' ').filter(w => w.length > 0).slice(0, 2).map(w => w[0]).join('');

  return (
    <section id="teachers" className="paper relative bg-paper py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!hideHeading && (
          <SectionHeading
            title={t('teachers.title')}
            subtitle={t('teachers.subtitle')}
            arabicText={t('teachers.arabic')}
          />
        )}

        {storeTeachers.length > 0 ? (
          // Flex-wrap roster: rows centre themselves, so a short roster
          // (even a single teacher) reads as intentional, not half-empty.
          <div className="flex flex-wrap justify-center gap-5 md:gap-6">
            {storeTeachers.map((teacher, index) => (
              <motion.div
                key={teacher.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.08, ease: EASE }}
                className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.125rem)]"
              >
                <HCard className="h-full text-center group" topRule="emerald-gold">
                  {/* Warm emerald wash behind the card surface */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-br from-islamic-lighter/40 to-transparent"
                  />
                  <div className="relative w-full p-6">
                    {/* Avatar inside a gold double ring */}
                    <div className="mx-auto mb-4 w-fit rounded-full bg-gradient-to-br from-gold-soft via-gold-bright to-golden p-1 transition-transform duration-500 group-hover:rotate-6">
                      <div className="rounded-full ring-4 ring-white">
                        <Avatar className="size-24">
                          {teacher.imageUrl ? (
                            <Avatar.Image
                              src={teacher.imageUrl}
                              alt={teacher.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : null}
                          <Avatar.Fallback className="bg-islamic-lighter text-islamic-dark font-bold text-lg">
                            {getInitials(teacher.name)}
                          </Avatar.Fallback>
                        </Avatar>
                      </div>
                    </div>
                    {teacher.nameAr ? (
                      <p className="mb-1 text-gold-bright text-xs font-serif" dir="rtl">
                        {teacher.nameAr}
                      </p>
                    ) : null}
                    <Heading level={3} className="mb-2 text-base font-bold text-islamic-dark leading-tight">
                      {loc(language, teacher, 'name')}
                    </Heading>
                    <p className="mb-3">
                      <HChip variant="gold">
                        {loc(language, teacher, 'designation')}
                      </HChip>
                    </p>
                    <p className="text-xs text-muted-foreground">{loc(language, teacher, 'qualification')}</p>
                  </div>
                </HCard>
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
