'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileText, Clock, Award, Search, FolderOpen, Trophy, Medal, Users, TrendingUp, ChevronRight, Star, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import SectionHeading from './SectionHeading';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { loc } from '@/lib/multilingual';
import { navigateTo } from '@/lib/navigate';

const toBangla = (n: number) => n.toString().replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[parseInt(d)]);

function getGradeColor(grade: string) {
  switch (grade) {
    case 'A+': return 'from-emerald-500 to-green-600';
    case 'A': return 'from-emerald-400 to-teal-500';
    case 'B': return 'from-yellow-400 to-amber-500';
    case 'C': return 'from-orange-400 to-orange-500';
    case 'F': return 'from-red-400 to-red-500';
    default: return 'from-gray-400 to-gray-500';
  }
}

function getRankIcon(index: number) {
  if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
  if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
  if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />;
  return <span className="text-xs font-bold text-islamic">{toBangla(index + 1)}</span>;
}

function getRankBg(index: number) {
  if (index === 0) return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200/60 shadow-yellow-100/50';
  if (index === 1) return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200/60';
  if (index === 2) return 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200/60';
  return 'bg-white border-gray-100';
}

export default function Results({ hideHeading }: { hideHeading?: boolean }) {
  const { results: storeResults, classRoutine: storeRoutine, syllabus: storeSyllabus, exams } = useAppStore();
  const { t, language } = useTranslation();

  // Localized exam display name: prefer the multilingual exam record, fall back to stored name
  const examDisplayName = (examId: string, fallback: string) => {
    const exam = exams.find((e) => e.id === examId);
    return exam ? loc(language, exam, 'name') || fallback : fallback;
  };

  // Build unique exams for filter
  const uniqueExams = useMemo(() => {
    const examMap = new Map<string, { name: string; id: string; count: number }>();
    storeResults.forEach(r => {
      if (r.examId) {
        const existing = examMap.get(r.examId);
        if (existing) {
          existing.count++;
        } else {
          examMap.set(r.examId, { name: examDisplayName(r.examId, r.examName), id: r.examId, count: 1 });
        }
      }
    });
    return Array.from(examMap.values());
  }, [storeResults, exams, language]);

  const [selectedExamFilter, setSelectedExamFilter] = useState<string>('all');

  // Build display data for results
  const examResults = useMemo(() => {
    let filtered = [...storeResults];
    
    // Group by exam if filter selected
    if (selectedExamFilter !== 'all') {
      filtered = filtered.filter(r => r.examId === selectedExamFilter);
    }
    
    if (filtered.length > 0) {
      const sorted = [...filtered].sort((a, b) => (b.obtainedTotal || 0) - (a.obtainedTotal || 0));
      return sorted.slice(0, 10).map((r, index) => ({
        rank: index,
        name: r.studentName,
        department: r.department,
        className: r.class,
        mark: r.obtainedTotal || 0,
        total: r.totalMarks || 0,
        grade: r.grade || 'N/A',
        examName: examDisplayName(r.examId, r.examName),
        percentage: r.totalMarks ? ((r.obtainedTotal || 0) / r.totalMarks * 100) : 0,
      }));
    }
    return [];
  }, [storeResults, selectedExamFilter, exams, language]);

  // Stats
  const stats = useMemo(() => {
    if (storeResults.length === 0) return null;
    const total = storeResults.length;
    const avgPercent = storeResults.reduce((sum, r) => {
      return sum + (r.totalMarks ? (r.obtainedTotal || 0) / r.totalMarks * 100 : 0);
    }, 0) / total;
    const passed = storeResults.filter(r => r.grade && r.grade !== 'F').length;
    const aPlus = storeResults.filter(r => r.grade === 'A+').length;
    return { total, avgPercent: avgPercent.toFixed(1), passed, passRate: ((passed / total) * 100).toFixed(0), aPlus };
  }, [storeResults]);

  return (
    <section id="results" className="py-10 md:py-20 bg-gradient-to-b from-white via-islamic-lighter/30 to-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-islamic/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-golden/5 rounded-full translate-x-1/3 translate-y-1/3" />
      <div className="absolute inset-0 islamic-pattern-bg pointer-events-none opacity-[0.03]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {!hideHeading && (
          <SectionHeading
            title={t('results.title')}
            subtitle={t('results.subtitle')}
            arabicText={t('results.arabic')}
          />
        )}

        {/* Student Result Search Button */}
        <div className="flex justify-center mb-8">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={() => navigateTo('student')}
              className="bg-gradient-to-r from-islamic to-islamic-dark hover:from-islamic-dark hover:to-islamic text-white px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-semibold shadow-lg shadow-islamic/20 rounded-xl gap-2.5 transition-all cursor-pointer"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              {t('nav.studentResult')}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>

        <Tabs defaultValue="results" className="w-full">
          <TabsList className="mx-auto flex w-fit bg-white/80 backdrop-blur-sm border border-islamic/10 p-1 rounded-xl shadow-sm">
            <TabsTrigger
              value="results"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-islamic data-[state=active]:to-islamic-dark data-[state=active]:text-white data-[state=active]:shadow-md px-4 md:px-6 text-xs sm:text-sm rounded-lg transition-all"
            >
              <Award className="w-3.5 h-3.5 mr-1.5 sm:mr-2 hidden sm:inline" />
              {t('results.title')}
            </TabsTrigger>
            <TabsTrigger
              value="routine"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-islamic data-[state=active]:to-islamic-dark data-[state=active]:text-white data-[state=active]:shadow-md px-4 md:px-6 text-xs sm:text-sm rounded-lg transition-all"
            >
              <Clock className="w-3.5 h-3.5 mr-1.5 sm:mr-2 hidden sm:inline" />
              {t('footer.classRoutine')}
            </TabsTrigger>
            <TabsTrigger
              value="syllabus"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-islamic data-[state=active]:to-islamic-dark data-[state=active]:text-white data-[state=active]:shadow-md px-4 md:px-6 text-xs sm:text-sm rounded-lg transition-all"
            >
              <FileText className="w-3.5 h-3.5 mr-1.5 sm:mr-2 hidden sm:inline" />
              {t('footer.syllabus')}
            </TabsTrigger>
          </TabsList>

          {/* Results Tab */}
          <TabsContent value="results" className="mt-6 md:mt-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {examResults.length > 0 ? (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <div className="bg-white rounded-xl border border-islamic/10 p-4 md:p-5 text-center shadow-sm hover:shadow-md transition-shadow">
                          <div className="w-10 h-10 rounded-full bg-islamic-lighter flex items-center justify-center mx-auto mb-2">
                            <Users className="w-5 h-5 text-islamic" />
                          </div>
                          <p className="text-2xl md:text-3xl font-bold text-islamic-dark">{toBangla(stats.total)}</p>
                          <p className="text-xs text-muted-foreground mt-1">{t('results.totalExaminees')}</p>
                        </div>
                      </motion.div>
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <div className="bg-white rounded-xl border border-islamic/10 p-4 md:p-5 text-center shadow-sm hover:shadow-md transition-shadow">
                          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-2">
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                          </div>
                          <p className="text-2xl md:text-3xl font-bold text-islamic-dark">{stats.avgPercent}%</p>
                          <p className="text-xs text-muted-foreground mt-1">{t('results.averagePercentage')}</p>
                        </div>
                      </motion.div>
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <div className="bg-white rounded-xl border border-islamic/10 p-4 md:p-5 text-center shadow-sm hover:shadow-md transition-shadow">
                          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-2">
                            <Award className="w-5 h-5 text-green-600" />
                          </div>
                          <p className="text-2xl md:text-3xl font-bold text-islamic-dark">{toBangla(stats.passed)}</p>
                          <p className="text-xs text-muted-foreground mt-1">{t('results.passed')} ({stats.passRate}%)</p>
                        </div>
                      </motion.div>
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                        <div className="bg-white rounded-xl border border-islamic/10 p-4 md:p-5 text-center shadow-sm hover:shadow-md transition-shadow">
                          <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center mx-auto mb-2">
                            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                          </div>
                          <p className="text-2xl md:text-3xl font-bold text-islamic-dark">{toBangla(stats.aPlus)}</p>
                          <p className="text-xs text-muted-foreground mt-1">{t('results.aPlusObtained')}</p>
                        </div>
                      </motion.div>
                    </div>
                  )}

                  {/* Exam Filter */}
                  {uniqueExams.length > 1 && (
                    <div className="flex flex-wrap gap-2 justify-center">
                      <button
                        onClick={() => setSelectedExamFilter('all')}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                          selectedExamFilter === 'all'
                            ? 'bg-islamic text-white shadow-md'
                            : 'bg-white text-muted-foreground border border-gray-200 hover:border-islamic/30 hover:text-islamic'
                        }`}
                      >
                        {t('results.allExams')}
                      </button>
                      {uniqueExams.map(exam => (
                        <button
                          key={exam.id}
                          onClick={() => setSelectedExamFilter(exam.id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                            selectedExamFilter === exam.id
                              ? 'bg-islamic text-white shadow-md'
                              : 'bg-white text-muted-foreground border border-gray-200 hover:border-islamic/30 hover:text-islamic'
                          }`}
                        >
                          {exam.name}
                          <span className="ml-1 opacity-60">({toBangla(exam.count)})</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Top 3 Podium */}
                  {examResults.length >= 3 && selectedExamFilter !== 'all' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                      {/* 2nd Place */}
                      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="order-2 md:order-1 flex flex-col items-center md:pt-8">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center mb-3 shadow-lg">
                          <Medal className="w-8 h-8 text-gray-600" />
                        </div>
                        <p className="font-bold text-islamic-dark text-center">{examResults[1]?.name}</p>
                        <p className="text-xs text-muted-foreground">{examResults[1]?.department}</p>
                        <div className="mt-2 bg-gray-100 rounded-lg px-4 py-2 text-center">
                          <p className="text-xl font-bold text-islamic-dark">{toBangla(examResults[1]?.mark || 0)}</p>
                          <p className="text-[10px] text-muted-foreground">{t('results.secondPlace')}</p>
                        </div>
                      </motion.div>
                      {/* 1st Place */}
                      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="order-1 md:order-2 flex flex-col items-center">
                        <div className="relative">
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-300 to-amber-400 flex items-center justify-center mb-3 shadow-lg shadow-yellow-200/50 ring-4 ring-yellow-100">
                            <Trophy className="w-10 h-10 text-yellow-700" />
                          </div>
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-golden rounded-full flex items-center justify-center text-white text-xs font-bold shadow">
                            {t('results.first')}
                          </div>
                        </div>
                        <p className="font-bold text-lg text-islamic-dark text-center">{examResults[0]?.name}</p>
                        <p className="text-xs text-muted-foreground">{examResults[0]?.department}</p>
                        <div className="mt-2 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl px-5 py-3 text-center shadow-sm">
                          <p className="text-2xl font-bold text-islamic-dark">{toBangla(examResults[0]?.mark || 0)}</p>
                          <p className="text-[10px] text-amber-600 font-medium">{t('results.champion')}</p>
                        </div>
                      </motion.div>
                      {/* 3rd Place */}
                      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="order-3 flex flex-col items-center md:pt-8">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-200 to-amber-300 flex items-center justify-center mb-3 shadow-lg">
                          <Medal className="w-8 h-8 text-orange-600" />
                        </div>
                        <p className="font-bold text-islamic-dark text-center">{examResults[2]?.name}</p>
                        <p className="text-xs text-muted-foreground">{examResults[2]?.department}</p>
                        <div className="mt-2 bg-orange-50 rounded-lg px-4 py-2 text-center border border-orange-100">
                          <p className="text-xl font-bold text-islamic-dark">{toBangla(examResults[2]?.mark || 0)}</p>
                          <p className="text-[10px] text-muted-foreground">{t('results.thirdPlace')}</p>
                        </div>
                      </motion.div>
                    </div>
                  )}

                  {/* Results List */}
                  <Card className="border-none shadow-lg overflow-hidden rounded-2xl">
                    <div className="bg-gradient-to-r from-islamic via-islamic-dark to-islamic px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                          <Award className="w-5 h-5 text-golden" />
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-sm sm:text-base">{t('results.meritList')}</h3>
                          <p className="text-white/60 text-xs">{t('results.topStudents').replace('{count}', toBangla(examResults.length))}</p>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-0">
                      <div className="divide-y divide-gray-50">
                        <AnimatePresence>
                          {examResults.map((result, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className={`flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3.5 sm:py-4 hover:bg-islamic-lighter/20 transition-colors ${index < 3 ? getRankBg(index) : 'bg-white'}`}
                            >
                              {/* Rank */}
                              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 shadow-md shadow-yellow-200/50' :
                                index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 shadow-md' :
                                index === 2 ? 'bg-gradient-to-br from-orange-300 to-amber-400 shadow-md' :
                                'bg-islamic-lighter'
                              }`}>
                                {getRankIcon(index)}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-islamic-dark text-sm sm:text-base truncate">{result.name}</p>
                                  {index === 0 && (
                                    <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 text-[10px] font-bold">
                                      {t('results.champion')}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
                                  {result.department && (
                                    <span className="text-xs text-muted-foreground hidden sm:inline">{result.department}</span>
                                  )}
                                  {result.department && result.className && (
                                    <span className="text-xs text-muted-foreground hidden sm:inline">|</span>
                                  )}
                                  {result.className && (
                                    <span className="text-xs text-muted-foreground hidden sm:inline">{result.className}</span>
                                  )}
                                </div>
                                {/* Progress bar */}
                                <div className="mt-1.5 hidden sm:block">
                                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full bg-gradient-to-r ${getGradeColor(result.grade)} transition-all duration-700`}
                                      style={{ width: `${Math.min(result.percentage, 100)}%` }}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Marks & Grade */}
                              <div className="text-right shrink-0">
                                <p className="font-bold text-islamic-dark text-sm sm:text-lg">
                                  {toBangla(result.mark)}<span className="text-xs text-muted-foreground font-normal">/{toBangla(result.total)}</span>
                                </p>
                                <Badge className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 border ${
                                  result.grade === 'A+' ? 'bg-green-50 text-green-700 border-green-200' :
                                  result.grade === 'A' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  result.grade === 'B' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                  result.grade === 'C' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                  result.grade === 'F' ? 'bg-red-50 text-red-700 border-red-200' :
                                  'bg-gray-50 text-gray-700 border-gray-200'
                                }`}>
                                  {result.grade}
                                </Badge>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <div className="w-20 h-20 rounded-full bg-islamic-lighter/50 flex items-center justify-center mb-4">
                    <FolderOpen className="size-10 opacity-30" />
                  </div>
                  <p className="text-sm font-medium">{t('results.noData')}</p>
                  <p className="text-xs mt-1 opacity-60">{t('results.addFromAdmin')}</p>
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* Routine Tab */}
          <TabsContent value="routine" className="mt-6 md:mt-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {storeRoutine.length > 0 ? (
                <Card className="border-none shadow-lg overflow-hidden rounded-2xl">
                  <div className="bg-gradient-to-r from-islamic via-islamic-dark to-islamic px-4 sm:px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                        <Clock className="w-5 h-5 text-golden" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-sm sm:text-base">{t('footer.classRoutine')}</h3>
                        <p className="text-white/60 text-xs">{t('results.weeklyActivities')}</p>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-0">
                    <div className="divide-y divide-gray-50">
                      {storeRoutine.map((item, index) => (
                        <div key={index} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3.5 sm:py-4 hover:bg-islamic-lighter/20 transition-colors">
                          <div className="w-10 h-10 rounded-xl bg-islamic-lighter flex items-center justify-center shrink-0">
                            <Clock className="w-4 h-4 text-islamic" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-islamic-dark text-sm">{item.subject}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">{item.teacher}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-semibold text-islamic">{item.time}</p>
                            <p className="text-[10px] text-muted-foreground">{item.duration}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <div className="w-20 h-20 rounded-full bg-islamic-lighter/50 flex items-center justify-center mb-4">
                    <FolderOpen className="size-10 opacity-30" />
                  </div>
                  <p className="text-sm font-medium">{t('results.routineComingSoon')}</p>
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* Syllabus Tab */}
          <TabsContent value="syllabus" className="mt-6 md:mt-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {storeSyllabus.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {storeSyllabus.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="hover:shadow-lg transition-all border border-gray-100 group cursor-pointer rounded-xl overflow-hidden">
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-islamic-lighter to-islamic/10 flex items-center justify-center shrink-0 group-hover:from-islamic group-hover:to-islamic-dark transition-all">
                            <BookOpen className="w-5 h-5 text-islamic group-hover:text-white transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-islamic-dark group-hover:text-islamic transition-colors truncate">
                              {item.name}
                            </h4>
                            <p className="text-xs text-muted-foreground">{item.year}</p>
                          </div>
                          <Download className="w-4 h-4 text-gray-300 group-hover:text-islamic group-hover:translate-x-0.5 transition-all" />
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <div className="w-20 h-20 rounded-full bg-islamic-lighter/50 flex items-center justify-center mb-4">
                    <FolderOpen className="size-10 opacity-30" />
                  </div>
                  <p className="text-sm font-medium">{t('results.syllabusComingSoon')}</p>
                </div>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
