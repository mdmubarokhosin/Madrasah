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
import { Plus, Pencil, Trash2, Banknote, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authFetch } from '@/lib/api';
import type { Salary, AcademicYear } from '@/types';

const designations = ['শিক্ষক', 'কর্মচারী', 'ইমাম', 'মুয়াজ্জিন'];
const months = ['০১', '০২', '০৩', '০৪', '০৫', '০৬', '০৭', '০৮', '০৯', '১০', '১১', '১২'];

export function AdminSalaries() {
  const { toast } = useToast();
  const [items, setItems] = useState<Salary[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalUnpaid, setTotalUnpaid] = useState(0);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Salary | null>(null);
  const [form, setForm] = useState({ employeeName: '', designation: 'শিক্ষক', month: '০১', year: '২০২৫', basicSalary: '', allowance: '0', deduction: '0', netSalary: '0', paymentStatus: 'unpaid' as string, academicYearId: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([authFetch('/api/salaries').then(r => r.json()), authFetch('/api/academic-years').then(r => r.json())]).then(([s, a]) => {
      setItems(s.salaries || []); setTotalPaid(s.totalPaid || 0); setTotalUnpaid(s.totalUnpaid || 0); setAcademicYears(a.academicYears || []); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);
  const reload = () => {
    setLoading(true);
    Promise.all([authFetch('/api/salaries').then(r => r.json()), authFetch('/api/academic-years').then(r => r.json())]).then(([s, a]) => {
      setItems(s.salaries || []); setTotalPaid(s.totalPaid || 0); setTotalUnpaid(s.totalUnpaid || 0); setAcademicYears(a.academicYears || []); setLoading(false);
    }).catch(() => setLoading(false));
  };

  const calcNet = (b: string, a: string, d: string) => {
    const net = (parseFloat(b) || 0) + (parseFloat(a) || 0) - (parseFloat(d) || 0);
    return net.toString();
  };

  const openNew = () => {
    setEditItem(null);
    setForm({ employeeName: '', designation: 'শিক্ষক', month: '০১', year: '২০২৫', basicSalary: '', allowance: '0', deduction: '0', netSalary: '0', paymentStatus: 'unpaid', academicYearId: '' });
    setDialogOpen(true);
  };

  const openEdit = (item: Salary) => {
    setEditItem(item);
    setForm({ employeeName: item.employeeName, designation: item.designation || '', month: item.month, year: item.year, basicSalary: item.basicSalary.toString(), allowance: item.allowance.toString(), deduction: item.deduction.toString(), netSalary: item.netSalary.toString(), paymentStatus: item.paymentStatus, academicYearId: item.academicYearId || '' });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.employeeName || !form.basicSalary) { toast({ title: 'ত্রুটি', description: 'কর্মীর নাম ও বেতন দিন', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const url = editItem ? `/api/salaries/${editItem.id}` : '/api/salaries';
      const method = editItem ? 'PUT' : 'POST';
      const res = await authFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) { toast({ title: editItem ? 'আপডেট হয়েছে' : 'তৈরি হয়েছে' }); setDialogOpen(false); reload(); }
      else toast({ title: 'ত্রুটি', variant: 'destructive' });
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }); }
    setSaving(false);
  };

  const markAsPaid = async (id: string) => {
    try {
      const res = await authFetch(`/api/salaries/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentStatus: 'paid' }) });
      if (res.ok) { toast({ title: 'পরিশোধ হয়েছে' }); reload(); } else toast({ title: 'ত্রুটি', variant: 'destructive' });
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }); }
  };

  const deleteItem = async (id: string) => {
    try {
      const res = await authFetch(`/api/salaries/${id}`, { method: 'DELETE' });
      if (res.ok) { toast({ title: 'ডিলিট হয়েছে' }); reload(); } else toast({ title: 'ত্রুটি', variant: 'destructive' });
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }); }
  };

  const fmt = (n: number) => `৳${n.toLocaleString('bn-BD')}`;
  const statusBadge = (s: string) => s === 'paid' ? <Badge className="bg-emerald-100 text-emerald-700 border-0">পরিশোধিত</Badge> : s === 'partial' ? <Badge className="bg-amber-100 text-amber-700 border-0">আংশিক</Badge> : <Badge variant="secondary">অপরিশোধিত</Badge>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">বেতন ব্যবস্থাপনা</h2>
          <p className="text-sm text-muted-foreground">পরিশোধিত: <span className="text-primary font-semibold">{fmt(totalPaid)}</span> | বকেয়া: <span className="text-amber-600 font-semibold">{fmt(totalUnpaid)}</span></p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />নতুন বেতন</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? <div className="p-4 space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div> : (
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>কর্মী</TableHead><TableHead className="hidden sm:table-cell">পদবি</TableHead><TableHead className="hidden md:table-cell">মাস</TableHead><TableHead className="text-right">মূল বেতন</TableHead><TableHead className="text-right hidden md:table-cell">ভাতা</TableHead><TableHead className="text-right">নেট বেতন</TableHead><TableHead className="text-center">অবস্থা</TableHead><TableHead className="text-right">কার্যক্রম</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {items.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">কোনো বেতন রেকর্ড নেই</TableCell></TableRow> : items.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.employeeName}</TableCell>
                      <TableCell className="hidden sm:table-cell"><Badge variant="outline">{item.designation}</Badge></TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{item.month}/{item.year}</TableCell>
                      <TableCell className="text-right">{fmt(item.basicSalary)}</TableCell>
                      <TableCell className="text-right hidden md:table-cell">{fmt(item.allowance)}</TableCell>
                      <TableCell className="text-right font-semibold">{fmt(item.netSalary)}</TableCell>
                      <TableCell className="text-center">{statusBadge(item.paymentStatus)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {item.paymentStatus !== 'paid' && <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" title="পরিশোধ" onClick={() => markAsPaid(item.id)}><CheckCircle2 className="h-3.5 w-3.5" /></Button>}
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>মুছে ফেলবেন?</AlertDialogTitle><AlertDialogDescription>এই বেতন রেকর্ড মুছে যাবে।</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>বাতিল</AlertDialogCancel><AlertDialogAction onClick={() => deleteItem(item.id)}>মুছুন</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
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
          <DialogHeader><DialogTitle>{editItem ? 'বেতন সম্পাদনা' : 'নতুন বেতন'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2"><Label>কর্মীর নাম *</Label><Input value={form.employeeName} onChange={(e) => setForm({ ...form, employeeName: e.target.value })} /></div>
              <div className="space-y-2"><Label>পদবি</Label><Select value={form.designation} onValueChange={(v) => setForm({ ...form, designation: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{designations.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-2"><Label>মাস</Label><Select value={form.month} onValueChange={(v) => setForm({ ...form, month: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>বছর</Label><Input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></div>
              <div className="space-y-2"><Label>অবস্থা</Label><Select value={form.paymentStatus} onValueChange={(v) => setForm({ ...form, paymentStatus: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unpaid">অপরিশোধিত</SelectItem><SelectItem value="paid">পরিশোধিত</SelectItem><SelectItem value="partial">আংশিক</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-2"><Label>মূল বেতন *</Label><Input type="number" value={form.basicSalary} onChange={(e) => setForm({ ...form, basicSalary: e.target.value, netSalary: calcNet(e.target.value, form.allowance, form.deduction) })} /></div>
              <div className="space-y-2"><Label>ভাতা</Label><Input type="number" value={form.allowance} onChange={(e) => setForm({ ...form, allowance: e.target.value, netSalary: calcNet(form.basicSalary, e.target.value, form.deduction) })} /></div>
              <div className="space-y-2"><Label>কর্তন</Label><Input type="number" value={form.deduction} onChange={(e) => setForm({ ...form, deduction: e.target.value, netSalary: calcNet(form.basicSalary, form.allowance, e.target.value) })} /></div>
              <div className="space-y-2"><Label>নেট বেতন</Label><Input value={form.netSalary} readOnly className="bg-muted" /></div>
            </div>
            <div className="space-y-2"><Label>শিক্ষাবর্ষ</Label><Select value={form.academicYearId} onValueChange={(v) => setForm({ ...form, academicYearId: v })}><SelectTrigger><SelectValue placeholder="নির্বাচন" /></SelectTrigger><SelectContent>{academicYears.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>বাতিল</Button><Button onClick={save} disabled={saving}>{saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
