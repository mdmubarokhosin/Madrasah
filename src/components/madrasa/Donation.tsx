'use client';

import { useState, useEffect, useRef, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { Heart, Smartphone, FolderOpen, Users, BookOpen, CircleDollarSign } from 'lucide-react';
import { ProgressBar } from '@heroui/react/progress-bar';
import { Heading } from '@heroui/react/typography';
import { HButton, HCard, StatCard } from '@/components/heroui/islamic';
import SectionHeading from './SectionHeading';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { loc } from '@/lib/multilingual';
import { formatBanglaNumber as formatNumber } from '@/lib/format';

/* Shared cinematic ease for scroll reveals */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* Eight-point Islamic star ornament — pure SVG, decorative, module level */
function StarOrnament({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} style={style} aria-hidden="true">
      <path d="M50 2 L59 26 L83 17 L74 41 L98 50 L74 59 L83 83 L59 74 L50 98 L41 74 L17 83 L26 59 L2 50 L26 41 L17 17 L41 26 Z" stroke="currentColor" strokeWidth="1" />
      <circle cx="50" cy="50" r="14" stroke="currentColor" strokeWidth="1" />
      <circle cx="50" cy="50" r="5" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

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
  const { donations: storeDonations, paymentMethods: storePM } = useAppStore();
  const { t, language } = useTranslation();

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
        'bkash': 'bg-golden',
        'bKash': 'bg-golden',
        'nagad': 'bg-gold-soft',
        'Nagad': 'bg-gold-soft',
        'bank': 'bg-islamic-dark',
        'Bank': 'bg-islamic-dark',
        'rocket': 'bg-islamic',
        'Rocket': 'bg-islamic',
        'default': 'bg-golden/60',
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

  return (
    <>
      <section id="donation" className="relative py-16 md:py-24 geo-dark overflow-hidden">
        {/* In-flow anchor — .geo-dark forces direct children to relative, so all
            decorative absolutes live inside this wrapper (grandchildren) */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Decorative layer: gold radial glow, floating star ornaments, orbs */}
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[36rem] h-36 bg-gold-bright/10 blur-3xl rounded-full" />
            <motion.div
              animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-10 start-10 w-72 h-72 bg-gold-bright/[0.07] rounded-full blur-[100px]"
            />
            <motion.div
              animate={{ y: [0, 15, 0], x: [0, -15, 0] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
              className="absolute bottom-10 end-10 w-96 h-96 bg-islamic/15 rounded-full blur-[120px]"
            />
            <StarOrnament className="hidden md:block absolute top-24 end-[4%] w-16 h-16 text-gold-soft/15 animate-floaty" />
            <StarOrnament className="hidden md:block absolute bottom-32 start-[3%] w-10 h-10 text-gold-soft/10 animate-floaty" style={{ animationDelay: '2.4s' }} />
          </div>

          <div className="relative">
            <SectionHeading
              title={t('donation.title')}
              subtitle={t('donation.subtitle')}
              arabicText={t('donation.arabic')}
              darkBg
            />

            {/* Stats — editorial print figures (left-aligned, dark surface) */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-8 md:mb-12">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, ease: EASE }}
                className="h-full"
              >
                <StatCard dark tone="gold" icon={CircleDollarSign} label={t('donation.totalCollected')} value={<>৳<AnimatedNumber target={totalCollected} /></>} />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: 0.1, ease: EASE }}
                className="h-full"
              >
                <StatCard dark tone="emerald" icon={Users} label={t('donation.activeFunds')} value={<AnimatedNumber target={storeDonations.length} />} />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: 0.2, ease: EASE }}
                className="h-full"
              >
                <StatCard dark tone="gold" icon={BookOpen} label={t('donation.totalTarget')} value={<>৳<AnimatedNumber target={totalTarget} /></>} />
              </motion.div>
            </div>

            {/* Donation Purpose Cards */}
            {donationFunds.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6 mb-8 md:mb-12">
                {donationFunds.map((fund, index) => (
                  <motion.div
                    key={fund.title}
                    initial={{ opacity: 0, y: 25 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.55, delay: index * 0.1, ease: EASE }}
                    className="h-full"
                  >
                    <HCard topRule="gold" className="h-full gap-0 bg-night-2/70 border border-gold-soft/20 backdrop-blur-md group">
                      <div className="relative w-full p-6">
                        {/* Corner sheen on hover */}
                        <div className="absolute -top-16 -end-16 w-40 h-40 bg-gold-bright/10 blur-[60px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" aria-hidden="true" />

                        <div className="flex items-start gap-3.5 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-gold-soft/10 border border-gold-soft/35 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-500" aria-hidden="true">
                            <fund.icon className="w-6 h-6 text-gold-soft" />
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            {fund.titleAr && (
                              <p className="text-gold-soft text-xs font-serif mb-0.5 text-end" dir="rtl">{fund.titleAr}</p>
                            )}
                            <Heading level={3} className="text-lg font-bold text-white leading-snug text-start">{fund.title}</Heading>
                          </div>
                        </div>
                        <p className="text-sm text-white/65 mb-5 leading-relaxed text-start">
                          {fund.description}
                        </p>

                        {/* Progress */}
                        <div className="space-y-2 mb-5">
                          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-white/55">
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
                                className="h-full bg-gradient-to-r from-gold-bright to-gold-soft rounded-full"
                              />
                            </div>
                            <ProgressBar
                              value={fund.progress}
                              aria-label={`${fund.title} — ${t('donation.collected')}`}
                              className="relative h-2"
                            >
                              <ProgressBar.Track className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <ProgressBar.Fill className="bg-transparent" />
                              </ProgressBar.Track>
                            </ProgressBar>
                          </div>
                          <p className="text-xs text-white/45">
                            {t('donation.moreNeeded')} ৳{formatNumber(fund.target - fund.collected)}
                          </p>
                        </div>
                      </div>
                    </HCard>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-white/60 mb-12 relative">
                <div className="w-20 h-20 rounded-full bg-gold-soft/[0.06] border border-gold-soft/20 flex items-center justify-center mb-4" aria-hidden="true">
                  <FolderOpen className="size-10 text-gold-soft/40" />
                </div>
                <p className="text-sm">{t('donation.noData')}</p>
                <p className="text-xs mt-1 text-white/45">{t('donation.noAdminData')}</p>
              </div>
            )}

            {/* Payment Methods / CTA */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <HCard topRule={false} className="bg-night-2/70 border border-gold-soft/20 backdrop-blur-md">
                <div className="relative w-full p-6 md:p-8">
                  {/* Decorative corner glow */}
                  <div className="absolute -top-12 end-8 w-44 h-44 bg-gold-bright/10 blur-[70px] rounded-full pointer-events-none" aria-hidden="true" />

                  <Heading level={3} className="relative text-lg font-bold text-white mb-6 text-center">
                    {t('donation.paymentMethods')}
                  </Heading>

              {paymentMethods.length > 0 ? (
                <div className="relative grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  {paymentMethods.map((method, idx) => (
                    <motion.div
                      key={method.name}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.35, delay: idx * 0.08, ease: EASE }}
                      whileHover={{ scale: 1.04, y: -2 }}
                      className="glass-dark rounded-xl p-4 text-center cursor-default"
                    >
                      <div className={`w-11 h-11 rounded-xl ${method.iconUrl ? 'bg-white/10' : method.color} flex items-center justify-center mx-auto mb-2.5 shadow-md overflow-hidden`}>
                        {method.iconUrl ? (
                          <img src={method.iconUrl} alt={method.name} className="w-full h-full object-contain p-1" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                          <method.icon className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <p className="text-white font-semibold text-sm">{method.name}</p>
                      <p className="text-white/55 text-xs mt-1" dir="ltr">{method.number}</p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="relative text-center text-white/55 text-sm py-6">
                  {t('donation.comingSoon')}
                </p>
              )}
                </div>
              </HCard>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
