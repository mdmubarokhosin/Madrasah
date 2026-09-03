'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  arabicText?: string;
  darkBg?: boolean;
}

export default function SectionHeading({ title, subtitle, arabicText, darkBg }: SectionHeadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className="text-center mb-8 md:mb-12"
    >
      {arabicText && (
        <p className="text-golden text-base sm:text-lg mb-2 font-serif" dir="rtl">
          {arabicText}
        </p>
      )}
      <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4 ${darkBg ? 'text-white' : 'text-islamic-dark'}`}>
        {title}
      </h2>
      <div className="islamic-divider max-w-xs mx-auto mb-4">
        <Star className="text-golden fill-golden w-4 h-4 flex-shrink-0" />
      </div>
      {subtitle && (
        <p className={`max-w-2xl mx-auto text-sm sm:text-base md:text-lg px-2 ${darkBg ? 'text-white/70' : 'text-muted-foreground'}`}>
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
