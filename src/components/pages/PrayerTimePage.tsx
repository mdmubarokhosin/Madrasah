'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Sun, CloudSun, Sunset, Moon, Star, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageBanner from '@/components/pages/PageBanner';
import BackToTop from '@/components/pages/BackToTop';
import PageSkeleton from '@/components/pages/PageSkeleton';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const prayerList = [
  { key: 'fajr', nameBn: 'ফজর', icon: Moon, color: 'from-indigo-500 to-indigo-700', bg: 'bg-indigo-50' },
  { key: 'dhuhr', nameBn: 'যোহর', icon: Sun, color: 'from-yellow-500 to-orange-500', bg: 'bg-yellow-50' },
  { key: 'asr', nameBn: 'আসর', icon: CloudSun, color: 'from-orange-400 to-orange-600', bg: 'bg-orange-50' },
  { key: 'maghrib', nameBn: 'মাগরিব', icon: Sunset, color: 'from-rose-500 to-pink-600', bg: 'bg-rose-50' },
  { key: 'isha', nameBn: 'ইশা', icon: Star, color: 'from-purple-600 to-indigo-800', bg: 'bg-purple-50' },
  { key: 'jummah', nameBn: 'জুমআ', icon: Star, color: 'from-islamic to-islamic-light', bg: 'bg-islamic-lighter/30' },
];

export default function PrayerTimePage() {
  const { prayerConfig, dataLoaded } = useAppStore();
  const { t, language } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Language-aware clock formatting (Bengali digits in bn mode)
  const formatTime = (date: Date) => {
    if (language !== 'bn') {
      return date.toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', { hour12: false });
    }
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const h = hours.toString().replace(/\d/g, (d) => banglaDigits[parseInt(d)]);
    const m = minutes.toString().padStart(2, '0').replace(/\d/g, (d) => banglaDigits[parseInt(d)]);
    const s = seconds.toString().padStart(2, '0').replace(/\d/g, (d) => banglaDigits[parseInt(d)]);
    return `${h}:${m}:${s}`;
  };


  // Determine next prayer
  const getNextPrayer = () => {
    if (!prayerConfig) return null;
    const now = currentTime.getHours() * 60 + currentTime.getMinutes();
    const prayers = [
      { key: 'fajr', time: prayerConfig.fajr },
      { key: 'dhuhr', time: prayerConfig.dhuhr },
      { key: 'asr', time: prayerConfig.asr },
      { key: 'maghrib', time: prayerConfig.maghrib },
      { key: 'isha', time: prayerConfig.isha },
    ];
    for (const p of prayers) {
      const [h, m] = p.time.split(':').map(Number);
      const prayerMin = h * 60 + m;
      if (prayerMin > now) return t(`prayer.${p.key}`);
    }
    return t('prayer.fajr');
  };

  if (!dataLoaded) return <PageSkeleton cards={1} showStats showBanner />;

  const nextPrayer = getNextPrayer();

  return (
    <div className="pt-0">
      <PageBanner
        titleKey="prayer.title"
        arabicText="أوقات الصلاة"
        subtitleKey="prayer.subtitle"
      />

      <section className="py-12 bg-islamic-lighter/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Current Time Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <Card className="overflow-hidden border-0 shadow-lg">
              <div className="bg-gradient-to-r from-islamic-dark via-islamic to-islamic-light p-6 text-center text-white relative overflow-hidden">
                <div className="absolute inset-0 islamic-pattern-overlay opacity-[0.05]" />
                <div className="relative z-10">
                  <p className="text-golden text-sm mb-2 font-serif" dir="rtl" lang="ar">
                    بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
                  </p>
                  <motion.p
                    initial={{ opacity: 0.8 }}
                    animate={{ opacity: 1 }}
                    aria-live="off"
                    className="text-4xl md:text-5xl font-mono font-bold mb-2"
                  >
                    {formatTime(currentTime)}
                  </motion.p>
                  <p className="text-white/70 text-sm">
                    {currentTime.toLocaleDateString(language === 'bn' ? 'bn-BD' : language === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  {nextPrayer && (
                    <Badge className="mt-3 bg-golden/20 text-golden border border-golden/30">
                      {t('prayer.next')} {nextPrayer}
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Prayer Times */}
          {prayerConfig ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {prayerList.map((prayer) => {
                const IconComp = prayer.icon;
                const time = prayerConfig[prayer.key as keyof typeof prayerConfig] as string;
                return (
                  <motion.div key={prayer.key} variants={itemVariants}>
                    <Card className={`h-full hover:shadow-lg transition-all border-0 overflow-hidden ${prayer.bg}`}>
                      <div className={`h-2 bg-gradient-to-r ${prayer.color}`} />
                      <CardContent className="p-5 text-center">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${prayer.color} flex items-center justify-center mx-auto mb-3 shadow-md`}>
                          <IconComp className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-islamic-dark mb-1">{t(`prayer.${prayer.key}`)}</h3>
                        <p className="text-3xl font-mono font-bold text-islamic-dark">{time}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {prayer.key === 'jummah' ? t('prayer.weekly') : t('prayer.daily')}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Clock className="size-16 opacity-15 mb-4" />
              <p className="text-base font-medium">{t('prayer.notConfigured')}</p>
              <p className="text-sm mt-1">{t('prayer.adminNote')}</p>
            </div>
          )}

          {/* Last Updated */}
          {(prayerConfig as any)?.updatedAt && (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mt-8 text-sm text-muted-foreground"
            >
              {t('prayer.updated')} {new Date((prayerConfig as any).updatedAt).toLocaleDateString(language === 'bn' ? 'bn-BD' : language === 'ar' ? 'ar-EG' : 'en-US')}
            </motion.div>
          )}
        </div>
      </section>

      <BackToTop />
    </div>
  );
}
