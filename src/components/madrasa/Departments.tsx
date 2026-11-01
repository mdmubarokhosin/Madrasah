'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Book, Scale, Star, GraduationCap, FolderOpen } from 'lucide-react';
import { Heading } from '@heroui/react/typography';
import SectionHeading from './SectionHeading';
import { HCard, HChip } from '@/components/heroui/islamic';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { loc } from '@/lib/multilingual';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const iconMap: Record<string, React.ComponentType<any>> = { BookOpen, Book, Scale, Star, GraduationCap };

export default function Departments({ hideHeading }: { hideHeading?: boolean }) {
  const { departments: storeDepts } = useAppStore();
  const { t, language } = useTranslation();

  const departments = storeDepts.map((dept) => ({
    id: dept.id,
    icon: iconMap[dept.icon] || BookOpen,
    title: loc(language, dept, 'name'),
    titleAr: dept.nameAr,
    description: loc(language, dept, 'description'),
    imageUrl: dept.imageUrl || '',
    videoUrl: dept.videoUrl || '',
    classes: dept.classes || [],
  }));

  // First department gets the editorial banner treatment; the rest
  // render as standard cards. One-of-each keeps the grid from looking
  // like a uniform template row.
  const [featured, ...rest] = departments;

  const media = (dept: (typeof departments)[number], className: string) =>
    dept.videoUrl ? (
      <video
        src={dept.videoUrl}
        muted
        loop
        autoPlay
        playsInline
        preload="metadata"
        className={className}
      />
    ) : (
      <img src={dept.imageUrl} alt={dept.title} className={className} />
    );

  return (
    <section id="departments" className="relative py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!hideHeading && (
          <SectionHeading
            title={t('departments.title')}
            subtitle={t('departments.subtitle')}
            arabicText={t('departments.arabic')}
          />
        )}

        {departments.length > 0 ? (
          <>
            {/* ── Featured department — horizontal banner card ── */}
            <motion.div
              key={featured.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, ease: EASE }}
              className="mb-5 md:mb-6"
            >
              <HCard className="h-full group p-0 gap-0">
                {/* Warm emerald wash behind the card surface */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-br from-islamic-lighter/40 to-transparent"
                />
                <div className="relative flex flex-col md:flex-row md:items-stretch">
                  {/* Copy — start-aligned, sits left on desktop */}
                  <div className="relative order-2 flex flex-1 flex-col justify-center p-6 pt-5 md:order-1 md:p-8 lg:p-9">
                    {featured.titleAr ? (
                      <p dir="rtl" className="mb-1.5 text-gold-bright font-serif text-sm">
                        {featured.titleAr}
                      </p>
                    ) : null}
                    <Heading level={3} className="mb-3 text-xl md:text-2xl font-bold text-islamic-dark text-start">
                      {featured.title}
                    </Heading>
                    <p className="text-sm md:text-[15px] text-gray-600 leading-[1.85] text-start line-clamp-4 md:line-clamp-5">
                      {featured.description}
                    </p>
                    {featured.classes.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {featured.classes.slice(0, 4).map((cls) => (
                          <HChip key={cls} size="sm" className="text-[11px]">
                            {cls}
                          </HChip>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Media — right on desktop, top on mobile */}
                  <div className="relative order-1 h-52 min-h-[13rem] overflow-hidden md:order-2 md:h-auto md:w-[42%] md:shrink-0">
                    {media(
                      featured,
                      'absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700'
                    )}
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-night/70 via-night/15 to-transparent pointer-events-none"
                    />
                  </div>
                </div>
              </HCard>
            </motion.div>

            {/* ── Remaining departments — standard vertical cards ── */}
            {rest.length > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                {rest.map((dept, index) => (
                  <motion.div
                    key={dept.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.55, delay: (index + 1) * 0.08, ease: EASE }}
                    className="h-full"
                  >
                    <HCard className="h-full group p-0 gap-0">
                      {/* Warm emerald wash behind the card surface */}
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-islamic-lighter/40 to-transparent"
                      />
                      {(dept.videoUrl || dept.imageUrl) ? (
                        <div className="relative h-44 md:h-48 overflow-hidden">
                          {media(
                            dept,
                            'absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
                          )}
                          <div
                            aria-hidden="true"
                            className="absolute inset-0 bg-gradient-to-t from-night/70 via-night/15 to-transparent pointer-events-none"
                          />
                          {dept.titleAr ? (
                            <p
                              dir="rtl"
                              className="absolute bottom-2.5 end-3.5 text-gold-soft font-serif text-sm drop-shadow-sm"
                            >
                              {dept.titleAr}
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <div className="relative px-6 pt-6">
                          <div className="flex items-center gap-3.5">
                            <div className="arch-soft flex size-14 shrink-0 items-center justify-center bg-gradient-to-br from-islamic-lighter to-white ring-1 ring-islamic/15 group-hover:scale-105 transition-transform duration-500">
                              <dept.icon className="size-7 text-islamic" />
                            </div>
                            {dept.titleAr ? (
                              <p className="text-gold-bright font-serif text-sm" dir="rtl">
                                {dept.titleAr}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      )}
                      <div className="relative flex flex-1 flex-col p-6 pt-4">
                        <Heading level={3} className="mb-2.5 text-lg font-bold text-islamic-dark text-start">
                          {dept.title}
                        </Heading>
                        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 text-start">
                          {dept.description}
                        </p>
                      </div>
                    </HCard>
                  </motion.div>
                ))}
              </div>
            )}
          </>
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
