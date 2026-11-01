/**
 * Password hashing utilities (Web Crypto — browser only).
 *
 * SECURITY SCHEME (PBKDF2-SHA256):
 * - New/changed passwords are stored as salted PBKDF2 hashes in `passwordHash`
 *   with the portable format:  `pbkdf2$<iterations>$<saltB64>$<hashB64>`
 * - Legacy UNSALTED SHA-256 hex hashes still verify (ok → needsUpgrade, and the
 *   next successful login transparently re-hashes the password to PBKDF2).
 * - Legacy PLAINTEXT `password` fields still verify only when no hash exists
 *   (ok → needsUpgrade + needsPlaintextStrip: the login flow hashes the password
 *   and strips the plaintext field in the same dbUpdate).
 * - Verification is constant-time-ish: every byte of both digests participates
 *   in the comparison, so response timing does not leak the stored digest.
 * - The real enforcement boundary remains the RTDB security rules — hashing
 *   here removes reusable credential material from the database.
 */

const PBKDF2_ITERATIONS = 100_000;
const SALT_LENGTH_BYTES = 16;
const HASH_LENGTH_BYTES = 32; // 256-bit derived key
const PBKDF2_PREFIX = 'pbkdf2$';

export async function sha256Hex(text: string): Promise<string> {
  if (!text) return '';
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function derivePbkdf2(
  password: string,
  salt: Uint8Array,
  iterations: number
): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  // Copy into a plain (non-shared) ArrayBuffer-backed view — crypto.deriveBits
  // requires a BufferSource and TS rejects generic ArrayBufferLike views here.
  const saltBuf = new Uint8Array(salt.byteLength);
  saltBuf.set(salt);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: saltBuf, iterations },
    keyMaterial,
    HASH_LENGTH_BYTES * 8
  );
  return new Uint8Array(bits);
}

/**
 * Hash a password with the current policy: PBKDF2-SHA256, 100k iterations,
 * 16-byte random salt (crypto.getRandomValues), base64-encoded storage.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH_BYTES));
  const hash = await derivePbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `${PBKDF2_PREFIX}${PBKDF2_ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(hash)}`;
}

/** Byte-wise, early-exit-free comparison (constant-time-ish). */
function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) {
    diff |= (a[i] || 0) ^ (b[i] || 0);
  }
  return diff === 0;
}

export interface PasswordVerifyResult {
  ok: boolean;
  /** True when the stored hash should be replaced with a fresh `pbkdf2$…` hash. */
  needsUpgrade: boolean;
  /** True when a legacy plaintext `password` field must be stripped (null). */
  needsPlaintextStrip: boolean;
}

/**
 * Verify a password against a stored profile/config. Accepts all three
 * generations: `pbkdf2$…` hashes, legacy SHA-256 hex hashes and legacy
 * plaintext `password` fields (call sites must only allow the plaintext path
 * when Firebase Auth is unavailable).
 */
export async function verifyPassword(
  password: string,
  stored?: { passwordHash?: string | null; password?: string | null } | null
): Promise<PasswordVerifyResult> {
  const fail: PasswordVerifyResult = { ok: false, needsUpgrade: false, needsPlaintextStrip: false };
  if (!stored) return fail;

  const storedHash = typeof stored.passwordHash === 'string' ? stored.passwordHash : '';

  // Current scheme: pbkdf2$<iterations>$<saltB64>$<hashB64>
  if (storedHash.startsWith(PBKDF2_PREFIX)) {
    const [, iterationsRaw, saltB64, hashB64] = storedHash.split('$');
    const iterations = parseInt(iterationsRaw, 10);
    if (!iterations || iterations < 1 || !saltB64 || !hashB64) return fail;
    try {
      const hash = await derivePbkdf2(password, base64ToBytes(saltB64), iterations);
      if (!constantTimeEqual(hash, base64ToBytes(hashB64))) return fail;
      // Matches. Flag an upgrade when the stored parameters are weaker than
      // the current policy (e.g. fewer iterations) so logins refresh it.
      return { ok: true, needsUpgrade: iterations < PBKDF2_ITERATIONS, needsPlaintextStrip: false };
    } catch {
      return fail;
    }
  }

  // Legacy scheme: unsalted SHA-256 hex → verify, then upgrade on success.
  if (storedHash) {
    const inputHex = await sha256Hex(password);
    if (inputHex && inputHex === storedHash) {
      return { ok: true, needsUpgrade: true, needsPlaintextStrip: false };
    }
    return fail;
  }

  // Legacy plaintext (only reachable when the caller allows it — i.e. no hash
  // exists and Firebase Auth could not verify the password).
  if (typeof stored.password === 'string' && stored.password) {
    if (password === stored.password) {
      return { ok: true, needsUpgrade: true, needsPlaintextStrip: true };
    }
    return fail;
  }

  return fail;
}
