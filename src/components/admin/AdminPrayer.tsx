'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2, Clock } from 'lucide-react';
import { dbGet, dbSet } from '@/lib/db-service';
import { useTranslation } from '@/lib/i18n-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PrayerTimes {
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  jummah: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PRAYERS: { key: keyof PrayerTimes; labelKey: string; placeholder: string }[] = [
  { key: 'fajr', labelKey: 'prayer.fajr', placeholder: '05:00' },
  { key: 'dhuhr', labelKey: 'prayer.dhuhr', placeholder: '12:30' },
  { key: 'asr', labelKey: 'prayer.asr', placeholder: '15:45' },
  { key: 'maghrib', labelKey: 'prayer.maghrib', placeholder: '18:15' },
  { key: 'isha', labelKey: 'prayer.isha', placeholder: '19:45' },
  { key: 'jummah', labelKey: 'prayer.jummah', placeholder: '13:30' },
];

const DEFAULT_TIMES: PrayerTimes = {
  fajr: '',
  dhuhr: '',
  asr: '',
  maghrib: '',
  isha: '',
  jummah: '',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminPrayer() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [times, setTimes] = useState<PrayerTimes>(DEFAULT_TIMES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* Load existing config */
  useEffect(() => {
    const loadTimes = async () => {
      try {
        const data = await dbGet<PrayerTimes>('/config/prayerTimes');
        if (data) {
          setTimes({
            fajr: data.fajr || '',
            dhuhr: data.dhuhr || '',
            asr: data.asr || '',
            maghrib: data.maghrib || '',
            isha: data.isha || '',
            jummah: data.jummah || '',
          });
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    };
    loadTimes();
  }, []);

  /* Save handler */
  const handleSave = async () => {
    setSaving(true);
    try {
      await dbSet('/config/prayerTimes', times);
      toast({ title: t('common.success'), description: t('adminPrayer.saved') });
    } catch {
      toast({ title: t('common.error'), description: t('common.saveFailed'), variant: 'destructive' });
    } finally {
      setSaving(false);
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
        <h2 className="text-2xl font-bold text-islamic-dark">{t('adminPrayer.title')}</h2>
        <p className="text-muted-foreground text-sm mt-1">
          {t('adminPrayer.subtitle')}
        </p>
      </div>

      {/* Prayer Times Form */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-islamic-dark">
            <Clock className="size-5" />
            {t('adminPrayer.config')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {PRAYERS.map((prayer) => (
              <div key={prayer.key} className="flex items-center gap-4">
                <Label
                  htmlFor={`prayer-${prayer.key}`}
                  className="min-w-[80px] text-sm font-medium text-islamic-dark"
                >
                  {t(prayer.labelKey)}
                </Label>
                <Input
                  id={`prayer-${prayer.key}`}
                  type="time"
                  value={times[prayer.key]}
                  onChange={(e) => setTimes((prev) => ({ ...prev, [prayer.key]: e.target.value }))}
                  className="max-w-[200px]"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-6">
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
    </div>
  );
}
