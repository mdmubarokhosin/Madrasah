/**
 * Admin password recovery toolkit ("forgot password" — v2.3).
 *
 * THREE independent recovery vectors, evaluated in the login wizard:
 *  1. SECURITY QUESTION  — chosen at first-admin registration (or later in
 *     Admin → Settings → Recovery). The answer is normalized (trim, lowercase,
 *     collapsed whitespace) and stored as a PBKDF2 hash — never plaintext.
 *  2. RECOVERY KEY       — a 16-char code (e.g. MDRS-XXXX-XXXX-XXXX groups of
 *     4, ambiguous glyphs I/L/O/0/1 excluded) generated once and shown exactly
 *     one time. Stored normalized (uppercase, alphanumeric-only) as PBKDF2.
 *  3. EMAIL RESET LINK   — Firebase Auth `sendPasswordResetEmail` to the
 *     registered address. Only the inbox owner can complete the reset, so no
 *     prior verification is required for this vector.
 *
 * RESET TARGET RULES (Auth + RTDB combo):
 *  - Profile bound to a Firebase Auth email account → the Auth password is the
 *    credential source of truth → the only correct self-service reset is the
 *    emailed link (a client SDK cannot change another user's Auth password).
 *  - RTDB-only profile (Auth unavailable/missing account, or no email) → the
 *    /adminUsers/{uid}.passwordHash is the credential → after verifying the
 *    security answer or recovery key the wizard rewrites the hash directly.
 *
 * All DB writes here are best-effort guarded; the RTDB security rules remain
 * the real enforcement boundary.
 */

import { sendPasswordResetEmail } from 'firebase/auth';
import { dbGet, dbSet, dbUpdate } from './db-service';
import { hashPassword, verifyPassword, type PasswordVerifyResult } from './password';
import { getAuthInstance } from './firebase';
import type { AdminUser } from '@/types/database';

/** Profile enriched with the optional recovery fields. */
export type AdminProfile = AdminUser & {
  securityQuestion?: string | null;
  securityAnswerHash?: string | null;
  recoveryKeyHash?: string | null;
  recoverySetupAt?: number | null;
};

export interface AdminProfileHit {
  uid: string;
  profile: AdminProfile;
}

/** Which recovery vectors a profile offers. */
export interface RecoveryMethods {
  question: boolean;
  key: boolean;
  email: boolean;
}

/**
 * Public recovery record stored at /adminRecovery/byUsername/<usernameLower>.
 * Contains ONLY non-sensitive material (no email, no password hash, no profile
 * payload) so a locked-out admin can verify themselves without violating the
 * admin-only /adminUsers rules. Requires the updated database.rules.json to be
 * deployed; on older rules the read is denied and the wizard falls back to the
 * email vector / manual guidance.
 */
export interface RecoveryRecord {
  uid: string;
  question: string;
  answerHash: string;
  keyHash: string;
  setupAt: number;
}

// ============ Normalization ============

/** Security answers are case/space-insensitive: trim, lowercase, collapse spaces. */
export function normalizeAnswer(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Recovery keys ignore case, dashes and whitespace: uppercase alphanumerics only. */
export function normalizeRecoveryKey(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// ============ Recovery key generation ============

// Ambiguous glyphs excluded: no I/L/O (letters), no 0/1 (digits).
const KEY_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Generate a one-time recovery key: 16 chars in 4×4 groups, e.g. `K7QM-2PNX-AB4D-9TVR`. */
export function generateRecoveryKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let chars = '';
  for (let i = 0; i < 16; i++) {
    chars += KEY_ALPHABET[bytes[i] % KEY_ALPHABET.length];
  }
  return `${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}-${chars.slice(12, 16)}`;
}

// ============ Profile lookup ============

/**
 * Resolve an admin profile by username OR email (case-insensitive exact match).
 * Returns null when no profile matches (never throws — DB errors → null so the
 * wizard reports "not found" rather than crashing).
 */
export async function findAdminProfile(identifier: string): Promise<AdminProfileHit | null> {
  const id = identifier.trim().toLowerCase();
  if (!id) return null;
  const users = await dbGet<Record<string, AdminProfile>>('/adminUsers').catch(() => null);
  if (!users) return null;
  const entry = Object.entries(users).find(([, u]) => {
    if (!u) return false;
    const uname = String(u.username || '').toLowerCase();
    const email = String(u.email || '').toLowerCase();
    return uname === id || (!!email && email === id);
  });
  if (!entry) return null;
  return { uid: entry[0], profile: entry[1] };
}

/** Which recovery vectors does this profile offer? */
export function getRecoveryMethods(profile: AdminProfile): RecoveryMethods {
  return {
    question: !!profile.securityQuestion && !!profile.securityAnswerHash,
    key: !!profile.recoveryKeyHash,
    email: !!profile.email,
  };
}

/**
 * Persist the public recovery record mirror at /adminRecovery/byUsername/
 * (readable by any authenticated user who knows the username — see rules).
 * Best-effort: without the updated rules the write is denied and the recovery
 * mirror simply stays absent (the email vector keeps working).
 */
export async function saveRecoveryRecord(
  uid: string,
  username: string,
  data: { question: string; answerHash: string; keyHash: string }
): Promise<void> {
  const uname = username.trim().toLowerCase();
  if (!uname) return;
  const record: RecoveryRecord = {
    uid,
    question: data.question,
    answerHash: data.answerHash,
    keyHash: data.keyHash,
    setupAt: Date.now(),
  };
  await dbSet(`/adminRecovery/byUsername/${uname}`, record);
}

/**
 * Read the public recovery record for a username (locked-out admin path).
 * Returns null when missing/denied (older rules) — callers fall back.
 */
export async function findRecoveryRecord(username: string): Promise<RecoveryRecord | null> {
  const uname = username.trim().toLowerCase();
  if (!uname) return null;
  try {
    const rec = await dbGet<RecoveryRecord>(`/adminRecovery/byUsername/${uname}`);
    return rec && rec.uid ? rec : null;
  } catch {
    return null;
  }
}

// ============ Verification ============

/** Verify a security answer against the stored PBKDF2 hash. */
export async function verifySecurityAnswer(
  profile: AdminProfile,
  answer: string
): Promise<PasswordVerifyResult> {
  if (!profile.securityAnswerHash) {
    return { ok: false, needsUpgrade: false, needsPlaintextStrip: false };
  }
  return verifyPassword(normalizeAnswer(answer), { passwordHash: profile.securityAnswerHash });
}

/** Verify a recovery key against the stored PBKDF2 hash. */
export async function verifyRecoveryKey(
  profile: AdminProfile,
  key: string
): Promise<PasswordVerifyResult> {
  if (!profile.recoveryKeyHash) {
    return { ok: false, needsUpgrade: false, needsPlaintextStrip: false };
  }
  return verifyPassword(normalizeRecoveryKey(key), { passwordHash: profile.recoveryKeyHash });
}

// ============ Setup writes (Settings / registration) ============

/**
 * Persist the security question + normalized-answer hash on the admin profile
 * AND mirror it to the public /adminRecovery record (best-effort — the mirror
 * needs the updated rules; without them the profile fields still save).
 */
export async function saveSecurityQuestion(
  uid: string,
  username: string,
  question: string,
  answer: string,
  keyHashMirror?: string | null
): Promise<void> {
  const answerHash = await hashPassword(normalizeAnswer(answer));
  await dbUpdate(`/adminUsers/${uid}`, {
    securityQuestion: question.trim(),
    securityAnswerHash: answerHash,
    recoverySetupAt: Date.now(),
  });
  // Public mirror (needs updated database.rules.json; failure is non-fatal)
  try {
    const keyHash =
      keyHashMirror ||
      (await dbGet<AdminProfile>(`/adminUsers/${uid}`).catch(() => null))?.recoveryKeyHash ||
      '';
    if (keyHash) {
      await saveRecoveryRecord(uid, username, { question: question.trim(), answerHash, keyHash });
    }
  } catch {
    /* mirror best-effort */
  }
}

/**
 * Persist a NEW recovery key hash (invalidates any previous key) and refresh
 * the public mirror. Returns the new hash.
 */
export async function saveRecoveryKeyHash(
  uid: string,
  username: string,
  recoveryKey: string,
  questionMirror?: string | null,
  answerHashMirror?: string | null
): Promise<string> {
  const keyHash = await hashPassword(normalizeRecoveryKey(recoveryKey));
  await dbUpdate(`/adminUsers/${uid}`, {
    recoveryKeyHash: keyHash,
    recoverySetupAt: Date.now(),
  });
  // Public mirror (needs updated database.rules.json; failure is non-fatal)
  try {
    const fresh = await dbGet<AdminProfile>(`/adminUsers/${uid}`).catch(() => null);
    const question = questionMirror || fresh?.securityQuestion || '';
    const answerHash = answerHashMirror || fresh?.securityAnswerHash || '';
    if (question && answerHash) {
      await saveRecoveryRecord(uid, username, { question, answerHash, keyHash });
    }
  } catch {
    /* mirror best-effort */
  }
  return keyHash;
}

// ============ Reset operations ============

/**
 * Rewrite the RTDB password hash (RTDB-only credential source) and keep the
 * legacy super-admin fallback nodes (/config/adminAuth, /settings/adminAuth)
 * in sync best-effort — registration seeds them, so a reset must refresh them
 * too or the stored hashes would drift out of date.
 */
export async function writeNewPasswordHash(uid: string, newPassword: string): Promise<void> {
  const passwordHash = await hashPassword(newPassword);
  await dbUpdate(`/adminUsers/${uid}`, { passwordHash, password: null });
  // Legacy parity (both nodes carry only hashes — never plaintext)
  dbSet('/config/adminAuth', { passwordHash, password: null }).catch(() => {});
  const profile = await dbGet<AdminProfile>(`/adminUsers/${uid}`).catch(() => null);
  if (profile?.username) {
    dbSet('/settings/adminAuth', { username: profile.username, passwordHash, password: null }).catch(() => {});
  }
}

/**
 * Attempt the Firebase Auth reset email. Returns:
 *  - 'sent'     → email delivered (or silently accepted under enumeration protection)
 *  - 'failed'   → provider disabled / network / unknown user etc. Callers fall
 *                 back to the RTDB hash reset when this account is RTDB-bound.
 */
export async function trySendResetEmail(email: string): Promise<'sent' | 'failed'> {
  try {
    await sendPasswordResetEmail(getAuthInstance(), email.trim());
    return 'sent';
  } catch (err) {
    console.debug('trySendResetEmail failed:', err instanceof Error ? err.message : err);
    return 'failed';
  }
}
