'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authFetch } from '@/lib/api';
import type { AcademicYear } from '@/types';

export function AdminAcademicYears() {
  const { toast } = useToast();
  const [items, setItems] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<AcademicYear | null>(null);
  const [form, setForm] = useState({ name: '', nameEn: '', startDate: '', endDate: '', isActive: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authFetch('/api/academic-years').then(r => r.json()).then(d => { setItems(d.academicYears || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const reload = () => {
    setLoading(true);
    authFetch('/api/academic-years').then(r => r.json()).then(d => { setItems(d.academicYears || []); setLoading(false); }).catch(() => setLoading(false));
  };

  const openNew = () => { setEditItem(null); setForm({ name: '', nameEn: '', startDate: '', endDate: '', isActive: true }); setDialogOpen(true); };
  const openEdit = (item: AcademicYear) => {
    setEditItem(item);
    setForm({
      name: item.name, nameEn: item.nameEn || '',
      startDate: item.startDate ? item.startDate.split('T')[0] : '',
      endDate: item.endDate ? item.endDate.split('T')[0] : '',
      isActive: item.isActive,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name) { toast({ title: 'ত্রুটি', description: 'শিক্ষাবর্ষের নাম দিন', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const url = editItem ? `/api/academic-years/${editItem.id}` : '/api/academic-years';
      const method = editItem ? 'PUT' : 'POST';
      const res = await authFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) { toast({ title: editItem ? 'আপডেট হয়েছে' : 'তৈরি হয়েছে' }); setDialogOpen(false); reload(); }
      else { const d = await res.json(); toast({ title: 'ত্রুটি', description: d.error, variant: 'destructive' }); }
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }); }
    setSaving(false);
  };

  const deleteItem = async (id: string) => {
    try {
      const res = await authFetch(`/api/academic-years/${id}`, { method: 'DELETE' });
      if (res.ok) { toast({ title: 'ডিলিট হয়েছে' }); reload(); }
      else toast({ title: 'ত্রুটি', variant: 'destructive' });
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">শিক্ষাবর্ষ ব্যবস্থাপনা</h2>
          <p className="text-sm text-muted-foreground">শিক্ষাবর্ষ তৈরি, সম্পাদনা ও পরিচালনা করুন</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />নতুন শিক্ষাবর্ষ</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>নাম</TableHead>
                  <TableHead className="hidden sm:table-cell">ইংরেজি নাম</TableHead>
                  <TableHead className="hidden md:table-cell">শুরু</TableHead>
                  <TableHead className="hidden md:table-cell">শেষ</TableHead>
                  <TableHead>অবস্থা</TableHead>
                  <TableHead className="hidden lg:table-cell">শিক্ষার্থী</TableHead>
                  <TableHead className="text-right">কার্যক্রম</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">কোনো শিক্ষাবর্ষ নেই</TableCell></TableRow>
                ) : items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">{item.nameEn}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-xs">{item.startDate ? item.startDate.split('T')[0] : '-'}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-xs">{item.endDate ? item.endDate.split('T')[0] : '-'}</TableCell>
                    <TableCell><Badge variant={item.isActive ? 'default' : 'secondary'}>{item.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}</Badge></TableCell>
                    <TableCell className="hidden lg:table-cell">{item._count?.students || 0} জন</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>আপনি কি নিশ্চিত?</AlertDialogTitle><AlertDialogDescription>এই শিক্ষাবর্ষ মুছে ফেলা হবে।</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>বাতিল</AlertDialogCancel><AlertDialogAction onClick={() => deleteItem(item.id)}>মুছুন</AlertDialogAction></AlertDialogFooter>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editItem ? 'শিক্ষাবর্ষ সম্পাদনা' : 'নতুন শিক্ষাবর্ষ'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>নাম *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="১৪৪৬ হিজরি" /></div>
            <div className="space-y-2"><Label>ইংরেজি নাম</Label><Input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} placeholder="1446 Hijri" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>শুরু তারিখ</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
              <div className="space-y-2"><Label>শেষ তারিখ</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
            </div>
            <div className="flex items-center gap-2"><Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} /><Label>সক্রিয়</Label></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>বাতিল</Button><Button onClick={save} disabled={saving}>{saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
