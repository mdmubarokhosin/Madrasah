'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Download, Calendar, FileText, FolderOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SectionHeading from './SectionHeading';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { locList, locSchedule } from '@/lib/multilingual';

export default function Admission({ hideHeading }: { hideHeading?: boolean }) {
  const { admission: storeAdmission } = useAppStore();
  const { t, language } = useTranslation();

  const activeAdmission = storeAdmission.length > 0 ? storeAdmission[0] : null;
  const requirements = activeAdmission ? locList(language, activeAdmission, 'requirements') : [];
  const documents = activeAdmission ? locList(language, activeAdmission, 'documents') : [];
  const schedule = activeAdmission ? locSchedule(language, activeAdmission) : [];

  return (
    <section id="admission" className="py-12 md:py-20 bg-islamic-dark relative overflow-hidden">
      <div className="absolute inset-0 islamic-pattern-overlay opacity-[0.03]" />

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
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <Card className="h-full border-none bg-white/95 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="w-5 h-5 text-islamic" />
                      <h3 className="text-lg font-bold text-islamic-dark">{t('admission.requirements')}</h3>
                    </div>
                    <ul className="space-y-3">
                      {requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="text-islamic mt-1 flex-shrink-0">●</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Documents */}
            {documents.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="h-full border-none bg-white/95 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="w-5 h-5 text-golden" />
                      <h3 className="text-lg font-bold text-islamic-dark">{t('admission.documents')}</h3>
                    </div>
                    <ul className="space-y-3">
                      {documents.map((doc, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="text-golden mt-1 flex-shrink-0">●</span>
                          <span>{doc}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Schedule */}
            {schedule.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="h-full border-none bg-white/95 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="w-5 h-5 text-islamic" />
                      <h3 className="text-lg font-bold text-islamic-dark">{t('admission.schedule')}</h3>
                    </div>
                    <ul className="space-y-3">
                      {schedule.map((s, i) => (
                        <li key={i} className="flex justify-between items-start gap-2 text-sm">
                          <span className="text-gray-600">{s.item}</span>
                          <span className="text-xs font-medium text-islamic whitespace-nowrap bg-islamic-lighter px-2 py-0.5 rounded">
                            {s.date}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
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
      </div>
    </section>
  );
}
