'use client';

import { motion } from 'framer-motion';
import {
  Heart, Smartphone, ArrowRight, FolderOpen, Users,
  Building, BookOpen, HandCoins,
} from 'lucide-react';
import { Card } from '@heroui/react/card';
import { ProgressBar } from '@heroui/react/progress-bar';
import { Chip } from '@heroui/react/chip';
import PageBanner from '@/components/pages/PageBanner';
import BackToTop from '@/components/pages/BackToTop';
import { StatCard } from '@/components/heroui/islamic';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { loc } from '@/lib/multilingual';

function formatNumber(num: number): string {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (d) => banglaDigits[parseInt(d)]);
}

const donationCategories = [
  { icon: Building, titleKey: 'donation.mosqueConstruction', descKey: 'donation.mosqueConstructionDesc' },
  { icon: Users, titleKey: 'donation.studentAid', descKey: 'donation.studentAidDesc' },
  { icon: BookOpen, titleKey: 'donation.curriculum', descKey: 'donation.curriculumDesc' },
  { icon: HandCoins, titleKey: 'donation.generalFund', descKey: 'donation.generalFundDesc' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function DonationPage() {
  const { donations: storeDonations, paymentMethods: storePM } = useAppStore();
  const { t, language } = useTranslation();

  const donationFunds = storeDonations.map((d) => ({
    title: loc(language, d, 'title'),
    titleAr: d.titleAr,
    description: loc(language, d, 'description'),
    collected: d.collected,
    target: d.target,
    progress: d.target > 0 ? Math.round((d.collected / d.target) * 100) : 0,
  }));

  const paymentMethods = (() => {
    const colorMap: Record<string, string> = {
      bkash: 'bg-golden',
      bKash: 'bg-golden',
      nagad: 'bg-gold-soft',
      Nagad: 'bg-gold-soft',
      bank: 'bg-islamic-dark',
      Bank: 'bg-islamic-dark',
      rocket: 'bg-islamic',
      Rocket: 'bg-islamic',
    };
    return storePM.map((pm) => ({
      name: pm.name,
      number: pm.number,
      color: colorMap[pm.type] || colorMap[pm.type.toLowerCase()] || 'bg-golden/60',
      iconUrl: pm.iconUrl || '',
    }));
  })();

  const totalCollected = storeDonations.reduce((sum, d) => sum + (d.collected || 0), 0);
  const totalTarget = storeDonations.reduce((sum, d) => sum + (d.target || 0), 0);

  return (
    <div className="pt-0">
      {/* Page Banner */}
      <PageBanner
        titleKey="donation.title"
        arabicText={t('donation.arabic')}
        subtitleKey="donation.subtitle"
      />

      {/* Stats Section */}
      <section className="py-8 sm:py-10 md:py-14 bg-gradient-to-r from-islamic-dark via-islamic to-islamic-light relative overflow-hidden">
        <div className="absolute inset-0 islamic-pattern-overlay opacity-[0.04]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
          >
            {[
              { label: t('donation.totalCollected'), value: `৳${formatNumber(totalCollected)}`, icon: Heart },
              { label: t('donation.totalTarget'), value: `৳${formatNumber(totalTarget)}`, icon: ArrowRight },
              { label: t('donation.activeFunds'), value: formatNumber(storeDonations.length), icon: HandCoins },
              { label: t('donation.paymentMethodCount'), value: formatNumber(paymentMethods.length), icon: Smartphone },
            ].map((stat, i) => (
              <motion.div key={i} variants={itemVariants}>
                <StatCard dark tone={i % 2 === 0 ? 'gold' : 'emerald'} icon={stat.icon} value={stat.value} label={stat.label} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Donation Categories */}
      <section className="py-10 md:py-14 bg-islamic-lighter/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-10 md:mb-14"
          >
            {donationCategories.map((cat, i) => (
              <motion.div key={i} variants={itemVariants}>
                <Card className="h-full hover:shadow-md transition-all border border-border group hover:border-islamic/20">
                  <Card.Content className="p-4 sm:p-5 text-start">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 shrink-0 rounded-xl bg-islamic-lighter flex items-center justify-center group-hover:bg-islamic transition-colors">
                        <cat.icon className="w-5 h-5 text-islamic group-hover:text-white transition-colors" />
                      </div>
                      <h4 className="text-sm font-bold text-islamic-dark">{t(cat.titleKey)}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{t(cat.descKey)}</p>
                  </Card.Content>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Fund Progress Cards */}
          {donationFunds.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-10 md:mb-14">
              {donationFunds.map((fund, index) => (
                <motion.div
                  key={fund.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-xl transition-shadow border border-border">
                    <Card.Content className="p-4 sm:p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-islamic-lighter flex items-center justify-center flex-shrink-0">
                          <Heart className="w-6 h-6 text-islamic" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-golden text-xs font-serif mb-0.5" dir="rtl">
                            {fund.titleAr}
                          </p>
                          <h3 className="text-lg font-bold text-islamic-dark truncate">{fund.title}</h3>
                        </div>
                        <Chip className="bg-islamic/10 text-islamic border-0 text-xs flex-shrink-0">
                          {fund.progress}%
                        </Chip>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-2">
                        {fund.description}
                      </p>

                      {/* Progress */}
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{t('donation.collected')}: ৳{formatNumber(fund.collected)}</span>
                          <span>{t('donation.target')}: ৳{formatNumber(fund.target)}</span>
                        </div>
                        <ProgressBar value={fund.progress} aria-label="donation progress" className="relative">
                          <ProgressBar.Track className="h-2.5 [&>div]:bg-islamic">
                            <ProgressBar.Fill />
                          </ProgressBar.Track>
                        </ProgressBar>
                        <p className="text-xs text-muted-foreground">
                          {t('donation.moreNeeded')} ৳{formatNumber(Math.max(0, fund.target - fund.collected))}
                        </p>
                      </div>

                      {/* Donate: contact office / use manual methods below */}
                    </Card.Content>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground mb-8">
              <FolderOpen className="size-16 opacity-15 mb-4" />
              <p className="text-base font-medium">{t('donation.noData')}</p>
              <p className="text-sm mt-1 text-muted-foreground/70">{t('donation.noAdminData')}</p>
            </div>
          )}

          {/* Payment Methods */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg border border-border"
          >
            <h3 className="text-lg font-semibold text-islamic-dark mb-6 text-start flex items-center gap-3">
              <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-transparent via-golden/30 to-golden/60" />
              {t('donation.paymentMethods')}
              <span aria-hidden="true" className="h-px w-10 bg-golden/40" />
            </h3>

            {paymentMethods.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {paymentMethods.map((method) => (
                  <motion.div
                    key={method.name}
                    whileHover={{ y: -2 }}
                    className="bg-islamic-lighter/20 rounded-xl p-4 text-center border border-border hover:shadow-md transition-shadow"
                  >
                    <div className={`w-10 h-10 rounded-full ${method.iconUrl ? 'bg-islamic-lighter/30' : method.color} flex items-center justify-center mx-auto mb-2 overflow-hidden`}>
                      {method.iconUrl ? (
                        <img src={method.iconUrl} alt={method.name} className="w-full h-full object-contain p-1" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <Smartphone className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <p className="text-islamic-dark font-medium text-sm">{method.name}</p>
                    <p className="text-muted-foreground text-xs mt-1">{method.number}</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground text-sm py-10">
                {t('donation.comingSoon')}
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Back to Top Button */}
      <BackToTop />
    </div>
  );
}
