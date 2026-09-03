'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, Megaphone, Users, Loader2, MapPin, Phone } from 'lucide-react';
import { dbPush, dbUpdate, dbRemove, dbSubscribe } from '@/lib/db-service';
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
import type { DawahProgram, DawahJamat } from '@/types/database';
import { useTranslation } from '@/lib/i18n-context';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PROGRAM_TYPES = ['jamat', 'bayan', 'tajweed', 'dars', 'other'] as const;
const PROGRAM_TYPE_LABEL_KEYS: Record<string, string> = {
  jamat: 'adminDawah.jamat',
  bayan: 'adminDawah.typeBayan',
  tajweed: 'adminDawah.typeTajweed',
  dars: 'adminDawah.typeDars',
  other: 'adminDawah.typeOther',
};

const PROGRAM_STATUS = ['upcoming', 'ongoing', 'completed'] as const;
const PROGRAM_STATUS_LABEL_KEYS: Record<string, string> = {
  upcoming: 'adminDawah.statusUpcoming',
  ongoing: 'adminDawah.statusOngoing',
  completed: 'adminDawah.statusCompleted',
};

const JAMAT_STATUS_LABEL_KEYS: Record<string, string> = {
  active: 'adminDawah.jamatActive',
  returned: 'adminDawah.jamatReturned',
};

const EMPTY_PROGRAM_FORM = {
  title: '',
  description: '',
  date: '',
  location: '',
  coordinatorName: '',
  coordinatorPhone: '',
  participantCount: '',
  type: 'jamat',
  status: 'upcoming',
};

const EMPTY_JAMAT_FORM = {
  name: '',
  leaderName: '',
  memberCount: '',
  currentLocation: '',
  departureDate: '',
  returnDate: '',
  status: 'active',
  report: '',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminDawah() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [programs, setPrograms] = useState<DawahProgram[]>([]);
  const [jamats, setJamats] = useState<DawahJamat[]>([]);
  const [activeTab, setActiveTab] = useState<'programs' | 'jamats'>('programs');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  /* Program Dialog */
  const [programDialogOpen, setProgramDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<DawahProgram | null>(null);
  const [programForm, setProgramForm] = useState(EMPTY_PROGRAM_FORM);
  const [programSubmitting, setProgramSubmitting] = useState(false);

  /* Jamat Dialog */
  const [jamatDialogOpen, setJamatDialogOpen] = useState(false);
  const [editingJamat, setEditingJamat] = useState<DawahJamat | null>(null);
  const [jamatForm, setJamatForm] = useState(EMPTY_JAMAT_FORM);
  const [jamatSubmitting, setJamatSubmitting] = useState(false);

  /* Delete */
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; item: any } | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* Subscribe to data */
  useEffect(() => {
    const unsubPrograms = dbSubscribe('/dawahPrograms', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list: DawahProgram[] = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        }));
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setPrograms(list);
      } else {
        setPrograms([]);
      }
    });

    const unsubJamats = dbSubscribe('/dawahJamats', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list: DawahJamat[] = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        }));
        setJamats(list);
      } else {
        setJamats([]);
      }
    });

    return () => { unsubPrograms(); unsubJamats(); };
  }, []);

  /* Filtered programs */
  const filteredPrograms = useMemo(() => {
    return programs.filter((p) => {
      const typeMatch = typeFilter === 'all' || p.type === typeFilter;
      const statusMatch = statusFilter === 'all' || p.status === statusFilter;
      return typeMatch && statusMatch;
    });
  }, [programs, typeFilter, statusFilter]);

  /* Summary */
  const activeJamats = useMemo(() => jamats.filter((j) => j.status === 'active').length, [jamats]);
  const upcomingPrograms = useMemo(() => programs.filter((p) => p.status === 'upcoming').length, [programs]);
  const completedPrograms = useMemo(() => programs.filter((p) => p.status === 'completed').length, [programs]);

  /* Program handlers */
  const resetAndOpenProgram = useCallback(() => {
    setEditingProgram(null);
    setProgramForm(EMPTY_PROGRAM_FORM);
    setProgramDialogOpen(true);
  }, []);

  const openEditProgram = useCallback((prog: DawahProgram) => {
    setEditingProgram(prog);
    setProgramForm({
      title: prog.title,
      description: prog.description || '',
      date: prog.date || '',
      location: prog.location || '',
      coordinatorName: prog.coordinatorName || '',
      coordinatorPhone: prog.coordinatorPhone || '',
      participantCount: String(prog.participantCount || ''),
      type: prog.type,
      status: prog.status,
    });
    setProgramDialogOpen(true);
  }, []);

  const handleSubmitProgram = async () => {
    if (!programForm.title.trim()) {
      toast({ title: t('common.error'), description: t('adminDawah.titleRequired'), variant: 'destructive' });
      return;
    }
    setProgramSubmitting(true);
    try {
      const payload = {
        title: programForm.title.trim(),
        description: programForm.description.trim(),
        date: programForm.date || '',
        location: programForm.location.trim(),
        coordinatorName: programForm.coordinatorName.trim(),
        coordinatorPhone: programForm.coordinatorPhone.trim(),
        participantCount: Number(programForm.participantCount) || 0,
        type: programForm.type,
        status: programForm.status,
      };
      if (editingProgram) {
        await dbUpdate('/dawahPrograms/' + editingProgram.id, payload);
        toast({ title: t('common.success'), description: t('adminDawah.programUpdated') });
      } else {
        await dbPush('/dawahPrograms', { ...payload, createdAt: Date.now() });
        toast({ title: t('common.success'), description: t('adminDawah.programCreated') });
      }
      setProgramDialogOpen(false);
      setProgramForm(EMPTY_PROGRAM_FORM);
      setEditingProgram(null);
    } catch {
      toast({ title: t('common.error'), description: t('common.operationFailed'), variant: 'destructive' });
    } finally {
      setProgramSubmitting(false);
    }
  };

  /* Jamat handlers */
  const resetAndOpenJamat = useCallback(() => {
    setEditingJamat(null);
    setJamatForm(EMPTY_JAMAT_FORM);
    setJamatDialogOpen(true);
  }, []);

  const openEditJamat = useCallback((jamat: DawahJamat) => {
    setEditingJamat(jamat);
    setJamatForm({
      name: jamat.name,
      leaderName: jamat.leaderName || '',
      memberCount: String(jamat.memberCount || ''),
      currentLocation: jamat.currentLocation || '',
      departureDate: jamat.departureDate || '',
      returnDate: jamat.returnDate || '',
      status: jamat.status,
      report: jamat.report || '',
    });
    setJamatDialogOpen(true);
  }, []);

  const handleSubmitJamat = async () => {
    if (!jamatForm.name.trim()) {
      toast({ title: t('common.error'), description: t('adminDawah.jamatNameRequired'), variant: 'destructive' });
      return;
    }
    setJamatSubmitting(true);
    try {
      const payload = {
        name: jamatForm.name.trim(),
        leaderName: jamatForm.leaderName.trim(),
        memberCount: Number(jamatForm.memberCount) || 0,
        currentLocation: jamatForm.currentLocation.trim(),
        departureDate: jamatForm.departureDate || '',
        returnDate: jamatForm.returnDate || '',
        status: jamatForm.status,
        report: jamatForm.report.trim(),
      };
      if (editingJamat) {
        await dbUpdate('/dawahJamats/' + editingJamat.id, payload);
        toast({ title: t('common.success'), description: t('adminDawah.jamatUpdated') });
      } else {
        await dbPush('/dawahJamats', { ...payload, createdAt: Date.now() });
        toast({ title: t('common.success'), description: t('adminDawah.jamatCreated') });
      }
      setJamatDialogOpen(false);
      setJamatForm(EMPTY_JAMAT_FORM);
      setEditingJamat(null);
    } catch {
      toast({ title: t('common.error'), description: t('common.operationFailed'), variant: 'destructive' });
    } finally {
      setJamatSubmitting(false);
    }
  };

  /* Delete handler */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const path = deleteTarget.type === 'program' ? '/dawahPrograms/' : '/dawahJamats/';
      await dbRemove(path + deleteTarget.item.id);
      toast({ title: t('common.success'), description: t('adminDawah.itemDeleted') });
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
          <h2 className="text-2xl font-bold text-islamic-dark">{t('adminDawah.title')}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t('adminDawah.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'programs' ? 'default' : 'outline'}
            onClick={() => setActiveTab('programs')}
            className={`gap-2 cursor-pointer ${activeTab === 'programs' ? 'bg-islamic hover:bg-islamic-light text-white' : ''}`}
          >
            <Megaphone className="size-4" />
            {t('adminDawah.tabPrograms')}
          </Button>
          <Button
            variant={activeTab === 'jamats' ? 'default' : 'outline'}
            onClick={() => setActiveTab('jamats')}
            className={`gap-2 cursor-pointer ${activeTab === 'jamats' ? 'bg-islamic hover:bg-islamic-light text-white' : ''}`}
          >
            <Users className="size-4" />
            {t('adminDawah.jamat')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-islamic-dark">{programs.length}</p>
            <p className="text-xs text-muted-foreground">{t('adminDawah.totalPrograms')}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{activeJamats}</p>
            <p className="text-xs text-muted-foreground">{t('adminDawah.activeJamats')}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{upcomingPrograms}</p>
            <p className="text-xs text-muted-foreground">{t('adminDawah.upcomingPrograms')}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{completedPrograms}</p>
            <p className="text-xs text-muted-foreground">{t('adminDawah.completedPrograms')}</p>
          </CardContent>
        </Card>
      </div>

      {activeTab === 'programs' ? (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground self-center">{t('adminDawah.filterType')}</span>
              <Button size="sm" variant={typeFilter === 'all' ? 'default' : 'outline'} onClick={() => setTypeFilter('all')} className={`text-xs cursor-pointer ${typeFilter === 'all' ? 'bg-islamic hover:bg-islamic-light text-white' : ''}`}>{t('adminDawah.all')}</Button>
              {PROGRAM_TYPES.map((type) => (
                <Button key={type} size="sm" variant={typeFilter === type ? 'default' : 'outline'} onClick={() => setTypeFilter(type)} className={`text-xs cursor-pointer ${typeFilter === type ? 'bg-islamic hover:bg-islamic-light text-white' : ''}`}>
                  {t(PROGRAM_TYPE_LABEL_KEYS[type] || type)}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground self-center">{t('adminDawah.filterStatus')}</span>
            {PROGRAM_STATUS.map((s) => (
              <Button key={s} size="sm" variant={statusFilter === s ? 'default' : 'outline'} onClick={() => setStatusFilter(s)} className={`text-xs cursor-pointer ${statusFilter === s ? 'bg-islamic hover:bg-islamic-light text-white' : ''}`}>
                {t(PROGRAM_STATUS_LABEL_KEYS[s])}
              </Button>
            ))}
            <Button size="sm" variant={statusFilter === 'all' ? 'default' : 'outline'} onClick={() => setStatusFilter('all')} className={`text-xs cursor-pointer ${statusFilter === 'all' ? 'bg-islamic hover:bg-islamic-light text-white' : ''}`}>{t('adminDawah.all')}</Button>
          </div>

          {/* Programs Table */}
          <Card className="shadow-sm hidden md:block">
            <CardContent className="p-0">
              {filteredPrograms.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('common.title')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('common.type')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('common.date')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('common.location')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground text-center">{t('adminDawah.thParticipants')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground text-center">{t('common.status')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground text-right">{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPrograms.map((prog) => (
                        <TableRow key={prog.id}>
                          <TableCell className="py-3">
                            <p className="font-medium text-sm text-islamic-dark">{prog.title}</p>
                            {prog.coordinatorName && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Users className="size-3" /> {prog.coordinatorName}
                                {prog.coordinatorPhone && (
                                  <> • <Phone className="size-3" /> {prog.coordinatorPhone}</>
                                )}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-sm py-3 text-muted-foreground">{t(PROGRAM_TYPE_LABEL_KEYS[prog.type] || prog.type)}</TableCell>
                          <TableCell className="text-sm py-3 text-muted-foreground">{prog.date || '—'}</TableCell>
                          <TableCell className="text-sm py-3 text-muted-foreground">{prog.location || '—'}</TableCell>
                          <TableCell className="py-3 text-center">
                            <Badge variant="secondary" className="text-xs">{prog.participantCount || 0}</Badge>
                          </TableCell>
                          <TableCell className="py-3 text-center">
                            <Badge className={`text-xs ${
                              prog.status === 'upcoming' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                              prog.status === 'ongoing' ? 'bg-green-100 text-green-700 border-green-200' :
                              'bg-orange-100 text-orange-700 border-orange-200'
                            }`}>
                              {t(PROGRAM_STATUS_LABEL_KEYS[prog.status] || prog.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-islamic cursor-pointer" onClick={() => openEditProgram(prog)}>
                                <Pencil className="size-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-red-600 cursor-pointer" onClick={() => setDeleteTarget({ type: 'program', item: prog })}>
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
                  <Megaphone className="size-12 opacity-20 mb-3" />
                  <p className="text-sm">{t('adminDawah.noPrograms')}</p>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Programs Mobile Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
            {filteredPrograms.length > 0 ? filteredPrograms.map((prog) => (
              <Card key={prog.id} className="shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm truncate">{prog.title}</p>
                      {prog.coordinatorName && <p className="text-xs text-muted-foreground mt-0.5">{prog.coordinatorName}{prog.coordinatorPhone ? ` • ${prog.coordinatorPhone}` : ''}</p>}
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => openEditProgram(prog)}><Pencil className="size-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => setDeleteTarget({ type: 'program', item: prog })}><Trash2 className="size-3.5" /></Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">{t(PROGRAM_TYPE_LABEL_KEYS[prog.type] || prog.type)}</span>
                    {prog.date && <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium">{prog.date}</span>}
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium">{t('adminDawah.peopleCount', { count: prog.participantCount || 0 })}</span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      prog.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                      prog.status === 'ongoing' ? 'bg-green-100 text-green-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>{t(PROGRAM_STATUS_LABEL_KEYS[prog.status] || prog.status)}</span>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Megaphone className="size-10 opacity-20 mb-2" />
                <p className="text-sm">{t('adminDawah.noPrograms')}</p>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button onClick={resetAndOpenProgram} className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer">
              <Plus className="size-4" />
              {t('adminDawah.addProgram')}
            </Button>
          </div>
        </>
      ) : (
        <>
          {/* Jamats Table */}
          <Card className="shadow-sm hidden md:block">
            <CardContent className="p-0">
              {jamats.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminDawah.jamat')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminDawah.thLeader')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground text-center">{t('adminDawah.thMembers')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminDawah.currentLocation')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminDawah.departureDate')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground text-center">{t('common.status')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground text-right">{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jamats.map((jamat) => (
                        <TableRow key={jamat.id}>
                          <TableCell className="font-medium text-sm text-islamic-dark py-3">{jamat.name}</TableCell>
                          <TableCell className="text-sm py-3 text-muted-foreground">{jamat.leaderName || '—'}</TableCell>
                          <TableCell className="py-3 text-center">
                            <Badge variant="secondary" className="text-xs">{jamat.memberCount || 0}</Badge>
                          </TableCell>
                          <TableCell className="text-sm py-3 text-muted-foreground">
                            {jamat.currentLocation ? (
                              <span className="flex items-center gap-1"><MapPin className="size-3" /> {jamat.currentLocation}</span>
                            ) : '—'}
                          </TableCell>
                          <TableCell className="text-sm py-3 text-muted-foreground">{jamat.departureDate || '—'}</TableCell>
                          <TableCell className="py-3 text-center">
                            <Badge className={`text-xs ${
                              jamat.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' :
                              'bg-blue-100 text-blue-700 border-blue-200'
                            }`}>
                              {t(JAMAT_STATUS_LABEL_KEYS[jamat.status] || jamat.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-islamic cursor-pointer" onClick={() => openEditJamat(jamat)}>
                                <Pencil className="size-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-red-600 cursor-pointer" onClick={() => setDeleteTarget({ type: 'jamat', item: jamat })}>
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
                  <p className="text-sm">{t('adminDawah.noJamats')}</p>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Jamats Mobile Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
            {jamats.length > 0 ? jamats.map((jamat) => (
              <Card key={jamat.id} className="shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm truncate">{jamat.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{jamat.leaderName || '—'} • {t('adminDawah.peopleCount', { count: jamat.memberCount || 0 })}</p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => openEditJamat(jamat)}><Pencil className="size-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => setDeleteTarget({ type: 'jamat', item: jamat })}><Trash2 className="size-3.5" /></Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {jamat.currentLocation && <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium">{jamat.currentLocation}</span>}
                    {jamat.departureDate && <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium">{jamat.departureDate}</span>}
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      jamat.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>{t(JAMAT_STATUS_LABEL_KEYS[jamat.status] || jamat.status)}</span>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Users className="size-10 opacity-20 mb-2" />
                <p className="text-sm">{t('adminDawah.noJamats')}</p>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button onClick={resetAndOpenJamat} className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer">
              <Plus className="size-4" />
              {t('adminDawah.addJamat')}
            </Button>
          </div>
        </>
      )}

      {/* Program Dialog */}
      <Dialog open={programDialogOpen} onOpenChange={(open) => {
        setProgramDialogOpen(open);
        if (!open) { setEditingProgram(null); setProgramForm(EMPTY_PROGRAM_FORM); }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-islamic-dark">
              {editingProgram ? t('adminDawah.editProgram') : t('adminDawah.addProgram')}
            </DialogTitle>
            <DialogDescription>
              {editingProgram ? t('adminDawah.editProgramDesc') : t('adminDawah.addProgramDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="prog-title">{t('adminDawah.labelTitle')}</Label>
              <Input id="prog-title" placeholder={t('adminDawah.phTitle')} value={programForm.title} onChange={(e) => setProgramForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prog-desc">{t('common.description')}</Label>
              <Textarea id="prog-desc" placeholder={t('adminDawah.phDescription')} rows={3} value={programForm.description} onChange={(e) => setProgramForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prog-type">{t('common.type')}</Label>
                <Select value={programForm.type} onValueChange={(v) => setProgramForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue placeholder={t('adminDawah.phSelectType')} /></SelectTrigger>
                  <SelectContent>
                    {PROGRAM_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{t(PROGRAM_TYPE_LABEL_KEYS[type] || type)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prog-status">{t('common.status')}</Label>
                <Select value={programForm.status} onValueChange={(v) => setProgramForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue placeholder={t('adminDawah.phSelectStatus')} /></SelectTrigger>
                  <SelectContent>
                    {PROGRAM_STATUS.map((s) => (
                      <SelectItem key={s} value={s}>{t(PROGRAM_STATUS_LABEL_KEYS[s])}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prog-date">{t('common.date')}</Label>
                <Input id="prog-date" type="date" value={programForm.date} onChange={(e) => setProgramForm((f) => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prog-participants">{t('adminDawah.thParticipants')}</Label>
                <Input id="prog-participants" type="number" placeholder="0" value={programForm.participantCount} onChange={(e) => setProgramForm((f) => ({ ...f, participantCount: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prog-location">{t('common.location')}</Label>
              <Input id="prog-location" placeholder={t('adminDawah.phLocation')} value={programForm.location} onChange={(e) => setProgramForm((f) => ({ ...f, location: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prog-coord">{t('adminDawah.labelCoordinator')}</Label>
                <Input id="prog-coord" placeholder={t('common.name')} value={programForm.coordinatorName} onChange={(e) => setProgramForm((f) => ({ ...f, coordinatorName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prog-phone">{t('adminDawah.phone')}</Label>
                <Input id="prog-phone" placeholder={t('adminDawah.phone')} value={programForm.coordinatorPhone} onChange={(e) => setProgramForm((f) => ({ ...f, coordinatorPhone: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setProgramDialogOpen(false); setEditingProgram(null); setProgramForm(EMPTY_PROGRAM_FORM); }}>{t('common.cancel')}</Button>
            <Button onClick={handleSubmitProgram} disabled={programSubmitting} className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer">
              {programSubmitting && <Loader2 className="size-4 animate-spin" />}
              {editingProgram ? t('adminDawah.updateBtn') : t('adminDawah.saveBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Jamat Dialog */}
      <Dialog open={jamatDialogOpen} onOpenChange={(open) => {
        setJamatDialogOpen(open);
        if (!open) { setEditingJamat(null); setJamatForm(EMPTY_JAMAT_FORM); }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-islamic-dark">
              {editingJamat ? t('adminDawah.editJamat') : t('adminDawah.addJamat')}
            </DialogTitle>
            <DialogDescription>
              {editingJamat ? t('adminDawah.editJamatDesc') : t('adminDawah.addJamatDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jamat-name">{t('adminDawah.labelJamatName')}</Label>
                <Input id="jamat-name" placeholder={t('adminDawah.phJamatName')} value={jamatForm.name} onChange={(e) => setJamatForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jamat-leader">{t('adminDawah.labelLeaderName')}</Label>
                <Input id="jamat-leader" placeholder={t('adminDawah.phLeaderName')} value={jamatForm.leaderName} onChange={(e) => setJamatForm((f) => ({ ...f, leaderName: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jamat-members">{t('adminDawah.labelMemberCount')}</Label>
                <Input id="jamat-members" type="number" placeholder="0" value={jamatForm.memberCount} onChange={(e) => setJamatForm((f) => ({ ...f, memberCount: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jamat-departure">{t('adminDawah.departureDate')}</Label>
                <Input id="jamat-departure" type="date" value={jamatForm.departureDate} onChange={(e) => setJamatForm((f) => ({ ...f, departureDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jamat-return">{t('adminDawah.returnDate')}</Label>
                <Input id="jamat-return" type="date" value={jamatForm.returnDate} onChange={(e) => setJamatForm((f) => ({ ...f, returnDate: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jamat-location">{t('adminDawah.currentLocation')}</Label>
                <Input id="jamat-location" placeholder={t('adminDawah.phAreaName')} value={jamatForm.currentLocation} onChange={(e) => setJamatForm((f) => ({ ...f, currentLocation: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jamat-status">{t('common.status')}</Label>
                <Select value={jamatForm.status} onValueChange={(v) => setJamatForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue placeholder={t('common.status')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t('adminDawah.jamatActive')}</SelectItem>
                    <SelectItem value="returned">{t('adminDawah.jamatReturned')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="jamat-report">{t('adminDawah.labelReport')}</Label>
              <Textarea id="jamat-report" placeholder={t('adminDawah.phReport')} rows={4} value={jamatForm.report} onChange={(e) => setJamatForm((f) => ({ ...f, report: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setJamatDialogOpen(false); setEditingJamat(null); setJamatForm(EMPTY_JAMAT_FORM); }}>{t('common.cancel')}</Button>
            <Button onClick={handleSubmitJamat} disabled={jamatSubmitting} className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer">
              {jamatSubmitting && <Loader2 className="size-4 animate-spin" />}
              {editingJamat ? t('adminDawah.updateBtn') : t('adminDawah.saveBtn')}
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
              {t('adminDawah.deleteItemWarning')}
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
