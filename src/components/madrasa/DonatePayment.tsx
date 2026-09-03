'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Loader2, CheckCircle, X, DollarSign, User, Mail,
  Gift, Phone, Shield, ChevronRight, Sparkles, ArrowRight,
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { dbPush, dbUpdate } from '@/lib/db-service';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/lib/i18n-context';
import { formatBanglaNumber } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface DonatePaymentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFund?: string;
}

const PRESET_AMOUNTS = [100, 500, 1000, 2000, 5000, 10000];

export default function DonatePayment({ open, onOpenChange, selectedFund }: DonatePaymentProps) {
  const { bohudurConfig, donations } = useAppStore();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [step, setStep] = useState<'form' | 'processing' | 'success' | 'error'>('form');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedFundTitle, setSelectedFundTitle] = useState(selectedFund || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Reset form when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (isOpen) {
      setStep('form');
      setErrorMsg('');
      setPaymentUrl('');
      setSelectedFundTitle(selectedFund || '');
      setAgreeTerms(false);
    }
  };

  const handlePresetAmount = (value: number) => {
    setAmount(value);
    setCustomAmount('');
  };

  const handleCustomAmount = (value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num > 0) {
      setAmount(num);
    }
    setCustomAmount(value);
  };

  const selectedFundData = donations.find((d) => d.title === selectedFundTitle);

  const handleSubmit = async () => {
    // Validation
    if (!fullName.trim()) {
      toast({ title: t('common.error'), description: t('payment.validation.name'), variant: 'destructive' });
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: t('common.error'), description: t('payment.validation.email'), variant: 'destructive' });
      return;
    }
    if (!phone.trim() || phone.length < 11) {
      toast({ title: t('common.error'), description: t('payment.validation.phone'), variant: 'destructive' });
      return;
    }
    if (amount < 10) {
      toast({ title: t('common.error'), description: t('payment.validation.minAmount'), variant: 'destructive' });
      return;
    }
    if (!agreeTerms) {
      toast({ title: t('common.error'), description: t('payment.validation.terms'), variant: 'destructive' });
      return;
    }

    if (!bohudurConfig || !bohudurConfig.enabled || !bohudurConfig.apiKey) {
      toast({
        title: t('payment.inactive'),
        description: t('payment.inactiveDesc'),
        variant: 'destructive',
      });
      return;
    }

    setStep('processing');

    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      // Use configured redirect URLs, or fallback to default payment callback
      const redirectUrl = bohudurConfig.redirectUrl || `${baseUrl}/payment/success`;
      const cancelUrl = bohudurConfig.cancelUrl || `${baseUrl}/payment/cancel`;

      // Build purpose string
      const purpose = selectedFundTitle
        ? `${t('donation.donate')} - ${selectedFundTitle}`
        : t('payment.generalDonation');

      // Save payment record to Firebase FIRST (so webhook can find it by paymentkey later)
      const paymentRecord: Record<string, unknown> = {
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        amount,
        fund_title: selectedFundTitle || '',
        status: 'pending',
        createdAt: Date.now(),
      };

      let recordId = '';
      try {
        recordId = await dbPush('/payments', paymentRecord);
      } catch (dbErr) {
        console.warn('Firebase save failed, continuing with payment:', dbErr);
      }

      // Create payment via API proxy (Next.js API route in dev, CF Function in prod)
      let data: any = null;

      try {
        const response = await fetch('/api/bohudur/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-bohudur-api-key': bohudurConfig.apiKey,
          },
          body: JSON.stringify({
            amount,
            full_name: fullName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            purpose,
            redirect_url: redirectUrl,
            cancel_url: cancelUrl,
            return_type: 'GET',
            metadata: {
              fund_title: selectedFundTitle || '',
              record_id: recordId,
            },
            webhookSuccessUrl: bohudurConfig.webhookSuccessUrl || undefined,
            webhookCancelUrl: bohudurConfig.webhookCancelUrl || undefined,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = errData.message || `${t('common.serverError')}: ${response.status}`;
          throw new Error(errMsg);
        }

        // Verify the response is JSON
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          const errText = await response.text().catch(() => '');
          throw new Error(t('payment.error.serverError'));
        }

        data = await response.json();
      } catch (proxyErr) {
        const proxyMsg = proxyErr instanceof Error ? proxyErr.message : 'Unknown error';
        console.error('Payment creation failed:', proxyMsg);

        if (proxyMsg.includes('Failed to fetch') || proxyMsg.includes('NetworkError')) {
          throw new Error(t('payment.error.network'));
        }

        throw new Error(`${t('payment.error.createFailed')} ${proxyMsg}`);
      }

      // Extract payment URL and key from Bohudur v2 response (flat format)
      // Success: { responseCode: 200, status: "success", payment_url: "...", paymentkey: "..." }
      const payUrl = data?.payment_url || data?.data?.payment_url || data?.url || '';
      const payKey = data?.paymentkey || data?.data?.paymentkey || data?.trx_id || '';
      const isSuccess = data?.success === true || (data?.status === 'success' && payUrl);

      if (isSuccess && payUrl) {
        // Update Firebase record with paymentkey
        if (recordId && payKey) {
          try {
            await dbUpdate(`/payments/${recordId}`, { paymentkey: payKey });
          } catch {
            // Non-critical
          }
        }

        // Redirect to payment
        setPaymentUrl(payUrl);
        setStep('success');

        setTimeout(() => {
          window.location.href = payUrl;
        }, 2000);
      } else {
        setStep('error');
        // Extract error message from Bohudur v2 response (flat format)
        const responseCode = data?.responseCode || data?.data?.responseCode;
        const bohudurMsg = data?.message || data?.data?.message || '';
        let displayMsg = bohudurMsg || t('payment.error.createFailed');

        if (responseCode === 3014) {
          displayMsg = t('payment.error.apiInvalid');
        } else if (responseCode === 3000) {
          displayMsg = t('payment.error.apiNotFound');
        } else if (responseCode === 3015 || responseCode === 3018) {
          displayMsg = t('payment.error.serverError');
        }

        setErrorMsg(displayMsg);
      }
    } catch (err) {
      setStep('error');
      const msg = err instanceof Error ? err.message : t('payment.error.network');
      setErrorMsg(msg);
    }
  };

  const isValid = fullName.trim() && email.trim() && phone.trim().length >= 11 && amount >= 10 && agreeTerms;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-w-[calc(100vw-2rem)] max-h-[92vh] overflow-y-auto p-0 gap-0">
        <AnimatePresence mode="wait">
          {/* ======== Step 1: Donation Form ======== */}
          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-islamic to-islamic-light px-6 py-5 rounded-t-xl relative overflow-hidden">
                <div className="absolute inset-0 islamic-pattern-overlay opacity-[0.06]" />
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                <DialogHeader className="relative z-10">
                  <DialogTitle className="text-white flex items-center gap-2 text-xl">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <Gift className="size-5 text-golden-light" />
                    </div>
                    {t('payment.donateTitle')}
                  </DialogTitle>
                  <DialogDescription className="text-white/70 text-sm">
                    {t('payment.donateDesc')}
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="px-6 py-5 space-y-5">
                {/* Fund Selection */}
                {donations.length > 0 && (
                  <div className="space-y-2.5">
                    <Label className="text-sm font-medium text-islamic-dark flex items-center gap-1.5">
                      <Heart className="size-3.5" />
                      {t('payment.fundSelection')}
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedFundTitle('')}
                        className={`px-3.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                          !selectedFundTitle
                            ? 'bg-islamic text-white border-islamic shadow-sm shadow-islamic/20'
                            : 'bg-card text-muted-foreground border-border hover:border-islamic/50 hover:text-islamic'
                        }`}
                      >
                        {t('payment.generalDonation')}
                      </button>
                      {donations.map((fund) => (
                        <button
                          key={fund.id}
                          type="button"
                          onClick={() => setSelectedFundTitle(fund.title)}
                          className={`px-3.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                            selectedFundTitle === fund.title
                              ? 'bg-islamic text-white border-islamic shadow-sm shadow-islamic/20'
                              : 'bg-card text-muted-foreground border-border hover:border-islamic/50 hover:text-islamic'
                          }`}
                        >
                          {fund.title}
                        </button>
                      ))}
                    </div>
                    {selectedFundData && (
                      <div className="bg-islamic-lighter/40 rounded-lg p-3 text-xs text-islamic-dark/80 border border-islamic/10">
                        <span className="font-medium">{selectedFundData.title}:</span>{' '}
                        {selectedFundData.description}
                      </div>
                    )}
                  </div>
                )}

                <Separator className="!my-4" />

                {/* Form Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="donor-name" className="text-sm flex items-center gap-1.5">
                      <User className="size-3.5 text-islamic" />
                      {t('payment.fullName')} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="donor-name"
                      placeholder={t('payment.name')}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="h-10"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <Label htmlFor="donor-phone" className="text-sm flex items-center gap-1.5">
                      <Phone className="size-3.5 text-islamic" />
                      {t('payment.phone')} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="donor-phone"
                      type="tel"
                      placeholder="০১XXXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="donor-email" className="text-sm flex items-center gap-1.5">
                    <Mail className="size-3.5 text-islamic" />
                    {t('payment.email')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="donor-email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10"
                  />
                </div>

                {/* Amount Section */}
                <div className="space-y-2.5">
                  <Label className="text-sm font-medium text-islamic-dark flex items-center gap-1.5">
                    <DollarSign className="size-3.5" />
                    {t('payment.donateAmount')} ({bohudurConfig?.currency || 'BDT'}) <span className="text-red-500">*</span>
                  </Label>

                  {/* Preset Amounts Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_AMOUNTS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handlePresetAmount(preset)}
                        className={`py-2.5 rounded-lg border text-sm font-semibold transition-all cursor-pointer ${
                          amount === preset && !customAmount
                            ? 'bg-golden text-white border-golden shadow-sm shadow-golden/30'
                            : 'bg-card text-islamic-dark border-border hover:border-golden/50 hover:text-golden'
                        }`}
                      >
                        ৳{formatBanglaNumber(preset)}
                      </button>
                    ))}
                  </div>

                  {/* Custom Amount */}
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">
                      ৳
                    </span>
                    <Input
                      type="number"
                      placeholder={t('payment.customAmountPlaceholder')}
                      className="pl-8 h-10"
                      value={customAmount}
                      onChange={(e) => handleCustomAmount(e.target.value)}
                      min="1"
                    />
                  </div>

                  {/* Amount display */}
                  <div className="bg-gradient-to-r from-islamic/5 to-golden-lighter/30 rounded-xl p-4 text-center border border-islamic/10">
                    <p className="text-xs text-muted-foreground mb-1">{t('payment.totalAmount')}</p>
                    <p className="text-3xl font-bold text-islamic-dark">
                      ৳{formatBanglaNumber(amount)}
                    </p>
                  </div>
                </div>

                {/* Terms & Conditions */}
                <div className="flex items-start gap-2.5">
                  <button
                    type="button"
                    onClick={() => setAgreeTerms(!agreeTerms)}
                    role="checkbox"
                    aria-checked={agreeTerms}
                    className="mt-0.5 h-4 w-4 rounded border-2 border-gray-300 flex-shrink-0 flex items-center justify-center cursor-pointer transition-colors"
                    style={{
                      backgroundColor: agreeTerms ? '#1B7A3E' : 'transparent',
                      borderColor: agreeTerms ? '#1B7A3E' : undefined,
                    }}
                  >
                    {agreeTerms && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t('payment.termsText')}
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={!isValid}
                  className="w-full bg-gradient-to-r from-islamic to-islamic-light hover:from-islamic-light hover:to-islamic text-white py-6 text-base font-semibold gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-islamic/20 transition-all relative overflow-hidden group"
                >
                  <Heart className="size-5" />
                  {t('payment.donateButton')} - ৳{formatBanglaNumber(amount)}
                  <ArrowRight className="size-4 ml-auto group-hover:translate-x-1 transition-transform" />
                </Button>

                {/* Security Info */}
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Shield className="size-3.5 text-emerald-500" />
                    <span>{t('payment.sslSecured')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Sparkles className="size-3.5 text-golden" />
                    <span>{t('payment.poweredBy')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ChevronRight className="size-3.5" />
                    <span>{bohudurConfig?.currency || 'BDT'}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ======== Step 2: Processing ======== */}
          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 text-center px-6"
            >
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full bg-islamic-lighter flex items-center justify-center">
                  <Loader2 className="size-10 text-islamic animate-spin" />
                </div>
                <div className="absolute inset-0 rounded-full border-4 border-islamic/20 animate-ping opacity-30" />
              </div>
              <h3 className="text-xl font-bold text-islamic-dark mb-2">
                {t('payment.processing')}
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                {t('payment.waitRedirect')}
              </p>
              <div className="mt-6 flex items-center gap-1 text-xs text-muted-foreground">
                <span className="w-1.5 h-1.5 bg-golden rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-golden rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-golden rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}

          {/* ======== Step 3: Success ======== */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 text-center px-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mb-5 relative"
              >
                <CheckCircle className="size-14 text-emerald-500" />
                <motion.div
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 rounded-full border-2 border-emerald-300"
                />
              </motion.div>
              <h3 className="text-xl font-bold text-emerald-700 mb-2">
                {t('payment.createSuccess')}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {t('payment.redirecting')}
              </p>
              <div className="bg-emerald-50 rounded-xl p-4 mb-4 text-sm">
                <p className="text-emerald-800 font-medium">{t('paymentCallback.amount')}: ৳{formatBanglaNumber(amount)}</p>
                {selectedFundTitle && (
                  <p className="text-emerald-600 text-xs mt-1">{t('paymentCallback.fund')}: {selectedFundTitle}</p>
                )}
              </div>
              {paymentUrl && (
                <a
                  href={paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-islamic font-medium underline hover:text-islamic-light"
                >
                  {t('payment.goToPayment')}
                  <ArrowRight className="size-3.5" />
                </a>
              )}
            </motion.div>
          )}

          {/* ======== Step 4: Error ======== */}
          {step === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 text-center px-6"
            >
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-5">
                <X className="size-12 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-red-700 mb-2">
                {t('payment.failedTitle')}
              </h3>
              <div className="bg-red-50 rounded-xl p-4 mb-6 max-w-sm">
                <p className="text-sm text-red-600">{errorMsg}</p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('form')}
                  className="gap-2 cursor-pointer border-red-200 text-red-600 hover:bg-red-50"
                >
                  {t('payment.tryAgain')}
                </Button>
                <Button
                  onClick={() => handleOpenChange(false)}
                  variant="outline"
                  className="gap-2 cursor-pointer"
                >
                  {t('payment.close')}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
