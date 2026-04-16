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
import type { Marhala, Exam } from '@/types';

export function AdminMarhalas() {
  const { toast } = useToast();
  const [items, setItems] = useState<Marhala[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Marhala | null>(null);
  const [selectedExam, setSelectedExam] = useState('');
  const [form, setForm] = useState({ name: '', nameEn: '' });
  const [saving, setSaving] = useState(false);

  const loadExams = async () => {
    try {
      const res = await authFetch('/api/exams');
      const d = await res.json();
      setExams(d.exams || []);
    } catch { /* ignore */ }
  };

  const loadMarhalas = async (examId?: string) => {
    setLoading(true);
    try {
      const query = examId ? `?examId=${examId}` : '';
      const res = await authFetch(`/api/marhalas${query}`);
      const d = await res.json();
      setItems(d.marhalas || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    loadExams();
    loadMarhalas();
  }, []);

  useEffect(() => {
    if (selectedExam) {
      loadMarhalas(selectedExam);
    } else {
      loadMarhalas();
    }
  }, [selectedExam]);

  const reload = () => loadMarhalas(selectedExam || undefined);

  const openNew = () => {
    setEditItem(null);
    setForm({ name: '', nameEn: '' });
    if (!selectedExam && exams.length > 0) {
      toast({ title: 'তথ্য', description: 'প্রথমে একটি পরীক্ষা নির্বাচন করুন', variant: 'destructive' });
      return;
    }
    setDialogOpen(true);
  };

  const openEdit = (item: Marhala) => {
    setEditItem(item);
    setForm({ name: item.name, nameEn: item.nameEn || '' });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name) {
      toast({ title: 'ত্রুটি', description: 'মারহালার নাম দিন', variant: 'destructive' });
      return;
    }
    if (!editItem && !selectedExam) {
      toast({ title: 'ত্রুটি', description: 'পরীক্ষা নির্বাচন করুন', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      if (editItem) {
        const res = await authFetch(`/api/marhalas/${editItem.id}`, {
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
        const res = await authFetch('/api/marhalas', {
          method: 'POST',
          body: JSON.stringify({ ...form, examId: selectedExam }),
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
    try {
      const res = await authFetch(`/api/marhalas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'ডিলিট হয়েছে' });
        reload();
      } else {
        toast({ title: 'ত্রুটি', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">মারহালা ব্যবস্থাপনা</h2>
          <p className="text-sm text-muted-foreground">পরীক্ষার মারহালা (শ্রেণি/স্তর) তৈরি, সম্পাদনা ও পরিচালনা করুন</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />নতুন মারহালা
        </Button>
      </div>

      {/* Exam Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <Label className="whitespace-nowrap">পরীক্ষা নির্বাচন:</Label>
            <Select value={selectedExam} onValueChange={(v) => setSelectedExam(v)}>
              <SelectTrigger className="max-w-xs">
                <SelectValue placeholder="সব পরীক্ষা" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব পরীক্ষা</SelectItem>
                {exams.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.name} ({e.year})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Marhalas Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>নাম</TableHead>
                  <TableHead className="hidden sm:table-cell">ইংরেজি নাম</TableHead>
                  <TableHead className="hidden md:table-cell">ফলাফল</TableHead>
                  <TableHead className="hidden md:table-cell">বিষয়</TableHead>
                  <TableHead className="text-right">কার্যক্রম</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      কোনো মারহালা নেই
                    </TableCell>
                  </TableRow>
                ) : items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">{item.nameEn || '-'}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="secondary">{item._count?.results || 0} টি</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">{item._count?.subjects || 0} টি</Badge>
                    </TableCell>
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
                              <AlertDialogTitle>আপনি কি নিশ্চিত?</AlertDialogTitle>
                              <AlertDialogDescription>
                                এই মারহালা মুছে ফেলা হবে। সাথে সম্পর্কিত বিষয় ও ফলাফলও মুছে যেতে পারে।
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>বাতিল</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteItem(item.id)}>মুছুন</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? 'মারহালা সম্পাদনা' : 'নতুন মারহালা'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editItem && (
              <div className="space-y-2">
                <Label>পরীক্ষা</Label>
                <Select value={selectedExam} onValueChange={(v) => setSelectedExam(v)}>
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
            )}
            <div className="space-y-2">
              <Label>নাম *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="হিফজুল কুরআন, নাযেরা ইত্যাদি"
              />
            </div>
            <div className="space-y-2">
              <Label>ইংরেজি নাম</Label>
              <Input
                value={form.nameEn}
                onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                placeholder="Hifzul Quran, Nazera etc."
              />
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
