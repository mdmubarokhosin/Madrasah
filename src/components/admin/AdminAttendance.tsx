'use client';

import { useState, useEffect, useMemo } from 'react';
import { Check, X, Clock, AlertCircle, Save, Loader2, Users } from 'lucide-react';
import { dbPush, dbUpdate, dbSet, dbGet, dbSubscribe } from '@/lib/db-service';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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

interface AttendanceRecord {
  studentId: string;
  studentName: string;
  studentRoll: string;
  status: 'present' | 'absent' | 'late' | 'excused';
}

interface SavedAttendance {
  id: string;
  date: string;
  department: string;
  className: string;
  records: AttendanceRecord[];
  createdAt: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_CONFIG: Record<string, { icon: typeof Check; color: string; bg: string }> = {
  present: { icon: Check, color: 'text-green-600', bg: 'bg-green-100 hover:bg-green-200 border-green-300' },
  absent: { icon: X, color: 'text-red-600', bg: 'bg-red-100 hover:bg-red-200 border-red-300' },
  late: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300' },
  excused: { icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-100 hover:bg-blue-200 border-blue-300' },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminAttendance() {
  const { students, departments } = useAppStore();
  const { t } = useTranslation();
  const { toast } = useToast();

  const statusLabels: Record<string, string> = {
    present: t('attendance.present'),
    absent: t('attendance.absent'),
    late: t('attendance.late'),
    excused: t('attendance.excused'),
  };

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [saving, setSaving] = useState(false);

  /* Saved attendance history */
  const [savedList, setSavedList] = useState<SavedAttendance[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  /* Subscribe to saved attendance */
  useEffect(() => {
    const unsub = dbSubscribe('/attendance', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list: SavedAttendance[] = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        }));
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setSavedList(list);
      } else {
        setSavedList([]);
      }
    });
    return unsub;
  }, []);

  /* Filter students by department and class */
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (selectedDepartment !== 'all' && s.department !== selectedDepartment) return false;
      if (selectedClass !== 'all' && s.class !== selectedClass) return false;
      return true;
    });
  }, [students, selectedDepartment, selectedClass]);

  /* Get unique departments and classes */
  const uniqueDepartments = useMemo(() => {
    // Use canonical departments from store first
    if (departments.length > 0) {
      return departments.map((d) => d.name).filter(Boolean);
    }
    // Fallback to deriving from student records
    return [...new Set(students.map((s) => s.department).filter(Boolean))];
  }, [departments, students]);

  const classes = useMemo(() => {
    if (selectedDepartment !== 'all') {
      const selectedDept = departments.find(d => d.name === selectedDepartment);
      const deptClasses = selectedDept?.classes || [];
      if (deptClasses.length > 0) return deptClasses;
    }
    // Fallback to deriving from student records
    const cls = [...new Set(students.map((s) => s.class).filter(Boolean))];
    return cls;
  }, [students, selectedDepartment, departments]);

  /* Initialize attendance when filters change */
  useEffect(() => {
    setAttendance(
      filteredStudents.map((s) => ({
        studentId: s.id,
        studentName: s.name,
        studentRoll: s.roll,
        status: 'present' as AttendanceRecord['status'],
      }))
    );
  }, [filteredStudents]);

  /* Toggle student status */
  const toggleStatus = (studentId: string) => {
    setAttendance((prev) => {
      const order: Array<'present' | 'absent' | 'late' | 'excused'> = ['present', 'absent', 'late', 'excused'];
      return prev.map((rec) => {
        if (rec.studentId === studentId) {
          const idx = order.indexOf(rec.status);
          return { ...rec, status: order[(idx + 1) % order.length] };
        }
        return rec;
      });
    });
  };

  /* Set specific status */
  const setStatus = (studentId: string, status: AttendanceRecord['status']) => {
    setAttendance((prev) =>
      prev.map((rec) =>
        rec.studentId === studentId ? { ...rec, status } : rec
      )
    );
  };

  /* Save attendance */
  const handleSave = async () => {
    if (filteredStudents.length === 0) {
      toast({ title: t('common.error'), description: t('adminAttendance.noStudentsToast'), variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      await dbPush('/attendance', {
        date: selectedDate,
        department: selectedDepartment,
        className: selectedClass,
        records: attendance,
        createdAt: Date.now(),
      });
      toast({ title: t('common.success'), description: t('adminAttendance.savedToast', { count: attendance.length }) });
    } catch {
      toast({ title: t('common.error'), description: t('common.saveFailed'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  /* Mark all present */
  const markAllPresent = () => {
    setAttendance((prev) => prev.map((rec) => ({ ...rec, status: 'present' as AttendanceRecord['status'] })));
  };

  /* Load saved attendance */
  const loadSavedAttendance = (saved: SavedAttendance) => {
    setSelectedDate(saved.date);
    setSelectedDepartment(saved.department);
    setSelectedClass(saved.className);
    setShowHistory(false);
    // Give filters time to apply, then set attendance
    setTimeout(() => {
      setAttendance(saved.records);
    }, 100);
    toast({ title: t('adminAttendance.info'), description: t('adminAttendance.loadedToast', { date: saved.date }) });
  };

  /* Summary stats */
  const summary = useMemo(() => {
    const present = attendance.filter((a) => a.status === 'present').length;
    const absent = attendance.filter((a) => a.status === 'absent').length;
    const late = attendance.filter((a) => a.status === 'late').length;
    const excused = attendance.filter((a) => a.status === 'excused').length;
    return { present, absent, late, excused, total: attendance.length };
  }, [attendance]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-islamic-dark">{t('adminAttendance.title')}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t('adminAttendance.subtitle')}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowHistory(!showHistory)}
          className="gap-2 cursor-pointer"
        >
          {showHistory ? t('common.back') : t('adminAttendance.viewHistory')}
        </Button>
      </div>

      {showHistory ? (
        /* Attendance History */
        <Card className="shadow-sm">
          <CardContent className="p-0">
            {savedList.length > 0 ? (
              <div className="divide-y">
                {savedList.slice(0, 30).map((saved) => (
                  <div key={saved.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-medium text-sm text-islamic-dark">{saved.date}</p>
                      <p className="text-xs text-muted-foreground">
                        {saved.department !== 'all' ? saved.department : t('adminAttendance.allDepartments')} | {saved.className !== 'all' ? saved.className : t('adminAttendance.allClasses')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {t('adminAttendance.peopleCount', { count: (saved.records || []).length })}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => loadSavedAttendance(saved)}
                        className="text-xs cursor-pointer"
                      >
                        {t('adminAttendance.load')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Users className="size-12 opacity-20 mb-3" />
                <p className="text-sm">{t('adminAttendance.noHistory')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Filters */}
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="att-date">{t('common.date')}</Label>
                  <Input
                    id="att-date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('adminAttendance.department')}</Label>
                  <Select value={selectedDepartment} onValueChange={(value) => { setSelectedDepartment(value); setSelectedClass('all'); }}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('adminAttendance.allDepartments')}</SelectItem>
                      {uniqueDepartments.map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('adminAttendance.class')}</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('adminAttendance.allClasses')}</SelectItem>
                      {classes.map((cls) => (
                        <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          {attendance.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold text-islamic-dark">{summary.total}</p>
                <p className="text-xs text-muted-foreground">{t('common.total')}</p>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{summary.present}</p>
                <p className="text-xs text-green-600">{t('attendance.present')}</p>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center">
                <p className="text-2xl font-bold text-red-600">{summary.absent}</p>
                <p className="text-xs text-red-600">{t('attendance.absent')}</p>
              </div>
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-center">
                <p className="text-2xl font-bold text-yellow-600">{summary.late}</p>
                <p className="text-xs text-yellow-600">{t('attendance.late')}</p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{summary.excused}</p>
                <p className="text-xs text-blue-600">{t('attendance.excused')}</p>
              </div>
            </div>
          )}

          {/* Student List */}
          <Card className="shadow-sm">
            <CardContent className="p-4">
              {attendance.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-muted-foreground">
                      {t('adminAttendance.studentList', { count: attendance.length })}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={markAllPresent}
                      className="text-xs cursor-pointer"
                    >
                      {t('adminAttendance.markAllPresent')}
                    </Button>
                  </div>
                  {attendance.map((record) => {
                    const config = STATUS_CONFIG[record.status];
                    const Icon = config.icon;
                    return (
                      <div
                        key={record.studentId}
                        className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-muted-foreground w-10 text-right">
                            {record.studentRoll || '—'}
                          </span>
                          <span className="font-medium text-sm text-islamic-dark">{record.studentName}</span>
                        </div>
                        <div className="flex gap-1">
                          {(Object.entries(STATUS_CONFIG) as [keyof typeof STATUS_CONFIG, typeof config][]).map(
                            ([key, cfg]) => {
                              const SIcon = cfg.icon;
                              const isActive = record.status === key;
                              return (
                                <Button
                                  key={key}
                                  size="sm"
                                  variant="outline"
                                  className={`gap-1 text-xs cursor-pointer ${isActive ? cfg.bg + ' ' + cfg.color + ' border' : ''}`}
                                  onClick={() => setStatus(record.studentId, key as AttendanceRecord['status'])}
                                >
                                  <SIcon className="size-3" />
                                  <span className="hidden sm:inline">{statusLabels[key]}</span>
                                </Button>
                              );
                            }
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Users className="size-12 opacity-20 mb-3" />
                  <p className="text-sm">{t('adminAttendance.noStudents')}</p>
                  <p className="text-xs mt-1">{t('adminAttendance.selectHint')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          {attendance.length > 0 && (
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
                size="lg"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                {t('adminAttendance.save')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
