'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XCircle, Home, ArrowRight, RefreshCw, AlertTriangle, ArrowLeft,
  Phone, MessageCircle, Shield, Clock, CreditCard, Info,
  Copy, CheckCircle, ExternalLink, HelpCircle, ChevronDown,
  ShieldCheck, User, Mail, Smartphone, Landmark, Timer, CircleDot,
  Ban, WifiOff, Banknote, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { navigateTo } from '@/lib/navigate';
import { useTranslation } from '@/lib/i18n-context';
import Header from '@/components/madrasa/Header';
import Footer from '@/components/madrasa/Footer';

interface PaymentInfo {
  status: string;
  bohudurStatus?: string;
  amount?: number;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  fund_title?: string | null;
  payment_info?: string | null;
  payment_currency?: string | null;
  converted_amount?: number | null;
  created_time?: string | null;
  payment_time?: string | null;
  paymentkey?: string;
}

/** Convert a number to Bengali numerals (e.g. 30 → "৩০") — used for the Bengali UI only */
const toBanglaDigit = (n: number): string => {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(n).split('').map(d => banglaDigits[parseInt(d)]).join('');
};

export default function PaymentCancelPage() {
  const searchParams = useSearchParams();
  const { t, language } = useTranslation();
  const locale = language === 'bn' ? 'bn-BD' : language === 'ar' ? 'ar-EG' : 'en-US';
  // Bengali digits are only used for the Bengali UI
  const num = (n: number) => (language === 'bn' ? toBanglaDigit(n) : String(n));
  const formatElapsed = (seconds: number): string => {
    if (seconds < 60) {
      return t('paymentCancel.seconds', { count: num(seconds) });
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return t('paymentCancel.minutesSeconds', { min: num(mins), sec: num(secs) });
  };
  const paymentkey = searchParams.get('paymentkey');
  const [status, setStatus] = useState<'checking' | 'cancel' | 'success'>('checking');
  const [paymentData, setPaymentData] = useState<PaymentInfo | null>(null);
  const [showFaq, setShowFaq] = useState<number | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [queryError, setQueryError] = useState(false);

  useEffect(() => {
    if (!paymentkey) {
      setStatus('cancel');
      setLoading(false);
      return;
    }

    // Check payment status via multiple endpoints
    const checkPayment = async () => {
      try {
        // 1. Try Bohudur Query API for full data
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
                bohudurStatus: data.bohudurStatus,
                amount: data.amount,
                full_name: data.full_name,
                email: data.email,
                phone: null,
                fund_title: null,
                payment_info: data.payment_info,
                payment_currency: data.payment_currency,
                converted_amount: data.converted_amount,
                created_time: data.created_time,
                payment_time: data.payment_time,
                paymentkey: data.paymentkey || paymentkey,
              };

              // Also try Firebase for fund_title
              try {
                const statusRes = await fetch(`/api/payment/status?key=${encodeURIComponent(paymentkey)}`);
                if (statusRes.ok) {
                  const fbData = await statusRes.json();
                  if (fbData.fund_title) info.fund_title = fbData.fund_title;
                  if (fbData.full_name && !info.full_name) info.full_name = fbData.full_name;
                }
              } catch {}

              setPaymentData(info);

              if (data.status === 'COMPLETED' || data.status === 'EXECUTED') {
                setStatus('success');
                return;
              }
              setStatus('cancel');
              setLoading(false);
              return;
            }
          }
        } catch {}

        // 2. Fallback to basic status API
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
            return;
          }
        }
      } catch {
        setQueryError(true);
      }
      setStatus('cancel');
      setLoading(false);
    };

    checkPayment();
  }, [paymentkey]);

  // Auto-increment elapsed time
  useEffect(() => {
    const timer = setInterval(() => setElapsed(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleGoHome = () => {
    navigateTo('public');
  };

  const handleRetryPayment = () => {
    navigateTo('public', 'donation');
  };

  const handleCopyKey = () => {
    if (paymentkey) {
      navigator.clipboard.writeText(paymentkey).then(() => {
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
      }).catch(() => {});
    }
  };

  const formatTimestamp = (ts?: string | null) => {
    if (!ts) return '—';
    try {
      return new Date(ts).toLocaleString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  };

  const formatAmount = (amount?: number) => {
    if (!amount) return '—';
    return `৳${amount.toLocaleString(locale)}`;
  };

  // FAQ items
  const faqItems = [
    {
      q: t('paymentCancel.faq1Q'),
      a: t('paymentCancel.faq1A'),
    },
    {
      q: t('paymentCancel.faq2Q'),
      a: t('paymentCancel.faq2A'),
    },
    {
      q: t('paymentCancel.faq3Q'),
      a: t('paymentCancel.faq3A'),
    },
    {
      q: t('paymentCancel.faq4Q'),
      a: t('paymentCancel.faq4A'),
    },
    {
      q: t('paymentCancel.faq5Q'),
      a: t('paymentCancel.faq5A'),
    },
  ];

  // Cancellation reasons with icons
  const cancelReasons = [
    { icon: Ban, text: t('paymentCancel.reason1'), color: 'text-orange-600 bg-orange-100' },
    { icon: WifiOff, text: t('paymentCancel.reason2'), color: 'text-red-600 bg-red-100' },
    { icon: Landmark, text: t('paymentCancel.reason3'), color: 'text-purple-600 bg-purple-100' },
    { icon: Timer, text: t('paymentCancel.reason4'), color: 'text-amber-600 bg-amber-100' },
    { icon: Banknote, text: t('paymentCancel.reason5'), color: 'text-slate-600 bg-slate-100' },
    { icon: Shield, text: t('paymentCancel.reason6'), color: 'text-blue-600 bg-blue-100' },
  ];

  // If payment actually succeeded, redirect to success page using SPA navigation
  if (status === 'success') {
    const successUrl = '/payment/success' + (paymentkey ? `?paymentkey=${encodeURIComponent(paymentkey)}` : '');
    // Use pushState + popstate for SPA navigation (same pattern as navigateTo)
    // instead of window.location.href which causes a full page reload
    window.history.pushState({}, '', successUrl);
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50/20 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-4"
        >
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          <p className="text-emerald-700 font-medium">{t('paymentCancel.redirecting')}</p>
        </motion.div>
      </div>
    );
  }

  if (status === 'checking' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50/20 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <div className="w-20 h-20 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto" />
          <div>
            <p className="text-slate-700 font-semibold text-xl">{t('paymentCancel.checkingTitle')}</p>
            <p className="text-slate-500 text-sm mt-2">{t('paymentCancel.checkingDesc')}</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/40 via-white to-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 px-4 py-8 sm:py-12">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="space-y-4"
          >
            {/* Main Card */}
            <Card className="shadow-2xl border-2 border-orange-200/80 overflow-hidden">
              {/* Top gradient bar */}
              <div className="h-2 bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500" />

              <CardContent className="p-6 sm:p-8 space-y-5">
                {/* Cancel Icon with animation */}
                <motion.div
                  initial={{ scale: 0, rotate: 180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                  className="relative mx-auto"
                >
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center mx-auto shadow-lg shadow-orange-200/50">
                    <XCircle className="w-14 h-14 sm:w-16 sm:h-16 text-orange-500" />
                  </div>
                  {/* Pulsing ring */}
                  <motion.div
                    initial={{ scale: 1, opacity: 0.4 }}
                    animate={{ scale: 1.3, opacity: 0 }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                    className="absolute inset-0 rounded-full border-2 border-orange-300"
                  />
                </motion.div>

                {/* Title & Description */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-center space-y-2"
                >
                  <h1 className="text-2xl sm:text-3xl font-bold text-orange-700">
                    {t('paymentCallback.cancelledTitle')}
                  </h1>
                  <p className="text-slate-500 leading-relaxed text-sm sm:text-base">
                    {t('paymentCancel.cancelledDesc')}
                  </p>
                </motion.div>

                {/* Payment Status Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center justify-center"
                >
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-full text-sm font-medium text-orange-700">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                    {t('paymentCancel.statusText')}
                    {paymentData?.bohudurStatus && (
                      <span className="text-xs text-orange-500 ml-1">
                        ({paymentData.bohudurStatus})
                      </span>
                    )}
                  </div>
                </motion.div>

                {/* ===== RECEIPT-STYLE PAYMENT INFO ===== */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                  className="bg-white rounded-2xl border-2 border-slate-200/80 overflow-hidden shadow-sm"
                >
                  {/* Receipt header */}
                  <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-orange-300" />
                      <span className="text-sm font-semibold">{t('paymentCancel.receiptTitle')}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      {new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div className="p-4 space-y-0">
                    {/* Amount - prominent */}
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50/50 rounded-xl p-4 mb-4 text-center border border-orange-100/50">
                      <p className="text-xs text-slate-500 mb-1">{t('paymentCancel.proposedAmount')}</p>
                      <p className="text-3xl font-bold text-orange-700">
                        {formatAmount(paymentData?.amount)}
                      </p>
                      {paymentData?.converted_amount && paymentData?.payment_currency && (
                        <p className="text-xs text-slate-400 mt-1">
                          {paymentData.converted_amount} {paymentData.payment_currency}
                        </p>
                      )}
                    </div>

                    {/* Donor Info Section */}
                    <div className="space-y-2.5">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('paymentCancel.donorInfo')}</h4>

                      {/* Name */}
                      {paymentData?.full_name ? (
                        <div className="flex items-center justify-between py-2 border-b border-slate-100">
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <User className="w-3.5 h-3.5" />
                            {t('paymentCallback.donorName')}
                          </div>
                          <span className="text-sm font-semibold text-slate-700">{paymentData.full_name}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between py-2 border-b border-slate-100">
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <User className="w-3.5 h-3.5" />
                            {t('paymentCallback.donorName')}
                          </div>
                          <span className="text-sm text-slate-400">{t('paymentCancel.noInfo')}</span>
                        </div>
                      )}

                      {/* Email */}
                      {paymentData?.email ? (
                        <div className="flex items-center justify-between py-2 border-b border-slate-100">
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Mail className="w-3.5 h-3.5" />
                            {t('payment.email')}
                          </div>
                          <span className="text-sm text-slate-700">{paymentData.email}</span>
                        </div>
                      ) : null}

                      {/* Fund */}
                      {paymentData?.fund_title ? (
                        <div className="flex items-center justify-between py-2 border-b border-slate-100">
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <CreditCard className="w-3.5 h-3.5" />
                            {t('paymentCallback.fund')}
                          </div>
                          <span className="text-sm font-medium text-islamic-dark">{paymentData.fund_title}</span>
                        </div>
                      ) : null}
                    </div>

                    <Separator className="!my-3" />

                    {/* Transaction Details */}
                    <div className="space-y-2.5">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('paymentCancel.transactionDetails')}</h4>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-orange-50/50 rounded-lg p-2.5 border border-orange-100/50">
                          <div className="flex items-center gap-1 mb-1">
                            <XCircle className="w-3 h-3 text-orange-500" />
                            <span className="text-[10px] text-slate-500">{t('common.status')}</span>
                          </div>
                          <span className="text-sm font-bold text-orange-600">{t('paymentCancel.statusCancelled')}</span>
                        </div>
                        <div className="bg-emerald-50/50 rounded-lg p-2.5 border border-emerald-100/50">
                          <div className="flex items-center gap-1 mb-1">
                            <Shield className="w-3 h-3 text-emerald-500" />
                            <span className="text-[10px] text-slate-500">{t('paymentCancel.moneyDeducted')}</span>
                          </div>
                          <span className="text-sm font-bold text-emerald-600">{t('paymentCancel.noAmount')}</span>
                        </div>
                      </div>

                      {/* Created Time */}
                      {paymentData?.created_time && (
                        <div className="flex items-center justify-between py-2 border-b border-slate-100">
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Clock className="w-3.5 h-3.5" />
                            {t('paymentCancel.createdTime')}
                          </div>
                          <span className="text-xs text-slate-600">{formatTimestamp(paymentData.created_time)}</span>
                        </div>
                      )}

                      {/* Payment Info from gateway */}
                      {paymentData?.payment_info && (
                        <div className="flex items-center justify-between py-2 border-b border-slate-100">
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Smartphone className="w-3.5 h-3.5" />
                            {t('paymentCancel.paymentMethod')}
                          </div>
                          <span className="text-xs text-slate-600">{paymentData.payment_info}</span>
                        </div>
                      )}
                    </div>

                    <Separator className="!my-3" />

                    {/* Payment Key */}
                    {paymentkey && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                            <CreditCard className="w-3 h-3" />
                            {t('paymentCancel.paymentKeyId')}
                          </span>
                          <button
                            onClick={handleCopyKey}
                            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-orange-600 transition-colors cursor-pointer"
                          >
                            {copiedKey ? (
                              <><CheckCircle className="w-3 h-3 text-emerald-500" /> {t('common.copied')}</>
                            ) : (
                              <><Copy className="w-3 h-3" /> {t('common.copy')}</>
                            )}
                          </button>
                        </div>
                        <div className="bg-slate-50 rounded-lg px-3 py-2.5 font-mono text-xs text-slate-700 break-all border border-slate-200">
                          {paymentkey}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {t('paymentCancel.keyHelp')}
                        </p>
                      </div>
                    )}

                    {/* Query error notice */}
                    {queryError && (
                      <div className="bg-amber-50 rounded-lg p-3 border border-amber-200 text-xs text-amber-700 mt-3">
                        <div className="flex items-center gap-1.5 mb-1 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {t('paymentCancel.partialInfoTitle')}
                        </div>
                        <p>
                          {t('paymentCancel.partialInfoDesc')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Receipt footer with Bengali elapsed time */}
                  <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Bohudur Payment Gateway</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {t('paymentCancel.timeOnPage', { time: formatElapsed(elapsed) })}
                    </span>
                  </div>
                </motion.div>

                {/* ===== TRANSACTION TIMELINE ===== */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 }}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4"
                >
                  <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <CircleDot className="w-4 h-4 text-orange-500" />
                    {t('paymentCancel.timeline')}
                  </h3>
                  <div className="space-y-0">
                    {/* Step 1: Created */}
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="w-0.5 h-8 bg-slate-200" />
                      </div>
                      <div className="pt-1">
                        <p className="text-sm font-medium text-slate-700">{t('paymentCancel.stepCreated')}</p>
                        <p className="text-xs text-slate-400">
                          {paymentData?.created_time
                            ? formatTimestamp(paymentData.created_time)
                            : t('paymentCancel.noTime')}
                        </p>
                      </div>
                    </div>

                    {/* Step 2: Gateway */}
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="w-0.5 h-8 bg-slate-200" />
                      </div>
                      <div className="pt-1">
                        <p className="text-sm font-medium text-slate-700">{t('paymentCancel.stepSent')}</p>
                        <p className="text-xs text-slate-400">Bohudur Payment Gateway</p>
                      </div>
                    </div>

                    {/* Step 3: Cancelled */}
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center">
                          <XCircle className="w-4 h-4 text-orange-600" />
                        </div>
                      </div>
                      <div className="pt-1">
                        <p className="text-sm font-medium text-orange-700">{t('paymentCallback.cancelledTitle')}</p>
                        <p className="text-xs text-slate-400">{t('paymentCancel.noMoneyDeducted')}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* ===== Important Info Box ===== */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-gradient-to-br from-emerald-50 to-emerald-100/30 rounded-2xl p-4 border border-emerald-100"
                >
                  <h3 className="text-sm font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    {t('paymentCancel.moneySafeTitle')}
                  </h3>
                  <ul className="space-y-2.5 text-sm text-slate-600">
                    <li className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                      </div>
                      <span>{t('paymentCancel.moneySafe1')}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <RefreshCw className="w-3 h-3 text-blue-600" />
                      </div>
                      <span>{t('paymentCancel.moneySafe2')}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Info className="w-3 h-3 text-orange-600" />
                      </div>
                      <span>{t('paymentCancel.moneySafe3')}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <HelpCircle className="w-3 h-3 text-purple-600" />
                      </div>
                      <span>{t('paymentCancel.moneySafe4')}</span>
                    </li>
                  </ul>
                </motion.div>

                {/* ===== Possible Reasons ===== */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.75 }}
                  className="bg-white rounded-2xl p-4 border border-slate-200/80"
                >
                  <h3 className="text-xs font-semibold text-slate-600 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    {t('paymentCancel.reasonsTitle')}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {cancelReasons.map((reason, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className={`w-6 h-6 rounded-full ${reason.color} flex items-center justify-center flex-shrink-0`}>
                          <reason.icon className="w-3 h-3" />
                        </div>
                        <span className="text-xs text-slate-600 leading-relaxed">{reason.text}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* ===== FAQ Section ===== */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.85 }}
                  className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden"
                >
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200/80">
                    <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-islamic" />
                      {t('paymentCancel.faqTitle')}
                    </h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {faqItems.map((item, i) => (
                      <div key={i}>
                        <button
                          onClick={() => setShowFaq(showFaq === i ? null : i)}
                          className="w-full flex items-start justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <span className="text-sm font-medium text-slate-700">{item.q}</span>
                          <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5 transition-transform ${showFaq === i ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                          {showFaq === i && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <p className="px-4 pb-3 text-sm text-slate-600 leading-relaxed">
                                {item.a}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* ===== Contact Info ===== */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.95 }}
                  className="bg-gradient-to-br from-emerald-50 to-blue-50/30 rounded-2xl p-4 border border-emerald-100/80"
                >
                  <p className="text-sm text-slate-700 font-medium mb-3 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    {t('paymentCancel.needHelp')}
                  </p>
                  <p className="text-xs text-slate-500 mb-3">
                    {t('paymentCancel.helpDesc')}
                  </p>
                  <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
                    <button
                      onClick={() => navigateTo('public', 'contact')}
                      className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-white px-3 py-2 rounded-lg border border-emerald-200 hover:bg-emerald-50 transition-all cursor-pointer shadow-sm"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {t('paymentCancel.contactPage')}
                      <ExternalLink className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => navigateTo('public', 'contact')}
                      className="flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-white px-3 py-2 rounded-lg border border-blue-200 hover:bg-blue-50 transition-all cursor-pointer shadow-sm"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      {t('paymentCancel.emailUs')}
                    </button>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 px-3 py-2 rounded-lg bg-white border border-slate-200">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      WhatsApp
                    </div>
                  </div>
                </motion.div>

                {/* ===== Action Buttons ===== */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.05 }}
                  className="space-y-3 pt-1"
                >
                  <Button
                    onClick={handleRetryPayment}
                    variant="outline"
                    className="w-full border-orange-200 text-orange-600 hover:bg-orange-50 py-5 text-base font-semibold gap-2.5 cursor-pointer transition-all"
                  >
                    <RefreshCw className="w-5 h-5" />
                    {t('paymentCancel.payAgain')}
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </Button>

                  <Button
                    onClick={handleGoHome}
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-5 text-base font-semibold gap-2.5 cursor-pointer shadow-lg shadow-emerald-200/50 transition-all"
                  >
                    <Home className="w-5 h-5" />
                    {t('paymentCallback.goHome')}
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </Button>
                </motion.div>
              </CardContent>
            </Card>

            {/* Security notice */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.15 }}
              className="flex items-center justify-center gap-4 text-xs text-slate-400"
            >
              <div className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span>SSL Secured</span>
              </div>
              <span>|</span>
              <span>Bohudur Payment Gateway</span>
            </motion.div>

            {/* Footer text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="text-center text-xs text-slate-400 pb-4"
            >
              {t('paymentCancel.footerText')}
            </motion.p>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
