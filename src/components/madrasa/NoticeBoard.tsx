'use client';

import { motion } from 'framer-motion';
import { Bell, AlertTriangle, Clock, ChevronRight, FolderOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SectionHeading from './SectionHeading';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { loc } from '@/lib/multilingual';

export default function NoticeBoard({ hideHeading }: { hideHeading?: boolean }) {
  const { notices: storeNotices } = useAppStore();
  const { t, language } = useTranslation();

  const notices = storeNotices.map((n) => ({
    id: n.id,
    title: loc(language, n, 'title'),
    content: loc(language, n, 'content'),
    date: n.date,
    important: n.important || false,
    recent: (Date.now() - (n.createdAt || 0)) < 2592000000,
  }));

  return (
    <section id="notices" className="py-12 md:py-20 bg-islamic-lighter/20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!hideHeading && (
          <SectionHeading
            title={t('notices.title')}
            subtitle={t('notices.subtitle')}
            arabicText={t('notices.arabic')}
          />
        )}

        {notices.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-3 md:gap-4 max-h-[300px] sm:max-h-[400px] lg:max-h-[600px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
            {notices.map((notice, index) => (
              <motion.div
                key={notice.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
              >
                <Card className="h-full hover:shadow-md transition-shadow border border-gray-100 group">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {notice.important ? (
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                        ) : (
                          <Bell className="w-5 h-5 text-islamic" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {notice.date}
                          </span>
                          {notice.important && (
                            <Badge variant="destructive" className="text-xs px-2 py-0">
                              {t('notices.important')}
                            </Badge>
                          )}
                          {notice.recent && !notice.important && (
                            <Badge className="text-xs px-2 py-0 bg-islamic-lighter text-islamic border-0">
                              {t('admin.newMessage')}
                            </Badge>
                          )}
                        </div>
                        <h4 className="text-sm font-semibold text-islamic-dark mb-1 group-hover:text-islamic transition-colors">
                          {notice.title}
                        </h4>
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                          {notice.content}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FolderOpen className="size-12 opacity-20 mb-3" />
            <p className="text-sm">{t('notices.noData')}</p>
          </div>
        )}
      </div>
    </section>
  );
}
