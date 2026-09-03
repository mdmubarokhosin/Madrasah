'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Search, Filter, Library, BookMarked } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import PageBanner from '@/components/pages/PageBanner';
import BackToTop from '@/components/pages/BackToTop';
import PageSkeleton from '@/components/pages/PageSkeleton';
import { useAppStore } from '@/store/app-store';
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
  const { libraryBooks, dataLoaded } = useAppStore();
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

  if (!dataLoaded) return <PageSkeleton cards={6} showStats />;

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
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 text-center border border-white/10 hover:bg-white/15 transition-colors">
                  <stat.icon className="w-6 h-6 text-golden mx-auto mb-2" />
                  <p className="text-xl md:text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-white/60 mt-1">{stat.label}</p>
                </div>
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
                placeholder={t('library.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label={t('library.searchPlaceholder')}
                className="pl-10"
              />
            </div>
            {categories.length > 0 && (
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full sm:w-48" aria-label={t('library.category')}>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder={t('library.category')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('library.allCategories')}</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
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
                  <Card className="h-full hover:shadow-lg transition-shadow border border-gray-100">
                    <CardContent className="p-5">
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
                        <Badge className="bg-islamic/10 text-islamic border-0 text-xs mb-3">
                          {book.category}
                        </Badge>
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
                            book.availableCopies > 0 ? 'text-green-600' : 'text-red-500'
                          }`}>
                            {t('library.available')}: {book.availableCopies}
                          </span>
                        </div>
                        <Badge
                          className={`text-xs border-0 ${
                            book.availableCopies > 0
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {book.availableCopies > 0 ? t('library.available') : t('library.none')}
                        </Badge>
                      </div>
                    </CardContent>
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
