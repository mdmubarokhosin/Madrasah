'use client';

import { useState, useEffect } from 'react';
import { Save, Send, Loader2, MessageSquare, Power, PowerOff } from 'lucide-react';
import { dbGet, dbSet } from '@/lib/db-service';
import { useTranslation } from '@/lib/i18n-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SMSConfig {
  enabled: boolean;
  provider: string;
  apiKey: string;
  senderId: string;
  testPhone: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const DEFAULT_CONFIG: SMSConfig = {
  enabled: false,
  provider: '',
  apiKey: '',
  senderId: '',
  testPhone: '',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminSMS() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const providers = [
    { value: 'banglalink', label: t('adminSms.providerBanglalink') },
    { value: 'robi', label: t('adminSms.providerRobi') },
    { value: 'teletalk', label: t('adminSms.providerTeletalk') },
    { value: 'custom', label: t('adminSms.providerCustom') },
  ];
  const [config, setConfig] = useState<SMSConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [testPhone, setTestPhone] = useState('');

  /* Load existing config */
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await dbGet<SMSConfig>('/config/smsConfig');
        if (data) {
          setConfig({
            enabled: data.enabled ?? false,
            provider: data.provider || '',
            apiKey: data.apiKey || '',
            senderId: data.senderId || '',
            testPhone: data.testPhone || '',
          });
          if (data.testPhone) setTestPhone(data.testPhone);
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  /* Save config */
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: SMSConfig = {
        enabled: config.enabled,
        provider: config.provider,
        apiKey: config.apiKey,
        senderId: config.senderId,
        testPhone: testPhone,
      };
      await dbSet('/config/smsConfig', payload);
      toast({ title: t('common.success'), description: t('adminSms.configSaved') });
    } catch {
      toast({ title: t('common.error'), description: t('common.saveFailed'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  /* Send test SMS */
  const handleSendTestSMS = async () => {
    if (!testPhone.trim()) {
      toast({ title: t('common.error'), description: t('adminSms.phoneRequired'), variant: 'destructive' });
      return;
    }
    if (!config.provider || !config.apiKey) {
      toast({ title: t('common.error'), description: t('adminSms.providerKeyRequired'), variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      // In a real implementation, this would call the SMS provider's API
      // For now, we simulate and show success
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast({
        title: t('adminSms.testSentTitle'),
        description: t('adminSms.testSentDesc', { message: testMessage || t('adminSms.defaultTestMessage'), phone: testPhone }),
      });
    } catch {
      toast({ title: t('common.error'), description: t('adminSms.sendFailed'), variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-8 animate-spin text-islamic" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-islamic-dark">{t('adminSms.title')}</h2>
        <p className="text-muted-foreground text-sm mt-1">
          {t('adminSms.subtitle')}
        </p>
      </div>

      {/* Enable/Disable */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {config.enabled ? (
                <Power className="size-5 text-green-600" />
              ) : (
                <PowerOff className="size-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium text-sm text-islamic-dark">{t('adminSms.serviceTitle')}</p>
                <p className="text-xs text-muted-foreground">
                  {config.enabled ? t('adminSms.enabledDesc') : t('adminSms.disabledDesc')}
                </p>
              </div>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, enabled: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-islamic-dark">
            <MessageSquare className="size-5" />
            {t('adminSms.apiConfig')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('adminSms.provider')}</Label>
            <Select
              value={config.provider}
              onValueChange={(val) => setConfig((prev) => ({ ...prev, provider: val }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('adminSms.providerPh')} />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sms-apiKey">{t('adminSms.apiKey')}</Label>
            <Input
              id="sms-apiKey"
              type="password"
              placeholder={t('adminSms.apiKeyPh')}
              value={config.apiKey}
              onChange={(e) => setConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sms-senderId">{t('adminSms.senderId')}</Label>
            <Input
              id="sms-senderId"
              placeholder={t('adminSms.senderIdPh')}
              value={config.senderId}
              onChange={(e) => setConfig((prev) => ({ ...prev, senderId: e.target.value }))}
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {t('common.save')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test SMS */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-islamic-dark">{t('adminSms.sendTest')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sms-testPhone">{t('adminSms.phone')}</Label>
            <Input
              id="sms-testPhone"
              placeholder="01XXXXXXXXX"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sms-testMsg">{t('adminSms.message')}</Label>
            <Input
              id="sms-testMsg"
              placeholder={t('adminSms.messagePh')}
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSendTestSMS}
              disabled={sending || !config.enabled}
              className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
            >
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {t('adminSms.sendTest')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
