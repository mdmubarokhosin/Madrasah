'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Search,
  Filter,
  Download,
  ExternalLink,
  FileVideo,
  FileAudio,
  ImageIcon,
  File,
  Link as LinkIcon,
  GraduationCap,
  Layers,
  BookOpen,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import BackToTop from '@/components/pages/BackToTop';
import PageSkeleton from '@/components/pages/PageSkeleton';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { dbUpdate } from '@/lib/db-service';
import type { StudyMaterial } from '@/types/database';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// fileType values come from Firebase; labelKey is translated at render time
const fileTypeConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; labelKey?: string; label?: string; cls: string }> = {
  pdf: { icon: FileText, label: 'PDF', cls: 'bg-red-100 text-red-600' },
  video: { icon: FileVideo, labelKey: 'materialsPage.typeVideo', cls: 'bg-purple-100 text-purple-600' },
  audio: { icon: FileAudio, labelKey: 'materialsPage.typeAudio', cls: 'bg-orange-100 text-orange-600' },
  image: { icon: ImageIcon, labelKey: 'materialsPage.typeImage', cls: 'bg-blue-100 text-blue-600' },
  document: { icon: File, labelKey: 'materialsPage.typeDocument', cls: 'bg-green-100 text-green-600' },
  link: { icon: LinkIcon, labelKey: 'materialsPage.typeLink', cls: 'bg-islamic/10 text-islamic' },
};

function getFileIcon(type: string) {
  switch (type) {
    case 'pdf': return <FileText className="w-4 h-4" />;
    case 'video': return <FileVideo className="w-4 h-4" />;
    case 'audio': return <FileAudio className="w-4 h-4" />;
    case 'image': return <ImageIcon className="w-4 h-4" />;
    case 'document': return <File className="w-4 h-4" />;
    case 'link': return <LinkIcon className="w-4 h-4" />;
    default: return <FileText className="w-4 h-4" />;
  }
}

function getVolumeIcon(type: string) {
  switch (type) {
    case 'video': return <FileVideo className="w-5 h-5" />;
    case 'audio': return <FileAudio className="w-5 h-5" />;
    case 'image': return <ImageIcon className="w-5 h-5" />;
    default: return <BookOpen className="w-5 h-5" />;
  }
}

export default function MaterialsPage() {
  const { studyMaterials, dataLoaded } = useAppStore();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const fileTypeLabel = useCallback(
    (type: string) => {
      const cfg = fileTypeConfig[type];
      if (!cfg) return type;
      return cfg.labelKey ? t(cfg.labelKey) : cfg.label || type;
    },
    [t]
  );

  const categories = useMemo(
    () => [...new Set(studyMaterials.map((m) => m.category).filter(Boolean))],
    [studyMaterials]
  );

  const filtered = useMemo(() => {
    return studyMaterials.filter((mat) => {
      const term = searchTerm.toLowerCase();
      const matchSearch =
        !term ||
        mat.title.toLowerCase().includes(term) ||
        (mat.description || '').toLowerCase().includes(term) ||
        (mat.department || '').toLowerCase().includes(term);
      const matchCategory = filterCategory === 'all' || mat.category === filterCategory;
      return matchSearch && matchCategory;
    });
  }, [studyMaterials, searchTerm, filterCategory]);

  // Debounce download counter to avoid multiple rapid increments
  const downloadDebounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const handleClick = useCallback((material: StudyMaterial) => {
    if (material.fileUrl) {
      window.open(material.fileUrl, '_blank', 'noopener,noreferrer');
      if (material.id) {
        if (downloadDebounceRef.current[material.id]) return;
        downloadDebounceRef.current[material.id] = setTimeout(() => {
          delete downloadDebounceRef.current[material.id];
        }, 3000);
        dbUpdate('/studyMaterials/' + material.id, {
          downloadCount: (material.downloadCount || 0) + 1,
        }).catch(() => {});
      }
    }
  }, []);

  const handleVolumeClick = useCallback((material: StudyMaterial) => {
    if (material.id) {
      if (downloadDebounceRef.current[material.id]) return;
      downloadDebounceRef.current[material.id] = setTimeout(() => {
        delete downloadDebounceRef.current[material.id];
      }, 3000);
      dbUpdate('/studyMaterials/' + material.id, {
        downloadCount: (material.downloadCount || 0) + 1,
      }).catch(() => {});
    }
  }, []);

  if (!dataLoaded) return <PageSkeleton cards={6} showStats />;

  return (
    <div className="pt-0">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-islamic-dark via-islamic to-islamic-light overflow-hidden">
        <div className="absolute inset-0 islamic-pattern-overlay opacity-[0.06]" />
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-golden/5" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-golden via-golden-light to-golden" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <p className="text-golden text-xl md:text-2xl font-serif mb-3" dir="rtl" lang="ar">
              الدراسة
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              {t('materials.title')}
            </h1>
            <p className="text-white/70 text-base md:text-lg max-w-2xl mx-auto">
              {t('materialsPage.subtitle')}
            </p>
            <div className="mt-6 flex items-center justify-center gap-2">
              <div className="w-16 h-[1px] bg-golden/50" />
              <div className="w-2 h-2 rounded-full bg-golden" />
              <div className="w-16 h-[1px] bg-golden/50" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <section className="py-12 bg-islamic-lighter/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search & Filters */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-3 mb-6"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('materialsPage.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label={t('materialsPage.searchPlaceholder')}
                className="pl-10"
              />
            </div>
            {categories.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setFilterCategory('all')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border cursor-pointer ${
                    filterCategory === 'all'
                      ? 'bg-islamic text-white border-islamic'
                      : 'bg-white text-islamic-dark border-gray-200 hover:bg-islamic-lighter'
                  }`}
                >
                  {t('common.all')}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border cursor-pointer ${
                      filterCategory === cat
                        ? 'bg-islamic text-white border-islamic'
                        : 'bg-white text-islamic-dark border-gray-200 hover:bg-islamic-lighter'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Materials Grid */}
          {filtered.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filtered.map((material) => {
                const ftc = fileTypeConfig[material.fileType] || fileTypeConfig.document;
                const FileIcon = ftc.icon;
                const hasVolumes = material.hasVolumes && material.volumes && material.volumes.length > 0;

                return (
                  <motion.div key={material.id} variants={itemVariants}>
                    <Card
                      className="h-full hover:shadow-lg transition-all border border-gray-100 group"
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4 mb-3">
                          <div className={`w-12 h-12 rounded-lg ${ftc.cls} flex items-center justify-center flex-shrink-0`}>
                            {hasVolumes ? <Layers className="w-6 h-6" /> : <FileIcon className="w-6 h-6" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-islamic-dark text-sm line-clamp-2">{material.title}</h3>
                            {material.department && (
                              <p className="text-xs text-muted-foreground mt-0.5">{material.department}</p>
                            )}
                          </div>
                        </div>

                        {material.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{material.description}</p>
                        )}

                        <div className="flex items-center gap-2 flex-wrap mb-3">
                          {material.category && (
                            <Badge className="bg-islamic/10 text-islamic border-0 text-xs">
                              {material.category}
                            </Badge>
                          )}
                          <Badge className={`text-xs border-0 ${ftc.cls}`}>
                            {ftc.labelKey ? t(ftc.labelKey) : ftc.label || ''}
                          </Badge>
                          {hasVolumes && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs gap-1">
                              <Layers className="size-3" />
                              {t('materialsPage.volumes', { count: material.volumes!.length })}
                            </Badge>
                          )}
                        </div>

                        {/* Single file - simple open button */}
                        {!hasVolumes && material.fileUrl && (
                          <div className="mt-auto pt-3 border-t flex items-center justify-between">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Download className="w-3.5 h-3.5" />
                              <span>{material.downloadCount || 0}</span>
                            </div>
                            <button
                              onClick={() => handleClick(material)}
                              className="flex items-center gap-1 text-xs font-medium text-islamic hover:text-islamic-dark transition-colors cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              {t('materials.open')}
                            </button>
                          </div>
                        )}

                        {/* Volumes section */}
                        {hasVolumes && material.volumes && material.volumes.length > 0 && (
                          <div className="mt-auto pt-3 border-t">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-xs font-semibold text-islamic-dark flex items-center gap-1">
                                <Layers className="size-3.5" />
                                {t('materialsPage.volumesList')}
                              </p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Download className="w-3.5 h-3.5" />
                                <span>{material.downloadCount || 0}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {material.volumes.map((volume, volIndex) => (
                                <a
                                  key={volIndex}
                                  href={volume.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => handleVolumeClick(material)}
                                  className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:border-islamic/30 hover:bg-islamic-lighter/30 transition-all group/vol cursor-pointer no-underline"
                                >
                                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                    fileTypeConfig[volume.fileType]?.cls || 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {getVolumeIcon(volume.fileType)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-islamic-dark group-hover/vol:text-islamic truncate">
                                      {volume.volumeTitle}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {fileTypeConfig[volume.fileType] && (
                                      <Badge className={`text-[10px] border-0 ${fileTypeConfig[volume.fileType].cls}`}>
                                        {fileTypeLabel(volume.fileType)}
                                      </Badge>
                                    )}
                                    <ExternalLink className="size-3.5 text-muted-foreground group-hover/vol:text-islamic" />
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <GraduationCap className="size-16 opacity-15 mb-4" />
              <p className="text-base font-medium">
                {searchTerm || filterCategory !== 'all'
                  ? t('materialsPage.noMatch')
                  : t('materialsPage.noDataFound')}
              </p>
            </div>
          )}
        </div>
      </section>

      <BackToTop />
    </div>
  );
}
