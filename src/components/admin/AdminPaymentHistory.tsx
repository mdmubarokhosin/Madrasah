'use client';

import { useState, useMemo } from 'react';
import { CreditCard, Search, Filter, Download, CheckCircle, XCircle, Clock, AlertCircle, Loader2, Trash2, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { dbUpdate } from '@/lib/db-service';
import type { PaymentRecord } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const statusConfig: Record<string, { labelKey: string; icon: React.ReactNode; className: string }> = {
  success: {
    labelKey: 'adminPaymentHistory.statusSuccess',
    icon: <CheckCircle className="size-3.5" />,
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  failed: {
    labelKey: 'adminPaymentHistory.statusFailed',
    icon: <XCircle className="size-3.5" />,
    className: 'bg-red-100 text-red-700 border-red-200',
  },
  cancel: {
    labelKey: 'adminPaymentHistory.statusCancelled',
    icon: <AlertCircle className="size-3.5" />,
    className: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  pending: {
    labelKey: 'adminPaymentHistory.statusPending',
    icon: <Clock className="size-3.5" />,
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatNumber(num: number, locale: string): string {
  return num.toLocaleString(locale);
}

function formatDate(timestamp: number, locale: string): string {
  try {
    return new Date(timestamp).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function formatAmount(amount: number, locale: string): string {
  return `৳${formatNumber(amount, locale)}`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminPaymentHistory() {
  const { payments } = useAppStore();
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const locale = language === 'bn' ? 'bn-BD' : language;

  /* Translated display label for a payment status (DB value stays unchanged) */
  const statusLabel = (status: string) => statusConfig[status]?.labelKey
    ? t(statusConfig[status].labelKey)
    : status;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updating, setUpdating] = useState<string | null>(null);

  /* Stats */
  const stats = useMemo(() => {
    const total = payments.length;
    const successful = payments.filter((p) => p.status === 'success');
    const totalAmount = successful.reduce((sum, p) => sum + (p.amount || 0), 0);
    const pending = payments.filter((p) => p.status === 'pending').length;
    return { total, successfulCount: successful.length, totalAmount, pending };
  }, [payments]);

  /* Filtered list */
  const filtered = useMemo(() => {
    let list = payments;

    if (statusFilter !== 'all') {
      list = list.filter((p) => p.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          (p.full_name || '').toLowerCase().includes(q) ||
          (p.email || '').toLowerCase().includes(q) ||
          (p.phone || '').toLowerCase().includes(q) ||
          (p.paymentkey || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [payments, search, statusFilter]);

  /* Export CSV */
  const handleExportCSV = () => {
    const headers = [t('common.name'), t('common.email'), t('common.phone'), t('common.amount'), 'Payment Key', 'Status', t('common.date')];
    const rows = payments.map((p) => [
      p.full_name || '',
      p.email || '',
      p.phone || '',
      p.amount || 0,
      p.paymentkey || '',
      p.status || '',
      p.createdAt ? new Date(p.createdAt).toISOString() : '',
    ]);
    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payment-history-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: t('common.success'), description: t('adminPaymentHistory.csvDownloading') });
  };

  /* Update status manually */
  const handleUpdateStatus = async (payment: PaymentRecord, newStatus: string) => {
    setUpdating(payment.id);
    try {
      await dbUpdate(`/payments/${payment.id}`, {
        status: newStatus,
        updatedAt: Date.now(),
      });
      toast({
        title: t('common.success'),
        description: t('adminPaymentHistory.statusSetTo', { status: statusLabel(newStatus) }),
      });
    } catch {
      toast({ title: t('common.error'), description: t('adminPaymentHistory.updateFailed'), variant: 'destructive' });
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-islamic-dark">{t('adminPaymentHistory.title')}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t('adminPaymentHistory.subtitle')}
          </p>
        </div>
        <Button
          onClick={handleExportCSV}
          disabled={payments.length === 0}
          variant="outline"
          className="gap-2 cursor-pointer"
        >
          <Download className="size-4" />
          {t('adminPaymentHistory.downloadCsv')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">{t('adminPaymentHistory.totalPayments')}</p>
            <p className="text-2xl font-bold text-islamic-dark">{formatNumber(stats.total, locale)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">{t('adminPaymentHistory.successfulPayments')}</p>
            <p className="text-2xl font-bold text-emerald-600">{formatNumber(stats.successfulCount, locale)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">{t('adminPaymentHistory.totalCollected')}</p>
            <p className="text-2xl font-bold text-islamic">{formatAmount(stats.totalAmount, locale)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">{t('adminPaymentHistory.statusPending')}</p>
            <p className="text-2xl font-bold text-yellow-600">{formatNumber(stats.pending, locale)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('adminPaymentHistory.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'success', 'pending', 'failed', 'cancel'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className={`text-xs gap-1 cursor-pointer ${
                statusFilter === status ? 'bg-islamic hover:bg-islamic-light' : ''
              }`}
            >
              {status === 'all' ? t('common.all') : statusLabel(status)}
            </Button>
          ))}
        </div>
      </div>

      {/* Payment List */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((payment) => {
            const config = statusConfig[payment.status] || statusConfig.pending;
            return (
              <Card key={payment.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="size-4 text-islamic shrink-0" />
                        <span className="text-sm font-semibold text-islamic-dark truncate">
                          {payment.full_name || t('adminPaymentHistory.unknown')}
                        </span>
                        <Badge className={`${config.className} text-xs gap-1`}>
                          {config.icon}
                          {statusLabel(payment.status)}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {payment.email && <span>{t('common.email')}: {payment.email}</span>}
                        {payment.phone && <span>{t('common.phone')}: {payment.phone}</span>}
                        <span className="font-semibold text-islamic-dark">
                          {formatAmount(payment.amount || 0, locale)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                        {payment.paymentkey && (
                          <span className="font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">
                            Key: {payment.paymentkey.substring(0, 20)}...
                          </span>
                        )}
                        <span>{formatDate(payment.createdAt, locale)}</span>
                        {payment.updatedAt && (
                          <span className="text-muted-foreground">
                            {t('prayer.updated')} {formatDate(payment.updatedAt, locale)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions for pending payments */}
                    {payment.status === 'pending' && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                          onClick={() => handleUpdateStatus(payment, 'success')}
                          disabled={updating === payment.id}
                          title={t('adminPaymentHistory.markAsSuccess')}
                        >
                          {updating === payment.id ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-8 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                          onClick={() => handleUpdateStatus(payment, 'failed')}
                          disabled={updating === payment.id}
                          title={t('adminPaymentHistory.markAsFailed')}
                        >
                          <XCircle className="size-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <CreditCard className="size-12 opacity-20 mb-3" />
            <p className="text-sm">
              {search || statusFilter !== 'all'
                ? t('adminPaymentHistory.noMatch')
                : t('adminPaymentHistory.noRecords')}
            </p>
            <p className="text-xs mt-1">
              {search || statusFilter !== 'all'
                ? t('adminPaymentHistory.tryOtherSearch')
                : t('adminPaymentHistory.emptyHint')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
