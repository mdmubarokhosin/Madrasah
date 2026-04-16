'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authFetch } from '@/lib/api';
import type { Subject, Exam, Marhala } from '@/types';

export function AdminSubjects() {
  const { toast } = useToast();
  const [items, setItems] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [marhalas, setMarhalas] = useState<Marhala[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Subject | null>(null);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedMarhala, setSelectedMarhala] = useState('');
  const [form, setForm] = useState({ name: '', totalMarks: 100, passMarks: 33 });
  const [saving, setSaving] = useState(false);

  const loadExams = async () => {
    try {
      const res = await authFetch('/api/exams');
      const d = await res.json();
      setExams(d.exams || []);
    } catch { /* ignore */ }
  };

  const loadSubjects = async () => {
    if (!selectedMarhala) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await authFetch(`/api/subjects?marhalaId=${selectedMarhala}`);
      const d = await res.json();
      setItems(d.subjects || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    loadExams();
  }, []);

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

  useEffect(() => {
    loadSubjects();
  }, [selectedMarhala]);

  const reload = () => loadSubjects();

  const openNew = () => {
    setEditItem(null);
    setForm({ name: '', totalMarks: 100, passMarks: 33 });
    if (!selectedMarhala) {
      toast({ title: 'তথ্য', description: 'প্রথমে পরীক্ষা ও মারহালা নির্বাচন করুন', variant: 'destructive' });
      return;
    }
    setDialogOpen(true);
  };

  const openEdit = (item: Subject) => {
    setEditItem(item);
    setForm({
      name: item.name,
      totalMarks: item.totalMarks,
      passMarks: item.passMarks || 33,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name || !form.totalMarks) {
      toast({ title: 'ত্রুটি', description: 'বিষয়ের নাম ও মোট নম্বর দিন', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      if (editItem) {
        const res = await authFetch(`/api/subjects/${editItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
        if (res.ok) {
          toast({ title: 'আপডেট হয়েছে' });
          setDialogOpen(false);
          reload();
        } else {
          const d = await res.json();
          toast({ title: 'ত্রুটি', description: d.error, variant: 'destructive' });
        }
      } else {
        const res = await authFetch('/api/subjects', {
          method: 'POST',
          body: JSON.stringify({ ...form, marhalaId: selectedMarhala }),
        });
        if (res.ok) {
          toast({ title: 'তৈরি হয়েছে' });
          setDialogOpen(false);
          reload();
        } else {
          const d = await res.json();
          toast({ title: 'ত্রুটি', description: d.error, variant: 'destructive' });
        }
      }
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' });
    }
    setSaving(false);
  };

  const deleteItem = async (id: string) => {
    setSaving(true);
    try {
      const res = await authFetch(`/api/subjects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'মুছে ফেলা হয়েছে' });
        reload();
      } else {
        toast({ title: 'ত্রুটি', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' });
    }
    setSaving(false);
  };

  const selectedMarhalaName = marhalas.find((m) => m.id === selectedMarhala)?.name;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">বিষয় ব্যবস্থাপনা</h2>
          <p className="text-sm text-muted-foreground">মারহালাভিত্তিক বিষয় তৈরি, সম্পাদনা ও পরিচালনা করুন</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />নতুন বিষয়
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3">
              <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <Label className="text-xs mb-1 block">পরীক্ষা</Label>
                <Select value={selectedExam} onValueChange={setSelectedExam}>
                  <SelectTrigger>
                    <SelectValue placeholder="পরীক্ষা নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {exams.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.name} ({e.year})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <Label className="text-xs mb-1 block">মারহালা</Label>
                <Select value={selectedMarhala} onValueChange={setSelectedMarhala}>
                  <SelectTrigger>
                    <SelectValue placeholder={selectedExam ? 'মারহালা নির্বাচন করুন' : 'প্রথমে পরীক্ষা নির্বাচন করুন'} />
                  </SelectTrigger>
                  <SelectContent>
                    {marhalas.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subjects Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            বিষয় সমূহ
            {selectedMarhalaName && (
              <Badge variant="outline">{selectedMarhalaName} — {items.length}টি</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!selectedMarhala ? (
            <div className="text-center py-10 text-muted-foreground">
              বিষয় দেখতে প্রথমে পরীক্ষা ও মারহালা নির্বাচন করুন
            </div>
          ) : loading ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="max-h-[55vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">ক্রম</TableHead>
                    <TableHead>বিষয়ের নাম</TableHead>
                    <TableHead className="text-center">মোট নম্বর</TableHead>
                    <TableHead className="text-center hidden sm:table-cell">পাশ নম্বর</TableHead>
                    <TableHead className="text-right">কার্যক্রম</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        এই মারহালায় কোনো বিষয় নেই। "নতুন বিষয়" বাটনে ক্লিক করে যোগ করুন।
                      </TableCell>
                    </TableRow>
                  ) : items.map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-center">{item.totalMarks}</TableCell>
                      <TableCell className="text-center hidden sm:table-cell">{item.passMarks || 33}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>বিষয় মুছে ফেলবেন?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  &quot;{item.name}&quot; মুছে ফেলা হবে। সাথে সম্পর্কিত ফলাফলের নম্বরও মুছে যেতে পারে।
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>বাতিল</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteItem(item.id)}
                                  className="bg-destructive text-white hover:bg-destructive/90"
                                >
                                  মুছুন
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? 'বিষয় সম্পাদনা' : 'নতুন বিষয়'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editItem && selectedMarhalaName && (
              <div className="bg-muted rounded-lg p-3 text-sm">
                <span className="text-muted-foreground">মারহালা:</span> <span className="font-medium">{selectedMarhalaName}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label>বিষয়ের নাম *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="যেমন: কুরআন, হাদীস, ফিকহ, আরবী, বাংলা..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>মোট নম্বর *</Label>
                <Input
                  type="number"
                  value={form.totalMarks}
                  onChange={(e) => setForm({ ...form, totalMarks: parseInt(e.target.value) || 0 })}
                  placeholder="100"
                />
              </div>
              <div className="space-y-2">
                <Label>পাশ নম্বর</Label>
                <Input
                  type="number"
                  value={form.passMarks}
                  onChange={(e) => setForm({ ...form, passMarks: parseInt(e.target.value) || 0 })}
                  placeholder="33"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>বাতিল</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
