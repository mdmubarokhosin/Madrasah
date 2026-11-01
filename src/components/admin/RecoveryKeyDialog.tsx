'use client';

/**
 * RecoveryKeyDialog — shows the ONE-TIME admin recovery key.
 *
 * Rendered when the store's `pendingRecoveryKey` is non-null:
 *  - right after the first-admin registration (key generated inside registerAdmin)
 *  - after generating a replacement key from Admin → Settings → Recovery
 *
 * The plaintext key is never stored anywhere client-side beyond this dialog:
 * closing it clears `pendingRecoveryKey` and the key can never be shown again.
 */

import { useState } from 'react';
import { Copy, Check, ShieldCheck, TriangleAlert } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';

export function RecoveryKeyDialog() {
  const recoveryKey = useAppStore((s) => s.pendingRecoveryKey);
  const setPendingRecoveryKey = useAppStore((s) => s.setPendingRecoveryKey);

  const open = !!recoveryKey;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Only allow closing through the explicit "done" button (or Escape)
        // so the key is never dismissed unread.
        if (!next) setPendingRecoveryKey(null);
      }}
    >
      {/* Keyed by the key itself: a NEW pending key remounts the content, so the
          copy/confirm state resets naturally without an effect. */}
      {recoveryKey && (
        <RecoveryKeyDialogContent
          key={recoveryKey}
          recoveryKey={recoveryKey}
          onDone={() => setPendingRecoveryKey(null)}
        />
      )}
    </Dialog>
  );
}

function RecoveryKeyDialogContent({
  recoveryKey,
  onDone,
}: {
  recoveryKey: string;
  onDone: () => void;
}) {
  const { t } = useTranslation();

  const [copied, setCopied] = useState(false);
  const [savedConfirmed, setSavedConfirmed] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(recoveryKey);
    } catch {
      // Clipboard API can be unavailable (insecure context) — fall back to a
      // hidden textarea select so the user can still copy manually.
      const ta = document.createElement('textarea');
      ta.value = recoveryKey;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <DialogContent className="sm:max-w-md rounded-2xl" showCloseButton={false}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-islamic-dark">
          <ShieldCheck className="size-5 text-islamic" aria-hidden="true" />
          {t('adminRecovery.keyDialogTitle')}
        </DialogTitle>
        <DialogDescription className="flex items-start gap-2 text-start">
          <TriangleAlert className="size-4 mt-0.5 shrink-0 text-amber-500" aria-hidden="true" />
          <span>{t('adminRecovery.keyDialogWarning')}</span>
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {/* The key itself */}
        <div className="flex items-center justify-center gap-3 rounded-xl border-2 border-dashed border-islamic/30 bg-islamic/5 px-4 py-5">
          <p
            className="font-mono text-xl md:text-2xl font-bold tracking-widest text-islamic-dark select-all"
            aria-label={t('adminRecovery.keyDialogTitle')}
          >
            {recoveryKey}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-1.5 shrink-0 cursor-pointer"
            aria-label={copied ? t('adminRecovery.keyCopied') : t('adminRecovery.keyCopy')}
          >
            {copied ? (
              <>
                <Check className="size-4 text-green-600" />
                <span className="hidden sm:inline">{t('adminRecovery.keyCopied')}</span>
              </>
            ) : (
              <>
                <Copy className="size-4" />
                <span className="hidden sm:inline">{t('adminRecovery.keyCopy')}</span>
              </>
            )}
          </Button>
        </div>

        {/* Save confirmation — native styled checkbox (no radix-checkbox dep) */}
        <div className="flex items-start gap-2.5 rounded-xl bg-muted/60 px-3.5 py-3">
          <input
            id="recovery-key-saved"
            type="checkbox"
            checked={savedConfirmed}
            onChange={(e) => setSavedConfirmed(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-teal-700 cursor-pointer"
          />
          <label
            htmlFor="recovery-key-saved"
            className="text-sm font-normal leading-snug cursor-pointer"
          >
            {t('adminRecovery.keySavedCheckbox')}
          </label>
        </div>
      </div>

      <DialogFooter>
        <Button
          type="button"
          onClick={() => savedConfirmed && onDone()}
          disabled={!savedConfirmed}
          className="w-full bg-islamic hover:bg-islamic-light text-white cursor-pointer"
        >
          {t('adminRecovery.keyDone')}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
