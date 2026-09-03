'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, DollarSign, Loader2, CheckCircle } from 'lucide-react';
import { dbPush, dbUpdate, dbRemove, dbSubscribe } from '@/lib/db-service';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FeeConfig {
  id: string;
  feeType: string;
  department: string;
  className: string;
  amount: number;
  description: string;
  createdAt: number;
}

interface FeePayment {
  id: string;
  studentName: string;
  studentRoll: string;
  department: string;
  className: string;
  feeType: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'partial';
  paidAmount: number;
  paidDate: string;
  month: string;
  createdAt: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const EMPTY_FEE_FORM = {
  feeType: '',
  department: '',
  className: '',
  amount: '',
  description: '',
};

const EMPTY_PAYMENT_FORM = {
  studentName: '',
  studentRoll: '',
  department: '',
  className: '',
  feeType: '',
  amount: '',
  month: '',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminFee() {
  const { departments } = useAppStore();
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const locale = language === 'bn' ? 'bn-BD' : language;
  const [feeConfigs, setFeeConfigs] = useState<FeeConfig[]>([]);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [activeTab, setActiveTab] = useState<'configs' | 'payments'>('configs');
  const [statusFilter, setStatusFilter] = useState('all');

  /* Fee Config Dialog */
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<FeeConfig | null>(null);
  const [feeForm, setFeeForm] = useState(EMPTY_FEE_FORM);
  const [feeSubmitting, setFeeSubmitting] = useState(false);

  /* Payment Dialog */
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState(EMPTY_PAYMENT_FORM);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  /* Delete */
  const [deleteTarget, setDeleteTarget] = useState<FeeConfig | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* Subscribe */
  useEffect(() => {
    const unsubConfigs = dbSubscribe('/feeConfigs', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list: FeeConfig[] = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        }));
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setFeeConfigs(list);
      } else {
        setFeeConfigs([]);
      }
    });

    const unsubPayments = dbSubscribe('/feePayments', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list: FeePayment[] = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        }));
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setPayments(list);
      } else {
        setPayments([]);
      }
    });

    return () => { unsubConfigs(); unsubPayments(); };
  }, []);

  /* Filtered payments */
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => statusFilter === 'all' || p.status === statusFilter);
  }, [payments, statusFilter]);

  /* Fee Config handlers */
  const resetAndOpenConfig = useCallback(() => {
    setEditingConfig(null);
    setFeeForm(EMPTY_FEE_FORM);
    setConfigDialogOpen(true);
  }, []);

  const openEditConfig = useCallback((config: FeeConfig) => {
    setEditingConfig(config);
    setFeeForm({
      feeType: config.feeType,
      department: config.department,
      className: config.className,
      amount: String(config.amount),
      description: config.description,
    });
    setConfigDialogOpen(true);
  }, []);

  const handleSubmitConfig = async () => {
    if (!feeForm.feeType.trim() || !feeForm.amount) {
      toast({ title: t('common.error'), description: t('adminFee.typeAmountRequired'), variant: 'destructive' });
      return;
    }

    setFeeSubmitting(true);
    try {
      const payload = {
        feeType: feeForm.feeType.trim(),
        department: feeForm.department.trim(),
        className: feeForm.className.trim(),
        amount: Number(feeForm.amount) || 0,
        description: feeForm.description.trim(),
      };

      if (editingConfig) {
        await dbUpdate('/feeConfigs/' + editingConfig.id, payload);
        toast({ title: t('common.success'), description: t('adminFee.configUpdated') });
      } else {
        await dbPush('/feeConfigs', { ...payload, createdAt: Date.now() });
        toast({ title: t('common.success'), description: t('adminFee.configCreated') });
      }
      setConfigDialogOpen(false);
      setFeeForm(EMPTY_FEE_FORM);
      setEditingConfig(null);
    } catch {
      toast({ title: t('common.error'), description: t('common.operationFailed'), variant: 'destructive' });
    } finally {
      setFeeSubmitting(false);
    }
  };

  const handleDeleteConfig = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await dbRemove('/feeConfigs/' + deleteTarget.id);
      toast({ title: t('common.success'), description: t('adminFee.configDeleted') });
      setDeleteTarget(null);
    } catch {
      toast({ title: t('common.error'), description: t('common.deleteFailed'), variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  /* Payment handlers */
  const openPaymentDialog = () => {
    setPaymentForm(EMPTY_PAYMENT_FORM);
    setPaymentDialogOpen(true);
  };

  const handleAddPayment = async () => {
    if (!paymentForm.studentName.trim() || !paymentForm.amount) {
      toast({ title: t('common.error'), description: t('adminFee.nameAmountRequired'), variant: 'destructive' });
      return;
    }

    setPaymentSubmitting(true);
    try {
      await dbPush('/feePayments', {
        studentName: paymentForm.studentName.trim(),
        studentRoll: paymentForm.studentRoll.trim(),
        department: paymentForm.department.trim(),
        className: paymentForm.className.trim(),
        feeType: paymentForm.feeType.trim(),
        amount: Number(paymentForm.amount) || 0,
        status: 'paid',
        paidAmount: Number(paymentForm.amount) || 0,
        paidDate: new Date().toISOString().split('T')[0],
        month: paymentForm.month,
        createdAt: Date.now(),
      });
      toast({ title: t('common.success'), description: t('adminFee.paymentCreated') });
      setPaymentDialogOpen(false);
      setPaymentForm(EMPTY_PAYMENT_FORM);
    } catch {
      toast({ title: t('common.error'), description: t('common.operationFailed'), variant: 'destructive' });
    } finally {
      setPaymentSubmitting(false);
    }
  };

  /* Mark as paid */
  const markAsPaid = async (payment: FeePayment) => {
    try {
      await dbUpdate('/feePayments/' + payment.id, {
        status: 'paid',
        paidAmount: payment.amount,
        paidDate: new Date().toISOString().split('T')[0],
      });
      toast({ title: t('common.success'), description: t('adminFee.markedPaid') });
    } catch {
      toast({ title: t('common.error'), description: t('adminFee.updateFailed'), variant: 'destructive' });
    }
  };

  /* Summary stats */
  const totalCollected = useMemo(() => payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + (p.paidAmount || 0), 0), [payments]);
  const totalPending = useMemo(() => payments.filter((p) => p.status === 'unpaid').reduce((sum, p) => sum + p.amount, 0), [payments]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-islamic-dark">{t('adminFee.title')}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t('adminFee.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'configs' ? 'default' : 'outline'}
            onClick={() => setActiveTab('configs')}
            className={`gap-2 cursor-pointer ${activeTab === 'configs' ? 'bg-islamic hover:bg-islamic-light text-white' : ''}`}
          >
            {t('adminFee.feeConfig')}
          </Button>
          <Button
            variant={activeTab === 'payments' ? 'default' : 'outline'}
            onClick={() => setActiveTab('payments')}
            className={`gap-2 cursor-pointer ${activeTab === 'payments' ? 'bg-islamic hover:bg-islamic-light text-white' : ''}`}
          >
            {t('adminFee.paymentsTab')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">৳{totalCollected.toLocaleString(locale)}</p>
            <p className="text-xs text-muted-foreground">{t('adminFee.collected')}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">৳{totalPending.toLocaleString(locale)}</p>
            <p className="text-xs text-muted-foreground">{t('adminFee.unpaid')}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-islamic-dark">{feeConfigs.length}</p>
            <p className="text-xs text-muted-foreground">{t('adminFee.feeConfig')}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-islamic-dark">{payments.length}</p>
            <p className="text-xs text-muted-foreground">{t('adminFee.totalPayments')}</p>
          </CardContent>
        </Card>
      </div>

      {activeTab === 'configs' ? (
        <>
          {/* Fee Configs Table */}
          <Card className="shadow-sm hidden md:block">
            <CardContent className="p-0">
              {feeConfigs.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminFee.feeType')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminFee.department')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminFee.class')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground text-right">{t('common.amount')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground text-right">{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feeConfigs.map((config) => (
                        <TableRow key={config.id}>
                          <TableCell className="font-medium text-sm text-islamic-dark py-3">{config.feeType}</TableCell>
                          <TableCell className="text-sm py-3 text-muted-foreground">{config.department || t('common.all')}</TableCell>
                          <TableCell className="text-sm py-3 text-muted-foreground">{config.className || t('common.all')}</TableCell>
                          <TableCell className="text-sm py-3 text-right font-semibold">৳{config.amount.toLocaleString(locale)}</TableCell>
                          <TableCell className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-islamic cursor-pointer" onClick={() => openEditConfig(config)}>
                                <Pencil className="size-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-red-600 cursor-pointer" onClick={() => setDeleteTarget(config)}>
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
                  <DollarSign className="size-12 opacity-20 mb-3" />
                  <p className="text-sm">{t('adminFee.noConfigs')}</p>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Fee Configs Mobile Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
            {feeConfigs.length > 0 ? feeConfigs.map((config) => (
              <Card key={config.id} className="shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm truncate">{config.feeType}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{config.department || t('common.all')} • {config.className || t('common.all')}</p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => openEditConfig(config)}><Pencil className="size-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => setDeleteTarget(config)}><Trash2 className="size-3.5" /></Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">৳{config.amount.toLocaleString(locale)}</span>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                <DollarSign className="size-10 opacity-20 mb-2" />
                <p className="text-sm">{t('adminFee.noConfigs')}</p>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button onClick={resetAndOpenConfig} className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer">
              <Plus className="size-4" />
              {t('adminFee.addConfig')}
            </Button>
          </div>
        </>
      ) : (
        <>
          {/* Status Filter */}
          <div className="flex gap-2">
            {['all', 'paid', 'unpaid', 'partial'].map((status) => (
              <Button
                key={status}
                size="sm"
                variant={statusFilter === status ? 'default' : 'outline'}
                onClick={() => setStatusFilter(status)}
                className={`text-xs cursor-pointer ${statusFilter === status ? 'bg-islamic hover:bg-islamic-light text-white' : ''}`}
              >
                {status === 'all' ? t('common.all') : status === 'paid' ? t('fee.paid') : status === 'unpaid' ? t('adminFee.unpaid') : t('adminFee.partial')}
              </Button>
            ))}
          </div>

          {/* Payments Table */}
          <Card className="shadow-sm hidden md:block">
            <CardContent className="p-0">
              {filteredPayments.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminFee.student')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminFee.feeType')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('common.month')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground text-right">{t('common.amount')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground text-center">{t('common.status')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground text-right">{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="py-3">
                            <p className="font-medium text-sm text-islamic-dark">{payment.studentName}</p>
                            <p className="text-xs text-muted-foreground">{t('exam.roll')} {payment.studentRoll || '—'}</p>
                          </TableCell>
                          <TableCell className="text-sm py-3 text-muted-foreground">{payment.feeType}</TableCell>
                          <TableCell className="text-sm py-3 text-muted-foreground">{payment.month || '—'}</TableCell>
                          <TableCell className="text-sm py-3 text-right font-semibold">৳{payment.amount.toLocaleString(locale)}</TableCell>
                          <TableCell className="py-3 text-center">
                            <Badge className={`text-xs ${
                              payment.status === 'paid' ? 'bg-green-100 text-green-700 border-green-200' :
                              payment.status === 'partial' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                              'bg-red-100 text-red-700 border-red-200'
                            }`}>
                              {payment.status === 'paid' ? t('fee.paid') : payment.status === 'partial' ? t('adminFee.partial') : t('adminFee.unpaid')}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 text-right">
                            {payment.status !== 'paid' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => markAsPaid(payment)}
                                className="text-xs gap-1 cursor-pointer text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="size-3" />
                                {t('fee.paid')}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <DollarSign className="size-12 opacity-20 mb-3" />
                  <p className="text-sm">{t('adminFee.noPayments')}</p>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Payments Mobile Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
            {filteredPayments.length > 0 ? filteredPayments.map((payment) => (
              <Card key={payment.id} className="shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm truncate">{payment.studentName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t('exam.roll')} {payment.studentRoll || '—'} • {payment.feeType}</p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {payment.status !== 'paid' && (
                        <Button variant="ghost" size="icon" className="size-7 text-green-600" onClick={() => markAsPaid(payment)}><CheckCircle className="size-3.5" /></Button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {payment.month && <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium">{payment.month}</span>}
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium">৳{payment.amount.toLocaleString(locale)}</span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      payment.status === 'paid' ? 'bg-green-100 text-green-700' :
                      payment.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>{payment.status === 'paid' ? t('fee.paid') : payment.status === 'partial' ? t('adminFee.partial') : t('adminFee.unpaid')}</span>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                <DollarSign className="size-10 opacity-20 mb-2" />
                <p className="text-sm">{t('adminFee.noPayments')}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={openPaymentDialog} className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer">
              <Plus className="size-4" />
              {t('adminFee.addPayment')}
            </Button>
          </div>
        </>
      )}

      {/* Fee Config Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={(open) => {
        setConfigDialogOpen(open);
        if (!open) { setEditingConfig(null); setFeeForm(EMPTY_FEE_FORM); }
      }}>
        <DialogContent className="sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-islamic-dark">
              {editingConfig ? t('adminFee.editConfig') : t('adminFee.addConfig')}
            </DialogTitle>
            <DialogDescription>
              {t('adminFee.configDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
                <Label htmlFor="fee-type">{t('adminFee.feeType')} *</Label>
              <Input
                id="fee-type"
                placeholder={t('adminFee.feeTypePlaceholder')}
                value={feeForm.feeType}
                onChange={(e) => setFeeForm((f) => ({ ...f, feeType: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fee-dept">{t('adminFee.department')}</Label>
                <Select
                  value={feeForm.department}
                  onValueChange={(value) => {
                    setFeeForm((f) => ({ ...f, department: value, className: '' }));
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('adminFee.selectDepartment')} />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fee-class">{t('adminFee.class')}</Label>
                {feeForm.department ? (() => {
                  const selectedDept = departments.find(d => d.name === feeForm.department);
                  const deptClasses = selectedDept?.classes || [];
                  if (deptClasses.length > 0) {
                    return (
                      <Select
                        value={feeForm.className}
                        onValueChange={(value) => setFeeForm((f) => ({ ...f, className: value }))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t('adminFee.selectClass')} />
                        </SelectTrigger>
                        <SelectContent>
                          {deptClasses.map((cls, idx) => (
                            <SelectItem key={idx} value={cls}>
                              {cls}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  }
                  return (
                    <Input
                      placeholder={t('adminFee.noClasses')}
                      value={feeForm.className}
                      onChange={(e) => setFeeForm((f) => ({ ...f, className: e.target.value }))}
                      disabled={!feeForm.department}
                    />
                  );
                })() : (
                  <Input
                    placeholder={t('adminFee.selectDeptFirst')}
                    value={feeForm.className}
                    onChange={(e) => setFeeForm((f) => ({ ...f, className: e.target.value }))}
                    disabled
                  />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fee-amount">{t('adminFee.amountTaka')} *</Label>
              <Input
                id="fee-amount"
                type="number"
                placeholder={t('common.amount')}
                value={feeForm.amount}
                onChange={(e) => setFeeForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fee-desc">{t('common.description')}</Label>
              <Textarea
                id="fee-desc"
                placeholder={t('adminFee.extraDescPlaceholder')}
                rows={2}
                value={feeForm.description}
                onChange={(e) => setFeeForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setConfigDialogOpen(false); setEditingConfig(null); setFeeForm(EMPTY_FEE_FORM); }}>{t('common.cancel')}</Button>
            <Button onClick={handleSubmitConfig} disabled={feeSubmitting} className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer">
              {feeSubmitting && <Loader2 className="size-4 animate-spin" />}
              {editingConfig ? t('common.update') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={(open) => setPaymentDialogOpen(open)}>
        <DialogContent className="sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-islamic-dark">{t('adminFee.addPayment')}</DialogTitle>
            <DialogDescription>{t('adminFee.addPaymentDesc')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pay-name">{t('adminFee.studentName')} *</Label>
                <Input id="pay-name" placeholder={t('adminFee.studentName')} value={paymentForm.studentName} onChange={(e) => setPaymentForm((f) => ({ ...f, studentName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pay-roll">{t('adminFee.rollNumber')}</Label>
                <Input id="pay-roll" placeholder={t('adminFee.roll')} value={paymentForm.studentRoll} onChange={(e) => setPaymentForm((f) => ({ ...f, studentRoll: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pay-dept">{t('adminFee.department')}</Label>
                <Select
                  value={paymentForm.department}
                  onValueChange={(value) => {
                    setPaymentForm((f) => ({ ...f, department: value, className: '' }));
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('adminFee.selectDepartment')} />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pay-class">{t('adminFee.class')}</Label>
                {paymentForm.department ? (() => {
                  const selectedDept = departments.find(d => d.name === paymentForm.department);
                  const deptClasses = selectedDept?.classes || [];
                  if (deptClasses.length > 0) {
                    return (
                      <Select
                        value={paymentForm.className}
                        onValueChange={(value) => setPaymentForm((f) => ({ ...f, className: value }))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t('adminFee.selectClass')} />
                        </SelectTrigger>
                        <SelectContent>
                          {deptClasses.map((cls, idx) => (
                            <SelectItem key={idx} value={cls}>
                              {cls}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  }
                  return (
                    <Input
                      placeholder={t('adminFee.noClasses')}
                      value={paymentForm.className}
                      onChange={(e) => setPaymentForm((f) => ({ ...f, className: e.target.value }))}
                      disabled={!paymentForm.department}
                    />
                  );
                })() : (
                  <Input
                    placeholder={t('adminFee.selectDeptFirst')}
                    value={paymentForm.className}
                    onChange={(e) => setPaymentForm((f) => ({ ...f, className: e.target.value }))}
                    disabled
                  />
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pay-type">{t('adminFee.feeType')}</Label>
                <Input id="pay-type" placeholder={t('adminFee.feeTypeExample')} value={paymentForm.feeType} onChange={(e) => setPaymentForm((f) => ({ ...f, feeType: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pay-amount">{t('adminFee.amountTaka')} *</Label>
                <Input id="pay-amount" type="number" placeholder={t('common.amount')} value={paymentForm.amount} onChange={(e) => setPaymentForm((f) => ({ ...f, amount: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-month">{t('common.month')}</Label>
              <Input id="pay-month" placeholder={t('adminFee.monthExample')} value={paymentForm.month} onChange={(e) => setPaymentForm((f) => ({ ...f, month: e.target.value }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleAddPayment} disabled={paymentSubmitting} className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer">
              {paymentSubmitting && <Loader2 className="size-4 animate-spin" />}
              {t('common.save')}
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
              {t('adminFee.deleteConfigDesc', { feeType: deleteTarget?.feeType || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfig} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white gap-2 cursor-pointer">
              {deleting && <Loader2 className="size-4 animate-spin" />}
              {t('common.confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
