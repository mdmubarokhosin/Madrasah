'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { formatBanglaNumber } from '@/lib/format';
import { navigateTo } from '@/lib/navigate';
import {
  CheckCircle, XCircle, Clock, RefreshCw, Home,
  Shield, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';

interface PaymentCallbackProps {
  paymentkey: string;
  urlStatus?: string | null;
}

export default function PaymentCallback({ paymentkey, urlStatus }: PaymentCallbackProps) {
  const { t } = useTranslation();
  const { payments, bohudurConfig } = useAppStore();
  const [status, setStatus] = useState<string | null>(urlStatus || null);
  const [checking, setChecking] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [checkCount, setCheckCount] = useState(0);

  const checkPayment = async () => {
    try {
      // 1. Check local store first
      const found = payments.find((p) => p.paymentkey === paymentkey);
      if (found) {
        setPaymentData(found);
        if (!status || status === 'pending') setStatus(found.status);
      }

      // 2. Check via Bohudur Query API (primary method)
      try {
        if (bohudurConfig?.apiKey) {
          const queryRes = await fetch('/api/bohudur/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentkey,
              apiKey: bohudurConfig.apiKey,
            }),
          });

          if (queryRes.ok) {
            const queryData = await queryRes.json();
            if (queryData.success && queryData.bohudurStatus) {
              // Map Bohudur statuses to display statuses
              const bohudurStatus = queryData.bohudurStatus;
              let mappedStatus = queryData.status;

              // Bohudur: PENDING -> pending, COMPLETED -> completed, EXECUTED -> success, CANCELLED -> cancel
              if (bohudurStatus === 'EXECUTED') {
                mappedStatus = 'success';
                // Auto-execute if COMPLETED
              } else if (bohudurStatus === 'COMPLETED') {
                mappedStatus = 'success';
                // Try to auto-execute
                try {
                  await fetch('/api/bohudur/execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      paymentkey,
                      apiKey: bohudurConfig.apiKey,
                    }),
                  });
                } catch {
                  // Non-critical
                }
              } else if (bohudurStatus === 'CANCELLED') {
                mappedStatus = 'cancel';
              } else if (bohudurStatus === 'PENDING') {
                mappedStatus = 'pending';
              }

              setStatus(mappedStatus);

              if (!paymentData) {
                setPaymentData({
                  amount: queryData.amount,
                  full_name: queryData.full_name,
                  fund_title: found?.fund_title || null,
                  paymentkey,
                  createdAt: found?.createdAt,
                  bohudurStatus: bohudurStatus,
                });
              }
            }
          }
        }
      } catch (apiErr) {
        console.warn('[PaymentCallback] Bohudur Query unavailable:', apiErr);
      }

      // 3. Fallback: check via legacy status endpoint
      if (!status) {
        try {
          const res = await fetch(`/api/payment/status?key=${encodeURIComponent(paymentkey)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status) {
              setStatus(data.status);
            }
          }
        } catch {
          // Ignore
        }
      }
    } catch {
      if (!status) setStatus('pending');
    } finally {
      setChecking(false);
      setCheckCount((prev) => prev + 1);
    }
  };

  useEffect(() => {
    checkPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentkey]);

  // Auto-refresh if still pending (check every 5 seconds, max 8 times)
  useEffect(() => {
    if (status === 'pending' && checkCount < 8) {
      const timer = setTimeout(() => {
        checkPayment();
      }, 5000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, checkCount]);

  const handleRetry = () => {
    setChecking(true);
    setCheckCount(0);
    checkPayment();
  };

  const handleGoHome = () => {
    navigateTo('public');
  };

  if (checking) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-5"
        >
          <div className="relative inline-block">
            <div className="w-16 h-16 border-4 border-islamic border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
          <div>
            <p className="text-islamic-dark font-semibold text-lg">
              {t('paymentCallback.verifying')}
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              {t('paymentCallback.waitMessage')}
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  const statusConfig: Record<string, {
    icon: React.ReactNode;
    title: string;
    description: string;
    color: string;
    bgColor: string;
    iconBg: string;
  }> = {
    success: {
      icon: <CheckCircle className="w-16 h-16" />,
      title: t('paymentCallback.successTitle'),
      description: t('paymentCallback.successDesc'),
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      iconBg: 'bg-emerald-100',
    },
    failed: {
      icon: <XCircle className="w-16 h-16" />,
      title: t('paymentCallback.failedTitle'),
      description: t('paymentCallback.failedDesc'),
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      iconBg: 'bg-red-100',
    },
    cancel: {
      icon: <XCircle className="w-16 h-16" />,
      title: t('paymentCallback.cancelledTitle'),
      description: t('paymentCallback.cancelledDesc'),
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      iconBg: 'bg-orange-100',
    },
    pending: {
      icon: <Clock className="w-16 h-16" />,
      title: t('paymentCallback.pendingTitle'),
      description: t('paymentCallback.pendingDesc'),
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      iconBg: 'bg-yellow-100',
    },
  };

  const config = statusConfig[status || 'pending'] || statusConfig.pending;
  const isSuccess = status === 'success';

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className={`shadow-xl border-2 overflow-hidden ${isSuccess ? 'border-emerald-200' : ''}`}>
          <div className={`h-1.5 ${isSuccess ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-yellow-400 to-yellow-500'}`} />

          <CardContent className="p-8 text-center space-y-5">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
              className={`w-24 h-24 ${config.iconBg} rounded-full flex items-center justify-center mx-auto ${config.color}`}
            >
              {config.icon}
            </motion.div>

            <div>
              <h2 className={`text-2xl font-bold ${isSuccess ? 'text-emerald-700' : 'text-islamic-dark'} mb-2`}>
                {config.title}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {config.description}
              </p>
            </div>

            {paymentData && (
              <div className={`${config.bgColor} rounded-xl p-4 space-y-2 text-left`}>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('paymentCallback.amount')}</span>
                  <span className="font-bold text-islamic-dark">৳{formatBanglaNumber(paymentData.amount)}</span>
                </div>
                {paymentData.full_name && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('paymentCallback.donorName')}</span>
                    <span className="font-medium text-islamic-dark">{paymentData.full_name}</span>
                  </div>
                )}
                {paymentData.fund_title && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('paymentCallback.fund')}</span>
                    <span className="font-medium text-islamic-dark">{paymentData.fund_title}</span>
                  </div>
                )}
                {paymentData.bohudurStatus && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{t('paymentCallback.bohudurStatus')}</span>
                    <span className="font-mono text-muted-foreground">{paymentData.bohudurStatus}</span>
                  </div>
                )}
                {paymentkey && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Payment Key</span>
                    <span className="font-mono text-muted-foreground break-all max-w-[200px] text-right">
                      {paymentkey}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Shield className="size-3.5 text-emerald-500" />
              <span>{t('paymentCallback.secureNote')}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              {(status === 'pending' || status === 'failed') && (
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  className="gap-2 cursor-pointer border-islamic/20 text-islamic hover:bg-islamic-lighter/50"
                >
                  <RefreshCw className="w-4 h-4" />
                  {t('paymentCallback.checkAgain')}
                </Button>
              )}
              <Button
                onClick={handleGoHome}
                className="gap-2 bg-islamic hover:bg-islamic-dark text-white cursor-pointer"
              >
                <Home className="w-4 h-4" />
                {t('paymentCallback.goHome')}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {isSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Separator className="!my-4" />
                <p className="text-sm text-muted-foreground mb-3">{t('paymentCallback.donateAgain')}</p>
                <Button
                  variant="outline"
                  onClick={handleGoHome}
                  className="gap-2 border-golden/30 text-golden hover:bg-golden-lighter/50 cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  {t('paymentCallback.donateMore')}
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
