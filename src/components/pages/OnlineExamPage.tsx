'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardList, Timer, CheckCircle, XCircle, ArrowLeft, ArrowRight,
  Send, AlertCircle, Trophy, User, Hash,
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
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function OnlineExamPage() {
  const { onlineExams, examSubmissions, dataLoaded } = useAppStore();
  const { t } = useTranslation();

  const [studentName, setStudentName] = useState('');
  const [studentRoll, setStudentRoll] = useState('');
  const [activeExam, setActiveExam] = useState<typeof onlineExams[0] | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [examStarted, setExamStarted] = useState(false);
  const [examFinished, setExamFinished] = useState(false);
  const [result, setResult] = useState<{ marks: number; total: number; passed: boolean } | null>(null);

  const publishedExams = onlineExams.filter((e) => e.status === 'published');

  const handleStartExam = useCallback((exam: typeof onlineExams[0]) => {
    if (!studentName.trim() || !studentRoll.trim()) return;
    setActiveExam(exam);
    setCurrentQ(0);
    setAnswers(new Array(exam.questions.length).fill(-1));
    setTimeLeft(exam.duration * 60);
    setExamStarted(true);
    setExamFinished(false);
    setResult(null);
  }, [studentName, studentRoll]);

  const handleSelectOption = (optionIndex: number) => {
    if (!activeExam) return;
    const newAnswers = [...answers];
    newAnswers[currentQ] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = useCallback(async () => {
    if (!activeExam) return;
    let marks = 0;
    activeExam.questions.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) {
        marks += q.marks || 1;
      }
    });
    const passThreshold = activeExam.passMarks || Math.floor(activeExam.totalMarks * 0.4);
    const passed = marks >= passThreshold;
    setResult({ marks, total: activeExam.totalMarks, passed });

    // Log activity
    try {
      (useAppStore.getState() as any).logActivity('অনলাইন পরীক্ষা', `${studentName} পরীক্ষায় অংশগ্রহণ করেছে - প্রাপ্ত: ${marks}/${activeExam.totalMarks}`);
    } catch {}

    // Save submission to DB for duplicate prevention
    try {
      const { dbPush } = await import('@/lib/db-service');
      dbPush('/examSubmissions', {
        examId: activeExam.id,
        studentName: studentName.trim(),
        studentRoll: studentRoll.trim(),
        answers: answers,
        obtainedMarks: marks,
        totalMarks: activeExam.totalMarks,
        submittedAt: Date.now(),
      }).catch(() => {});
    } catch {}

    setExamFinished(true);
    setExamStarted(false);
  }, [activeExam, answers, studentName, studentRoll]);

  // Keep a ref to the latest handleSubmit to avoid stale closure
  const handleSubmitRef = useRef(handleSubmit);
  handleSubmitRef.current = handleSubmit;

  // Auto-submit when timer reaches zero
  useEffect(() => {
    if (timeLeft === 0 && !examFinished && examStarted) {
      handleSubmitRef.current();
    }
  }, [timeLeft, examFinished, examStarted]);

  // Timer
  useEffect(() => {
    if (!examStarted || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [examStarted]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!dataLoaded) return <PageSkeleton cards={4} showStats />;

  // Exam in progress
  if (examStarted && activeExam) {
    const question = activeExam.questions[currentQ];
    return (
      <div className="pt-0 min-h-screen bg-gradient-to-b from-islamic-lighter/20 to-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          {/* Header */}
          <div className="bg-islamic text-white rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg">{activeExam.title}</h2>
                <p className="text-white/70 text-sm">{studentName} | {t('exam.roll')} {studentRoll}</p>
              </div>
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-golden" />
                <span className={`text-xl font-mono font-bold ${timeLeft < 60 ? 'text-red-300 animate-pulse' : 'text-golden'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-white/60">
              <span>{t('onlineExamPage.questionOf', { current: currentQ + 1, total: activeExam.questions.length })}</span>
              <span>{t('exam.totalMarksShort')} {activeExam.totalMarks}</span>
            </div>
            {/* Progress dots */}
            <div className="mt-3 flex gap-1 flex-wrap">
              {activeExam.questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentQ(i)}
                  aria-label={t('onlineExamPage.questionAria', { number: i + 1 })}
                  className={`w-6 h-6 rounded-full text-xs flex items-center justify-center cursor-pointer transition-colors ${
                    i === currentQ
                      ? 'bg-golden text-islamic-dark font-bold'
                      : answers[i] >= 0
                        ? 'bg-green-500 text-white'
                        : 'bg-white/20 text-white/60'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Question */}
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <Badge className="bg-islamic text-white flex-shrink-0">
                    {t('exam.question')} {currentQ + 1}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{t('onlineExamPage.marksValue', { marks: question.marks ?? 1 })}</span>
                </div>
                <p className="text-lg font-medium text-islamic-dark mb-6">{question.question}</p>
                <div className="space-y-3">
                  {question.options.map((opt, oi) => (
                    <button
                      key={oi}
                      onClick={() => handleSelectOption(oi)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        answers[currentQ] === oi
                          ? 'border-islamic bg-islamic/5 text-islamic-dark font-medium'
                          : 'border-gray-200 hover:border-islamic/30 hover:bg-gray-50'
                      }`}
                    >
                      <span className="inline-flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium flex-shrink-0">
                          {String.fromCharCode(65 + oi)}
                        </span>
                        {opt}
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
              disabled={currentQ === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('exam.prev')}
            </Button>
            {currentQ < activeExam.questions.length - 1 ? (
              <Button onClick={() => setCurrentQ(currentQ + 1)}>
                {t('exam.next')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 text-white">
                <Send className="w-4 h-4 mr-2" />
                {t('exam.submit')}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Result view
  if (examFinished && result) {
    return (
      <div className="pt-0 min-h-screen bg-gradient-to-b from-islamic-lighter/20 to-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full mx-4"
        >
          <Card className="text-center overflow-hidden">
            <div className={`p-8 ${result.passed ? 'bg-green-500' : 'bg-red-500'} text-white`}>
              {result.passed ? (
                <Trophy className="w-16 h-16 mx-auto mb-3" />
              ) : (
                <XCircle className="w-16 h-16 mx-auto mb-3" />
              )}
              <h2 className="text-2xl font-bold">{result.passed ? t('exam.passed') : t('exam.failed')}</h2>
            </div>
            <CardContent className="p-6 space-y-4">
              <p className="text-lg font-semibold text-islamic-dark">{activeExam?.title}</p>
              <p>{studentName} | {t('exam.roll')} {studentRoll}</p>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">{t('exam.obtainedMarks')}</p>
                  <p className="text-2xl font-bold text-green-600">{result.marks}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">{t('exam.totalMarks')}</p>
                  <p className="text-2xl font-bold text-blue-600">{result.total}</p>
                </div>
              </div>
              <Button
                onClick={() => {
                  setActiveExam(null);
                  setExamFinished(false);
                  setResult(null);
                }}
                className="w-full bg-islamic hover:bg-islamic-light text-white"
              >
                {t('exam.backToList')}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-0">
      <PageBanner
        titleKey="exam.title"
        arabicText="الامتحان عبر الإنترنت"
        subtitleKey="exam.subtitle"
      />

      <section className="py-12 bg-islamic-lighter/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Student Info Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-lg mx-auto mb-10"
          >
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-islamic-dark mb-4 text-center">
                  {t('exam.studentInfo')}
                </h3>
                <div className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={t('exam.yourName')}
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={t('exam.yourRoll')}
                      value={studentRoll}
                      onChange={(e) => setStudentRoll(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Published Exams */}
          {publishedExams.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {publishedExams.map((exam) => {
                const alreadySubmitted = examSubmissions.some(
                  (s) => s.examId === exam.id && s.studentRoll === studentRoll
                );
                return (
                  <motion.div key={exam.id} variants={itemVariants}>
                    <Card className="h-full hover:shadow-lg transition-shadow border border-gray-100">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-islamic-lighter flex items-center justify-center flex-shrink-0">
                            <ClipboardList className="w-5 h-5 text-islamic" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-islamic-dark">{exam.title}</h3>
                            <p className="text-sm text-muted-foreground">{exam.subject}</p>
                          </div>
                        </div>
                        <div className="space-y-2 mb-4 text-sm text-muted-foreground">
                          <div className="flex justify-between">
                            <span>{t('exam.duration')}</span>
                            <span className="font-medium text-islamic-dark">{t('onlineExamPage.minutes', { count: exam.duration })}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t('exam.totalMarks')}</span>
                            <span className="font-medium text-islamic-dark">{exam.totalMarks}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t('exam.passMarks')}</span>
                            <span className="font-medium text-islamic-dark">{exam.passMarks || Math.floor(exam.totalMarks * 0.4)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t('exam.questionCount')}</span>
                            <span className="font-medium text-islamic-dark">{exam.questions.length}</span>
                          </div>
                        </div>
                        {alreadySubmitted ? (
                          <Badge className="bg-green-100 text-green-700 border-0 w-full justify-center py-2">
                            <CheckCircle className="w-4 h-4 mr-1" /> {t('exam.alreadyTaken')}
                          </Badge>
                        ) : (
                          <Button
                            onClick={() => handleStartExam(exam)}
                            disabled={!studentName.trim() || !studentRoll.trim()}
                            className="w-full bg-islamic hover:bg-islamic-light text-white"
                          >
                            {t('exam.start')}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ClipboardList className="size-16 opacity-15 mb-4" />
              <p className="text-base font-medium">{t('exam.noExam')}</p>
            </div>
          )}
        </div>
      </section>

      <BackToTop />
    </div>
  );
}
