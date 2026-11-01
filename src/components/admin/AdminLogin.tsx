'use client';

import { useState, useEffect } from 'react';
import {
  Lock, Eye, EyeOff, ArrowLeft, Loader2, User, UserPlus, Mail, ShieldCheck,
  AlertTriangle, HelpCircle, KeyRound, CheckCircle2, Send, Info, MessagesSquare,
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { navigateTo } from '@/lib/navigate';
import { useTranslation } from '@/lib/i18n-context';
import { LanguageSwitcher } from '@/components/madrasa/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  findAdminProfile,
  findRecoveryRecord,
  getRecoveryMethods,
  verifySecurityAnswer,
  verifyRecoveryKey,
  trySendResetEmail,
  writeNewPasswordHash,
} from '@/lib/admin-recovery';

/**
 * Unified wizard view of the account being recovered — built either from the
 * direct /adminUsers profile (readable on fresh databases / open rules) or from
 * the public /adminRecovery mirror (readable by any authenticated user who
 * knows the username, updated rules only).
 */
interface WizardAccount {
  uid: string;
  /** Resolved display text of the security question (i18n keys translated). */
  question: string | null;
  answerHash: string | null;
  keyHash: string | null;
  email: string | null;
  username: string;
}

type LoginMode = 'login' | 'register' | 'forgot';
type ForgotStep = 'identify' | 'method' | 'question' | 'key' | 'newpass' | 'emailSent' | 'done' | 'nomethods';
type ForgotMethod = 'question' | 'key' | 'email';

/** Brute-force guard: N failed verifications → cooldown. */
const MAX_VERIFY_ATTEMPTS = 5;
const VERIFY_COOLDOWN_MS = 5 * 60 * 1000;

/** Preset security questions stored as i18n keys (custom questions store raw text). */
const PRESET_QUESTIONS = ['adminRecovery.q1', 'adminRecovery.q2', 'adminRecovery.q3', 'adminRecovery.q4', 'adminRecovery.q5'];

export default function AdminLogin() {
  // NO loading/checking screen — the login form renders instantly.
  // When the existence check resolves: no admin yet → swap to registration;
  // admin exists → stay on login. Zero flash, zero progress gate.
  const [mode, setMode] = useState<LoginMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Registration form state
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  // Recovery setup (v2.3): security question + answer
  const [regQuestion, setRegQuestion] = useState('');
  const [regQuestionCustom, setRegQuestionCustom] = useState('');
  const [regAnswer, setRegAnswer] = useState('');

  // Forgot-password wizard state (v2.3)
  const [forgotStep, setForgotStep] = useState<ForgotStep>('identify');
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [wizardAccount, setWizardAccount] = useState<WizardAccount | null>(null);
  const [forgotAnswer, setForgotAnswer] = useState('');
  const [forgotKey, setForgotKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newConfirm, setNewConfirm] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotBusy, setForgotBusy] = useState(false);
  const [verifyFails, setVerifyFails] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [emailSendFailed, setEmailSendFailed] = useState(false);

  const { adminLogin, registerAdmin, checkAdminExists, isLoggingIn } = useAppStore();
  const { t } = useTranslation();

  // On load: decide whether to show login or first-admin registration
  useEffect(() => {
    let cancelled = false;
    checkAdminExists().then((exists) => {
      if (!cancelled) setMode(exists ? 'login' : 'register');
    });
    return () => {
      cancelled = true;
    };
  }, [checkAdminExists]);

  const now = Date.now();
  const isLocked = lockedUntil > now;
  const lockMinutesLeft = Math.max(1, Math.ceil((lockedUntil - now) / 60000));

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError(t('adminLogin.bothRequired'));
      return;
    }

    const success = await adminLogin(username.trim(), password);
    if (!success) {
      setError(t('admin.wrongPassword'));
    }
  };

  const resolvedRegQuestion =
    regQuestion === 'custom' ? regQuestionCustom.trim() : PRESET_QUESTIONS.includes(regQuestion) ? regQuestion : '';

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!regName.trim() || !regUsername.trim() || !regEmail.trim() || !regPassword || !regConfirm) {
      setError(t('adminRegister.allFieldsRequired'));
      return;
    }
    if (regUsername.trim().length < 3) {
      setError(t('adminRegister.usernameShort'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) {
      setError(t('adminRegister.emailInvalid'));
      return;
    }
    if (regPassword.length < 6) {
      setError(t('adminRegister.passwordShort'));
      return;
    }
    if (regPassword !== regConfirm) {
      setError(t('adminRegister.passwordMismatch'));
      return;
    }
    // Recovery setup is mandatory: without it a forgotten password can only be
    // fixed through the Firebase Console.
    if (!resolvedRegQuestion || regAnswer.trim().length < 2) {
      setError(t('adminRegister.recoveryRequired'));
      return;
    }

    const result = await registerAdmin(regName.trim(), regUsername.trim(), regEmail.trim(), regPassword, {
      question: resolvedRegQuestion,
      answer: regAnswer.trim(),
    });
    if (!result.ok) {
      setError(
        result.error === 'already-exists'
          ? t('adminRegister.alreadyExists')
          : result.error === 'email-in-use'
            ? t('adminRegister.emailInUse')
            : t('adminRegister.failed')
      );
      if (result.error === 'already-exists') {
        // An admin was created meanwhile — switch to login mode
        setMode('login');
      }
    }
    // On success the store switches currentView to 'admin' automatically and
    // surfaces the one-time recovery key via pendingRecoveryKey → RecoveryKeyDialog.
  };

  // ====================== Forgot-password wizard ======================

  const startForgot = () => {
    setError('');
    setForgotStep('identify');
    setForgotIdentifier('');
    setWizardAccount(null);
    setForgotAnswer('');
    setForgotKey('');
    setNewPassword('');
    setNewConfirm('');
    setVerifyFails(0);
    setEmailSendFailed(false);
    setMode('forgot');
  };

  /** Translate a stored question (i18n key → translated; raw custom text → as-is). */
  const resolveQuestionText = (raw: string | null | undefined): string | null => {
    if (!raw) return null;
    return raw.startsWith('adminRecovery.') ? t(raw) : raw;
  };

  const handleForgotIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!forgotIdentifier.trim()) {
      setError(t('adminLogin.forgotIdentifierRequired'));
      return;
    }
    const identifier = forgotIdentifier.trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    setForgotBusy(true);
    try {
      // 1) Direct /adminUsers lookup — works on fresh databases (list read
      //    allowed while no profile exists) and wherever rules permit it.
      const hit = await findAdminProfile(identifier).catch(() => null);
      if (hit) {
        const methods = getRecoveryMethods(hit.profile);
        if (!methods.question && !methods.key && !methods.email) {
          setWizardAccount({
            uid: hit.uid,
            question: resolveQuestionText(hit.profile.securityQuestion),
            answerHash: hit.profile.securityAnswerHash || null,
            keyHash: hit.profile.recoveryKeyHash || null,
            email: hit.profile.email || null,
            username: hit.profile.username || identifier,
          });
          setForgotStep('nomethods');
          return;
        }
        setWizardAccount({
          uid: hit.uid,
          question: resolveQuestionText(hit.profile.securityQuestion),
          answerHash: hit.profile.securityAnswerHash || null,
          keyHash: hit.profile.recoveryKeyHash || null,
          email: hit.profile.email || null,
          username: hit.profile.username || identifier,
        });
        // Exactly one method → jump straight into it
        if (methods.question && !methods.key) setForgotStep('question');
        else if (!methods.question && methods.key) setForgotStep('key');
        else setForgotStep('method');
        return;
      }

      // 2) Public recovery mirror — works for locked-out admins once the
      //    updated database.rules.json is deployed (knowing the username is
      //    the read capability; no sensitive fields are exposed).
      const rec = await findRecoveryRecord(identifier);
      if (rec) {
        const hasQuestion = !!rec.question && !!rec.answerHash;
        const hasKey = !!rec.keyHash;
        if (!hasQuestion && !hasKey) {
          setWizardAccount({ uid: rec.uid, question: null, answerHash: null, keyHash: null, email: null, username: identifier });
          setForgotStep('nomethods');
          return;
        }
        setWizardAccount({
          uid: rec.uid,
          question: resolveQuestionText(rec.question),
          answerHash: rec.answerHash || null,
          keyHash: rec.keyHash || null,
          email: null,
          username: identifier,
        });
        if (hasQuestion && !hasKey) setForgotStep('question');
        else if (!hasQuestion && hasKey) setForgotStep('key');
        else setForgotStep('method');
        return;
      }

      // 3) Nothing readable (older rules deny both paths). If the identifier is
      //    an email we can still offer the Auth-side reset link, which needs no
      //    RTDB access at all. Otherwise → guidance.
      if (isEmail) {
        setWizardAccount({ uid: '', question: null, answerHash: null, keyHash: null, email: identifier, username: identifier });
        await handleSendResetEmailDirect(identifier);
        return;
      }
      setError(t('adminLogin.forgotLookupDenied'));
    } finally {
      setForgotBusy(false);
    }
  };

  /** After a successful question/key verification → route to the right reset vector. */
  const proceedAfterVerification = async () => {
    if (!wizardAccount) return;
    if (wizardAccount.email) {
      setForgotBusy(true);
      const outcome = await trySendResetEmail(wizardAccount.email);
      setForgotBusy(false);
      if (outcome === 'sent') {
        setEmailSendFailed(false);
        setForgotStep('emailSent');
        return;
      }
      // Auth provider disabled / no Auth account → the RTDB hash IS the
      // credential → safe to offer the inline reset (identity was verified).
      setEmailSendFailed(true);
    }
    setForgotStep('newpass');
  };

  const handleVerifyQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (isLocked) return;
    if (!wizardAccount || !forgotAnswer.trim()) return;
    setForgotBusy(true);
    try {
      const check = await verifySecurityAnswer(
        { securityAnswerHash: wizardAccount.answerHash } as never,
        forgotAnswer
      );
      if (check.ok) {
        await proceedAfterVerification();
      } else {
        const fails = verifyFails + 1;
        setVerifyFails(fails);
        if (fails >= MAX_VERIFY_ATTEMPTS) {
          setLockedUntil(Date.now() + VERIFY_COOLDOWN_MS);
          setError(t('adminLogin.forgotTooManyAttempts', { minutes: 5 }));
        } else {
          setError(t('adminLogin.forgotWrongAnswer'));
        }
      }
    } finally {
      setForgotBusy(false);
    }
  };

  const handleVerifyKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (isLocked) return;
    if (!wizardAccount || !forgotKey.trim()) return;
    setForgotBusy(true);
    try {
      const check = await verifyRecoveryKey(
        { recoveryKeyHash: wizardAccount.keyHash } as never,
        forgotKey
      );
      if (check.ok) {
        await proceedAfterVerification();
      } else {
        const fails = verifyFails + 1;
        setVerifyFails(fails);
        if (fails >= MAX_VERIFY_ATTEMPTS) {
          setLockedUntil(Date.now() + VERIFY_COOLDOWN_MS);
          setError(t('adminLogin.forgotTooManyAttempts', { minutes: 5 }));
        } else {
          setError(t('adminLogin.forgotWrongKey'));
        }
      }
    } finally {
      setForgotBusy(false);
    }
  };

  const handleSendResetEmailDirect = async (emailOverride?: string) => {
    setError('');
    const email = emailOverride || wizardAccount?.email;
    if (!email) return;
    setForgotBusy(true);
    try {
      const outcome = await trySendResetEmail(email);
      if (outcome === 'sent') {
        setEmailSendFailed(false);
        setWizardAccount((prev) =>
          prev
            ? prev.email
              ? prev
              : { ...prev, email }
            : { uid: '', question: null, answerHash: null, keyHash: null, email, username: email }
        );
        setForgotStep('emailSent');
      } else {
        setError(t('adminLogin.forgotEmailSendFailed'));
      }
    } finally {
      setForgotBusy(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!wizardAccount) return;
    if (newPassword.length < 6) {
      setError(t('adminRegister.passwordShort'));
      return;
    }
    if (newPassword !== newConfirm) {
      setError(t('adminRegister.passwordMismatch'));
      return;
    }
    setForgotBusy(true);
    try {
      await writeNewPasswordHash(wizardAccount.uid, newPassword);
      setForgotStep('done');
    } catch {
      // PERMISSION_DENIED (rules hatch unavailable) → guide to the email /
      // console paths instead of a dead end.
      setError(t('adminLogin.forgotResetDenied'));
    } finally {
      setForgotBusy(false);
    }
  };

  const backToLogin = () => {
    setError('');
    setMode('login');
  };

  /** Resolved question text for the wizard header. */
  const questionText = wizardAccount?.question || '';

  const sharedFieldClass = 'ps-10 h-11 rounded-xl bg-white/5 border-white/15 text-white placeholder:text-white/35 focus-visible:border-gold-soft/60 focus-visible:ring-gold-soft/40';

  const isRegister = mode === 'register';
  const isForgot = mode === 'forgot';

  // Wizard titles per step
  const forgotTitle = (() => {
    switch (forgotStep) {
      case 'identify': return t('adminLogin.forgotTitle');
      case 'method': return t('adminLogin.forgotChooseMethod');
      case 'question': return t('adminLogin.forgotMethodQuestion');
      case 'key': return t('adminLogin.forgotMethodKey');
      case 'newpass': return t('adminLogin.forgotNewPasswordTitle');
      case 'emailSent': return t('adminLogin.forgotEmailSentTitle');
      case 'done': return t('adminLogin.forgotDoneTitle');
      case 'nomethods': return t('adminLogin.forgotNoMethodsTitle');
    }
  })();

  return (
    <div className="min-h-screen geo-dark">
      {/* Single in-flow wrapper (geo-dark forces in-flow children to relative/z-1),
          decorations anchor to it; m-auto centering avoids top-clipping on short screens */}
      <div className="relative flex w-full min-h-screen px-4 py-10 overflow-hidden">
        {/* Faint giant rotating 8-point star */}
        <svg
          viewBox="0 0 100 100"
          aria-hidden="true"
          className="animate-spin-slow absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[36rem] text-gold-soft/5 pointer-events-none"
        >
          <path
            d="M50 2 L59 26 L83 17 L74 41 L98 50 L74 59 L83 83 L59 74 L50 98 L41 74 L17 83 L26 59 L2 50 L26 41 L17 17 L41 26 Z"
            stroke="currentColor"
            strokeWidth={0.75}
            fill="none"
          />
          <circle cx="50" cy="50" r="14" stroke="currentColor" strokeWidth={0.75} fill="none" />
          <circle cx="50" cy="50" r="5" fill="currentColor" />
        </svg>

        {/* Gold radial glow (top) */}
        <div
          aria-hidden="true"
          className="absolute -top-48 inset-x-0 mx-auto w-[46rem] h-[26rem] rounded-full bg-gold-bright/10 blur-[110px] pointer-events-none"
        />

        {/* Very top gold flow line */}
        <div aria-hidden="true" className="gold-flow-line absolute top-0 inset-x-0" />

        {/* Glass panel card */}
        <div className="relative m-auto w-full max-w-md rounded-3xl border border-gold-soft/15 bg-white/[0.04] backdrop-blur-xl p-8 shadow-2xl">
          {/* Card top gold flow strip */}
          <div aria-hidden="true" className="gold-flow-line absolute top-0 inset-x-0 rounded-t-3xl" />

          {/* Language switcher — pinned to the panel's top-end corner so it
              stays clear of the centered logo/title in ALL modes */}
          <div className="absolute top-4 end-4 z-10">
            <LanguageSwitcher compact onDark />
          </div>

          {/* Back button for wizard/registration modes */}
          {(isForgot || isRegister) && (
            <div className="absolute top-4 start-4 z-10">
              <button
                type="button"
                onClick={() => (isRegister ? backToLogin() : setMode('login'))}
                className="p-2 rounded-full text-white/60 hover:text-gold-soft hover:bg-white/5 transition-colors"
                aria-label={t('adminLogin.forgotBackToLogin')}
              >
                <ArrowLeft className="size-4 rtl:-scale-x-100" />
              </button>
            </div>
          )}

          {/* Logo in gold-ringed circle */}
          <div className="flex flex-col items-center gap-4 pb-6">
            <div className="p-1 rounded-full bg-gradient-to-br from-gold-soft to-gold-bright shadow-lg shadow-gold-bright/25">
              <div className="bg-night rounded-full p-2">
                <img
                  src="/logo.png"
                  alt={t('adminLayout.subtitle')}
                  className="w-16 h-16 object-contain rounded-full"
                />
              </div>
            </div>

            {/* Title */}
            <div className="text-center space-y-1.5">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {isForgot ? forgotTitle : isRegister ? t('adminRegister.title') : t('admin.adminPanel')}
              </h1>
              <div className="ornament-divider text-gold-soft/70 text-sm py-1 px-6" aria-hidden="true">
                <span>✦</span>
              </div>
              <p className="text-white/55 text-sm">
                {isForgot ? t('adminLogin.forgotSubtitle') : isRegister ? t('adminRegister.subtitle') : t('adminLayout.subtitle')}
              </p>
            </div>
          </div>

          {mode === 'forgot' ? (
            /* ================= Forgot-password wizard ================= */
            <div className="space-y-5">
              {/* ---- Step: identify ---- */}
              {forgotStep === 'identify' && (
                <form onSubmit={handleForgotIdentify} className="space-y-5">
                  <div className="bg-gold-soft/10 border border-gold-soft/25 text-gold-soft/90 px-4 py-3 rounded-xl text-sm flex gap-2.5 items-start" role="note">
                    <Info className="size-4 mt-0.5 shrink-0 text-gold-bright" aria-hidden="true" />
                    <span>{t('adminLogin.forgotIdentifyNote')}</span>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="forgot-identifier" className="text-sm font-medium text-white/75">
                      {t('adminLogin.forgotIdentifierLabel')}
                    </label>
                    <div className="relative">
                      <User className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-white/35" />
                      <Input
                        id="forgot-identifier"
                        type="text"
                        value={forgotIdentifier}
                        onChange={(e) => {
                          setForgotIdentifier(e.target.value);
                          if (error) setError('');
                        }}
                        placeholder={t('adminLogin.forgotIdentifierPh')}
                        className={sharedFieldClass}
                        disabled={forgotBusy}
                        autoFocus
                        autoComplete="username"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="btn-gold w-full h-12 rounded-full font-bold text-base"
                    disabled={forgotBusy}
                  >
                    {forgotBusy ? (
                      <>
                        <Loader2 className="size-5 animate-spin" />
                        <span>{t('adminLogin.forgotChecking')}</span>
                      </>
                    ) : (
                      <>
                        <Send className="size-5" />
                        <span>{t('adminLogin.forgotNext')}</span>
                      </>
                    )}
                  </Button>
                </form>
              )}

              {/* ---- Step: choose verification method ---- */}
              {forgotStep === 'method' && wizardAccount && (
                <div className="space-y-3">
                  {(() => {
                    const hasQuestion = !!wizardAccount.question && !!wizardAccount.answerHash;
                    const hasKey = !!wizardAccount.keyHash;
                    const hasEmail = !!wizardAccount.email;
                    const cards: { id: ForgotMethod; icon: typeof KeyRound; title: string; desc: string; onClick: () => void }[] = [];
                    if (hasQuestion) {
                      cards.push({
                        id: 'question',
                        icon: MessagesSquare,
                        title: t('adminLogin.forgotMethodQuestion'),
                        desc: t('adminLogin.forgotMethodQuestionDesc'),
                        onClick: () => { setError(''); setForgotStep('question'); },
                      });
                    }
                    if (hasKey) {
                      cards.push({
                        id: 'key',
                        icon: KeyRound,
                        title: t('adminLogin.forgotMethodKey'),
                        desc: t('adminLogin.forgotMethodKeyDesc'),
                        onClick: () => { setError(''); setForgotStep('key'); },
                      });
                    }
                    if (hasEmail) {
                      cards.push({
                        id: 'email',
                        icon: Mail,
                        title: t('adminLogin.forgotMethodEmail'),
                        desc: t('adminLogin.forgotMethodEmailDesc'),
                        onClick: () => handleSendResetEmailDirect(),
                      });
                    }
                    return cards.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={c.onClick}
                        disabled={forgotBusy}
                        className="w-full text-start rounded-2xl border border-white/12 bg-white/[0.04] hover:bg-white/[0.09] hover:border-gold-soft/40 transition-all px-4 py-4 flex items-center gap-3.5 group disabled:opacity-50"
                      >
                        <span className="p-2.5 rounded-xl bg-gold-soft/10 border border-gold-soft/20 text-gold-soft group-hover:text-gold-bright transition-colors shrink-0">
                          <c.icon className="size-5" />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-bold text-white">{c.title}</span>
                          <span className="block text-xs text-white/50 mt-0.5 leading-relaxed">{c.desc}</span>
                        </span>
                        <ArrowLeft className="size-4 text-white/30 group-hover:text-gold-soft rtl:-scale-x-100 rotate-180 transition-colors shrink-0" />
                      </button>
                    ));
                  })()}
                  {forgotBusy && (
                    <div className="flex items-center justify-center gap-2 text-sm text-white/60 py-2">
                      <Loader2 className="size-4 animate-spin" />
                      {t('adminLogin.forgotSending')}
                    </div>
                  )}
                </div>
              )}

              {/* ---- Step: security question ---- */}
              {forgotStep === 'question' && (
                <form onSubmit={handleVerifyQuestion} className="space-y-5">
                  <div className="rounded-2xl border border-gold-soft/25 bg-gold-soft/10 px-4 py-4">
                    <p className="text-xs text-gold-soft/70 mb-1">{t('adminLogin.forgotQuestionLabel')}</p>
                    <p className="text-sm font-bold text-white leading-relaxed">{questionText}</p>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="forgot-answer" className="text-sm font-medium text-white/75">
                      {t('adminLogin.forgotAnswerLabel')}
                    </label>
                    <div className="relative">
                      <MessagesSquare className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-white/35" />
                      <Input
                        id="forgot-answer"
                        type="text"
                        value={forgotAnswer}
                        onChange={(e) => {
                          setForgotAnswer(e.target.value);
                          if (error) setError('');
                        }}
                        placeholder={t('adminLogin.forgotAnswerPh')}
                        className={sharedFieldClass}
                        disabled={forgotBusy || isLocked}
                        autoFocus
                        autoComplete="off"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="btn-gold w-full h-12 rounded-full font-bold text-base"
                    disabled={forgotBusy || isLocked}
                  >
                    {forgotBusy ? (
                      <>
                        <Loader2 className="size-5 animate-spin" />
                        <span>{t('adminLogin.forgotVerifying')}</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="size-5" />
                        <span>{t('adminLogin.forgotVerify')}</span>
                      </>
                    )}
                  </Button>
                </form>
              )}

              {/* ---- Step: recovery key ---- */}
              {forgotStep === 'key' && (
                <form onSubmit={handleVerifyKey} className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="forgot-key" className="text-sm font-medium text-white/75">
                      {t('adminLogin.forgotKeyLabel')}
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-white/35" />
                      <Input
                        id="forgot-key"
                        type="text"
                        value={forgotKey}
                        onChange={(e) => {
                          setForgotKey(e.target.value);
                          if (error) setError('');
                        }}
                        placeholder={t('adminLogin.forgotKeyPh')}
                        className={`${sharedFieldClass} font-mono tracking-widest`}
                        disabled={forgotBusy || isLocked}
                        autoFocus
                        autoComplete="off"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="btn-gold w-full h-12 rounded-full font-bold text-base"
                    disabled={forgotBusy || isLocked}
                  >
                    {forgotBusy ? (
                      <>
                        <Loader2 className="size-5 animate-spin" />
                        <span>{t('adminLogin.forgotVerifying')}</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="size-5" />
                        <span>{t('adminLogin.forgotVerify')}</span>
                      </>
                    )}
                  </Button>
                </form>
              )}

              {/* ---- Step: new password (RTDB-only accounts) ---- */}
              {forgotStep === 'newpass' && (
                <form onSubmit={handleResetPassword} className="space-y-5">
                  {emailSendFailed && (
                    <div className="bg-amber-400/10 border border-amber-300/30 text-amber-200/90 px-4 py-3 rounded-xl text-xs flex gap-2 items-start" role="note">
                      <Info className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
                      <span>{t('adminLogin.forgotEmailSendFailedNote')}</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label htmlFor="forgot-newpass" className="text-sm font-medium text-white/75">
                      {t('adminLogin.forgotNewPassword')}
                    </label>
                    <div className="relative">
                      <Lock className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-white/35" />
                      <Input
                        id="forgot-newpass"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (error) setError('');
                        }}
                        placeholder={t('admin.passwordPlaceholder')}
                        className="ps-10 pe-10 h-11 rounded-xl bg-white/5 border-white/15 text-white placeholder:text-white/35 focus-visible:border-gold-soft/60 focus-visible:ring-gold-soft/40"
                        disabled={forgotBusy}
                        autoFocus
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-white/45 hover:text-gold-soft transition-colors"
                        aria-label={showNewPassword ? t('adminLogin.hidePassword') : t('adminLogin.showPassword')}
                        disabled={forgotBusy}
                      >
                        {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="forgot-newconfirm" className="text-sm font-medium text-white/75">
                      {t('adminLogin.forgotConfirmPassword')}
                    </label>
                    <div className="relative">
                      <Lock className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-white/35" />
                      <Input
                        id="forgot-newconfirm"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newConfirm}
                        onChange={(e) => {
                          setNewConfirm(e.target.value);
                          if (error) setError('');
                        }}
                        placeholder={t('admin.passwordPlaceholder')}
                        className={sharedFieldClass}
                        disabled={forgotBusy}
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="btn-gold w-full h-12 rounded-full font-bold text-base"
                    disabled={forgotBusy}
                  >
                    {forgotBusy ? (
                      <>
                        <Loader2 className="size-5 animate-spin" />
                        <span>{t('adminLogin.forgotResetting')}</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="size-5" />
                        <span>{t('adminLogin.forgotResetBtn')}</span>
                      </>
                    )}
                  </Button>
                </form>
              )}

              {/* ---- Step: email sent ---- */}
              {forgotStep === 'emailSent' && (
                <div className="space-y-6 text-center">
                  <div className="mx-auto p-4 rounded-full bg-green-400/10 border border-green-300/30 w-fit">
                    <Send className="size-8 text-green-300" aria-hidden="true" />
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed">
                    {t('adminLogin.forgotEmailSentDesc', { email: wizardAccount?.email || '' })}
                  </p>
                  <Button
                    type="button"
                    onClick={backToLogin}
                    className="btn-gold w-full h-12 rounded-full font-bold text-base"
                  >
                    {t('adminLogin.forgotBackToLogin')}
                  </Button>
                </div>
              )}

              {/* ---- Step: done (inline reset) ---- */}
              {forgotStep === 'done' && (
                <div className="space-y-6 text-center">
                  <div className="mx-auto p-4 rounded-full bg-green-400/10 border border-green-300/30 w-fit">
                    <CheckCircle2 className="size-8 text-green-300" aria-hidden="true" />
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed">{t('adminLogin.forgotDoneDesc')}</p>
                  <Button
                    type="button"
                    onClick={backToLogin}
                    className="btn-gold w-full h-12 rounded-full font-bold text-base"
                  >
                    {t('adminLogin.forgotBackToLogin')}
                  </Button>
                </div>
              )}

              {/* ---- Step: no methods configured ---- */}
              {forgotStep === 'nomethods' && (
                <div className="space-y-6">
                  <div className="bg-amber-400/10 border border-amber-300/30 text-amber-200/90 px-4 py-4 rounded-xl text-sm flex gap-2.5 items-start" role="note">
                    <AlertTriangle className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
                    <span>{t('adminLogin.forgotNoMethodsDesc')}</span>
                  </div>
                  <Button
                    type="button"
                    onClick={backToLogin}
                    variant="outline"
                    className="w-full h-11 rounded-full border-white/20 text-white/80 hover:bg-white/5"
                  >
                    {t('adminLogin.forgotBackToLogin')}
                  </Button>
                </div>
              )}

              {/* Error message + lock notice */}
              {error && (
                <div className="bg-danger/10 border border-danger/40 text-danger px-4 py-3 rounded-xl text-sm animate-fade-in-up" role="alert">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
                    {error}
                  </span>
                </div>
              )}
              {isLocked && (
                <div className="bg-amber-400/10 border border-amber-300/30 text-amber-200 px-4 py-3 rounded-xl text-sm flex items-center gap-2" role="alert">
                  <Loader2 className="size-4 shrink-0" aria-hidden="true" />
                  {t('adminLogin.forgotLocked', { minutes: lockMinutesLeft })}
                </div>
              )}
            </div>
          ) : isRegister ? (
            /* ---------------- First-admin registration form ---------------- */
            <form onSubmit={handleRegister} className="space-y-5">
              {/* Setup notice */}
              <div className="bg-gold-soft/10 border border-gold-soft/25 text-gold-soft/90 px-4 py-3 rounded-xl text-sm flex gap-2.5 items-start" role="note">
                <ShieldCheck className="size-4 mt-0.5 shrink-0 text-gold-bright" aria-hidden="true" />
                <span>{t('adminRegister.setupNote')}</span>
              </div>

              {/* Name field */}
              <div className="space-y-2">
                <label htmlFor="admin-reg-name" className="text-sm font-medium text-white/75">
                  {t('adminRegister.name')}
                </label>
                <div className="relative">
                  <User className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-white/35" />
                  <Input
                    id="admin-reg-name"
                    type="text"
                    value={regName}
                    onChange={(e) => {
                      setRegName(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder={t('adminRegister.namePlaceholder')}
                    className={sharedFieldClass}
                    disabled={isLoggingIn}
                    autoComplete="name"
                  />
                </div>
              </div>

              {/* Username field */}
              <div className="space-y-2">
                <label htmlFor="admin-reg-username" className="text-sm font-medium text-white/75">
                  {t('adminNav.username')}
                </label>
                <div className="relative">
                  <UserPlus className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-white/35" />
                  <Input
                    id="admin-reg-username"
                    type="text"
                    value={regUsername}
                    onChange={(e) => {
                      setRegUsername(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder={t('adminLogin.usernamePlaceholder')}
                    className={sharedFieldClass}
                    disabled={isLoggingIn}
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Email field (Firebase Auth account) */}
              <div className="space-y-2">
                <label htmlFor="admin-reg-email" className="text-sm font-medium text-white/75">
                  {t('adminRegister.email')}
                </label>
                <div className="relative">
                  <Mail className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-white/35" />
                  <Input
                    id="admin-reg-email"
                    type="email"
                    value={regEmail}
                    onChange={(e) => {
                      setRegEmail(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder={t('adminRegister.emailPlaceholder')}
                    className={sharedFieldClass}
                    disabled={isLoggingIn}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <label htmlFor="admin-reg-password" className="text-sm font-medium text-white/75">
                  {t('admin.password')}
                </label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-white/35" />
                  <Input
                    id="admin-reg-password"
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => {
                      setRegPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder={t('admin.passwordPlaceholder')}
                    className="ps-10 pe-10 h-11 rounded-xl bg-white/5 border-white/15 text-white placeholder:text-white/35 focus-visible:border-gold-soft/60 focus-visible:ring-gold-soft/40"
                    disabled={isLoggingIn}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-white/45 hover:text-gold-soft transition-colors"
                    aria-label={showRegPassword ? t('adminLogin.hidePassword') : t('adminLogin.showPassword')}
                    disabled={isLoggingIn}
                  >
                    {showRegPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm password field */}
              <div className="space-y-2">
                <label htmlFor="admin-reg-confirm" className="text-sm font-medium text-white/75">
                  {t('adminRegister.confirmPassword')}
                </label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-white/35" />
                  <Input
                    id="admin-reg-confirm"
                    type={showRegPassword ? 'text' : 'password'}
                    value={regConfirm}
                    onChange={(e) => {
                      setRegConfirm(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder={t('admin.passwordPlaceholder')}
                    className={sharedFieldClass}
                    disabled={isLoggingIn}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {/* ===== Recovery setup (v2.3): security question + answer ===== */}
              <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-4 space-y-4">
                <div className="flex items-start gap-2.5 text-gold-soft/90 text-xs leading-relaxed">
                  <HelpCircle className="size-4 mt-0.5 shrink-0 text-gold-bright" aria-hidden="true" />
                  <span>{t('adminRegister.recoveryNote')}</span>
                </div>

                {/* Security question select */}
                <div className="space-y-2">
                  <label htmlFor="admin-reg-sq" className="text-sm font-medium text-white/75">
                    {t('adminRegister.securityQuestion')}
                  </label>
                  <select
                    id="admin-reg-sq"
                    value={regQuestion}
                    onChange={(e) => {
                      setRegQuestion(e.target.value);
                      if (error) setError('');
                    }}
                    disabled={isLoggingIn}
                    className="h-11 w-full rounded-xl bg-white/5 border border-white/15 px-3 text-sm text-white focus-visible:border-gold-soft/60 focus-visible:ring-gold-soft/40 outline-none [&>option]:bg-night [&>option]:text-white"
                  >
                    <option value="">{t('adminRegister.securityQuestionSelect')}</option>
                    {PRESET_QUESTIONS.map((q) => (
                      <option key={q} value={q}>{t(q)}</option>
                    ))}
                    <option value="custom">{t('adminRecovery.qCustom')}</option>
                  </select>
                </div>

                {/* Custom question input */}
                {regQuestion === 'custom' && (
                  <div className="space-y-2">
                    <label htmlFor="admin-reg-sq-custom" className="text-sm font-medium text-white/75">
                      {t('adminRegister.securityQuestionCustom')}
                    </label>
                    <Input
                      id="admin-reg-sq-custom"
                      type="text"
                      value={regQuestionCustom}
                      onChange={(e) => {
                        setRegQuestionCustom(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder={t('adminRecovery.qCustom')}
                      className="h-11 rounded-xl bg-white/5 border-white/15 text-white placeholder:text-white/35 focus-visible:border-gold-soft/60 focus-visible:ring-gold-soft/40"
                      disabled={isLoggingIn}
                      maxLength={120}
                    />
                  </div>
                )}

                {/* Security answer */}
                <div className="space-y-2">
                  <label htmlFor="admin-reg-answer" className="text-sm font-medium text-white/75">
                    {t('adminRegister.securityAnswer')}
                  </label>
                  <Input
                    id="admin-reg-answer"
                    type="text"
                    value={regAnswer}
                    onChange={(e) => {
                      setRegAnswer(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder={t('adminRegister.securityAnswerPh')}
                    className="h-11 rounded-xl bg-white/5 border-white/15 text-white placeholder:text-white/35 focus-visible:border-gold-soft/60 focus-visible:ring-gold-soft/40"
                    disabled={isLoggingIn}
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-danger/10 border border-danger/40 text-danger px-4 py-3 rounded-xl text-sm animate-fade-in-up" role="alert">
                  {error}
                </div>
              )}

              {/* Register button */}
              <Button
                type="submit"
                className="btn-gold w-full h-12 rounded-full font-bold text-base"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    <span>{t('adminRegister.creating')}</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="size-5" />
                    <span>{t('adminRegister.createButton')}</span>
                  </>
                )}
              </Button>
            </form>
          ) : (
            /* ---------------- Existing admin login form ---------------- */
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Username field */}
              <div className="space-y-2">
                <label htmlFor="admin-username" className="text-sm font-medium text-white/75">
                  {t('adminNav.username')}
                </label>
                <div className="relative">
                  <User className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-white/35" />
                  <Input
                    id="admin-username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder={t('adminLogin.identifierPlaceholder')}
                    className={sharedFieldClass}
                    disabled={isLoggingIn}
                    autoFocus
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <label htmlFor="admin-password" className="text-sm font-medium text-white/75">
                  {t('admin.password')}
                </label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-white/35" />
                  <Input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder={t('admin.passwordPlaceholder')}
                    className="ps-10 pe-10 h-11 rounded-xl bg-white/5 border-white/15 text-white placeholder:text-white/35 focus-visible:border-gold-soft/60 focus-visible:ring-gold-soft/40"
                    disabled={isLoggingIn}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-white/45 hover:text-gold-soft transition-colors"
                    aria-label={showPassword ? t('adminLogin.hidePassword') : t('adminLogin.showPassword')}
                    disabled={isLoggingIn}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-danger/10 border border-danger/40 text-danger px-4 py-3 rounded-xl text-sm animate-fade-in-up" role="alert">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
                    {error}
                  </span>
                </div>
              )}

              {/* Login button */}
              <Button
                type="submit"
                className="btn-gold w-full h-12 rounded-full font-bold text-base"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    <span>{t('admin.verifying')}</span>
                  </>
                ) : (
                  <>
                    <Lock className="size-5" />
                    <span>{t('admin.loginButton')}</span>
                  </>
                )}
              </Button>

              {/* Forgot password link (v2.3) */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={startForgot}
                  className="inline-flex items-center gap-1.5 text-sm text-gold-soft/80 hover:text-gold-soft underline-offset-4 hover:underline transition-colors py-1"
                >
                  <HelpCircle className="size-4" aria-hidden="true" />
                  {t('adminLogin.forgotLink')}
                </button>
              </div>

              {/* Password hint */}
              <div className="text-center">
                <p className="text-xs text-white/50 bg-white/5 border border-white/10 rounded-xl px-3 py-2 inline-block">
                  {t('adminLogin.legalNotice')} <span className="font-mono font-medium text-gold-soft">{t('adminLogin.legalAction')}</span>
                </p>
              </div>
            </form>
          )}

          {/* Back to website link */}
          <div className="mt-8 pt-5 border-t border-white/10">
            <button
              type="button"
              onClick={() => navigateTo('public')}
              className="w-full flex items-center justify-center gap-2 text-sm text-gold-soft/80 hover:text-gold-soft transition-colors py-2 rounded-xl hover:bg-white/5"
            >
              <ArrowLeft className="size-4 rtl:-scale-x-100" />
              <span>{t('admin.backToSite')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
