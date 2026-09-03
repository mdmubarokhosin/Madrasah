'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardCheck, Search, Hash, Calendar, CheckCircle, XCircle,
  Clock, AlertTriangle, UserCheck,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import PageBanner from '@/components/pages/PageBanner';
import BackToTop from '@/components/pages/BackToTop';
import PageSkeleton from '@/components/pages/PageSkeleton';
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
  present: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
  absent: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  late: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  excused: { icon: AlertTriangle, color: 'text-blue-600', bg: 'bg-blue-50' },
};

const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const toBangla = (n: number) => n.toString().replace(/\d/g, (d) => banglaDigits[parseInt(d)]);

export default function AttendancePage() {
  const { students, dataLoaded } = useAppStore();
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

  if (!dataLoaded) return <PageSkeleton cards={4} showStats showBanner />;

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
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-islamic-dark mb-4 text-center">
                  {t('attendance.rollPlaceholder')}
                </h3>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={t('attendance.rollInput')}
                      value={rollInput}
                      onChange={(e) => setRollInput(e.target.value)}
                      aria-label={t('attendance.rollPlaceholder')}
                      className="pl-10"
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <Button onClick={handleSearch} className="bg-islamic hover:bg-islamic-light text-white">
                    {t('attendance.search')}
                  </Button>
                </div>
              </CardContent>
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
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">{t('attendance.total')}</p>
                        <p className="text-lg font-bold text-islamic-dark">{toBangla(studentRecords.length)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">{t('attendance.present')}</p>
                        <p className="text-lg font-bold text-green-600">{toBangla(totalPresent)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">{t('attendance.absent')}</p>
                        <p className="text-lg font-bold text-red-600">{toBangla(totalAbsent)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">{t('attendance.rate')}</p>
                        <p className={`text-lg font-bold ${attendancePercent >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                          {attendancePercent}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
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
                        <Card>
                          <CardContent className="p-4">
                            <h4 className="font-bold text-islamic-dark mb-3">{ms.monthLabel}</h4>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                  <span>{t('attendance.present')}</span>
                                </div>
                                <span className="font-medium text-green-600">{toBangla(ms.present)}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <XCircle className="w-3.5 h-3.5 text-red-500" />
                                  <span>{t('attendance.absent')}</span>
                                </div>
                                <span className="font-medium text-red-600">{toBangla(ms.absent)}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-3.5 h-3.5 text-yellow-500" />
                                  <span>{t('attendance.late')}</span>
                                </div>
                                <span className="font-medium text-yellow-600">{toBangla(ms.late)}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="w-3.5 h-3.5 text-blue-500" />
                                  <span>{t('attendance.excused')}</span>
                                </div>
                                <span className="font-medium text-blue-600">{toBangla(ms.excused)}</span>
                              </div>
                              {/* Progress bar */}
                              <div className="pt-2">
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-islamic rounded-full transition-all"
                                    style={{ width: `${ms.total > 0 ? Math.round((ms.present / ms.total) * 100) : 0}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </CardContent>
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
                        <Card className="border-gray-100 hover:shadow-sm transition-shadow">
                          <CardContent className="p-4 flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
                              <StatusIcon className={`w-5 h-5 ${config.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-islamic-dark">{formatDate(record.date)}</p>
                              <p className="text-xs text-muted-foreground">{record.department} | {record.class}</p>
                            </div>
                            <Badge className={`text-xs border-0 ${
                              record.status === 'present'
                                ? 'bg-green-100 text-green-700'
                                : record.status === 'absent'
                                  ? 'bg-red-100 text-red-700'
                                  : record.status === 'late'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-blue-100 text-blue-700'
                            }`}>
                              {t(`attendance.${record.status}`)}
                            </Badge>
                          </CardContent>
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
