'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, FileCheck, Clock, CheckCircle, XCircle, Hash, User, Phone, MapPin,
} from 'lucide-react';
import { Card } from '@heroui/react/card';
import { Input } from '@heroui/react/input';
import { HButton } from '@/components/heroui/islamic';
import PageBanner from '@/components/pages/PageBanner';
import BackToTop from '@/components/pages/BackToTop';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';

const statusConfig: Record<string, { icon: typeof Clock; color: string; bg: string; labelKey: string }> = {
  pending: { icon: Clock, color: 'text-warning-foreground', bg: 'bg-warning/15 border-warning/40', labelKey: 'admin.pending' },
  approved: { icon: CheckCircle, color: 'text-primary', bg: 'bg-primary/5 border-primary/25', labelKey: 'admin.approved' },
  rejected: { icon: XCircle, color: 'text-danger', bg: 'bg-danger/10 border-danger/40', labelKey: 'admin.rejected' },
};

export default function AdmissionTrackPage() {
  const { admissionApplications } = useAppStore();
  const { t } = useTranslation();
  const [searchId, setSearchId] = useState('');
  const [application, setApplication] = useState<typeof admissionApplications[0] | null>(null);

  const handleSearch = () => {
    const term = searchId.trim();
    if (!term) return;
    const found = admissionApplications.find(
      (a) => a.id === term || a.id.includes(term)
    );
    setApplication(found || null);
  };


  return (
    <div className="pt-0">
      <PageBanner
        titleKey="tracking.title"
        arabicText="تتبع القبول"
        subtitleKey="tracking.subtitle"
      />

      <section className="py-12 bg-islamic-lighter/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-lg mx-auto mb-8"
          >
            <Card className="gap-6 py-6">
              <Card.Content className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileCheck className="w-5 h-5 text-islamic" />
                  <h3 className="text-lg font-semibold text-islamic-dark">{t('tracking.searchPlaceholder')}</h3>
                </div>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      fullWidth
                      placeholder={t('tracking.searchPlaceholder')}
                      value={searchId}
                      onChange={(e) => setSearchId(e.target.value)}
                      aria-label={t('tracking.searchPlaceholder')}
                      className="pl-10"
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <HButton variant="primary" onPress={handleSearch} className="bg-islamic hover:bg-islamic-light text-white">
                    {t('tracking.search')}
                  </HButton>
                </div>
              </Card.Content>
            </Card>
          </motion.div>

          {/* Application Result */}
          {application ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Status Card */}
              <Card className="mb-6 overflow-hidden border-0 shadow-lg">
                <div className={`p-4 ${statusConfig[application.status].bg} border-b`}>
                  <div className="flex items-center gap-3">
                    {(() => {
                      const StatusIcon = statusConfig[application.status].icon;
                      return <StatusIcon className={`w-8 h-8 ${statusConfig[application.status].color}`} />;
                    })()}
                    <div>
                      <p className={`text-lg font-bold ${statusConfig[application.status].color}`}>
                        {t(statusConfig[application.status].labelKey)}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('tracking.applicationId')} {application.id}</p>
                    </div>
                  </div>
                </div>

                <Card.Content className="p-6">
                  <h3 className="text-xl font-bold text-islamic-dark mb-4">
                    {application.studentName}
                  </h3>

                  {/* Progress Steps */}
                  <div className="flex items-center justify-between mb-6">
                    {(['pending', 'approved', 'rejected'] as const).map((step, i) => {
                      const isActive =
                        step === 'pending' ? true :
                        step === 'approved' ? application.status === 'approved' :
                        false;
                      const isCurrent =
                        (step === 'pending' && application.status === 'pending') ||
                        (step === 'approved' && application.status === 'approved');

                      return (
                        <div key={step} className="flex items-center flex-1">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              isActive
                                ? 'bg-islamic text-white'
                                : 'bg-surface-tertiary text-muted-foreground'
                            }`}>
                              {i + 1}
                            </div>
                            <span className={`text-[10px] mt-1 ${isActive ? 'text-islamic-dark font-medium' : 'text-muted-foreground'}`}>
                              {i === 0 ? t('tracking.submitted') : i === 1 ? t('tracking.reviewing') : t('tracking.completed')}
                            </span>
                          </div>
                          {i < 2 && (
                            <div className={`flex-1 h-0.5 mx-2 ${
                              isActive ? 'bg-islamic' : 'bg-surface-tertiary'
                            }`} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { icon: User, label: t('tracking.fatherName'), value: application.fatherName },
                      { icon: User, label: t('tracking.motherName'), value: application.motherName },
                      { icon: Phone, label: t('tracking.phone'), value: application.phone },
                      { icon: Phone, label: t('tracking.guardianPhone'), value: application.guardianPhone },
                      { icon: MapPin, label: t('tracking.address'), value: application.address },
                      { icon: FileCheck, label: t('tracking.previousEducation'), value: application.previousEducation },
                      { icon: Hash, label: t('tracking.desiredDepartment'), value: application.desiredDepartment },
                      { icon: Hash, label: t('tracking.desiredClass'), value: application.desiredClass },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <item.icon className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">{item.label}</p>
                          <p className="text-sm font-medium text-islamic-dark">{item.value || '—'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card.Content>
              </Card>
            </motion.div>
          ) : searchId ? (
            <div className="text-center py-16 text-muted-foreground">
              <XCircle className="size-16 opacity-15 mx-auto mb-4" />
              <p className="text-base font-medium">{t('tracking.noResult')}</p>
            </div>
          ) : null}
        </div>
      </section>

      <BackToTop />
    </div>
  );
}
