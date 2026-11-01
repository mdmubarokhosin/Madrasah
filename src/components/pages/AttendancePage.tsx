'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardCheck, Search, Hash, Calendar, CheckCircle, XCircle,
  Clock, AlertTriangle, UserCheck,
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
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; bg: string }> = {
  present: { icon: CheckCircle, color: 'text-primary', bg: 'bg-primary/5' },
  absent: { icon: XCircle, color: 'text-danger', bg: 'bg-danger/10' },
  late: { icon: Clock, color: 'text-warning-foreground', bg: 'bg-warning/15' },
  excused: { icon: AlertTriangle, color: 'text-islamic-dark', bg: 'bg-islamic-lighter/60' },
};

const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const toBangla = (n: number) => n.toString().replace(/\d/g, (d) => banglaDigits[parseInt(d)]);

export default function AttendancePage() {
  const { students } = useAppStore();
  const { t, language } = useTranslation();
  // Language-aware date formatting (bn-BD / ar-EG / en-US)
  const locale = language === 'bn' ? 'bn-BD' : language === 'ar' ? 'ar-EG' : 'en-US';
  const monthYearLabel = (year: number, monthIndex: number) =>
    new Date(year, monthIndex, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  const [rollInput, setRollInput] = useState('');
  const [searchedRoll, setSearchedRoll] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);

  // Fetch attendance records from Firebase when roll is searched
  useEffect(() => {
    if (!searchedRoll) {
      setAttendanceRecords([]);
      return;
    }
    const loadAttendance = async () => {
      try {
        const { dbGet } = await import('@/lib/db-service');
        const data = await dbGet<Record<string, any>>('/attendance');
        if (data) {
          const records = Object.entries(data)
            .map(([id, item]: [string, any]) => ({ ...item, id }))
            .filter((r: any) => r.studentRoll === searchedRoll)
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setAttendanceRecords(records);
        } else {
          setAttendanceRecords([]);
        }
      } catch {
        setAttendanceRecords([]);
      }
    };
    loadAttendance();
  }, [searchedRoll]);

  const student = useMemo(() => {
    if (!searchedRoll) return null;
    return students.find((s) => s.roll === searchedRoll) || null;
  }, [students, searchedRoll]);

  const studentRecords = useMemo(() => {
    if (!searchedRoll) return [];
    return attendanceRecords;
  }, [attendanceRecords, searchedRoll]);

  // Monthly summary
  const monthlySummary = useMemo(() => {
    const summary: Record<string, { present: number; absent: number; late: number; excused: number; total: number }> = {};
    studentRecords.forEach((r) => {
      const d = new Date(r.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!summary[key]) summary[key] = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
      summary[key][r.status]++;
      summary[key].total++;
    });
    return Object.entries(summary)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, data]) => ({
        month: key,
        monthLabel: monthYearLabel(parseInt(key.split('-')[0]), parseInt(key.split('-')[1]) - 1),
        ...data,
      }));
  }, [studentRecords, language]);

  const totalPresent = studentRecords.filter((r) => r.status === 'present').length;
  const totalAbsent = studentRecords.filter((r) => r.status === 'absent').length;
  const attendancePercent = studentRecords.length > 0
    ? Math.round((totalPresent / studentRecords.length) * 100)
    : 0;

  const handleSearch = () => {
    if (rollInput.trim()) {
      setSearchedRoll(rollInput.trim());
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };


  return (
    <div className="pt-0">
      <PageBanner
        titleKey="attendance.title"
        arabicText="سجل الحضور"
        subtitleKey="attendance.subtitle"
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
            <Card className="gap-6 py-6">
              <Card.Content className="p-6">
                <h3 className="text-lg font-semibold text-islamic-dark mb-4 text-center">
                  {t('attendance.rollPlaceholder')}
                </h3>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      fullWidth
                      placeholder={t('attendance.rollInput')}
                      value={rollInput}
                      onChange={(e) => setRollInput(e.target.value)}
                      aria-label={t('attendance.rollPlaceholder')}
                      className="pl-10"
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <HButton variant="primary" onPress={handleSearch} className="bg-islamic hover:bg-islamic-light text-white">
                    {t('attendance.search')}
                  </HButton>
                </div>
              </Card.Content>
            </Card>
          </motion.div>

          {/* Results */}
          {student && studentRecords.length > 0 ? (
            <>
              {/* Student Info & Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <Card className="border-0 shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-islamic to-islamic-light p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-lg">{student.name}</h3>
                        <p className="text-white/70 text-sm">{t('exam.roll')} {student.roll} | {student.department}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-6 h-6 text-golden" />
                        <span className="text-2xl font-bold">{attendancePercent}%</span>
                      </div>
                    </div>
                  </div>
                  <Card.Content className="p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">{t('attendance.total')}</p>
                        <p className="text-lg font-bold text-islamic-dark">{toBangla(studentRecords.length)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">{t('attendance.present')}</p>
                        <p className="text-lg font-bold text-primary">{toBangla(totalPresent)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">{t('attendance.absent')}</p>
                        <p className="text-lg font-bold text-danger">{toBangla(totalAbsent)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">{t('attendance.rate')}</p>
                        <p className={`text-lg font-bold ${attendancePercent >= 75 ? 'text-primary' : 'text-danger'}`}>
                          {attendancePercent}%
                        </p>
                      </div>
                    </div>
                  </Card.Content>
                </Card>
              </motion.div>

              {/* Monthly Summary */}
              {monthlySummary.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-islamic-dark mb-4">{t('attendance.monthlySummary')}</h3>
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  >
                    {monthlySummary.map((ms) => (
                      <motion.div key={ms.month} variants={itemVariants}>
                        <Card className="gap-6 py-6">
                          <Card.Content className="p-4">
                            <h4 className="font-bold text-islamic-dark mb-3">{ms.monthLabel}</h4>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="w-3.5 h-3.5 text-primary" />
                                  <span>{t('attendance.present')}</span>
                                </div>
                                <span className="font-medium text-primary">{toBangla(ms.present)}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <XCircle className="w-3.5 h-3.5 text-danger" />
                                  <span>{t('attendance.absent')}</span>
                                </div>
                                <span className="font-medium text-danger">{toBangla(ms.absent)}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-3.5 h-3.5 text-warning-foreground" />
                                  <span>{t('attendance.late')}</span>
                                </div>
                                <span className="font-medium text-warning-foreground">{toBangla(ms.late)}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="w-3.5 h-3.5 text-islamic" />
                                  <span>{t('attendance.excused')}</span>
                                </div>
                                <span className="font-medium text-islamic-dark">{toBangla(ms.excused)}</span>
                              </div>
                              {/* Progress bar */}
                              <div className="pt-2">
                                <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-islamic rounded-full transition-all"
                                    style={{ width: `${ms.total > 0 ? Math.round((ms.present / ms.total) * 100) : 0}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </Card.Content>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              )}

              {/* Daily Records */}
              <div>
                <h3 className="text-lg font-bold text-islamic-dark mb-4">{t('attendance.dailyRecord')}</h3>
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-3"
                >
                  {studentRecords.map((record) => {
                    const config = statusConfig[record.status] || statusConfig.present;
                    const StatusIcon = config.icon;
                    return (
                      <motion.div key={record.id} variants={itemVariants}>
                        <Card className="border-border hover:shadow-sm transition-shadow">
                          <Card.Content className="p-4 flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
                              <StatusIcon className={`w-5 h-5 ${config.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-islamic-dark">{formatDate(record.date)}</p>
                              <p className="text-xs text-muted-foreground">{record.department} | {record.class}</p>
                            </div>
                            <Chip className={`text-xs border-0 ${
                              record.status === 'present'
                                ? 'bg-primary/10 text-primary'
                                : record.status === 'absent'
                                  ? 'bg-danger/10 text-danger'
                                  : record.status === 'late'
                                    ? 'bg-warning/20 text-warning-foreground'
                                    : 'bg-islamic-lighter text-islamic-dark'
                            }`}>
                              {t(`attendance.${record.status}`)}
                            </Chip>
                          </Card.Content>
                        </Card>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>
            </>
          ) : student && studentRecords.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <ClipboardCheck className="size-16 opacity-15 mx-auto mb-4" />
              <p className="text-base font-medium">{t('attendance.noData')}</p>
            </div>
          ) : searchedRoll ? (
            <div className="text-center py-16 text-muted-foreground">
              <Hash className="size-16 opacity-15 mx-auto mb-4" />
              <p className="text-base font-medium">{t('attendance.noStudent')}</p>
            </div>
          ) : null}
        </div>
      </section>

      <BackToTop />
    </div>
  );
}
