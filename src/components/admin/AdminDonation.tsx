'use client';

import { useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Heart, Loader2, CreditCard, DollarSign, Wallet, Search, Eye } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { dbPush, dbUpdate, dbRemove, dbSet } from '@/lib/db-service';
import { toML, loc, type MLValue } from '@/lib/multilingual';
import { MLInput, MLTextarea } from '@/components/admin/MLFields';
import type { DonationFund, PaymentMethod, PaymentRecord } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const FUND_TYPE_VALUES = ['লিল্লাহ', 'ছাত্র সহায়তা', 'নির্মাণ', 'লাইব্রেরি'];

const FUND_TYPE_LABEL_KEYS: Record<string, string> = {
  'লিল্লাহ': 'adminDonation.typeLillah',
  'ছাত্র সহায়তা': 'adminDonation.typeStudentSupport',
  'নির্মাণ': 'adminDonation.typeConstruction',
  'লাইব্রেরি': 'adminDonation.typeLibrary',
};

const FUND_TYPE_COLORS: Record<string, string> = {
  'লিল্লাহ': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'ছাত্র সহায়তা': 'bg-islamic-lighter text-islamic-dark border-islamic/20',
  'নির্মাণ': 'bg-amber-50 text-amber-700 border-amber-200',
  'লাইব্রেরি': 'bg-purple-50 text-purple-700 border-purple-200',
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  'PENDING': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'COMPLETED': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'EXECUTED': 'bg-blue-100 text-blue-700 border-blue-200',
  'CANCELLED': 'bg-red-100 text-red-700 border-red-200',
};

const EMPTY_FUND_FORM = {
  title: { bn: '', en: '', ar: '' } as MLValue,
  description: { bn: '', en: '', ar: '' } as MLValue,
  collected: 0,
  target: 0,
  type: '',
};

const EMPTY_PAYMENT_FORM = {
  name: '',
  number: '',
  type: 'bKash',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminDonation() {
  const { donations, paymentMethods, payments: paymentRecords, bohudurConfig } = useAppStore();
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const locale = language === 'bn' ? 'bn-BD' : language;

  /* Translated display labels for enum values (DB values stay unchanged) */
  const fundTypeLabel = (type: string) => {
    const key = FUND_TYPE_LABEL_KEYS[type];
    return key ? t(key) : type;
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return t('adminDonation.statusPending');
      case 'COMPLETED': return t('adminDonation.statusCompleted');
      case 'EXECUTED': return t('adminDonation.statusExecuted');
      case 'CANCELLED': return t('adminDonation.statusCancelled');
      default: return status;
    }
  };

  /* Fund dialog state */
  const [fundDialogOpen, setFundDialogOpen] = useState(false);
  const [editingFund, setEditingFund] = useState<DonationFund | null>(null);
  const [fundForm, setFundForm] = useState(EMPTY_FUND_FORM);
  const [submittingFund, setSubmittingFund] = useState(false);

  /* Payment method dialog state */
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentMethod | null>(null);
  const [paymentForm, setPaymentForm] = useState(EMPTY_PAYMENT_FORM);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  /* Delete confirmation */
  const [deleteTarget, setDeleteTarget] = useState<DonationFund | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deletePaymentTarget, setDeletePaymentTarget] = useState<number | null>(null);
  const [deletingPayment, setDeletingPayment] = useState(false);

  /* Payment history state */
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [queryKey, setQueryKey] = useState('');
  const [queryingPayment, setQueryingPayment] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [paymentDetailOpen, setPaymentDetailOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);

  /* Fund helpers */
  const resetFundAndOpen = useCallback(() => {
    setEditingFund(null);
    setFundForm(EMPTY_FUND_FORM);
    setFundDialogOpen(true);
  }, []);

  const openEditFund = useCallback((item: DonationFund) => {
    setEditingFund(item);
    setFundForm({
      title: toML(item, 'title'),
      description: toML(item, 'description'),
      collected: item.collected,
      target: item.target,
      type: item.type,
    });
    setFundDialogOpen(true);
  }, []);

  /* Payment method helpers */
  const resetPaymentAndOpen = useCallback(() => {
    setEditingPayment(null);
    setPaymentForm(EMPTY_PAYMENT_FORM);
    setPaymentDialogOpen(true);
  }, []);

  const openEditPayment = useCallback((item: PaymentMethod, idx: number) => {
    setEditingPayment({ ...item, _idx: idx } as PaymentMethod & { _idx: number });
    setPaymentForm({
      name: item.name,
      number: item.number,
      type: item.type,
    });
    setPaymentDialogOpen(true);
  }, []);

  /* Submit fund handler */
  const handleFundSubmit = async () => {
    if (!fundForm.title.bn.trim() || !fundForm.type) {
      toast({ title: t('common.error'), description: t('adminDonation.titleTypeRequired'), variant: 'destructive' });
      return;
    }

    setSubmittingFund(true);
    try {
      const fundPayload = {
        title: fundForm.title.bn.trim(),
        titleEn: fundForm.title.en.trim(),
        titleAr: fundForm.title.ar.trim(),
        description: fundForm.description.bn.trim(),
        descriptionEn: fundForm.description.en.trim(),
        descriptionAr: fundForm.description.ar.trim(),
        collected: Number(fundForm.collected) || 0,
        target: Number(fundForm.target) || 0,
        type: fundForm.type,
      };
      if (editingFund) {
        await dbUpdate('/donations/' + editingFund.id, fundPayload);
        toast({ title: t('common.success'), description: t('adminDonation.fundUpdated') });
      } else {
        await dbPush('/donations', fundPayload);
        toast({ title: t('common.success'), description: t('adminDonation.fundCreated') });
      }
      setFundDialogOpen(false);
      setFundForm(EMPTY_FUND_FORM);
      setEditingFund(null);
    } catch {
      toast({ title: t('common.error'), description: t('common.operationFailed'), variant: 'destructive' });
    } finally {
      setSubmittingFund(false);
    }
  };

  /* Submit payment handler */
  const handlePaymentSubmit = async () => {
    if (!paymentForm.name.trim() || !paymentForm.number.trim()) {
      toast({ title: t('common.error'), description: t('adminDonation.nameNumberRequired'), variant: 'destructive' });
      return;
    }

    setSubmittingPayment(true);
    try {
      const newMethod: PaymentMethod = {
        name: paymentForm.name.trim(),
        number: paymentForm.number.trim(),
        type: paymentForm.type,
      };

      const updated = [...paymentMethods];

      if (editingPayment && '_idx' in editingPayment) {
        const idx = (editingPayment as PaymentMethod & { _idx: number })._idx;
        updated[idx] = newMethod;
      } else {
        updated.push(newMethod);
      }

      await dbSet('/config/paymentMethods', updated);
      toast({ title: t('common.success'), description: t('adminDonation.paymentMethodSaved') });
      setPaymentDialogOpen(false);
      setPaymentForm(EMPTY_PAYMENT_FORM);
      setEditingPayment(null);
    } catch {
      toast({ title: t('common.error'), description: t('common.operationFailed'), variant: 'destructive' });
    } finally {
      setSubmittingPayment(false);
    }
  };

  /* Delete fund handler */
  const handleDeleteFund = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await dbRemove('/donations/' + deleteTarget.id);
      toast({ title: t('common.success'), description: t('adminDonation.fundDeleted') });
      setDeleteTarget(null);
    } catch {
      toast({ title: t('common.error'), description: t('common.deleteFailed'), variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  /* Delete payment handler */
  const handleDeletePayment = async () => {
    if (deletePaymentTarget === null) return;
    setDeletingPayment(true);
    try {
      const updated = paymentMethods.filter((_, i) => i !== deletePaymentTarget);
      await dbSet('/config/paymentMethods', updated);
      toast({ title: t('common.success'), description: t('adminDonation.paymentMethodDeleted') });
      setDeletePaymentTarget(null);
    } catch {
      toast({ title: t('common.error'), description: t('common.deleteFailed'), variant: 'destructive' });
    } finally {
      setDeletingPayment(false);
    }
  };

  /* Query payment status from Bohudur */
  const handleQueryPayment = async () => {
    if (!queryKey.trim()) {
      toast({ title: t('common.error'), description: t('adminDonation.enterPaymentKey'), variant: 'destructive' });
      return;
    }
    if (!bohudurConfig?.apiKey) {
      toast({ title: t('common.error'), description: t('adminDonation.apiKeyMissing'), variant: 'destructive' });
      return;
    }

    setQueryingPayment(true);
    setQueryResult(null);
    try {
      // Try CF Function proxy first, then direct API
      let data: any;
      try {
        const response = await fetch('/api/bohudur/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey: bohudurConfig.apiKey,
            paymentkey: queryKey.trim(),
          }),
        });
        data = await response.json();
      } catch {
        // Fallback: direct API call
        const response = await fetch(`https://request.bohudur.one/payment/v2/${queryKey.trim()}`, {
          method: 'GET',
          headers: { 'AH-BOHUDUR-API-KEY': bohudurConfig.apiKey },
        });
        data = await response.json();
      }

      if (data.success) {
        setQueryResult(data.data);
        
        // Update local record if found
        if (data.data?.status && data.data?.status !== 'PENDING') {
          const record = paymentRecords.find((r) => r.paymentkey === queryKey.trim());
          if (record) {
            await dbUpdate('/payments/' + record.id, {
              status: data.data.status,
              payment_time: data.data.payment_time || 'NONE',
              converted_amount: data.data.converted_amount || 0,
              total_amount: data.data.total_amount || 0,
              transaction_fee: data.data.transaction_fee || 0,
              payment_info: data.data.payment_info || {},
              default_currency: data.data.default_currency || '',
              payment_currency: data.data.payment_currency || '',
            });
            toast({ title: t('adminDonation.updatedToast'), description: t('adminDonation.paymentStatusLabel', { status: statusLabel(data.data.status) }) });
          }
        }
      } else {
        toast({ title: t('common.error'), description: t('adminDonation.queryFailed'), variant: 'destructive' });
      }
    } catch {
      toast({ title: t('common.error'), description: t('adminDonation.networkError'), variant: 'destructive' });
    } finally {
      setQueryingPayment(false);
    }
  };

  /* Filtered payment records */
  const filteredRecords = paymentRecords.filter((record) => {
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesSearch = !searchQuery || 
      (record.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (record.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (record.paymentkey || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (record.fund_title || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-islamic-dark">{t('adminDonation.title')}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t('adminDonation.subtitleCount', { funds: donations.length, payments: paymentRecords.length })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={resetPaymentAndOpen}
            className="gap-2 border-golden text-golden hover:bg-golden-lighter cursor-pointer"
          >
            <Wallet className="size-4" />
            {t('adminDonation.paymentMethod')}
          </Button>
          <Button
            onClick={resetFundAndOpen}
            className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
          >
            <Plus className="size-4" />
            {t('adminDonation.newFund')}
          </Button>
        </div>
      </div>

      {/* Tabbed Layout */}
      <Tabs defaultValue="funds" className="space-y-4">
        <TabsList className="bg-gray-100 p-1 rounded-lg h-auto">
          <TabsTrigger value="funds" className="gap-1.5 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Heart className="size-4" />
            {t('adminDonation.fundsTab')}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <DollarSign className="size-4" />
            {t('payment.history')}
            {paymentRecords.length > 0 && (
              <Badge className="bg-islamic text-white text-xs ml-1 border-0 px-1.5">{paymentRecords.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="query" className="gap-1.5 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Search className="size-4" />
            {t('adminDonation.query')}
          </TabsTrigger>
        </TabsList>

        {/* ========== Funds Tab ========== */}
        <TabsContent value="funds">
          <div className="space-y-6">
            {/* Fund Cards Grid */}
            {donations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {donations.map((item) => {
                  const percentage = item.target > 0 ? Math.min((item.collected / item.target) * 100, 100) : 0;
                  return (
                    <Card key={item.id} className="shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <Badge
                              variant="outline"
                              className={`text-xs ${FUND_TYPE_COLORS[item.type] || 'bg-gray-50 text-gray-600'}`}
                            >
                              {fundTypeLabel(item.type)}
                            </Badge>
                            <CardTitle className="text-base text-islamic-dark mt-1">{loc(language, item, 'title')}</CardTitle>
                            {item.titleAr && (
                              <p className="text-golden text-sm font-serif" dir="rtl">{item.titleAr}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-islamic cursor-pointer"
                              onClick={() => openEditFund(item)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-red-600 cursor-pointer"
                              onClick={() => setDeleteTarget(item)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {loc(language, item, 'description') && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{loc(language, item, 'description')}</p>
                        )}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{t('adminDonation.collected')}</span>
                            <span className="font-semibold text-islamic-dark">
                              ৳{item.collected.toLocaleString(locale)}
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{t('adminDonation.percentComplete', { percent: percentage.toFixed(1) })}</span>
                            <span>{t('adminDonation.targetAmount', { amount: item.target.toLocaleString(locale) })}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Heart className="size-12 opacity-20 mb-3" />
                  <p className="text-sm">{t('adminDonation.noFunds')}</p>
                  <p className="text-xs mt-1">{t('adminDonation.noFundsHint')}</p>
                </CardContent>
              </Card>
            )}

            {/* Payment Methods Section */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="size-5 text-golden" />
                    <CardTitle className="text-lg text-islamic-dark">{t('adminDonation.paymentMethodsManual')}</CardTitle>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetPaymentAndOpen}
                    className="gap-1.5 text-xs cursor-pointer"
                  >
                    <Plus className="size-3" />
                    {t('common.add')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {paymentMethods.length > 0 ? (
                  <div className="space-y-2">
                    {paymentMethods.map((pm, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg border bg-gray-50/50 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold ${
                            pm.type === 'bKash' ? 'bg-pink-100 text-pink-700' :
                            pm.type === 'Nagad' ? 'bg-orange-100 text-orange-700' :
                            'bg-islamic-lighter text-islamic-dark'
                          }`}>
                            {pm.type === 'bKash' ? t('adminDonation.initialBkash') : pm.type === 'Nagad' ? t('adminDonation.initialNagad') : t('adminDonation.initialBank')}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-islamic-dark">{pm.name}</p>
                            <p className="text-xs text-muted-foreground">{pm.number}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-islamic cursor-pointer"
                            onClick={() => openEditPayment(pm, idx)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-red-600 cursor-pointer"
                            onClick={() => setDeletePaymentTarget(idx)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Wallet className="size-8 opacity-20 mb-2" />
                    <p className="text-sm">{t('adminDonation.noPaymentMethods')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ========== Payment History Tab ========== */}
        <TabsContent value="history">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg text-islamic-dark flex items-center gap-2">
                    <DollarSign className="size-5 text-golden" />
                    {t('payment.history')}
                  </CardTitle>
                  <CardDescription>
                    {t('adminDonation.historyDesc')}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder={t('adminDonation.searchPlaceholder')}
                    className="w-full sm:w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder={t('common.status')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('common.all')}</SelectItem>
                      <SelectItem value="PENDING">{statusLabel('PENDING')}</SelectItem>
                      <SelectItem value="COMPLETED">{statusLabel('COMPLETED')}</SelectItem>
                      <SelectItem value="EXECUTED">{statusLabel('EXECUTED')}</SelectItem>
                      <SelectItem value="CANCELLED">{statusLabel('CANCELLED')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredRecords.length > 0 ? (
                <div className="space-y-2">
                  {/* Table Header */}
                  <div className="hidden sm:grid grid-cols-12 gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground bg-gray-50 rounded-lg">
                    <div className="col-span-3">{t('adminDonation.donor')}</div>
                    <div className="col-span-2">{t('common.amount')}</div>
                    <div className="col-span-2">{t('adminDonation.fund')}</div>
                    <div className="col-span-2">{t('common.date')}</div>
                    <div className="col-span-2">{t('common.status')}</div>
                    <div className="col-span-1"></div>
                  </div>
                  {filteredRecords.map((record) => (
                    <div
                      key={record.id}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-2 px-3 py-3 rounded-lg border hover:bg-gray-50 transition-colors items-center"
                    >
                      <div className="sm:col-span-3 min-w-0">
                        <p className="text-sm font-medium text-islamic-dark truncate">{record.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{record.email}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-sm font-semibold text-islamic-dark">
                          {record.default_currency === 'USD' ? '$' : '৳'}{record.amount.toLocaleString(locale)}
                        </p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-xs text-muted-foreground truncate">
                          {record.fund_title || t('payment.generalDonation')}
                        </p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-xs text-muted-foreground">
                          {record.created_time
                            ? new Date(record.created_time).toLocaleDateString(locale)
                            : '-'}
                        </p>
                      </div>
                      <div className="sm:col-span-2">
                        <Badge variant="outline" className={`text-xs ${PAYMENT_STATUS_COLORS[record.status] || 'bg-gray-100 text-gray-600'}`}>
                          {statusLabel(record.status)}
                        </Badge>
                      </div>
                      <div className="sm:col-span-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-islamic cursor-pointer"
                          onClick={() => { setSelectedPayment(record); setPaymentDetailOpen(true); }}
                        >
                          <Eye className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <DollarSign className="size-10 opacity-20 mb-2" />
                  <p className="text-sm">
                    {paymentRecords.length === 0 ? t('adminDonation.noPaymentRecords') : t('adminDonation.noRecordsFound')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== Query Tab ========== */}
        <TabsContent value="query">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-islamic-dark flex items-center gap-2">
                <Search className="size-5 text-golden" />
                {t('adminDonation.queryTitle')}
              </CardTitle>
              <CardDescription>
                {t('adminDonation.queryDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input
                  placeholder={t('adminDonation.queryKeyPlaceholder')}
                  className="flex-1 font-mono text-sm"
                  value={queryKey}
                  onChange={(e) => setQueryKey(e.target.value)}
                />
                <Button
                  onClick={handleQueryPayment}
                  disabled={queryingPayment || !queryKey.trim()}
                  className="gap-2 cursor-pointer bg-islamic hover:bg-islamic-light text-white"
                >
                  {queryingPayment ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                  {t('adminDonation.query')}
                </Button>
              </div>

              {queryResult && (
                <div className="rounded-lg border bg-gray-50 p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-islamic-dark">{t('adminDonation.queryResult')}</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">{t('common.status')}</p>
                      <Badge variant="outline" className={`mt-1 ${PAYMENT_STATUS_COLORS[queryResult.status] || ''}`}>
                        {statusLabel(queryResult.status)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('common.name')}</p>
                      <p className="font-medium">{queryResult.full_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('common.email')}</p>
                      <p className="font-medium truncate">{queryResult.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('common.amount')}</p>
                      <p className="font-semibold">{queryResult.default_currency === 'USD' ? '$' : '৳'}{queryResult.amount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('adminDonation.converted')}</p>
                      <p className="font-medium">{queryResult.converted_amount} {queryResult.payment_currency}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('adminDonation.created')}</p>
                      <p className="font-medium">{queryResult.created_time}</p>
                    </div>
                    {queryResult.payment_time && queryResult.payment_time !== 'NONE' && (
                      <>
                        <div>
                          <p className="text-xs text-muted-foreground">{t('adminDonation.payment')}</p>
                          <p className="font-medium">{queryResult.payment_time}</p>
                        </div>
                        {queryResult.payment_info && typeof queryResult.payment_info === 'object' && 'm0' in queryResult.payment_info && (
                          <div>
                            <p className="text-xs text-muted-foreground">{t('adminDonation.processor')}</p>
                            <p className="font-medium">{String(queryResult.payment_info.m0)}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {queryResult.payment_info && typeof queryResult.payment_info === 'object' && 'tran_id' in queryResult.payment_info && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">Transaction ID</p>
                      <p className="font-mono text-sm">{String(queryResult.payment_info.tran_id)}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Fund Dialog */}
      <Dialog open={fundDialogOpen} onOpenChange={(open) => {
        setFundDialogOpen(open);
        if (!open) { setEditingFund(null); setFundForm(EMPTY_FUND_FORM); }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-islamic-dark">
              {editingFund ? t('adminDonation.editFund') : t('adminDonation.addFund')}
            </DialogTitle>
            <DialogDescription>
              {editingFund ? t('adminDonation.editFundDesc') : t('adminDonation.addFundDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <MLInput
              label={t('common.title')}
              required
              placeholder={t('adminDonation.fundTitlePlaceholder')}
              value={fundForm.title}
              onChange={(v) => setFundForm((f) => ({ ...f, title: v }))}
            />
            <div className="space-y-2">
              <Label>{t('common.type')} *</Label>
              <Select value={fundForm.type} onValueChange={(value) => setFundForm((f) => ({ ...f, type: value }))}>
                <SelectTrigger className="w-full"><SelectValue placeholder={t('adminDonation.selectType')} /></SelectTrigger>
                <SelectContent>
                  {FUND_TYPE_VALUES.map((value) => (<SelectItem key={value} value={value}>{fundTypeLabel(value)}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <MLTextarea
              label={t('common.description')}
              rows={2}
              placeholder={t('adminDonation.fundDescPlaceholder')}
              value={fundForm.description}
              onChange={(v) => setFundForm((f) => ({ ...f, description: v }))}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fund-collected">{t('adminDonation.collectedAmount')}</Label>
                <Input id="fund-collected" type="number" min="0" placeholder="0" value={fundForm.collected} onChange={(e) => setFundForm((f) => ({ ...f, collected: Number(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fund-target">{t('adminDonation.targetAmountLabel')}</Label>
                <Input id="fund-target" type="number" min="0" placeholder="0" value={fundForm.target} onChange={(e) => setFundForm((f) => ({ ...f, target: Number(e.target.value) || 0 }))} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setFundDialogOpen(false); setEditingFund(null); setFundForm(EMPTY_FUND_FORM); }}>{t('common.cancel')}</Button>
            <Button onClick={handleFundSubmit} disabled={submittingFund} className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer">
              {submittingFund && <Loader2 className="size-4 animate-spin" />}
              {editingFund ? t('common.update') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={(open) => {
        setPaymentDialogOpen(open);
        if (!open) { setEditingPayment(null); setPaymentForm(EMPTY_PAYMENT_FORM); }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-islamic-dark">
              {editingPayment ? t('adminDonation.editPaymentMethod') : t('adminDonation.addPaymentMethod')}
            </DialogTitle>
            <DialogDescription>{t('adminDonation.paymentMethodDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t('common.type')}</Label>
              <Select value={paymentForm.type} onValueChange={(value) => setPaymentForm((f) => ({ ...f, type: value }))}>
                <SelectTrigger className="w-full"><SelectValue placeholder={t('adminDonation.selectType')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bKash">bKash</SelectItem>
                  <SelectItem value="Nagad">Nagad</SelectItem>
                  <SelectItem value="Bank">Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-name">{t('common.name')} *</Label>
              <Input id="payment-name" placeholder={t('adminDonation.accountNamePlaceholder')} value={paymentForm.name} onChange={(e) => setPaymentForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-number">{t('adminDonation.numberLabel')} *</Label>
              <Input id="payment-number" placeholder={t('adminDonation.enterNumber')} value={paymentForm.number} onChange={(e) => setPaymentForm((f) => ({ ...f, number: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPaymentDialogOpen(false); setEditingPayment(null); setPaymentForm(EMPTY_PAYMENT_FORM); }}>{t('common.cancel')}</Button>
            <Button onClick={handlePaymentSubmit} disabled={submittingPayment} className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer">
              {submittingPayment && <Loader2 className="size-4 animate-spin" />}
              {editingPayment ? t('common.update') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Fund Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('adminDonation.deleteFundDesc', { title: deleteTarget?.title || '' })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFund} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white gap-2 cursor-pointer">
              {deleting && <Loader2 className="size-4 animate-spin" />}
              {t('common.confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Payment Confirmation */}
      <AlertDialog open={deletePaymentTarget !== null} onOpenChange={(open) => !open && setDeletePaymentTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('adminDonation.deletePaymentMethodDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePayment} disabled={deletingPayment} className="bg-red-600 hover:bg-red-700 text-white gap-2 cursor-pointer">
              {deletingPayment && <Loader2 className="size-4 animate-spin" />}
              {t('common.confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment Detail Dialog */}
      <Dialog open={paymentDetailOpen} onOpenChange={setPaymentDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-islamic-dark">{t('adminDonation.paymentDetails')}</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">{t('paymentCallback.donorName')}</p>
                  <p className="font-medium">{selectedPayment.full_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('common.email')}</p>
                  <p className="font-medium truncate">{selectedPayment.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('common.amount')}</p>
                  <p className="font-semibold">{selectedPayment.default_currency === 'USD' ? '$' : '৳'}{selectedPayment.amount}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('common.status')}</p>
                  <Badge variant="outline" className={`mt-1 ${PAYMENT_STATUS_COLORS[selectedPayment.status] || ''}`}>
                    {statusLabel(selectedPayment.status)}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('adminDonation.fund')}</p>
                  <p className="font-medium">{selectedPayment.fund_title || t('payment.generalDonation')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('adminDonation.createdTime')}</p>
                  <p className="font-medium">{selectedPayment.created_time}</p>
                </div>
                {selectedPayment.payment_time && selectedPayment.payment_time !== 'NONE' && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">{t('adminDonation.paymentTime')}</p>
                    <p className="font-medium">{selectedPayment.payment_time}</p>
                  </div>
                )}
                {selectedPayment.paymentkey && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Payment Key</p>
                    <p className="font-mono text-xs break-all bg-gray-50 p-2 rounded">{selectedPayment.paymentkey}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
