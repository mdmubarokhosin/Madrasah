'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, BedDouble, Utensils, Users, DoorOpen, Loader2, XCircle } from 'lucide-react';
import { dbPush, dbUpdate, dbRemove, dbSubscribe } from '@/lib/db-service';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/lib/i18n-context';
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
  const dayLabel = (day: string) => DAY_LABELS[day] || day;

  /* Translated enum display labels (DB values stay English) */
  const roomTypeLabel = (type: string) =>
    type === 'single' ? t('adminHostel.typeSingle')
      : type === 'double' ? t('adminHostel.typeDouble')
        : type === 'triple' ? t('adminHostel.typeTriple')
          : t('adminHostel.typeDorm');
  const roomStatusLabel = (status: string) =>
    status === 'available' ? t('adminHostel.statusAvailable')
      : status === 'full' ? t('adminHostel.statusFull')
        : t('adminHostel.statusMaintenance');
  const allocStatusLabel = (status: string) =>
    status === 'active' ? t('common.active') : t('adminHostel.released');
  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [allocations, setAllocations] = useState<HostelAllocation[]>([]);
  const [meals, setMeals] = useState<HostelMeal[]>([]);
  const [activeTab, setActiveTab] = useState<'rooms' | 'allocations' | 'meals'>('rooms');

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
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; item: any } | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* Subscribe to data */
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

  /* Summary */
  const totalOccupants = useMemo(() => rooms.reduce((s, r) => s + (r.currentOccupants || 0), 0), [rooms]);
  const activeAllocations = useMemo(() => allocations.filter((a) => a.status === 'active').length, [allocations]);

  /* Room handlers */
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
    setRoomSubmitting(true);
    try {
      const payload = {
        roomNumber: roomForm.roomNumber.trim(),
        floor: roomForm.floor.trim(),
        capacity: Number(roomForm.capacity) || 2,
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

  /* Allocation handlers */
  const resetAndOpenAlloc = useCallback(() => {
    setEditingAlloc(null);
    setAllocForm(EMPTY_ALLOCATION_FORM);
    setAllocDialogOpen(true);
  }, []);

  const handleSubmitAlloc = async () => {
    if (!allocForm.studentName.trim() || !allocForm.roomNumber.trim()) {
      toast({ title: t('common.error'), description: t('adminHostel.allocFieldsRequired'), variant: 'destructive' });
      return;
    }
    setAllocSubmitting(true);
    try {
      const selectedRoom = rooms.find((r) => r.roomNumber === allocForm.roomNumber);
      const payload = {
        studentName: allocForm.studentName.trim(),
        studentRoll: allocForm.studentRoll.trim(),
        studentId: '',
        roomId: selectedRoom?.id || '',
        roomNumber: allocForm.roomNumber.trim(),
        bedNumber: allocForm.bedNumber.trim(),
        allocationDate: new Date().toISOString().split('T')[0],
        status: 'active',
        releasedDate: '',
      };

      if (editingAlloc) {
        await dbUpdate('/hostelAllocations/' + editingAlloc.id, payload);
        toast({ title: t('common.success'), description: t('adminHostel.allocUpdated') });
      } else {
        await dbPush('/hostelAllocations', { ...payload, createdAt: Date.now() });
        if (selectedRoom) {
          const newOcc = (selectedRoom.currentOccupants || 0) + 1;
          await dbUpdate('/hostelRooms/' + selectedRoom.id, {
            currentOccupants: newOcc,
            status: newOcc >= selectedRoom.capacity ? 'full' : 'available',
          });
        }
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

  /* Meal handlers */
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

  /* Delete handler */
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

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-islamic-dark">{t('adminHostel.title')}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t('adminHostel.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'rooms' ? 'default' : 'outline'}
            onClick={() => setActiveTab('rooms')}
            className={`gap-2 cursor-pointer ${activeTab === 'rooms' ? 'bg-islamic hover:bg-islamic-light text-white' : ''}`}
          >
            <DoorOpen className="size-4" />
            {t('adminHostel.tabRooms')}
          </Button>
          <Button
            variant={activeTab === 'allocations' ? 'default' : 'outline'}
            onClick={() => setActiveTab('allocations')}
            className={`gap-2 cursor-pointer ${activeTab === 'allocations' ? 'bg-islamic hover:bg-islamic-light text-white' : ''}`}
          >
            <Users className="size-4" />
            {t('adminHostel.tabAllocations')}
          </Button>
          <Button
            variant={activeTab === 'meals' ? 'default' : 'outline'}
            onClick={() => setActiveTab('meals')}
            className={`gap-2 cursor-pointer ${activeTab === 'meals' ? 'bg-islamic hover:bg-islamic-light text-white' : ''}`}
          >
            <Utensils className="size-4" />
            {t('adminHostel.tabMeals')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-islamic-dark">{rooms.length}</p>
            <p className="text-xs text-muted-foreground">{t('adminHostel.totalRooms')}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{rooms.filter((r) => r.status === 'available').length}</p>
            <p className="text-xs text-muted-foreground">{t('adminHostel.availableRooms')}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{totalOccupants}</p>
            <p className="text-xs text-muted-foreground">{t('adminHostel.totalOccupants')}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{activeAllocations}</p>
            <p className="text-xs text-muted-foreground">{t('adminHostel.activeAllocations')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Rooms Tab */}
      {activeTab === 'rooms' && (
        <>
          <Card className="shadow-sm hidden md:block">
            <CardContent className="p-0">
              {rooms.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminHostel.roomNumber')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminHostel.floor')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('common.type')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground text-center">{t('adminHostel.capacity')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground text-center">{t('adminHostel.current')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground text-center">{t('common.status')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground text-right">{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rooms.map((room) => (
                        <TableRow key={room.id}>
                          <TableCell className="font-medium text-sm text-islamic-dark py-3">{room.roomNumber}</TableCell>
                          <TableCell className="text-sm py-3 text-muted-foreground">{room.floor || '—'}</TableCell>
                          <TableCell className="text-sm py-3 text-muted-foreground">
                            {roomTypeLabel(room.type)}
                          </TableCell>
                          <TableCell className="py-3 text-center text-sm">{room.capacity}</TableCell>
                          <TableCell className="py-3 text-center">
                            <Badge variant="secondary" className="text-xs">{room.currentOccupants || 0}</Badge>
                          </TableCell>
                          <TableCell className="py-3 text-center">
                            <Badge className={`text-xs ${
                              room.status === 'available' ? 'bg-green-100 text-green-700 border-green-200' :
                              room.status === 'full' ? 'bg-red-100 text-red-700 border-red-200' :
                              'bg-yellow-100 text-yellow-700 border-yellow-200'
                            }`}>
                              {roomStatusLabel(room.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-islamic cursor-pointer" onClick={() => openEditRoom(room)}>
                                <Pencil className="size-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-red-600 cursor-pointer" onClick={() => setDeleteTarget({ type: 'room', item: room })}>
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
                  <BedDouble className="size-12 opacity-20 mb-3" />
                  <p className="text-sm">{t('adminHostel.noRooms')}</p>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Rooms Mobile Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
            {rooms.length > 0 ? rooms.map((room) => (
              <Card key={room.id} className="shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm truncate">{room.roomNumber}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{roomTypeLabel(room.type)} • {room.floor || '—'}</p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => openEditRoom(room)}><Pencil className="size-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => setDeleteTarget({ type: 'room', item: room })}><Trash2 className="size-3.5" /></Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium">{room.currentOccupants || 0}/{room.capacity}</span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      room.status === 'available' ? 'bg-green-100 text-green-700' :
                      room.status === 'full' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{roomStatusLabel(room.status)}</span>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                <BedDouble className="size-10 opacity-20 mb-2" />
                <p className="text-sm">{t('adminHostel.noRooms')}</p>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button onClick={resetAndOpenRoom} className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer">
              <Plus className="size-4" />
              {t('adminHostel.addRoom')}
            </Button>
          </div>
        </>
      )}

      {/* Allocations Tab */}
      {activeTab === 'allocations' && (
        <>
          <Card className="shadow-sm hidden md:block">
            <CardContent className="p-0">
              {allocations.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminHostel.student')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminHostel.room')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminHostel.bed')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('common.date')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground text-center">{t('common.status')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground text-right">{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allocations.map((alloc) => (
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
                              alloc.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' :
                              'bg-red-100 text-red-700 border-red-200'
                            }`}>
                              {allocStatusLabel(alloc.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 text-right">
                            {alloc.status === 'active' && (
                              <div className="flex items-center justify-end gap-1">
                                <Button size="sm" variant="outline" onClick={() => handleReleaseAlloc(alloc)} className="text-xs gap-1 cursor-pointer text-orange-600 hover:text-orange-700">
                                  <XCircle className="size-3" />
                                  {t('adminHostel.release')}
                                </Button>
                                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-red-600 cursor-pointer" onClick={() => setDeleteTarget({ type: 'alloc', item: alloc })}>
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                            )}
                            {alloc.status === 'released' && (
                              <span className="text-xs text-muted-foreground">{alloc.releasedDate}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Users className="size-12 opacity-20 mb-3" />
                  <p className="text-sm">{t('adminHostel.noAllocations')}</p>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Allocations Mobile Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
            {allocations.length > 0 ? allocations.map((alloc) => (
              <Card key={alloc.id} className="shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm truncate">{alloc.studentName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t('adminHostel.rollRoom', { roll: alloc.studentRoll || '—', room: alloc.roomNumber })}</p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {alloc.status === 'active' && (
                        <>
                          <Button variant="ghost" size="icon" className="size-7 text-orange-600" onClick={() => handleReleaseAlloc(alloc)}><XCircle className="size-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="size-7" onClick={() => setDeleteTarget({ type: 'alloc', item: alloc })}><Trash2 className="size-3.5" /></Button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {alloc.bedNumber && <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium">{t('adminHostel.bedValue', { bed: alloc.bedNumber })}</span>}
                    {alloc.allocationDate && <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium">{alloc.allocationDate}</span>}
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      alloc.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>{allocStatusLabel(alloc.status)}</span>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Users className="size-10 opacity-20 mb-2" />
                <p className="text-sm">{t('adminHostel.noAllocations')}</p>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button onClick={resetAndOpenAlloc} className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer">
              <Plus className="size-4" />
              {t('adminHostel.addAllocation')}
            </Button>
          </div>
        </>
      )}

      {/* Meals Tab */}
      {activeTab === 'meals' && (
        <>
          <Card className="shadow-sm hidden md:block">
            <CardContent className="p-0">
              {meals.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminHostel.day')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('common.date')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminHostel.breakfast')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminHostel.lunch')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminHostel.dinner')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground text-right">{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {meals.map((meal) => (
                        <TableRow key={meal.id}>
                          <TableCell className="font-medium text-sm text-islamic-dark py-3">{dayLabel(meal.day)}</TableCell>
                          <TableCell className="text-sm py-3 text-muted-foreground">{meal.date || '—'}</TableCell>
                          <TableCell className="text-sm py-3 text-muted-foreground">{meal.breakfast || '—'}</TableCell>
                          <TableCell className="text-sm py-3 text-muted-foreground">{meal.lunch || '—'}</TableCell>
                          <TableCell className="text-sm py-3 text-muted-foreground">{meal.dinner || '—'}</TableCell>
                          <TableCell className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-islamic cursor-pointer" onClick={() => openEditMeal(meal)}>
                                <Pencil className="size-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-red-600 cursor-pointer" onClick={() => setDeleteTarget({ type: 'meal', item: meal })}>
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
                  <p className="text-sm">{t('adminHostel.noMeals')}</p>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Meals Mobile Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
            {meals.length > 0 ? meals.map((meal) => (
              <Card key={meal.id} className="shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm truncate">{dayLabel(meal.day)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{meal.date || '—'}</p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => openEditMeal(meal)}><Pencil className="size-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => setDeleteTarget({ type: 'meal', item: meal })}><Trash2 className="size-3.5" /></Button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5 mt-2 text-[10px] text-muted-foreground">
                    {meal.breakfast && <p>{t('adminHostel.breakfast')}: <span className="text-foreground font-medium">{meal.breakfast}</span></p>}
                    {meal.lunch && <p>{t('adminHostel.lunch')}: <span className="text-foreground font-medium">{meal.lunch}</span></p>}
                    {meal.dinner && <p>{t('adminHostel.dinner')}: <span className="text-foreground font-medium">{meal.dinner}</span></p>}
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Utensils className="size-10 opacity-20 mb-2" />
                <p className="text-sm">{t('adminHostel.noMeals')}</p>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button onClick={resetAndOpenMeal} className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer">
              <Plus className="size-4" />
              {t('adminHostel.addMeal')}
            </Button>
          </div>
        </>
      )}

      {/* Room Dialog */}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="room-number">{t('adminHostel.roomNumber')} *</Label>
                <Input id="room-number" placeholder={t('adminHostel.roomNumberPh')} value={roomForm.roomNumber} onChange={(e) => setRoomForm((f) => ({ ...f, roomNumber: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="room-floor">{t('adminHostel.floor')}</Label>
                <Input id="room-floor" placeholder={t('adminHostel.floorPh')} value={roomForm.floor} onChange={(e) => setRoomForm((f) => ({ ...f, floor: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="room-type">{t('common.type')}</Label>
                <Select value={roomForm.type} onValueChange={(v) => setRoomForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue placeholder={t('adminHostel.selectType')} /></SelectTrigger>
                  <SelectContent>
                    {ROOM_TYPES.map((rt) => (
                      <SelectItem key={rt} value={rt}>{roomTypeLabel(rt)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="room-capacity">{t('adminHostel.capacity')}</Label>
                <Input id="room-capacity" type="number" placeholder="2" value={roomForm.capacity} onChange={(e) => setRoomForm((f) => ({ ...f, capacity: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="room-status">{t('common.status')}</Label>
              <Select value={roomForm.status} onValueChange={(v) => setRoomForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue placeholder={t('adminHostel.selectStatus')} /></SelectTrigger>
                <SelectContent>
                  {ROOM_STATUS.map((s) => (
                    <SelectItem key={s} value={s}>{roomStatusLabel(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRoomDialogOpen(false); setEditingRoom(null); setRoomForm(EMPTY_ROOM_FORM); }}>{t('common.cancel')}</Button>
            <Button onClick={handleSubmitRoom} disabled={roomSubmitting} className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer">
              {roomSubmitting && <Loader2 className="size-4 animate-spin" />}
              {editingRoom ? t('adminHostel.updateBtn') : t('settings.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Allocation Dialog */}
      <Dialog open={allocDialogOpen} onOpenChange={(open) => {
        setAllocDialogOpen(open);
        if (!open) { setEditingAlloc(null); setAllocForm(EMPTY_ALLOCATION_FORM); }
      }}>
        <DialogContent className="sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-islamic-dark">{t('adminHostel.allocTitle')}</DialogTitle>
            <DialogDescription>{t('adminHostel.allocDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="alloc-name">{t('adminHostel.studentName')}</Label>
                <Input id="alloc-name" placeholder={t('adminHostel.studentNamePh')} value={allocForm.studentName} onChange={(e) => setAllocForm((f) => ({ ...f, studentName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alloc-roll">{t('adminHostel.rollNumber')}</Label>
                <Input id="alloc-roll" placeholder={t('adminHostel.rollNumber')} value={allocForm.studentRoll} onChange={(e) => setAllocForm((f) => ({ ...f, studentRoll: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="alloc-room">{t('adminHostel.roomNumber')} *</Label>
                <Select value={allocForm.roomNumber} onValueChange={(v) => setAllocForm((f) => ({ ...f, roomNumber: v }))}>
                  <SelectTrigger><SelectValue placeholder={t('adminHostel.selectRoom')} /></SelectTrigger>
                  <SelectContent>
                    {rooms.filter((r) => r.status === 'available').map((r) => (
                      <SelectItem key={r.id} value={r.roomNumber}>
                        {r.roomNumber} ({r.currentOccupants || 0}/{r.capacity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="alloc-bed">{t('adminHostel.bedNumber')}</Label>
                <Input id="alloc-bed" placeholder={t('adminHostel.bedNumberPh')} value={allocForm.bedNumber} onChange={(e) => setAllocForm((f) => ({ ...f, bedNumber: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAllocDialogOpen(false); setAllocForm(EMPTY_ALLOCATION_FORM); }}>{t('common.cancel')}</Button>
            <Button onClick={handleSubmitAlloc} disabled={allocSubmitting} className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer">
              {allocSubmitting && <Loader2 className="size-4 animate-spin" />}
              {t('settings.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Meal Dialog */}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('adminHostel.day')} *</Label>
                <Select value={mealForm.day} onValueChange={(v) => setMealForm((f) => ({ ...f, day: v }))}>
                  <SelectTrigger><SelectValue placeholder={t('adminHostel.selectDay')} /></SelectTrigger>
                  <SelectContent>
                    {DAY_KEYS.map((d) => (
                      <SelectItem key={d} value={d}>{dayLabel(d)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="meal-date">{t('common.date')}</Label>
                <Input id="meal-date" type="date" value={mealForm.date} onChange={(e) => setMealForm((f) => ({ ...f, date: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="meal-breakfast">{t('adminHostel.breakfastMeal')}</Label>
              <Input id="meal-breakfast" placeholder={t('adminHostel.breakfastPh')} value={mealForm.breakfast} onChange={(e) => setMealForm((f) => ({ ...f, breakfast: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meal-lunch">{t('adminHostel.lunchMeal')}</Label>
              <Input id="meal-lunch" placeholder={t('adminHostel.lunchPh')} value={mealForm.lunch} onChange={(e) => setMealForm((f) => ({ ...f, lunch: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meal-dinner">{t('adminHostel.dinnerMeal')}</Label>
              <Input id="meal-dinner" placeholder={t('adminHostel.dinnerPh')} value={mealForm.dinner} onChange={(e) => setMealForm((f) => ({ ...f, dinner: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setMealDialogOpen(false); setEditingMeal(null); setMealForm(EMPTY_MEAL_FORM); }}>{t('common.cancel')}</Button>
            <Button onClick={handleSubmitMeal} disabled={mealSubmitting} className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer">
              {mealSubmitting && <Loader2 className="size-4 animate-spin" />}
              {editingMeal ? t('adminHostel.updateBtn') : t('settings.save')}
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
              {t('adminHostel.deleteDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white gap-2 cursor-pointer">
              {deleting && <Loader2 className="size-4 animate-spin" />}
              {t('common.confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
