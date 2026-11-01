'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ChevronLeft, ChevronRight, Image as ImageIcon, FolderOpen, Play } from 'lucide-react';
import { Modal } from '@heroui/react/modal';
import { CloseButton } from '@heroui/react/close-button';
import { HCard, HChip } from '@/components/heroui/islamic';
import SectionHeading from './SectionHeading';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { loc } from '@/lib/multilingual';

/* Shared cinematic ease */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

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
      videoUrl: g.videoUrl || '',
      isVideo: g.mediaType === 'video' || !!g.videoUrl,
      color: 'from-islamic to-islamic-dark',
    }));
  }, [storeGallery, language]);

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
    <section id="gallery" className="relative py-16 md:py-24 bg-paper paper">
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
            {/* Category Filters — gold chips */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: EASE }}
              className="flex flex-wrap justify-center gap-2 mb-8 md:mb-10"
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  aria-pressed={activeCategory === cat}
                  className="inline-flex rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-bright/50 focus-visible:ring-offset-1 transition-transform active:scale-[0.97] cursor-pointer"
                >
                  <HChip
                    variant={activeCategory === cat ? 'emerald' : 'gold'}
                    className={`min-h-[44px] px-4 text-[13px] font-semibold cursor-pointer ${
                      activeCategory === cat ? 'bg-islamic text-white shadow-md shadow-islamic/30' : ''
                    }`}
                  >
                    {cat === 'all' ? t('common.all') : cat}
                  </HChip>
                </button>
              ))}
            </motion.div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              <AnimatePresence mode="popLayout">
                {filtered.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    layout
                  >
                    <HCard
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedItem(item.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedItem(item.id); } }}
                      className="group cursor-pointer rounded-2xl bg-night-2 p-0 gap-0 focus-visible:outline-2 focus-visible:outline-gold-bright/70"
                    >
                      <div
                        className={`w-full aspect-square relative overflow-hidden ${
                          item.imageUrl || item.videoUrl ? '' : `bg-gradient-to-br ${item.color} flex flex-col items-center justify-center p-4`
                        }`}
                      >
                        {item.videoUrl ? (
                          <>
                            <video
                              src={item.videoUrl}
                              muted
                              loop
                              autoPlay
                              playsInline
                              preload="metadata"
                              className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                            />
                            {/* Play badge */}
                            <div className="absolute inset-0 grid place-items-center pointer-events-none">
                              <span className="w-12 h-12 glass-dark rounded-full grid place-items-center">
                                <Play className="w-5 h-5 text-gold-soft ms-0.5" fill="currentColor" />
                              </span>
                            </div>
                          </>
                        ) : item.imageUrl ? (
                          <>
                            <img
                              src={item.imageUrl}
                              className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                              alt={item.title}
                            />
                            {/* Media-type chip (top-end) */}
                            <div className="absolute top-2.5 end-2.5 glass-dark rounded-full p-1.5 pointer-events-none" aria-hidden="true">
                              <ImageIcon className="w-3.5 h-3.5 text-gold-soft" />
                            </div>
                          </>
                        ) : (
                          <>
                            <Camera className="w-10 h-10 text-gold-soft/70 mb-2 relative" aria-hidden="true" />
                            <p className="text-white text-center text-xs font-medium leading-tight relative">
                              {loc(language, item, 'title')}
                            </p>
                            <div className="absolute top-2.5 end-2.5 glass-dark rounded-full p-1.5 pointer-events-none" aria-hidden="true">
                              <ImageIcon className="w-3.5 h-3.5 text-gold-soft" />
                            </div>
                          </>
                        )}

                        {/* Gradient scrim + caption */}
                        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-night/85 via-night/30 to-transparent pointer-events-none" aria-hidden="true" />
                        <p className="absolute bottom-2.5 start-3 end-3 text-[11px] font-medium text-white/85 truncate text-center pointer-events-none">
                          {item.category}
                        </p>
                      </div>
                    </HCard>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <div className="w-20 h-20 rounded-2xl bg-white border border-islamic/10 shadow-sm grid place-items-center mb-4" aria-hidden="true">
              <FolderOpen className="size-9 text-islamic/30" />
            </div>
            <p className="text-sm">{t('gallery.noData')}</p>
            <p className="text-xs mt-1">{t('galleryPage.adminAddHint')}</p>
          </div>
        )}

        {/* Lightbox Modal (HeroUI) */}
        <Modal>
          <Modal.Backdrop isOpen={selectedItem !== null} onOpenChange={() => setSelectedItem(null)} variant="blur" className="bg-night/80 backdrop-blur-md">
            <Modal.Container placement="center" size="lg">
              <Modal.Dialog
                aria-label={selectedGalleryItem ? loc(language, selectedGalleryItem, 'title') : ''}
                className="max-w-3xl sm:max-w-3xl w-[calc(100vw-2rem)] p-0 gap-0 bg-night/95 backdrop-blur-md border-none rounded-2xl overflow-hidden"
              >
                <span className="sr-only">{selectedGalleryItem ? loc(language, selectedGalleryItem, 'title') : ''}</span>
                <p className="sr-only">{selectedGalleryItem?.category}</p>
            {selectedGalleryItem && (
              <div className="relative">
                <div
                  className={`w-full aspect-video ${selectedGalleryItem.imageUrl || selectedGalleryItem.videoUrl ? '' : `bg-gradient-to-br ${selectedGalleryItem.color}`} flex flex-col items-center justify-center`}
                >
                  {selectedGalleryItem.videoUrl ? (
                    <video
                      src={selectedGalleryItem.videoUrl}
                      controls
                      autoPlay
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-contain"
                    />
                  ) : selectedGalleryItem.imageUrl ? (
                    <img src={selectedGalleryItem.imageUrl} className="w-full h-full object-cover" alt={selectedGalleryItem.title} />
                  ) : (
                    <>
                      <Camera className="w-16 h-16 text-gold-soft/70 mb-3" aria-hidden="true" />
                      <p className="text-white text-lg font-medium">{selectedGalleryItem.title}</p>
                      <p className="text-white/60 text-sm mt-1">{selectedGalleryItem.category}</p>
                    </>
                  )}
                </div>

                <button
                  onClick={handlePrev}
                  aria-label="Previous image"
                  className="absolute start-2 sm:start-4 top-1/2 -translate-y-1/2 glass-dark rounded-full p-3 text-white hover:text-gold-soft transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNext}
                  aria-label="Next image"
                  className="absolute end-2 sm:end-4 top-1/2 -translate-y-1/2 glass-dark rounded-full p-3 text-white hover:text-gold-soft transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                <CloseButton
                  onPress={() => setSelectedItem(null)}
                  aria-label="Close lightbox"
                  className="absolute top-2.5 end-2.5 sm:top-4 sm:end-4 size-11 rounded-full glass-dark text-white hover:text-gold-soft"
                />
              </div>
            )}

            {/* Caption bar */}
            {selectedGalleryItem && (selectedGalleryItem.imageUrl || selectedGalleryItem.videoUrl) && (
              <div className="px-5 pb-5 text-center">
                <p className="text-white/85 text-sm mt-3 text-center font-medium leading-snug">{selectedGalleryItem.title}</p>
                <p className="text-white/50 text-xs mt-0.5">{selectedGalleryItem.category}</p>
              </div>
            )}
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      </div>
    </section>
  );
}
