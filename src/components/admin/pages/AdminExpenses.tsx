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
import { Plus, Trash2, Receipt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authFetch } from '@/lib/api';
import type { Expense, AcademicYear } from '@/types';

const categories = ['বেতন', 'বিদ্যুৎ', 'পানি', 'খাদ্য', 'অনুষ্ঠান', 'মেরামত', 'অন্যান্য'];

export function AdminExpenses() {
  const { toast } = useToast();
  const [items, setItems] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], category: 'বেতন', description: '', amount: '', academicYearId: '', paidTo: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([authFetch('/api/expenses').then(r => r.json()), authFetch('/api/academic-years').then(r => r.json())]).then(([e, a]) => {
      setItems(e.expenses || []); setTotal(e.total || 0); setAcademicYears(a.academicYears || []); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);
  const reload = () => {
    setLoading(true);
    Promise.all([authFetch('/api/expenses').then(r => r.json()), authFetch('/api/academic-years').then(r => r.json())]).then(([e, a]) => {
      setItems(e.expenses || []); setTotal(e.total || 0); setAcademicYears(a.academicYears || []); setLoading(false);
    }).catch(() => setLoading(false));
  };

  const save = async () => {
    if (!form.date || !form.category || !form.amount) { toast({ title: 'ত্রুটি', description: 'সকল ফিল্ড পূরণ করুন', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const res = await authFetch('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) { toast({ title: 'যোগ হয়েছে' }); setDialogOpen(false); reload(); }
      else toast({ title: 'ত্রুটি', variant: 'destructive' });
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }); }
    setSaving(false);
  };

  const deleteItem = async (id: string) => {
    try {
      const res = await authFetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (res.ok) { toast({ title: 'ডিলিট হয়েছে' }); reload(); } else toast({ title: 'ত্রুটি', variant: 'destructive' });
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }); }
  };

  const fmt = (n: number) => `৳${n.toLocaleString('bn-BD')}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">ব্যয় ব্যবস্থাপনা</h2>
          <p className="text-sm text-muted-foreground">মোট ব্যয়: <span className="font-bold text-destructive">{fmt(total)}</span></p>
        </div>
        <Button onClick={() => { setForm({ date: new Date().toISOString().split('T')[0], category: 'বেতন', description: '', amount: '', academicYearId: '', paidTo: '' }); setDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" />নতুন ব্যয়</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? <div className="p-4 space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div> : (
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>তারিখ</TableHead><TableHead>ক্যাটেগরি</TableHead><TableHead className="hidden md:table-cell">বিবরণ</TableHead><TableHead className="text-right">পরিমাণ</TableHead><TableHead className="hidden lg:table-cell">প্রাপক</TableHead><TableHead className="text-right">কার্যক্রম</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {items.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">কোনো ব্যয় নেই</TableCell></TableRow> : items.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs">{item.date.split('T')[0]}</TableCell>
                      <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-32 truncate">{item.description}</TableCell>
                      <TableCell className="text-right font-semibold text-destructive">{fmt(item.amount)}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">{item.paidTo}</TableCell>
                      <TableCell className="text-right">
                        <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                          <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>মুছে ফেলবেন?</AlertDialogTitle><AlertDialogDescription>এই ব্যয়ের রেকর্ড মুছে যাবে।</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>বাতিল</AlertDialogCancel><AlertDialogAction onClick={() => deleteItem(item.id)}>মুছুন</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                        </AlertDialog>
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
        <DialogContent>
          <DialogHeader><DialogTitle>নতুন ব্যয় যোগ করুন</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>তারিখ *</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div className="space-y-2"><Label>পরিমাণ *</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>ক্যাটেগরি *</Label><Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>শিক্ষাবর্ষ</Label><Select value={form.academicYearId} onValueChange={(v) => setForm({ ...form, academicYearId: v })}><SelectTrigger><SelectValue placeholder="নির্বাচন" /></SelectTrigger><SelectContent>{academicYears.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label>বিবরণ</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="space-y-2"><Label>প্রাপক</Label><Input value={form.paidTo} onChange={(e) => setForm({ ...form, paidTo: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>বাতিল</Button><Button onClick={save} disabled={saving}>{saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
