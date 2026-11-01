'use client';

/**
 * ═══════════════════════════════════════════════════════════════════
 * ISLAMIC MADRASAH — HeroUI v3 Kit
 * Themed wrappers + ornaments built on @heroui/react primitives.
 * Palette: deep emerald (iman/knowledge) + illuminated gold (nur).
 * All colors resolve from the HeroUI theme variables in globals.css,
 * so this kit stays fully dynamic & transferable (white-label safe).
 * ═══════════════════════════════════════════════════════════════════
 */

import { forwardRef, type ReactNode, type ComponentProps } from 'react';
import { Button as HeroButton } from '@heroui/react/button';
import { Card as HeroCard } from '@heroui/react/card';
import { Chip as HeroChip } from '@heroui/react/chip';
import { cn } from '@/lib/utils';

/* ─────────────────────────── Ornaments ─────────────────────────── */

/** Eight-point Islamic star (khatam) — pure SVG, decorative */
export function StarBurst({
  className,
  spin = false,
}: {
  className?: string;
  spin?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
      className={cn(spin && 'animate-spin-slow', className)}
    >
      <path
        d="M50 2 L59 26 L83 17 L74 41 L98 50 L74 59 L83 83 L59 74 L50 98 L41 74 L17 83 L26 59 L2 50 L26 41 L17 17 L41 26 Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="50" cy="50" r="14" stroke="currentColor" strokeWidth="2" />
      <circle cx="50" cy="50" r="5" fill="currentColor" />
    </svg>
  );
}

/** Illuminated gold divider with a central star */
export function GoldRule({ className, star = true }: { className?: string; star?: boolean }) {
  return (
    <div className={cn('flex items-center gap-3', className)} aria-hidden="true">
      <span className="gold-rule h-px flex-1" />
      {star && <StarBurst className="size-3.5 shrink-0 text-gold-bright" />}
      <span className="gold-rule h-px flex-1" />
    </div>
  );
}

/* ─────────────────────────── Button ─────────────────────────── */

type HButtonVariant = 'primary' | 'gold' | 'outline' | 'ghost' | 'danger';

interface HButtonProps extends Omit<ComponentProps<typeof HeroButton>, 'variant' | 'color'> {
  variant?: HButtonVariant;
}

/**
 * Islamic-themed button on the HeroUI Button primitive.
 * - primary → deep emerald (HeroUI accent, from theme vars)
 * - gold    → illuminated gold solid (premium CTA)
 * - outline / ghost / danger → HeroUI semantic variants
 */
export const HButton = forwardRef<HTMLButtonElement, HButtonProps>(function HButton(
  { variant = 'primary', className, onPress, children, ...props },
  ref
) {
  const gold = variant === 'gold';
  const heroVariant = gold ? ('secondary' as const) : variant === 'primary' ? undefined : variant;
  return (
    <HeroButton
      ref={ref}
      {...props}
      variant={heroVariant}
      onPress={onPress}
      className={cn(
        gold &&
          'bg-gradient-to-br from-gold-bright to-golden text-white shadow-md shadow-golden/30 hover:shadow-lg hover:shadow-golden/40 font-semibold',
        // Guideline: primary button hover feedback = golden accent glow
        variant === 'primary' &&
          'font-semibold transition-shadow duration-300 hover:shadow-lg hover:shadow-golden/35 focus-visible:shadow-md focus-visible:shadow-golden/30',
        className
      )}
    >
      {children}
    </HeroButton>
  );
});

/* ─────────────────────────── Card ─────────────────────────── */

interface HCardProps extends ComponentProps<typeof HeroCard> {
  /** Gold gradient hairline across the top edge */
  topRule?: 'emerald-gold' | 'gold' | false;
  /** Ornamental corner brackets */
  ornate?: boolean;
}

/**
 * Islamic card on the HeroUI Card primitive.
 * Hover lift + warm emerald shadow come from the theme layer (.card rules).
 */
export const HCard = forwardRef<HTMLDivElement, HCardProps>(function HCard(
  { topRule = false, ornate = false, className, children, ...props },
  ref
) {
  return (
    <HeroCard
      ref={ref}
      {...props}
      className={cn('overflow-hidden', ornate && 'ornate-frame', className)}
    >
      {topRule && (
        <span
          aria-hidden="true"
          className={cn(
            'block h-[2px] w-full shrink-0',
            topRule === 'emerald-gold'
              ? 'bg-gradient-to-r from-islamic via-gold-bright to-islamic'
              : 'bg-gradient-to-r from-gold-bright via-gold-soft to-gold-bright'
          )}
        />
      )}
      {children}
    </HeroCard>
  );
});

/* ─────────────────────────── Chip ─────────────────────────── */

type HChipVariant = 'emerald' | 'gold' | 'soft';

interface HChipProps extends Omit<ComponentProps<typeof HeroChip>, 'color' | 'variant'> {
  variant?: HChipVariant;
}

/** Islamic chip: emerald (selected), gold (highlight), soft (idle) */
export const HChip = forwardRef<HTMLSpanElement, HChipProps>(function HChip(
  { variant = 'soft', className, ...props },
  ref
) {
  return (
    <HeroChip
      ref={ref}
      {...props}
      color={variant === 'emerald' ? 'accent' : variant === 'gold' ? 'warning' : 'default'}
      className={cn(
        variant === 'gold' && 'bg-golden-lighter text-islamic-dark ring-1 ring-golden/40',
        variant === 'emerald' && 'font-semibold',
        className
      )}
    />
  );
});

/* ─────────────────────────── Section primitives ─────────────────────────── */

/** Decorative arabesque watermark band for dark sections */
export function ArabesqueBand({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('islamic-pattern-overlay pointer-events-none absolute inset-0 opacity-[0.05]', className)}
    />
  );
}

/** Icon medallion — circular ring with lucide icon inside */
export function IconMedallion({
  icon: Icon,
  tone = 'emerald',
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone?: 'emerald' | 'gold';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full size-11',
        tone === 'emerald'
          ? 'bg-islamic-lighter ring-1 ring-islamic/20 text-islamic'
          : 'bg-golden-lighter ring-1 ring-golden/30 text-golden',
        className
      )}
    >
      <Icon className="size-5" />
    </span>
  );
}

/* ─────────────────────────── Stat card ─────────────────────────── */

/**
 * Editorial stat card — newspaper-infobox styling.
 * LEFT-aligned by nature (figures + labels read like print),
 * with a quiet hairline rule and a small icon tucked at the far
 * end of the rule. This replaces the old centered-icon-on-number
 * pattern which read as template-generated.
 */
export function StatCard({
  icon: Icon,
  value,
  label,
  tone = 'emerald',
  dark = false,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: ReactNode;
  label: string;
  tone?: 'emerald' | 'gold';
  dark?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative flex h-full w-full flex-col justify-between gap-3 rounded-2xl p-4 sm:p-5',
        dark
          ? 'bg-night-2/70 border border-gold-soft/20 backdrop-blur-md'
          : 'bg-white ring-1 ring-islamic/10 shadow-sm shadow-islamic-dark/5',
        className
      )}
    >
      {/* Hairline rule with the icon quiet at the far end */}
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={cn(
            'h-px flex-1',
            tone === 'emerald'
              ? dark
                ? 'bg-gradient-to-r from-transparent to-islamic/50'
                : 'bg-gradient-to-r from-transparent via-islamic/25 to-islamic/60'
              : dark
                ? 'bg-gradient-to-r from-transparent to-gold-soft/50'
                : 'bg-gradient-to-r from-transparent via-golden/30 to-golden/60'
          )}
        />
        <Icon
          aria-hidden="true"
          className={cn(
            'size-4 shrink-0',
            tone === 'emerald'
              ? dark
                ? 'text-gold-soft/80'
                : 'text-islamic/70'
              : dark
                ? 'text-gold-soft/80'
                : 'text-golden/80'
          )}
        />
      </div>
      {/* Figure + label — start-aligned, print-style */}
      <div className="text-start">
        <p
          className={cn(
            'text-2xl md:text-[1.75rem] font-black leading-none tracking-tight',
            dark ? 'text-white' : 'text-islamic-dark'
          )}
        >
          {value}
        </p>
        <p
          className={cn(
            'mt-1.5 text-[11px] sm:text-xs font-medium',
            dark ? 'text-white/55' : 'text-muted-foreground'
          )}
        >
          {label}
        </p>
      </div>
    </div>
  );
}
