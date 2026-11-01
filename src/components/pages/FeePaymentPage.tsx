'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Hash, Wallet, CheckCircle, AlertCircle,
} from 'lucide-react';
import { Card } from '@heroui/react/card';
import { Chip } from '@heroui/react/chip';
import { Input } from '@heroui/react/input';
import { HButton } from '@/components/heroui/islamic';
import PageBanner from '@/components/pages/PageBanner';
import BackToTop from '@/components/pages/BackToTop';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';

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
  const { feeConfigs, feePayments, students } = useAppStore();
  const { t, language } = useTranslation();
  // Language-aware date formatting (bn-BD / ar-EG / en-US)
  const locale = language === 'bn' ? 'bn-BD' : language === 'ar' ? 'ar-EG' : 'en-US';
  const [rollInput, setRollInput] = useState('');
  const [searchedRoll, setSearchedRoll] = useState('');

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
    }
  };

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
              <Card.Content className="p-5">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Hash className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      fullWidth
                      placeholder={t('fee.rollInput')}
                      value={rollInput}
                      onChange={(e) => setRollInput(e.target.value)}
                      aria-label={t('fee.rollInput')}
                      className="ps-10"
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <HButton
                    variant="primary"
                    onPress={handleSearch}
                    className="bg-islamic hover:bg-islamic-light text-white gap-1.5 cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    {t('fee.search')}
                  </HButton>
                </div>
              </Card.Content>
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
                  <div className="bg-gradient-to-r from-islamic via-islamic-light to-primary p-5 text-white">
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
                  <Card.Content className="p-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-primary/5 rounded-xl p-4 text-center border border-primary/25">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                          <CheckCircle className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">{t('fee.paid')}</p>
                        <p className="text-2xl font-bold text-primary">৳{formatBanglaNumber(totalPaid)}</p>
                      </div>
                      <div className="bg-danger/10 rounded-xl p-4 text-center border border-danger/40">
                        <div className="w-10 h-10 rounded-full bg-danger/15 flex items-center justify-center mx-auto mb-2">
                          <AlertCircle className="w-5 h-5 text-danger" />
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">{t('fee.unpaid')}</p>
                        <p className="text-2xl font-bold text-danger">৳{formatBanglaNumber(totalPending)}</p>
                      </div>
                    </div>
                    {totalPending > 0 && (
                      <div className="mt-3 text-center">
                        <Chip className="bg-danger/10 text-danger border border-danger/40 text-xs">
                          {t('fee.dues')}: ৳{formatBanglaNumber(totalPending)}
                        </Chip>
                      </div>
                    )}
                  </Card.Content>
                </Card>
              </motion.div>

              {/* Pending Fees */}
              {pendingFees.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-islamic-dark mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-danger" />
                    {t('fee.dues')}
                    <Chip className="bg-danger/10 text-danger ml-2">{pendingFees.length}</Chip>
                  </h3>
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-3"
                  >
                    {pendingFees.map((fee) => (
                      <motion.div key={fee.id} variants={itemVariants}>
                        <Card className="border-s-4 border-s-danger bg-white hover:shadow-md transition-shadow">
                          <Card.Content className="p-4 flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-islamic-dark">{fee.description}</h4>
                              <p className="text-sm text-muted-foreground">
                                {fee.type} | {fee.department} | {fee.class}
                              </p>
                            </div>
                            <div className="text-end flex-shrink-0">
                              <p className="text-lg font-bold text-danger">৳{formatBanglaNumber(fee.amount)}</p>
                            </div>
                          </Card.Content>
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
                    <CheckCircle className="w-5 h-5 text-primary" />
                    {t('fee.paymentHistory')}
                    <Chip className="bg-primary/10 text-primary border-0 ml-2">{studentPayments.length}</Chip>
                  </h3>
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-3"
                  >
                    {studentPayments.map((payment) => (
                      <motion.div key={payment.id} variants={itemVariants}>
                        <Card className="border-s-4 border-s-primary bg-white hover:shadow-sm transition-shadow">
                          <Card.Content className="p-4 flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-islamic-dark text-sm">{payment.description}</h4>
                              <p className="text-xs text-muted-foreground">
                                {payment.month || ''} {payment.year || ''} |{' '}
                                {payment.paymentDate || (payment.createdAt ? new Date(payment.createdAt).toLocaleDateString(locale) : '')}
                              </p>
                            </div>
                            <div className="text-end flex items-center gap-3 flex-shrink-0">
                              <Chip
                                className={
                                  payment.status === 'paid'
                                    ? 'bg-primary/10 text-primary border-0'
                                    : payment.status === 'pending'
                                      ? 'bg-warning/20 text-warning-foreground border-0'
                                      : 'bg-danger/10 text-danger border-0'
                                }
                              >
                                {payment.status === 'paid' ? t('fee.paid') : payment.status === 'pending' ? t('fee.pending') : t('fee.failed')}
                              </Chip>
                              <p className="font-bold text-islamic-dark whitespace-nowrap">
                                ৳{formatBanglaNumber(payment.paidAmount || payment.amount)}
                              </p>
                            </div>
                          </Card.Content>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              )}

              {/* No data */}
              {pendingFees.length === 0 && studentPayments.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-islamic-lighter/60 ring-1 ring-islamic/10 flex items-center justify-center mx-auto mb-4">
                    <Wallet className="size-8 text-muted-foreground/50" />
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
              <div className="w-16 h-16 rounded-full bg-islamic-lighter/60 ring-1 ring-islamic/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="size-8 text-muted-foreground/50" />
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

      <BackToTop />
    </div>
  );
}
