'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, ChevronLeft, ChevronRight, Image as ImageIcon, FolderOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import SectionHeading from './SectionHeading';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { loc } from '@/lib/multilingual';

export default function Gallery({ hideHeading }: { hideHeading?: boolean }) {
  const { gallery: storeGallery } = useAppStore();
  const { t, language } = useTranslation();
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  // Build gallery items from store
  const galleryItems = useMemo(() => {
    return storeGallery.map((g) => ({
      id: g.id,
      category: g.category,
      title: loc(language, g, 'title'),
      imageUrl: g.imageUrl || '',
      color: 'from-islamic to-emerald-600',
    }));
  }, [storeGallery]);

  // Extract categories dynamically
  const categories = useMemo(() => {
    if (storeGallery.length > 0) {
      const cats = Array.from(new Set(storeGallery.map((g) => g.category)));
      return ['all', ...cats];
    }
    return [];
  }, [storeGallery]);

  const filtered = activeCategory === 'all'
    ? galleryItems
    : galleryItems.filter((item) => item.category === activeCategory);

  const handlePrev = () => {
    if (selectedItem === null) return;
    const currentIndex = filtered.findIndex((item) => item.id === selectedItem);
    const prevIndex = (currentIndex - 1 + filtered.length) % filtered.length;
    setSelectedItem(filtered[prevIndex].id);
  };

  const handleNext = () => {
    if (selectedItem === null) return;
    const currentIndex = filtered.findIndex((item) => item.id === selectedItem);
    const nextIndex = (currentIndex + 1) % filtered.length;
    setSelectedItem(filtered[nextIndex].id);
  };

  const selectedGalleryItem = galleryItems.find((item) => item.id === selectedItem);

  return (
    <section id="gallery" className="py-12 md:py-20 bg-islamic-lighter/20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!hideHeading && (
          <SectionHeading
            title={t('gallery.title')}
            subtitle={t('gallery.subtitle')}
            arabicText={t('gallery.arabic')}
          />
        )}

        {galleryItems.length > 0 ? (
          <>
            {/* Category Filters */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? 'default' : 'outline'}
                  onClick={() => setActiveCategory(cat)}
                  className={
                    activeCategory === cat
                      ? 'bg-islamic hover:bg-islamic-light text-white'
                      : 'border-islamic/30 text-islamic hover:bg-islamic-lighter'
                  }
                  size="sm"
                >
                  {cat === 'all' ? t('common.all') : cat}
                </Button>
              ))}
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {filtered.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    layout
                  >
                    <Card
                      className="cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden group border-0 shadow-sm"
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedItem(item.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedItem(item.id); } }}
                    >
                      <CardContent className="p-0 relative">
                        <div
                          className={`w-full aspect-square ${item.imageUrl ? '' : `bg-gradient-to-br ${item.color}`} flex flex-col items-center justify-center p-4 relative overflow-hidden`}
                        >
                          {item.imageUrl ? (
                            <>
                              <img src={item.imageUrl} className="w-full h-full object-cover absolute inset-0" alt={item.title} />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <ImageIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </>
                          ) : (
                            <>
                              <Camera className="w-10 h-10 text-white/60 mb-2" />
                              <p className="text-white text-center text-xs font-medium leading-tight">
                                {loc(language, item, 'title')}
                              </p>
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <ImageIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </>
                          )}
                        </div>
                        <div className="p-2 bg-white">
                          <p className="text-xs text-gray-500 text-center">{item.category}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FolderOpen className="size-12 opacity-20 mb-3" />
            <p className="text-sm">{t('gallery.noData')}</p>
            <p className="text-xs mt-1">{t('galleryPage.adminAddHint')}</p>
          </div>
        )}

        {/* Lightbox Dialog */}
        <Dialog open={selectedItem !== null} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-3xl w-[calc(100vw-2rem)] p-0 bg-black/90 border-none">
            <DialogTitle className="sr-only">{selectedGalleryItem ? loc(language, selectedGalleryItem, 'title') : ''}</DialogTitle>
            <DialogDescription className="sr-only">{selectedGalleryItem?.category}</DialogDescription>
            {selectedGalleryItem && (
              <div className="relative">
                <div
                  className={`w-full aspect-video ${selectedGalleryItem.imageUrl ? '' : `bg-gradient-to-br ${selectedGalleryItem.color}`} flex flex-col items-center justify-center`}
                >
                  {selectedGalleryItem.imageUrl ? (
                    <img src={selectedGalleryItem.imageUrl} className="w-full h-full object-cover" alt={selectedGalleryItem.title} />
                  ) : (
                    <>
                      <Camera className="w-16 h-16 text-white/60 mb-3" />
                      <p className="text-white text-lg font-medium">{selectedGalleryItem.title}</p>
                      <p className="text-white/60 text-sm mt-1">{selectedGalleryItem.category}</p>
                    </>
                  )}
                </div>

                <button
                  onClick={handlePrev}
                  aria-label="Previous image"
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 sm:p-3 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNext}
                  aria-label="Next image"
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 sm:p-3 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setSelectedItem(null)}
                  aria-label="Close lightbox"
                  className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 sm:p-3 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
