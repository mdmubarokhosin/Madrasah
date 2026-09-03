'use client';

import { useState } from 'react';
import { CalendarPlus, Trash2, Edit2, Plus, Search, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { dbPush, dbRemove, dbUpdate } from '@/lib/db-service';
import { toML, loc, type MLValue } from '@/lib/multilingual';
import { MLInput, MLTextarea } from '@/components/admin/MLFields';
import { useToast } from '@/hooks/use-toast';
import type { Event } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

/* DB values stay in English; display labels are resolved via t() at render time. */
const eventTypeLabelKeys: Record<string, string> = {
  academic: 'adminEvents.typeAcademic',
  religious: 'adminEvents.typeReligious',
  cultural: 'adminEvents.typeCultural',
  sports: 'adminEvents.typeSports',
  other: 'adminEvents.typeOther',
};

const eventTypeColors: Record<string, string> = {
  academic: 'bg-blue-100 text-blue-700 border-blue-200',
  religious: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cultural: 'bg-purple-100 text-purple-700 border-purple-200',
  sports: 'bg-orange-100 text-orange-700 border-orange-200',
  other: 'bg-gray-100 text-gray-700 border-gray-200',
};

interface EventForm {
  title: MLValue;
  description: MLValue;
  location: MLValue;
  date: string;
  time: string;
  type: Event['type'];
  important: boolean;
}

const emptyEvent: EventForm = {
  title: { bn: '', en: '', ar: '' },
  description: { bn: '', en: '', ar: '' },
  location: { bn: '', en: '', ar: '' },
  date: '',
  time: '',
  type: 'academic',
  important: false,
};

export default function AdminEvents() {
  const { events, logActivity } = useAppStore();
  const { toast } = useToast();
  const { t, language } = useTranslation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [form, setForm] = useState(emptyEvent);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = events.filter((e) =>
    loc(language, e, 'title').toLowerCase().includes(search.toLowerCase()) ||
    e.date.includes(search)
  );

  const openNew = () => {
    setEditingEvent(null);
    setForm(emptyEvent);
    setDialogOpen(true);
  };

  const openEdit = (event: Event) => {
    setEditingEvent(event);
    setForm({
      title: toML(event, 'title'),
      description: toML(event, 'description'),
      date: event.date,
      time: event.time,
      location: toML(event, 'location'),
      type: event.type,
      important: event.important,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.bn.trim() || !form.date) {
      toast({ title: t('common.error'), description: t('adminEvents.requiredFields'), variant: 'destructive' });
      return;
    }
    const payload = {
      title: form.title.bn.trim(),
      titleEn: form.title.en.trim(),
      titleAr: form.title.ar.trim(),
      description: form.description.bn.trim(),
      descriptionEn: form.description.en.trim(),
      descriptionAr: form.description.ar.trim(),
      date: form.date,
      time: form.time,
      location: form.location.bn.trim(),
      locationEn: form.location.en.trim(),
      locationAr: form.location.ar.trim(),
      type: form.type,
      important: form.important,
    };
    setSaving(true);
    try {
      if (editingEvent) {
        await dbUpdate(`/events/${editingEvent.id}`, payload);
        toast({ title: t('common.success'), description: t('adminEvents.updated') });
        logActivity('ইভেন্ট', `"${payload.title}" ইভেন্ট আপডেট করা হয়েছে`);
      } else {
        await dbPush('/events', { ...payload, createdAt: Date.now() });
        toast({ title: t('common.success'), description: t('adminEvents.created') });
        logActivity('ইভেন্ট', `নতুন ইভেন্ট "${payload.title}" যোগ করা হয়েছে`);
      }
      setDialogOpen(false);
    } catch {
      toast({ title: t('common.error'), description: t('common.saveFailed'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    setDeleting(id);
    try {
      await dbRemove(`/events/${id}`);
      toast({ title: t('common.success'), description: t('adminEvents.deleted') });
      logActivity('ইভেন্ট', `"${title}" ইভেন্ট মুছে ফেলা হয়েছে`);
    } catch {
      toast({ title: t('common.error'), description: t('common.deleteFailed'), variant: 'destructive' });
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-islamic-dark">{t('adminEvents.title')}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t('adminEvents.subtitle')}
          </p>
        </div>
        <Button onClick={openNew} className="bg-islamic hover:bg-islamic-light text-white gap-2">
          <Plus className="w-4 h-4" />
          {t('adminEvents.addNew')}
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t('adminEvents.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Events Grid */}
      {filtered.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((event) => (
            <Card key={event.id} className="border-gray-100 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <Badge className={`${eventTypeColors[event.type]} text-xs`}>
                    {eventTypeLabelKeys[event.type] ? t(eventTypeLabelKeys[event.type]) : event.type}
                  </Badge>
                  {event.important && (
                    <span className="text-golden text-xs font-bold">{t('adminEvents.important')}</span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-islamic-dark mb-1">{loc(language, event, 'title')}</h3>
                {loc(language, event, 'description') && (
                  <p className="text-xs text-gray-500 line-clamp-2 mb-2">{loc(language, event, 'description')}</p>
                )}
                <p className="text-xs text-islamic font-medium mb-3">{formatDate(event.date)}</p>
                {event.time && <p className="text-xs text-gray-400 mb-1">{t('common.time')}: {event.time}</p>}
                {loc(language, event, 'location') && <p className="text-xs text-gray-400 mb-3">{t('common.location')}: {loc(language, event, 'location')}</p>}
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(event)}
                    className="gap-1 text-xs flex-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    {t('common.edit')}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(event.id, loc(language, event, 'title'))}
                    disabled={deleting === event.id}
                    className="gap-1 text-xs"
                  >
                    {deleting === event.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <CalendarPlus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-muted-foreground">{search ? t('adminEvents.notFound') : t('adminEvents.empty')}</p>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg text-islamic-dark">
              {editingEvent ? t('adminEvents.editTitle') : t('adminEvents.addNew')}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {editingEvent ? t('adminEvents.editDesc') : t('adminEvents.addDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <MLInput
              label={t('common.title')}
              required
              placeholder={t('adminEvents.titlePlaceholder')}
              value={form.title}
              onChange={(v) => setForm((f) => ({ ...f, title: v }))}
            />
            <MLTextarea
              label={t('common.description')}
              rows={3}
              placeholder={t('adminEvents.descPlaceholder')}
              value={form.description}
              onChange={(v) => setForm((f) => ({ ...f, description: v }))}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('common.date')} *</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('common.time')}</Label>
                <Input
                  value={form.time}
                  onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                  placeholder={t('adminEvents.timePlaceholder')}
                />
              </div>
            </div>
            <MLInput
              label={t('common.location')}
              placeholder={t('adminEvents.locationPlaceholder')}
              value={form.location}
              onChange={(v) => setForm((f) => ({ ...f, location: v }))}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('common.type')}</Label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'other' | 'academic' | 'religious' | 'cultural' | 'sports' }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {Object.entries(eventTypeLabelKeys).map(([key, labelKey]) => (
                    <option key={key} value={key}>{t(labelKey)}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2 pb-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.important}
                    onChange={(e) => setForm((f) => ({ ...f, important: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  {t('adminEvents.important')}
                </label>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline">{t('common.cancel')}</Button>
            </DialogClose>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-islamic hover:bg-islamic-light text-white gap-1.5"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editingEvent ? t('common.update') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
