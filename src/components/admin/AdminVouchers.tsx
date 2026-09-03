'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, FileText, Loader2, Printer, Filter } from 'lucide-react';
import { dbPush, dbUpdate, dbRemove, dbSubscribe } from '@/lib/db-service';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/lib/i18n-context';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Voucher } from '@/types/database';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const VOUCHER_CATEGORIES = [
  'অনুদান', 'বেতন', 'পরিবহন', 'খাদ্য', 'বিদ্যুৎ', 'ভবন মেরামত',
  'অফিস সরবরাহ', 'প্রিন্টিং', 'ইন্টারনেট', 'শিক্ষা উপকরণ', 'অন্যান্য',
];

const VOUCHER_CATEGORY_LABEL_KEYS: Record<string, string> = {
  'অনুদান': 'adminVouchers.catDonation',
  'বেতন': 'adminVouchers.catSalary',
  'পরিবহন': 'adminVouchers.catTransport',
  'খাদ্য': 'adminVouchers.catFood',
  'বিদ্যুৎ': 'adminVouchers.catElectricity',
  'ভবন মেরামত': 'adminVouchers.catBuildingRepair',
  'অফিস সরবরাহ': 'adminVouchers.catOfficeSupplies',
  'প্রিন্টিং': 'adminVouchers.catPrinting',
  'ইন্টারনেট': 'adminVouchers.catInternet',
  'শিক্ষা উপকরণ': 'adminVouchers.catEducational',
  'অন্যান্য': 'adminVouchers.catOther',
};

const EMPTY_FORM = {
  type: 'receipt',
  title: '',
  description: '',
  amount: '',
  date: '',
  category: '',
  relatedTo: '',
  createdBy: 'admin',
};

/* ------------------------------------------------------------------ */
/*  Helper: Generate voucher number                                     */
/* ------------------------------------------------------------------ */

function generateVoucherNumber(): string {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
  return `VCH-${datePart}-${seq}`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminVouchers() {
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const locale = language === 'bn' ? 'bn-BD' : language;

  /* Translated display labels for enum values (DB values stay unchanged) */
  const categoryLabel = (cat: string) => {
    const key = VOUCHER_CATEGORY_LABEL_KEYS[cat];
    return key ? t(key) : cat;
  };
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  /* Dialog */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Voucher | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  /* Delete */
  const [deleteTarget, setDeleteTarget] = useState<Voucher | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* Subscribe */
  useEffect(() => {
    const unsub = dbSubscribe('/vouchers', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list: Voucher[] = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        }));
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setVouchers(list);
      } else {
        setVouchers([]);
      }
    });
    return () => unsub();
  }, []);

  /* Filtered */
  const filtered = useMemo(() => {
    return vouchers.filter((v) => {
      const typeMatch = typeFilter === 'all' || v.type === typeFilter;
      const fromMatch = !dateFrom || (v.date || '') >= dateFrom;
      const toMatch = !dateTo || (v.date || '') <= dateTo;
      return typeMatch && fromMatch && toMatch;
    });
  }, [vouchers, typeFilter, dateFrom, dateTo]);

  /* Summary */
  const totalReceipts = useMemo(() => vouchers.filter((v) => v.type === 'receipt').reduce((s, v) => s + (v.amount || 0), 0), [vouchers]);
  const totalPayments = useMemo(() => vouchers.filter((v) => v.type === 'payment').reduce((s, v) => s + (v.amount || 0), 0), [vouchers]);
  const netBalance = totalReceipts - totalPayments;

  /* Handlers */
  const resetAndOpen = useCallback(() => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((item: Voucher) => {
    setEditing(item);
    setForm({
      type: item.type || 'receipt',
      title: item.title || '',
      description: item.description || '',
      amount: String(item.amount || 0),
      date: item.date || '',
      category: item.category || '',
      relatedTo: item.relatedTo || '',
      createdBy: item.createdBy || 'admin',
    });
    setDialogOpen(true);
  }, []);

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.amount) {
      toast({ title: t('common.error'), description: t('adminVouchers.titleAmountRequired'), variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        type: form.type,
        title: form.title.trim(),
        description: form.description.trim(),
        amount: Number(form.amount) || 0,
        date: form.date || new Date().toISOString().split('T')[0],
        category: form.category,
        relatedTo: form.relatedTo.trim(),
        createdBy: form.createdBy.trim(),
      };
      if (editing) {
        await dbUpdate('/vouchers/' + editing.id, payload);
        toast({ title: t('common.success'), description: t('adminVouchers.voucherUpdated') });
      } else {
        await dbPush('/vouchers', { ...payload, voucherNumber: generateVoucherNumber(), createdAt: Date.now() });
        toast({ title: t('common.success'), description: t('adminVouchers.voucherCreated') });
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
      await dbRemove('/vouchers/' + deleteTarget.id);
      toast({ title: t('common.success'), description: t('adminVouchers.voucherDeleted') });
      setDeleteTarget(null);
    } catch {
      toast({ title: t('common.error'), description: t('common.deleteFailed'), variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const handlePrint = (voucher: Voucher) => {
    const typeLabels: Record<string, string> = {
      receipt: t('adminVouchers.receiptVoucher'),
      payment: t('adminVouchers.paymentVoucher'),
      journal: t('adminVouchers.journalVoucher'),
    };
    const typeBannerColor = voucher.type === 'receipt' ? '#166534' : voucher.type === 'payment' ? '#991b1b' : '#1e40af';
    const typeBannerBg = voucher.type === 'receipt' ? '#dcfce7' : voucher.type === 'payment' ? '#fee2e2' : '#dbeafe';
    const amountPrefix = voucher.type === 'receipt' ? '+' : '-';

    const htmlContent = `<!DOCTYPE html>
<html lang="${language}" dir="${language === 'ar' ? 'rtl' : 'ltr'}">
<head>
<meta charset="UTF-8">
<title>${typeLabels[voucher.type] || t('adminVouchers.voucherWord')} - ${voucher.voucherNumber}</title>
<link rel="stylesheet" href="https://cdnmx.pages.dev/assets/fonts/noto_serif_bengali/font.css">
<style>
  @page { size: A4; margin: 15mm; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Noto Serif Bengali', Arial, sans-serif !important; color: #1a1a1a; background: #ffffff; }
  .voucher-container { max-width: 650px; margin: 0 auto; border: 2px solid #333; padding: 0; }
  .voucher-header { background: ${typeBannerColor}; color: #ffffff; padding: 16px 24px; text-align: center; }
  .voucher-header h1 { font-size: 20px; font-weight: bold; margin-bottom: 2px; }
  .voucher-header p { font-size: 11px; opacity: 0.85; }
  .voucher-body { padding: 24px; }
  .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #d1d5db; font-size: 13px; }
  .info-row .label { color: #6b7280; }
  .info-row .value { font-weight: 600; color: #111827; text-align: right; }
  .amount-section { background: ${typeBannerBg}; border: 1px solid ${typeBannerColor}33; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center; }
  .amount-section .amount-label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
  .amount-section .amount-value { font-size: 28px; font-weight: 900; color: ${typeBannerColor}; }
  .amount-section .amount-words { font-size: 11px; color: #9ca3af; margin-top: 4px; }
  .description-section { margin: 16px 0; padding: 12px 16px; background: #f9fafb; border-radius: 6px; border-left: 3px solid ${typeBannerColor}; }
  .description-section .desc-title { font-size: 11px; color: #6b7280; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
  .description-section .desc-text { font-size: 13px; color: #374151; line-height: 1.6; }
  .signatures { display: flex; justify-content: space-between; margin-top: 32px; padding-top: 16px; border-top: 1px solid #d1d5db; }
  .sig-box { text-align: center; width: 45%; }
  .sig-box .sig-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 6px; font-size: 12px; color: #374151; }
  .sig-box .sig-label { font-size: 11px; color: #9ca3af; margin-top: 2px; }
  .footer-section { margin-top: 16px; padding: 8px 0; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 10px; color: #9ca3af; }
  .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 80px; color: #f3f4f6; font-weight: 900; pointer-events: none; z-index: -1; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <div class="watermark">${t('adminVouchers.voucherWord')}</div>
  <div class="voucher-container">
    <div class="voucher-header">
      <h1>${typeLabels[voucher.type] || t('adminVouchers.voucherWord')}</h1>
      <p>${voucher.voucherNumber || '—'}</p>
    </div>
    <div class="voucher-body">
      <div class="info-row">
        <span class="label">${t('adminVouchers.voucherNo')}</span>
        <span class="value">${voucher.voucherNumber || '—'}</span>
      </div>
      <div class="info-row">
        <span class="label">${t('common.date')}</span>
        <span class="value">${voucher.date || '—'}</span>
      </div>
      <div class="info-row">
        <span class="label">${t('common.type')}</span>
        <span class="value">${typeLabels[voucher.type] || voucher.type}</span>
      </div>
      <div class="info-row">
        <span class="label">${t('common.category')}</span>
        <span class="value">${voucher.category ? categoryLabel(voucher.category) : '—'}</span>
      </div>
      ${voucher.relatedTo ? `<div class="info-row">
        <span class="label">${t('adminVouchers.relatedTo')}</span>
        <span class="value">${voucher.relatedTo}</span>
      </div>` : ''}
      <div class="info-row" style="border-bottom:none;">
        <span class="label">${t('adminVouchers.createdBy')}</span>
        <span class="value">${voucher.createdBy || 'admin'}</span>
      </div>

      <div class="amount-section">
        <div class="amount-label">${t('adminVouchers.printAmount')}</div>
        <div class="amount-value">${amountPrefix}৳${(voucher.amount || 0).toLocaleString(locale)}</div>
      </div>

      ${voucher.description ? `<div class="description-section">
        <div class="desc-title">${t('adminVouchers.printDescription')}</div>
        <div class="desc-text">${voucher.description}</div>
      </div>` : ''}

      <div class="signatures">
        <div class="sig-box">
          <div class="sig-line">____________________</div>
          <div class="sig-label">${t('adminVouchers.preparedBy')}</div>
        </div>
        <div class="sig-box">
          <div class="sig-line">____________________</div>
          <div class="sig-label">${t('adminVouchers.approvedBy')}</div>
        </div>
      </div>
    </div>

    <div style="padding: 0 24px 16px;">
      <div class="footer-section">
        <span>${t('adminVouchers.computerGenerated')}</span>
        <span>${t('adminVouchers.printDate', { date: new Date().toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' }) })}</span>
      </div>
    </div>
  </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.onafterprint = () => printWindow.close();
        }, 500);
      };
    } else {
      toast({ title: t('common.error'), description: t('adminVouchers.popupBlocked'), variant: 'destructive' });
    }
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case 'receipt': return t('adminVouchers.typeReceipt');
      case 'payment': return t('adminVouchers.typePayment');
      case 'journal': return t('adminVouchers.typeJournal');
      default: return type;
    }
  };

  const typeColor = (type: string) => {
    switch (type) {
      case 'receipt': return 'bg-green-100 text-green-700 border-green-200';
      case 'payment': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-islamic-dark">{t('adminVouchers.title')}</h2>
          <p className="text-muted-foreground text-sm mt-1">{t('adminVouchers.subtitle')}</p>
        </div>
        <Button onClick={resetAndOpen} className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer">
          <Plus className="size-4" />
          {t('adminVouchers.addVoucher')}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">৳{totalReceipts.toLocaleString(locale)}</p>
            <p className="text-xs text-muted-foreground">{t('adminVouchers.totalReceipts')}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">৳{totalPayments.toLocaleString(locale)}</p>
            <p className="text-xs text-muted-foreground">{t('adminVouchers.totalPayments')}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>৳{netBalance.toLocaleString(locale)}</p>
            <p className="text-xs text-muted-foreground">{t('adminVouchers.netBalance')}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-islamic-dark">{vouchers.length}</p>
            <p className="text-xs text-muted-foreground">{t('adminVouchers.totalVouchers')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{t('common.type')}:</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'receipt', 'payment', 'journal'].map((type) => (
            <Button
              key={type}
              size="sm"
              variant={typeFilter === type ? 'default' : 'outline'}
              onClick={() => setTypeFilter(type)}
              className={`text-xs cursor-pointer ${typeFilter === type ? 'bg-islamic hover:bg-islamic-light text-white' : ''}`}
            >
              {type === 'all' ? t('common.all') : typeLabel(type)}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-36" placeholder={t('adminVouchers.from')} />
          <span className="text-muted-foreground">—</span>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-36" placeholder={t('adminVouchers.to')} />
        </div>
      </div>

      {/* Desktop Table + Mobile Cards */}
      {filtered.length > 0 ? (
        <>
          {/* Desktop Table - hidden on mobile */}
          <Card className="shadow-sm hidden md:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminVouchers.voucherNo')}</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground text-center">{t('common.type')}</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">{t('common.title')}</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">{t('common.category')}</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">{t('common.date')}</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground text-right">{t('common.amount')}</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground text-right">{t('common.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((voucher) => (
                      <TableRow key={voucher.id}>
                        <TableCell className="py-3">
                          <p className="font-mono text-xs font-semibold text-islamic-dark">{voucher.voucherNumber || '—'}</p>
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          <Badge className={`text-xs ${typeColor(voucher.type)}`}>
                            {typeLabel(voucher.type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3">
                          <p className="font-medium text-sm text-islamic-dark">{voucher.title}</p>
                          {voucher.description && <p className="text-xs text-muted-foreground truncate max-w-40">{voucher.description}</p>}
                        </TableCell>
                        <TableCell className="text-sm py-3 text-muted-foreground">{voucher.category ? categoryLabel(voucher.category) : '—'}</TableCell>
                        <TableCell className="text-sm py-3 text-muted-foreground">{voucher.date || '—'}</TableCell>
                        <TableCell className={`text-sm py-3 text-right font-semibold ${voucher.type === 'receipt' ? 'text-green-600' : 'text-red-600'}`}>
                          {voucher.type === 'receipt' ? '+' : '-'}৳{(voucher.amount || 0).toLocaleString(locale)}
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-islamic cursor-pointer" onClick={() => handlePrint(voucher)}>
                              <Printer className="size-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-islamic cursor-pointer" onClick={() => openEdit(voucher)}>
                              <Pencil className="size-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-red-600 cursor-pointer" onClick={() => setDeleteTarget(voucher)}>
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Cards - hidden on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
            {filtered.map((voucher) => (
              <Card key={voucher.id} className="shadow-sm border-gray-100">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-islamic-dark truncate">{voucher.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{voucher.voucherNumber || '—'}</p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-islamic cursor-pointer" onClick={() => handlePrint(voucher)}>
                        <Printer className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-islamic cursor-pointer" onClick={() => openEdit(voucher)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-red-600 cursor-pointer" onClick={() => setDeleteTarget(voucher)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className={`text-lg font-bold ${voucher.type === 'receipt' ? 'text-green-600' : 'text-red-600'}`}>
                      {voucher.type === 'receipt' ? '+' : '-'}৳{(voucher.amount || 0).toLocaleString(locale)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <Badge className={`text-[10px] ${typeColor(voucher.type)}`}>
                      {typeLabel(voucher.type)}
                    </Badge>
                      {voucher.category && (
                      <span className="inline-flex items-center rounded-full bg-islamic-lighter px-2 py-0.5 text-[10px] font-medium text-islamic-dark">
                        {categoryLabel(voucher.category)}
                      </span>
                    )}
                    {voucher.date && (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                        {voucher.date}
                      </span>
                    )}
                  </div>
                  {voucher.description && (
                    <p className="text-[10px] text-muted-foreground mt-2 line-clamp-2">{voucher.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FileText className="size-12 opacity-20 mb-3" />
              <p className="text-sm">{t('adminVouchers.noVouchers')}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) { setEditing(null); setForm(EMPTY_FORM); }
      }}>
        <DialogContent className="sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-islamic-dark">
              {editing ? t('adminVouchers.editVoucher') : t('adminVouchers.addVoucher')}
            </DialogTitle>
            <DialogDescription>{t('adminVouchers.dialogDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('common.type')} *</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receipt">{t('adminVouchers.typeReceipt')}</SelectItem>
                    <SelectItem value="payment">{t('adminVouchers.typePayment')}</SelectItem>
                    <SelectItem value="journal">{t('adminVouchers.typeJournal')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('common.category')}</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue placeholder={t('adminVouchers.selectCategory')} /></SelectTrigger>
                  <SelectContent>
                    {VOUCHER_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{categoryLabel(cat)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vch-title">{t('common.title')} *</Label>
              <Input id="vch-title" placeholder={t('adminVouchers.titlePlaceholder')} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vch-amount">{t('adminVouchers.amountTaka')} *</Label>
                <Input id="vch-amount" type="number" placeholder={t('common.amount')} value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vch-date">{t('common.date')}</Label>
                <Input id="vch-date" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vch-related">{t('adminVouchers.relatedTo')}</Label>
              <Input id="vch-related" placeholder={t('adminVouchers.relatedPlaceholder')} value={form.relatedTo} onChange={(e) => setForm((f) => ({ ...f, relatedTo: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vch-desc">{t('common.description')}</Label>
              <Textarea id="vch-desc" placeholder={t('adminVouchers.detailedDesc')} rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vch-created">{t('adminVouchers.createdBy')}</Label>
              <Input id="vch-created" placeholder={t('adminVouchers.createdByName')} value={form.createdBy} onChange={(e) => setForm((f) => ({ ...f, createdBy: e.target.value }))} />
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
              {t('adminVouchers.deleteVoucherDesc', { number: deleteTarget?.voucherNumber || '' })}
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
