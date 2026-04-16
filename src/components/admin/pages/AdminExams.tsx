/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { authFetch } from '@/lib/api';
import { Plus, Edit, Trash2, Eye, EyeOff, BookOpen } from 'lucide-react';
import type { Exam, Marhala, Subject } from '@/types';

export function AdminExams() {
  const { toast } = useToast();
  const token = typeof window !== 'undefined' ? localStorage.getItem('madrasa_token') : '';

  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(false);
  const [examDialogOpen, setExamDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [examForm, setExamForm] = useState({ name: '', nameEn: '', year: '' });

  const [selectedExam, setSelectedExam] = useState('');
  const [marhalas, setMarhalas] = useState<Marhala[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [marhalaDialogOpen, setMarhalaDialogOpen] = useState(false);
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [marhalaForm, setMarhalaForm] = useState({ name: '', nameEn: '' });
  const [subjectForm, setSubjectForm] = useState({ name: '', totalMarks: 100, passMarks: 33 });
  const [selectedMarhalaForSubject, setSelectedMarhalaForSubject] = useState('');

  const loadExams = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/exams', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setExams(data.exams || []);
    } catch {
      toast({ title: 'ত্রুটি', description: 'তথ্য লোড করতে সমস্যা', variant: 'destructive' });
    }
    setLoading(false);
  };

  useEffect(() => { loadExams();  }, []);

  useEffect(() => {
    if (selectedExam) {
      authFetch(`/api/marhalas?examId=${selectedExam}`)
        .then((r) => r.json())
        .then((d) => setMarhalas(d.marhalas || []))
        .catch(() => {});
      setSubjects([]);
    } else {
      setMarhalas([]);
      setSubjects([]);
    }
  }, [selectedExam]);

  const handleExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingExam ? `/api/exams/${editingExam.id}` : '/api/exams';
      const method = editingExam ? 'PUT' : 'POST';
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(examForm),
      });
      if (res.ok) {
        toast({ title: editingExam ? 'আপডেট হয়েছে' : 'তৈরি হয়েছে' });
        setExamDialogOpen(false);
        setEditingExam(null);
        setExamForm({ name: '', nameEn: '', year: '' });
        loadExams();
      } else {
        const data = await res.json();
        toast({ title: 'ত্রুটি', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'সার্ভারে সমস্যা', variant: 'destructive' });
    }
  };

  const togglePublish = async (id: string) => {
    try {
      const res = await authFetch(`/api/exams/${id}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) loadExams();
    } catch {
      toast({ title: 'ত্রুটি', description: 'সমস্যা হয়েছে', variant: 'destructive' });
    }
  };

  const deleteExam = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত?')) return;
    try {
      const res = await authFetch(`/api/exams/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { toast({ title: 'মুছে ফেলা হয়েছে' }); loadExams(); }
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' });
    }
  };

  const addMarhala = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExam) return;
    try {
      const res = await authFetch('/api/marhalas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...marhalaForm, examId: selectedExam }),
      });
      if (res.ok) {
        toast({ title: 'মারহালা তৈরি হয়েছে' });
        setMarhalaDialogOpen(false);
        setMarhalaForm({ name: '', nameEn: '' });
        authFetch(`/api/marhalas?examId=${selectedExam}`).then((r) => r.json()).then((d) => setMarhalas(d.marhalas || []));
      }
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' });
    }
  };

  const addSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMarhalaForSubject) {
      toast({ title: 'ত্রুটি', description: 'প্রথমে একটি মারহালা নির্বাচন করুন', variant: 'destructive' });
      return;
    }
    try {
      const res = await authFetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...subjectForm, marhalaId: selectedMarhalaForSubject }),
      });
      if (res.ok) {
        toast({ title: 'বিষয় তৈরি হয়েছে' });
        setSubjectDialogOpen(false);
        setSubjectForm({ name: '', totalMarks: 100, passMarks: 33 });
        authFetch(`/api/subjects?marhalaId=${selectedMarhalaForSubject}`).then((r) => r.json()).then((d) => setSubjects(d.subjects || []));
      }
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">পরীক্ষা ব্যবস্থাপনা</h2>
          <p className="text-sm text-muted-foreground">পরীক্ষা, মারহালা ও বিষয় ব্যবস্থাপনা</p>
        </div>
        <Dialog open={examDialogOpen} onOpenChange={(open) => { setExamDialogOpen(open); if (!open) setEditingExam(null); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" />নতুন পরীক্ষা</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingExam ? 'পরীক্ষা সম্পাদনা' : 'নতুন পরীক্ষা'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleExamSubmit} className="space-y-3">
              <div className="space-y-2"><Label>পরীক্ষার নাম *</Label><Input value={examForm.name} onChange={(e) => setExamForm({ ...examForm, name: e.target.value })} required /></div>
              <div className="space-y-2"><Label>ইংরেজি নাম</Label><Input value={examForm.nameEn} onChange={(e) => setExamForm({ ...examForm, nameEn: e.target.value })} /></div>
              <div className="space-y-2"><Label>সাল *</Label><Input value={examForm.year} onChange={(e) => setExamForm({ ...examForm, year: e.target.value })} required /></div>
              <Button type="submit" className="w-full">{editingExam ? 'আপডেট' : 'তৈরি'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="max-h-[40vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>পরীক্ষার নাম</TableHead>
                  <TableHead className="text-center hidden sm:table-cell">সাল</TableHead>
                  <TableHead className="text-center">ফলাফল</TableHead>
                  <TableHead className="text-center">মারহালা</TableHead>
                  <TableHead className="text-center">অবস্থা</TableHead>
                  <TableHead className="text-right">কার্যক্রম</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.map((exam) => (
                  <TableRow key={exam.id} className={selectedExam === exam.id ? 'bg-primary/5' : ''}>
                    <TableCell>
                      <button onClick={() => setSelectedExam(exam.id)} className="font-medium hover:underline">
                        {exam.name}
                      </button>
                    </TableCell>
                    <TableCell className="text-center hidden sm:table-cell">{exam.year}</TableCell>
                    <TableCell className="text-center">{exam._count?.results || 0}</TableCell>
                    <TableCell className="text-center">{exam._count?.marhalas || 0}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={exam.isPublished ? 'default' : 'secondary'}>
                        {exam.isPublished ? 'প্রকাশিত' : 'অপ্রকাশিত'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => togglePublish(exam.id)} title={exam.isPublished ? 'আনপাবলিশ' : 'পাবলিশ'}>
                          {exam.isPublished ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingExam(exam); setExamForm({ name: exam.name, nameEn: exam.nameEn || '', year: exam.year }); setExamDialogOpen(true); }}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteExam(exam.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedExam && (
        <Tabs defaultValue="marhalas" className="mt-4">
          <TabsList>
            <TabsTrigger value="marhalas">মারহালা</TabsTrigger>
            <TabsTrigger value="subjects">বিষয়</TabsTrigger>
          </TabsList>

          <TabsContent value="marhalas">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">মারহালা সমূহ</CardTitle>
                <Dialog open={marhalaDialogOpen} onOpenChange={setMarhalaDialogOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" />মারহালা</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>নতুন মারহালা</DialogTitle></DialogHeader>
                    <form onSubmit={addMarhala} className="space-y-3">
                      <div className="space-y-2"><Label>নাম *</Label><Input value={marhalaForm.name} onChange={(e) => setMarhalaForm({ ...marhalaForm, name: e.target.value })} required /></div>
                      <div className="space-y-2"><Label>ইংরেজি নাম</Label><Input value={marhalaForm.nameEn} onChange={(e) => setMarhalaForm({ ...marhalaForm, nameEn: e.target.value })} /></div>
                      <Button type="submit" className="w-full">তৈরি করুন</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {marhalas.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">কোনো মারহালা নেই</p>
                ) : (
                  <div className="space-y-2">
                    {marhalas.map((m) => (
                      <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="font-medium text-sm">{m.name}</p>
                          <p className="text-xs text-muted-foreground">ফলাফল: {m._count?.results || 0} | বিষয়: {m._count?.subjects || 0}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedMarhalaForSubject(m.id);
                            authFetch(`/api/subjects?marhalaId=${m.id}`).then((r) => r.json()).then((d) => setSubjects(d.subjects || []));
                          }}
                        >
                          <BookOpen className="h-3.5 w-3.5 mr-1" />
                          বিষয় দেখুন
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subjects">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">বিষয় সমূহ</CardTitle>
                <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" />বিষয়</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>নতুন বিষয়</DialogTitle></DialogHeader>
                    <form onSubmit={addSubject} className="space-y-3">
                      <div className="space-y-2"><Label>বিষয়ের নাম *</Label><Input value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} required /></div>
                      <div className="space-y-2"><Label>মোট নম্বর *</Label><Input type="number" value={subjectForm.totalMarks} onChange={(e) => setSubjectForm({ ...subjectForm, totalMarks: parseInt(e.target.value) || 0 })} required /></div>
                      <div className="space-y-2"><Label>পাশ নম্বর</Label><Input type="number" value={subjectForm.passMarks} onChange={(e) => setSubjectForm({ ...subjectForm, passMarks: parseInt(e.target.value) || 0 })} /></div>
                      <Button type="submit" className="w-full" disabled={!selectedMarhalaForSubject}>তৈরি করুন</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {subjects.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">কোনো বিষয় নেই। মারহালা থেকে বিষয় দেখুন।</p>
                ) : (
                  <div className="max-h-60 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>বিষয়</TableHead>
                          <TableHead className="text-center">মোট নম্বর</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subjects.map((s) => (
                          <TableRow key={s.id}>
                            <TableCell>{s.name}</TableCell>
                            <TableCell className="text-center">{s.totalMarks}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
