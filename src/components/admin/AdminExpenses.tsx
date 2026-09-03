'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, Receipt, Loader2, CheckCircle, XCircle, Filter } from 'lucide-react';
import { dbPush, dbUpdate, dbRemove, dbSubscribe } from '@/lib/db-service';
import { useTranslation } from '@/lib/i18n-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
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
import type { Expense } from '@/types/database';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const EXPENSE_CATEGORIES = [
  'খাদ্য', 'পরিবহন', 'বিদ্যুৎ', 'জ্বালানি', 'ভবন মেরামত',
  'অফিস সরবরাহ', 'প্রিন্টিং', 'ইন্টারনেট', 'ফোন বিল',
  'শিক্ষা উপকরণ', 'স্বাস্থ্য', 'অনুদান', 'বেতন', 'অন্যান্য',
];

const EMPTY_FORM = {
  title: '',
  category: '',
  amount: '',
  date: '',
  description: '',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminExpenses() {
  const { t } = useTranslation();
  const { toast } = useToast();

  /* Bengali category values are stored in Firebase — only display labels are translated */
  const categoryLabels: Record<string, string> = {
    'খাদ্য': t('adminExpenses.catFood'),
    'পরিবহন': t('adminExpenses.catTransport'),
    'বিদ্যুৎ': t('adminExpenses.catElectricity'),
    'জ্বালানি': t('adminExpenses.catFuel'),
    'ভবন মেরামত': t('adminExpenses.catRepair'),
    'অফিস সরবরাহ': t('adminExpenses.catOffice'),
    'প্রিন্টিং': t('adminExpenses.catPrinting'),
    'ইন্টারনেট': t('adminExpenses.catInternet'),
    'ফোন বিল': t('adminExpenses.catPhone'),
    'শিক্ষা উপকরণ': t('adminExpenses.catEducation'),
    'স্বাস্থ্য': t('adminExpenses.catHealth'),
    'অনুদান': t('adminExpenses.catDonation'),
    'বেতন': t('adminExpenses.catSalary'),
    'অন্যান্য': t('adminExpenses.catOther'),
  };
  const catLabel = (cat: string) => categoryLabels[cat] || cat;
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  /* Dialog */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  /* Delete */
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* Subscribe */
  useEffect(() => {
    const unsub = dbSubscribe('/expenses', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list: Expense[] = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        }));
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setExpenses(list);
      } else {
        setExpenses([]);
      }
    });
    return () => unsub();
  }, []);

  /* Filtered */
  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const catMatch = categoryFilter === 'all' || e.category === categoryFilter;
      const statusMatch = statusFilter === 'all' || e.status === statusFilter;
      return catMatch && statusMatch;
    });
  }, [expenses, categoryFilter, statusFilter]);

  /* Summary */
  const totalExpenses = useMemo(() => expenses.reduce((sum, e) => sum + (e.amount || 0), 0), [expenses]);
  const thisMonth = useMemo(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return expenses.filter((e) => (e.date || '').startsWith(ym)).reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [expenses]);
  const pendingTotal = useMemo(() => expenses.filter((e) => e.status === 'pending').reduce((sum, e) => sum + (e.amount || 0), 0), [expenses]);
  const approvedTotal = useMemo(() => expenses.filter((e) => e.status === 'approved').reduce((sum, e) => sum + (e.amount || 0), 0), [expenses]);

  /* Handlers */
  const resetAndOpen = useCallback(() => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((item: Expense) => {
    setEditing(item);
    setForm({
      title: item.title,
      category: item.category,
      amount: String(item.amount),
      date: item.date || '',
      description: item.description || '',
    });
    setDialogOpen(true);
  }, []);

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.amount) {
      toast({ title: t('common.error'), description: t('adminExpenses.requiredMsg'), variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        category: form.category,
        amount: Number(form.amount) || 0,
        date: form.date || new Date().toISOString().split('T')[0],
        description: form.description.trim(),
      };
      if (editing) {
        await dbUpdate('/expenses/' + editing.id, payload);
        toast({ title: t('common.success'), description: t('adminExpenses.updatedMsg') });
      } else {
        await dbPush('/expenses', { ...payload, status: 'pending', createdBy: 'admin', approvedBy: '', createdAt: Date.now() });
        toast({ title: t('common.success'), description: t('adminExpenses.createdMsg') });
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
      await dbRemove('/expenses/' + deleteTarget.id);
      toast({ title: t('common.success'), description: t('adminExpenses.deletedMsg') });
      setDeleteTarget(null);
    } catch {
      toast({ title: t('common.error'), description: t('common.deleteFailed'), variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const updateStatus = async (item: Expense, status: 'approved' | 'rejected') => {
    try {
      await dbUpdate('/expenses/' + item.id, { status, approvedBy: 'admin' });
      toast({ title: t('common.success'), description: status === 'approved' ? t('adminExpenses.approvedMsg') : t('adminExpenses.rejectedMsg') });
    } catch {
      toast({ title: t('common.error'), description: t('adminExpenses.updateFailed'), variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-islamic-dark">{t('adminExpenses.title')}</h2>
          <p className="text-muted-foreground text-sm mt-1">{t('adminExpenses.subtitle')}</p>
        </div>
        <Button onClick={resetAndOpen} className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer">
          <Plus className="size-4" />
          {t('adminExpenses.addNew')}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">৳{totalExpenses.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{t('adminExpenses.total')}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">৳{thisMonth.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{t('adminExpenses.thisMonth')}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">৳{pendingTotal.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{t('adminExpenses.pending')}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">৳{approvedTotal.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{t('admin.approved')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{t('adminExpenses.category')}:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={categoryFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setCategoryFilter('all')}
            className={`text-xs cursor-pointer ${categoryFilter === 'all' ? 'bg-islamic hover:bg-islamic-light text-white' : ''}`}
          >
            {t('common.all')}
          </Button>
          {EXPENSE_CATEGORIES.map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={categoryFilter === cat ? 'default' : 'outline'}
              onClick={() => setCategoryFilter(cat)}
              className={`text-xs cursor-pointer ${categoryFilter === cat ? 'bg-islamic hover:bg-islamic-light text-white' : ''}`}
            >
              {catLabel(cat)}
            </Button>
          ))}
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        {['all', 'pending', 'approved', 'rejected'].map((status) => (
          <Button
            key={status}
            size="sm"
            variant={statusFilter === status ? 'default' : 'outline'}
            onClick={() => setStatusFilter(status)}
            className={`text-xs cursor-pointer ${statusFilter === status ? 'bg-islamic hover:bg-islamic-light text-white' : ''}`}
          >
            {status === 'all' ? t('common.all') : status === 'pending' ? t('adminExpenses.pending') : status === 'approved' ? t('admin.approved') : t('admin.rejected')}
          </Button>
        ))}
      </div>

      {/* Expense Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length > 0 ? filtered.map((item) => (
          <Card key={item.id} className="shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-islamic-dark truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.category ? catLabel(item.category) : t('adminExpenses.uncategorized')} • {item.date || '—'}</p>
                </div>
                <Badge className={`text-xs shrink-0 ml-2 ${
                  item.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' :
                  item.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                  'bg-yellow-100 text-yellow-700 border-yellow-200'
                }`}>
                  {item.status === 'approved' ? t('admin.approved') : item.status === 'rejected' ? t('admin.rejected') : t('adminExpenses.pending')}
                </Badge>
              </div>
              {item.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
              )}
              <p className="text-lg font-bold text-red-600">৳{(item.amount || 0).toLocaleString()}</p>
              <div className="flex items-center gap-1 pt-1">
                {item.status === 'pending' && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(item, 'approved')} className="text-xs gap-1 cursor-pointer text-green-600 hover:text-green-700 flex-1">
                      <CheckCircle className="size-3" />
                      {t('adminExpenses.approve')}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(item, 'rejected')} className="text-xs gap-1 cursor-pointer text-red-600 hover:text-red-700 flex-1">
                      <XCircle className="size-3" />
                      {t('adminExpenses.reject')}
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-islamic cursor-pointer ml-auto" onClick={() => openEdit(item)}>
                  <Pencil className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-red-600 cursor-pointer" onClick={() => setDeleteTarget(item)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )) : (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Receipt className="size-12 opacity-20 mb-3" />
            <p className="text-sm">{t('adminExpenses.noData')}</p>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) { setEditing(null); setForm(EMPTY_FORM); }
      }}>
        <DialogContent className="sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-islamic-dark">
              {editing ? t('adminExpenses.editTitle') : t('adminExpenses.addNew')}
            </DialogTitle>
            <DialogDescription>{t('adminExpenses.dialogDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="exp-title">{t('common.title')} *</Label>
              <Input id="exp-title" placeholder={t('adminExpenses.titlePh')} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('adminExpenses.category')}</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue placeholder={t('adminExpenses.categoryPh')} /></SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{catLabel(cat)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp-amount">{t('adminExpenses.amountLabel')}</Label>
                <Input id="exp-amount" type="number" placeholder={t('common.amount')} value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="exp-date">{t('common.date')}</Label>
              <Input id="exp-date" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exp-desc">{t('common.description')}</Label>
              <Textarea id="exp-desc" placeholder={t('adminExpenses.descPh')} rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); setEditing(null); setForm(EMPTY_FORM); }}>{t('common.cancel')}</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer">
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {editing ? t('common.update') : t('common.save')}
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
              {t('adminExpenses.deleteDesc', { title: deleteTarget?.title || '' })}
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
