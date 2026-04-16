'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { authFetch } from '@/lib/api';
import { useAppStore } from '@/store/app';
import {
  Printer, Search, FileText, CreditCard, IdCard, Download,
  GraduationCap, BookOpen, CheckCircle, XCircle, Award, User, Phone, MapPin
} from 'lucide-react';
import type { Exam, Marhala, Student, Result, ResultItem, Subject } from '@/types';

export function AdminPrintCenter() {
  const { toast } = useToast();
  const { siteSettings } = useAppStore();
  const [activeTab, setActiveTab] = useState('transcript');

  return (
    <div className="space-y-4 no-print-ancestor">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Printer className="h-5 w-5 text-primary" />
            প্রিন্ট সেন্টার
          </h2>
          <p className="text-sm text-muted-foreground">
            ট্রান্সক্রিপ্ট, এডমিট কার্ড ও আইডি কার্ড প্রিন্ট করুন
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transcript" className="gap-1.5 text-xs sm:text-sm">
            <FileText className="h-4 w-4" />ট্রান্সক্রিপ্ট
          </TabsTrigger>
          <TabsTrigger value="admit-card" className="gap-1.5 text-xs sm:text-sm">
            <CreditCard className="h-4 w-4" />এডমিট কার্ড
          </TabsTrigger>
          <TabsTrigger value="id-card" className="gap-1.5 text-xs sm:text-sm">
            <IdCard className="h-4 w-4" />আইডি কার্ড
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transcript">
          <TranscriptSection siteSettings={siteSettings} />
        </TabsContent>
        <TabsContent value="admit-card">
          <AdmitCardSection siteSettings={siteSettings} />
        </TabsContent>
        <TabsContent value="id-card">
          <IdCardSection siteSettings={siteSettings} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* =========================================
   TRANSCRIPT SECTION
   ========================================= */
function TranscriptSection({ siteSettings }: { siteSettings: Record<string, string | undefined> }) {
  const { toast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [marhalas, setMarhalas] = useState<Marhala[]>([]);
  const [selectedMarhala, setSelectedMarhala] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    authFetch('/api/exams').then(r => r.json()).then(d => setExams(d.exams || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedExam) {
      authFetch(`/api/marhalas?examId=${selectedExam}`).then(r => r.json()).then(d => setMarhalas(d.marhalas || [])).catch(() => {});
    } else { setMarhalas([]); }
    setSelectedMarhala('');
  }, [selectedExam]);

  useEffect(() => {
    if (selectedMarhala) {
      authFetch(`/api/subjects?marhalaId=${selectedMarhala}`).then(r => r.json()).then(d => setSubjects(d.subjects || [])).catch(() => {});
    } else { setSubjects([]); }
  }, [selectedMarhala]);

  const loadStudents = async () => {
    if (!selectedExam || !selectedMarhala) return;
    setLoading(true);
    try {
      const [sRes, rRes] = await Promise.all([
        authFetch('/api/students?limit=200'),
        authFetch(`/api/results/class-wise?examId=${selectedExam}&marhalaId=${selectedMarhala}`)
      ]);
      const sData = await sRes.json();
      const rData = await rRes.json();
      const results = rData.results || [];
      const allStudents = sData.students || [];
      const studentsWithResults = allStudents.filter((s: Student) => results.some((r: Result) => r.studentId === s.id));
      setStudents(studentsWithResults.length > 0 ? studentsWithResults : allStudents);
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }); }
    setLoading(false);
  };

  const fetchResult = async () => {
    if (!selectedExam || !selectedMarhala || !selectedStudent) {
      toast({ title: 'সব কিছু নির্বাচন করুন', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await authFetch('/api/results/search', {
        method: 'POST',
        body: JSON.stringify({ examId: selectedExam, marhalaId: selectedMarhala, studentId: selectedStudent }),
      });
      const data = await res.json();
      if (res.ok && data.result) {
        setResult(data.result);
      } else {
        setResult(null);
        toast({ title: 'ফলাফল পাওয়া যায়নি', description: data.error, variant: 'destructive' });
      }
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }); }
    setLoading(false);
  };

  const handlePrint = () => window.print();

  const getGrade = (marks: number, total: number) => {
    const pct = total > 0 ? (marks / total) * 100 : 0;
    if (pct >= 80) return { grade: 'A+', label: 'অসাধারণ', color: 'text-green-700' };
    if (pct >= 70) return { grade: 'A', label: 'চমৎকার', color: 'text-green-600' };
    if (pct >= 60) return { grade: 'B', label: 'ভালো', color: 'text-blue-600' };
    if (pct >= 50) return { grade: 'C', label: 'মাঝারি', color: 'text-yellow-600' };
    if (pct >= 33) return { grade: 'D', label: 'পাশ', color: 'text-orange-600' };
    return { grade: 'F', label: 'ফেল', color: 'text-red-600' };
  };

  const currentExam = exams.find(e => e.id === selectedExam);
  const currentMarhala = marhalas.find(m => m.id === selectedMarhala);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card className="no-print">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">পরীক্ষা নির্বাচন করুন</Label>
              <Select value={selectedExam} onValueChange={v => { setSelectedExam(v); setResult(null); }}>
                <SelectTrigger><SelectValue placeholder="পরীক্ষা" /></SelectTrigger>
                <SelectContent>{exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name} ({e.year})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">মারহালা নির্বাচন করুন</Label>
              <Select value={selectedMarhala} onValueChange={v => { setSelectedMarhala(v); setResult(null); }}>
                <SelectTrigger><SelectValue placeholder="মারহালা" /></SelectTrigger>
                <SelectContent>{marhalas.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">শিক্ষার্থী</Label>
              <Select value={selectedStudent} onValueChange={v => { setSelectedStudent(v); setResult(null); }}>
                <SelectTrigger><SelectValue placeholder="শিক্ষার্থী নির্বাচন" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {students.length === 0 ? (
                    <div className="py-3 text-center text-sm text-muted-foreground">
                      {selectedMarhala ? 'শিক্ষার্থী লোড করুন' : 'প্রথমে মারহালা নির্বাচন করুন'}
                    </div>
                  ) : students.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name} — রোল: {s.roll}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button variant="outline" onClick={loadStudents} disabled={!selectedMarhala || loading} size="sm">
              <Search className="h-4 w-4 mr-1" />শিক্ষার্থী লোড
            </Button>
            <Button onClick={fetchResult} disabled={!selectedStudent || loading} size="sm">
              <FileText className="h-4 w-4 mr-1" />ট্রান্সক্রিপ্ট দেখুন
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <Card><CardContent className="py-8"><Skeleton className="h-64 w-full" /></CardContent></Card>
      )}

      {/* Transcript Preview */}
      {result && (
        <div className="space-y-3">
          <div className="flex justify-end gap-2 no-print">
            <Button variant="outline" onClick={handlePrint} size="sm">
              <Printer className="h-4 w-4 mr-1" />প্রিন্ট করুন
            </Button>
          </div>

          <div className="transcript-print rounded-lg overflow-hidden shadow-lg">
            {/* Header */}
            <div className="t-header p-4 sm:p-6 text-center">
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                {siteSettings.siteName || 'জামিয়া ইসলামিয়া দারুল উলূম'}
              </h1>
              {siteSettings.siteNameEn && (
                <p className="text-sm text-green-100 mt-0.5">{siteSettings.siteNameEn}</p>
              )}
              {siteSettings.address && (
                <p className="text-xs text-green-100 mt-0.5">{siteSettings.address}</p>
              )}
              <div className="mt-3 bg-white/20 rounded py-1.5 px-4 inline-block">
                <p className="text-base font-bold">ফলাফল ট্রান্সক্রিপ্ট / Marksheet Transcript</p>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {/* Exam & Student Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="bg-green-50 border border-green-200 rounded p-2">
                  <p className="text-[10px] text-muted-foreground">পরীক্ষা</p>
                  <p className="text-sm font-semibold">{currentExam?.name}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded p-2">
                  <p className="text-[10px] text-muted-foreground">সাল</p>
                  <p className="text-sm font-semibold">{currentExam?.year}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded p-2">
                  <p className="text-[10px] text-muted-foreground">মারহালা</p>
                  <p className="text-sm font-semibold">{currentMarhala?.name}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded p-2">
                  <p className="text-[10px] text-muted-foreground">মেধা অবস্থান</p>
                  <p className="text-sm font-semibold text-primary">{result.merit ? `${result.merit} তম` : '-'}</p>
                </div>
              </div>

              {/* Student Details */}
              <div className="bg-gray-50 border rounded-lg p-3 mb-4">
                <h3 className="text-xs font-semibold text-muted-foreground mb-2">শিক্ষার্থীর তথ্য</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                  <div><span className="text-muted-foreground">নাম:</span> <strong>{result.student?.name}</strong></div>
                  <div><span className="text-muted-foreground">রোল:</span> <strong>{result.student?.roll}</strong></div>
                  <div><span className="text-muted-foreground">রেজি. নং:</span> <strong>{result.student?.regNo}</strong></div>
                  <div><span className="text-muted-foreground">পিতা:</span> <strong>{result.student?.fatherName || '-'}</strong></div>
                  <div><span className="text-muted-foreground">মাতা:</span> <strong>{result.student?.motherName || '-'}</strong></div>
                  <div><span className="text-muted-foreground">মাদরাসা:</span> <strong>{result.student?.madrasa || '-'}</strong></div>
                </div>
              </div>

              {/* Subject Table */}
              <Table className="border rounded-lg overflow-hidden mb-4">
                <TableHeader>
                  <TableRow className="bg-green-700 hover:bg-green-700">
                    <TableHead className="text-white text-xs">ক্রমিক</TableHead>
                    <TableHead className="text-white text-xs">বিষয়</TableHead>
                    <TableHead className="text-white text-xs text-center">পূর্ণমান</TableHead>
                    <TableHead className="text-white text-xs text-center">প্রাপ্ত নম্বর</TableHead>
                    <TableHead className="text-white text-xs text-center">গ্রেড</TableHead>
                    <TableHead className="text-white text-xs text-center">অবস্থা</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.items?.map((item, idx) => {
                    const g = getGrade(item.marks, item.subject?.totalMarks || 100);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="text-xs">{idx + 1}</TableCell>
                        <TableCell className="text-xs font-medium">{item.subject?.name}</TableCell>
                        <TableCell className="text-xs text-center">{item.subject?.totalMarks}</TableCell>
                        <TableCell className="text-xs text-center font-bold">{item.marks}</TableCell>
                        <TableCell className="text-xs text-center font-bold">{g.grade}</TableCell>
                        <TableCell className="text-xs text-center">
                          <span className={`inline-flex items-center gap-1 ${item.isPassed ? 'text-green-600' : 'text-red-600'}`}>
                            {item.isPassed ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            {item.isPassed ? 'পাশ' : 'ফেল'}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">মোট পূর্ণমান</p>
                  <p className="text-lg font-bold text-primary">
                    {result.items?.reduce((s, i) => s + (i.subject?.totalMarks || 0), 0) || 0}
                  </p>
                </div>
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">মোট প্রাপ্ত</p>
                  <p className="text-lg font-bold text-primary">{result.totalMarks}</p>
                </div>
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">জিপিএ</p>
                  <p className="text-lg font-bold text-primary">{result.gpa} / 5.00</p>
                </div>
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">শতকরা</p>
                  <p className="text-lg font-bold text-primary">
                    {result.items?.reduce((s, i) => s + (i.subject?.totalMarks || 0), 0) ? 
                      ((result.totalMarks / result.items.reduce((s, i) => s + (i.subject?.totalMarks || 0), 0)) * 100).toFixed(1) : 0}%
                  </p>
                </div>
                <div className={`rounded-lg p-3 text-center ${result.isPassed ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'}`}>
                  <p className="text-[10px] text-muted-foreground">ফলাফল</p>
                  <p className={`text-lg font-bold ${result.isPassed ? 'text-green-700' : 'text-red-700'}`}>
                    {result.isPassed ? 'পাশ' : 'ফেল'}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t pt-3 flex justify-between items-end text-xs text-muted-foreground">
                <div>
                  <p>মোট বিষয়: {result.items?.length || 0} টি</p>
                  <p>মোট পাশ: {result.items?.filter(i => i.isPassed).length || 0} টি</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground">সীলমোহর</p>
                  <div className="w-24 h-16 border-2 border-dashed border-green-300 rounded mt-1 flex items-center justify-center text-[10px] text-green-600">
                    সীল
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">পরীক্ষা নিয়ন্ত্রক</p>
                  <div className="w-24 h-6 border-b border-foreground mt-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================
   ADMIT CARD SECTION
   ========================================= */
function AdmitCardSection({ siteSettings }: { siteSettings: Record<string, string | undefined> }) {
  const { toast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [marhalas, setMarhalas] = useState<Marhala[]>([]);
  const [selectedMarhala, setSelectedMarhala] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [admitCards, setAdmitCards] = useState<(Result & { subjects: Subject[] })[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    authFetch('/api/exams').then(r => r.json()).then(d => setExams(d.exams || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedExam) {
      authFetch(`/api/marhalas?examId=${selectedExam}`).then(r => r.json()).then(d => setMarhalas(d.marhalas || [])).catch(() => {});
    } else { setMarhalas([]); }
    setSelectedMarhala('');
    setGenerated(false);
  }, [selectedExam]);

  useEffect(() => {
    if (selectedMarhala) {
      authFetch(`/api/subjects?marhalaId=${selectedMarhala}`).then(r => r.json()).then(d => setSubjects(d.subjects || [])).catch(() => {});
    } else { setSubjects([]); }
  }, [selectedMarhala]);

  const generateAdmitCards = async () => {
    if (!selectedExam || !selectedMarhala) {
      toast({ title: 'পরীক্ষা ও মারহালা নির্বাচন করুন', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const [rRes, sRes] = await Promise.all([
        authFetch(`/api/results/class-wise?examId=${selectedExam}&marhalaId=${selectedMarhala}`),
        authFetch(`/api/subjects?marhalaId=${selectedMarhala}`)
      ]);
      const rData = await rRes.json();
      const sData = await sRes.json();
      const results = (rData.results || []) as Result[];
      const subs = (sData.subjects || []) as Subject[];
      const cards = results.map(r => ({ ...r, subjects: subs }));
      setAdmitCards(cards);
      setGenerated(true);
      if (cards.length === 0) {
        toast({ title: 'কোনো ফলাফল পাওয়া যায়নি', description: 'প্রথমে ফলাফল তৈরি করুন', variant: 'destructive' });
      }
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }); }
    setLoading(false);
  };

  const handlePrint = () => window.print();

  const currentExam = exams.find(e => e.id === selectedExam);
  const currentMarhala = marhalas.find(m => m.id === selectedMarhala);

  return (
    <div className="space-y-4">
      <Card className="no-print">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">পরীক্ষা নির্বাচন করুন</Label>
              <Select value={selectedExam} onValueChange={setSelectedExam}>
                <SelectTrigger><SelectValue placeholder="পরীক্ষা" /></SelectTrigger>
                <SelectContent>{exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name} ({e.year})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">মারহালা নির্বাচন করুন</Label>
              <Select value={selectedMarhala} onValueChange={setSelectedMarhala}>
                <SelectTrigger><SelectValue placeholder="মারহালা" /></SelectTrigger>
                <SelectContent>{marhalas.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-3 items-center">
            <Button onClick={generateAdmitCards} disabled={!selectedMarhala || loading} size="sm">
              <CreditCard className="h-4 w-4 mr-1" />এডমিট কার্ড তৈরি করুন
            </Button>
            {generated && admitCards.length > 0 && (
              <Badge variant="secondary" className="text-xs">{admitCards.length}টি এডমিট কার্ড</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {loading && <Card><CardContent className="py-8"><Skeleton className="h-64 w-full" /></CardContent></Card>}

      {generated && admitCards.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-end no-print">
            <Button variant="outline" onClick={handlePrint} size="sm">
              <Printer className="h-4 w-4 mr-1" />সব প্রিন্ট করুন ({admitCards.length})
            </Button>
          </div>

          {admitCards.map((card, idx) => (
            <div key={card.id} className="admit-card-print rounded-lg overflow-hidden shadow-md">
              {/* Header */}
              <div className="ac-header p-3 text-center">
                <h2 className="text-base font-bold text-white">
                  {siteSettings.siteName || 'জামিয়া ইসলামিয়া দারুল উলূম'}
                </h2>
                <p className="text-xs text-green-100 mt-0.5">পরীক্ষার এডমিট কার্ড / Admit Card</p>
              </div>

              <div className="p-3 sm:p-4">
                {/* Exam Info Row */}
                <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                  <div className="bg-green-50 border border-green-200 rounded p-1.5 text-center">
                    <p className="text-[10px] text-muted-foreground">পরীক্ষা</p>
                    <p className="font-semibold">{currentExam?.name}</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded p-1.5 text-center">
                    <p className="text-[10px] text-muted-foreground">সাল</p>
                    <p className="font-semibold">{currentExam?.year}</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded p-1.5 text-center">
                    <p className="text-[10px] text-muted-foreground">মারহালা</p>
                    <p className="font-semibold">{currentMarhala?.name}</p>
                  </div>
                </div>

                {/* Student Info */}
                <div className="border rounded-lg p-3 mb-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">নাম:</span>
                      <p className="font-semibold">{card.student?.name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">রোল:</span>
                      <p className="font-semibold font-mono">{card.student?.roll}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">রেজি. নং:</span>
                      <p className="font-semibold font-mono">{card.student?.regNo}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">পিতার নাম:</span>
                      <p className="font-semibold">{card.student?.fatherName || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Subject Schedule Table */}
                <Table className="border rounded overflow-hidden mb-3 text-xs">
                  <TableHeader>
                    <TableRow className="bg-green-100 hover:bg-green-100">
                      <TableHead className="text-green-800 text-[10px]">ক্রমিক</TableHead>
                      <TableHead className="text-green-800 text-[10px]">বিষয়ের নাম</TableHead>
                      <TableHead className="text-green-800 text-[10px] text-center">পূর্ণমান</TableHead>
                      <TableHead className="text-green-800 text-[10px] text-center">পাশ নম্বর</TableHead>
                      <TableHead className="text-green-800 text-[10px] text-center">স্বাক্ষর</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {card.subjects.map((sub, sIdx) => (
                      <TableRow key={sub.id}>
                        <TableCell className="text-center">{sIdx + 1}</TableCell>
                        <TableCell className="font-medium">{sub.name}</TableCell>
                        <TableCell className="text-center">{sub.totalMarks}</TableCell>
                        <TableCell className="text-center">{sub.passMarks || 33}</TableCell>
                        <TableCell className="text-center">
                          <div className="w-16 h-5 border-b border-gray-300" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Instructions */}
                <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-3 text-[10px] text-yellow-800">
                  <p className="font-semibold mb-1">নির্দেশনা:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>পরীক্ষার সময় এই কার্ড সাথে রাখুন।</li>
                    <li>কার্ডের তথ্য যাচাই করুন। কোনো ভুল থাকলে পরীক্ষা শুরুর আগে জানান।</li>
                    <li>অসদাচরণ করলে পরীক্ষা বাতিল হবে।</li>
                    <li>মোবাইল ফোন পরীক্ষা কক্ষে নিষিদ্ধ।</li>
                  </ul>
                </div>

                {/* Signatures */}
                <div className="flex justify-between items-end text-xs">
                  <div className="text-center">
                    <p className="text-muted-foreground">পরীক্ষার্থীর স্বাক্ষর</p>
                    <div className="w-28 h-6 border-b mt-2" />
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">অভিভাবকের স্বাক্ষর</p>
                    <div className="w-28 h-6 border-b mt-2" />
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">প্রধানের স্বাক্ষর ও সীল</p>
                    <div className="w-28 h-6 border-b mt-2" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================
   ID CARD SECTION
   ========================================= */
function IdCardSection({ siteSettings }: { siteSettings: Record<string, string | undefined> }) {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    authFetch('/api/students?limit=200').then(r => r.json()).then(d => setStudents(d.students || [])).catch(() => {});
  }, []);

  const loadStudent = () => {
    if (!selectedStudent) {
      toast({ title: 'শিক্ষার্থী নির্বাচন করুন', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const found = students.find(s => s.id === selectedStudent);
    if (found) {
      setStudent(found);
    } else {
      toast({ title: 'শিক্ষার্থী পাওয়া যায়নি', variant: 'destructive' });
    }
    setLoading(false);
  };

  const handlePrint = () => window.print();

  const currentClass = student?.class;

  return (
    <div className="space-y-4">
      <Card className="no-print">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">শিক্ষার্থী খুঁজুন</Label>
              <Input
                placeholder="নাম, রোল বা রেজি. নং..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">শিক্ষার্থী নির্বাচন</Label>
              <Select value={selectedStudent} onValueChange={v => { setSelectedStudent(v); setStudent(null); }}>
                <SelectTrigger><SelectValue placeholder="শিক্ষার্থী নির্বাচন করুন" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {students.filter(s =>
                    !search ||
                    s.name.includes(search) ||
                    s.roll.includes(search) ||
                    s.regNo.includes(search)
                  ).slice(0, 50).map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} — রোল: {s.roll} — রেজি: {s.regNo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-3">
            <Button onClick={loadStudent} disabled={!selectedStudent || loading} size="sm">
              <IdCard className="h-4 w-4 mr-1" />আইডি কার্ড দেখুন
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && <Card><CardContent className="py-8"><Skeleton className="h-64 w-full" /></CardContent></Card>}

      {student && (
        <div className="space-y-3">
          <div className="flex justify-end no-print">
            <Button variant="outline" onClick={handlePrint} size="sm">
              <Printer className="h-4 w-4 mr-1" />প্রিন্ট করুন
            </Button>
          </div>

          <div className="id-card-print rounded-lg overflow-hidden shadow-lg max-w-sm mx-auto">
            {/* Card Header */}
            <div className="id-header p-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white leading-tight">
                    {siteSettings.siteName || 'জামিয়া ইসলামিয়া দারুল উলূম'}
                  </h2>
                  <p className="text-[9px] text-green-100">শিক্ষার্থী পরিচয়পত্র / Student ID Card</p>
                </div>
              </div>
            </div>

            <div className="p-4">
              {/* Photo & Basic Info */}
              <div className="flex gap-4 mb-4">
                {/* Photo Placeholder */}
                <div className="id-photo w-24 h-28 rounded-lg bg-gray-100 flex flex-col items-center justify-center shrink-0 overflow-hidden">
                  <User className="h-12 w-12 text-gray-300" />
                  <p className="text-[8px] text-gray-400 mt-1">ছবি</p>
                </div>

                {/* Info */}
                <div className="flex-1 space-y-1.5 text-xs">
                  <div>
                    <p className="text-[9px] text-muted-foreground">নাম</p>
                    <p className="font-bold text-sm">{student.name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[9px] text-muted-foreground">রোল নং</p>
                      <p className="font-semibold font-mono">{student.roll}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground">রেজি. নং</p>
                      <p className="font-semibold font-mono">{student.regNo}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] text-muted-foreground">শ্রেণি / মারহালা</p>
                    <p className="font-semibold">{currentClass?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-muted-foreground">রক্তের গ্রুপ</p>
                    <p className="font-semibold">-</p>
                  </div>
                </div>
              </div>

              <Separator className="my-3" />

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px]">
                <div>
                  <p className="text-[9px] text-muted-foreground">পিতার নাম</p>
                  <p className="font-medium">{student.fatherName || '-'}</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground">মাতার নাম</p>
                  <p className="font-medium">{student.motherName || '-'}</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground">জন্ম তারিখ</p>
                  <p className="font-medium">{student.dateOfBirth || '-'}</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground">লিঙ্গ</p>
                  <p className="font-medium">{student.gender === 'male' ? 'পুরুষ' : student.gender === 'female' ? 'মহিলা' : '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[9px] text-muted-foreground">ঠিকানা</p>
                  <p className="font-medium">{student.address || '-'}</p>
                </div>
                {student.phone && (
                  <div>
                    <p className="text-[9px] text-muted-foreground">ফোন</p>
                    <p className="font-medium">{student.phone}</p>
                  </div>
                )}
              </div>

              <Separator className="my-3" />

              {/* Address & Validity */}
              <div className="flex justify-between items-end">
                <div className="text-[9px] text-muted-foreground">
                  {siteSettings.address && (
                    <div className="flex items-center gap-1 mb-1">
                      <MapPin className="h-2.5 w-2.5" />
                      <span>{siteSettings.address}</span>
                    </div>
                  )}
                  {siteSettings.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-2.5 w-2.5" />
                      <span>{siteSettings.phone}</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-muted-foreground">প্রধানের স্বাক্ষর ও সীল</p>
                  <div className="w-20 h-5 border-b mt-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
