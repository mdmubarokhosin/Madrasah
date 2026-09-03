'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, Repeat, Loader2, PauseCircle, XCircle } from 'lucide-react';
import { dbPush, dbUpdate, dbRemove, dbSubscribe } from '@/lib/db-service';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { DonationSubscription } from '@/types/database';
import { useTranslation } from '@/lib/i18n-context';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const EMPTY_FORM = {
  donorName: '',
  donorPhone: '',
  donorEmail: '',
  amount: '',
  frequency: 'monthly' as 'monthly' | 'weekly' | 'yearly',
  fundId: '',
  startDate: '',
  endDate: '',
  status: 'active' as 'active' | 'paused' | 'cancelled',
  lastPaidDate: '',
  nextDueDate: '',
  totalPaid: '',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminSubscriptions() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const donations = useAppStore((s) => s.donations);

  const [subscriptions, setSubscriptions] = useState<DonationSubscription[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [frequencyFilter, setFrequencyFilter] = useState('all');

  /* Dialog */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DonationSubscription | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  /* Delete */
  const [deleteTarget, setDeleteTarget] = useState<DonationSubscription | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* Subscribe */
  useEffect(() => {
    const unsub = dbSubscribe('/donationSubscriptions', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list: DonationSubscription[] = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        }));
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setSubscriptions(list);
      } else {
        setSubscriptions([]);
      }
    });
    return () => unsub();
  }, []);

  /* Filtered */
  const filtered = useMemo(() => {
    return subscriptions.filter((s) => {
      const statusMatch = statusFilter === 'all' || s.status === statusFilter;
      const freqMatch = frequencyFilter === 'all' || s.frequency === frequencyFilter;
      return statusMatch && freqMatch;
    });
  }, [subscriptions, statusFilter, frequencyFilter]);

  /* Summary */
  const activeCount = useMemo(() => subscriptions.filter((s) => s.status === 'active').length, [subscriptions]);
  const monthlyExpected = useMemo(() => subscriptions.filter((s) => s.status === 'active' && s.frequency === 'monthly').reduce((sum, s) => sum + (s.amount || 0), 0), [subscriptions]);
  const weeklyExpected = useMemo(() => subscriptions.filter((s) => s.status === 'active' && s.frequency === 'weekly').reduce((sum, s) => sum + (s.amount || 0), 0), [subscriptions]);
  const thisMonthCollected = useMemo(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return subscriptions.filter((s) => (s.lastPaidDate || '').startsWith(ym) && s.status === 'active')
      .reduce((sum, s) => sum + (s.amount || 0), 0);
  }, [subscriptions]);
  const pausedCount = useMemo(() => subscriptions.filter((s) => s.status === 'paused').length, [subscriptions]);

  const frequencyLabel = (freq: string) => {
    switch (freq) {
      case 'monthly': return t('adminSubscriptions.freqMonthly');
      case 'weekly': return t('adminSubscriptions.freqWeekly');
      case 'yearly': return t('adminSubscriptions.freqYearly');
      default: return freq;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'active': return t('common.active');
      case 'paused': return t('adminSubscriptions.paused');
      case 'cancelled': return t('adminSubscriptions.statusCancelled');
      default: return status;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-200';
      case 'paused': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-red-100 text-red-700 border-red-200';
    }
  };

  /* Handlers */
  const resetAndOpen = useCallback(() => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((item: DonationSubscription) => {
    setEditing(item);
    setForm({
      donorName: item.donorName || '',
      donorPhone: item.donorPhone || '',
      donorEmail: item.donorEmail || '',
      amount: String(item.amount || 0),
      frequency: item.frequency || 'monthly',
      fundId: item.fundId || '',
      startDate: item.startDate || '',
      endDate: item.endDate || '',
      status: item.status || 'active',
      lastPaidDate: item.lastPaidDate || '',
      nextDueDate: item.nextDueDate || '',
      totalPaid: String(item.totalPaid || 0),
    });
    setDialogOpen(true);
  }, []);

  const handleSubmit = async () => {
    if (!form.donorName.trim() || !form.amount) {
      toast({ title: t('common.error'), description: t('adminSubscriptions.errNameAmount'), variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        donorName: form.donorName.trim(),
        donorPhone: form.donorPhone.trim(),
        donorEmail: form.donorEmail.trim(),
        amount: Number(form.amount) || 0,
        frequency: form.frequency,
        fundId: form.fundId,
        startDate: form.startDate || new Date().toISOString().split('T')[0],
        endDate: form.endDate || '',
        status: form.status,
        lastPaidDate: form.lastPaidDate || '',
        nextDueDate: form.nextDueDate || '',
        totalPaid: Number(form.totalPaid) || 0,
      };
      if (editing) {
        await dbUpdate('/donationSubscriptions/' + editing.id, payload);
        toast({ title: t('common.success'), description: t('adminSubscriptions.subUpdated') });
      } else {
        await dbPush('/donationSubscriptions', { ...payload, createdAt: Date.now() });
        toast({ title: t('common.success'), description: t('adminSubscriptions.subCreated') });
      }
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      setEditing(null);
    } catch {
      toast({ title: t('common.error'), description: t('common.operationFailed'), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await dbRemove('/donationSubscriptions/' + deleteTarget.id);
      toast({ title: t('common.success'), description: t('common.deleted') });
      setDeleteTarget(null);
    } catch {
      toast({ title: t('common.error'), description: t('common.deleteFailed'), variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const togglePause = async (sub: DonationSubscription) => {
    const newStatus = sub.status === 'paused' ? 'active' : 'paused';
    try {
      await dbUpdate('/donationSubscriptions/' + sub.id, { status: newStatus });
      toast({ title: t('common.success'), description: newStatus === 'paused' ? t('adminSubscriptions.pausedMsg') : t('adminSubscriptions.reactivatedMsg') });
    } catch {
      toast({ title: t('common.error'), description: t('adminSubscriptions.updateFailed'), variant: 'destructive' });
    }
  };

  const cancelSubscription = async (sub: DonationSubscription) => {
    try {
      await dbUpdate('/donationSubscriptions/' + sub.id, { status: 'cancelled' });
      toast({ title: t('common.success'), description: t('adminSubscriptions.cancelledMsg') });
    } catch {
      toast({ title: t('common.error'), description: t('adminSubscriptions.updateFailed'), variant: 'destructive' });
    }
  };

  const getFundName = (fundId: string) => {
    if (!fundId) return '—';
    const fund = donations.find((d) => d.id === fundId);
    return fund?.title || fundId;
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-islamic-dark">{t('adminSubscriptions.title')}</h2>
          <p className="text-muted-foreground text-sm mt-1">{t('adminSubscriptions.subtitle')}</p>
        </div>
        <Button onClick={resetAndOpen} className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer">
          <Plus className="size-4" />
          {t('adminSubscriptions.addNew')}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{activeCount}</p>
            <p className="text-xs text-muted-foreground">{t('adminSubscriptions.activeSubscriptions')}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-islamic-dark">৳{monthlyExpected.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{t('adminSubscriptions.monthlyExpected')}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">৳{thisMonthCollected.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{t('adminSubscriptions.thisMonthCollected')}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{pausedCount}</p>
            <p className="text-xs text-muted-foreground">{t('adminSubscriptions.paused')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-wrap">
          {['all', 'active', 'paused', 'cancelled'].map((status) => (
            <Button
              key={status}
              size="sm"
              variant={statusFilter === status ? 'default' : 'outline'}
              onClick={() => setStatusFilter(status)}
              className={`text-xs cursor-pointer ${statusFilter === status ? 'bg-islamic hover:bg-islamic-light text-white' : ''}`}
            >
              {status === 'all' ? t('adminSubscriptions.allStatuses') : statusLabel(status)}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          {['all', 'monthly', 'weekly', 'yearly'].map((freq) => (
            <Button
              key={freq}
              size="sm"
              variant={frequencyFilter === freq ? 'default' : 'outline'}
              onClick={() => setFrequencyFilter(freq)}
              className={`text-xs cursor-pointer ${frequencyFilter === freq ? 'bg-islamic hover:bg-islamic-light text-white' : ''}`}
            >
              {freq === 'all' ? t('adminSubscriptions.allTypes') : frequencyLabel(freq)}
            </Button>
          ))}
        </div>
      </div>

      {/* Table - Desktop */}
      <Card className="shadow-sm hidden md:block">
        <CardContent className="p-0">
          {filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminSubscriptions.thDonor')}</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-center">{t('common.type')}</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-right">{t('common.amount')}</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminSubscriptions.fund')}</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminSubscriptions.nextDate')}</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-right">{t('adminSubscriptions.totalPaid')}</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-center">{t('common.status')}</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="py-3">
                        <p className="font-medium text-sm text-islamic-dark">{sub.donorName}</p>
                        <p className="text-xs text-muted-foreground">{sub.donorPhone || sub.donorEmail || '—'}</p>
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        <Badge className="text-xs bg-islamic/10 text-islamic border-islamic/20">
                          {frequencyLabel(sub.frequency)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm py-3 text-right font-semibold text-green-600">৳{(sub.amount || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-sm py-3 text-muted-foreground">{getFundName(sub.fundId)}</TableCell>
                      <TableCell className="text-sm py-3 text-muted-foreground">{sub.nextDueDate || '—'}</TableCell>
                      <TableCell className="text-sm py-3 text-right font-semibold">৳{(sub.totalPaid || 0).toLocaleString()}</TableCell>
                      <TableCell className="py-3 text-center">
                        <Badge className={`text-xs ${statusColor(sub.status)}`}>
                          {statusLabel(sub.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {sub.status !== 'cancelled' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`size-8 cursor-pointer ${sub.status === 'paused' ? 'text-green-600 hover:text-green-700' : 'text-yellow-600 hover:text-yellow-700'}`}
                              onClick={() => togglePause(sub)}
                              title={sub.status === 'paused' ? t('adminSubscriptions.activate') : t('adminSubscriptions.pause')}
                            >
                              {sub.status === 'paused' ? <Repeat className="size-4" /> : <PauseCircle className="size-4" />}
                            </Button>
                          )}
                          {sub.status === 'active' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-red-600 cursor-pointer"
                              onClick={() => cancelSubscription(sub)}
                              title={t('adminSubscriptions.cancelAction')}
                            >
                              <XCircle className="size-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-islamic cursor-pointer" onClick={() => openEdit(sub)}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-red-600 cursor-pointer" onClick={() => setDeleteTarget(sub)}>
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Repeat className="size-12 opacity-20 mb-3" />
              <p className="text-sm">{t('adminSubscriptions.noSubscriptions')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((sub) => (
              <Card key={sub.id} className="shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm truncate">{sub.donorName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{sub.donorPhone || sub.donorEmail || '—'}</p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {sub.status !== 'cancelled' && (
                        <Button variant="ghost" size="icon" className={`size-7 ${sub.status === 'paused' ? 'text-green-600' : 'text-yellow-600'}`} onClick={() => togglePause(sub)}>
                          {sub.status === 'paused' ? <Repeat className="size-3.5" /> : <PauseCircle className="size-3.5" />}
                        </Button>
                      )}
                      {sub.status === 'active' && (
                        <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-red-600" onClick={() => cancelSubscription(sub)}>
                          <XCircle className="size-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(sub)}><Pencil className="size-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => setDeleteTarget(sub)}><Trash2 className="size-3.5" /></Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">৳{(sub.amount || 0).toLocaleString()}/{frequencyLabel(sub.frequency)}</span>
                    {sub.fundId && (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium">{getFundName(sub.fundId)}</span>
                    )}
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColor(sub.status)}`}>
                      {statusLabel(sub.status)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Repeat className="size-12 opacity-20 mb-3" />
            <p className="text-sm">{t('adminSubscriptions.noSubscriptions')}</p>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) { setEditing(null); setForm(EMPTY_FORM); }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-islamic-dark">
              {editing ? t('adminSubscriptions.editTitle') : t('adminSubscriptions.addTitle')}
            </DialogTitle>
            <DialogDescription>{t('adminSubscriptions.dialogDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sub-name">{t('adminSubscriptions.labelDonorName')}</Label>
                <Input id="sub-name" placeholder={t('adminSubscriptions.phDonorName')} value={form.donorName} onChange={(e) => setForm((f) => ({ ...f, donorName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sub-phone">{t('adminSubscriptions.phone')}</Label>
                <Input id="sub-phone" placeholder={t('adminSubscriptions.phone')} value={form.donorPhone} onChange={(e) => setForm((f) => ({ ...f, donorPhone: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sub-email">{t('common.email')}</Label>
                <Input id="sub-email" type="email" placeholder={t('common.email')} value={form.donorEmail} onChange={(e) => setForm((f) => ({ ...f, donorEmail: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sub-amount">{t('adminSubscriptions.labelAmount')}</Label>
                <Input id="sub-amount" type="number" placeholder={t('common.amount')} value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('adminSubscriptions.frequency')}</Label>
                <Select value={form.frequency} onValueChange={(v) => setForm((f) => ({ ...f, frequency: v as 'monthly' | 'weekly' | 'yearly' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">{t('adminSubscriptions.freqMonthly')}</SelectItem>
                    <SelectItem value="weekly">{t('adminSubscriptions.freqWeekly')}</SelectItem>
                    <SelectItem value="yearly">{t('adminSubscriptions.freqYearly')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('adminSubscriptions.fund')}</Label>
                <Select value={form.fundId} onValueChange={(v) => setForm((f) => ({ ...f, fundId: v }))}>
                  <SelectTrigger><SelectValue placeholder={t('adminSubscriptions.phSelectFund')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">{t('adminSubscriptions.general')}</SelectItem>
                    {donations.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sub-start">{t('adminSubscriptions.startDate')}</Label>
                <Input id="sub-start" type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sub-end">{t('adminSubscriptions.endDate')}</Label>
                <Input id="sub-end" type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('common.status')}</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as 'active' | 'paused' | 'cancelled' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t('common.active')}</SelectItem>
                    <SelectItem value="paused">{t('adminSubscriptions.paused')}</SelectItem>
                    <SelectItem value="cancelled">{t('adminSubscriptions.statusCancelled')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sub-total">{t('adminSubscriptions.labelTotalPaid')}</Label>
                <Input id="sub-total" type="number" placeholder={t('adminSubscriptions.totalPaid')} value={form.totalPaid} onChange={(e) => setForm((f) => ({ ...f, totalPaid: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sub-last">{t('adminSubscriptions.labelLastPaid')}</Label>
                <Input id="sub-last" type="date" value={form.lastPaidDate} onChange={(e) => setForm((f) => ({ ...f, lastPaidDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sub-next">{t('adminSubscriptions.nextDate')}</Label>
                <Input id="sub-next" type="date" value={form.nextDueDate} onChange={(e) => setForm((f) => ({ ...f, nextDueDate: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); setEditing(null); setForm(EMPTY_FORM); }}>{t('common.cancel')}</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer">
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {editing ? t('adminSubscriptions.updateBtn') : t('adminSubscriptions.saveBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('adminSubscriptions.deleteDesc', { name: deleteTarget?.donorName || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white gap-2 cursor-pointer">
              {deleting && <Loader2 className="size-4 animate-spin" />}
              {t('common.confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
