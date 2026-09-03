'use client';

import { useState, useEffect, useCallback } from 'react';
import { QrCode, Loader2, Save, Eye, EyeOff, Image, X } from 'lucide-react';
import { dbSet } from '@/lib/db-service';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const EMPTY_CONFIG = {
  enabled: false,
  bkashNumber: '',
  bkashQR: '',
  bkashIcon: '',
  nagadNumber: '',
  nagadQR: '',
  nagadIcon: '',
  rocketNumber: '',
  rocketQR: '',
  rocketIcon: '',
  bankName: '',
  bankAccount: '',
  bankQR: '',
  bankIcon: '',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminQRPayment() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const qrPaymentConfig = useAppStore((s) => s.qrPaymentConfig);

  const [form, setForm] = useState(EMPTY_CONFIG);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const { githubConfig } = useAppStore();

  /* Load config from store */
  useEffect(() => {
    if (qrPaymentConfig && !loaded) {
      setForm({
        enabled: qrPaymentConfig.enabled ?? false,
        bkashNumber: qrPaymentConfig.bkashNumber || '',
        bkashQR: qrPaymentConfig.bkashQR || '',
        bkashIcon: qrPaymentConfig.bkashIcon || '',
        nagadNumber: qrPaymentConfig.nagadNumber || '',
        nagadQR: qrPaymentConfig.nagadQR || '',
        nagadIcon: qrPaymentConfig.nagadIcon || '',
        rocketNumber: qrPaymentConfig.rocketNumber || '',
        rocketQR: qrPaymentConfig.rocketQR || '',
        rocketIcon: qrPaymentConfig.rocketIcon || '',
        bankName: qrPaymentConfig.bankName || '',
        bankAccount: qrPaymentConfig.bankAccount || '',
        bankQR: qrPaymentConfig.bankQR || '',
        bankIcon: qrPaymentConfig.bankIcon || '',
      });
      setLoaded(true);
    }
  }, [qrPaymentConfig, loaded]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        enabled: form.enabled,
        bkashNumber: form.bkashNumber.trim(),
        bkashQR: form.bkashQR.trim(),
        bkashIcon: form.bkashIcon.trim(),
        nagadNumber: form.nagadNumber.trim(),
        nagadQR: form.nagadQR.trim(),
        nagadIcon: form.nagadIcon.trim(),
        rocketNumber: form.rocketNumber.trim(),
        rocketQR: form.rocketQR.trim(),
        rocketIcon: form.rocketIcon.trim(),
        bankName: form.bankName.trim(),
        bankAccount: form.bankAccount.trim(),
        bankQR: form.bankQR.trim(),
        bankIcon: form.bankIcon.trim(),
      };
      await dbSet('/config/qrPaymentConfig', payload);
      toast({ title: t('common.success'), description: t('adminQrPayment.saveSuccess') });
    } catch {
      toast({ title: t('common.error'), description: t('common.saveFailed'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleIconUpload = async (field: string, file: File) => {
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        if (githubConfig?.token && githubConfig?.owner && githubConfig?.repo) {
          try {
            const fileName = `payment-icons/${file.name}`;
            const res = await fetch(`https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${fileName}`, {
              method: 'PUT',
              headers: {
                'Authorization': `token ${githubConfig.token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                message: `Upload payment icon: ${file.name}`,
                content: base64.split(',')[1],
                branch: githubConfig.branch || 'main',
              }),
            });
            if (res.ok) {
              const data = await res.json();
              const rawUrl = data.content.download_url;
              setForm((f) => ({ ...f, [field]: rawUrl }));
              toast({ title: t('common.success'), description: t('adminQrPayment.iconUploaded') });
            } else {
              toast({ title: t('common.error'), description: t('adminQrPayment.iconUploadFailed'), variant: 'destructive' });
            }
          } catch {
            toast({ title: t('common.error'), description: t('adminQrPayment.githubUploadFailed'), variant: 'destructive' });
          }
        } else {
          toast({ title: t('common.error'), description: t('adminQrPayment.githubFirst'), variant: 'destructive' });
        }
      };
      reader.readAsDataURL(file);
    } catch {
      toast({ title: t('common.error'), description: t('adminQrPayment.fileReadFailed'), variant: 'destructive' });
    }
  };

  /* Icon Upload + URL + Preview Sub-component */
  const IconField = ({ field, label }: { field: string; label: string }) => (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <Image className="size-3.5 text-muted-foreground" />
        {t('adminQrPayment.iconLabel', { name: label })}
      </Label>
      <Input
        placeholder={t('adminQrPayment.iconUrlPlaceholder')}
        value={(form as any)[field] || ''}
        onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
      />
      <div className="flex items-center gap-2">
        <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:border-islamic hover:text-islamic transition-all cursor-pointer">
          <Image className="size-3" />
          {t('common.upload')}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleIconUpload(field, file);
            }}
          />
        </label>
        {(form as any)[field] && (
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, [field]: '' }))}
            className="inline-flex items-center gap-1 px-2 py-1 rounded border border-red-200 bg-red-50 text-xs text-red-600 hover:bg-red-100 cursor-pointer"
          >
            <X className="size-3" />
            {t('common.delete')}
          </button>
        )}
      </div>
      {(form as any)[field] && (
        <div className="flex items-center gap-3 mt-2">
          <div className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden bg-white">
            <img
              src={(form as any)[field]}
              alt={label}
              className="w-full h-full object-contain p-0.5"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">{t('adminQrPayment.previewActive')}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-islamic-dark">{t('adminQrPayment.title')}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t('adminQrPayment.subtitle')}
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {t('common.save')}
        </Button>
      </div>

      {/* Enable Toggle */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-islamic-dark flex items-center gap-2">
                <QrCode className="size-5" />
                {t('adminQrPayment.enabledTitle')}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">{t('adminQrPayment.enabledDesc')}</p>
            </div>
            <Button
              variant={form.enabled ? 'default' : 'outline'}
              onClick={() => setForm((f) => ({ ...f, enabled: !f.enabled }))}
              className={`gap-2 cursor-pointer min-w-32 ${form.enabled ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
            >
              {form.enabled ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
              {form.enabled ? t('common.active') : t('common.inactive')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* bKash */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-pink-600 flex items-center gap-2">
              <div className="size-8 bg-pink-100 rounded-lg flex items-center justify-center overflow-hidden">
                {form.bkashIcon ? (
                  <img src={form.bkashIcon} alt="bKash" className="w-full h-full object-contain p-0.5" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <span className="text-pink-700 font-bold text-sm">{t('adminQrPayment.bkashInitial')}</span>
                )}
              </div>
              {t('adminQrPayment.bkashTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bkash-number">{t('adminQrPayment.numberLabel', { name: t('adminQrPayment.bkashShort') })}</Label>
              <Input
                id="bkash-number"
                placeholder={t('adminQrPayment.numberPlaceholder')}
                value={form.bkashNumber}
                onChange={(e) => setForm((f) => ({ ...f, bkashNumber: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bkash-qr">{t('adminQrPayment.qrUrlLabel')}</Label>
              <Input
                id="bkash-qr"
                placeholder={t('adminQrPayment.qrUrlPlaceholder')}
                value={form.bkashQR}
                onChange={(e) => setForm((f) => ({ ...f, bkashQR: e.target.value }))}
              />
            </div>
            <IconField field="bkashIcon" label={t('adminQrPayment.bkashShort')} />
            {form.bkashQR && (
              <div className="border rounded-lg p-3 bg-muted/30">
                <p className="text-xs text-muted-foreground mb-2">{t('adminQrPayment.previewLabel')}</p>
                <div className="flex items-center justify-center">
                  <img
                    src={form.bkashQR}
                    alt={t('adminQrPayment.qrAlt', { name: t('adminQrPayment.bkashShort') })}
                    className="h-40 w-40 object-contain rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="text-center mt-2">
                  <Badge variant="secondary" className="text-xs">{form.bkashNumber || t('adminQrPayment.noNumber')}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Nagad */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-orange-600 flex items-center gap-2">
              <div className="size-8 bg-orange-100 rounded-lg flex items-center justify-center overflow-hidden">
                {form.nagadIcon ? (
                  <img src={form.nagadIcon} alt="Nagad" className="w-full h-full object-contain p-0.5" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <span className="text-orange-700 font-bold text-sm">{t('adminQrPayment.nagadInitial')}</span>
                )}
              </div>
              {t('adminQrPayment.nagadTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nagad-number">{t('adminQrPayment.numberLabel', { name: t('adminQrPayment.nagadShort') })}</Label>
              <Input
                id="nagad-number"
                placeholder={t('adminQrPayment.numberPlaceholder')}
                value={form.nagadNumber}
                onChange={(e) => setForm((f) => ({ ...f, nagadNumber: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nagad-qr">{t('adminQrPayment.qrUrlLabel')}</Label>
              <Input
                id="nagad-qr"
                placeholder={t('adminQrPayment.qrUrlPlaceholder')}
                value={form.nagadQR}
                onChange={(e) => setForm((f) => ({ ...f, nagadQR: e.target.value }))}
              />
            </div>
            <IconField field="nagadIcon" label={t('adminQrPayment.nagadShort')} />
            {form.nagadQR && (
              <div className="border rounded-lg p-3 bg-muted/30">
                <p className="text-xs text-muted-foreground mb-2">{t('adminQrPayment.previewLabel')}</p>
                <div className="flex items-center justify-center">
                  <img
                    src={form.nagadQR}
                    alt={t('adminQrPayment.qrAlt', { name: t('adminQrPayment.nagadShort') })}
                    className="h-40 w-40 object-contain rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="text-center mt-2">
                  <Badge variant="secondary" className="text-xs">{form.nagadNumber || t('adminQrPayment.noNumber')}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rocket */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-purple-600 flex items-center gap-2">
              <div className="size-8 bg-purple-100 rounded-lg flex items-center justify-center overflow-hidden">
                {form.rocketIcon ? (
                  <img src={form.rocketIcon} alt="Rocket" className="w-full h-full object-contain p-0.5" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <span className="text-purple-700 font-bold text-sm">{t('adminQrPayment.rocketInitial')}</span>
                )}
              </div>
              {t('adminQrPayment.rocketTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rocket-number">{t('adminQrPayment.numberLabel', { name: t('adminQrPayment.rocketShort') })}</Label>
              <Input
                id="rocket-number"
                placeholder={t('adminQrPayment.numberPlaceholder')}
                value={form.rocketNumber}
                onChange={(e) => setForm((f) => ({ ...f, rocketNumber: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rocket-qr">{t('adminQrPayment.qrUrlLabel')}</Label>
              <Input
                id="rocket-qr"
                placeholder={t('adminQrPayment.qrUrlPlaceholder')}
                value={form.rocketQR}
                onChange={(e) => setForm((f) => ({ ...f, rocketQR: e.target.value }))}
              />
            </div>
            <IconField field="rocketIcon" label={t('adminQrPayment.rocketShort')} />
            {form.rocketQR && (
              <div className="border rounded-lg p-3 bg-muted/30">
                <p className="text-xs text-muted-foreground mb-2">{t('adminQrPayment.previewLabel')}</p>
                <div className="flex items-center justify-center">
                  <img
                    src={form.rocketQR}
                    alt={t('adminQrPayment.qrAlt', { name: t('adminQrPayment.rocketShort') })}
                    className="h-40 w-40 object-contain rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="text-center mt-2">
                  <Badge variant="secondary" className="text-xs">{form.rocketNumber || t('adminQrPayment.noNumber')}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bank Transfer */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-islamic-dark flex items-center gap-2">
            <div className="size-8 bg-blue-100 rounded-lg flex items-center justify-center overflow-hidden">
                {form.bankIcon ? (
                  <img src={form.bankIcon} alt="Bank" className="w-full h-full object-contain p-0.5" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <span className="text-blue-700 font-bold text-sm">{t('adminQrPayment.bankInitial')}</span>
                )}
              </div>
              {t('adminQrPayment.bankTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bank-name">{t('adminQrPayment.bankNameLabel')}</Label>
              <Input
                id="bank-name"
                placeholder={t('adminQrPayment.bankNameLabel')}
                value={form.bankName}
                onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank-account">{t('adminQrPayment.bankAccountLabel')}</Label>
              <Input
                id="bank-account"
                placeholder={t('adminQrPayment.bankAccountLabel')}
                value={form.bankAccount}
                onChange={(e) => setForm((f) => ({ ...f, bankAccount: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank-qr">{t('adminQrPayment.qrUrlLabel')}</Label>
              <Input
                id="bank-qr"
                placeholder={t('adminQrPayment.qrUrlPlaceholder')}
                value={form.bankQR}
                onChange={(e) => setForm((f) => ({ ...f, bankQR: e.target.value }))}
              />
            </div>
          </div>
          <div className="mt-4">
            <IconField field="bankIcon" label={t('adminQrPayment.bankShort')} />
          </div>
          {form.bankQR && (
            <div className="mt-4 border rounded-lg p-4 bg-muted/30 max-w-xs">
              <p className="text-xs text-muted-foreground mb-2">{t('adminQrPayment.bankQrPreview')}</p>
              <div className="flex items-center justify-center">
                <img
                  src={form.bankQR}
                  alt={t('adminQrPayment.qrAlt', { name: t('adminQrPayment.bankShort') })}
                  className="h-40 w-40 object-contain rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              {form.bankName && (
                <div className="text-center mt-2">
                  <Badge variant="secondary" className="text-xs">{form.bankName}</Badge>
                  {form.bankAccount && <p className="text-xs text-muted-foreground mt-1">{form.bankAccount}</p>}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
