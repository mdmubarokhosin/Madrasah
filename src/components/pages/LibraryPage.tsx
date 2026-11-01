'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Search, Filter, Library, BookMarked } from 'lucide-react';
import { Card } from '@heroui/react/card';
import { Chip } from '@heroui/react/chip';
import { Input } from '@heroui/react/input';
import { Select } from '@heroui/react/select';
import { ListBox } from '@heroui/react/list-box';
import PageBanner from '@/components/pages/PageBanner';
import BackToTop from '@/components/pages/BackToTop';
import { useAppStore } from '@/store/app-store';
import { StatCard } from '@/components/heroui/islamic';
import { useTranslation } from '@/lib/i18n-context';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function LibraryPage() {
  const { libraryBooks } = useAppStore();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const categories = useMemo(
    () => [...new Set(libraryBooks.map((b) => b.category).filter(Boolean))],
    [libraryBooks]
  );

  const filtered = useMemo(() => {
    return libraryBooks.filter((book) => {
      const term = searchTerm.toLowerCase();
      const matchSearch =
        !term ||
        book.title.toLowerCase().includes(term) ||
        book.author.toLowerCase().includes(term) ||
        book.category.toLowerCase().includes(term);
      const matchCategory = filterCategory === 'all' || book.category === filterCategory;
      return matchSearch && matchCategory;
    });
  }, [libraryBooks, searchTerm, filterCategory]);

  const totalBooks = libraryBooks.reduce((sum, b) => sum + b.totalCopies, 0);
  const totalAvailable = libraryBooks.reduce((sum, b) => sum + b.availableCopies, 0);


  return (
    <div className="pt-0">
      <PageBanner
        titleKey="library.title"
        arabicText="المكتبة"
        subtitleKey="library.subtitle"
      />

      {/* Stats */}
      <section className="py-10 bg-gradient-to-r from-islamic-dark via-islamic to-islamic-light relative overflow-hidden">
        <div className="absolute inset-0 islamic-pattern-overlay opacity-[0.04]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { label: t('library.totalTitles'), value: libraryBooks.length.toString(), icon: BookMarked },
              { label: t('library.totalBooks'), value: totalBooks.toString(), icon: BookOpen },
              { label: t('library.available'), value: totalAvailable.toString(), icon: Library },
              { label: t('library.issued'), value: (totalBooks - totalAvailable).toString(), icon: BookOpen },
            ].map((stat, i) => (
              <motion.div key={i} variants={itemVariants}>
                <StatCard dark tone={i % 2 === 0 ? 'emerald' : 'gold'} icon={stat.icon} value={stat.value} label={stat.label} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 bg-islamic-lighter/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-3 mb-8"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                      fullWidth
                placeholder={t('library.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label={t('library.searchPlaceholder')}
                className="pl-10"
              />
            </div>
            {categories.length > 0 && (
              <Select
                aria-label={t('library.category')}
                placeholder={t('library.category')}
                value={filterCategory || null}
                onChange={(val) => setFilterCategory(val == null ? '' : String(val))}
              >
                <Select.Trigger className="w-full sm:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover className="rounded-xl border border-islamic/15 bg-white shadow-xl">
                  <ListBox aria-label={t('library.category')}>
                    <ListBox.Item id="all" textValue={t('library.allCategories')} className="rounded-lg px-3 py-2 text-sm data-[selected=true]:bg-islamic-lighter data-[hovered=true]:bg-islamic-lighter/60">
                      {t('library.allCategories')}
                    </ListBox.Item>
                    {categories.map((c) => (
                      <ListBox.Item key={c} textValue={c} id={c} className="rounded-lg px-3 py-2 text-sm data-[selected=true]:bg-islamic-lighter data-[hovered=true]:bg-islamic-lighter/60">
                        {c}
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            )}
          </motion.div>

          {/* Books Grid */}
          {filtered.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filtered.map((book) => (
                <motion.div key={book.id} variants={itemVariants}>
                  <Card className="h-full hover:shadow-lg transition-shadow border border-border">
                    <Card.Content className="p-5">
                      <div className="flex items-start gap-4 mb-3">
                        <div className="w-12 h-16 rounded-lg bg-islamic-lighter flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-6 h-6 text-islamic" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-islamic-dark text-sm line-clamp-2">{book.title}</h3>
                          <p className="text-sm text-muted-foreground">{book.author}</p>
                        </div>
                      </div>

                      {book.category && (
                        <Chip className="bg-islamic/10 text-islamic border-0 text-xs mb-3">
                          {book.category}
                        </Chip>
                      )}

                      <div className="space-y-2 text-sm text-muted-foreground">
                        {book.isbn && (
                          <p>ISBN: <span className="text-islamic-dark font-medium">{book.isbn}</span></p>
                        )}
                        {book.shelfLocation && (
                          <p>{t('library.shelf')} <span className="text-islamic-dark font-medium">{book.shelfLocation}</span></p>
                        )}
                      </div>

                      <div className="mt-3 pt-3 border-t flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">{t('library.copies')} {book.totalCopies}</span>
                          <span className={`text-xs font-medium ${
                            book.availableCopies > 0 ? 'text-primary' : 'text-danger'
                          }`}>
                            {t('library.available')}: {book.availableCopies}
                          </span>
                        </div>
                        <Chip
                          className={`text-xs border-0 ${
                            book.availableCopies > 0
                              ? 'bg-primary/10 text-primary'
                              : 'bg-danger/10 text-danger'
                          }`}
                        >
                          {book.availableCopies > 0 ? t('library.available') : t('library.none')}
                        </Chip>
                      </div>
                    </Card.Content>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <BookOpen className="size-16 opacity-15 mb-4" />
              <p className="text-base font-medium">{t('library.noBooks')}</p>
            </div>
          )}
        </div>
      </section>

      <BackToTop />
    </div>
  );
}
