'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { authFetch } from '@/lib/api';
import { useAppStore } from '@/store/app';
import { Save } from 'lucide-react';
import type { SiteSettings } from '@/types';

export function AdminSettings() {
  const { toast } = useToast();
  const { siteSettings, setSiteSettings } = useAppStore();
  const [form, setForm] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('madrasa_token') : '';

  useEffect(() => {
    setForm(siteSettings);
  }, [siteSettings]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast({ title: 'সংরক্ষিত', description: 'সেটিংস আপডেট হয়েছে' });
        setSiteSettings(form);
      } else {
        toast({ title: 'ত্রুটি', description: 'আপডেট করতে সমস্যা', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'সার্ভারে সমস্যা', variant: 'destructive' });
    }
    setLoading(false);
  };

  const fields = [
    { key: 'siteName', label: 'মাদরাসার নাম' },
    { key: 'siteNameEn', label: 'ইংরেজি নাম' },
    { key: 'siteTagline', label: 'ট্যাগলাইন' },
    { key: 'address', label: 'ঠিকানা' },
    { key: 'phone', label: 'ফোন নম্বর' },
    { key: 'email', label: 'ইমেইল' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">সেটিংস</h2>
        <p className="text-sm text-muted-foreground">সাইটের সাধারণ সেটিংস পরিবর্তন করুন</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">সাইট সেটিংস</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key}>{field.label}</Label>
              <Input
                id={field.key}
                value={form[field.key] || ''}
                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                placeholder={field.label}
              />
            </div>
          ))}
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-1" />
            {loading ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
