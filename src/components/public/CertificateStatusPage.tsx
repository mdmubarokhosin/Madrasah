'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { CertificateApplication } from '@/types';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock; color: string }> = {
  pending: { label: 'অপেক্ষমাণ', variant: 'secondary', icon: Clock, color: 'text-amber-600' },
  approved: { label: 'অনুমোদিত', variant: 'default', icon: CheckCircle, color: 'text-primary' },
  rejected: { label: 'বাতিল', variant: 'destructive', icon: XCircle, color: 'text-destructive' },
  delivered: { label: 'বিতরণকৃত', variant: 'outline', icon: Truck, color: 'text-emerald-600' },
};

export function CertificateStatusPage() {
  const { toast } = useToast();
  const [applicationId, setApplicationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [application, setApplication] = useState<CertificateApplication | null>(null);
  const [searched, setSearched] = useState(false);

  const searchStatus = async () => {
    if (!applicationId.trim()) {
      toast({ title: 'ত্রুটি', description: 'আবেদন আইডি দিন', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/certificates/status/${encodeURIComponent(applicationId.trim())}`);
      const data = await res.json();
      if (res.ok) {
        setApplication(data.application);
      } else {
        setApplication(null);
        toast({ title: 'পাওয়া যায়নি', description: data.error, variant: 'destructive' });
      }
    } catch {
      setApplication(null);
      toast({ title: 'ত্রুটি', description: 'সার্ভারে সমস্যা হয়েছে', variant: 'destructive' });
    }
    setLoading(false);
  };

  const config = application ? statusConfig[application.status] : null;
  const StatusIcon = config?.icon || Clock;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-center">সনদের স্ট্যাটাস</h1>
        <p className="text-muted-foreground text-center mb-8">আপনার আবেদন আইডি দিয়ে স্ট্যাটাস দেখুন</p>

        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="appId">আবেদন আইডি</Label>
                <Input
                  id="appId"
                  value={applicationId}
                  onChange={(e) => setApplicationId(e.target.value)}
                  placeholder="CERT-XXXX-XXXX"
                  className="mt-1.5"
                  onKeyDown={(e) => e.key === 'Enter' && searchStatus()}
                />
              </div>
              <Button onClick={searchStatus} disabled={loading} className="mt-6">
                <Search className="mr-2 h-4 w-4" />
                {loading ? 'খুঁজা হচ্ছে...' : 'খুঁজুন'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {searched && !application && !loading && (
          <div className="mt-6 text-center py-8 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>কোনো আবেদন পাওয়া যায়নি। আবেদন আইডি সঠিক কিনা নিশ্চিত করুন।</p>
          </div>
        )}

        {application && config && (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-3 ${config.color}`}>
                  <StatusIcon className="h-8 w-8" />
                </div>
                <Badge variant={config.variant} className="text-sm px-4 py-1">
                  {config.label}
                </Badge>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'আবেদন আইডি', value: application.applicationId },
                  { label: 'শিক্ষার্থীর নাম', value: application.studentName },
                  { label: 'রোল', value: application.roll },
                  { label: 'রেজিস্ট্রেশন নম্বর', value: application.regNo },
                  { label: 'পরীক্ষা', value: application.exam?.name || '' },
                  { label: 'মারহালা', value: application.marhala?.name || '' },
                  { label: 'সনদের ধরন', value: application.certificateType },
                  { label: 'আবেদনের তারিখ', value: new Date(application.createdAt).toLocaleDateString('bn-BD') },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center py-2 border-b last:border-0">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
