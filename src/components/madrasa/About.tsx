'use client';

import { motion } from 'framer-motion';
import { Calendar, Users, GraduationCap, BookOpen, Eye, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import SectionHeading from './SectionHeading';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { loc } from '@/lib/multilingual';

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
    { icon: Calendar, label: t('about.established'), value: siteInfo?.established || '—', color: 'text-islamic' },
    { icon: Users, label: t('about.totalStudents'), value: siteInfo?.totalStudents || '—', color: 'text-islamic' },
    { icon: GraduationCap, label: t('about.totalTeachers'), value: siteInfo?.totalTeachers || '—', color: 'text-islamic' },
    { icon: BookOpen, label: t('about.departments'), value: siteInfo?.totalDepts || '—', color: 'text-islamic' },
  ];

  return (
    <section id="about" className="py-12 md:py-20 bg-white relative">
      {/* Pattern overlay */}
      <div className="absolute inset-0 islamic-pattern-bg pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {!hideHeading && (
          <SectionHeading
            title={t('about.title')}
            subtitle={slogan || t('about.subtitle')}
            arabicText="عن المدرسة"
          />
        )}

        <div className="grid md:grid-cols-2 gap-6 md:gap-10 items-center mb-10 md:mb-16">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <img
                src="/classroom.png"
                alt={t('aboutPage.buildingAlt')}
                className="w-full h-56 sm:h-72 md:h-96 object-cover"
              />
            </div>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-xl sm:text-2xl font-bold text-islamic-dark mb-3 md:mb-4">
              {t('about.identity')}
            </h3>
            <div className="space-y-3 md:space-y-4 text-gray-600 leading-relaxed text-sm sm:text-base">
              {about1 ? (
                <p>{about1}</p>
              ) : null}
              {about2 ? (
                <p>{about2}</p>
              ) : null}
              {about3 ? (
                <p>{about3}</p>
              ) : null}
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

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="text-center p-3 sm:p-4 md:p-6 border-none shadow-md hover:shadow-lg transition-shadow bg-white">
                <CardContent className="p-0">
                  <stat.icon className={`w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 sm:mb-3 ${stat.color}`} />
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-islamic-dark mb-1">
                    {stat.value}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Vision & Mission */}
        {(vision || mission) ? (
          <div className="grid md:grid-cols-2 gap-4 md:gap-6 mt-8 md:mt-12">
            {vision && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <Card className="h-full border-l-4 border-l-islamic bg-islamic-lighter/30">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Eye className="w-6 h-6 text-islamic" />
                      <h4 className="text-lg font-bold text-islamic-dark">{t('about.vision')}</h4>
                    </div>
                    <p className="text-gray-600 leading-relaxed text-sm">
                      {vision}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
            {mission && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <Card className="h-full border-l-4 border-l-golden bg-golden-lighter/30">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Target className="w-6 h-6 text-golden" />
                      <h4 className="text-lg font-bold text-islamic-dark">{t('about.mission')}</h4>
                    </div>
                    <p className="text-gray-600 leading-relaxed text-sm">
                      {mission}
                    </p>
                  </CardContent>
                </Card>
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
