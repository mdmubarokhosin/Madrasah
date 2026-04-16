'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Wallet, Receipt } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { FinanceReport, AcademicYear } from '@/types';
import { authFetch } from '@/lib/api';

const COLORS = ['#059669', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

export function AdminFinanceOverview() {
  const [report, setReport] = useState<FinanceReport | null>(null);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedAY, setSelectedAY] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/api/academic-years').then(r => r.json()).then(d => {
      const items = d.academicYears || [];
      setAcademicYears(items);
      const active = items.find(a => a.isActive);
      if (active) setSelectedAY(active.id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedAY) return;
    authFetch(`/api/finance/report?academicYearId=${selectedAY}`).then(r => r.json()).then(d => { setReport(d); setLoading(false); }).catch(() => setLoading(false));
  }, [selectedAY]);

  const fmt = (n: number) => `৳${n.toLocaleString('bn-BD')}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">আর্থিক সারসংক্ষেপ</h2>
          <p className="text-sm text-muted-foreground">আয়-ব্যয়ের সামগ্রিক চিত্র</p>
        </div>
        <Select value={selectedAY} onValueChange={setSelectedAY}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="শিক্ষাবর্ষ" /></SelectTrigger>
          <SelectContent>{academicYears.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
      ) : report ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><Wallet className="h-6 w-6 text-primary" /></div>
                <div><p className="text-xs text-muted-foreground">মোট আয়</p><p className="text-xl font-bold text-primary">{fmt(report.totalIncome)}</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center"><Receipt className="h-6 w-6 text-destructive" /></div>
                <div><p className="text-xs text-muted-foreground">মোট ব্যয়</p><p className="text-xl font-bold text-destructive">{fmt(report.totalExpenses)}</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${report.balance >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'} flex items-center justify-center`}>
                  {report.balance >= 0 ? <TrendingUp className="h-6 w-6 text-emerald-600" /> : <TrendingDown className="h-6 w-6 text-red-600" />}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">জমা</p>
                  <p className={`text-xl font-bold ${report.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(report.balance)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-base">মাসিক আয়-ব্যয়</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={report.monthly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: number) => fmt(value)} />
                    <Bar dataKey="income" fill="#059669" name="আয়" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" fill="#ef4444" name="ব্যয়" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">ব্যয় বিতরণ</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={report.expenseByCategory} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                      {report.expenseByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value: number) => fmt(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">আয় ক্যাটেগরি</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {report.incomeByCategory.map((c, i) => (
                    <div key={c.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-sm">{c.category}</span>
                      </div>
                      <span className="font-semibold text-sm">{fmt(c.amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">ব্যয় ক্যাটেগরি</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {report.expenseByCategory.map((c, i) => (
                    <div key={c.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-sm">{c.category}</span>
                      </div>
                      <span className="font-semibold text-sm">{fmt(c.amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card className="p-8 text-center text-muted-foreground">শিক্ষাবর্ষ নির্বাচন করুন</Card>
      )}
    </div>
  );
}
