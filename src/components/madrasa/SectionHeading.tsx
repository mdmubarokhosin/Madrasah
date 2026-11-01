'use client';

import { motion } from 'framer-motion';
import { Heading } from '@heroui/react/typography';
import { StarBurst, GoldRule } from '@/components/heroui/islamic';

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  arabicText?: string;
  darkBg?: boolean;
  align?: 'center' | 'start';
}

/**
 * Section heading — HeroUI Heading primitive + Islamic gold flourish.
 * Entrance choreography preserved (rises into view, rule draws after).
 */
export default function SectionHeading({
  title,
  subtitle,
  arabicText,
  darkBg,
  align = 'center',
}: SectionHeadingProps) {
  const isCenter = align === 'center';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`mb-10 md:mb-14 ${isCenter ? 'text-center' : 'text-start'}`}
    >
      {arabicText && (
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-golden text-base sm:text-lg mb-2.5 font-serif"
          dir="rtl"
        >
          {arabicText}
        </motion.p>
      )}

      <Heading
        level={2}
        className={`relative inline-block text-[1.55rem] leading-tight sm:text-3xl md:text-4xl font-black mb-3.5 md:mb-4 tracking-tight ${
          darkBg ? 'text-white' : 'text-islamic-dark'
        }`}
      >
        {title}
        {/* Gold underline flourish — draws in after the title lands */}
        <motion.span
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="absolute -bottom-1.5 start-0 w-full h-[3px] rounded-full origin-start"
          style={{
            background: 'linear-gradient(90deg, transparent, var(--warning) 30%, var(--warning-soft) 55%, transparent)',
          }}
          aria-hidden="true"
        />
      </Heading>

      <GoldRule className={`my-3.5 max-w-xs ${isCenter ? 'mx-auto' : ''}`} />

      {subtitle && (
        <p
          className={`max-w-2xl text-sm sm:text-base md:text-[1.05rem] leading-relaxed px-2 ${
            isCenter ? 'mx-auto' : ''
          } ${darkBg ? 'text-white/70' : 'text-muted-foreground'}`}
        >
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
