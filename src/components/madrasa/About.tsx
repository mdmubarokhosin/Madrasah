'use client';

import { motion } from 'framer-motion';
import { Calendar, Users, GraduationCap, BookOpen, Eye, Target } from 'lucide-react';
import { Heading } from '@heroui/react/typography';
import SectionHeading from './SectionHeading';
import VideoBackground from './VideoBackground';
import RemotionBackground from './RemotionBackground';
import { HCard, StarBurst, StatCard, IconMedallion } from '@/components/heroui/islamic';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { loc } from '@/lib/multilingual';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function About({ hideHeading }: { hideHeading?: boolean }) {
  const { siteInfo } = useAppStore();
  const { t, language } = useTranslation();

  const about1 = loc(language, siteInfo, 'aboutText');
  const about2 = loc(language, siteInfo, 'aboutText2');
  const about3 = loc(language, siteInfo, 'aboutText3');
  const vision = loc(language, siteInfo, 'vision');
  const mission = loc(language, siteInfo, 'mission');
  const slogan =
    language === 'ar'
      ? siteInfo?.sloganAr || siteInfo?.slogan
      : language === 'en'
        ? siteInfo?.sloganEn || siteInfo?.slogan
        : siteInfo?.slogan;

  const stats = [
    { icon: Calendar, label: t('about.established'), value: siteInfo?.established || '—' },
    { icon: Users, label: t('about.totalStudents'), value: siteInfo?.totalStudents || '—' },
    { icon: GraduationCap, label: t('about.totalTeachers'), value: siteInfo?.totalTeachers || '—' },
    { icon: BookOpen, label: t('about.departments'), value: siteInfo?.totalDepts || '—' },
  ];

  const aboutParagraphs = [about1, about2, about3].filter((p): p is string => !!p);

  return (
    <section id="about" className="paper relative bg-paper py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!hideHeading && (
          <SectionHeading
            title={t('about.title')}
            subtitle={slogan || t('about.subtitle')}
            arabicText="عن المدرسة"
          />
        )}

        <div className="grid md:grid-cols-2 gap-10 md:gap-12 lg:gap-16 items-center mb-12 md:mb-16">
          {/* Video in a mihrab arch frame with double gold ring */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASE }}
            className="relative"
          >
            <div className="arch-frame relative bg-white p-2 md:p-2.5 ring-1 ring-golden/25 shadow-2xl shadow-islamic-dark/15">
              <div className="arch-frame relative aspect-[4/5] sm:aspect-[3/4] overflow-hidden ring-1 ring-gold-bright/40">
                {/* Cinematic film block: admin video → Remotion code-generated
                    ambient geometry film (zero download, living backdrop) */}
                {siteInfo?.aboutVideoUrl && siteInfo.aboutVideoUrl.trim() !== '' ? (
                  <VideoBackground
                    dbUrl={siteInfo.aboutVideoUrl}
                    defaultSrc="/videos/about-loop.mp4"
                    fallbackClassName="bg-gradient-to-br from-golden-lighter via-white to-islamic-lighter"
                  />
                ) : (
                  <RemotionBackground
                    kind="ambient"
                    fallbackClassName="bg-gradient-to-br from-emerald-deep via-islamic to-islamic-dark"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-islamic-dark/30 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>

            {/* Floating 8-point star ornament */}
            <div
              aria-hidden="true"
              className="absolute -top-5 -end-3 sm:-top-8 sm:-end-8 z-10 flex items-center justify-center rounded-full bg-white ring-1 ring-gold-bright/30 shadow-lg shadow-islamic-dark/10 size-16 sm:size-20 text-gold-bright"
            >
              <StarBurst className="size-9 sm:size-11" spin />
            </div>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <Heading level={3} className="text-2xl sm:text-3xl font-black tracking-tight text-islamic-dark mb-4 md:mb-5">
              {t('about.identity')}
            </Heading>
            <div className="space-y-4 md:space-y-5">
              {aboutParagraphs.map((para, index) =>
                index === 0 ? (
                  <div key="about-lead" className="flex">
                    <div
                      aria-hidden="true"
                      className="w-[3px] shrink-0 rounded-full bg-gradient-to-b from-gold-bright to-gold-soft"
                    />
                    <p className="ps-5 text-muted-foreground leading-[1.9] text-sm sm:text-base">{para}</p>
                  </div>
                ) : (
                  <p key={`about-p-${index}`} className="text-muted-foreground leading-[1.9] text-sm sm:text-base">
                    {para}
                  </p>
                )
              )}
              {!about1 && !about2 && !about3 && (
                <div className="text-center py-6">
                  <p className="text-muted-foreground text-sm mb-2">{t('about.noInfo')}</p>
                  <p className="text-xs text-muted-foreground/70">
                    {t('aboutPage.identityHint')}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Stats — editorial print-style figures (left-aligned) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: index * 0.08, ease: EASE }}
              className="h-full"
            >
              <StatCard icon={stat.icon} value={stat.value} label={stat.label} tone={index % 2 === 0 ? 'emerald' : 'gold'} />
            </motion.div>
          ))}
        </div>

        {/* Vision & Mission — HeroUI Cards with gold medallions */}
        {(vision || mission) ? (
          <div className="grid md:grid-cols-2 gap-4 md:gap-6 mt-8 md:mt-12">
            {vision && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, ease: EASE }}
                className="h-full"
              >
                <HCard className="h-full" topRule="emerald-gold">
                  <div className="p-6 w-full">
                    <div className="mb-3.5 flex items-center gap-3">
                      <IconMedallion icon={Eye} tone="emerald" />
                      <Heading level={4} className="text-lg font-bold text-islamic-dark">
                        {t('about.vision')}
                      </Heading>
                    </div>
                    <p className="text-muted-foreground leading-[1.8] text-sm text-start">{vision}</p>
                  </div>
                </HCard>
              </motion.div>
            )}
            {mission && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, ease: EASE }}
                className="h-full"
              >
                <HCard className="h-full" topRule="gold">
                  <div className="p-6 w-full">
                    <div className="mb-3.5 flex items-center gap-3">
                      <IconMedallion icon={Target} tone="gold" />
                      <Heading level={4} className="text-lg font-bold text-islamic-dark">
                        {t('about.mission')}
                      </Heading>
                    </div>
                    <p className="text-muted-foreground leading-[1.8] text-sm text-start">{mission}</p>
                  </div>
                </HCard>
              </motion.div>
            )}
          </div>
        ) : siteInfo ? (
          <div className="text-center py-6 mt-8">
            <p className="text-muted-foreground text-sm mb-2">{t('aboutPage.noVisionMission')}</p>
            <p className="text-xs text-muted-foreground/70">
              {t('aboutPage.visionMissionHint')}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
