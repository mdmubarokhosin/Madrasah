'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, ClipboardList, Bell, MessageSquare, TrendingUp, Layers, DollarSign, Wallet, Receipt, UserCheck, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authFetch } from '@/lib/api';
import type { Stats } from '@/types';

export function AdminDashboard({ stats }: { stats: Stats | null }) {
  const { toast } = useToast();
  const [seeding, setSeeding] = useState(false);
  const s = stats || {
    totalStudents: 0, totalExams: 0, totalResults: 0, totalNotices: 0,
    totalMessages: 0, unreadMessages: 0, passRate: 0, totalClasses: 0,
    totalIncome: 0, totalExpenses: 0, unpaidFees: 0, attendanceRate: 0,
  };

  const mainStats = [
    { icon: Users, label: 'শিক্ষার্থী', value: s.totalStudents, color: 'text-primary', bg: 'bg-primary/10' },
    { icon: Layers, label: 'শ্রেণি', value: s.totalClasses, color: 'text-amber-600', bg: 'bg-amber-500/10' },
    { icon: BookOpen, label: 'পরীক্ষা', value: s.totalExams, color: 'text-purple-600', bg: 'bg-purple-500/10' },
    { icon: ClipboardList, label: 'ফলাফল', value: s.totalResults, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  ];

  const financeStats = [
    { icon: Wallet, label: 'মোট আয়', value: `৳${(s.totalIncome).toLocaleString('bn-BD')}`, color: 'text-primary', bg: 'bg-primary/10' },
    { icon: Receipt, label: 'মোট ব্যয়', value: `৳${(s.totalExpenses).toLocaleString('bn-BD')}`, color: 'text-destructive', bg: 'bg-destructive/10' },
    { icon: DollarSign, label: 'বকেয়া ফি', value: `৳${(s.unpaidFees).toLocaleString('bn-BD')}`, color: 'text-amber-600', bg: 'bg-amber-500/10' },
    { icon: UserCheck, label: 'উপস্থিতি', value: `${s.attendanceRate}%`, color: 'text-teal-600', bg: 'bg-teal-500/10' },
  ];

  const otherStats = [
    { icon: TrendingUp, label: 'পাশের হার', value: `${s.passRate}%` },
    { icon: Bell, label: 'সক্রিয় নোটিশ', value: s.totalNotices },
    { icon: MessageSquare, label: 'বার্তা', value: s.totalMessages },
    { icon: MessageSquare, label: 'পড়া হয়নি', value: s.unreadMessages },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">ড্যাশবোর্ড</h2>
        <p className="text-sm text-muted-foreground">মাদরাসার সামগ্রিক তথ্য</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {mainStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {financeStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">দ্রুত তথ্য</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {otherStats.map((stat) => (
                <div key={stat.label} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                  <span className="font-semibold">{stat.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">আর্থিক সারসংক্ষেপ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">মোট আয়</span>
                <span className="font-semibold text-primary">৳{(s.totalIncome).toLocaleString('bn-BD')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">মোট ব্যয়</span>
                <span className="font-semibold text-destructive">৳{(s.totalExpenses).toLocaleString('bn-BD')}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-sm font-medium">জমা</span>
                <span className={`font-bold ${s.totalIncome - s.totalExpenses >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  ৳{(s.totalIncome - s.totalExpenses).toLocaleString('bn-BD')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">বকেয়া ফি</span>
                <span className="font-semibold text-amber-600">৳{(s.unpaidFees).toLocaleString('bn-BD')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">দ্রুত কার্যক্রম</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!confirm('নমুনা ডাটা তৈরি করবেন? এতে ১টি পরীক্ষা, ১টি মারহালা, ৫টি বিষয়, ১০ জন শিক্ষার্থী ও তাদের ফলাফল যোগ হবে।')) return;
                setSeeding(true);
                try {
                  const res = await authFetch('/api/seed-demo', { method: 'POST' });
                  const data = await res.json();
                  if (res.ok) {
                    toast({ title: data.message, description: `${data.details.students} জন শিক্ষার্থী ও ${data.details.results} টি ফলাফল তৈরি হয়েছে` });
                    window.location.reload();
                  } else {
                    toast({ title: 'ত্রুটি', description: data.error, variant: 'destructive' });
                  }
                } catch {
                  toast({ title: 'সার্ভার ত্রুটি', variant: 'destructive' });
                }
                setSeeding(false);
              }}
              disabled={seeding}
            >
              <Database className="h-4 w-4 mr-1" />
              {seeding ? 'তৈরি হচ্ছে...' : 'নমুনা ডাটা তৈরি করুন'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
