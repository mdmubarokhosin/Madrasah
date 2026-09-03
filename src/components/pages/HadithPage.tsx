'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n-context';
import { BookOpen, ChevronLeft, ChevronRight, RefreshCw, Share2 } from 'lucide-react';
import PageBanner from '@/components/pages/PageBanner';
import BackToTop from '@/components/pages/BackToTop';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';

const hadithData = [
  {
    id: 1,
    narrator: 'উমর ইবনুল খাত্তাব (রা.)',
    narratorAr: 'عمر بن الخطاب',
    source: 'বুখারী শরীফ',
    sourceNo: '১',
    textBn: 'নিশ্চয়ই আমল কেবল নিয়তের উপর নির্ভরশীল এবং প্রত্যেক ব্যক্তির জন্য তার নিয়ত অনুযায়ী আমল রয়েছে।',
    textAr: 'إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
    topic: 'নিয়ত',
  },
  {
    id: 2,
    narrator: 'আনাস (রা.)',
    narratorAr: 'أنس بن مالك',
    source: 'বুখারী শরীফ',
    sourceNo: '৮',
    textBn: 'কেউ ঈমানের সাথে আল্লাহ ও আখিরাতের প্রতি বিশ্বাস রেখে তার ভাইয়ের জন্য তা ভালোবাসতে না পারলে সে মুমিন হবে না।',
    textAr: 'لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ',
    topic: 'ঈমান',
  },
  {
    id: 3,
    narrator: 'আবু হুরায়রা (রা.)',
    narratorAr: 'أبو هريرة',
    source: 'মুসলিম শরীফ',
    sourceNo: '৯৩',
    textBn: 'তোমাদের কেউ ঈমানের সুন্দর অবস্থায় থাকা অবস্থায় মৃত্যুবরণ করুক, আল্লাহর নামে খাও এবং তোমাদের উপর যিনি রিযিক পাঠিয়েছেন তাঁর শুকরিয়া আদায় করো।',
    textAr: 'لْيَمُتْنَّ أَحَدُكُمْ وَهُوَ يَحْسُنُ الظَّنَّ بِاللَّهِ عَزَّ وَجَلَّ',
    topic: 'আল্লাহর প্রতি ভালো ধারণা',
  },
  {
    id: 4,
    narrator: 'আবু হুরায়রা (রা.)',
    narratorAr: 'أبو هريرة',
    source: 'বুখারী শরীফ',
    sourceNo: '৬০',
    textBn: 'যে ব্যক্তি আমার উপর একটি সুন্নাত জীবিত রাখলো, আর যে ব্যক্তি আমার সুন্নাত মৃত করলো, তার উপর আমার কোনো সম্পর্ক নেই।',
    textAr: 'مَنْ سَنَّ فِي الْإِسْلَامِ سُنَّةً حَسَنَةً فَلَهُ أَجْرُهَا وَأَجْرُ مَنْ عَمِلَ بِهَا بَعْدَهُ',
    topic: 'সুন্নাত',
  },
  {
    id: 5,
    narrator: 'আব্দুল্লাহ ইবনে মাসউদ (রা.)',
    narratorAr: 'عبد الله بن مسعود',
    source: 'বুখারী শরীফ',
    sourceNo: '৫২',
    textBn: 'হালাল স্পষ্টভাবে হালাল এবং হারাম স্পষ্টভাবে হারাম। আর এই দুয়ের মাঝে কিছু সন্দিগ্ধ বিষয় আছে যা অনেক লোক জানে না।',
    textAr: 'إِنَّ الْحَلَالَ بَيِّنٌ وَإِنَّ الْحَرَامَ بَيِّنٌ وَبَيْنَهُمَا أُمُورٌ مُشْتَبِهَاتٌ',
    topic: 'হালাল ও হারাম',
  },
  {
    id: 6,
    narrator: 'আনাস (রা.)',
    narratorAr: 'أنس بن مالك',
    source: 'বুখারী শরীফ',
    sourceNo: '১৩',
    textBn: 'কেউ তার ভাইয়ের একটি ক্ষমতা মতো খারাপ কাজ পছন্দ করবে না।',
    textAr: 'لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ',
    topic: 'মুমিনের গুণ',
  },
  {
    id: 7,
    narrator: 'আবু হুরায়রা (রা.)',
    narratorAr: 'أبو هريرة',
    source: 'তিরমিযী শরীফ',
    sourceNo: '২৩০৯',
    textBn: 'ঈমানের সবচেয়ে উৎকৃষ্ট শাখা হলো লজ্জাবোধ এবং ঈমানের সবচেয়ে চমৎকার শাখা হলো সৎ চরিত্র।',
    textAr: 'أَكْمَلُ الْمُؤْمِنِينَ إِيمَانًا أَحْسَنُهُمْ خُلُقًا',
    topic: 'সৎ চরিত্র',
  },
  {
    id: 8,
    narrator: 'আবু মূসা (রা.)',
    narratorAr: 'أبو موسى الأشعري',
    source: 'বুখারী ও মুসলিম',
    sourceNo: '৬০১১',
    textBn: 'ইসলাম ও ঈমানের মধ্যে পার্থক্য করে এমন বিষয়ের উপর জিজ্ঞাসা করতে পারবে না। আল্লাহ যা বিধান দিয়েছেন তা তোমরা আদায় করো।',
    textAr: 'سَلُوا عَمَّا شِئْتُمْ فَلَمَّا أَسْلَمْتُمْ سَلُوا عَمَّا شِئْتُمْ',
    topic: 'জ্ঞান অর্জন',
  },
];

export default function HadithPage() {
  const { t, language } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const current = hadithData[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % hadithData.length);
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + hadithData.length) % hadithData.length);
    }, 150);
  };

  const handleRandom = () => {
    setIsFlipped(false);
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * hadithData.length);
    } while (newIndex === currentIndex && hadithData.length > 1);
    setTimeout(() => setCurrentIndex(newIndex), 150);
  };

  const handleShare = async () => {
    const text = `${t('hadith.hadith')} ${language === 'ar' ? current.textAr : current.textBn}\n— ${current.narrator} (${current.source})`;
    if (navigator.share) {
      try {
        await navigator.share({ title: t('hadith.hadithText'), text });
      } catch {}
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="min-h-screen">
      <PageBanner
        titleKey="hadith.title"
        arabicText="الحديث"
        subtitleKey="hadith.subtitle"
      />

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Current hadith card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-2 border-islamic/10 shadow-md overflow-hidden">
              <CardContent className="p-6 md:p-8 space-y-5">
                {/* Topic badge */}
                <div className="flex items-center justify-between">
                  <span className="inline-block bg-islamic-lighter text-islamic-dark text-xs font-medium px-3 py-1 rounded-full">
                    {current.topic}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {currentIndex + 1} / {hadithData.length}
                  </span>
                </div>

                {/* Arabic text */}
                <div className="text-right bg-islamic-lighter/50 rounded-xl p-5 border border-islamic/10">
                  <p className="text-xl md:text-2xl leading-loose" style={{ fontFamily: 'var(--font-arabic)', direction: 'rtl' }}>
                    {current.textAr}
                  </p>
                </div>

                {/* Bengali translation */}
                <p className="text-islamic-dark text-base leading-relaxed" dir={language === 'ar' ? 'rtl' : undefined}>
                  {language === 'ar' ? current.textAr : current.textBn}
                </p>

                {/* Narrator & Source */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-muted-foreground border-t border-border pt-4">
                  <p>
                    <BookOpen className="w-4 h-4 inline mr-1" />
                    {t('hadith.narrator')} <strong className="text-islamic-dark">{current.narrator}</strong>
                  </p>
                  <p>
                    {t('hadith.source')} <strong className="text-islamic-dark">{current.source} — {t('hadith.no')} {current.sourceNo}</strong>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex items-center justify-center gap-3">
          <Button
            onClick={handlePrev}
            variant="outline"
            size="icon"
            className="rounded-full border-islamic/20 hover:bg-islamic-lighter cursor-pointer"
            aria-label={t('hadith.previous')}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <Button
            onClick={handleRandom}
            variant="outline"
            className="gap-2 border-golden/30 hover:bg-golden-lighter/50 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            {t('hadith.random')}
          </Button>

          <Button
            onClick={handleShare}
            variant="outline"
            className="gap-2 border-islamic/20 hover:bg-islamic-lighter cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            {t('hadith.share')}
          </Button>

          <Button
            onClick={handleNext}
            variant="outline"
            size="icon"
            className="rounded-full border-islamic/20 hover:bg-islamic-lighter cursor-pointer"
            aria-label={t('hadith.next')}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* All hadith list */}
        <div className="pt-4">
          <h3 className="text-lg font-semibold text-islamic-dark mb-4">
            {t('hadith.allHadith')}
          </h3>
          <div className="space-y-2">
            {hadithData.map((hadith, idx) => (
              <button
                key={hadith.id}
                onClick={() => { setIsFlipped(false); setCurrentIndex(idx); }}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                  idx === currentIndex
                    ? 'bg-islamic-lighter border-islamic/30 shadow-sm'
                    : 'bg-white border-border hover:border-islamic/20 hover:bg-islamic-lighter/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    idx === currentIndex ? 'bg-islamic text-white' : 'bg-gray-100 text-muted-foreground'
                  }`}>
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-islamic-dark line-clamp-2">
                      {hadith.textBn}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {hadith.narrator} — {hadith.source}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <BackToTop />
    </div>
  );
}
