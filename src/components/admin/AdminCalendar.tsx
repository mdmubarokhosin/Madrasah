'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, CalendarDays, Loader2, Filter } from 'lucide-react';
import { dbPush, dbUpdate, dbRemove, dbSubscribe } from '@/lib/db-service';
import { useTranslation } from '@/lib/i18n-context';
import { useToast } from '@/hooks/use-toast';
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

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  endDate?: string;
  type: 'academic' | 'religious' | 'holiday' | 'exam' | 'event' | 'other' | 'deadline';
  color?: string;
  isHoliday?: boolean;
  createdAt: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const EMPTY_FORM = {
  title: '',
  description: '',
  date: '',
  endDate: '',
  type: 'event' as CalendarEvent['type'],
  color: '#059669',
};

/* DB type values stay in English; labels are resolved via t() at render time. */
const TYPE_CONFIG: Record<string, { labelKey: string; color: string; bg: string }> = {
  holiday: { labelKey: 'adminCalendar.typeHoliday', color: 'text-red-700', bg: 'bg-red-100 border-red-200' },
  exam: { labelKey: 'adminCalendar.typeExam', color: 'text-purple-700', bg: 'bg-purple-100 border-purple-200' },
  event: { labelKey: 'adminCalendar.typeEvent', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-200' },
  deadline: { labelKey: 'adminCalendar.typeDeadline', color: 'text-orange-700', bg: 'bg-orange-100 border-orange-200' },
  academic: { labelKey: 'adminCalendar.typeAcademic', color: 'text-green-700', bg: 'bg-green-100 border-green-200' },
};

const COLOR_OPTIONS = [
  { value: '#059669', labelKey: 'adminCalendar.colorGreen' },
  { value: '#2563eb', labelKey: 'adminCalendar.colorBlue' },
  { value: '#9333ea', labelKey: 'adminCalendar.colorPurple' },
  { value: '#dc2626', labelKey: 'adminCalendar.colorRed' },
  { value: '#ea580c', labelKey: 'adminCalendar.colorOrange' },
  { value: '#ca8a04', labelKey: 'adminCalendar.colorYellow' },
  { value: '#0891b2', labelKey: 'adminCalendar.colorCyan' },
  { value: '#64748b', labelKey: 'adminCalendar.colorGray' },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminCalendar() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filterType, setFilterType] = useState('all');
  const [filterMonth, setFilterMonth] = useState('');

  /* Dialog */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CalendarEvent | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  /* Delete */
  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* Subscribe */
  useEffect(() => {
    const unsub = dbSubscribe('/calendarEvents', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list: CalendarEvent[] = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        }));
        list.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        setEvents(list);
      } else {
        setEvents([]);
      }
    });
    return unsub;
  }, []);

  /* Filtered events */
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (filterType !== 'all' && e.type !== filterType) return false;
      if (filterMonth) {
        const eventMonth = e.date?.substring(0, 7);
        if (eventMonth !== filterMonth) return false;
      }
      return true;
    });
  }, [events, filterType, filterMonth]);

  /* Handlers */
  const resetAndOpen = useCallback(() => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((item: CalendarEvent) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      description: item.description,
      date: item.date,
      endDate: item.endDate || '',
      type: item.type,
      color: item.color || '#059669',
    });
    setDialogOpen(true);
  }, []);

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.date) {
      toast({ title: t('common.error'), description: t('adminCalendar.requiredFields'), variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      if (editingItem) {
        await dbUpdate('/calendarEvents/' + editingItem.id, {
          title: form.title.trim(),
          description: form.description.trim(),
          date: form.date,
          endDate: form.endDate,
          type: form.type,
          color: form.color,
        });
        toast({ title: t('common.success'), description: t('adminCalendar.updated') });
      } else {
        await dbPush('/calendarEvents', {
          title: form.title.trim(),
          description: form.description.trim(),
          date: form.date,
          endDate: form.endDate,
          type: form.type,
          color: form.color,
          createdAt: Date.now(),
        });
        toast({ title: t('common.success'), description: t('adminCalendar.created') });
      }
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      setEditingItem(null);
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
      await dbRemove('/calendarEvents/' + deleteTarget.id);
      toast({ title: t('common.success'), description: t('adminCalendar.deleted') });
      setDeleteTarget(null);
    } catch {
      toast({ title: t('common.error'), description: t('common.deleteFailed'), variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  /* Format date to Bengali-readable */
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-islamic-dark">{t('calendar.title')}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t('adminCalendar.count', { count: events.length })}
          </p>
        </div>
        <Button
          onClick={resetAndOpen}
          className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
        >
          <Plus className="size-4" />
          {t('adminCalendar.addNew')}
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Filter className="size-3" /> {t('calendar.filterByType')}</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('calendar.allTypes')}</SelectItem>
                  <SelectItem value="holiday">{t('adminCalendar.typeHoliday')}</SelectItem>
                  <SelectItem value="exam">{t('adminCalendar.typeExam')}</SelectItem>
                  <SelectItem value="event">{t('adminCalendar.typeEvent')}</SelectItem>
                  <SelectItem value="deadline">{t('adminCalendar.typeDeadline')}</SelectItem>
                  <SelectItem value="academic">{t('adminCalendar.typeAcademic')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('adminCalendar.filterByMonth')}</Label>
              <Input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          {filteredEvents.length > 0 ? (
            <div className="divide-y">
              {filteredEvents.map((event) => {
                const config = TYPE_CONFIG[event.type] || TYPE_CONFIG.event;
                return (
                  <div key={event.id} className="flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors">
                    <div
                      className="w-1 self-stretch rounded-full shrink-0"
                      style={{ backgroundColor: event.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`${config.bg} ${config.color} text-xs hover:opacity-90`}>
                          {t(config.labelKey)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(event.date)}
                          {event.endDate && event.endDate !== event.date && ` — ${formatDate(event.endDate)}`}
                        </span>
                      </div>
                      <h3 className="font-medium text-sm text-islamic-dark">{event.title}</h3>
                      {event.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-islamic cursor-pointer"
                        onClick={() => openEdit(event)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-red-600 cursor-pointer"
                        onClick={() => setDeleteTarget(event)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <CalendarDays className="size-12 opacity-20 mb-3" />
              <p className="text-sm">{t('adminCalendar.noData')}</p>
              <p className="text-xs mt-1">{t('adminCalendar.noDataHint')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) { setEditingItem(null); setForm(EMPTY_FORM); }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-islamic-dark">
              {editingItem ? t('adminCalendar.editTitle') : t('adminCalendar.addNew')}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? t('adminCalendar.editDesc') : t('adminCalendar.addDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cal-title">{t('common.title')} *</Label>
              <Input
                id="cal-title"
                placeholder={t('adminCalendar.titlePlaceholder')}
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cal-desc">{t('common.description')}</Label>
              <Textarea
                id="cal-desc"
                placeholder={t('adminCalendar.descPlaceholder')}
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cal-date">{t('adminCalendar.startDate')} *</Label>
                <Input
                  id="cal-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cal-endDate">{t('adminCalendar.endDate')}</Label>
                <Input
                  id="cal-endDate"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('common.type')}</Label>
              <Select value={form.type} onValueChange={(val) => setForm((f) => ({ ...f, type: val as CalendarEvent['type'] }))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="holiday">{t('adminCalendar.typeHoliday')}</SelectItem>
                  <SelectItem value="exam">{t('adminCalendar.typeExam')}</SelectItem>
                  <SelectItem value="event">{t('adminCalendar.typeEvent')}</SelectItem>
                  <SelectItem value="deadline">{t('adminCalendar.typeDeadline')}</SelectItem>
                  <SelectItem value="academic">{t('adminCalendar.typeAcademic')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('adminCalendar.colorLabel')}</Label>
              <div className="flex gap-2 flex-wrap">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${
                      form.color === c.value ? 'border-islamic-dark scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={t(c.labelKey)}
                    onClick={() => setForm((f) => ({ ...f, color: c.value }))}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); setEditingItem(null); setForm(EMPTY_FORM); }}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {editingItem ? t('common.update') : t('common.save')}
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
              {t('adminCalendar.deleteDesc', { title: deleteTarget?.title ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white gap-2 cursor-pointer"
            >
              {deleting && <Loader2 className="size-4 animate-spin" />}
              {t('common.confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
