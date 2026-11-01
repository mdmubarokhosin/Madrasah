'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Calendar, FileText, FolderOpen, UserPlus, Phone } from 'lucide-react';
import { Heading } from '@heroui/react/typography';
import SectionHeading from './SectionHeading';
import { HCard, HChip, IconMedallion } from '@/components/heroui/islamic';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { locList, locSchedule } from '@/lib/multilingual';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* Decorative 8-point Islamic star — module level so it is never recreated during render */
function StarOrnament({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" aria-hidden="true">
      <path
        d="M50 2 L59 26 L83 17 L74 41 L98 50 L74 59 L83 83 L59 74 L50 98 L41 74 L17 83 L26 59 L2 50 L26 41 L17 17 L41 26 Z"
        stroke="currentColor"
        strokeWidth="1"
      />
      <circle cx="50" cy="50" r="14" stroke="currentColor" strokeWidth="1" />
      <circle cx="50" cy="50" r="5" fill="currentColor" />
    </svg>
  );
}

export default function Admission({ hideHeading }: { hideHeading?: boolean }) {
  const { admission: storeAdmission } = useAppStore();
  const { t, language } = useTranslation();

  const activeAdmission = storeAdmission.length > 0 ? storeAdmission[0] : null;
  const requirements = activeAdmission ? locList(language, activeAdmission, 'requirements') : [];
  const documents = activeAdmission ? locList(language, activeAdmission, 'documents') : [];
  const schedule = activeAdmission ? locSchedule(language, activeAdmission) : [];

  return (
    <section id="admission" className="relative py-16 md:py-24 geo-dark overflow-hidden">
      {/* Decorative spinning star ornaments */}
      <StarOrnament className="geo-decor absolute -end-20 -top-20 w-72 h-72 md:w-96 md:h-96 text-gold-soft/10 animate-spin-slow" />
      <StarOrnament className="geo-decor absolute -start-16 bottom-6 w-40 h-40 md:w-52 md:h-52 text-gold-soft/5 animate-floaty" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {!hideHeading && (
          <SectionHeading
            title={t('admission.title')}
            subtitle={t('admission.subtitle')}
            arabicText={t('admission.arabic')}
            darkBg
          />
        )}

        {activeAdmission ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Requirements */}
            {requirements.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: EASE }}
                className="h-full"
              >
                <HCard className="card-night rounded-2xl h-full">
                  <div className="p-6 w-full">
                    <div className="flex items-center gap-3 mb-5">
                      <IconMedallion
                        icon={CheckCircle2}
                        tone="gold"
                        className="bg-gold-soft/10 ring-gold-soft/40 text-gold-soft"
                      />
                      <Heading level={3} className="text-lg font-bold text-white">{t('admission.requirements')}</Heading>
                    </div>
                    <ul className="space-y-3">
                      {requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-white/70 leading-relaxed">
                          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gold-soft flex-shrink-0" aria-hidden="true" />
                          <span className="text-start">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </HCard>
              </motion.div>
            )}

            {/* Documents */}
            {documents.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
                className="h-full"
              >
                <HCard className="card-night rounded-2xl h-full">
                  <div className="p-6 w-full">
                    <div className="flex items-center gap-3 mb-5">
                      <IconMedallion
                        icon={FileText}
                        tone="gold"
                        className="bg-gold-soft/10 ring-gold-soft/40 text-gold-soft"
                      />
                      <Heading level={3} className="text-lg font-bold text-white">{t('admission.documents')}</Heading>
                    </div>
                    <ul className="space-y-3">
                      {documents.map((doc, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-white/70 leading-relaxed">
                          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gold-soft flex-shrink-0" aria-hidden="true" />
                          <span className="text-start">{doc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </HCard>
              </motion.div>
            )}

            {/* Schedule */}
            {schedule.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
                className="h-full"
              >
                <HCard className="card-night rounded-2xl h-full">
                  <div className="p-6 w-full">
                    <div className="flex items-center gap-3 mb-5">
                      <IconMedallion
                        icon={Calendar}
                        tone="gold"
                        className="bg-gold-soft/10 ring-gold-soft/40 text-gold-soft"
                      />
                      <Heading level={3} className="text-lg font-bold text-white">{t('admission.schedule')}</Heading>
                    </div>
                    <ul className="space-y-3.5">
                      {schedule.map((s, i) => (
                        <li key={i} className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-white/70 text-start">{s.item}</span>
                          <HChip
                            variant="gold"
                            className="h-auto shrink-0 whitespace-nowrap rounded-md border-0 bg-gold-soft/10 px-2.5 py-1 text-xs font-semibold text-gold-soft ring-gold-soft/25"
                          >
                            {s.date}
                          </HChip>
                        </li>
                      ))}
                    </ul>
                  </div>
                </HCard>
              </motion.div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-white/60">
            <FolderOpen className="size-12 opacity-20 mb-3" />
            <p className="text-sm">{t('admission.noData')}</p>
            <p className="text-xs mt-1">{t('admissionSection.adminAddHint')}</p>
          </div>
        )}

        {/* CTA band */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.3 }}
          className="mt-10 md:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
        >
          <a
            href="#online-admission"
            className="btn-gold rounded-full inline-flex items-center justify-center gap-2 px-7 py-2.5 min-h-[44px] text-sm font-bold"
          >
            <UserPlus className="w-4 h-4" aria-hidden="true" />
            {t('onlineAdmission.title')}
          </a>
          <a
            href="#contact"
            className="btn-ghost-on-color rounded-full inline-flex items-center justify-center gap-2 px-7 py-2.5 min-h-[44px] text-sm font-semibold"
          >
            <Phone className="w-4 h-4" aria-hidden="true" />
            {t('contact.title')}
          </a>
        </motion.div>
      </div>
    </section>
  );
}
