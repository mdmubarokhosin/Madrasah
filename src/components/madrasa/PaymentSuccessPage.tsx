'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  CheckCircle, Home, ArrowRight, Shield, RefreshCw, Clock,
  Gift, Heart, Star, AlertTriangle, Loader2, Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatBanglaNumber } from '@/lib/format';
import { navigateTo } from '@/lib/navigate';
import { useTranslation } from '@/lib/i18n-context';
import Header from '@/components/madrasa/Header';
import Footer from '@/components/madrasa/Footer';

interface PaymentInfo {
  status?: string;
  amount?: number;
  full_name?: string | null;
  fund_title?: string | null;
  email?: string | null;
  payment_info?: string | null;
  created_time?: string | null;
  payment_time?: string | null;
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const { t, language } = useTranslation();
  const locale = language === 'bn' ? 'bn-BD' : language === 'ar' ? 'ar-EG' : 'en-US';
  const paymentkey = searchParams.get('paymentkey');
  const [status, setStatus] = useState<'checking' | 'success' | 'pending' | 'error' | 'verify-failed'>('checking');
  const [paymentData, setPaymentData] = useState<PaymentInfo | null>(null);
  const [checkCount, setCheckCount] = useState(0);

  const checkPayment = useCallback(async () => {
    if (!paymentkey) {
      setStatus('success');
      return;
    }

    try {
      // Try Bohudur Query API for full data
      try {
        const queryRes = await fetch('/api/bohudur/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentkey }),
        });

        if (queryRes.ok) {
          const data = await queryRes.json();
          if (data.success) {
            const info: PaymentInfo = {
              status: data.status,
              amount: data.amount,
              full_name: data.full_name,
              email: data.email,
              payment_info: data.payment_info,
              created_time: data.created_time,
              payment_time: data.payment_time,
            };
            // Also try Firebase for fund_title
            try {
              const statusRes = await fetch(`/api/payment/status?key=${encodeURIComponent(paymentkey)}`);
              if (statusRes.ok) {
                const fbData = await statusRes.json();
                if (fbData.fund_title) info.fund_title = fbData.fund_title;
                if (fbData.full_name && !info.full_name) info.full_name = fbData.full_name;
                if (fbData.status) info.status = fbData.status;
              }
            } catch { /* ignore */ }

            setPaymentData(info);

            if (data.status === 'COMPLETED' || data.status === 'EXECUTED' || info.status === 'success') {
              setStatus('success');
            } else if (data.status === 'CANCELLED' || info.status === 'cancel') {
              setStatus('error');
            } else {
              setStatus('pending');
            }
            setCheckCount((prev) => prev + 1);
            return;
          }
        }
      } catch { /* fall through to basic check */ }

      // Fallback to basic status API
      const res = await fetch(`/api/payment/status?key=${encodeURIComponent(paymentkey)}`);
      if (res.ok) {
        const data = await res.json();
        setPaymentData({
          status: data.status,
          amount: data.amount,
          full_name: data.full_name,
          fund_title: data.fund_title,
          created_time: data.createdAt ? new Date(data.createdAt).toISOString() : null,
        });
        if (data.status === 'success') {
          setStatus('success');
        } else if (data.status === 'cancel') {
          setStatus('error');
        } else {
          setStatus('pending');
        }
      } else {
        setStatus('verify-failed');
      }
    } catch {
      setStatus('verify-failed');
    } finally {
      setCheckCount((prev) => prev + 1);
    }
  }, [paymentkey]);

  useEffect(() => {
    checkPayment();
  }, [checkPayment]);

  // Auto-refresh if pending
  useEffect(() => {
    if (status === 'pending' && checkCount < 6) {
      const timer = setTimeout(() => {
        checkPayment();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status, checkCount, checkPayment]);

  const handleGoHome = () => {
    navigateTo('public');
  };

  const handleCopyKey = () => {
    if (paymentkey) {
      navigator.clipboard.writeText(paymentkey).catch(() => {});
    }
  };

  const formatTimestamp = (ts?: string | null) => {
    if (!ts) return null;
    try {
      return new Date(ts).toLocaleString(locale, {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return null; }
  };

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-islamic-lighter/20 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <div className="w-20 h-20 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          <div>
            <p className="text-islamic-dark font-semibold text-xl">{t('paymentCallback.verifying')}</p>
            <p className="text-muted-foreground text-sm mt-2">{t('paymentCallback.waitMessage')}</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Verify failed — couldn't confirm payment status
  if (status === 'verify-failed') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-slate-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="w-full max-w-lg"
          >
            <Card className="shadow-2xl border-2 border-amber-200 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500" />
              <CardContent className="p-8 sm:p-10 text-center space-y-6">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                  className="relative mx-auto"
                >
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center mx-auto shadow-lg shadow-amber-200/50">
                    <AlertTriangle className="w-14 h-14 text-amber-500" />
                  </div>
                </motion.div>
                <div>
                  <h1 className="text-2xl font-bold text-amber-700 mb-2">
                    {t('paymentSuccess.verifyFailedTitle')}
                  </h1>
                  <p className="text-muted-foreground leading-relaxed">
                    {t('paymentSuccess.verifyFailedDesc')}
                  </p>
                </div>
                {paymentkey && (
                  <div className="bg-slate-50 rounded-xl p-3 text-xs border border-slate-200">
                    <span className="text-muted-foreground">{t('paymentSuccess.paymentKeyLabel')}: </span>
                    <span className="font-mono text-muted-foreground">{paymentkey}</span>
                    <button onClick={handleCopyKey} className="ml-2 text-islamic hover:text-islamic-dark cursor-pointer">
                      <Copy className="w-3 h-3 inline" /> {t('common.copy')}
                    </button>
                  </div>
                )}
                <div className="space-y-3 pt-2">
                  <Button
                    onClick={() => { setCheckCount(0); setStatus('checking'); checkPayment(); }}
                    variant="outline"
                    className="w-full border-amber-200 text-amber-600 hover:bg-amber-50 py-5 text-base font-semibold gap-2 cursor-pointer"
                  >
                    <RefreshCw className="w-5 h-5" />
                    {t('paymentSuccess.verifyAgain')}
                  </Button>
                  <Button
                    onClick={handleGoHome}
                    className="w-full bg-gradient-to-r from-islamic to-islamic-dark hover:from-islamic-dark hover:to-islamic text-white py-5 text-base font-semibold gap-2 cursor-pointer shadow-md"
                  >
                    <Home className="w-5 h-5" />
                    {t('paymentCallback.goHome')}
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  // Payment cancelled (redirected to success but actually cancelled)
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-slate-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="w-full max-w-lg"
          >
            <Card className="shadow-2xl border-2 border-orange-200 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500" />
              <CardContent className="p-8 sm:p-10 text-center space-y-6">
                <motion.div
                  initial={{ scale: 0, rotate: 180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                  className="relative mx-auto"
                >
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center mx-auto shadow-lg shadow-orange-200/50">
                    <AlertTriangle className="w-14 h-14 text-orange-500" />
                  </div>
                </motion.div>
                <div>
                  <h1 className="text-2xl font-bold text-orange-700 mb-2">
                    {t('paymentCallback.cancelledTitle')}
                  </h1>
                  <p className="text-muted-foreground leading-relaxed">
                    {t('paymentSuccess.cancelledDesc')}
                  </p>
                </div>
                <div className="space-y-3 pt-2">
                  <Button
                    onClick={() => navigateTo('public', 'donation')}
                    variant="outline"
                    className="w-full border-orange-200 text-orange-600 hover:bg-orange-50 py-5 text-base font-semibold gap-2 cursor-pointer"
                  >
                    <RefreshCw className="w-5 h-5" />
                    {t('paymentSuccess.payAgain')}
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </Button>
                  <Button
                    onClick={handleGoHome}
                    className="w-full bg-gradient-to-r from-islamic to-islamic-dark hover:from-islamic-dark hover:to-islamic text-white py-5 text-base font-semibold gap-2 cursor-pointer shadow-md"
                  >
                    <Home className="w-5 h-5" />
                    {t('paymentCallback.goHome')}
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-islamic-lighter/20 flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-lg"
        >
          {/* Main Card */}
          <Card className="shadow-2xl border-2 border-emerald-200 overflow-hidden">
            {/* Top success bar */}
            <div className="h-2 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600" />

            <CardContent className="p-8 sm:p-10 text-center space-y-6">
              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                className="relative mx-auto"
              >
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center mx-auto shadow-lg shadow-emerald-200/50">
                  <CheckCircle className="w-16 h-16 text-emerald-500" />
                </div>
                <motion.div
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  className="absolute inset-0 rounded-full border-2 border-emerald-300"
                />
                {/* Floating stars */}
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      y: [0, -20 - i * 10, -40 - i * 10],
                      x: [-30 + i * 15, -20 + i * 15, -10 + i * 15],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: 0.8 + i * 0.2,
                      repeatDelay: 1,
                    }}
                    className="absolute top-1/2 left-1/2"
                  >
                    <Star className="w-3 h-3 text-golden fill-golden" />
                  </motion.div>
                ))}
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h1 className="text-3xl font-bold text-emerald-700 mb-2">
                  {t('paymentCallback.successTitle')}
                </h1>
                <p className="text-muted-foreground leading-relaxed">
                  {t('paymentSuccess.successDesc')}
                </p>
              </motion.div>

              {/* Payment Details */}
              {paymentData && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-gradient-to-br from-emerald-50 to-islamic-lighter/20 rounded-2xl p-5 text-left space-y-3 border border-emerald-100"
                >
                  <h3 className="text-sm font-semibold text-emerald-700 mb-3 flex items-center gap-2">
                    <Gift className="w-4 h-4" />
                    {t('paymentSuccess.details')}
                  </h3>
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{t('paymentCallback.amount')}</span>
                      <span className="font-bold text-emerald-700 text-lg">
                        ৳{language === 'bn' ? formatBanglaNumber(paymentData.amount || 0) : (paymentData.amount || 0).toLocaleString(locale)}
                      </span>
                    </div>
                    {paymentData.full_name && (
                      <>
                        <Separator className="!my-1" />
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">{t('paymentCallback.donorName')}</span>
                          <span className="font-medium text-islamic-dark">{paymentData.full_name}</span>
                        </div>
                      </>
                    )}
                    {paymentData.fund_title && (
                      <>
                        <Separator className="!my-1" />
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">{t('paymentCallback.fund')}</span>
                          <span className="font-medium text-islamic-dark">{paymentData.fund_title}</span>
                        </div>
                      </>
                    )}
                    {paymentData.created_time && formatTimestamp(paymentData.created_time) && (
                      <>
                        <Separator className="!my-1" />
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">{t('common.date')}</span>
                          <span className="text-muted-foreground">{formatTimestamp(paymentData.created_time)}</span>
                        </div>
                      </>
                    )}
                    {paymentkey && (
                      <>
                        <Separator className="!my-1" />
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">{t('paymentSuccess.paymentKeyLabel')}</span>
                          <button onClick={handleCopyKey} className="font-mono text-muted-foreground break-all max-w-[200px] text-right hover:text-islamic cursor-pointer flex items-center gap-1">
                            <span className="truncate">{paymentkey}</span>
                            <Copy className="w-3 h-3 flex-shrink-0" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Islamic Blessing */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="bg-golden-lighter/50 rounded-xl p-4 border border-golden/20"
              >
                <p className="text-right font-arabic text-lg text-islamic-dark" dir="rtl">
                  جَزَاكُمُ اللّٰهُ خَيْرًا
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('paymentSuccess.blessingText')}
                </p>
              </motion.div>

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>{t('paymentSuccess.secureNote')}</span>
              </div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="space-y-3 pt-2"
              >
                <Button
                  onClick={handleGoHome}
                  className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-6 text-base font-semibold gap-2.5 cursor-pointer shadow-lg shadow-emerald-200/50 transition-all"
                >
                  <Home className="w-5 h-5" />
                  {t('paymentCallback.goHome')}
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>

                <div className="flex items-center justify-center gap-1 text-sm">
                  <Heart className="w-3.5 h-3.5 text-golden" />
                  <span className="text-muted-foreground">{t('paymentSuccess.donateAgainNote')}</span>
                </div>
              </motion.div>
            </CardContent>
          </Card>

          {/* Footer credit */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-center text-xs text-muted-foreground mt-6"
          >
            {t('paymentSuccess.poweredBy')}
          </motion.p>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
