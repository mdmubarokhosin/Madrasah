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
import type { FAQ } from '@/types';

export function AdminFaqs() {
  const { toast } = useToast();
  const token = typeof window !== 'undefined' ? localStorage.getItem('madrasa_token') : '';

  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FAQ | null>(null);
  const [form, setForm] = useState({ question: '', answer: '', isActive: true });

  const loadFaqs = async () => {
    try {
      const res = await authFetch('/api/faqs', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setFaqs(data.faqs || []);
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' });
    }
  };

  useEffect(() => { loadFaqs();  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editing ? `/api/faqs/${editing.id}` : '/api/faqs';
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
        setForm({ question: '', answer: '', isActive: true });
        loadFaqs();
      } else {
        const data = await res.json();
        toast({ title: 'ত্রুটি', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' });
    }
  };

  const handleEdit = (faq: FAQ) => {
    setEditing(faq);
    setForm({ question: faq.question, answer: faq.answer, isActive: faq.isActive });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত?')) return;
    try {
      const res = await authFetch(`/api/faqs/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { toast({ title: 'মুছে ফেলা হয়েছে' }); loadFaqs(); }
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">সাধারণ জিজ্ঞাসা</h2>
          <p className="text-sm text-muted-foreground">মোট: {faqs.length} টি</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditing(null); }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />নতুন FAQ</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'FAQ সম্পাদনা' : 'নতুন FAQ'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-2"><Label>প্রশ্ন *</Label><Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} required /></div>
              <div className="space-y-2"><Label>উত্তর *</Label><Textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} rows={4} required /></div>
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
                  <TableHead>প্রশ্ন</TableHead>
                  <TableHead className="hidden md:table-cell">উত্তর</TableHead>
                  <TableHead className="text-center">অবস্থা</TableHead>
                  <TableHead className="text-right">কার্যক্রম</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faqs.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">কোনো FAQ নেই</TableCell></TableRow>
                ) : faqs.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium text-sm">{f.question}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground line-clamp-1">{f.answer}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={f.isActive ? 'default' : 'secondary'}>{f.isActive ? 'সচল' : 'নিষ্ক্রিয়'}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(f)}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(f.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
