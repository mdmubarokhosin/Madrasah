'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen, Trophy, AlertCircle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Exam, Marhala, Result } from '@/types';

export function ResultPage() {
  const { toast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [marhalas, setMarhalas] = useState<Marhala[]>([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedMarhala, setSelectedMarhala] = useState('');
  const [roll, setRoll] = useState('');
  const [regNo, setRegNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [individualResult, setIndividualResult] = useState<Result | null>(null);
  const [classResults, setClassResults] = useState<Result[]>([]);
  const [meritResults, setMeritResults] = useState<Result[]>([]);
  const [activeTab, setActiveTab] = useState('individual');
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    fetch('/api/exams/public')
      .then((r) => r.json())
      .then((d) => setExams(d.exams || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedExam) {
      fetch(`/api/marhalas?examId=${selectedExam}`)
        .then((r) => r.json())
        .then((d) => { setMarhalas(d.marhalas || []); setSelectedMarhala(''); })
        .catch(() => {});
    } else { setMarhalas([]); setSelectedMarhala(''); }
  }, [selectedExam]);

  if (exams.length === 0) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-center">পরীক্ষার ফলাফল</h1>
          <Card>
            <CardContent className="py-10 sm:py-12 text-center px-4">
              <Info className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">কোনো প্রকাশিত পরীক্ষা নেই</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                এখনো কোনো পরীক্ষার ফলাফল প্রকাশ করা হয়নি। পরে আবার চেষ্টা করুন।
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const searchIndividual = async () => {
    if (!selectedExam || !selectedMarhala) {
      toast({ title: 'ত্রুটি', description: 'পরীক্ষা ও মারহালা নির্বাচন করুন', variant: 'destructive' });
      return;
    }
    if (!roll && !regNo) {
      toast({ title: 'ত্রুটি', description: 'রোল বা রেজিস্ট্রেশন নম্বর লিখুন', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setIndividualResult(null);
    setSearched(true);
    try {
      const res = await fetch('/api/results/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId: selectedExam, marhalaId: selectedMarhala, roll, regNo }),
      });
      const data = await res.json();
      if (res.ok) {
        setIndividualResult(data.result);
      } else {
        toast({ title: 'ফলাফল পাওয়া যায়নি', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'সার্ভারে সমস্যা হয়েছে', variant: 'destructive' });
    }
    setLoading(false);
  };

  const loadClassResults = async () => {
    if (!selectedExam || !selectedMarhala) {
      toast({ title: 'ত্রুটি', description: 'পরীক্ষা ও মারহালা নির্বাচন করুন', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/results/class-wise?examId=${selectedExam}&marhalaId=${selectedMarhala}`);
      const data = await res.json();
      setClassResults(data.results || []);
    } catch {
      toast({ title: 'ত্রুটি', description: 'সার্ভারে সমস্যা হয়েছে', variant: 'destructive' });
    }
    setLoading(false);
  };

  const loadMeritList = async () => {
    if (!selectedExam || !selectedMarhala) {
      toast({ title: 'ত্রুটি', description: 'পরীক্ষা ও মারহালা নির্বাচন করুন', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/results/merit-list?examId=${selectedExam}&marhalaId=${selectedMarhala}`);
      const data = await res.json();
      setMeritResults(data.results || []);
    } catch {
      toast({ title: 'ত্রুটি', description: 'সার্ভারে সমস্যা হয়েছে', variant: 'destructive' });
    }
    setLoading(false);
  };

  const selectExamAndMarhala = (examId: string) => {
    setSelectedExam(examId); setSelectedMarhala('');
    setIndividualResult(null); setClassResults([]); setMeritResults([]); setSearched(false);
  };

  const selectMarhala = (marhalaId: string) => {
    setSelectedMarhala(marhalaId);
    setIndividualResult(null); setClassResults([]); setMeritResults([]); setSearched(false);
  };

  const ExamMarhalaSelectors = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      <div className="space-y-1.5">
        <Label className="text-xs sm:text-sm">পরীক্ষা নির্বাচন করুন</Label>
        <Select value={selectedExam} onValueChange={selectExamAndMarhala}>
          <SelectTrigger className="text-sm"><SelectValue placeholder="পরীক্ষা নির্বাচন করুন" /></SelectTrigger>
          <SelectContent>
            {exams.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.name} ({e.year})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs sm:text-sm">মারহালা নির্বাচন করুন</Label>
        <Select value={selectedMarhala} onValueChange={selectMarhala}>
          <SelectTrigger className="text-sm"><SelectValue placeholder={selectedExam ? 'মারহালা নির্বাচন করুন' : 'প্রথমে পরীক্ষা নির্বাচন করুন'} /></SelectTrigger>
          <SelectContent>
            {marhalas.length === 0 && selectedExam ? (
              <div className="py-2 px-3 text-xs sm:text-sm text-muted-foreground">এই পরীক্ষায় কোনো মারহালা নেই</div>
            ) : (
              marhalas.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <Card className="mt-4 sm:mt-6">
      <CardContent className="py-8 sm:py-10 text-center px-4">
        <AlertCircle className="h-8 w-8 sm:h-10 sm:w-10 mx-auto text-muted-foreground mb-2 sm:mb-3" />
        <p className="text-xs sm:text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-center">পরীক্ষার ফলাফল</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6">
            <TabsTrigger value="individual" className="text-xs sm:text-sm flex items-center gap-1">
              <Search className="h-3.5 w-3.5 hidden xs:block" />ব্যক্তিগত
            </TabsTrigger>
            <TabsTrigger value="classwise" className="text-xs sm:text-sm flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5 hidden xs:block" />ক্লাস ভিত্তিক
            </TabsTrigger>
            <TabsTrigger value="merit" className="text-xs sm:text-sm flex items-center gap-1">
              <Trophy className="h-3.5 w-3.5 hidden xs:block" />মেধাতালিকা
            </TabsTrigger>
          </TabsList>

          {/* Individual Result Tab */}
          <TabsContent value="individual">
            <Card>
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-sm sm:text-lg">ব্যক্তিগত ফলাফল দেখুন</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <ExamMarhalaSelectors />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm">রোল নম্বর</Label>
                    <Input value={roll} onChange={(e) => setRoll(e.target.value)} placeholder="রোল নম্বর" className="text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm">রেজিস্ট্রেশন নম্বর</Label>
                    <Input value={regNo} onChange={(e) => setRegNo(e.target.value)} placeholder="রেজিস্ট্রেশন নম্বর" className="text-sm" />
                  </div>
                </div>
                <Button onClick={searchIndividual} disabled={loading} className="w-full sm:w-auto h-10 sm:h-11">
                  <Search className="mr-2 h-4 w-4" />
                  {loading ? 'খোঁজা হচ্ছে...' : 'ফলাফল খুঁজুন'}
                </Button>
              </CardContent>
            </Card>

            {searched && !individualResult && !loading && (
              <EmptyState message="কোনো ফলাফল পাওয়া যায়নি। সঠিক তথ্য দিয়ে আবার খুঁজুন।" />
            )}

            {individualResult && (
              <Card className="mt-4 sm:mt-6">
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="text-sm sm:text-lg">ফলাফল</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Student Info - Mobile friendly cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="bg-muted rounded-lg p-2 sm:p-3">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">নাম</p>
                      <p className="font-semibold text-xs sm:text-sm truncate">{individualResult.student?.name}</p>
                    </div>
                    <div className="bg-muted rounded-lg p-2 sm:p-3">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">রোল</p>
                      <p className="font-semibold text-xs sm:text-sm">{individualResult.student?.roll}</p>
                    </div>
                    <div className="bg-muted rounded-lg p-2 sm:p-3">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">রেজি. নং</p>
                      <p className="font-semibold text-xs sm:text-sm">{individualResult.student?.regNo}</p>
                    </div>
                    <div className="bg-muted rounded-lg p-2 sm:p-3">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">মেধা</p>
                      <p className="font-semibold text-xs sm:text-sm text-emerald-600">{individualResult.merit || '-'}</p>
                    </div>
                    <div className="bg-muted rounded-lg p-2 sm:p-3 col-span-2 sm:col-span-1">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">অবস্থা</p>
                      <Badge variant={individualResult.isPassed ? 'default' : 'destructive'} className="text-[10px] sm:text-xs">
                        {individualResult.isPassed ? 'পাশ' : 'ফেল'}
                      </Badge>
                    </div>
                  </div>

                  {/* Subject marks - scrollable on mobile */}
                  <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs sm:text-sm">বিষয়</TableHead>
                          <TableHead className="text-center text-xs sm:text-sm">মোট</TableHead>
                          <TableHead className="text-center text-xs sm:text-sm">প্রাপ্ত</TableHead>
                          <TableHead className="text-center text-xs sm:text-sm">অবস্থা</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {individualResult.items?.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-xs sm:text-sm">{item.subject?.name}</TableCell>
                            <TableCell className="text-center text-xs sm:text-sm">{item.subject?.totalMarks}</TableCell>
                            <TableCell className="text-center font-semibold text-xs sm:text-sm">{item.marks}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={item.isPassed ? 'default' : 'destructive'} className="text-[10px] sm:text-xs">
                                {item.isPassed ? 'পাশ' : 'ফেল'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Summary */}
                  <div className="mt-3 sm:mt-4 flex flex-wrap gap-2 sm:gap-3">
                    <div className="bg-primary/10 rounded-lg px-3 sm:px-4 py-2">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">মোট নম্বর</p>
                      <p className="text-lg sm:text-xl font-bold text-primary">{individualResult.totalMarks}</p>
                    </div>
                    <div className="bg-amber-500/10 rounded-lg px-3 sm:px-4 py-2">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">জিপিএ</p>
                      <p className="text-lg sm:text-xl font-bold text-amber-600">{individualResult.gpa}</p>
                    </div>
                    {individualResult.merit && (
                      <div className="bg-emerald-500/10 rounded-lg px-3 sm:px-4 py-2">
                        <p className="text-[10px] sm:text-xs text-muted-foreground">মেধা অবস্থান</p>
                        <p className="text-lg sm:text-xl font-bold text-emerald-600">{individualResult.merit}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Class-wise Tab */}
          <TabsContent value="classwise">
            <Card>
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-sm sm:text-lg">ক্লাস ভিত্তিক ফলাফল</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <ExamMarhalaSelectors />
                <Button onClick={loadClassResults} disabled={loading} className="h-10 sm:h-11">
                  <Search className="mr-2 h-4 w-4" />
                  {loading ? 'লোড হচ্ছে...' : 'ফলাফল দেখুন'}
                </Button>
              </CardContent>
            </Card>

            {searched && classResults.length === 0 && !loading && (
              <EmptyState message="কোনো ফলাফল পাওয়া যায়নি।" />
            )}

            {classResults.length > 0 && (
              <Card className="mt-4 sm:mt-6">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-xs sm:text-sm text-muted-foreground">
                    মোট {classResults.length} জন — পাশ: {classResults.filter(r => r.isPassed).length} — ফেল: {classResults.filter(r => !r.isPassed).length}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 sm:p-6">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10 text-xs sm:text-sm">মেধা</TableHead>
                          <TableHead className="text-xs sm:text-sm">নাম</TableHead>
                          <TableHead className="text-center text-xs sm:text-sm">রোল</TableHead>
                          <TableHead className="text-center hidden sm:table-cell text-xs sm:text-sm">রেজি.</TableHead>
                          <TableHead className="text-center text-xs sm:text-sm">মোট</TableHead>
                          <TableHead className="text-center text-xs sm:text-sm">জিপিএ</TableHead>
                          <TableHead className="text-center text-xs sm:text-sm">অবস্থা</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {classResults.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-bold text-xs sm:text-sm">{r.merit}</TableCell>
                            <TableCell className="text-xs sm:text-sm">{r.student?.name}</TableCell>
                            <TableCell className="text-center text-xs sm:text-sm">{r.student?.roll}</TableCell>
                            <TableCell className="text-center hidden sm:table-cell text-xs sm:text-sm">{r.student?.regNo}</TableCell>
                            <TableCell className="text-center text-xs sm:text-sm">{r.totalMarks}</TableCell>
                            <TableCell className="text-center font-semibold text-xs sm:text-sm">{r.gpa}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={r.isPassed ? 'default' : 'destructive'} className="text-[10px] sm:text-xs">
                                {r.isPassed ? 'পাশ' : 'ফেল'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Merit List Tab */}
          <TabsContent value="merit">
            <Card>
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-sm sm:text-lg">মেধাতালিকা</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <ExamMarhalaSelectors />
                <Button onClick={loadMeritList} disabled={loading} className="h-10 sm:h-11">
                  <Trophy className="mr-2 h-4 w-4" />
                  {loading ? 'লোড হচ্ছে...' : 'মেধাতালিকা দেখুন'}
                </Button>
              </CardContent>
            </Card>

            {searched && meritResults.length === 0 && !loading && (
              <EmptyState message="কোনো পাশ করা শিক্ষার্থী নেই।" />
            )}

            {meritResults.length > 0 && (
              <Card className="mt-4 sm:mt-6">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-xs sm:text-sm text-muted-foreground">
                    মেধাতালিকা — মোট {meritResults.length} জন পাশ
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 sm:p-6">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10 text-xs sm:text-sm">অবস্থান</TableHead>
                          <TableHead className="text-xs sm:text-sm">নাম</TableHead>
                          <TableHead className="text-center text-xs sm:text-sm">রোল</TableHead>
                          <TableHead className="text-center hidden sm:table-cell text-xs sm:text-sm">রেজি.</TableHead>
                          <TableHead className="text-center text-xs sm:text-sm">মোট</TableHead>
                          <TableHead className="text-center text-xs sm:text-sm">জিপিএ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {meritResults.map((r, idx) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-bold text-xs sm:text-sm">
                              {idx < 3 ? (
                                <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-500 text-white text-[10px] sm:text-xs">
                                  {idx + 1}
                                </span>
                              ) : (
                                idx + 1
                              )}
                            </TableCell>
                            <TableCell className="font-medium text-xs sm:text-sm">{r.student?.name}</TableCell>
                            <TableCell className="text-center text-xs sm:text-sm">{r.student?.roll}</TableCell>
                            <TableCell className="text-center hidden sm:table-cell text-xs sm:text-sm">{r.student?.regNo}</TableCell>
                            <TableCell className="text-center text-xs sm:text-sm">{r.totalMarks}</TableCell>
                            <TableCell className="text-center font-bold text-primary text-xs sm:text-sm">{r.gpa}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
