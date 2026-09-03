'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard, Search, Hash, Wallet, CheckCircle, AlertCircle,
  Banknote, ArrowRight, Loader2, Shield,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import PageBanner from '@/components/pages/PageBanner';
import BackToTop from '@/components/pages/BackToTop';
import PageSkeleton from '@/components/pages/PageSkeleton';
import DonatePayment from '@/components/madrasa/DonatePayment';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { useToast } from '@/hooks/use-toast';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

function formatBanglaNumber(num: number): string {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (d) => banglaDigits[parseInt(d)]);
}

export default function FeePaymentPage() {
  const { feeConfigs, feePayments, students, bohudurConfig, dataLoaded } = useAppStore();
  const { t, language } = useTranslation();
  // Language-aware date formatting (bn-BD / ar-EG / en-US)
  const locale = language === 'bn' ? 'bn-BD' : language === 'ar' ? 'ar-EG' : 'en-US';
  const { toast } = useToast();
  const [rollInput, setRollInput] = useState('');
  const [searchedRoll, setSearchedRoll] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [payingFeeId, setPayingFeeId] = useState<string | null>(null);
  const [payingAmount, setPayingAmount] = useState<number>(0);
  const [payingFeePurpose, setPayingFeePurpose] = useState('');

  const student = useMemo(() => {
    if (!searchedRoll) return null;
    return students.find((s) => s.roll === searchedRoll) || null;
  }, [students, searchedRoll]);

  const applicableFees = useMemo(() => {
    if (!student) return [];
    return feeConfigs.filter(
      (f) => f.department === student.department && f.class === student.class
    );
  }, [student, feeConfigs]);

  const studentPayments = useMemo(() => {
    if (!searchedRoll) return [];
    return feePayments.filter((fp) => fp.studentRoll === searchedRoll);
  }, [feePayments, searchedRoll]);

  const paidFeeKeys = useMemo(() => {
    return new Set(
      studentPayments
        .filter((p) => p.status === 'paid')
        .map((p) => `${p.feeConfigId}`)
    );
  }, [studentPayments]);

  const pendingFees = useMemo(() => {
    return applicableFees.filter((f) => !paidFeeKeys.has(f.id));
  }, [applicableFees, paidFeeKeys]);

  const totalPending = pendingFees.reduce((sum, f) => sum + f.amount, 0);
  const totalPaid = studentPayments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + (p.paidAmount || p.amount), 0);

  const handleSearch = () => {
    if (rollInput.trim()) {
      setSearchedRoll(rollInput.trim());
      setShowPayment(false);
    }
  };

  const handlePayFee = (feeId: string, amount: number, description: string) => {
    if (!bohudurConfig?.enabled) {
      toast({
        title: t('fee.inactive'),
        description: t('feePage.inactiveManualDesc'),
        variant: 'destructive',
      });
      return;
    }
    setPayingFeeId(feeId);
    setPayingAmount(amount);
    setPayingFeePurpose(t('feePage.feePurpose', { description, roll: student?.roll || '' }));
    setShowPayment(true);
  };

  const handlePaymentComplete = () => {
    setShowPayment(false);
    setPayingFeeId(null);
    toast({ title: t('fee.success'), description: t('feePage.processingUpdate') });
  };

  if (!dataLoaded) return <PageSkeleton cards={4} showStats showBanner />;

  return (
    <div className="pt-0">
      <PageBanner
        titleKey="fee.title"
        arabicText="رسوم الدراسية"
        subtitleKey="fee.subtitle"
      />

      <section className="py-12 bg-islamic-lighter/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Roll Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-md mx-auto mb-8"
          >
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-islamic to-islamic-light p-4 text-center">
                <h3 className="text-white font-bold text-lg flex items-center justify-center gap-2">
                  <Hash className="w-5 h-5" />
                  {t('fee.rollPlaceholder')}
                </h3>
              </div>
              <CardContent className="p-5">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={t('fee.rollInput')}
                      value={rollInput}
                      onChange={(e) => setRollInput(e.target.value)}
                      aria-label={t('fee.rollInput')}
                      className="pl-10"
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <Button
                    onClick={handleSearch}
                    className="bg-islamic hover:bg-islamic-light text-white gap-1.5 cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    {t('fee.search')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results */}
          {student ? (
            <>
              {/* Student Info Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <Card className="border-0 shadow-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-islamic via-islamic-light to-emerald-600 p-5 text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{student.name}</h3>
                        <p className="text-white/70 text-sm">
                          {t('exam.roll')} {student.roll} | {student.department} | {t('feePage.classLabel')} {student.class}
                        </p>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-100">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">{t('fee.paid')}</p>
                        <p className="text-2xl font-bold text-emerald-600">৳{formatBanglaNumber(totalPaid)}</p>
                      </div>
                      <div className="bg-red-50 rounded-xl p-4 text-center border border-red-100">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-2">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">{t('fee.unpaid')}</p>
                        <p className="text-2xl font-bold text-red-600">৳{formatBanglaNumber(totalPending)}</p>
                      </div>
                    </div>
                    {totalPending > 0 && (
                      <div className="mt-3 text-center">
                        <Button
                          onClick={() => {
                            setPayingFeeId('all');
                            setPayingAmount(totalPending);
                            setPayingFeePurpose(t('feePage.allDuesPurpose', { roll: student.roll }));
                            setShowPayment(true);
                          }}
                          disabled={!bohudurConfig?.enabled}
                          className="bg-gradient-to-r from-islamic to-islamic-light hover:from-islamic-light hover:to-islamic text-white gap-2 cursor-pointer shadow-md"
                        >
                          <CreditCard className="w-4 h-4" />
                          {t('fee.payAll')}
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Pending Fees */}
              {pendingFees.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-islamic-dark mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    {t('fee.dues')}
                    <Badge variant="destructive" className="ml-2">{pendingFees.length}</Badge>
                  </h3>
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-3"
                  >
                    {pendingFees.map((fee) => (
                      <motion.div key={fee.id} variants={itemVariants}>
                        <Card className="border-l-4 border-l-red-400 bg-white hover:shadow-md transition-shadow">
                          <CardContent className="p-4 flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-islamic-dark">{fee.description}</h4>
                              <p className="text-sm text-muted-foreground">
                                {fee.type} | {fee.department} | {fee.class}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-lg font-bold text-red-600">৳{formatBanglaNumber(fee.amount)}</p>
                              <Button
                                size="default"
                                onClick={() => handlePayFee(fee.id, fee.amount, fee.description)}
                                disabled={!bohudurConfig?.enabled}
                                className="mt-1 bg-islamic hover:bg-islamic-light text-white gap-1 cursor-pointer"
                              >
                                <CreditCard className="w-3 h-3" />
                                {t('fee.pay')}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              )}

              {/* Paid Fees History */}
              {studentPayments.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-islamic-dark mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    {t('fee.paymentHistory')}
                    <Badge className="bg-emerald-100 text-emerald-700 border-0 ml-2">{studentPayments.length}</Badge>
                  </h3>
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-3"
                  >
                    {studentPayments.map((payment) => (
                      <motion.div key={payment.id} variants={itemVariants}>
                        <Card className="border-l-4 border-l-emerald-400 bg-white hover:shadow-sm transition-shadow">
                          <CardContent className="p-4 flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-islamic-dark text-sm">{payment.description}</h4>
                              <p className="text-xs text-muted-foreground">
                                {payment.month || ''} {payment.year || ''} |{' '}
                                {payment.paymentDate || new Date(payment.createdAt).toLocaleDateString(locale)}
                              </p>
                            </div>
                            <div className="text-right flex items-center gap-3 flex-shrink-0">
                              <Badge
                                className={
                                  payment.status === 'paid'
                                    ? 'bg-emerald-100 text-emerald-700 border-0'
                                    : payment.status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-700 border-0'
                                      : 'bg-red-100 text-red-700 border-0'
                                }
                              >
                                {payment.status === 'paid' ? t('fee.paid') : payment.status === 'pending' ? t('fee.pending') : t('fee.failed')}
                              </Badge>
                              <p className="font-bold text-islamic-dark whitespace-nowrap">
                                ৳{formatBanglaNumber(payment.paidAmount || payment.amount)}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              )}

              {/* No data */}
              {pendingFees.length === 0 && studentPayments.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Wallet className="size-8 text-gray-300" />
                  </div>
                  <p className="text-muted-foreground font-medium">{t('fee.noRecords')}</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">{t('feePage.noFeeConfig')}</p>
                </div>
              )}
            </>
          ) : searchedRoll ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="size-8 text-gray-300" />
              </div>
              <p className="text-muted-foreground font-medium">
                {t('fee.noStudent', { roll: searchedRoll })}
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {t('feePage.tryCorrectRoll')}
              </p>
            </motion.div>
          ) : null}
        </div>
      </section>

      {/* Security info */}
      {bohudurConfig?.enabled && (
        <div className="max-w-4xl mx-auto px-4 pb-8">
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>SSL Secured</span>
            </div>
            <div className="flex items-center gap-1">
              <Banknote className="w-3.5 h-3.5" />
              <span>Bohudur Payment</span>
            </div>
          </div>
        </div>
      )}

      <BackToTop />

      {/* Fee Payment Dialog */}
      <DonatePayment
        open={showPayment}
        onOpenChange={(isOpen) => {
          setShowPayment(isOpen);
          if (!isOpen) handlePaymentComplete();
        }}
        selectedFund={payingFeePurpose}
      />
    </div>
  );
}
