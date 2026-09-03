'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Heart, Smartphone, ArrowRight, FolderOpen, Users,
  Building, BookOpen, HandCoins, Gift, Shield, CircleDollarSign,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PageBanner from '@/components/pages/PageBanner';
import BackToTop from '@/components/pages/BackToTop';
import PageSkeleton from '@/components/pages/PageSkeleton';
import DonatePayment from '@/components/madrasa/DonatePayment';
import PaymentCallback from '@/components/madrasa/PaymentCallback';
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
  const searchParams = useSearchParams();
  const paymentkey = searchParams.get('paymentkey');
  const urlStatus = searchParams.get('status');

  const { donations: storeDonations, paymentMethods: storePM, bohudurConfig, dataLoaded } = useAppStore();
  const { t, language } = useTranslation();
  const [donateDialogOpen, setDonateDialogOpen] = useState(false);
  const [selectedFund, setSelectedFund] = useState('');

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
      bkash: 'bg-pink-500',
      bKash: 'bg-pink-500',
      nagad: 'bg-orange-500',
      Nagad: 'bg-orange-500',
      bank: 'bg-blue-500',
      Bank: 'bg-blue-500',
      rocket: 'bg-purple-500',
      Rocket: 'bg-purple-500',
    };
    return storePM.map((pm) => ({
      name: pm.name,
      number: pm.number,
      color: colorMap[pm.type] || colorMap[pm.type.toLowerCase()] || 'bg-gray-500',
      iconUrl: pm.iconUrl || '',
    }));
  })();

  const totalCollected = storeDonations.reduce((sum, d) => sum + (d.collected || 0), 0);
  const totalTarget = storeDonations.reduce((sum, d) => sum + (d.target || 0), 0);

  const openDonateDialog = (fundTitle?: string) => {
    setSelectedFund(fundTitle || '');
    setDonateDialogOpen(true);
  };

  // Show loading skeleton while data loads
  if (!dataLoaded) {
    return <PageSkeleton cards={4} showStats showBanner />;
  }

  // Re-check paymentkey after data loads (in case it was missed before)
  if (paymentkey) {
    return <PaymentCallback paymentkey={paymentkey} urlStatus={urlStatus} />;
  }

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
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-5 text-center border border-white/10 hover:bg-white/15 transition-colors">
                  <stat.icon className="w-6 h-6 text-golden mx-auto mb-2" />
                  <p className="text-xl md:text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-white/60 mt-1">{stat.label}</p>
                </div>
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
                <Card className="h-full hover:shadow-md transition-all border border-gray-100 text-center group hover:border-islamic/20">
                  <CardContent className="p-4 sm:p-5">
                    <div className="w-14 h-14 rounded-xl bg-islamic-lighter flex items-center justify-center mx-auto mb-3 group-hover:bg-islamic group-hover:text-white transition-colors">
                      <cat.icon className="w-7 h-7 text-islamic group-hover:text-white transition-colors" />
                    </div>
                    <h4 className="text-sm font-bold text-islamic-dark mb-1">{t(cat.titleKey)}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">{t(cat.descKey)}</p>
                  </CardContent>
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
                  <Card className="h-full hover:shadow-xl transition-shadow border border-gray-100">
                    <CardContent className="p-4 sm:p-6">
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
                        <Badge className="bg-islamic/10 text-islamic border-0 text-xs flex-shrink-0">
                          {fund.progress}%
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-4 leading-relaxed line-clamp-2">
                        {fund.description}
                      </p>

                      {/* Progress */}
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{t('donation.collected')}: ৳{formatNumber(fund.collected)}</span>
                          <span>{t('donation.target')}: ৳{formatNumber(fund.target)}</span>
                        </div>
                        <Progress
                          value={fund.progress}
                          className="h-2.5 [&>div]:bg-islamic"
                        />
                        <p className="text-xs text-muted-foreground">
                          {t('donation.moreNeeded')} ৳{formatNumber(Math.max(0, fund.target - fund.collected))}
                        </p>
                      </div>

                      {/* Donate Button for this fund */}
                      {bohudurConfig?.enabled && (
                        <Button
                          onClick={() => openDonateDialog(fund.title)}
                          className="w-full bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
                        >
                          <Heart className="w-4 h-4" />
                          {t('donation.donate')}
                          <ArrowRight className="w-4 h-4 ml-auto" />
                        </Button>
                      )}
                    </CardContent>
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

          {/* Payment Methods / CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg border border-gray-100"
          >
            <h3 className="text-lg font-semibold text-islamic-dark mb-6 text-center">
              {t('donation.paymentMethods')}
            </h3>

            {bohudurConfig?.enabled ? (
              <>
                {/* Online Payment CTA */}
                <div className="bg-gradient-to-br from-islamic/5 to-islamic-lighter/30 rounded-xl p-4 sm:p-6 md:p-8 mb-6 text-center border border-islamic/10">
                  <div className="w-16 h-16 rounded-full bg-golden/15 flex items-center justify-center mx-auto mb-4">
                    <Gift className="w-8 h-8 text-golden" />
                  </div>
                  <h4 className="text-islamic-dark font-bold text-lg mb-2">
                    {t('donation.secureOnline')}
                  </h4>
                  <p className="text-gray-500 text-sm mb-5 max-w-md mx-auto leading-relaxed">
                    {t('donation.secureDesc')}
                  </p>
                  <Button
                    size="lg"
                    onClick={() => openDonateDialog()}
                    className="bg-golden hover:bg-golden-light text-white px-6 py-5 sm:px-8 sm:py-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all cursor-pointer"
                  >
                    <Gift className="w-5 h-5 mr-2" />
                    {t('donation.donate')}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" />
                      SSL Secured
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CircleDollarSign className="w-3.5 h-3.5" />
                      {bohudurConfig.currency || 'BDT'}
                    </div>
                  </div>
                </div>

                {/* Manual Payment Methods */}
                {paymentMethods.length > 0 && (
                  <>
                    <p className="text-center text-muted-foreground text-sm mb-4">
                      {t('donation.orDirectly')}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {paymentMethods.map((method) => (
                        <motion.div
                          key={method.name}
                          whileHover={{ y: -2 }}
                          className="bg-islamic-lighter/20 rounded-xl p-4 text-center border border-gray-100 hover:shadow-md transition-shadow"
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
                  </>
                )}
              </>
            ) : (
              <>
                {paymentMethods.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                      {paymentMethods.map((method) => (
                        <motion.div
                          key={method.name}
                          whileHover={{ y: -2 }}
                          className="bg-islamic-lighter/20 rounded-xl p-4 text-center border border-gray-100 hover:shadow-md transition-shadow"
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

                    <div className="text-center">
                      <Button
                        size="lg"
                        className="bg-golden hover:bg-golden-light text-white px-6 py-5 sm:px-8 sm:py-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all cursor-pointer"
                      >
                        <Heart className="w-5 h-5 mr-2" />
                        {t('donation.donate')}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground text-sm py-10">
                    {t('donation.comingSoon')}
                  </p>
                )}
              </>
            )}
          </motion.div>
        </div>
      </section>

      {/* Back to Top Button */}
      <BackToTop />

      {/* Donation Payment Dialog */}
      <DonatePayment
        open={donateDialogOpen}
        onOpenChange={setDonateDialogOpen}
        selectedFund={selectedFund}
      />
    </div>
  );
}
