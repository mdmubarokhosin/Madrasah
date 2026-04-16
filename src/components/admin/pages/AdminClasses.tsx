'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, Layers } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authFetch } from '@/lib/api';
import type { Class } from '@/types';

export function AdminClasses() {
  const { toast } = useToast();
  const [items, setItems] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Class | null>(null);
  const [form, setForm] = useState({ name: '', nameEn: '', description: '', sortOrder: 0, isActive: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authFetch('/api/classes').then(r => r.json()).then(d => { setItems(d.classes || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const reload = () => {
    setLoading(true);
    authFetch('/api/classes').then(r => r.json()).then(d => { setItems(d.classes || []); setLoading(false); }).catch(() => setLoading(false));
  };

  const openNew = () => { setEditItem(null); setForm({ name: '', nameEn: '', description: '', sortOrder: 0, isActive: true }); setDialogOpen(true); };
  const openEdit = (item: Class) => {
    setEditItem(item);
    setForm({ name: item.name, nameEn: item.nameEn || '', description: item.description || '', sortOrder: item.sortOrder, isActive: item.isActive });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name) { toast({ title: 'ত্রুটি', description: 'শ্রেণির নাম দিন', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const url = editItem ? `/api/classes/${editItem.id}` : '/api/classes';
      const method = editItem ? 'PUT' : 'POST';
      const res = await authFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) { toast({ title: editItem ? 'আপডেট হয়েছে' : 'তৈরি হয়েছে' }); setDialogOpen(false); reload(); }
      else { const d = await res.json(); toast({ title: 'ত্রুটি', description: d.error, variant: 'destructive' }); }
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }); }
    setSaving(false);
  };

  const deleteItem = async (id: string) => {
    try {
      const res = await authFetch(`/api/classes/${id}`, { method: 'DELETE' });
      if (res.ok) { toast({ title: 'ডিলিট হয়েছে' }); reload(); }
      else toast({ title: 'ত্রুটি', variant: 'destructive' });
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">শ্রেণি ব্যবস্থাপনা</h2>
          <p className="text-sm text-muted-foreground">শ্রেণি তৈরি, সম্পাদনা ও পরিচালনা করুন</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />নতুন শ্রেণি</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">ক্রম</TableHead>
                  <TableHead>নাম</TableHead>
                  <TableHead className="hidden sm:table-cell">ইংরেজি নাম</TableHead>
                  <TableHead className="hidden md:table-cell">বিবরণ</TableHead>
                  <TableHead>অবস্থা</TableHead>
                  <TableHead className="hidden lg:table-cell">শিক্ষার্থী</TableHead>
                  <TableHead className="text-right">কার্যক্রম</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">কোনো শ্রেণি নেই</TableCell></TableRow>
                ) : items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.sortOrder}</TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">{item.nameEn}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-xs max-w-32 truncate">{item.description}</TableCell>
                    <TableCell><Badge variant={item.isActive ? 'default' : 'secondary'}>{item.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}</Badge></TableCell>
                    <TableCell className="hidden lg:table-cell">{item._count?.students || 0} জন</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>আপনি কি নিশ্চিত?</AlertDialogTitle><AlertDialogDescription>এই শ্রেণি মুছে ফেলা হবে।</AlertDialogDescription></AlertDialogHeader>
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
          <DialogHeader><DialogTitle>{editItem ? 'শ্রেণি সম্পাদনা' : 'নতুন শ্রেণি'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>নাম *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="প্রাথমিক স্তর" /></div>
              <div className="space-y-2"><Label>ইংরেজি নাম</Label><Input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} placeholder="Primary Level" /></div>
            </div>
            <div className="space-y-2"><Label>বিবরণ</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div className="space-y-2"><Label>ক্রম</Label><Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} /></div>
            <div className="flex items-center gap-2"><Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} /><Label>সক্রিয়</Label></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>বাতিল</Button><Button onClick={save} disabled={saving}>{saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
