'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Headphones } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

interface SurahInfo {
  id: number;
  nameAr: string;
  nameBn: string;
  nameEn: string;
  ayahCount: number;
  type: 'মাক্কী' | 'মাদানী';
  audioUrl: string;
}

const surahList: SurahInfo[] = [
  {
    id: 1,
    nameAr: 'الفاتحة',
    nameBn: 'সূরা আল-ফাতিহা',
    nameEn: 'Al-Fatiha',
    ayahCount: 7,
    type: 'মাক্কী',
    audioUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3',
  },
  {
    id: 2,
    nameAr: 'البقرة',
    nameBn: 'সূরা আল-বাকারাহ',
    nameEn: 'Al-Baqarah',
    ayahCount: 286,
    type: 'মাদানী',
    audioUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/2.mp3',
  },
  {
    id: 3,
    nameAr: 'آل عمران',
    nameBn: 'সূরা আলে ইমরান',
    nameEn: 'Ali Imran',
    ayahCount: 200,
    type: 'মাদানী',
    audioUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/3.mp3',
  },
  {
    id: 36,
    nameAr: 'يس',
    nameBn: 'সূরা ইয়াসীন',
    nameEn: 'Ya-Sin',
    ayahCount: 83,
    type: 'মাক্কী',
    audioUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/36.mp3',
  },
  {
    id: 55,
    nameAr: 'الرحمن',
    nameBn: 'সূরা আর-রহমান',
    nameEn: 'Ar-Rahman',
    ayahCount: 78,
    type: 'মাদানী',
    audioUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/55.mp3',
  },
  {
    id: 56,
    nameAr: 'الواقعة',
    nameBn: 'সূরা আল-ওয়াকিয়া',
    nameEn: 'Al-Waqiah',
    ayahCount: 96,
    type: 'মাক্কী',
    audioUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/56.mp3',
  },
  {
    id: 67,
    nameAr: 'الملك',
    nameBn: 'সূরা আল-মুলক',
    nameEn: 'Al-Mulk',
    ayahCount: 30,
    type: 'মাক্কী',
    audioUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/67.mp3',
  },
  {
    id: 112,
    nameAr: 'الإخلاص',
    nameBn: 'সূরা আল-ইখলাস',
    nameEn: 'Al-Ikhlas',
    ayahCount: 4,
    type: 'মাক্কী',
    audioUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/112.mp3',
  },
  {
    id: 113,
    nameAr: 'الفلق',
    nameBn: 'সূরা আল-ফালাক',
    nameEn: 'Al-Falaq',
    ayahCount: 5,
    type: 'মাক্কী',
    audioUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/113.mp3',
  },
  {
    id: 114,
    nameAr: 'الناس',
    nameBn: 'সূরা আন-নাস',
    nameEn: 'An-Nas',
    ayahCount: 6,
    type: 'মাক্কী',
    audioUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/114.mp3',
  },
];

export default function QuranPage() {
  const { dataLoaded } = useAppStore();
  const { t, language } = useTranslation();
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('ended', () => {});
        audioRef.current.src = '';
        audioRef.current = null;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const handlePlay = (surah: SurahInfo) => {
    if (playingId === surah.id && audioRef.current) {
      audioRef.current.pause();
      setPlayingId(null);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    const audio = new Audio(surah.audioUrl);
    audio.muted = muted;
    audioRef.current = audio;
    audio.play().catch(() => {});
    setPlayingId(surah.id);
    setAudioProgress(0);

    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => {
      if (audio.duration && !audio.paused) {
        setAudioProgress((audio.currentTime / audio.duration) * 100);
      }
    }, 500);

    const onEnded = () => {
      setPlayingId(null);
      setAudioProgress(0);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
    audio.addEventListener('ended', onEnded);
  };

  const toggleMute = () => {
    setMuted(!muted);
    if (audioRef.current) {
      audioRef.current.muted = !muted;
    }
  };

  if (!dataLoaded) return <PageSkeleton cards={5} showStats />;

  return (
    <div className="pt-0">
      <PageBanner
        titleKey="quran.title"
        arabicText="تلاوة القرآن الكريم"
        subtitleKey="quran.subtitle"
      />

      {/* Controls */}
      <section className="py-10 bg-gradient-to-r from-islamic-dark via-islamic to-islamic-light relative overflow-hidden">
        <div className="absolute inset-0 islamic-pattern-overlay opacity-[0.04]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Headphones className="w-6 h-6 text-golden" />
              <p className="text-white font-medium">{t('quran.reciter')}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              aria-label={muted ? 'Unmute' : 'Mute'}
              className="text-white hover:bg-white/10"
            >
              {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Surah List */}
      <section className="py-12 bg-islamic-lighter/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-4"
          >
            {surahList.map((surah) => {
              const isPlaying = playingId === surah.id;
              return (
                <motion.div key={surah.id} variants={itemVariants}>
                  <Card className={`overflow-hidden transition-all border ${
                    isPlaying
                      ? 'border-islamic shadow-lg ring-2 ring-islamic/20'
                      : 'border-gray-100 hover:shadow-md'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Number */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isPlaying
                            ? 'bg-islamic text-white'
                            : 'bg-islamic-lighter text-islamic'
                        }`}>
                          <span className="text-sm font-bold">{surah.id}</span>
                        </div>

                        {/* Surah Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-islamic-dark text-sm">{language === 'ar' ? surah.nameAr : language === 'en' ? surah.nameEn : surah.nameBn}</h3>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {surah.type === 'মাক্কী' ? t('quran.makki') : t('quran.madani')}
                            </Badge>
                          </div>
                          <p className="text-lg font-serif text-islamic-dark" dir="rtl">{surah.nameAr}</p>
                          <p className="text-xs text-muted-foreground">{t('quran.ayahs', { count: surah.ayahCount })}</p>
                        </div>

                        {/* Play Button */}
                        <Button
                          onClick={() => handlePlay(surah)}
                          aria-label={isPlaying ? `Pause ${surah.nameBn}` : `Play ${surah.nameBn}`}
                          className={`flex-shrink-0 rounded-full w-12 h-12 p-0 cursor-pointer ${
                            isPlaying
                              ? 'bg-red-500 hover:bg-red-600 text-white'
                              : 'bg-islamic hover:bg-islamic-light text-white'
                          }`}
                        >
                          {isPlaying ? (
                            <Pause className="w-5 h-5" />
                          ) : (
                            <Play className="w-5 h-5 ml-0.5" />
                          )}
                        </Button>
                      </div>

                      {/* Audio progress indicator when playing */}
                      {isPlaying && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-3"
                        >
                          <div className="bg-islamic-lighter/50 rounded-full h-1 overflow-hidden">
                            <div
                              className="bg-islamic h-full rounded-full transition-all duration-500"
                              style={{ width: `${audioProgress}%` }}
                            />
                          </div>
                          <p className="text-xs text-islamic mt-1 text-center">{t('quran.loading')}</p>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <BackToTop />
    </div>
  );
}
