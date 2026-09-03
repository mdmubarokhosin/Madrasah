'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Heart, Smartphone, ArrowRight, FolderOpen, Gift, Shield, CircleDollarSign, Users, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import SectionHeading from './SectionHeading';
import DonatePayment from './DonatePayment';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { loc } from '@/lib/multilingual';
import { formatBanglaNumber as formatNumber } from '@/lib/format';

/* ============ Animated Counter ============ */
function AnimatedNumber({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const counted = useRef(false);

  useEffect(() => {
    if (!ref.current || counted.current) return;
    counted.current = true;
    let start = 0;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
      else setCount(target);
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  return <span ref={ref}>{formatNumber(count)}</span>;
}

export default function Donation() {
  const { donations: storeDonations, paymentMethods: storePM, bohudurConfig } = useAppStore();
  const { t, language } = useTranslation();
  const [donateDialogOpen, setDonateDialogOpen] = useState(false);
  const [selectedFund, setSelectedFund] = useState('');

  const donationFunds = storeDonations.map((d) => ({
    icon: Heart,
    title: loc(language, d, 'title'),
    titleAr: d.titleAr,
    description: loc(language, d, 'description'),
    collected: d.collected,
    target: d.target,
    color: 'bg-islamic',
    progressColor: '[&>div]:bg-islamic',
    progress: d.target > 0 ? (d.collected / d.target) * 100 : 0,
  }));

  const paymentMethods = (() => {
    if (storePM.length > 0) {
      const colorMap: Record<string, string> = {
        'bkash': 'bg-pink-500',
        'bKash': 'bg-pink-500',
        'nagad': 'bg-orange-500',
        'Nagad': 'bg-orange-500',
        'bank': 'bg-blue-500',
        'Bank': 'bg-blue-500',
        'rocket': 'bg-purple-500',
        'Rocket': 'bg-purple-500',
        'default': 'bg-gray-500',
      };
      return storePM.map((pm) => ({
        name: pm.name,
        icon: Smartphone,
        number: pm.number,
        color: colorMap[pm.type] || colorMap[pm.type.toLowerCase()] || colorMap['default'],
        iconUrl: pm.iconUrl || '',
      }));
    }
    return [];
  })();

  const totalCollected = storeDonations.reduce((sum, d) => sum + (d.collected || 0), 0);
  const totalTarget = storeDonations.reduce((sum, d) => sum + (d.target || 0), 0);

  const openDonateDialog = (fundTitle?: string) => {
    setSelectedFund(fundTitle || '');
    setDonateDialogOpen(true);
  };

  return (
    <>
      <section id="donation" className="py-12 md:py-20 bg-gradient-to-br from-islamic-dark via-islamic to-emerald-700 relative overflow-hidden">
        <div className="absolute inset-0 islamic-pattern-overlay opacity-[0.04]" />
        {/* Decorative orbs */}
        <motion.div
          animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-10 left-10 w-72 h-72 bg-golden/8 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ y: [0, 15, 0], x: [0, -15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-10 right-10 w-96 h-96 bg-islamic/15 rounded-full blur-[120px]"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <SectionHeading
            title={t('donation.title')}
            subtitle={t('donation.subtitle')}
            arabicText={t('donation.arabic')}
            darkBg
          />

          {/* Stats Cards - Enhanced */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 md:gap-4 mb-8 md:mb-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 text-center border border-white/10 hover:bg-white/15 transition-all duration-300"
            >
              <CircleDollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-golden mx-auto mb-1.5 sm:mb-2" />
              <p className="text-sm sm:text-base md:text-2xl font-bold text-white truncate">৳<AnimatedNumber target={totalCollected} /></p>
              <p className="text-[10px] sm:text-xs md:text-xs text-white/60 mt-1">{t('donation.totalCollected')}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 text-center border border-white/10 hover:bg-white/15 transition-all duration-300"
            >
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-golden mx-auto mb-1.5 sm:mb-2" />
              <p className="text-sm sm:text-base md:text-2xl font-bold text-white"><AnimatedNumber target={storeDonations.length} /></p>
              <p className="text-[10px] sm:text-xs md:text-xs text-white/60 mt-1">{t('donation.activeFunds')}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 text-center border border-white/10 hover:bg-white/15 transition-all duration-300"
            >
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-golden mx-auto mb-1.5 sm:mb-2" />
              <p className="text-sm sm:text-base md:text-2xl font-bold text-white truncate">৳<AnimatedNumber target={totalTarget} /></p>
              <p className="text-[10px] sm:text-xs md:text-xs text-white/60 mt-1">{t('donation.totalTarget')}</p>
            </motion.div>
          </div>

          {/* Donation Purpose Cards - Enhanced */}
          {donationFunds.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6 mb-8 md:mb-12">
              {donationFunds.map((fund, index) => (
                <motion.div
                  key={fund.title}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full border-0 bg-white/10 backdrop-blur-md hover:bg-white/15 hover:shadow-2xl transition-all duration-500 relative overflow-hidden group">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-islamic/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                          <fund.icon className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-golden text-xs font-serif mb-0.5">{fund.titleAr}</p>
                          <h3 className="text-lg font-bold text-white">{fund.title}</h3>
                        </div>
                      </div>
                      <p className="text-sm text-white/70 mb-4 leading-relaxed">
                        {fund.description}
                      </p>

                      {/* Progress - Enhanced */}
                      <div className="space-y-2 mb-5">
                        <div className="flex justify-between text-xs text-white/60">
                          <span>{t('donation.collected')}: ৳{formatNumber(fund.collected)}</span>
                          <span>{t('donation.target')}: ৳{formatNumber(fund.target)}</span>
                        </div>
                        <div className="relative">
                          <div className="absolute inset-0 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${fund.progress}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 1.5, delay: 0.5, ease: 'easeOut' }}
                              className="h-full bg-gradient-to-r from-islamic to-emerald-400 rounded-full"
                            />
                          </div>
                          <Progress value={fund.progress} className="h-2 bg-white/10 [&>div]:bg-transparent relative" />
                        </div>
                        <p className="text-xs text-white/50">
                          {t('donation.moreNeeded')} ৳{formatNumber(fund.target - fund.collected)}
                        </p>
                      </div>

                      {/* Donate Button with pulse */}
                      {bohudurConfig?.enabled && (
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                          <Button
                            onClick={() => openDonateDialog(fund.title)}
                            className="w-full bg-gradient-to-r from-golden to-golden-light hover:from-golden-light hover:to-golden text-white gap-2 cursor-pointer rounded-xl shadow-lg shadow-golden/20 font-semibold relative overflow-hidden"
                          >
                            <motion.div
                              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0"
                            />
                            <Heart className="w-4 h-4 relative z-10" />
                            <span className="relative z-10">{t('donation.donateToFund')}</span>
                            <ArrowRight className="w-4 h-4 ml-auto relative z-10" />
                          </Button>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-white/60 mb-12">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <FolderOpen className="size-10 opacity-30" />
              </div>
              <p className="text-sm">{t('donation.noData')}</p>
              <p className="text-xs mt-1">{t('donation.noAdminData')}</p>
            </div>
          )}

          {/* Payment Methods / CTA - Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-white/10 relative overflow-hidden"
          >
            {/* Decorative corner */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-golden/5 rounded-full blur-[60px]" />

            <h3 className="text-lg font-semibold text-white mb-5 text-center relative z-10">
              {bohudurConfig?.enabled ? t('donation.onlinePayment') : t('donation.paymentMethods')}
            </h3>

            {bohudurConfig?.enabled ? (
              <>
                {/* Online Payment CTA - Enhanced */}
                <div className="bg-white/10 rounded-2xl p-6 md:p-8 mb-6 text-center border border-golden/20 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-golden/5 to-transparent" />
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-16 h-16 rounded-full bg-golden/20 flex items-center justify-center mx-auto mb-4 relative z-10 shadow-lg shadow-golden/10"
                  >
                    <Gift className="w-8 h-8 text-golden" />
                  </motion.div>
                  <h4 className="text-white font-bold text-lg mb-2 relative z-10">{t('donation.secureOnline')}</h4>
                  <p className="text-white/60 text-sm mb-5 relative z-10 max-w-md mx-auto">
                    {t('donation.secureDesc')}
                  </p>
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="relative z-10 inline-block">
                    <Button
                      size="lg"
                      onClick={() => openDonateDialog()}
                      className="bg-gradient-to-r from-golden to-golden-light hover:from-golden-light hover:to-golden text-white px-6 py-5 sm:px-8 sm:py-6 text-base font-semibold shadow-xl shadow-golden/30 hover:shadow-2xl hover:shadow-golden/40 transition-all duration-300 rounded-xl cursor-pointer relative overflow-hidden group"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.5, 1], opacity: [0, 0.3, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                        className="absolute inset-0 bg-white/20 rounded-xl"
                      />
                      <Gift className="w-5 h-5 mr-2 relative z-10" />
                      <span className="relative z-10">{t('donation.donate')}</span>
                      <ArrowRight className="w-4 h-4 ml-2 relative z-10" />
                    </Button>
                  </motion.div>
                  <div className="flex items-center justify-center gap-4 mt-4 text-xs text-white/40 relative z-10">
                    <div className="flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" />
                      SSL Secured
                    </div>
                    <div className="flex items-center gap-1">
                      <CircleDollarSign className="w-3.5 h-3.5" />
                      {bohudurConfig.currency || 'BDT'}
                    </div>
                  </div>
                </div>

                {/* Manual Payment Methods */}
                {paymentMethods.length > 0 && (
                  <>
                    <p className="text-white/50 text-sm text-center mb-4">{t('donation.orDirectly')}</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {paymentMethods.map((method, idx) => (
                        <motion.div
                          key={method.name}
                          initial={{ opacity: 0, y: 15 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.3, delay: idx * 0.1 }}
                          whileHover={{ scale: 1.05, y: -2 }}
                          className="bg-white/10 rounded-xl p-4 text-center border border-white/10 hover:bg-white/15 hover:border-white/20 transition-all duration-300 cursor-default"
                        >
                          <div className={`w-11 h-11 rounded-xl ${method.iconUrl ? 'bg-white/10' : method.color} flex items-center justify-center mx-auto mb-2 shadow-md overflow-hidden`}>
                            {method.iconUrl ? (
                              <img src={method.iconUrl} alt={method.name} className="w-full h-full object-contain p-1" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                              <method.icon className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <p className="text-white font-medium text-sm">{method.name}</p>
                          <p className="text-white/50 text-xs mt-1">{method.number}</p>
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
                      {paymentMethods.map((method, idx) => (
                        <motion.div
                          key={method.name}
                          initial={{ opacity: 0, y: 15 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.3, delay: idx * 0.1 }}
                          whileHover={{ scale: 1.05, y: -2 }}
                          className="bg-white/10 rounded-xl p-4 text-center border border-white/10 hover:bg-white/15 transition-all duration-300 cursor-default"
                        >
                          <div className={`w-11 h-11 rounded-xl ${method.iconUrl ? 'bg-white/10' : method.color} flex items-center justify-center mx-auto mb-2 shadow-md overflow-hidden`}>
                            {method.iconUrl ? (
                              <img src={method.iconUrl} alt={method.name} className="w-full h-full object-contain p-1" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                              <method.icon className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <p className="text-white font-medium text-sm">{method.name}</p>
                          <p className="text-white/50 text-xs mt-1">{method.number}</p>
                        </motion.div>
                      ))}
                    </div>
                    <div className="text-center">
                      <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                        <Button
                          size="lg"
                          className="bg-gradient-to-r from-golden to-golden-light hover:from-golden-light hover:to-golden text-white px-6 py-5 sm:px-8 sm:py-6 text-base font-semibold shadow-xl shadow-golden/30 hover:shadow-2xl transition-all duration-300 rounded-xl cursor-pointer relative overflow-hidden group"
                        >
                          <motion.div
                            animate={{ scale: [1, 1.5, 1], opacity: [0, 0.3, 0] }}
                            transition={{ duration: 2.5, repeat: Infinity }}
                            className="absolute inset-0 bg-white/20 rounded-xl"
                          />
                          <Heart className="w-5 h-5 mr-2 relative z-10" />
                          <span className="relative z-10">{t('donation.donate')}</span>
                          <ArrowRight className="w-4 h-4 ml-2 relative z-10" />
                        </Button>
                      </motion.div>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-white/50 text-sm py-6">
                    {t('donation.comingSoon')}
                  </p>
                )}
              </>
            )}
          </motion.div>
        </div>
      </section>

      {/* Donation Payment Dialog */}
      <DonatePayment
        open={donateDialogOpen}
        onOpenChange={setDonateDialogOpen}
        selectedFund={selectedFund}
      />
    </>
  );
}
