'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  BedDouble,
  Utensils,
  Users,
  DoorOpen,
  Loader2,
  XCircle,
  Search,
  ClipboardList,
  Coffee,
  UtensilsCrossed,
  MoonStar,
  CalendarDays,
  Info,
} from 'lucide-react';
import { dbPush, dbUpdate, dbRemove, dbSubscribe } from '@/lib/db-service';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/lib/i18n-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { StatCard } from '@/components/heroui/islamic';
import { cn } from '@/lib/utils';
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
import type { HostelRoom, HostelAllocation, HostelMeal } from '@/types/database';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ROOM_TYPES = ['single', 'double', 'triple', 'dorm'];
const ROOM_STATUS = ['available', 'full', 'maintenance'];

// Day keys are stored in Firebase as English day names; only the
// displayed label is translated via t('adminHostel.dayX').
const DAY_KEYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Canonical madrasa week order (Saturday → Friday) for meal lists
const DAY_SORT_INDEX: Record<string, number> = {
  Saturday: 0, Sunday: 1, Monday: 2, Tuesday: 3, Wednesday: 4, Thursday: 5, Friday: 6,
};

const EMPTY_ROOM_FORM = {
  roomNumber: '',
  floor: '',
  capacity: '2',
  type: 'double',
  status: 'available',
};

const EMPTY_ALLOCATION_FORM = {
  studentName: '',
  studentRoll: '',
  roomNumber: '',
  bedNumber: '',
};

const EMPTY_MEAL_FORM = {
  day: 'Saturday',
  date: '',
  breakfast: '',
  lunch: '',
  dinner: '',
};

type AllocStatusFilter = 'all' | 'active' | 'released';

/* ------------------------------------------------------------------ */
/*  Small local UI helpers                                             */
/* ------------------------------------------------------------------ */

function OccupancyBar({ occ, cap, className }: { occ: number; cap: number; className?: string }) {
  const pct = cap > 0 ? Math.min((occ / cap) * 100, 100) : 0;
  const tone = cap <= 0
    ? 'bg-muted-foreground/40'
    : occ >= cap
      ? 'bg-danger'
      : occ >= cap * 0.8
        ? 'bg-warning'
        : 'bg-islamic';
  return (
    <div className={cn('w-full bg-surface-tertiary rounded-full h-2 overflow-hidden', className)} role="presentation">
      <div className={cn('h-2 rounded-full transition-all duration-700', tone)} style={{ width: `${pct}%` }} />
    </div>
  );
}

function DialogSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-islamic dark:text-golden pt-1">
      <span aria-hidden="true" className="inline-block h-3.5 w-1 rounded-full bg-gradient-to-b from-golden to-islamic" />
      {children}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminHostel() {
  const { toast } = useToast();
  const { t } = useTranslation();

  /* Translated day labels (Firebase keeps English keys) */
  const DAY_LABELS: Record<string, string> = {
    Saturday: t('adminHostel.daySat'),
    Sunday: t('adminHostel.daySun'),
    Monday: t('adminHostel.dayMon'),
    Tuesday: t('adminHostel.dayTue'),
    Wednesday: t('adminHostel.dayWed'),
    Thursday: t('adminHostel.dayThu'),
    Friday: t('adminHostel.dayFri'),
  };
  const dayLabel = useCallback((day: string) => DAY_LABELS[day] || day, [DAY_LABELS]);

  /* Translated enum display labels (DB values stay English) */
  const roomTypeLabel = useCallback((type: string) =>
    type === 'single' ? t('adminHostel.typeSingle')
      : type === 'double' ? t('adminHostel.typeDouble')
        : type === 'triple' ? t('adminHostel.typeTriple')
          : t('adminHostel.typeDorm'), [t]);
  const roomStatusLabel = useCallback((status: string) =>
    status === 'available' ? t('adminHostel.statusAvailable')
      : status === 'full' ? t('adminHostel.statusFull')
        : t('adminHostel.statusMaintenance'), [t]);
  const allocStatusLabel = useCallback((status: string) =>
    status === 'active' ? t('common.active') : t('adminHostel.released'), [t]);

  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [allocations, setAllocations] = useState<HostelAllocation[]>([]);
  const [meals, setMeals] = useState<HostelMeal[]>([]);
  const [activeTab, setActiveTab] = useState<'rooms' | 'allocations' | 'meals'>('rooms');

  /* Search / filter state */
  const [roomSearch, setRoomSearch] = useState('');
  const [allocSearch, setAllocSearch] = useState('');
  const [allocFilter, setAllocFilter] = useState<AllocStatusFilter>('all');
  const [mealSearch, setMealSearch] = useState('');

  /* Room Dialog */
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<HostelRoom | null>(null);
  const [roomForm, setRoomForm] = useState(EMPTY_ROOM_FORM);
  const [roomSubmitting, setRoomSubmitting] = useState(false);

  /* Allocation Dialog */
  const [allocDialogOpen, setAllocDialogOpen] = useState(false);
  const [editingAlloc, setEditingAlloc] = useState<HostelAllocation | null>(null);
  const [allocForm, setAllocForm] = useState(EMPTY_ALLOCATION_FORM);
  const [allocSubmitting, setAllocSubmitting] = useState(false);

  /* Meal Dialog */
  const [mealDialogOpen, setMealDialogOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<HostelMeal | null>(null);
  const [mealForm, setMealForm] = useState(EMPTY_MEAL_FORM);
  const [mealSubmitting, setMealSubmitting] = useState(false);

  /* Delete */
  const [deleteTarget, setDeleteTarget] = useState<
    { type: 'room' | 'alloc' | 'meal'; item: HostelRoom | HostelAllocation | HostelMeal } | null
  >(null);
  const [deleting, setDeleting] = useState(false);

  /* Subscribe to data (RTDB paths unchanged) */
  useEffect(() => {
    const unsubRooms = dbSubscribe('/hostelRooms', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list: HostelRoom[] = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        }));
        setRooms(list);
      } else {
        setRooms([]);
      }
    });

    const unsubAllocs = dbSubscribe('/hostelAllocations', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list: HostelAllocation[] = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        }));
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setAllocations(list);
      } else {
        setAllocations([]);
      }
    });

    const unsubMeals = dbSubscribe('/hostelMeals', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list: HostelMeal[] = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        }));
        setMeals(list);
      } else {
        setMeals([]);
      }
    });

    return () => { unsubRooms(); unsubAllocs(); unsubMeals(); };
  }, []);

  /* ───────────────────── Derived data ───────────────────── */

  const stats = useMemo(() => {
    const totalRooms = rooms.length;
    const availableRooms = rooms.filter((r) => r.status === 'available').length;
    const totalSeats = rooms.reduce((s, r) => s + (Number(r.capacity) || 0), 0);
    const occupiedSeats = rooms.reduce((s, r) => s + (Number(r.currentOccupants) || 0), 0);
    const activeAllocs = allocations.filter((a) => a.status === 'active').length;
    return { totalRooms, availableRooms, totalSeats, occupiedSeats, activeAllocs };
  }, [rooms, allocations]);

  /* Rooms: search-filtered, sorted by room number */
  const visibleRooms = useMemo(() => {
    const q = roomSearch.trim().toLowerCase();
    const list = q
      ? rooms.filter((r) =>
        String(r.roomNumber || '').toLowerCase().includes(q) ||
        String(r.floor || '').toLowerCase().includes(q) ||
        roomTypeLabel(r.type).toLowerCase().includes(q))
      : rooms;
    return [...list].sort((a, b) =>
      String(a.roomNumber).localeCompare(String(b.roomNumber), undefined, { numeric: true }));
  }, [rooms, roomSearch, roomTypeLabel]);

  /* Allocations: status filter + search */
  const visibleAllocs = useMemo(() => {
    const q = allocSearch.trim().toLowerCase();
    return allocations.filter((a) => {
      if (allocFilter !== 'all' && a.status !== allocFilter) return false;
      if (!q) return true;
      return (
        String(a.studentName || '').toLowerCase().includes(q) ||
        String(a.studentRoll || '').toLowerCase().includes(q) ||
        String(a.roomNumber || '').toLowerCase().includes(q)
      );
    });
  }, [allocations, allocFilter, allocSearch]);

  /* Meals: canonical week order (Sat → Fri), then date, then search */
  const visibleMeals = useMemo(() => {
    const q = mealSearch.trim().toLowerCase();
    const list = q
      ? meals.filter((m) =>
        dayLabel(m.day).toLowerCase().includes(q) ||
        String(m.day || '').toLowerCase().includes(q) ||
        String(m.breakfast || '').toLowerCase().includes(q) ||
        String(m.lunch || '').toLowerCase().includes(q) ||
        String(m.dinner || '').toLowerCase().includes(q))
      : meals;
    return [...list].sort((a, b) => {
      const d = (DAY_SORT_INDEX[a.day] ?? 9) - (DAY_SORT_INDEX[b.day] ?? 9);
      return d !== 0 ? d : String(a.date || '').localeCompare(String(b.date || ''));
    });
  }, [meals, mealSearch, dayLabel]);

  /* Rooms offered in the allocation dialog: available rooms, plus the
     currently-assigned room when editing (so it stays selectable). */
  const allocRoomOptions = useMemo(() => {
    const opts = rooms.filter((r) => r.status === 'available');
    if (editingAlloc) {
      const current = rooms.find((r) => r.id === editingAlloc.roomId);
      if (current && !opts.some((o) => o.id === current.id)) opts.unshift(current);
    }
    return opts;
  }, [rooms, editingAlloc]);

  const selectedAllocRoom = useMemo(
    () => rooms.find((r) => r.roomNumber === allocForm.roomNumber),
    [rooms, allocForm.roomNumber]
  );
  const nextBedNo = selectedAllocRoom ? (selectedAllocRoom.currentOccupants || 0) + 1 : null;

  /* ───────────────────── Room handlers ───────────────────── */

  const resetAndOpenRoom = useCallback(() => {
    setEditingRoom(null);
    setRoomForm(EMPTY_ROOM_FORM);
    setRoomDialogOpen(true);
  }, []);

  const openEditRoom = useCallback((room: HostelRoom) => {
    setEditingRoom(room);
    setRoomForm({
      roomNumber: room.roomNumber,
      floor: room.floor,
      capacity: String(room.capacity),
      type: room.type,
      status: room.status,
    });
    setRoomDialogOpen(true);
  }, []);

  const handleSubmitRoom = async () => {
    if (!roomForm.roomNumber.trim()) {
      toast({ title: t('common.error'), description: t('adminHostel.roomNumberRequired'), variant: 'destructive' });
      return;
    }
    const capacityNum = Number(roomForm.capacity);
    if (!Number.isFinite(capacityNum) || capacityNum < 1 || capacityNum > 20) {
      toast({ title: t('common.error'), description: t('adminHostel.capacityInvalid'), variant: 'destructive' });
      return;
    }
    setRoomSubmitting(true);
    try {
      const payload = {
        roomNumber: roomForm.roomNumber.trim(),
        floor: roomForm.floor.trim(),
        capacity: Math.round(capacityNum),
        type: roomForm.type,
        status: roomForm.status,
      };
      if (editingRoom) {
        await dbUpdate('/hostelRooms/' + editingRoom.id, payload);
        toast({ title: t('common.success'), description: t('adminHostel.roomUpdated') });
      } else {
        await dbPush('/hostelRooms', { ...payload, currentOccupants: 0, createdAt: Date.now() });
        toast({ title: t('common.success'), description: t('adminHostel.roomCreated') });
      }
      setRoomDialogOpen(false);
      setRoomForm(EMPTY_ROOM_FORM);
      setEditingRoom(null);
    } catch {
      toast({ title: t('common.error'), description: t('common.operationFailed'), variant: 'destructive' });
    } finally {
      setRoomSubmitting(false);
    }
  };

  /* ───────────────────── Allocation handlers ───────────────────── */

  const resetAndOpenAlloc = useCallback(() => {
    setEditingAlloc(null);
    setAllocForm(EMPTY_ALLOCATION_FORM);
    setAllocDialogOpen(true);
  }, []);

  const openEditAlloc = useCallback((alloc: HostelAllocation) => {
    setEditingAlloc(alloc);
    setAllocForm({
      studentName: alloc.studentName || '',
      studentRoll: alloc.studentRoll || '',
      roomNumber: alloc.roomNumber || '',
      bedNumber: alloc.bedNumber || '',
    });
    setAllocDialogOpen(true);
  }, []);

  const handleSubmitAlloc = async () => {
    if (!allocForm.studentName.trim() || !allocForm.roomNumber.trim()) {
      toast({ title: t('common.error'), description: t('adminHostel.allocFieldsRequired'), variant: 'destructive' });
      return;
    }
    const selectedRoom = rooms.find((r) => r.roomNumber === allocForm.roomNumber);
    if (!selectedRoom) {
      toast({ title: t('common.error'), description: t('adminHostel.selectRoom'), variant: 'destructive' });
      return;
    }

    /* Seat-capacity guards (create, or edit that moves an active allocation) */
    const roomChanged = !!editingAlloc && selectedRoom.id !== editingAlloc.roomId;
    const seatMoves = !editingAlloc || (roomChanged && editingAlloc.status === 'active');
    if (seatMoves) {
      const hasFreeSeat = (selectedRoom.currentOccupants || 0) + 1 <= (selectedRoom.capacity || 0);
      if (!hasFreeSeat) {
        toast({ title: t('common.error'), description: t('adminHostel.roomFull'), variant: 'destructive' });
        return;
      }
    }

    setAllocSubmitting(true);
    try {
      const payload = {
        studentName: allocForm.studentName.trim(),
        studentRoll: allocForm.studentRoll.trim(),
        studentId: editingAlloc?.studentId || '',
        roomId: selectedRoom.id,
        roomNumber: allocForm.roomNumber.trim(),
        bedNumber: allocForm.bedNumber.trim(),
        allocationDate: editingAlloc?.allocationDate || new Date().toISOString().split('T')[0],
        status: editingAlloc?.status || 'active',
        releasedDate: editingAlloc?.releasedDate || '',
      };

      if (editingAlloc) {
        await dbUpdate('/hostelAllocations/' + editingAlloc.id, payload);
        /* Keep room counters in sync when an active allocation switches rooms */
        const oldRoom = rooms.find((r) => r.id === editingAlloc.roomId);
        if (editingAlloc.status === 'active' && oldRoom && oldRoom.id !== selectedRoom.id) {
          const decOcc = Math.max(0, (oldRoom.currentOccupants || 0) - 1);
          await dbUpdate('/hostelRooms/' + oldRoom.id, {
            currentOccupants: decOcc,
            status: decOcc >= oldRoom.capacity ? 'full' : 'available',
          });
          const incOcc = (selectedRoom.currentOccupants || 0) + 1;
          await dbUpdate('/hostelRooms/' + selectedRoom.id, {
            currentOccupants: incOcc,
            status: incOcc >= selectedRoom.capacity ? 'full' : 'available',
          });
        }
        toast({ title: t('common.success'), description: t('adminHostel.allocUpdated') });
      } else {
        await dbPush('/hostelAllocations', { ...payload, createdAt: Date.now() });
        const newOcc = (selectedRoom.currentOccupants || 0) + 1;
        await dbUpdate('/hostelRooms/' + selectedRoom.id, {
          currentOccupants: newOcc,
          status: newOcc >= selectedRoom.capacity ? 'full' : 'available',
        });
        toast({ title: t('common.success'), description: t('adminHostel.allocCreated') });
      }
      setAllocDialogOpen(false);
      setAllocForm(EMPTY_ALLOCATION_FORM);
      setEditingAlloc(null);
    } catch {
      toast({ title: t('common.error'), description: t('common.operationFailed'), variant: 'destructive' });
    } finally {
      setAllocSubmitting(false);
    }
  };

  const handleReleaseAlloc = async (alloc: HostelAllocation) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await dbUpdate('/hostelAllocations/' + alloc.id, { status: 'released', releasedDate: today });
      const room = rooms.find((r) => r.id === alloc.roomId);
      if (room) {
        const newOcc = Math.max(0, (room.currentOccupants || 0) - 1);
        await dbUpdate('/hostelRooms/' + room.id, { currentOccupants: newOcc, status: 'available' });
      }
      toast({ title: t('common.success'), description: t('adminHostel.allocReleased') });
    } catch {
      toast({ title: t('common.error'), description: t('adminHostel.releaseFailed'), variant: 'destructive' });
    }
  };

  /* ───────────────────── Meal handlers ───────────────────── */

  const resetAndOpenMeal = useCallback(() => {
    setEditingMeal(null);
    setMealForm(EMPTY_MEAL_FORM);
    setMealDialogOpen(true);
  }, []);

  const openEditMeal = useCallback((meal: HostelMeal) => {
    setEditingMeal(meal);
    setMealForm({
      day: meal.day,
      date: meal.date || '',
      breakfast: meal.breakfast || '',
      lunch: meal.lunch || '',
      dinner: meal.dinner || '',
    });
    setMealDialogOpen(true);
  }, []);

  const handleSubmitMeal = async () => {
    if (!mealForm.day) {
      toast({ title: t('common.error'), description: t('adminHostel.dayRequired'), variant: 'destructive' });
      return;
    }
    setMealSubmitting(true);
    try {
      const payload = {
        day: mealForm.day,
        date: mealForm.date || '',
        breakfast: mealForm.breakfast.trim(),
        lunch: mealForm.lunch.trim(),
        dinner: mealForm.dinner.trim(),
      };
      if (editingMeal) {
        await dbUpdate('/hostelMeals/' + editingMeal.id, payload);
        toast({ title: t('common.success'), description: t('adminHostel.mealUpdated') });
      } else {
        await dbPush('/hostelMeals', { ...payload, createdAt: Date.now() });
        toast({ title: t('common.success'), description: t('adminHostel.mealCreated') });
      }
      setMealDialogOpen(false);
      setMealForm(EMPTY_MEAL_FORM);
      setEditingMeal(null);
    } catch {
      toast({ title: t('common.error'), description: t('common.operationFailed'), variant: 'destructive' });
    } finally {
      setMealSubmitting(false);
    }
  };

  /* ───────────────────── Delete handler ───────────────────── */

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const path = deleteTarget.type === 'room' ? '/hostelRooms/' : deleteTarget.type === 'alloc' ? '/hostelAllocations/' : '/hostelMeals/';
      await dbRemove(path + deleteTarget.item.id);
      toast({ title: t('common.success'), description: t('common.deleted') });
      setDeleteTarget(null);
    } catch {
      toast({ title: t('common.error'), description: t('common.deleteFailed'), variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  /* ───────────────────── Render helpers ───────────────────── */

  const statCards = [
    { label: t('adminHostel.totalRooms'), value: stats.totalRooms, icon: DoorOpen, tone: 'emerald' as const },
    { label: t('adminHostel.statsTotalSeats'), value: stats.totalSeats, icon: BedDouble, tone: 'gold' as const },
    { label: t('adminHostel.statsOccupied'), value: stats.occupiedSeats, icon: Users, tone: 'emerald' as const },
    { label: t('adminHostel.statsActiveAlloc'), value: stats.activeAllocs, icon: ClipboardList, tone: 'gold' as const },
  ];

  const tabs = [
    { id: 'rooms' as const, icon: DoorOpen, label: t('adminHostel.tabRooms') },
    { id: 'allocations' as const, icon: Users, label: t('adminHostel.tabAllocations') },
    { id: 'meals' as const, icon: Utensils, label: t('adminHostel.tabMeals') },
  ];

  const allocFilterChips: { id: AllocStatusFilter; label: string }[] = [
    { id: 'all', label: t('adminHostel.filterAll') },
    { id: 'active', label: t('adminHostel.filterActive') },
    { id: 'released', label: t('adminHostel.filterReleased') },
  ];

  const SearchIcon = () => (
    <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
  );

  const NoResults = ({ icon: Icon, text, hint }: { icon: React.ComponentType<{ className?: string }>; text: string; hint?: string }) => (
    <div className="col-span-full flex flex-col items-center justify-center py-14 text-muted-foreground rounded-2xl border border-dashed border-islamic/20">
      <Icon className="size-12 opacity-20 mb-3" />
      <p className="text-sm font-medium">{text}</p>
      {hint ? <p className="text-xs mt-1 opacity-80">{hint}</p> : null}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* ───────────── Header + segmented tabs ───────────── */}
      <div>
        <h2 className="text-2xl font-bold text-islamic-dark">{t('adminHostel.title')}</h2>
        <p className="text-muted-foreground text-sm mt-1">
          {t('adminHostel.subtitle')}
        </p>

        <div
          role="tablist"
          aria-label={t('adminHostel.title')}
          className="mt-4 grid grid-cols-3 gap-1.5 rounded-2xl bg-surface-tertiary/60 p-1.5 ring-1 ring-islamic/10"
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden/60 active:scale-[0.98]',
                  active
                    ? 'bg-gradient-to-r from-islamic to-islamic-dark text-white shadow-md shadow-islamic/25'
                    : 'text-islamic-dark hover:bg-islamic/10'
                )}
              >
                <tab.icon className="size-4 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ───────────── Summary stat cards ───────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((stat, i) => (
          <StatCard key={i} icon={stat.icon} value={String(stat.value)} label={stat.label} tone={stat.tone} className="rounded-2xl dark:bg-card dark:ring-border" />
        ))}
      </div>

      {/* ══════════════════════ ROOMS ══════════════════════ */}
      {activeTab === 'rooms' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <SearchIcon />
              <Input
                type="search"
                value={roomSearch}
                onChange={(e) => setRoomSearch(e.target.value)}
                placeholder={t('adminHostel.searchRooms')}
                aria-label={t('adminHostel.searchRooms')}
                className="ps-9 min-h-11"
              />
            </div>
            <Button
              onClick={resetAndOpenRoom}
              className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer min-h-11 shrink-0"
            >
              <Plus className="size-4" />
              {t('adminHostel.addRoom')}
            </Button>
          </div>

          {/* Desktop table */}
          <Card className="shadow-sm hidden md:block">
            <CardContent className="p-0">
              {visibleRooms.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminHostel.roomNumber')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminHostel.floor')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('common.type')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground min-w-44">{t('adminHostel.occupancyLabel')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground text-center">{t('common.status')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground text-end">{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleRooms.map((room) => {
                        const occ = Math.min(room.currentOccupants || 0, room.capacity || 0);
                        const free = Math.max(0, (room.capacity || 0) - (room.currentOccupants || 0));
                        return (
                          <TableRow key={room.id}>
                            <TableCell className="font-medium text-sm text-islamic-dark py-3">{room.roomNumber}</TableCell>
                            <TableCell className="text-sm py-3 text-muted-foreground">{room.floor || '—'}</TableCell>
                            <TableCell className="text-sm py-3 text-muted-foreground">{roomTypeLabel(room.type)}</TableCell>
                            <TableCell className="py-3">
                              <div className="flex items-center gap-2">
                                <OccupancyBar occ={occ} cap={room.capacity || 0} className="flex-1 min-w-24" />
                                <span className="text-xs font-semibold text-islamic-dark whitespace-nowrap">
                                  {room.currentOccupants || 0}/{room.capacity}
                                </span>
                                <Badge variant="secondary" className="text-[10px] whitespace-nowrap hidden xl:inline-flex">
                                  {t('adminHostel.freeSeats', { count: free })}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 text-center">
                              <Badge className={`text-xs ${
                                room.status === 'available' ? 'bg-primary/10 text-primary border-primary/25' :
                                room.status === 'full' ? 'bg-danger/10 text-danger border-danger/40' :
                                'bg-warning/20 text-warning-foreground border-warning/40'
                              }`}>
                                {roomStatusLabel(room.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-3 text-end">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-islamic cursor-pointer" onClick={() => openEditRoom(room)} aria-label={t('adminHostel.editRoom')}>
                                  <Pencil className="size-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-danger cursor-pointer" onClick={() => setDeleteTarget({ type: 'room', item: room })} aria-label={t('common.delete')}>
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <BedDouble className="size-12 opacity-20 mb-3" />
                  <p className="text-sm font-medium">
                    {rooms.length === 0 ? t('adminHostel.noRooms') : t('adminHostel.noSearchResults')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mobile cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
            {visibleRooms.length > 0 ? visibleRooms.map((room) => {
              const occ = Math.min(room.currentOccupants || 0, room.capacity || 0);
              const free = Math.max(0, (room.capacity || 0) - (room.currentOccupants || 0));
              return (
                <Card key={room.id} className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm truncate">{room.roomNumber}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{roomTypeLabel(room.type)} • {room.floor || '—'}</p>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button variant="ghost" size="icon" className="size-11 md:size-8 text-muted-foreground hover:text-islamic" onClick={() => openEditRoom(room)} aria-label={t('adminHostel.editRoom')}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-11 md:size-8 text-muted-foreground hover:text-danger" onClick={() => setDeleteTarget({ type: 'room', item: room })} aria-label={t('common.delete')}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3">
                      <OccupancyBar occ={occ} cap={room.capacity || 0} />
                      <div className="flex items-center justify-between gap-2 mt-1.5 text-[11px]">
                        <span className="font-semibold text-islamic-dark">{room.currentOccupants || 0}/{room.capacity}</span>
                        <span className="text-muted-foreground">{t('adminHostel.freeSeats', { count: free })}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        room.status === 'available' ? 'bg-primary/10 text-primary' :
                        room.status === 'full' ? 'bg-danger/10 text-danger' :
                        'bg-warning/20 text-warning-foreground'
                      }`}>{roomStatusLabel(room.status)}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            }) : (
              <NoResults icon={BedDouble} text={rooms.length === 0 ? t('adminHostel.noRooms') : t('adminHostel.noSearchResults')} />
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════ ALLOCATIONS ══════════════════════ */}
      {activeTab === 'allocations' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1">
                <SearchIcon />
                <Input
                  type="search"
                  value={allocSearch}
                  onChange={(e) => setAllocSearch(e.target.value)}
                  placeholder={t('adminHostel.searchAllocs')}
                  aria-label={t('adminHostel.searchAllocs')}
                  className="ps-9 min-h-11"
                />
              </div>
              <Button
                onClick={resetAndOpenAlloc}
                className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer min-h-11 shrink-0"
              >
                <Plus className="size-4" />
                {t('adminHostel.addAllocation')}
              </Button>
            </div>
            {/* Status filter chips */}
            <div className="flex flex-wrap gap-2" role="group" aria-label={t('common.status')}>
              {allocFilterChips.map((chip) => {
                const active = allocFilter === chip.id;
                const count = chip.id === 'all'
                  ? allocations.length
                  : allocations.filter((a) => a.status === chip.id).length;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setAllocFilter(chip.id)}
                    aria-pressed={active}
                    className={cn(
                      'inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden/60 active:scale-[0.97]',
                      active
                        ? 'bg-islamic text-white shadow-md shadow-islamic/25'
                        : 'bg-card text-islamic-dark ring-1 ring-islamic/15 hover:ring-islamic/35'
                    )}
                  >
                    {chip.label}
                    <span className={cn(
                      'inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-bold',
                      active ? 'bg-white/20 text-white' : 'bg-islamic-lighter text-islamic-dark'
                    )}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desktop table */}
          <Card className="shadow-sm hidden md:block">
            <CardContent className="p-0">
              {visibleAllocs.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminHostel.student')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminHostel.room')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminHostel.bed')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('common.date')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground text-center">{t('common.status')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground text-end">{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleAllocs.map((alloc) => (
                        <TableRow key={alloc.id}>
                          <TableCell className="py-3">
                            <p className="font-medium text-sm text-islamic-dark">{alloc.studentName}</p>
                            <p className="text-xs text-muted-foreground">{t('adminHostel.roll', { roll: alloc.studentRoll || '—' })}</p>
                          </TableCell>
                          <TableCell className="text-sm py-3 text-muted-foreground">{alloc.roomNumber}</TableCell>
                          <TableCell className="text-sm py-3 text-muted-foreground">{alloc.bedNumber || '—'}</TableCell>
                          <TableCell className="text-sm py-3 text-muted-foreground">{alloc.allocationDate || '—'}</TableCell>
                          <TableCell className="py-3 text-center">
                            <Badge className={`text-xs ${
                              alloc.status === 'active' ? 'bg-primary/10 text-primary border-primary/25' :
                              'bg-danger/10 text-danger border-danger/40'
                            }`}>
                              {allocStatusLabel(alloc.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 text-end">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-islamic cursor-pointer" onClick={() => openEditAlloc(alloc)} aria-label={t('adminHostel.editAllocation')}>
                                <Pencil className="size-4" />
                              </Button>
                              {alloc.status === 'active' && (
                                <Button size="sm" variant="outline" onClick={() => handleReleaseAlloc(alloc)} className="text-xs gap-1 cursor-pointer text-warning-foreground hover:text-warning-foreground">
                                  <XCircle className="size-3" />
                                  {t('adminHostel.release')}
                                </Button>
                              )}
                              {alloc.status === 'released' && (
                                <span className="text-xs text-muted-foreground">{alloc.releasedDate}</span>
                              )}
                              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-danger cursor-pointer" onClick={() => setDeleteTarget({ type: 'alloc', item: alloc })} aria-label={t('common.delete')}>
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Users className="size-12 opacity-20 mb-3" />
                  <p className="text-sm font-medium">
                    {allocations.length === 0 ? t('adminHostel.noAllocations') : t('adminHostel.noSearchResults')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mobile cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
            {visibleAllocs.length > 0 ? visibleAllocs.map((alloc) => (
              <Card key={alloc.id} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm truncate">{alloc.studentName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t('adminHostel.rollRoom', { roll: alloc.studentRoll || '—', room: alloc.roomNumber })}</p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button variant="ghost" size="icon" className="size-11 md:size-8 text-muted-foreground hover:text-islamic" onClick={() => openEditAlloc(alloc)} aria-label={t('adminHostel.editAllocation')}>
                        <Pencil className="size-4" />
                      </Button>
                      {alloc.status === 'active' && (
                        <Button variant="ghost" size="icon" className="size-11 md:size-8 text-warning-foreground" onClick={() => handleReleaseAlloc(alloc)} aria-label={t('adminHostel.release')}>
                          <XCircle className="size-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="size-11 md:size-8 text-muted-foreground hover:text-danger" onClick={() => setDeleteTarget({ type: 'alloc', item: alloc })} aria-label={t('common.delete')}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      alloc.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-danger/10 text-danger'
                    }`}>{allocStatusLabel(alloc.status)}</span>
                    {alloc.bedNumber && <span className="inline-flex items-center rounded-full bg-surface-tertiary px-2 py-0.5 text-[10px] font-medium">{t('adminHostel.bedValue', { bed: alloc.bedNumber })}</span>}
                    {alloc.allocationDate && <span className="inline-flex items-center rounded-full bg-surface-tertiary px-2 py-0.5 text-[10px] font-medium">{alloc.allocationDate}</span>}
                  </div>
                </CardContent>
              </Card>
            )) : (
              <NoResults icon={Users} text={allocations.length === 0 ? t('adminHostel.noAllocations') : t('adminHostel.noSearchResults')} />
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════ MEALS ══════════════════════ */}
      {activeTab === 'meals' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <SearchIcon />
              <Input
                type="search"
                value={mealSearch}
                onChange={(e) => setMealSearch(e.target.value)}
                placeholder={t('adminHostel.searchMeals')}
                aria-label={t('adminHostel.searchMeals')}
                className="ps-9 min-h-11"
              />
            </div>
            <Button
              onClick={resetAndOpenMeal}
              className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer min-h-11 shrink-0"
            >
              <Plus className="size-4" />
              {t('adminHostel.addMeal')}
            </Button>
          </div>

          {/* Desktop table */}
          <Card className="shadow-sm hidden md:block">
            <CardContent className="p-0">
              {visibleMeals.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminHostel.day')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('common.date')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminHostel.breakfast')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminHostel.lunch')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminHostel.dinner')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground text-end">{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleMeals.map((meal) => (
                        <TableRow key={meal.id}>
                          <TableCell className="font-medium text-sm text-islamic-dark py-3">{dayLabel(meal.day)}</TableCell>
                          <TableCell className="text-sm py-3 text-muted-foreground">{meal.date || '—'}</TableCell>
                          <TableCell className="text-sm py-3 text-muted-foreground">{meal.breakfast || '—'}</TableCell>
                          <TableCell className="text-sm py-3 text-muted-foreground">{meal.lunch || '—'}</TableCell>
                          <TableCell className="text-sm py-3 text-muted-foreground">{meal.dinner || '—'}</TableCell>
                          <TableCell className="py-3 text-end">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-islamic cursor-pointer" onClick={() => openEditMeal(meal)} aria-label={t('adminHostel.editMeal')}>
                                <Pencil className="size-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-danger cursor-pointer" onClick={() => setDeleteTarget({ type: 'meal', item: meal })} aria-label={t('common.delete')}>
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Utensils className="size-12 opacity-20 mb-3" />
                  <p className="text-sm font-medium">
                    {meals.length === 0 ? t('adminHostel.noMeals') : t('adminHostel.noSearchResults')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mobile cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
            {visibleMeals.length > 0 ? visibleMeals.map((meal) => (
              <Card key={meal.id} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm truncate">{dayLabel(meal.day)}</p>
                      {meal.date ? (
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <CalendarDays className="size-3" />
                          {meal.date}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button variant="ghost" size="icon" className="size-11 md:size-8 text-muted-foreground hover:text-islamic" onClick={() => openEditMeal(meal)} aria-label={t('adminHostel.editMeal')}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-11 md:size-8 text-muted-foreground hover:text-danger" onClick={() => setDeleteTarget({ type: 'meal', item: meal })} aria-label={t('common.delete')}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 mt-3 text-xs text-muted-foreground">
                    {meal.breakfast && (
                      <p className="flex items-center gap-1.5">
                        <Coffee className="size-3.5 text-golden shrink-0" />
                        <span className="font-medium">{t('adminHostel.breakfast')}:</span>
                        <span className="text-foreground truncate">{meal.breakfast}</span>
                      </p>
                    )}
                    {meal.lunch && (
                      <p className="flex items-center gap-1.5">
                        <UtensilsCrossed className="size-3.5 text-golden shrink-0" />
                        <span className="font-medium">{t('adminHostel.lunch')}:</span>
                        <span className="text-foreground truncate">{meal.lunch}</span>
                      </p>
                    )}
                    {meal.dinner && (
                      <p className="flex items-center gap-1.5">
                        <MoonStar className="size-3.5 text-golden shrink-0" />
                        <span className="font-medium">{t('adminHostel.dinner')}:</span>
                        <span className="text-foreground truncate">{meal.dinner}</span>
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )) : (
              <NoResults icon={Utensils} text={meals.length === 0 ? t('adminHostel.noMeals') : t('adminHostel.noSearchResults')} />
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════ Room Dialog ══════════════════════ */}
      <Dialog open={roomDialogOpen} onOpenChange={(open) => {
        setRoomDialogOpen(open);
        if (!open) { setEditingRoom(null); setRoomForm(EMPTY_ROOM_FORM); }
      }}>
        <DialogContent className="sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-islamic-dark">
              {editingRoom ? t('adminHostel.editRoom') : t('adminHostel.addRoom')}
            </DialogTitle>
            <DialogDescription>
              {editingRoom ? t('adminHostel.editRoomDesc') : t('adminHostel.addRoomDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <DialogSectionLabel>{t('adminHostel.sectionRoomInfo')}</DialogSectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="room-number">{t('adminHostel.roomNumber')} *</Label>
                <Input id="room-number" placeholder={t('adminHostel.roomNumberPh')} value={roomForm.roomNumber} onChange={(e) => setRoomForm((f) => ({ ...f, roomNumber: e.target.value }))} className="min-h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="room-floor">{t('adminHostel.floor')}</Label>
                <Input id="room-floor" placeholder={t('adminHostel.floorPh')} value={roomForm.floor} onChange={(e) => setRoomForm((f) => ({ ...f, floor: e.target.value }))} className="min-h-11" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="room-type">{t('common.type')}</Label>
                <Select value={roomForm.type} onValueChange={(v) => setRoomForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger id="room-type" className="min-h-11"><SelectValue placeholder={t('adminHostel.selectType')} /></SelectTrigger>
                  <SelectContent>
                    {ROOM_TYPES.map((rt) => (
                      <SelectItem key={rt} value={rt}>{roomTypeLabel(rt)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="room-capacity">{t('adminHostel.capacity')} *</Label>
                <Input id="room-capacity" type="number" min={1} max={20} inputMode="numeric" placeholder="2" value={roomForm.capacity} onChange={(e) => setRoomForm((f) => ({ ...f, capacity: e.target.value }))} className="min-h-11" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="room-status">{t('common.status')}</Label>
              <Select value={roomForm.status} onValueChange={(v) => setRoomForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger id="room-status" className="min-h-11"><SelectValue placeholder={t('adminHostel.selectStatus')} /></SelectTrigger>
                <SelectContent>
                  {ROOM_STATUS.map((s) => (
                    <SelectItem key={s} value={s}>{roomStatusLabel(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editingRoom && (
              <div className="flex items-start gap-2 rounded-xl bg-islamic-lighter/60 px-3 py-2.5 text-xs text-islamic-dark">
                <Info className="size-4 shrink-0 mt-0.5" />
                <span>
                  {t('adminHostel.occupancyPercent', { percent: editingRoom.capacity > 0 ? Math.round(((editingRoom.currentOccupants || 0) / editingRoom.capacity) * 100) : 0 })} • {editingRoom.currentOccupants || 0}/{editingRoom.capacity}
                </span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRoomDialogOpen(false); setEditingRoom(null); setRoomForm(EMPTY_ROOM_FORM); }} className="min-h-11">{t('common.cancel')}</Button>
            <Button onClick={handleSubmitRoom} disabled={roomSubmitting} className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer min-h-11">
              {roomSubmitting && <Loader2 className="size-4 animate-spin" />}
              {editingRoom ? t('adminHostel.updateBtn') : t('settings.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════ Allocation Dialog ══════════════════════ */}
      <Dialog open={allocDialogOpen} onOpenChange={(open) => {
        setAllocDialogOpen(open);
        if (!open) { setEditingAlloc(null); setAllocForm(EMPTY_ALLOCATION_FORM); }
      }}>
        <DialogContent className="sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-islamic-dark">
              {editingAlloc ? t('adminHostel.editAllocation') : t('adminHostel.allocTitle')}
            </DialogTitle>
            <DialogDescription>
              {editingAlloc ? t('adminHostel.editAllocDesc') : t('adminHostel.allocDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <DialogSectionLabel>{t('adminHostel.sectionStudentInfo')}</DialogSectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="alloc-name">{t('adminHostel.studentName')}</Label>
                <Input id="alloc-name" placeholder={t('adminHostel.studentNamePh')} value={allocForm.studentName} onChange={(e) => setAllocForm((f) => ({ ...f, studentName: e.target.value }))} className="min-h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alloc-roll">{t('adminHostel.rollNumber')}</Label>
                <Input id="alloc-roll" placeholder={t('adminHostel.rollNumber')} value={allocForm.studentRoll} onChange={(e) => setAllocForm((f) => ({ ...f, studentRoll: e.target.value }))} className="min-h-11" />
              </div>
            </div>

            <DialogSectionLabel>{t('adminHostel.sectionAllocInfo')}</DialogSectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="alloc-room">{t('adminHostel.roomNumber')} *</Label>
                <Select value={allocForm.roomNumber} onValueChange={(v) => setAllocForm((f) => ({ ...f, roomNumber: v }))}>
                  <SelectTrigger id="alloc-room" className="min-h-11"><SelectValue placeholder={t('adminHostel.selectRoom')} /></SelectTrigger>
                  <SelectContent>
                    {allocRoomOptions.map((r) => (
                      <SelectItem key={r.id} value={r.roomNumber}>
                        {r.roomNumber} ({r.currentOccupants || 0}/{r.capacity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="alloc-bed">{t('adminHostel.bedNumber')}</Label>
                <Input id="alloc-bed" placeholder={t('adminHostel.bedNumberPh')} value={allocForm.bedNumber} onChange={(e) => setAllocForm((f) => ({ ...f, bedNumber: e.target.value }))} className="min-h-11" />
              </div>
            </div>
            {nextBedNo !== null && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <BedDouble className="size-3.5 text-golden" />
                {t('adminHostel.bedSuggest', { bed: nextBedNo })}
              </p>
            )}
            {allocRoomOptions.length === 0 && (
              <div className="flex items-start gap-2 rounded-xl bg-danger/10 px-3 py-2.5 text-xs text-danger">
                <Info className="size-4 shrink-0 mt-0.5" />
                <span>{t('adminHostel.noAvailableRooms')}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAllocDialogOpen(false); setEditingAlloc(null); setAllocForm(EMPTY_ALLOCATION_FORM); }} className="min-h-11">{t('common.cancel')}</Button>
            <Button onClick={handleSubmitAlloc} disabled={allocSubmitting || allocRoomOptions.length === 0} className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer min-h-11">
              {allocSubmitting && <Loader2 className="size-4 animate-spin" />}
              {editingAlloc ? t('adminHostel.updateBtn') : t('settings.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════ Meal Dialog ══════════════════════ */}
      <Dialog open={mealDialogOpen} onOpenChange={(open) => {
        setMealDialogOpen(open);
        if (!open) { setEditingMeal(null); setMealForm(EMPTY_MEAL_FORM); }
      }}>
        <DialogContent className="sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-islamic-dark">
              {editingMeal ? t('adminHostel.editMeal') : t('adminHostel.addMeal')}
            </DialogTitle>
            <DialogDescription>{t('adminHostel.mealDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <DialogSectionLabel>{t('adminHostel.sectionMenuInfo')}</DialogSectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('adminHostel.day')} *</Label>
                <Select value={mealForm.day} onValueChange={(v) => setMealForm((f) => ({ ...f, day: v }))}>
                  <SelectTrigger className="min-h-11"><SelectValue placeholder={t('adminHostel.selectDay')} /></SelectTrigger>
                  <SelectContent>
                    {DAY_KEYS.map((d) => (
                      <SelectItem key={d} value={d}>{dayLabel(d)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="meal-date">
                  {t('common.date')} <span className="text-muted-foreground font-normal">({t('adminHostel.dateOptional')})</span>
                </Label>
                <Input id="meal-date" type="date" value={mealForm.date} onChange={(e) => setMealForm((f) => ({ ...f, date: e.target.value }))} className="min-h-11" />
              </div>
            </div>
            <div className="space-y-3 rounded-2xl border border-islamic/15 bg-islamic-lighter/30 dark:bg-surface-tertiary/20 p-3.5">
              <div className="space-y-2">
                <Label htmlFor="meal-breakfast" className="flex items-center gap-1.5">
                  <Coffee className="size-3.5 text-golden" />
                  {t('adminHostel.breakfastMeal')}
                </Label>
                <Input id="meal-breakfast" placeholder={t('adminHostel.breakfastPh')} value={mealForm.breakfast} onChange={(e) => setMealForm((f) => ({ ...f, breakfast: e.target.value }))} className="min-h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meal-lunch" className="flex items-center gap-1.5">
                  <UtensilsCrossed className="size-3.5 text-golden" />
                  {t('adminHostel.lunchMeal')}
                </Label>
                <Input id="meal-lunch" placeholder={t('adminHostel.lunchPh')} value={mealForm.lunch} onChange={(e) => setMealForm((f) => ({ ...f, lunch: e.target.value }))} className="min-h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meal-dinner" className="flex items-center gap-1.5">
                  <MoonStar className="size-3.5 text-golden" />
                  {t('adminHostel.dinnerMeal')}
                </Label>
                <Input id="meal-dinner" placeholder={t('adminHostel.dinnerPh')} value={mealForm.dinner} onChange={(e) => setMealForm((f) => ({ ...f, dinner: e.target.value }))} className="min-h-11" />
              </div>
              <p className="text-[11px] text-muted-foreground">{t('adminHostel.mealFieldsHint')}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setMealDialogOpen(false); setEditingMeal(null); setMealForm(EMPTY_MEAL_FORM); }} className="min-h-11">{t('common.cancel')}</Button>
            <Button onClick={handleSubmitMeal} disabled={mealSubmitting} className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer min-h-11">
              {mealSubmitting && <Loader2 className="size-4 animate-spin" />}
              {editingMeal ? t('adminHostel.updateBtn') : t('settings.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════ Delete Confirmation ══════════════════════ */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('adminHostel.deleteDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-danger hover:bg-danger/90 text-danger-foreground gap-2 cursor-pointer min-h-11">
              {deleting && <Loader2 className="size-4 animate-spin" />}
              {t('common.confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
