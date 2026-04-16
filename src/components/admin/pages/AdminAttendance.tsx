'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { UserCheck, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authFetch } from '@/lib/api';
import type { Student, Class, AcademicYear, Attendance } from '@/types';

export function AdminAttendance() {
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existing, setExisting] = useState<Attendance[]>([]);
  const [stats, setStats] = useState({ present: 0, total: 0, rate: 0 });

  useEffect(() => {
    authFetch('/api/classes').then(r => r.json()).then(d => setClasses(d.classes || [])).catch(() => {});
    authFetch('/api/academic-years').then(r => r.json()).then(d => {
      const items = d.academicYears || [];
      setAcademicYears(items);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    authFetch(`/api/students`).then(r => r.json()).then(d => {
      const classStudents = (d.students || []).filter(s => s.classId === selectedClass);
      setStudents(classStudents);
      const recs: Record<string, string> = {};
      classStudents.forEach(s => { recs[s.id] = 'present'; });
      setRecords(recs);
      authFetch(`/api/attendance?classId=${selectedClass}&date=${selectedDate}`).then(r => r.json()).then(d => {
        const items = d.attendance || [];
        setExisting(items);
        setStats({ present: d.presentCount || 0, total: d.totalCount || 0, rate: d.rate || 0 });
        items.forEach(a => { recs[a.studentId] = a.status; });
        setRecords({ ...recs });
        setLoading(false);
      }).catch(() => setLoading(false));
    }).catch(() => setLoading(false));
  }, [selectedClass, selectedDate]);

  const reloadAttendance = () => {
    if (!selectedClass) return;
    setLoading(true);
    authFetch(`/api/students`).then(r => r.json()).then(d => {
      const classStudents = (d.students || []).filter(s => s.classId === selectedClass);
      setStudents(classStudents);
      const recs: Record<string, string> = {};
      classStudents.forEach(s => { recs[s.id] = 'present'; });
      authFetch(`/api/attendance?classId=${selectedClass}&date=${selectedDate}`).then(r => r.json()).then(d => {
        const items = d.attendance || [];
        setExisting(items);
        setStats({ present: d.presentCount || 0, total: d.totalCount || 0, rate: d.rate || 0 });
        items.forEach(a => { recs[a.studentId] = a.status; });
        setRecords({ ...recs });
        setLoading(false);
      }).catch(() => setLoading(false));
    }).catch(() => setLoading(false));
  };

  const setStatus = (studentId: string, status: string) => {
    setRecords(prev => ({ ...prev, [studentId]: status }));
  };

  const saveAttendance = async () => {
    if (!selectedClass || !selectedDate) { toast({ title: 'ত্রুটি', description: 'শ্রেণি ও তারিখ নির্বাচন করুন', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const activeAY = academicYears.find(a => a.isActive);
      const res = await authFetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: selectedClass, date: selectedDate, academicYearId: activeAY?.id, records: Object.entries(records).map(([studentId, status]) => ({ studentId, status })) }),
      });
      if (res.ok) { toast({ title: 'সংরক্ষিত', description: 'উপস্থিতি সংরক্ষণ হয়েছে' }); reloadAttendance(); }
      else toast({ title: 'ত্রুটি', variant: 'destructive' });
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }); }
    setSaving(false);
  };

  const statusCounts = {
    present: Object.values(records).filter(v => v === 'present').length,
    absent: Object.values(records).filter(v => v === 'absent').length,
    late: Object.values(records).filter(v => v === 'late').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">উপস্থিতি ব্যবস্থাপনা</h2>
        <p className="text-sm text-muted-foreground">শিক্ষার্থীদের উপস্থিতি চিহ্নিত করুন</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">শ্রেণি</label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger><SelectValue placeholder="শ্রেণি নির্বাচন করুন" /></SelectTrigger>
            <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">তারিখ</label>
          <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        </div>
        <div className="flex items-end gap-2">
          <Button onClick={saveAttendance} disabled={saving || !selectedClass}>
            <Save className="mr-2 h-4 w-4" />{saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ'}
          </Button>
        </div>
      </div>

      {selectedClass && (
        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-primary">{statusCounts.present}</p><p className="text-xs text-muted-foreground">উপস্থিত</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-destructive">{statusCounts.absent}</p><p className="text-xs text-muted-foreground">অনুপস্থিত</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-amber-600">{statusCounts.late}</p><p className="text-xs text-muted-foreground">বিলম্ব</p></CardContent></Card>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
          ) : !selectedClass ? (
            <div className="p-8 text-center text-muted-foreground">শ্রেণি নির্বাচন করুন</div>
          ) : students.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">এই শ্রেণিতে কোনো শিক্ষার্থী নেই</div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>রোল</TableHead>
                    <TableHead>নাম</TableHead>
                    <TableHead className="text-center">অবস্থা</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono">{s.roll}</TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          {[
                            { val: 'present', label: 'উপস্থিত', variant: 'default' as const },
                            { val: 'absent', label: 'অনুপস্থিত', variant: 'destructive' as const },
                            { val: 'late', label: 'বিলম্ব', variant: 'outline' as const },
                          ].map(opt => (
                            <Button key={opt.val} variant={records[s.id] === opt.val ? opt.variant : 'ghost'} size="sm" className="h-7 text-xs" onClick={() => setStatus(s.id, opt.val)}>
                              {opt.label}
                            </Button>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
