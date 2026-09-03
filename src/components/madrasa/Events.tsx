'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, Tag, X, ArrowLeft, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SectionHeading from './SectionHeading';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { loc } from '@/lib/multilingual';
import type { Event } from '@/types/database';

const eventTypeColors: Record<string, string> = {
  academic: 'bg-blue-100 text-blue-700 border-blue-200',
  religious: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cultural: 'bg-purple-100 text-purple-700 border-purple-200',
  sports: 'bg-orange-100 text-orange-700 border-orange-200',
  other: 'bg-gray-100 text-gray-700 border-gray-200',
};



function EventDetailModal({ event, onClose, getEventTypeLabel, language }: { event: Event; onClose: () => void; getEventTypeLabel: (type: string) => string; language: 'bn' | 'en' | 'ar' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-background rounded-xl sm:rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-islamic-dark text-white p-4 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors min-w-[36px] min-h-[36px]"
          >
            <X className="w-4 h-4" />
          </button>
          <Badge className={`${eventTypeColors[event.type]} mb-3`}>
            {getEventTypeLabel(event.type)}
          </Badge>
          <h2 className="text-lg sm:text-xl font-bold pr-8">{loc(language, event, 'title')}</h2>
        </div>
        <div className="p-6 space-y-4">
          {loc(language, event, 'description') && (
            <p className="text-gray-600 text-sm leading-relaxed">{loc(language, event, 'description')}</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-islamic" />
              <span className="text-gray-600">{event.date}</span>
            </div>
            {event.time && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-islamic" />
                <span className="text-gray-600">{event.time}</span>
              </div>
            )}
            {loc(language, event, 'location') && (
              <div className="flex items-center gap-2 text-sm col-span-2">
                <MapPin className="w-4 h-4 text-islamic" />
                <span className="text-gray-600">{loc(language, event, 'location')}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Events({ hideHeading }: { hideHeading?: boolean }) {
  const { events: storeEvents } = useAppStore();
  const { t, language } = useTranslation();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedEvent) {
        setSelectedEvent(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedEvent]);

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
    <section id="events" className="py-12 md:py-20 bg-gradient-to-b from-islamic-lighter/30 to-white relative">
      <div className="absolute inset-0 islamic-pattern-bg pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {!hideHeading && (
          <SectionHeading
            title={t('events.title')}
            subtitle={t('events.subtitle')}
            arabicText={t('events.arabic')}
          />
        )}

        {/* Important Events Banner */}
        {importantEvents.length > 0 && (
          <div className="mb-8">
            <div className="bg-golden/10 border border-golden/30 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-golden mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-islamic-dark mb-1">{t('events.importantAnnouncement')}</p>
                <div className="space-y-1">
                  {importantEvents.slice(0, 2).map((e) => (
                    <p key={e.id} className="text-sm text-gray-600">
                      <span className="font-medium text-islamic-dark">{e.title}</span>
                      {' — '}
                      {e.date}
                      {e.time && ` ${e.time}`}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 ? (
          <div className="mb-12">
            <h3 className="text-lg font-bold text-islamic-dark mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-islamic" />
              {t('events.upcoming')}
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card
                    className="h-full hover:shadow-lg transition-all border border-gray-100 cursor-pointer group"
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedEvent(event)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedEvent(event); } }}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <Badge className={`${eventTypeColors[event.type]} text-xs`}>
                          <Tag className="w-3 h-3 mr-1" />
                          {getEventTypeLabel(event.type)}
                        </Badge>
                        {event.important && (
                          <span className="text-golden text-xs font-bold">★ {t('events.importantTag')}</span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-islamic-dark mb-2 group-hover:text-islamic transition-colors leading-tight">
                        {loc(language, event, 'title')}
                      </h4>
                      {loc(language, event, 'description') && (
                        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{loc(language, event, 'description')}</p>
                      )}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="w-3.5 h-3.5 text-islamic" />
                          {event.date}
                        </div>
                        {event.time && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="w-3.5 h-3.5 text-islamic" />
                            {event.time}
                          </div>
                        )}
                        {loc(language, event, 'location') && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <MapPin className="w-3.5 h-3.5 text-islamic" />
                            {loc(language, event, 'location')}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 mb-8">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{t('events.noUpcoming')}</p>
          </div>
        )}

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-islamic-dark mb-4 flex items-center gap-2">
              <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
              {t('events.recent')}
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card
                    className="h-full border border-gray-100 opacity-70 cursor-pointer group"
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedEvent(event)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedEvent(event); } }}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <Badge className={`${eventTypeColors[event.type]} text-xs`}>
                          {getEventTypeLabel(event.type)}
                        </Badge>
                        <span className="text-xs text-gray-400">{t('events.completed')}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-gray-600 mb-1">{loc(language, event, 'title')}</h4>
                      <p className="text-xs text-gray-400">{event.date}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} getEventTypeLabel={getEventTypeLabel} language={language} />
        )}
      </AnimatePresence>
    </section>
  );
}
