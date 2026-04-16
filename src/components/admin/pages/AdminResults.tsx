'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { authFetch } from '@/lib/api';
import { Search, Trash2, Plus, Pencil, RefreshCw, Eye, BarChart3, Upload, BookOpen } from 'lucide-react';
import type { Exam, Marhala, Subject, Student, Result, ResultItem } from '@/types';

interface SubjectMark {
  subjectId: string;
  subjectName: string;
  totalMarks: number;
  passMarks: number;
  marks: number;
  isPassed: boolean;
}

export function AdminResults() {
  const { toast } = useToast();

  // Data states
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [marhalas, setMarhalas] = useState<Marhala[]>([]);
  const [selectedMarhala, setSelectedMarhala] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Search states
  const [searchRoll, setSearchRoll] = useState('');
  const [searchRegNo, setSearchRegNo] = useState('');
  const [searchResult, setSearchResult] = useState<Result | null>(null);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState('');

  // Form states
  const [selectedStudent, setSelectedStudent] = useState('');
  const [subjectMarks, setSubjectMarks] = useState<SubjectMark[]>([]);
  const [editingResult, setEditingResult] = useState<Result | null>(null);
  const [viewingResult, setViewingResult] = useState<Result | null>(null);

  // Student search in add dialog
  const [studentSearch, setStudentSearch] = useState('');

  // Quick subject creation dialog
  const [quickSubjectDialogOpen, setQuickSubjectDialogOpen] = useState(false);
  const [quickSubjectForm, setQuickSubjectForm] = useState({ name: '', totalMarks: 100, passMarks: 33 });
  const [savingSubject, setSavingSubject] = useState(false);

  // Load exams
  useEffect(() => {
    authFetch('/api/exams')
      .then((r) => r.json())
      .then((d) => setExams(d.exams || []))
      .catch(() => {});
  }, []);

  // Load marhalas when exam changes
  useEffect(() => {
    if (selectedExam) {
      authFetch(`/api/marhalas?examId=${selectedExam}`)
        .then((r) => r.json())
        .then((d) => setMarhalas(d.marhalas || []))
        .catch(() => {});
    } else {
      setMarhalas([]);
    }
    setSelectedMarhala('');
  }, [selectedExam]);

  // Load subjects when marhala changes
  useEffect(() => {
    if (selectedMarhala) {
      authFetch(`/api/subjects?marhalaId=${selectedMarhala}`)
        .then((r) => r.json())
        .then((d) => setSubjects(d.subjects || []))
        .catch(() => {});
    } else {
      setSubjects([]);
    }
  }, [selectedMarhala]);

  // Load results when exam+marhala selected
  const loadResults = useCallback(async () => {
    if (!selectedExam || !selectedMarhala) return;
    setLoading(true);
    try {
      const res = await authFetch(`/api/results/class-wise?examId=${selectedExam}&marhalaId=${selectedMarhala}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' });
    }
    setLoading(false);
  }, [selectedExam, selectedMarhala, toast]);

  useEffect(() => {
    if (selectedExam && selectedMarhala) loadResults();
  }, [selectedExam, selectedMarhala, loadResults]);

  // Calculate totals from subject marks
  const calculateFromMarks = (marks: SubjectMark[]) => {
    const totalMarks = marks.reduce((sum, m) => sum + m.marks, 0);
    const maxMarks = marks.reduce((sum, m) => sum + m.totalMarks, 0);
    const gpa = maxMarks > 0 ? parseFloat(((totalMarks / maxMarks) * 5).toFixed(2)) : 0;
    const allPassed = marks.every((m) => m.isPassed);
    const passed = allPassed && gpa >= 2.0;
    return { totalMarks, gpa, passed };
  };

  // Quick create subject
  const quickAddSubject = async () => {
    if (!quickSubjectForm.name || !quickSubjectForm.totalMarks || !selectedMarhala) return;
    setSavingSubject(true);
    try {
      const res = await authFetch('/api/subjects', {
        method: 'POST',
        body: JSON.stringify({ ...quickSubjectForm, marhalaId: selectedMarhala }),
      });
      if (res.ok) {
        toast({ title: 'বিষয় যোগ হয়েছে' });
        setQuickSubjectForm({ name: '', totalMarks: 100, passMarks: 33 });
        // Reload subjects
        const subRes = await authFetch(`/api/subjects?marhalaId=${selectedMarhala}`);
        const subData = await subRes.json();
        setSubjects(subData.subjects || []);
      } else {
        const data = await res.json();
        toast({ title: 'ত্রুটি', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'সার্ভার ত্রুটি', variant: 'destructive' });
    }
    setSavingSubject(false);
  };

  // Open Add Dialog
  const openAddDialog = async () => {
    if (!selectedExam || !selectedMarhala) {
      toast({ title: 'প্রথমে পরীক্ষা ও মারহালা নির্বাচন করুন', variant: 'destructive' });
      return;
    }
    if (subjects.length === 0) {
      setQuickSubjectDialogOpen(true);
      return;
    }

    // Load students
    try {
      const res = await authFetch('/api/students?limit=200');
      const data = await res.json();
      setStudents(data.students || []);
    } catch {
      toast({ title: 'শিক্ষার্থী তালিকা লোড করতে সমস্যা', variant: 'destructive' });
      return;
    }

    // Initialize subject marks
    const initialMarks: SubjectMark[] = subjects.map((s) => ({
      subjectId: s.id,
      subjectName: s.name,
      totalMarks: s.totalMarks,
      passMarks: s.passMarks || 33,
      marks: 0,
      isPassed: false,
    }));
    setSubjectMarks(initialMarks);
    setSelectedStudent('');
    setStudentSearch('');
    setAddDialogOpen(true);
  };

  // Update a subject mark
  const updateMark = (subjectId: string, marks: number) => {
    setSubjectMarks((prev) =>
      prev.map((m) => {
        if (m.subjectId !== subjectId) return m;
        const isPassed = marks >= m.passMarks;
        return { ...m, marks, isPassed };
      })
    );
  };

  // Save new result
  const saveNewResult = async () => {
    if (!selectedStudent) {
      toast({ title: 'শিক্ষার্থী নির্বাচন করুন', variant: 'destructive' });
      return;
    }
    if (subjectMarks.length === 0) {
      toast({ title: 'বিষয়ভিত্তিক নম্বর দিন', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const items = subjectMarks.map((m) => ({
        subjectId: m.subjectId,
        marks: m.marks,
      }));

      const res = await authFetch('/api/results', {
        method: 'POST',
        body: JSON.stringify({
          studentId: selectedStudent,
          examId: selectedExam,
          marhalaId: selectedMarhala,
          items,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({ title: 'ফলাফল যোগ হয়েছে', description: `${subjectMarks.length}টি বিষয়ের ফলাফল সংরক্ষিত হয়েছে` });
        setAddDialogOpen(false);
        loadResults();
      } else {
        toast({ title: 'ত্রুটি', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'সার্ভার ত্রুটি', variant: 'destructive' });
    }
    setSaving(false);
  };

  // Open Edit Dialog
  const openEditDialog = (result: Result) => {
    if (!result.items || result.items.length === 0) {
      toast({ title: 'এই ফলাফলে কোনো বিষয়ভিত্তিক নম্বর নেই', variant: 'destructive' });
      return;
    }

    const marks: SubjectMark[] = result.items.map((item) => ({
      subjectId: item.subjectId,
      subjectName: item.subject?.name || '',
      totalMarks: item.subject?.totalMarks || 100,
      passMarks: item.subject?.passMarks || 33,
      marks: item.marks,
      isPassed: item.isPassed,
    }));

    setSubjectMarks(marks);
    setEditingResult(result);
    setEditDialogOpen(true);
  };

  // Save edited result
  const saveEditedResult = async () => {
    if (!editingResult) return;

    setSaving(true);
    try {
      const items = subjectMarks.map((m) => ({
        subjectId: m.subjectId,
        marks: m.marks,
      }));

      const res = await authFetch(`/api/results/${editingResult.id}`, {
        method: 'PUT',
        body: JSON.stringify({ items }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({ title: 'ফলাফল আপডেট হয়েছে' });
        setEditDialogOpen(false);
        setEditingResult(null);
        loadResults();
      } else {
        toast({ title: 'ত্রুটি', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'সার্ভার ত্রুটি', variant: 'destructive' });
    }
    setSaving(false);
  };

  // View result details
  const openViewDialog = (result: Result) => {
    setViewingResult(result);
    setViewDialogOpen(true);
  };

  // Delete result
  const confirmDelete = (id: string) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const deleteResult = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      const res = await authFetch(`/api/results/${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'ফলাফল মুছে ফেলা হয়েছে' });
        setDeleteDialogOpen(false);
        setDeleteId('');
        loadResults();
      } else {
        toast({ title: 'মুছে ফেলতে সমস্যা', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'সার্ভার ত্রুটি', variant: 'destructive' });
    }
    setSaving(false);
  };

  // Search individual result
  const searchIndividual = async () => {
    if (!selectedExam || !selectedMarhala) {
      toast({ title: 'প্রথমে পরীক্ষা ও মারহালা নির্বাচন করুন', variant: 'destructive' });
      return;
    }
    if (!searchRoll && !searchRegNo) {
      toast({ title: 'রোল বা রেজি. নং দিন', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await authFetch('/api/results/search', {
        method: 'POST',
        body: JSON.stringify({ examId: selectedExam, marhalaId: selectedMarhala, roll: searchRoll, regNo: searchRegNo }),
      });
      const data = await res.json();
      if (res.ok) {
        setSearchResult(data.result);
      } else {
        setSearchResult(null);
        toast({ title: 'পাওয়া যায়নি', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' });
    }
    setLoading(false);
  };

  // Recalculate merit
  const recalcMerit = async () => {
    if (!selectedExam || !selectedMarhala) return;
    setSaving(true);
    try {
      const res = await authFetch('/api/results/recalculate-merit', {
        method: 'POST',
        body: JSON.stringify({ examId: selectedExam, marhalaId: selectedMarhala }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: data.message, description: `${data.updated}টি ফলাফল আপডেট হয়েছে` });
        loadResults();
      } else {
        toast({ title: 'ত্রুটি', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'সার্ভার ত্রুটি', variant: 'destructive' });
    }
    setSaving(false);
  };

  // Stats
  const stats = (() => {
    if (results.length === 0) return { total: 0, passed: 0, failed: 0, passRate: 0, avgGpa: 0 };
    const passed = results.filter((r) => r.isPassed).length;
    const failed = results.length - passed;
    const passRate = parseFloat(((passed / results.length) * 100).toFixed(1));
    const avgGpa = parseFloat((results.reduce((sum, r) => sum + r.gpa, 0) / results.length).toFixed(2));
    return { total: results.length, passed, failed, passRate, avgGpa };
  })();

  // Filter students by search
  const filteredStudents = students.filter(
    (s) =>
      !studentSearch ||
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.roll.includes(studentSearch) ||
      s.regNo.includes(studentSearch)
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">ফলাফল ব্যবস্থাপনা</h2>
          <p className="text-sm text-muted-foreground">ফলাফল যোগ, এডিট, ডিলিট ও সম্পাদনা করুন</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={recalcMerit} disabled={!selectedExam || !selectedMarhala || saving}>
            <RefreshCw className="h-4 w-4 mr-1" />মেধা আপডেট
          </Button>
          <Button size="sm" onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-1" />নতুন ফলাফল
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">পরীক্ষা</Label>
              <Select value={selectedExam} onValueChange={setSelectedExam}>
                <SelectTrigger><SelectValue placeholder="নির্বাচন করুন" /></SelectTrigger>
                <SelectContent>{exams.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">মারহালা</Label>
              <Select value={selectedMarhala} onValueChange={setSelectedMarhala}>
                <SelectTrigger><SelectValue placeholder="নির্বাচন করুন" /></SelectTrigger>
                <SelectContent>{marhalas.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">রোল</Label>
              <Input value={searchRoll} onChange={(e) => setSearchRoll(e.target.value)} placeholder="রোল লিখুন" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">রেজি. নং</Label>
              <Input value={searchRegNo} onChange={(e) => setSearchRegNo(e.target.value)} placeholder="রেজি. নং লিখুন" />
            </div>
          </div>
          <Button onClick={searchIndividual} className="mt-3" size="sm" disabled={loading}>
            <Search className="h-4 w-4 mr-1" />খুঁজুন
          </Button>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {selectedExam && selectedMarhala && results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">মোট</p>
                <p className="text-lg font-bold">{stats.total}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">পাশ</p>
                <p className="text-lg font-bold text-green-600">{stats.passed}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <div>
                <p className="text-xs text-muted-foreground">ফেল</p>
                <p className="text-lg font-bold text-red-600">{stats.failed}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">পাশের হার</p>
                <p className="text-lg font-bold text-blue-600">{stats.passRate}%</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <div>
                <p className="text-xs text-muted-foreground">গড় জিপিএ</p>
                <p className="text-lg font-bold text-amber-600">{stats.avgGpa}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Individual Search Result */}
      {searchResult && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">ব্যক্তিগত ফলাফল</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
              <div className="bg-muted rounded p-2">
                <p className="text-xs text-muted-foreground">নাম</p>
                <p className="text-sm font-medium">{searchResult.student?.name}</p>
              </div>
              <div className="bg-muted rounded p-2">
                <p className="text-xs text-muted-foreground">রোল</p>
                <p className="text-sm font-medium">{searchResult.student?.roll}</p>
              </div>
              <div className="bg-muted rounded p-2">
                <p className="text-xs text-muted-foreground">মেধা</p>
                <p className="text-sm font-medium">{searchResult.merit || '-'}</p>
              </div>
              <div className="bg-muted rounded p-2">
                <p className="text-xs text-muted-foreground">মোট নম্বর</p>
                <p className="text-sm font-medium">{searchResult.totalMarks}</p>
              </div>
              <div className="bg-muted rounded p-2">
                <p className="text-xs text-muted-foreground">জিপিএ</p>
                <p className="text-sm font-semibold">{searchResult.gpa}</p>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>বিষয়</TableHead>
                  <TableHead className="text-center">পূর্ণমান</TableHead>
                  <TableHead className="text-center">প্রাপ্ত নম্বর</TableHead>
                  <TableHead className="text-center">অবস্থা</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchResult.items?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-sm">{item.subject?.name}</TableCell>
                    <TableCell className="text-center text-sm">{item.subject?.totalMarks}</TableCell>
                    <TableCell className="text-center text-sm font-medium">{item.marks}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={item.isPassed ? 'default' : 'destructive'} className="text-xs">
                        {item.isPassed ? 'পাশ' : 'ফেল'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* All Results Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">সব ফলাফল ({results.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[55vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">মেধা</TableHead>
                  <TableHead>নাম</TableHead>
                  <TableHead className="text-center">রোল</TableHead>
                  <TableHead className="text-center hidden md:table-cell">রেজি.</TableHead>
                  <TableHead className="text-center">মোট</TableHead>
                  <TableHead className="text-center">জিপিএ</TableHead>
                  <TableHead className="text-center">অবস্থা</TableHead>
                  <TableHead className="text-right">কার্যক্রম</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : results.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {selectedExam && selectedMarhala
                        ? 'কোনো ফলাফল নেই। "নতুন ফলাফল" বাটনে ক্লিক করে ফলাফল যোগ করুন।'
                        : 'ফলাফল দেখতে প্রথমে পরীক্ষা ও মারহালা নির্বাচন করুন'}
                    </TableCell>
                  </TableRow>
                ) : (
                  results.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-semibold">{r.merit || '-'}</TableCell>
                      <TableCell className="font-medium text-sm">{r.student?.name}</TableCell>
                      <TableCell className="text-center text-sm">{r.student?.roll}</TableCell>
                      <TableCell className="text-center text-sm hidden md:table-cell">{r.student?.regNo}</TableCell>
                      <TableCell className="text-center text-sm">{r.totalMarks}</TableCell>
                      <TableCell className="text-center text-sm font-semibold">{r.gpa}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={r.isPassed ? 'default' : 'destructive'} className="text-xs">
                          {r.isPassed ? 'পাশ' : 'ফেল'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openViewDialog(r)} title="দেখুন">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(r)} title="সম্পাদনা">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => confirmDelete(r.id)} title="মুছুন">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ===== ADD RESULT DIALOG ===== */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>নতুন ফলাফল যোগ করুন</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Student Selection */}
            <div className="space-y-2">
              <Label>শিক্ষার্থী নির্বাচন করুন</Label>
              <Input
                placeholder="নাম, রোল বা রেজি. নং দিয়ে খুঁজুন..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="শিক্ষার্থী নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {filteredStudents.length === 0 ? (
                    <div className="py-3 text-center text-sm text-muted-foreground">কোনো শিক্ষার্থী পাওয়া যায়নি</div>
                  ) : (
                    filteredStudents.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} — রোল: {s.roll} — রেজি: {s.regNo}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Subject Marks */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">বিষয়ভিত্তিক নম্বর</Label>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>বিষয়</TableHead>
                      <TableHead className="text-center w-24">পূর্ণমান</TableHead>
                      <TableHead className="text-center w-24">প্রাপ্ত</TableHead>
                      <TableHead className="text-center w-20">অবস্থা</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjectMarks.map((sm) => (
                      <TableRow key={sm.subjectId}>
                        <TableCell className="text-sm font-medium">{sm.subjectName}</TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">{sm.totalMarks}</TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            min={0}
                            max={sm.totalMarks}
                            value={sm.marks}
                            onChange={(e) => updateMark(sm.subjectId, parseInt(e.target.value) || 0)}
                            className="w-20 text-center mx-auto"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={sm.isPassed ? 'default' : 'destructive'} className="text-xs">
                            {sm.marks > 0 ? (sm.isPassed ? 'পাশ' : 'ফেল') : '-'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-muted rounded-lg p-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">মোট নম্বর</p>
                  <p className="text-lg font-bold">{calculateFromMarks(subjectMarks).totalMarks}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">জিপিএ</p>
                  <p className="text-lg font-bold">{calculateFromMarks(subjectMarks).gpa}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">ফলাফল</p>
                  <p className={`text-lg font-bold ${calculateFromMarks(subjectMarks).passed ? 'text-green-600' : 'text-red-600'}`}>
                    {calculateFromMarks(subjectMarks).passed ? 'পাশ' : 'ফেল'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>বাতিল</Button>
            <Button onClick={saveNewResult} disabled={saving || !selectedStudent}>
              {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== EDIT RESULT DIALOG ===== */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ফলাফল সম্পাদনা</DialogTitle>
          </DialogHeader>
          {editingResult && (
            <div className="space-y-4">
              {/* Student Info (read-only) */}
              <div className="bg-muted rounded-lg p-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">নাম</p>
                    <p className="text-sm font-medium">{editingResult.student?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">রোল</p>
                    <p className="text-sm font-medium">{editingResult.student?.roll}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">রেজি. নং</p>
                    <p className="text-sm font-medium">{editingResult.student?.regNo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">বর্তমান মেধা</p>
                    <p className="text-sm font-medium">{editingResult.merit || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Editable Subject Marks */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">বিষয়ভিত্তিক নম্বর সম্পাদনা</Label>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>বিষয়</TableHead>
                        <TableHead className="text-center w-24">পূর্ণমান</TableHead>
                        <TableHead className="text-center w-24">প্রাপ্ত</TableHead>
                        <TableHead className="text-center w-20">অবস্থা</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjectMarks.map((sm) => (
                        <TableRow key={sm.subjectId}>
                          <TableCell className="text-sm font-medium">{sm.subjectName}</TableCell>
                          <TableCell className="text-center text-sm text-muted-foreground">{sm.totalMarks}</TableCell>
                          <TableCell className="text-center">
                            <Input
                              type="number"
                              min={0}
                              max={sm.totalMarks}
                              value={sm.marks}
                              onChange={(e) => updateMark(sm.subjectId, parseInt(e.target.value) || 0)}
                              className="w-20 text-center mx-auto"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={sm.isPassed ? 'default' : 'destructive'} className="text-xs">
                              {sm.isPassed ? 'পাশ' : 'ফেল'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-muted rounded-lg p-3">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">মোট নম্বর</p>
                    <p className="text-lg font-bold">{calculateFromMarks(subjectMarks).totalMarks}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">জিপিএ</p>
                    <p className="text-lg font-bold">{calculateFromMarks(subjectMarks).gpa}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">ফলাফল</p>
                    <p className={`text-lg font-bold ${calculateFromMarks(subjectMarks).passed ? 'text-green-600' : 'text-red-600'}`}>
                      {calculateFromMarks(subjectMarks).passed ? 'পাশ' : 'ফেল'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>বাতিল</Button>
            <Button onClick={saveEditedResult} disabled={saving}>
              {saving ? 'আপডেট হচ্ছে...' : 'আপডেট করুন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== VIEW RESULT DIALOG ===== */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>ফলাফল বিবরণ</DialogTitle>
          </DialogHeader>
          {viewingResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <div className="bg-muted rounded p-2">
                  <p className="text-xs text-muted-foreground">নাম</p>
                  <p className="text-sm font-medium">{viewingResult.student?.name}</p>
                </div>
                <div className="bg-muted rounded p-2">
                  <p className="text-xs text-muted-foreground">রোল</p>
                  <p className="text-sm font-medium">{viewingResult.student?.roll}</p>
                </div>
                <div className="bg-muted rounded p-2">
                  <p className="text-xs text-muted-foreground">মেধা</p>
                  <p className="text-sm font-semibold text-emerald-600">{viewingResult.merit || '-'}</p>
                </div>
                <div className="bg-muted rounded p-2">
                  <p className="text-xs text-muted-foreground">মোট</p>
                  <p className="text-sm font-bold">{viewingResult.totalMarks}</p>
                </div>
                <div className="bg-muted rounded p-2">
                  <p className="text-xs text-muted-foreground">জিপিএ</p>
                  <p className="text-sm font-bold">{viewingResult.gpa}</p>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>বিষয়</TableHead>
                    <TableHead className="text-center">পূর্ণমান</TableHead>
                    <TableHead className="text-center">প্রাপ্ত</TableHead>
                    <TableHead className="text-center">অবস্থা</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewingResult.items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-sm">{item.subject?.name}</TableCell>
                      <TableCell className="text-center text-sm">{item.subject?.totalMarks}</TableCell>
                      <TableCell className="text-center text-sm font-medium">{item.marks}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={item.isPassed ? 'default' : 'destructive'} className="text-xs">
                          {item.isPassed ? 'পাশ' : 'ফেল'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== DELETE CONFIRMATION DIALOG ===== */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ফলাফল মুছে ফেলবেন?</AlertDialogTitle>
            <AlertDialogDescription>
              এই ফলাফলটি মুছে ফেলা হলে এটি আর পুনরুদ্ধার করা যাবে না। আপনি কি নিশ্চিত?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>বাতিল</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteResult}
              disabled={saving}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {saving ? 'মুছে ফেলা হচ্ছে...' : 'মুছে ফেলুন'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ===== QUICK SUBJECT CREATION DIALOG ===== */}
      <Dialog open={quickSubjectDialogOpen} onOpenChange={(open) => { setQuickSubjectDialogOpen(open); if (!open) setQuickSubjectForm({ name: '', totalMarks: 100, passMarks: 33 }); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              বিষয় যোগ করুন
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            এই মারহালায় কোনো বিষয় নেই। ফলাফল যোগ করার আগে বিষয় যোগ করুন।
          </p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">বিষয়ের নাম *</Label>
              <Input
                value={quickSubjectForm.name}
                onChange={(e) => setQuickSubjectForm({ ...quickSubjectForm, name: e.target.value })}
                placeholder="যেমন: কুরআন, হাদীস, ফিকহ, আরবী..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">মোট নম্বর *</Label>
                <Input
                  type="number"
                  value={quickSubjectForm.totalMarks}
                  onChange={(e) => setQuickSubjectForm({ ...quickSubjectForm, totalMarks: parseInt(e.target.value) || 0 })}
                  placeholder="100"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">পাশ নম্বর</Label>
                <Input
                  type="number"
                  value={quickSubjectForm.passMarks}
                  onChange={(e) => setQuickSubjectForm({ ...quickSubjectForm, passMarks: parseInt(e.target.value) || 0 })}
                  placeholder="33"
                />
              </div>
            </div>
            {subjects.length > 0 && (
              <div className="text-xs text-muted-foreground">
                বর্তমানে {subjects.length}টি বিষয় আছে। আরও যোগ করতে পারেন।
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            {subjects.length > 0 && (
              <Button variant="outline" onClick={() => { setQuickSubjectDialogOpen(false); }}>
                বন্ধ করুন
              </Button>
            )}
            <Button onClick={quickAddSubject} disabled={savingSubject || !quickSubjectForm.name}>
              {savingSubject ? 'সংরক্ষণ হচ্ছে...' : 'বিষয় যোগ করুন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
