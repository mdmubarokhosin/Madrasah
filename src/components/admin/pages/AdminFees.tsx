'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, DollarSign, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authFetch } from '@/lib/api';
import type { StudentFee, Student, Class, AcademicYear } from '@/types';

export function AdminFees() {
  const { toast } = useToast();
  const [fees, setFees] = useState<StudentFee[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalDue, setTotalDue] = useState(0);
  const [classes, setClasses] = useState<Class[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<StudentFee | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [form, setForm] = useState({ studentId: '', academicYearId: '', feeType: 'monthly', amount: '', month: '০১' });

  useEffect(() => {
    Promise.all([authFetch('/api/fees').then(r => r.json()), authFetch('/api/classes').then(r => r.json()), authFetch('/api/academic-years').then(r => r.json())]).then(([f, c, a]) => {
      setFees(f.fees || []); setTotalAmount(f.totalAmount || 0); setTotalPaid(f.totalPaid || 0); setTotalDue(f.totalDue || 0);
      setClasses(c.classes || []); setAcademicYears(a.academicYears || []); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);
  const reload = () => {
    setLoading(true);
    authFetch('/api/fees').then(r => r.json()).then(d => { setFees(d.fees || []); setTotalAmount(d.totalAmount || 0); setTotalPaid(d.totalPaid || 0); setTotalDue(d.totalDue || 0); setLoading(false); }).catch(() => setLoading(false));
  };

  const filtered = fees.filter(f => {
    if (filterStatus !== 'all' && f.status !== filterStatus) return false;
    return true;
  });

  const addFee = async () => {
    if (!form.studentId || !form.amount) { toast({ title: 'ত্রুটি', description: 'শিক্ষার্থী ও পরিমাণ দিন', variant: 'destructive' }); return; }
    try {
      const res = await authFetch('/api/fees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) { toast({ title: 'ফি যোগ হয়েছে' }); setDialogOpen(false); reload(); } else toast({ title: 'ত্রুটি', variant: 'destructive' });
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }); }
  };

  const payFee = async () => {
    if (!selectedFee || !payAmount) return;
    try {
      const res = await authFetch(`/api/fees/${selectedFee.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paidAmount: (selectedFee.paidAmount + parseFloat(payAmount)) }) });
      if (res.ok) { toast({ title: 'পরিশোধ হয়েছে' }); setPayDialogOpen(false); reload(); } else toast({ title: 'ত্রুটি', variant: 'destructive' });
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }); }
  };

  const fmt = (n: number) => `৳${n.toLocaleString('bn-BD')}`;
  const statusBadge = (s: string) => s === 'paid' ? <Badge className="bg-emerald-100 text-emerald-700 border-0">পরিশোধিত</Badge> : s === 'partial' ? <Badge className="bg-amber-100 text-amber-700 border-0">আংশিক</Badge> : <Badge variant="secondary">বকেয়া</Badge>;
  const feeTypeLabel = (t: string) => t === 'admission' ? 'ভর্তি ফি' : t === 'monthly' ? 'মাসিক ফি' : t === 'exam' ? 'পরীক্ষা ফি' : t === 'library' ? 'লাইব্রেরি ফি' : t;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">শিক্ষার্থী ফি ব্যবস্থাপনা</h2>
          <p className="text-sm text-muted-foreground">মোট: <span className="font-semibold">{fmt(totalAmount)}</span> | পরিশোধিত: <span className="font-semibold text-primary">{fmt(totalPaid)}</span> | বকেয়া: <span className="font-semibold text-amber-600">{fmt(totalDue)}</span></p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />ফি যোগ করুন</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="অবস্থা" /></SelectTrigger>
          <SelectContent><SelectItem value="all">সকল</SelectItem><SelectItem value="paid">পরিশোধিত</SelectItem><SelectItem value="unpaid">বকেয়া</SelectItem><SelectItem value="partial">আংশিক</SelectItem></SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? <div className="p-4 space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div> : (
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>শিক্ষার্থী</TableHead><TableHead className="hidden sm:table-cell">শ্রেণি</TableHead><TableHead>ধরন</TableHead><TableHead className="hidden md:table-cell">মাস</TableHead><TableHead className="text-right">পরিমাণ</TableHead><TableHead className="text-right">পরিশোধিত</TableHead><TableHead className="text-right">বকেয়া</TableHead><TableHead className="text-center">অবস্থা</TableHead><TableHead className="text-right">কার্যক্রম</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filtered.length === 0 ? <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">কোনো ফি রেকর্ড নেই</TableCell></TableRow> : filtered.slice(0, 100).map(f => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.student?.name || '-'}<p className="text-xs text-muted-foreground">রোল: {f.student?.roll}</p></TableCell>
                      <TableCell className="hidden sm:table-cell"><Badge variant="outline">{f.student?.class?.name || '-'}</Badge></TableCell>
                      <TableCell className="text-sm">{feeTypeLabel(f.feeType)}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{f.month || '-'}</TableCell>
                      <TableCell className="text-right">{fmt(f.amount)}</TableCell>
                      <TableCell className="text-right text-primary">{fmt(f.paidAmount)}</TableCell>
                      <TableCell className="text-right text-amber-600">{fmt(f.dueAmount)}</TableCell>
                      <TableCell className="text-center">{statusBadge(f.status)}</TableCell>
                      <TableCell className="text-right">
                        {f.status !== 'paid' && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-emerald-600" onClick={() => { setSelectedFee(f); setPayAmount(f.dueAmount.toString()); setPayDialogOpen(true); }}>
                            <CheckCircle2 className="mr-1 h-3 w-3" />পরিশোধ
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Fee Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>ফি যোগ করুন</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>শিক্ষার্থীর আইডি *</Label><Input value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} placeholder="শিক্ষার্থীর আইডি" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>ধরন</Label><Select value={form.feeType} onValueChange={(v) => setForm({ ...form, feeType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="admission">ভর্তি ফি</SelectItem><SelectItem value="monthly">মাসিক ফি</SelectItem><SelectItem value="exam">পরীক্ষা ফি</SelectItem><SelectItem value="library">লাইব্রেরি ফি</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>পরিমাণ *</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>মাস</Label><Input value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} placeholder="০১" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>বাতিল</Button><Button onClick={addFee}>সংরক্ষণ</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay Fee Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>ফি পরিশোধ</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <p className="text-sm">শিক্ষার্থী: <span className="font-semibold">{selectedFee?.student?.name}</span></p>
              <p className="text-sm">মোট পরিমাণ: <span className="font-semibold">{fmt(selectedFee?.amount || 0)}</span></p>
              <p className="text-sm">পূর্বে পরিশোধিত: <span className="font-semibold text-primary">{fmt(selectedFee?.paidAmount || 0)}</span></p>
              <p className="text-sm">বকেয়া: <span className="font-semibold text-amber-600">{fmt(selectedFee?.dueAmount || 0)}</span></p>
            </div>
            <div className="space-y-2"><Label>পরিশোধের পরিমাণ</Label><Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} max={selectedFee?.dueAmount || 0} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setPayDialogOpen(false)}>বাতিল</Button><Button onClick={payFee}>পরিশোধ করুন</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
