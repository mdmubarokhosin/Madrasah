'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, Search, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authFetch } from '@/lib/api';
import type { Student, Class, AcademicYear } from '@/types';

export function AdminStudents() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Student | null>(null);
  const [form, setForm] = useState({ name: '', roll: '', regNo: '', fatherName: '', motherName: '', gender: 'male', phone: '', address: '', dateOfBirth: '', classId: '', academicYearId: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([authFetch('/api/students').then(r => r.json()), authFetch('/api/classes').then(r => r.json()), authFetch('/api/academic-years').then(r => r.json())]).then(([s, c, a]) => {
      setStudents(s.students || []); setClasses(c.classes || []); setAcademicYears(a.academicYears || []); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const reload = () => {
    setLoading(true);
    Promise.all([authFetch('/api/students').then(r => r.json()), authFetch('/api/classes').then(r => r.json()), authFetch('/api/academic-years').then(r => r.json())]).then(([s, c, a]) => {
      setStudents(s.students || []); setClasses(c.classes || []); setAcademicYears(a.academicYears || []); setLoading(false);
    }).catch(() => setLoading(false));
  };

  const filtered = students.filter(s => {
    if (search && !s.name.includes(search) && !s.roll.includes(search) && !s.regNo.includes(search)) return false;
    if (filterClass !== 'all' && s.classId !== filterClass) return false;
    return true;
  });

  const openNew = () => {
    setEditItem(null);
    setForm({ name: '', roll: '', regNo: '', fatherName: '', motherName: '', gender: 'male', phone: '', address: '', dateOfBirth: '', classId: '', academicYearId: '' });
    setDialogOpen(true);
  };

  const openEdit = (item: Student) => {
    setEditItem(item);
    setForm({
      name: item.name, roll: item.roll, regNo: item.regNo, fatherName: item.fatherName || '',
      motherName: item.motherName || '', gender: item.gender || 'male', phone: item.phone || '',
      address: item.address || '', dateOfBirth: item.dateOfBirth ? item.dateOfBirth.slice(0, 10) : '', classId: item.classId || '', academicYearId: item.academicYearId || '',
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name || !form.roll || !form.regNo) {
      toast({ title: 'ত্রুটি', description: 'নাম, রোল ও রেজি. নং দিন', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const url = editItem ? `/api/students/${editItem.id}` : '/api/students';
      const method = editItem ? 'PUT' : 'POST';
      const res = await authFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) { toast({ title: editItem ? 'আপডেট হয়েছে' : 'তৈরি হয়েছে' }); setDialogOpen(false); reload(); }
      else { const d = await res.json(); toast({ title: 'ত্রুটি', description: d.error, variant: 'destructive' }); }
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }); }
    setSaving(false);
  };

  const deleteItem = async (id: string) => {
    try {
      const res = await authFetch(`/api/students/${id}`, { method: 'DELETE' });
      if (res.ok) { toast({ title: 'ডিলিট হয়েছে' }); reload(); }
      else toast({ title: 'ত্রুটি', variant: 'destructive' });
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">শিক্ষার্থী ব্যবস্থাপনা</h2>
          <p className="text-sm text-muted-foreground">মোট {filtered.length} জন শিক্ষার্থী</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />নতুন শিক্ষার্থী</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="নাম, রোল বা রেজি. নং দিয়ে খুঁজুন..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterClass} onValueChange={setFilterClass}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="শ্রেণি" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সকল শ্রেণি</SelectItem>
            {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>রোল</TableHead>
                    <TableHead>নাম</TableHead>
                    <TableHead className="hidden sm:table-cell">পিতা</TableHead>
                    <TableHead className="hidden md:table-cell">শ্রেণি</TableHead>
                    <TableHead className="hidden lg:table-cell">ফোন</TableHead>
                    <TableHead className="text-right">কার্যক্রম</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">কোনো শিক্ষার্থী নেই</TableCell></TableRow>
                  ) : filtered.slice(0, 50).map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono">{s.roll}</TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{s.fatherName}</TableCell>
                      <TableCell className="hidden md:table-cell"><Badge variant="outline">{s.class?.name || '-'}</Badge></TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">{s.phone || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>আপনি কি নিশ্চিত?</AlertDialogTitle><AlertDialogDescription>{s.name} কে মুছে ফেলা হবে।</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>বাতিল</AlertDialogCancel><AlertDialogAction onClick={() => deleteItem(s.id)}>মুছুন</AlertDialogAction></AlertDialogFooter>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editItem ? 'শিক্ষার্থী সম্পাদনা' : 'নতুন শিক্ষার্থী'}</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2"><Label>নাম *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>রোল *</Label><Input value={form.roll} onChange={(e) => setForm({ ...form, roll: e.target.value })} /></div>
              <div className="space-y-2"><Label>রেজি. নং *</Label><Input value={form.regNo} onChange={(e) => setForm({ ...form, regNo: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2"><Label>পিতার নাম</Label><Input value={form.fatherName} onChange={(e) => setForm({ ...form, fatherName: e.target.value })} /></div>
              <div className="space-y-2"><Label>মাতার নাম</Label><Input value={form.motherName} onChange={(e) => setForm({ ...form, motherName: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2"><Label>লিঙ্গ</Label><Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="male">পুরুষ</SelectItem><SelectItem value="female">মহিলা</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>ফোন</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="space-y-2"><Label>জন্ম তারিখ</Label><Input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} /></div>
              <div className="space-y-2"><Label>ঠিকানা</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>শ্রেণি</Label>
                <Select value={form.classId} onValueChange={(v) => setForm({ ...form, classId: v })}>
                  <SelectTrigger><SelectValue placeholder="শ্রেণি নির্বাচন" /></SelectTrigger>
                  <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>শিক্ষাবর্ষ</Label>
                <Select value={form.academicYearId} onValueChange={(v) => setForm({ ...form, academicYearId: v })}>
                  <SelectTrigger><SelectValue placeholder="শিক্ষাবর্ষ নির্বাচন" /></SelectTrigger>
                  <SelectContent>{academicYears.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>বাতিল</Button><Button onClick={save} disabled={saving}>{saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
