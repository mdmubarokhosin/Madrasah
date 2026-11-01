'use client';

// ============ MultiStepForm — fully responsive, with progress ============
// Reusable wizard shell for every long form on the site (admission,
// contact, …). Owns NOTHING about the data: the parent passes steps as
// render functions + a per-step validate() and the final submit handler.
//
// Features:
//  - Animated progress bar (% completed) + step chips (done ✓ / current / todo)
//  - Mobile: compact numbered chips with horizontal scroll; Desktop: full labels
//  - Per-step validation gate (validate returns an error string or null)
//  - Back / Next / Submit with pending state; Enter-safe (form submit)
//  - Keyboard accessible, ARIA-wired, RTL-aware

import { useMemo, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Send } from 'lucide-react';
import { useTranslation } from '@/lib/i18n-context';

export interface FormStep {
  /** Step label — shown on desktop chips */
  title: string;
  /** Short label — shown on mobile chips (falls back to title) */
  shortTitle?: string;
  /** Optional lucide icon shown in the chip */
  icon?: ReactNode;
  /** Step body */
  content: ReactNode;
  /**
   * Gate for leaving the step via "Next". Return null (or undefined) when
   * valid, otherwise an error message string (the parent shows a toast).
   */
  validate?: () => string | null | undefined;
}

interface MultiStepFormProps {
  steps: FormStep[];
  onSubmit: () => void | Promise<void>;
  submitting?: boolean;
  /** Label for the final submit button (default: common.submit i18n) */
  submitLabel?: string;
  /** Called when a validation error blocks Next — parent shows the toast */
  onValidationError?: (message: string) => void;
  /** Optional footer hint under the progress (e.g. required-fields note) */
  hint?: ReactNode;
  /** Uncontrolled when parent needs to jump (e.g. after success reset) */
  resetKey?: number;
}

export default function MultiStepForm({
  steps,
  onSubmit,
  submitting = false,
  submitLabel,
  onValidationError,
  hint,
  resetKey = 0,
}: MultiStepFormProps) {
  const { t, isRTL } = useTranslation();
  const [current, setCurrent] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [direction, setDirection] = useState(1);

  // resetKey change → back to step 1 (used after successful submit)
  const [lastResetKey, setLastResetKey] = useState(resetKey);
  if (resetKey !== lastResetKey) {
    setLastResetKey(resetKey);
    setCurrent(0);
    setFurthest(0);
    setDirection(1);
  }

  const total = steps.length;
  const progress = useMemo(
    () => Math.round(((current + 1) / total) * 100),
    [current, total]
  );
  const isLast = current === total - 1;

  const goNext = () => {
    const err = steps[current]?.validate?.();
    if (err) {
      onValidationError?.(err);
      return;
    }
    if (isLast) {
      void onSubmit();
      return;
    }
    setDirection(1);
    setCurrent((c) => Math.min(c + 1, total - 1));
    setFurthest((f) => Math.max(f, current + 1));
  };

  const goBack = () => {
    setDirection(-1);
    setCurrent((c) => Math.max(c - 1, 0));
  };

  const jumpTo = (idx: number) => {
    // Only allow jumping to already-visited steps (no skipping ahead)
    if (idx > current && idx > furthest) return;
    if (idx > current) {
      const err = steps[current]?.validate?.();
      if (err) {
        onValidationError?.(err);
        return;
      }
    }
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
    setFurthest((f) => Math.max(f, idx));
  };

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;
  const NextIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div className="w-full" key={`msf-${resetKey}`}>
      {/* ── Progress header ── */}
      <div className="mb-6">
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <p className="text-xs font-bold text-islamic-dark" aria-live="polite">
            {t('form.stepOf', { current: current + 1, total })}
          </p>
          <p className="text-xs font-black tabular-nums text-islamic">{progress}%</p>
        </div>
        {/* Bar */}
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-islamic-lighter/50 dark:bg-white/10"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label={t('form.progress')}
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-islamic via-islamic-light to-gold-bright"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        {/* Step chips */}
        <div className="mt-3 -mx-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ol className="flex min-w-max items-center gap-1.5 px-1" aria-label={t('form.steps')}>
            {steps.map((step, idx) => {
              const done = idx < current;
              const active = idx === current;
              const reachable = idx <= furthest;
              return (
                <li key={idx} className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => reachable && jumpTo(idx)}
                    disabled={!reachable}
                    aria-current={active ? 'step' : undefined}
                    className={`flex items-center gap-2 rounded-full px-2.5 py-1.5 text-[11px] font-bold transition-all duration-300 sm:px-3 sm:text-xs ${
                      active
                        ? 'bg-islamic text-white shadow-md shadow-islamic/25'
                        : done
                          ? 'bg-islamic-lighter text-islamic-dark cursor-pointer dark:bg-islamic-lighter/40 dark:text-islamic-dark'
                          : reachable
                            ? 'bg-islamic-lighter/40 text-muted-foreground cursor-pointer dark:bg-white/5'
                            : 'bg-islamic-lighter/20 text-muted-foreground/60 cursor-not-allowed dark:bg-white/[0.03]'
                    }`}
                  >
                    <span
                      className={`grid size-5 place-items-center rounded-full text-[10px] font-black ${
                        active
                          ? 'bg-white/25 text-white'
                          : done
                            ? 'bg-islamic text-white'
                            : 'bg-islamic/15 text-islamic dark:bg-white/10 dark:text-gold-soft'
                      }`}
                      aria-hidden="true"
                    >
                      {done ? <Check className="size-3" /> : idx + 1}
                    </span>
                    <span className={`hidden sm:inline ${step.icon ? '' : ''}`}>
                      {step.title}
                    </span>
                    <span className="sm:hidden">{step.shortTitle || step.title}</span>
                  </button>
                  {idx < total - 1 && (
                    <span
                      className={`h-px w-3 sm:w-4 ${done ? 'bg-islamic/50' : 'bg-islamic/15 dark:bg-white/10'}`}
                      aria-hidden="true"
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </div>
        {hint && <div className="mt-2.5">{hint}</div>}
      </div>

      {/* ── Step body (animated) ── */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            initial={{ opacity: 0, x: direction >= 0 ? 32 : -32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction >= 0 ? -32 : 32 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <fieldset disabled={submitting} className="min-w-0 border-0 p-0">
              {steps[current]?.content}
            </fieldset>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Footer actions ── */}
      <div className="mt-8 flex items-center justify-between gap-3 border-t border-islamic/10 pt-5 dark:border-white/10">
        {current > 0 ? (
          <button
            type="button"
            onClick={goBack}
            disabled={submitting}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-islamic/20 px-5 py-2.5 text-sm font-bold text-islamic-dark transition-all hover:bg-islamic-lighter/50 disabled:opacity-50 dark:border-white/15 dark:text-islamic-dark dark:hover:bg-white/5 cursor-pointer"
          >
            <BackIcon className="size-4" aria-hidden="true" />
            {t('form.previous')}
          </button>
        ) : (
          <span aria-hidden="true" />
        )}

        <button
          type="button"
          onClick={goNext}
          disabled={submitting}
          className="btn-cinema inline-flex min-h-[44px] items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold shadow-lg transition-all hover:shadow-xl disabled:opacity-60 cursor-pointer"
        >
          {isLast ? (
            <>
              <Send className="size-4" aria-hidden="true" />
              {submitting ? t('form.submitting') : submitLabel || t('form.submit')}
            </>
          ) : (
            <>
              {t('form.next')}
              <NextIcon className="size-4" aria-hidden="true" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
