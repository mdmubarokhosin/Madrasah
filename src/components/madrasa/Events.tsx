'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Tag, X, ArrowLeft, AlertCircle } from 'lucide-react';
import { Heading } from '@heroui/react/typography';
import SectionHeading from './SectionHeading';
import { HButton, HCard, HChip, IconMedallion } from '@/components/heroui/islamic';
import { Modal } from '@heroui/react/modal';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { loc } from '@/lib/multilingual';
import type { Event } from '@/types/database';

/* Shared cinematic ease for scroll reveals */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* Islamic palette chip variants per event type (emerald = academic,
   gold = highlighted/sacred, soft = neutral) */
const eventTypeVariant: Record<string, 'emerald' | 'gold' | 'soft'> = {
  academic: 'emerald',
  religious: 'gold',
  cultural: 'soft',
  sports: 'gold',
  other: 'soft',
};

/* Locale-aware month/day medallion data — derived from the stored ISO date,
   fully dynamic (no hardcoded calendar or institution text) */
const MEDALLION_LOCALES: Record<'bn' | 'en' | 'ar', string> = {
  bn: 'bn-BD',
  en: 'en-US',
  ar: 'ar',
};

function getDateMedallion(date: string, language: 'bn' | 'en' | 'ar'): { month: string; day: string } | null {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!parts) return null;
  const d = new Date(`${date}T00:00:00`);
  return {
    month: new Intl.DateTimeFormat(MEDALLION_LOCALES[language], { month: 'short' }).format(d),
    day: new Intl.NumberFormat(MEDALLION_LOCALES[language]).format(Number(parts[3])),
  };
}

function EventDetailModal({ event, onClose, getEventTypeLabel, language }: { event: Event; onClose: () => void; getEventTypeLabel: (type: string) => string; language: 'bn' | 'en' | 'ar' }) {
  // HeroUI Modal (React Aria) provides role=dialog, aria-modal, Escape
  // handling, focus trap + restore and body scroll lock out of the box.
  return (
    <Modal>
      <Modal.Backdrop isOpen onOpenChange={(o) => { if (!o) onClose(); }} variant="blur" className="bg-night/80 backdrop-blur-md">
        <Modal.Container placement="center" size="lg">
          <Modal.Dialog aria-label={loc(language, event, 'title')} className="p-0 gap-0 border-0 bg-transparent shadow-none">
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <HCard className="w-full max-h-[90vh] overflow-y-auto p-0 gap-0">
              <div className="bg-night text-white p-4 sm:p-6 relative">
                <HButton
                  variant="ghost"
                  onPress={onClose}
                  aria-label="Close"
                  className="absolute top-3 end-3 size-11 rounded-full p-0 bg-white/10 hover:bg-white/20 text-white hover:text-gold-soft"
                >
                  <X className="w-5 h-5" />
                </HButton>
                <HChip variant={eventTypeVariant[event.type] ?? 'soft'} className="text-[11px] mb-3">
                  {getEventTypeLabel(event.type)}
                </HChip>
                <h2 className="text-lg sm:text-xl font-bold pe-11 leading-snug text-white">
                  {loc(language, event, 'title')}
                </h2>
                <div className="hairline-gold absolute bottom-0 inset-x-0" aria-hidden="true" />
              </div>
              <div className="p-6 space-y-4">
                {loc(language, event, 'description') && (
                  <p className="text-muted-foreground text-sm leading-relaxed">{loc(language, event, 'description')}</p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2.5 text-sm rounded-xl bg-paper border border-islamic/10 px-3.5 py-3">
                    <Calendar className="w-4 h-4 text-gold-bright shrink-0" />
                    <span className="text-islamic-dark font-medium">{event.date}</span>
                  </div>
                  {event.time && (
                    <div className="flex items-center gap-2.5 text-sm rounded-xl bg-paper border border-islamic/10 px-3.5 py-3">
                      <Clock className="w-4 h-4 text-gold-bright shrink-0" />
                      <span className="text-islamic-dark font-medium">{event.time}</span>
                    </div>
                  )}
                  {loc(language, event, 'location') && (
                    <div className="flex items-center gap-2.5 text-sm rounded-xl bg-paper border border-islamic/10 px-3.5 py-3 col-span-2">
                      <MapPin className="w-4 h-4 text-gold-bright shrink-0" />
                      <span className="text-islamic-dark font-medium">{loc(language, event, 'location')}</span>
                    </div>
                  )}
                </div>
              </div>
            </HCard>
          </motion.div>
        </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

export default function Events({ hideHeading }: { hideHeading?: boolean }) {
  const { events: storeEvents } = useAppStore();
  const { t, language } = useTranslation();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      academic: t('events.academic'),
      religious: t('events.religious'),
      cultural: t('events.cultural'),
      sports: t('events.sports'),
      other: t('events.other'),
    };
    return labels[type] || type;
  };

  // Separate upcoming and past events
  const today = new Date().toISOString().split('T')[0];
  const upcomingEvents = storeEvents
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  const pastEvents = storeEvents
    .filter((e) => e.date < today)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const importantEvents = storeEvents.filter((e) => e.important && e.date >= today);

  return (
    <section id="events" className="relative py-16 md:py-24 bg-white">
      {/* Top gold flow line */}
      <div className="absolute top-0 inset-x-0" aria-hidden="true">
        <div className="gold-flow-line" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!hideHeading && (
          <SectionHeading
            title={t('events.title')}
            subtitle={t('events.subtitle')}
            arabicText={t('events.arabic')}
          />
        )}

        {/* Important Events Banner */}
        {importantEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: EASE }}
            className="mb-10"
          >
            <HCard topRule="gold" className="bg-gold-bright/[0.06] p-0 gap-0">
              <div className="w-full p-4 sm:p-5 flex items-start gap-3.5">
                <IconMedallion icon={AlertCircle} tone="gold" className="size-9" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-islamic-dark mb-1">{t('events.importantAnnouncement')}</p>
                  <div className="space-y-1">
                    {importantEvents.slice(0, 2).map((e) => (
                      <p key={e.id} className="text-sm text-muted-foreground">
                        <span className="font-semibold text-islamic-dark">{e.title}</span>
                        {' — '}
                        {e.date}
                        {e.time && ` ${e.time}`}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </HCard>
          </motion.div>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 ? (
          <div className="mb-12 md:mb-14">
            <div className="mb-6 flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-gold-bright/10 border border-gold-bright/25 grid place-items-center shrink-0" aria-hidden="true">
                <Calendar className="w-4 h-4 text-gold-bright" />
              </span>
              <Heading level={3} className="text-lg md:text-xl font-bold text-islamic-dark">{t('events.upcoming')}</Heading>
              <span className="hairline-gold flex-1" aria-hidden="true" />
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {upcomingEvents.map((event, index) => {
                const medallion = getDateMedallion(event.date, language);
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.55, delay: index * 0.08, ease: EASE }}
                    className="h-full"
                  >
                    <HCard
                      className="h-full group cursor-pointer p-0 gap-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-bright/60 focus-visible:ring-offset-2"
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedEvent(event)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedEvent(event); } }}
                    >
                      <div className="flex h-full">
                        {/* Gold timeline rail + dot */}
                        <div className="flex flex-col items-center py-5 ps-4 sm:ps-5" aria-hidden="true">
                          <span className="w-2.5 h-2.5 rounded-full bg-gold-bright shrink-0 shadow-[0_0_0_4px_color-mix(in_oklab,var(--warning)_15%,transparent)]" />
                          <span className="w-2.5 flex-1 rounded-full bg-gradient-to-b from-gold-bright to-islamic mt-1.5 opacity-50 transition-opacity duration-500 group-hover:opacity-90" />
                        </div>

                        <div className="flex-1 min-w-0 p-5 ps-4 sm:ps-5">
                          <div className="flex items-start gap-3.5">
                            {/* Date medallion (month / day split) — pinned left */}
                            {medallion ? (
                              <div className="w-14 h-14 rounded-xl bg-white shadow-lg border border-islamic/10 flex flex-col items-center justify-center shrink-0" aria-hidden="true">
                                <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-gold-bright leading-none">{medallion.month}</span>
                                <span className="text-lg font-black text-ink leading-none mt-1">{medallion.day}</span>
                              </div>
                            ) : (
                              <div className="w-14 h-14 rounded-xl bg-islamic-lighter/60 border border-islamic/10 grid place-items-center shrink-0" aria-hidden="true">
                                <Calendar className="w-5 h-5 text-islamic/70" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0 pt-0.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <HChip variant={eventTypeVariant[event.type] ?? 'soft'} className="text-[11px]">
                                  <Tag className="w-3 h-3 me-1" />
                                  {getEventTypeLabel(event.type)}
                                </HChip>
                                {event.important && (
                                  <span className="text-gold-bright text-[11px] font-bold leading-none">★ {t('events.importantTag')}</span>
                                )}
                              </div>
                              <Heading level={4} className="mt-2 text-base font-bold text-islamic-dark leading-snug line-clamp-2 group-hover:text-islamic transition-colors">
                                {loc(language, event, 'title')}
                              </Heading>
                            </div>
                          </div>

                          {loc(language, event, 'description') && (
                            <p className="mt-3 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                              {loc(language, event, 'description')}
                            </p>
                          )}

                          <div className="mt-4 pt-3.5 border-t border-islamic/10 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-gold-bright shrink-0" />
                              <span>{event.date}</span>
                            </span>
                            {event.time && (
                              <span className="inline-flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-gold-bright shrink-0" />
                                <span>{event.time}</span>
                              </span>
                            )}
                            {loc(language, event, 'location') && (
                              <span className="inline-flex items-center gap-1.5 min-w-0">
                                <MapPin className="w-3.5 h-3.5 text-gold-bright shrink-0" />
                                <span className="truncate">{loc(language, event, 'location')}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </HCard>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-14 mb-10">
            <div className="w-14 h-14 rounded-2xl bg-islamic-lighter/70 border border-islamic/10 grid place-items-center mx-auto mb-3" aria-hidden="true">
              <Calendar className="w-6 h-6 text-islamic/40" />
            </div>
            <p className="text-sm text-muted-foreground">{t('events.noUpcoming')}</p>
          </div>
        )}

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <div>
            <div className="mb-6 flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-islamic-lighter border border-islamic/15 grid place-items-center shrink-0" aria-hidden="true">
                <ArrowLeft className="w-4 h-4 text-islamic/60 rotate-180 rtl:rotate-0" />
              </span>
              <Heading level={3} className="text-lg md:text-xl font-bold text-islamic-dark">{t('events.recent')}</Heading>
              <span className="hairline-gold flex-1" aria-hidden="true" />
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {pastEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.55, delay: index * 0.08, ease: EASE }}
                  className="h-full"
                >
                  <HCard
                    className="h-full group cursor-pointer opacity-80 p-0 gap-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-bright/60 focus-visible:ring-offset-2"
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedEvent(event)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedEvent(event); } }}
                  >
                    <div className="w-full p-5">
                      <div className="flex flex-wrap items-center gap-2 mb-2.5">
                        <HChip variant={eventTypeVariant[event.type] ?? 'soft'} className="text-[11px]">
                          {getEventTypeLabel(event.type)}
                        </HChip>
                        <span className="text-[11px] font-semibold text-muted-foreground/80">{t('events.completed')}</span>
                      </div>
                      <Heading level={4} className="text-sm font-semibold text-islamic-dark leading-snug line-clamp-1 group-hover:text-islamic transition-colors">
                        {loc(language, event, 'title')}
                      </Heading>
                      <p className="mt-2 text-xs text-muted-foreground inline-flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-gold-bright/70 shrink-0" />
                        {event.date}
                      </p>
                    </div>
                  </HCard>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} getEventTypeLabel={getEventTypeLabel} language={language} />
      )}
    </section>
  );
}
