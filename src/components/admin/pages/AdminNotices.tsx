/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { authFetch } from '@/lib/api';
import { Plus, Edit, Trash2 } from 'lucide-react';
import type { Notice } from '@/types';

export function AdminNotices() {
  const { toast } = useToast();
  const token = typeof window !== 'undefined' ? localStorage.getItem('madrasa_token') : '';

  const [notices, setNotices] = useState<Notice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [form, setForm] = useState({ title: '', content: '', date: '', isActive: true });

  const loadNotices = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/notices/admin?page=${page}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setNotices(data.notices || []);
      setTotal(data.total || 0);
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' });
    }
    setLoading(false);
  };

  useEffect(() => { loadNotices();  }, [page]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editing ? `/api/notices/${editing.id}` : '/api/notices';
      const method = editing ? 'PUT' : 'POST';
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast({ title: editing ? 'আপডেট হয়েছে' : 'তৈরি হয়েছে' });
        setDialogOpen(false);
        setEditing(null);
        setForm({ title: '', content: '', date: '', isActive: true });
        loadNotices();
      } else {
        const data = await res.json();
        toast({ title: 'ত্রুটি', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' });
    }
  };

  const handleEdit = (notice: Notice) => {
    setEditing(notice);
    setForm({ title: notice.title, content: notice.content, date: notice.date, isActive: notice.isActive });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত?')) return;
    try {
      const res = await authFetch(`/api/notices/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { toast({ title: 'মুছে ফেলা হয়েছে' }); loadNotices(); }
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">নোটিশ ব্যবস্থাপনা</h2>
          <p className="text-sm text-muted-foreground">মোট: {total} টি</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditing(null); }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />নতুন নোটিশ</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'নোটিশ সম্পাদনা' : 'নতুন নোটিশ'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-2"><Label>শিরোনাম *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div className="space-y-2"><Label>বিবরণ *</Label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} required /></div>
              <div className="space-y-2"><Label>তারিখ *</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
              <Button type="submit" className="w-full">{editing ? 'আপডেট' : 'তৈরি'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>শিরোনাম</TableHead>
                  <TableHead className="text-center hidden sm:table-cell">তারিখ</TableHead>
                  <TableHead className="text-center">অবস্থা</TableHead>
                  <TableHead className="text-right">কার্যক্রম</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notices.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">কোনো নোটিশ নেই</TableCell></TableRow>
                ) : notices.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{n.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{n.content}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center hidden sm:table-cell text-sm">{n.date}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={n.isActive ? 'default' : 'secondary'}>{n.isActive ? 'সচল' : 'নিষ্ক্রিয়'}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(n)}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(n.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
