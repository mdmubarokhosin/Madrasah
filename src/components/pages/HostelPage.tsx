'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BedDouble,
  Utensils,
  DoorOpen,
  Users,
  Armchair,
  Coffee,
  UtensilsCrossed,
  MoonStar,
  CalendarDays,
} from 'lucide-react';
import { Tabs } from '@heroui/react/tabs';
import BackToTop from '@/components/pages/BackToTop';
import { useAppStore } from '@/store/app-store';
import { StatCard, HCard, IconMedallion, GoldRule } from '@/components/heroui/islamic';
import { useTranslation } from '@/lib/i18n-context';
import { cn } from '@/lib/utils';
import type { HostelMeal } from '@/types/database';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

/* ------------------------------------------------------------------ */
/*  Status + enum mappings (DB values stay English)                    */
/* ------------------------------------------------------------------ */

const statusConfig: Record<string, { labelKey: string; cls: string }> = {
  available: { labelKey: 'hostelPage.statusAvailable', cls: 'bg-islamic-lighter text-islamic-dark ring-1 ring-islamic/20' },
  full: { labelKey: 'hostelPage.statusFull', cls: 'bg-danger/10 text-danger ring-1 ring-danger/30' },
  maintenance: { labelKey: 'hostelPage.statusMaintenance', cls: 'bg-warning/15 text-warning-foreground ring-1 ring-warning/40' },
};

const typeLabelKey: Record<string, string> = {
  single: 'hostelPage.typeSingle',
  double: 'hostelPage.typeDouble',
  triple: 'hostelPage.typeTriple',
  dorm: 'hostelPage.typeDorm',
};

/* Day names are stored either in English (admin panel) or Bengali
   (legacy seed data) — normalise both to a canonical short key so the
   weekly menu always sorts and labels correctly in every language. */
const DAY_ALIASES: Record<string, string> = {
  saturday: 'sat', 'শনিবার': 'sat',
  sunday: 'sun', 'রবিবার': 'sun',
  monday: 'mon', 'সোমবার': 'mon',
  tuesday: 'tue', 'মঙ্গলবার': 'tue',
  wednesday: 'wed', 'বুধবার': 'wed',
  thursday: 'thu', 'বৃহস্পতিবার': 'thu',
  friday: 'fri', 'শুক্রবার': 'fri',
};

const DAY_ORDER = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'] as const;

const DAY_LABEL_KEY: Record<string, string> = {
  sat: 'hostelPage.daySat',
  sun: 'hostelPage.daySun',
  mon: 'hostelPage.dayMon',
  tue: 'hostelPage.dayTue',
  wed: 'hostelPage.dayWed',
  thu: 'hostelPage.dayThu',
  fri: 'hostelPage.dayFri',
};

// JS getDay(): 0 = Sunday … 6 = Saturday
const JS_DAY_KEY = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const canonicalDay = (raw: string): string => DAY_ALIASES[String(raw || '').trim().toLowerCase()] || '';

type RoomFilter = 'all' | 'available' | 'full' | 'maintenance';

const ROOM_FILTERS: RoomFilter[] = ['all', 'available', 'full', 'maintenance'];

/* ------------------------------------------------------------------ */
/*  Small local helpers (kept inside this file by design)              */
/* ------------------------------------------------------------------ */

function occupancyTone(occ: number, cap: number) {
  if (cap <= 0) return 'bg-muted-foreground/40';
  if (occ >= cap) return 'bg-danger';
  if (occ >= cap * 0.8) return 'bg-warning';
  return 'bg-islamic';
}

/** Seat dots — used when capacity is small enough to visualise (≤ 12). */
function SeatDots({ occ, cap }: { occ: number; cap: number }) {
  const visible = Math.min(Math.max(cap, 0), 12);
  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-hidden="true">
      {Array.from({ length: visible }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'inline-block size-2.5 rounded-full transition-colors',
            i < occ ? 'bg-islamic shadow-[0_0_0_2px] shadow-islamic/15' : 'border border-dashed border-islamic/35 bg-transparent'
          )}
        />
      ))}
      {cap > visible && (
        <span className="text-[10px] font-semibold text-muted-foreground">+{cap - visible}</span>
      )}
    </div>
  );
}

function OccupancyBar({ occ, cap, className }: { occ: number; cap: number; className?: string }) {
  const pct = cap > 0 ? Math.min((occ / cap) * 100, 100) : 0;
  return (
    <div className={cn('w-full bg-surface-tertiary rounded-full h-2 overflow-hidden', className)} role="presentation">
      <div
        className={cn('h-2 rounded-full transition-all duration-700', occupancyTone(occ, cap))}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** One meal row: icon + label + menu text (graceful when empty). */
function MealRow({
  icon: Icon,
  label,
  value,
  emptyText,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  emptyText: string;
}) {
  const empty = !String(value || '').trim();
  return (
    <div className="flex items-start gap-3 rounded-xl px-3 py-2.5 bg-surface-tertiary/40 dark:bg-surface-tertiary/20">
      <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-golden-lighter text-golden ring-1 ring-golden/30">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={cn('text-sm leading-snug mt-0.5 break-words', empty ? 'text-muted-foreground/70 italic' : 'text-islamic-dark dark:text-foreground font-medium')}>
          {empty ? emptyText : value}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function HostelPage() {
  const { hostelRooms, hostelMeals } = useAppStore();
  const { t } = useTranslation();
  const [roomFilter, setRoomFilter] = useState<RoomFilter>('all');

  /* ---- Derived stats (public data has no allocations stream —
     occupancy is read straight off the subscribed rooms) ---- */
  const stats = useMemo(() => {
    const totalRooms = hostelRooms.length;
    const totalSeats = hostelRooms.reduce((sum, r) => sum + (Number(r.capacity) || 0), 0);
    const occupiedSeats = hostelRooms.reduce((sum, r) => sum + (Number(r.currentOccupants) || 0), 0);
    const availableSeats = Math.max(0, totalSeats - occupiedSeats);
    const occupancyPct = totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0;
    return { totalRooms, totalSeats, occupiedSeats, availableSeats, occupancyPct };
  }, [hostelRooms]);

  const filterCounts = useMemo(
    () => ({
      all: hostelRooms.length,
      available: hostelRooms.filter((r) => r.status === 'available').length,
      full: hostelRooms.filter((r) => r.status === 'full').length,
      maintenance: hostelRooms.filter((r) => r.status === 'maintenance').length,
    }),
    [hostelRooms]
  );

  const visibleRooms = useMemo(() => {
    if (roomFilter === 'all') return hostelRooms;
    if (roomFilter === 'full') return hostelRooms.filter((r) => r.status === 'full' || (r.capacity > 0 && (r.currentOccupants || 0) >= r.capacity));
    return hostelRooms.filter((r) => r.status === roomFilter);
  }, [hostelRooms, roomFilter]);

  /* ---- Weekly menu, sorted by canonical madrasa week (Sat → Fri) ---- */
  const sortedMeals = useMemo(() => {
    const items = (hostelMeals as HostelMeal[])
      .map((m) => ({ meal: m, dayKey: canonicalDay(m.day) }))
      .filter((x) => x.dayKey !== '');
    items.sort((a, b) => {
      const d = DAY_ORDER.indexOf(a.dayKey as (typeof DAY_ORDER)[number]) - DAY_ORDER.indexOf(b.dayKey as (typeof DAY_ORDER)[number]);
      return d !== 0 ? d : String(a.meal.date || '').localeCompare(String(b.meal.date || ''));
    });
    return items;
  }, [hostelMeals]);

  const todayKey = JS_DAY_KEY[new Date().getDay()];

  /* ---- Per-room seat breakdown for the Seats tab ---- */
  const seatRows = useMemo(
    () =>
      [...hostelRooms]
        .sort((a, b) => String(a.roomNumber).localeCompare(String(b.roomNumber), undefined, { numeric: true }))
        .map((room) => {
          const cap = Number(room.capacity) || 0;
          const occ = Math.min(Number(room.currentOccupants) || 0, cap);
          return { room, cap, occ, free: Math.max(0, cap - occ) };
        }),
    [hostelRooms]
  );

  const statCards = [
    { label: t('hostel.totalRooms'), value: stats.totalRooms, icon: DoorOpen },
    { label: t('hostelPage.totalSeats'), value: stats.totalSeats, icon: BedDouble },
    { label: t('hostelPage.occupiedSeats'), value: stats.occupiedSeats, icon: Users },
    { label: t('hostelPage.availableSeats'), value: stats.availableSeats, icon: Armchair },
  ];

  return (
    <div className="pt-0">
      {/* ───────────────────────── Header band ───────────────────────── */}
      <div className="relative bg-gradient-to-br from-islamic-dark via-islamic to-islamic-light overflow-hidden">
        <div className="absolute inset-0 islamic-pattern-overlay opacity-[0.06]" />
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-golden/5" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-golden via-golden-light to-golden" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="text-center"
          >
            <p className="text-golden text-xl md:text-2xl font-serif mb-3" dir="rtl">
              المسكن
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              {t('hostel.title')}
            </h1>
            <p className="text-white/70 text-base md:text-lg max-w-2xl mx-auto">
              {t('hostelPage.subtitle')}
            </p>
            <GoldRule className="mt-6 max-w-xs mx-auto" />
          </motion.div>
        </div>
      </div>

      {/* ───────────────────────── Stats row ───────────────────────── */}
      <section className="py-10 bg-gradient-to-r from-islamic-dark via-islamic to-islamic-light relative overflow-hidden">
        <div className="absolute inset-0 islamic-pattern-overlay opacity-[0.04]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {statCards.map((stat, i) => (
              <motion.div key={i} variants={itemVariants}>
                <StatCard dark tone={i % 2 === 0 ? 'emerald' : 'gold'} icon={stat.icon} value={String(stat.value)} label={stat.label} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ───────────────────────── Tabs: Rooms / Seats / Meals ───────────────────────── */}
      <section className="py-12 md:py-14 bg-islamic-lighter/20 dark:bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultSelectedKey="rooms" className="w-full">
            <Tabs.ListContainer className="w-full border-0 bg-transparent p-0 shadow-none">
              <Tabs.List
                aria-label={t('hostel.title')}
                className="mx-auto flex w-full sm:w-fit max-w-md sm:max-w-none glass border border-islamic/10 p-1.5 rounded-2xl sm:rounded-full shadow-sm"
              >
                {[
                  { id: 'rooms', icon: DoorOpen, label: t('hostelPage.tabRooms') },
                  { id: 'seats', icon: BedDouble, label: t('hostelPage.tabSeats') },
                  { id: 'meals', icon: Utensils, label: t('hostelPage.tabMeals') },
                ].map((tab) => (
                  <Tabs.Tab
                    key={tab.id}
                    id={tab.id}
                    className="flex-1 sm:flex-none min-h-11 px-3 sm:px-6 text-xs sm:text-sm font-semibold rounded-xl sm:rounded-full transition-all cursor-pointer data-[selected=true]:text-white data-[focus-visible=true]:ring-2 data-[focus-visible=true]:ring-golden/50"
                  >
                    <tab.icon className="w-3.5 h-3.5 mr-1.5 inline" />
                    {tab.label}
                    <Tabs.Indicator className="rounded-xl sm:rounded-full bg-gradient-to-r from-islamic to-islamic-dark shadow-md" />
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs.ListContainer>

            {/* ══════════════════ ROOMS ══════════════════ */}
            <Tabs.Panel id="rooms" className="mt-8 md:mt-10">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: EASE }}
              >
                <div className="flex flex-col gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-islamic-dark dark:text-foreground flex items-center gap-2">
                      <DoorOpen className="w-5 h-5 text-islamic" />
                      {t('hostelPage.roomList')}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">{t('hostelPage.roomsTabDesc')}</p>
                  </div>

                  {/* Filter chips — all ≥ 44px tall for touch */}
                  {hostelRooms.length > 0 && (
                    <div className="flex flex-wrap gap-2" role="group" aria-label={t('hostel.status')}>
                      {ROOM_FILTERS.map((f) => {
                        const active = roomFilter === f;
                        const count = filterCounts[f];
                        const label = f === 'all' ? t('hostelPage.filterAll') : f === 'available' ? t('hostelPage.filterAvailable') : f === 'full' ? t('hostelPage.filterFull') : t('hostelPage.filterMaintenance');
                        return (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setRoomFilter(f)}
                            aria-pressed={active}
                            className={cn(
                              'inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden/60 active:scale-[0.97]',
                              active
                                ? 'bg-islamic text-white shadow-md shadow-islamic/25'
                                : 'bg-card text-islamic-dark dark:text-foreground ring-1 ring-islamic/15 hover:ring-islamic/35'
                            )}
                          >
                            {label}
                            <span
                              className={cn(
                                'inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-bold',
                                active ? 'bg-white/20 text-white' : 'bg-islamic-lighter text-islamic-dark dark:bg-surface-tertiary dark:text-foreground'
                              )}
                            >
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {hostelRooms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground rounded-3xl border border-dashed border-islamic/20 bg-card">
                    <BedDouble className="size-16 opacity-15 mb-4" />
                    <p className="text-base font-medium">{t('hostelPage.noRooms')}</p>
                    <p className="text-sm mt-1 opacity-80">{t('hostelPage.roomsEmptyHint')}</p>
                  </div>
                ) : visibleRooms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-muted-foreground rounded-3xl border border-dashed border-islamic/20 bg-card">
                    <DoorOpen className="size-12 opacity-15 mb-3" />
                    <p className="text-sm font-medium">{t('adminHostel.noSearchResults')}</p>
                  </div>
                ) : (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-40px' }}
                    className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6"
                  >
                    {visibleRooms.map((room) => {
                      const cap = Number(room.capacity) || 0;
                      const occ = Math.min(Number(room.currentOccupants) || 0, cap);
                      const free = Math.max(0, cap - occ);
                      const status = statusConfig[room.status];
                      const typeKey = typeLabelKey[room.type];
                      return (
                        <motion.div key={room.id} variants={itemVariants} className="h-full">
                          <HCard topRule="emerald-gold" className="h-full rounded-2xl">
                            <div className="p-5 flex flex-col gap-4 h-full">
                              {/* Head: medallion + number + floor + status */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <IconMedallion icon={DoorOpen} tone="emerald" />
                                  <div className="min-w-0">
                                    <h3 className="font-bold text-islamic-dark dark:text-foreground truncate">
                                      {t('hostelPage.roomNo', { number: room.roomNumber })}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {t('hostel.floor')}: {room.floor || '—'}
                                    </p>
                                  </div>
                                </div>
                                <span
                                  className={cn(
                                    'inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold',
                                    status ? status.cls : 'bg-surface-tertiary text-muted-foreground'
                                  )}
                                >
                                  {status ? t(status.labelKey) : room.status}
                                </span>
                              </div>

                              {/* Type + capacity meta */}
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-tertiary/60 dark:bg-surface-tertiary px-2.5 py-1 font-medium text-muted-foreground">
                                  <BedDouble className="size-3.5" />
                                  {typeKey ? t(typeKey) : room.type || '—'}
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-tertiary/60 dark:bg-surface-tertiary px-2.5 py-1 font-medium text-muted-foreground">
                                  <Users className="size-3.5" />
                                  {t('hostelPage.capacityInfo', { count: cap })}
                                </span>
                              </div>

                              {/* Seat dots for small rooms, bar for dorms */}
                              <div className="mt-auto space-y-2.5">
                                {cap > 0 && cap <= 12 && <SeatDots occ={occ} cap={cap} />}
                                <OccupancyBar occ={occ} cap={cap} />
                                <div className="flex items-center justify-between gap-2 text-xs">
                                  <span className="text-muted-foreground font-medium">
                                    {t('hostelPage.seatsUsed', { used: occ, capacity: cap })}
                                  </span>
                                  <span className={cn('font-semibold', free === 0 ? 'text-danger' : 'text-islamic dark:text-golden')}>
                                    {free === 0 ? t('hostelPage.roomFullyBooked') : t('hostelPage.freeSeatsLeft', { count: free })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </HCard>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </motion.div>
            </Tabs.Panel>

            {/* ══════════════════ SEATS ══════════════════ */}
            <Tabs.Panel id="seats" className="mt-8 md:mt-10">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: EASE }}
              >
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-islamic-dark dark:text-foreground flex items-center gap-2">
                    <Armchair className="w-5 h-5 text-islamic" />
                    {t('hostelPage.tabSeats')}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">{t('hostelPage.seatsTabDesc')}</p>
                </div>

                {seatRows.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground rounded-3xl border border-dashed border-islamic/20 bg-card">
                    <Armchair className="size-16 opacity-15 mb-4" />
                    <p className="text-base font-medium">{t('hostelPage.noRooms')}</p>
                    <p className="text-sm mt-1 opacity-80">{t('hostelPage.seatsEmptyHint')}</p>
                  </div>
                ) : (
                  <div className="grid lg:grid-cols-3 gap-5 md:gap-6">
                    {/* Overall occupancy summary */}
                    <HCard topRule="gold" className="rounded-2xl lg:sticky lg:top-24 self-start w-full">
                      <div className="p-6 flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                          <IconMedallion icon={BedDouble} tone="gold" />
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {t('hostelPage.overallOccupancy')}
                            </p>
                            <p className="text-3xl font-black text-islamic-dark dark:text-foreground leading-tight">
                              {stats.occupancyPct}%
                            </p>
                          </div>
                        </div>
                        <OccupancyBar occ={stats.occupiedSeats} cap={stats.totalSeats} className="h-3" />
                        <p className="text-sm text-muted-foreground">
                          {t('hostelPage.seatsSummary', { occupied: stats.occupiedSeats, free: stats.availableSeats })}
                        </p>
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          {[
                            { label: t('hostel.totalRooms'), value: stats.totalRooms },
                            { label: t('hostelPage.totalSeats'), value: stats.totalSeats },
                            { label: t('hostelPage.availableSeats'), value: stats.availableSeats },
                          ].map((mini) => (
                            <div key={mini.label} className="rounded-xl bg-surface-tertiary/40 dark:bg-surface-tertiary/20 px-2 py-3 text-center">
                              <p className="text-lg font-bold text-islamic-dark dark:text-foreground leading-none">{mini.value}</p>
                              <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{mini.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </HCard>

                    {/* Per-room seat list */}
                    <div className="lg:col-span-2">
                      <HCard topRule="emerald-gold" className="rounded-2xl">
                        <div className="divide-y divide-islamic/5 dark:divide-border">
                          {seatRows.map(({ room, cap, occ, free }) => (
                            <div key={room.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 hover:bg-golden-lighter/20 dark:hover:bg-surface-tertiary/20 transition-colors">
                              <div className="flex items-center gap-3 sm:w-44 shrink-0 min-w-0">
                                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-islamic-lighter text-islamic ring-1 ring-islamic/15">
                                  <DoorOpen className="size-4.5" />
                                </span>
                                <div className="min-w-0">
                                  <p className="font-bold text-sm text-islamic-dark dark:text-foreground truncate">
                                    {t('hostelPage.roomNo', { number: room.roomNumber })}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground truncate">
                                    {t('hostel.floor')}: {room.floor || '—'} • {typeLabelKey[room.type] ? t(typeLabelKey[room.type]) : room.type || '—'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                {cap > 0 && cap <= 12 && (
                                  <SeatDots occ={occ} cap={cap} />
                                )}
                                <OccupancyBar occ={occ} cap={cap} className={cap > 0 && cap <= 12 ? 'mt-2' : ''} />
                              </div>
                              <div className="sm:w-28 shrink-0 sm:text-end">
                                <p className="text-sm font-bold text-islamic-dark dark:text-foreground">
                                  {occ}/{cap}
                                </p>
                                <p className={cn('text-[11px] font-semibold', free === 0 ? 'text-danger' : 'text-islamic dark:text-golden')}>
                                  {free === 0 ? t('hostelPage.statusFull') : t('adminHostel.freeSeats', { count: free })}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </HCard>
                    </div>
                  </div>
                )}
              </motion.div>
            </Tabs.Panel>

            {/* ══════════════════ MEALS ══════════════════ */}
            <Tabs.Panel id="meals" className="mt-8 md:mt-10">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: EASE }}
              >
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-islamic-dark dark:text-foreground flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-islamic" />
                    {t('hostelPage.weeklyMenu')}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">{t('hostelPage.mealsTabDesc')}</p>
                </div>

                {sortedMeals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground rounded-3xl border border-dashed border-islamic/20 bg-card">
                    <Utensils className="size-16 opacity-15 mb-4" />
                    <p className="text-base font-medium">{t('hostelPage.noMeals')}</p>
                    <p className="text-sm mt-1 opacity-80">{t('hostelPage.mealsEmptyHint')}</p>
                  </div>
                ) : (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-40px' }}
                    className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6"
                  >
                    {sortedMeals.map(({ meal, dayKey }) => {
                      const isToday = dayKey === todayKey;
                      return (
                        <motion.div key={meal.id} variants={itemVariants} className="h-full">
                          <HCard
                            topRule={isToday ? 'gold' : false}
                            className={cn(
                              'h-full rounded-2xl transition-shadow',
                              isToday && 'ring-2 ring-golden/50 shadow-lg shadow-golden/10'
                            )}
                          >
                            <div className="p-5 flex flex-col gap-3.5 h-full">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-3 min-w-0">
                                  <IconMedallion icon={Utensils} tone={isToday ? 'gold' : 'emerald'} />
                                  <div className="min-w-0">
                                    <h3 className="font-bold text-islamic-dark dark:text-foreground">
                                      {DAY_LABEL_KEY[dayKey] ? t(DAY_LABEL_KEY[dayKey]) : meal.day}
                                    </h3>
                                    {meal.date ? (
                                      <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                        <CalendarDays className="size-3" />
                                        {meal.date}
                                      </p>
                                    ) : null}
                                  </div>
                                </div>
                                {isToday && (
                                  <span className="inline-flex shrink-0 items-center rounded-full bg-golden-lighter text-golden ring-1 ring-golden/40 px-2.5 py-1 text-[11px] font-bold">
                                    {t('hostelPage.today')}
                                  </span>
                                )}
                              </div>

                              <div className="space-y-2">
                                <MealRow icon={Coffee} label={t('hostelPage.morning')} value={meal.breakfast} emptyText={t('hostelPage.mealEmpty')} />
                                <MealRow icon={UtensilsCrossed} label={t('hostelPage.noon')} value={meal.lunch} emptyText={t('hostelPage.mealEmpty')} />
                                <MealRow icon={MoonStar} label={t('hostelPage.night')} value={meal.dinner} emptyText={t('hostelPage.mealEmpty')} />
                              </div>
                            </div>
                          </HCard>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </motion.div>
            </Tabs.Panel>
          </Tabs>
        </div>
      </section>

      <BackToTop />
    </div>
  );
}
