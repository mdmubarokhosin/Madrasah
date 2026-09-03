'use client';

/**
 * Reusable trilingual (বাংলা / English / العربية) form controls
 * used across the admin panel. Each control keeps a { bn, en, ar } value
 * and renders a compact tab switcher so the admin can fill content in
 * all three languages. Filled languages get a small dot indicator.
 */

import { useState, type ReactNode } from 'react';
import { Languages, Check } from 'lucide-react';
import { useTranslation } from '@/lib/i18n-context';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { MLValue } from '@/lib/multilingual';

export type { MLValue };
export const EMPTY_ML: MLValue = { bn: '', en: '', ar: '' };

type LangKey = keyof MLValue;

const LANG_ORDER: LangKey[] = ['bn', 'en', 'ar'];

/* ------------------------------------------------------------------ */
/*  Tab bar                                                            */
/* ------------------------------------------------------------------ */

function MLTabBar({
  value,
  active,
  onChange,
}: {
  value: MLValue;
  active: LangKey;
  onChange: (l: LangKey) => void;
}) {
  const { t } = useTranslation();

  const labels: Record<LangKey, string> = {
    bn: t('ml.bn'),
    en: t('ml.en'),
    ar: t('ml.ar'),
  };

  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg bg-islamic-lighter/60 p-0.5 border border-islamic/10">
      {LANG_ORDER.map((l) => {
        const filled = value[l]?.trim();
        return (
          <button
            key={l}
            type="button"
            onClick={() => onChange(l)}
            className={cn(
              'px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1',
              active === l
                ? 'bg-islamic text-white shadow-sm'
                : 'text-muted-foreground hover:text-islamic-dark hover:bg-islamic-lighter'
            )}
            aria-pressed={active === l}
          >
            {labels[l]}
            {filled ? (
              <Check className="size-2.5 opacity-80" />
            ) : active !== l ? (
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Multilingual Input (single line)                                   */
/* ------------------------------------------------------------------ */

export function MLInput({
  label,
  value,
  onChange,
  placeholder,
  required,
  id,
  compact,
}: {
  label?: ReactNode;
  value: MLValue;
  onChange: (v: MLValue) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
  compact?: boolean;
}) {
  const [active, setActive] = useState<LangKey>('bn');
  const { t } = useTranslation();

  const dir = active === 'ar' ? 'rtl' : 'ltr';
  const inputId = id || `ml-input-${label ? String(label) : Math.random().toString(36).slice(2)}`;

  return (
    <div className="space-y-1.5">
      {(label || !compact) && (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <label htmlFor={inputId} className="text-sm font-medium flex items-center gap-1">
            <Languages className="size-3.5 text-islamic" />
            {label}
            {required && <span className="text-red-500">*</span>}
          </label>
          <MLTabBar value={value} active={active} onChange={setActive} />
        </div>
      )}
      <Input
        id={inputId}
        dir={dir}
        lang={active}
        value={value[active]}
        placeholder={placeholder}
        onChange={(e) => onChange({ ...value, [active]: e.target.value })}
        className={compact ? 'text-sm' : undefined}
      />
      {!value[active]?.trim() && (
        <p className="text-[10px] text-muted-foreground/70">{t('ml.hint')}</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Multilingual Textarea (multi line)                                 */
/* ------------------------------------------------------------------ */

export function MLTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  required,
  id,
}: {
  label?: ReactNode;
  value: MLValue;
  onChange: (v: MLValue) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  id?: string;
}) {
  const [active, setActive] = useState<LangKey>('bn');
  const { t } = useTranslation();

  const dir = active === 'ar' ? 'rtl' : 'ltr';
  const areaId = id || `ml-textarea-${label ? String(label) : Math.random().toString(36).slice(2)}`;

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <label htmlFor={areaId} className="text-sm font-medium flex items-center gap-1">
            <Languages className="size-3.5 text-islamic" />
            {label}
            {required && <span className="text-red-500">*</span>}
          </label>
          <MLTabBar value={value} active={active} onChange={setActive} />
        </div>
      )}
      <Textarea
        id={areaId}
        dir={dir}
        lang={active}
        rows={rows}
        value={value[active]}
        placeholder={placeholder}
        onChange={(e) => onChange({ ...value, [active]: e.target.value })}
      />
      {!value[active]?.trim() && (
        <p className="text-[10px] text-muted-foreground/70">{t('ml.hint')}</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Multilingual list rows (requirements / documents etc.)             */
/* ------------------------------------------------------------------ */

export function MLRow({
  value,
  onChange,
  onRemove,
  placeholder,
}: {
  value: MLValue;
  onChange: (v: MLValue) => void;
  onRemove?: () => void;
  placeholder?: string;
}) {
  const [active, setActive] = useState<LangKey>('bn');
  const dir = active === 'ar' ? 'rtl' : 'ltr';

  return (
    <div className="flex items-start gap-2">
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-1 flex-wrap">
          {LANG_ORDER.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setActive(l)}
              className={cn(
                'px-1.5 py-0.5 rounded text-[10px] font-bold transition-all border',
                active === l
                  ? 'bg-islamic text-white border-islamic'
                  : 'bg-transparent text-muted-foreground border-islamic/15 hover:border-islamic/40'
              )}
              aria-pressed={active === l}
            >
              {l === 'bn' ? 'বাং' : l === 'en' ? 'En' : 'عر'}
              {value[l]?.trim() ? ' ●' : ''}
            </button>
          ))}
        </div>
        <Input
          dir={dir}
          lang={active}
          value={value[active]}
          placeholder={placeholder}
          onChange={(e) => onChange({ ...value, [active]: e.target.value })}
          className="text-sm"
        />
      </div>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="mt-6 p-1.5 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          aria-label="Remove"
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}
