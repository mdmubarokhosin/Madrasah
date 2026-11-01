'use client';

import { Fragment, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, AlertTriangle, ChevronRight, FolderOpen, X, CalendarDays } from 'lucide-react';
import { Heading } from '@heroui/react/typography';
import { Modal } from '@heroui/react/modal';
import SectionHeading from './SectionHeading';
import { HButton, HCard, HChip } from '@/components/heroui/islamic';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { loc } from '@/lib/multilingual';
import type { Notice } from '@/types/database';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ── Full-notice reader modal (same HeroUI dialog pattern as Events) ── */
function NoticeDetailModal({
  notice,
  onClose,
}: {
  notice: Notice;
  onClose: () => void;
}) {
  const { t, language } = useTranslation();
  const title = loc(language, notice, 'title');
  const content = loc(language, notice, 'content');

  return (
    <Modal>
      <Modal.Backdrop isOpen onOpenChange={(o) => { if (!o) onClose(); }} variant="blur" className="bg-night/80 backdrop-blur-md">
        <Modal.Container placement="center" size="lg">
          <Modal.Dialog aria-label={title} className="p-0 gap-0 border-0 bg-transparent shadow-none">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="w-full"
            >
              <HCard className="w-full max-h-[85vh] overflow-y-auto p-0 gap-0">
                {/* Header band */}
                <div className="bg-night text-white p-4 sm:p-6 relative sticky top-0 z-10">
                  <HButton
                    variant="ghost"
                    onPress={onClose}
                    aria-label={t('common.close')}
                    className="absolute top-3 end-3 size-11 rounded-full p-0 bg-white/10 hover:bg-white/20 text-white hover:text-gold-soft"
                  >
                    <X className="w-5 h-5" />
                  </HButton>
                  <HChip variant={notice.important ? 'gold' : 'emerald'} className="text-[11px] mb-3">
                    {notice.important ? t('notices.important') : t('notices.fullNotice')}
                  </HChip>
                  <h2 className="text-lg sm:text-xl font-bold pe-12 leading-snug text-white">
                    {title}
                  </h2>
                  <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-gold-soft/90">
                    <CalendarDays className="size-3.5" aria-hidden="true" />
                    {t('notices.published')}: {notice.date}
                  </p>
                  <div className="hairline-gold absolute bottom-0 inset-x-0" aria-hidden="true" />
                </div>

                {/* Full content — whitespace-pre-line keeps admin's line breaks */}
                <div className="p-5 sm:p-6">
                  <p className="text-[15px] leading-[1.9] text-foreground whitespace-pre-line">
                    {content || t('notices.noData')}
                  </p>
                </div>
              </HCard>
            </motion.div>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

export default function NoticeBoard({ hideHeading }: { hideHeading?: boolean }) {
  const { notices: storeNotices } = useAppStore();
  const { t, language } = useTranslation();
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  const notices = storeNotices.map((n) => ({
    notice: n,
    id: n.id,
    title: loc(language, n, 'title'),
    content: loc(language, n, 'content'),
    date: n.date,
    important: n.important || false,
    recent: (Date.now() - (n.createdAt || 0)) < 2592000000,
  }));

  return (
    <section id="notices" className="relative py-16 md:py-24 bg-paper">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!hideHeading && (
          <SectionHeading
            title={t('notices.title')}
            subtitle={t('notices.subtitle')}
            arabicText={t('notices.arabic')}
          />
        )}

        {notices.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <HCard className="h-full p-0 gap-0">
              <div className="w-full p-3 sm:p-4">
                <div className="gold-flow-line mb-1 sm:mb-2" aria-hidden="true" />
                <div
                  className="results-scroll overflow-y-auto max-h-[420px] lg:max-h-[560px] px-1 sm:px-2"
                  aria-label={t('notices.title')}
                >
                  {notices.map((notice, index) => (
                    <Fragment key={notice.id}>
                      <motion.article
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.45, delay: Math.min(index, 8) * 0.08, ease: EASE }}
                        className="group flex items-start gap-3 px-2 sm:px-3 py-4 rounded-xl hover:bg-islamic-lighter/25 dark:hover:bg-white/5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-islamic/40"
                        role="button"
                        tabIndex={0}
                        aria-haspopup="dialog"
                        aria-label={`${notice.title} — ${t('notices.readMore')}`}
                        onClick={() => setSelectedNotice(notice.notice)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedNotice(notice.notice);
                          }
                        }}
                      >
                        {/* Icon marker */}
                        <span
                          aria-hidden="true"
                          className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${
                            notice.important
                              ? 'bg-golden-lighter/70 ring-1 ring-golden/30 text-golden'
                              : 'bg-islamic-lighter/70 ring-1 ring-islamic/15 text-islamic'
                          }`}
                        >
                          {notice.important ? (
                            <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                          ) : (
                            <Bell className="w-4 h-4" aria-hidden="true" />
                          )}
                        </span>

                        <div className="flex-1 min-w-0 text-start">
                          {/* Title + date on one row */}
                          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                            <Heading level={4} className="text-sm font-bold text-islamic-dark group-hover:text-islamic transition-colors">
                              <span className="line-clamp-1">{notice.title}</span>
                            </Heading>
                            <time className="text-[11px] font-medium text-muted-foreground/80 whitespace-nowrap">
                              {notice.date}
                            </time>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mt-1 text-start">
                            {notice.content}
                          </p>
                        </div>

                        {/* Badges pinned to the far edge */}
                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          {notice.important && (
                            <HChip variant="gold" className="text-[10px] px-2 py-0.5">
                              {t('notices.important')}
                            </HChip>
                          )}
                          {notice.recent && !notice.important && (
                            <HChip variant="emerald" className="text-[10px] px-2 py-0.5">
                              {t('admin.newMessage')}
                            </HChip>
                          )}
                          <ChevronRight
                            className="w-4 h-4 text-muted-foreground/40 group-hover:text-islamic group-hover:translate-x-0.5 transition-all rtl:-scale-x-100"
                            aria-hidden="true"
                          />
                        </div>
                      </motion.article>
                      {index < notices.length - 1 && (
                        <div className="hairline-gold mx-2 sm:mx-3" aria-hidden="true" />
                      )}
                    </Fragment>
                  ))}
                </div>
              </div>
            </HCard>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FolderOpen className="size-12 opacity-20 mb-3" />
            <p className="text-sm">{t('notices.noData')}</p>
          </div>
        )}
      </div>

      {/* Full-notice reader */}
      {selectedNotice && (
        <NoticeDetailModal notice={selectedNotice} onClose={() => setSelectedNotice(null)} />
      )}
    </section>
  );
}
