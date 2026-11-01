import { create } from 'zustand';
import { dbGet, dbSet, dbPush, dbSubscribe, dbUpdate } from '@/lib/db-service';
import { hashPassword, verifyPassword } from '@/lib/password';
import { generateRecoveryKey, normalizeAnswer, normalizeRecoveryKey, saveRecoveryRecord } from '@/lib/admin-recovery';
import { anonymousSignIn, getAuthInstance, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { runTransaction, ref as fbRef, push as fbPushKey } from 'firebase/database';
import type { Language } from '@/lib/i18n';
import type {
  AppView,
  PublicPage,
  AdminPage,
  SiteInfo,
  Notice,
  Department,
  Teacher,
  Student,
  Exam,
  ExamResult,
  BlogPost,
  GalleryItem,
  AdmissionInfo,
  DonationFund,
  PaymentMethod,
  ClassRoutineItem,
  SyllabusItem,
  GithubConfig,
  Event,
  ContactMessage,
  AdmissionApplication,
  ActivityLog,
  HifzRecord,
  OnlineExam,
  ExamSubmission,
  LibraryBook,
  PrayerConfig,
  CalendarEvent,
  Alumni,
  FeeConfig,
  FeePayment,
  Expense,
  ExpenseCategory,
  SalaryRecord,
  DonationSubscription,
  Voucher,
  HostelRoom,
  HostelAllocation,
  HostelMeal,
  DawahProgram,
  DawahJamat,
  StudyMaterial,
  AdminRole,
  AdminUser,
  QRPaymentConfig,
} from '@/types/database';

interface AppState {
  // View
  currentView: AppView;
  publicPage: PublicPage;
  adminPage: AdminPage;
  setView: (view: AppView) => void;
  setPublicPage: (page: PublicPage) => void;
  setAdminPage: (page: AdminPage) => void;
  isAdminLoggedIn: boolean;
  isLoggingIn: boolean;

  // RBAC
  currentAdminUser: AdminUser | null;
  adminPermissions: string[];

  // Language
  language: Language;
  setLanguage: (lang: Language) => void;
  adminLogin: (username: string, password: string) => Promise<boolean>;
  adminLogout: () => void;
  /** Returns true when at least one registered admin profile exists in Firebase (/adminUsers).
   * Legacy fallback credentials (config/adminAuth) do NOT count — the first-admin
   * registration form must open whenever no real admin profile is registered yet. */
  checkAdminExists: () => Promise<boolean>;
  /** One-time first-admin setup: creates the first admin (Firebase Auth + RTDB profile) and auto-logs them in.
   * `recovery` supplies the security question/answer; a one-time recovery key is generated internally
   * and surfaced to the UI via `pendingRecoveryKey` (shown once in RecoveryKeyDialog). */
  registerAdmin: (name: string, username: string, email: string, password: string, recovery: { question: string; answer: string }) => Promise<{ ok: boolean; error?: string; recoveryKey?: string }>;
  /** Plaintext one-time recovery key awaiting display in RecoveryKeyDialog (null = nothing pending). */
  pendingRecoveryKey: string | null;
  setPendingRecoveryKey: (key: string | null) => void;
  /** One-shot on app mount: restores a persisted admin session (Firebase Auth restore, or localStorage marker re-validated against RTDB) */
  restoreAdminSession: () => Promise<void>;

  // Data
  siteInfo: SiteInfo | null;
  notices: Notice[];
  departments: Department[];
  teachers: Teacher[];
  students: Student[];
  exams: Exam[];
  results: ExamResult[];
  blogs: BlogPost[];
  gallery: GalleryItem[];
  admission: AdmissionInfo[];
  donations: DonationFund[];
  paymentMethods: PaymentMethod[];
  classRoutine: ClassRoutineItem[];
  syllabus: SyllabusItem[];
  githubConfig: GithubConfig | null;
  events: Event[];
  contactMessages: ContactMessage[];
  admissionApplications: AdmissionApplication[];
  activityLogs: ActivityLog[];
  hifzRecords: HifzRecord[];
  onlineExams: OnlineExam[];
  examSubmissions: ExamSubmission[];
  libraryBooks: LibraryBook[];
  prayerConfig: PrayerConfig | null;
  calendarEvents: CalendarEvent[];
  alumni: Alumni[];
  feeConfigs: FeeConfig[];
  feePayments: FeePayment[];
  expenses: Expense[];
  expenseCategories: ExpenseCategory[];
  salaryRecords: SalaryRecord[];
  donationSubscriptions: DonationSubscription[];
  vouchers: Voucher[];
  hostelRooms: HostelRoom[];
  hostelAllocations: HostelAllocation[];
  hostelMeals: HostelMeal[];
  dawahPrograms: DawahProgram[];
  dawahJamats: DawahJamat[];
  studyMaterials: StudyMaterial[];
  adminRoles: AdminRole[];
  adminUsers: AdminUser[];
  qrPaymentConfig: QRPaymentConfig | null;

  // Blog detail view
  selectedBlogId: string | null;
  setSelectedBlogId: (id: string | null) => void;

  // Loading
  dataLoaded: boolean;
  loading: boolean;

  // Firebase connection status
  firebaseConnected: boolean;
  firebaseError: string | null;
  retryConnection: () => void;

  // Actions
  loadAllData: () => void;
  /** Subscribes admin-only collections (/adminUsers, /activityLogs, …) exactly once while an admin session exists. */
  subscribeAdminData: () => void;
  /** Tears the admin-only subscriptions down (called from adminLogout + full unsubscribe). */
  unsubscribeAdminData: () => void;
  loadGithubConfig: () => Promise<void>;
  unsubscribeAll: () => void;
  logActivity: (action: string, details: string) => void;
}

// No default site info - all data must come from Firebase RTDB

const defaultGithubConfig: GithubConfig = {
  token: '',
  owner: '',
  repo: '',
  branch: 'main',
};

/**
 * RBAC FAIL-SAFE: sentinel permission set for users whose role has vanished
 * from /adminRoles (deleted while assigned). AdminLayout filters pages via
 * `adminPermissions.includes(page)`, so an EMPTY array would look identical to
 * the super-admin fallback (empty = full access) and grant EVERYTHING. This
 * sentinel matches no page key, so a role-less user sees nothing instead.
 */
const DENY_ALL = ['__deny_all__'];

// Full permission set assigned to the default super-admin role created
// during first-admin registration (must match AdminRoles ALL_PERMISSIONS).
const FIRST_ADMIN_PERMISSIONS = [
  'dashboard', 'notices', 'teachers', 'departments', 'students',
  'exams', 'results', 'blogs', 'gallery', 'admission',
  'donation', 'settings', 'messages', 'events', 'applications',
  'activity-log', 'hifz', 'exams-mcq',
  'attendance', 'library', 'calendar', 'fee', 'alumni',
  'prayer', 'hadith', 'sms', 'backup', 'expenses', 'salary',
  'financial-reports', 'vouchers', 'subscriptions', 'hostel',
  'dawah', 'materials', 'roles', 'qr-payment', 'report-builder',
];

// ============ Admin session marker (localStorage) ============
// AUTH + RTDB COMBO: every successful login persists a lightweight marker so
// the admin session can be restored on the next app mount. The marker is
// NEVER trusted alone — restoreAdminSession always re-validates against
// Firebase Auth and/or the RTDB profile before granting the session.

const ADMIN_SESSION_KEY = 'madrasa-admin-session';
const ADMIN_SESSION_TTL_MS = 7 * 24 * 3600 * 1000; // 7 days

function persistAdminSessionMarker(uid: string, username: string): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ uid, username, ts: Date.now() }));
  } catch {
    // localStorage unavailable (SSR / private mode) — session restore is best-effort
  }
}

function readAdminSessionMarker(): { uid: string; username: string; ts: number } | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { uid?: unknown; username?: unknown; ts?: unknown };
    if (!parsed || typeof parsed.uid !== 'string' || !parsed.uid) return null;
    return {
      uid: parsed.uid,
      username: typeof parsed.username === 'string' ? parsed.username : '',
      ts: typeof parsed.ts === 'number' ? parsed.ts : 0,
    };
  } catch {
    return null;
  }
}

function clearAdminSessionMarker(): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {
    // ignore
  }
}

let unsubscribers: (() => void)[] = [];

// ============ Admin-only data subscriptions ============
// SECURITY: /adminUsers (password hashes + emails), /activityLogs (full audit
// trail) and other admin-only collections must NEVER be subscribed at public
// app mount — every anonymous visitor would download them otherwise. They are
// attached exactly once while an admin session exists (successful login,
// first-admin registration, restored session, AdminLayout mount) and torn
// down in adminLogout / full unsubscribe.
let adminDataSubscribed = false;
let adminDataUnsubscribers: (() => void)[] = [];

// Path of the atomic first-admin registration claim (see registerAdmin).
const ADMIN_REGISTRATION_CLAIM_PATH = '/config/adminRegistrationClaim';
// A claim older than this is treated as a crashed attempt and may be re-claimed.
const REGISTRATION_CLAIM_STALE_MS = 10 * 60 * 1000;

export const useAppStore = create<AppState>((set, get) => ({
  // View
  currentView: 'public',
  publicPage: 'home' as PublicPage,
  adminPage: 'dashboard',
  setView: (view) => set({ currentView: view }),
  // Instant scroll on page swap (native-app behavior): the new page renders
  // immediately, so a smooth scroll would animate over the new content.
  // Popstate-driven back/forward navigation keeps the browser's own position.
  setPublicPage: (page) => { set({ publicPage: page }); window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }); },
  setAdminPage: (page) => set({ adminPage: page }),
  isAdminLoggedIn: false,

  // RBAC
  currentAdminUser: null as AdminUser | null,
  adminPermissions: [] as string[],

  // Language
  language: 'bn' as Language,
  setLanguage: (lang) => set({ language: lang }),

  isLoggingIn: false,
  pendingRecoveryKey: null,
  setPendingRecoveryKey: (key) => set({ pendingRecoveryKey: key }),

  adminLogin: async (username, password) => {
    set({ isLoggingIn: true });
    try {
      // CRITICAL: Sign in anonymously FIRST so all subsequent DB writes succeed
      await anonymousSignIn();
      const identifier = username.trim();
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

      // ============ Path A: Firebase Auth (email login) + RTDB profile ============
      // AUTH + RTDB COMBO: the identifier looks like an email → Firebase
      // Authentication is the password source of truth; the RTDB profile only
      // supplies the role/permissions.
      if (isEmail) {
        try {
          const cred = await signInWithEmailAndPassword(getAuthInstance(), identifier, password);
          // Resolve the RTDB admin profile: by auth uid first, then by email
          let profileId: string | null = null;
          let userData: any = await dbGet<any>(`/adminUsers/${cred.user.uid}`).catch(() => null);
          if (userData) {
            profileId = cred.user.uid;
          } else {
            const usersSnap = await dbGet<Record<string, any>>('/adminUsers');
            const match = usersSnap
              ? Object.entries(usersSnap).find(([, u]) => (u as any).email === identifier)
              : null;
            if (match) {
              profileId = match[0];
              userData = match[1];
            }
          }
          if (!userData || userData.isActive === false) {
            // No admin profile in RTDB (or deactivated) → not an admin account.
            // Revoke the Firebase Auth session so nothing privileged lingers.
            signOut(getAuthInstance()).catch(() => {});
            set({ isLoggingIn: false });
            return false;
          }
          const roleSnap = await dbGet<any>(`/adminRoles/${userData.roleId}`).catch(() => null);
          // RBAC: role deleted → deny everything (never fall back to full access)
          const permissions = roleSnap ? (roleSnap.permissions || []) : DENY_ALL;
          // Auth just proved the password — SKIP the RTDB hash check entirely and
          // refresh the stored hash to the PBKDF2 format in the same write that
          // updates lastLogin (null `password` strips any legacy plaintext field).
          const refreshHash = await hashPassword(password);
          const loginUpdate: Record<string, unknown> = { lastLogin: Date.now(), passwordHash: refreshHash, password: null };
          dbUpdate(`/adminUsers/${profileId || cred.user.uid}`, loginUpdate).catch(() => {});
          get().logActivity('লগইন', `${userData.name} সফলভাবে লগইন করেছেন`);
          persistAdminSessionMarker(profileId || cred.user.uid, userData.username || identifier);
          set({
            isAdminLoggedIn: true,
            currentView: 'admin',
            isLoggingIn: false,
            currentAdminUser: { ...userData, id: profileId } as AdminUser,
            adminPermissions: permissions,
          });
          // Attach admin-only data (/adminUsers, /activityLogs, …) for this session
          get().subscribeAdminData();
          return true;
        } catch (authErr) {
          // Email provider disabled / misconfigured (auth/operation-not-allowed
          // etc.) → fall through silently to the legacy RTDB verification so
          // existing accounts keep working before Email/Password is enabled.
          console.debug('Firebase Auth email login skipped, falling back to RTDB check:', authErr instanceof Error ? authErr.message : authErr);
        }
      }

      // ============ Path B: RTDB username / legacy login ============
      // 1) Check RBAC users at /adminUsers (username OR email match)
      if (identifier) {
        const usersSnap = await dbGet<Record<string, any>>('/adminUsers');
        if (usersSnap) {
          const matchedUser = Object.entries(usersSnap).find(([id, u]) =>
            u.username === identifier || (u.email && u.email === identifier)
          );
          if (matchedUser) {
            const [uid, userData] = matchedUser as [string, any];
            // Check if user is active
            if (userData.isActive === false) {
              set({ isLoggingIn: false });
              return false; // inactive user
            }
            // AUTH + RTDB COMBO: the profile is bound to a Firebase Auth email →
            // Auth owns the password. A wrong-credential error rejects the login;
            // provider-disabled/config/network errors fall through to the hash check.
            let authVerified = false;
            if (userData.email) {
              try {
                await signInWithEmailAndPassword(getAuthInstance(), userData.email, password);
                authVerified = true;
              } catch (authErr) {
                const code = (authErr as { code?: string })?.code || '';
                const WRONG_CREDENTIAL_CODES = [
                  'auth/invalid-credential',
                  'auth/wrong-password',
                  'auth/user-not-found',
                  'auth/invalid-email',
                  'auth/invalid-login-credentials',
                ];
                if (WRONG_CREDENTIAL_CODES.includes(code)) {
                  set({ isLoggingIn: false });
                  return false; // Firebase Auth is the source of truth for the password
                }
                // Provider disabled / config issue → verify against the RTDB hash below
                console.debug('Firebase Auth unavailable for profile login, using RTDB hash check:', code || authErr);
              }
            }
            // PASSWORD HARDENING: when Firebase Auth already verified the
            // password, SKIP the RTDB hash check entirely — the stored hash may
            // be stale; it is refreshed below from the just-proven password.
            let needsHashRefresh = false;
            if (!authVerified) {
              // Auth unavailable (no email binding or provider disabled) →
              // verify against the stored PBKDF2/legacy hash or legacy plaintext.
              const check = await verifyPassword(password, userData);
              if (!check.ok) {
                set({ isLoggingIn: false });
                return false;
              }
              needsHashRefresh = check.needsUpgrade || check.needsPlaintextStrip;
            }
            // Get user's role permissions
            const roleSnap = await dbGet<any>(`/adminRoles/${userData.roleId}`).catch(() => null);
            // RBAC: role deleted → deny everything (never fall back to full access)
            const permissions = roleSnap ? (roleSnap.permissions || []) : DENY_ALL;
            // Single write: lastLogin + a PBKDF2 hash refresh when the password was
            // Auth-proven or the stored hash/plaintext needed an upgrade (a null
            // `password` value strips any legacy plaintext field in RTDB).
            const refreshHash = authVerified || needsHashRefresh ? await hashPassword(password) : null;
            const loginUpdate: Record<string, unknown> = { lastLogin: Date.now() };
            if (refreshHash) {
              loginUpdate.passwordHash = refreshHash;
              loginUpdate.password = null;
            }
            dbUpdate(`/adminUsers/${uid}`, loginUpdate).catch(() => {});
            get().logActivity('লগইন', `${userData.name} সফলভাবে লগইন করেছেন`);
            persistAdminSessionMarker(uid, userData.username || identifier);
            set({
              isAdminLoggedIn: true,
              currentView: 'admin',
              isLoggingIn: false,
              currentAdminUser: { ...userData, id: uid } as AdminUser,
              adminPermissions: permissions,
            });
            // Attach admin-only data (/adminUsers, /activityLogs, …) for this session
            get().subscribeAdminData();
            return true;
          }
        }
      }

      // NOTE: The legacy "super-admin fallback password" path (/config/adminAuth)
      // was removed — RTDB security rules deny public reads on that node, so this
      // path could never succeed for a not-yet-logged-in visitor (dead code that
      // only produced PERMISSION_DENIED noise). Super-admin access now works
      // exclusively via first-admin registration or Firebase Auth login.

      set({ isLoggingIn: false });
      return false;
    } catch (err) {
      // Network error - do NOT allow offline login for security
      console.warn('Admin login failed:', err);
      set({ isLoggingIn: false });
      return false;
    }
  },

  checkAdminExists: async () => {
    try {
      // FIRST-ADMIN SPEC: the registration form opens whenever NO registered
      // admin profile (/adminUsers) exists yet. Legacy fallback credentials
      // (/config/adminAuth, /settings/adminAuth — carried over from the old
      // site's data) do NOT count as a registered admin: they stay valid as a
      // login fallback (Path C), but they must never suppress the one-time
      // first-admin registration form.
      //
      // CRITICAL (v2.3 bugfix): sign in anonymously BEFORE reading /adminUsers.
      // The RTDB rules allow the list read only for `auth != null` — without a
      // prior anonymous sign-in every fresh database got PERMISSION_DENIED here
      // and the old fail-safe reported "admin exists", so the registration page
      // NEVER opened (reported on madrasahbd.pages.dev).
      await anonymousSignIn().catch(() => {});
      const users = await dbGet<Record<string, unknown>>('/adminUsers');
      return !!users && Object.keys(users).length > 0;
    } catch (err) {
      // Classify the failure instead of a blanket "assume admin exists":
      //  - PERMISSION_DENIED after a successful anonymous sign-in → per the
      //    deployed rules the list read is allowed when /adminUsers does NOT
      //    exist, so denial implies profiles exist behind admin-only rules.
      //  - Auth/network failure → the atomic registration claim + write rules
      //    still prevent a second admin from being created, so defaulting to
      //    the registration form is safe and matches fresh-setup expectations.
      const code = (err as { code?: string })?.code || '';
      const msg = err instanceof Error ? err.message : String(err);
      if (code === 'PERMISSION_DENIED' || msg.includes('permission_denied') || msg.includes('Permission denied')) {
        console.warn('checkAdminExists: /adminUsers exists but is admin-protected → login mode');
        return true;
      }
      console.warn('checkAdminExists failed (auth/network) → registration mode:', err);
      return false;
    }
  },

  registerAdmin: async (name, username, email, password, recovery) => {
    set({ isLoggingIn: true });
    // Set once the atomic registration claim is committed — on any later failure
    // the claim node is deleted again so a next attempt can proceed.
    let claimTaken = false;
    try {
      await anonymousSignIn();

      // Re-check existence to avoid duplicate first-admin creation (fast path;
      // the atomic claim below is the real race guard)
      const alreadyExists = await get().checkAdminExists();
      if (alreadyExists) {
        set({ isLoggingIn: false });
        return { ok: false, error: 'already-exists' };
      }

      // ATOMIC FIRST-ADMIN CLAIM: the old check-then-act flow spanned 5 network
      // round-trips, so two simultaneous first registrations could both succeed.
      // runTransaction on /config/adminRegistrationClaim commits exactly once:
      // null → claim with the current timestamp; a FRESH claim (younger than
      // REGISTRATION_CLAIM_STALE_MS) → abort → this attempt reports
      // 'already-exists'. A STALE claim (previous attempt crashed mid-way) may
      // be re-claimed so a crashed bootstrap can never lock the system out.
      const claimResult = await runTransaction(
        fbRef(db, ADMIN_REGISTRATION_CLAIM_PATH),
        (cur: unknown) => {
          if (cur === null) return Date.now();
          if (typeof cur === 'number' && Date.now() - cur > REGISTRATION_CLAIM_STALE_MS) return Date.now();
          return undefined; // abort — a concurrent registration holds a fresh claim
        }
      );
      if (!claimResult.committed) {
        set({ isLoggingIn: false });
        return { ok: false, error: 'already-exists' };
      }
      claimTaken = true;

      const now = Date.now();

      // AUTH + RTDB COMBO: create a real Firebase Auth (Email/Password) account
      // when the provider is available; otherwise fall back to an RTDB-only
      // admin account (white-label safe — no hard dependency on Auth).
      let authUid: string | null = null;
      try {
        const cred = await createUserWithEmailAndPassword(getAuthInstance(), email.trim(), password);
        authUid = cred.user.uid;
      } catch (authErr) {
        if ((authErr as { code?: string })?.code === 'auth/email-already-in-use') {
          // SELF-HEAL: a previous attempt may have created the Firebase Auth
          // account but crashed BEFORE writing the RTDB profile, leaving this
          // person permanently stuck on 'email-in-use'. If the supplied
          // password signs in successfully AND no RTDB profile exists for that
          // uid, adopt the orphan Auth account and continue registration with
          // it. Any other outcome preserves the original error semantics:
          //  - sign-in fails (wrong password → someone else's account) → 'email-in-use'
          //  - a profile already exists for that uid → 'already-exists'
          try {
            const cred = await signInWithEmailAndPassword(getAuthInstance(), email.trim(), password);
            const orphanCheck = await dbGet<unknown>(`/adminUsers/${cred.user.uid}`).catch(() => null);
            if (orphanCheck) {
              // A profile is already bound to this Auth account — it is not orphaned.
              // Release the claim (rules deny this once profiles exist — harmless).
              dbSet(ADMIN_REGISTRATION_CLAIM_PATH, null).catch(() => {});
              set({ isLoggingIn: false });
              return { ok: false, error: 'already-exists' };
            }
            authUid = cred.user.uid;
            console.debug('registerAdmin: adopted orphan Auth account after successful password verification');
          } catch (signInErr) {
            // Release the claim so a corrected attempt is not blocked for 10 minutes
            dbSet(ADMIN_REGISTRATION_CLAIM_PATH, null).catch(() => {});
            console.debug('registerAdmin: email exists but password does not match — refusing:', (signInErr as { code?: string })?.code || signInErr);
            set({ isLoggingIn: false });
            return { ok: false, error: 'email-in-use' };
          }
        } else {
          console.debug('Firebase Auth unavailable, creating RTDB-only admin account:', (authErr as { code?: string })?.code || authErr);
        }
      }

      // 1) Ensure the default super-admin role exists (full permissions)
      const existingRole = await dbGet<{ permissions?: string[] }>('/adminRoles/default');
      if (!existingRole || !existingRole.permissions || existingRole.permissions.length === 0) {
        await dbSet('/adminRoles/default', {
          name: 'সুপার এডমিন',
          description: 'সকল অনুমতি সহ সুপার এডমিন রোল',
          permissions: FIRST_ADMIN_PERMISSIONS,
          createdAt: now,
        });
      }

      // 2) Create the first admin user (PBKDF2 password hash, never plaintext)
      const regHash = await hashPassword(password);

      // 2b) Password recovery setup (v2.3): security question + one-time recovery key.
      // Hashes are written with the profile itself (single write); the plaintext key is
      // surfaced exactly once via pendingRecoveryKey → RecoveryKeyDialog.
      const recoveryKey = generateRecoveryKey();
      const [answerHash, keyHash] = await Promise.all([
        hashPassword(normalizeAnswer(recovery.answer)),
        hashPassword(normalizeRecoveryKey(recoveryKey)),
      ]);

      const profile = {
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
        passwordHash: regHash,
        roleId: 'default',
        roleName: 'সুপার এডমিন',
        isActive: true,
        lastLogin: now,
        createdAt: now,
        // Recovery (v2.3)
        securityQuestion: recovery.question.trim(),
        securityAnswerHash: answerHash,
        recoveryKeyHash: keyHash,
        recoverySetupAt: now,
      };
      // Keyed by the Firebase Auth uid when available, else a pre-generated
      // push key — generated up-front so /adminUids can be claimed BEFORE the
      // profile write (the RTDB security-rules bootstrap chain requires the
      // adminUids entry to exist before admin-only writes are permitted).
      let rtdbUid: string | null = authUid;
      if (!rtdbUid) {
        rtdbUid = fbPushKey(fbRef(db, '/adminUsers')).key;
      }
      if (!rtdbUid) {
        throw new Error('registerAdmin: failed to generate an admin user key');
      }
      // Register the uid in /adminUids FIRST: RTDB security rules verify
      // admin-ness through this node without exposing the admin profiles.
      await dbSet(`/adminUids/${rtdbUid}`, true);
      await dbSet(`/adminUsers/${rtdbUid}`, profile);

      // 2c) Public recovery mirror (/adminRecovery/byUsername/<usernameLower>) so a
      // locked-out admin can verify themselves later. Requires the updated
      // database.rules.json; under older rules the write is denied → non-fatal.
      await saveRecoveryRecord(rtdbUid, username.trim(), {
        question: recovery.question.trim(),
        answerHash,
        keyHash,
      }).catch((err) => console.debug('recovery mirror write skipped:', err));

      // 3) Persist super-admin password fallback (hashed) so password-only login works
      try {
        await dbSet('/config/adminAuth', { passwordHash: regHash, password: null });
        await dbSet('/settings/adminAuth', { username: username.trim(), passwordHash: regHash, password: null });
      } catch (err) {
        console.warn('Failed to persist super admin password:', err);
      }

      get().logActivity('এডমিন রেজিস্ট্রেশন', `${name.trim()} প্রথম এডমিন হিসেবে রেজিস্ট্রেশন করেছেন`);

      // Resolve the created user so the session has the correct profile
      let uid: string | null = null;
      let userData: any = null;
      if (authUid) {
        userData = await dbGet<any>(`/adminUsers/${authUid}`).catch(() => null);
        if (userData) uid = authUid;
      }
      if (!userData) {
        // List read — denied by the security rules once the first profile exists
        // (e.g. RTDB-only fallback). Failure is non-fatal: the session falls back
        // to the pre-generated rtdbUid and the default super-admin permissions.
        const users = await dbGet<Record<string, any>>('/adminUsers').catch(() => null);
        const entry = users
          ? Object.entries(users).find(([, u]) => (u as any).username === username.trim())
          : null;
        if (entry) {
          uid = entry[0];
          userData = entry[1];
        }
      }
      if (!uid) uid = rtdbUid;

      persistAdminSessionMarker(uid || rtdbUid || 'super', username.trim());

      // Surface the one-time recovery key — RecoveryKeyDialog (mounted in
      // AdminLayout) shows it once and clears the pending value on close.
      set({ pendingRecoveryKey: recoveryKey });

      set({
        isAdminLoggedIn: true,
        currentView: 'admin' as AppView,
        isLoggingIn: false,
        currentAdminUser: uid && userData ? { ...(userData as any), id: uid } as AdminUser : null,
        // RBAC: start the session with a COPY of the default super-admin
        // permission set — an empty array would be treated by AdminLayout as the
        // super-admin bypass AND would never reflect later edits of the default
        // role. The role is re-resolved from /adminRoles on every login/restore.
        adminPermissions: [...FIRST_ADMIN_PERMISSIONS],
      });
      // Attach admin-only data (/adminUsers, /activityLogs, …) for this session
      get().subscribeAdminData();
      return { ok: true };
    } catch (err) {
      console.warn('Admin registration failed:', err);
      // Clean up the claim so a later attempt is not blocked forever. While no
      // admin profile exists yet the rules allow any authenticated user to
      // delete the claim; on success the claim is kept as a registration record.
      if (claimTaken) {
        dbSet(ADMIN_REGISTRATION_CLAIM_PATH, null).catch(() => {});
      }
      set({ isLoggingIn: false });
      return { ok: false, error: 'failed' };
    }
  },

  adminLogout: () => {
    get().logActivity('লগআউট', 'এডমিন লগআউট করেছেন');
    // SECURITY: tear the admin-only data subscriptions down BEFORE the auth
    // session ends so the listeners never outlive the admin session.
    get().unsubscribeAdminData();
    // AUTH + RTDB COMBO: end the Firebase Auth session too (no-op when Auth was
    // never used) and clear the local session marker. Anonymous sign-in is
    // re-established afterwards so RTDB writes (rules: auth != null) keep working.
    signOut(getAuthInstance())
      .catch(() => {})
      .finally(() => {
        anonymousSignIn().catch(() => {});
      });
    clearAdminSessionMarker();
    set({
      isAdminLoggedIn: false,
      currentView: 'public',
      publicPage: 'home',
      // UX hygiene: the next login should open on the dashboard, not on the
      // page the previous admin happened to be viewing.
      adminPage: 'dashboard',
      currentAdminUser: null,
      adminPermissions: [],
    });
    window.history.pushState({}, '', '/');
  },

  restoreAdminSession: async () => {
    if (typeof window === 'undefined') return;
    try {
      // SESSION TTL: the marker is read FIRST — the Auth-backed restore below
      // must honor the same 7-day TTL and uid binding that the legacy marker
      // path enforces. Auth cookies alone must never resurrect an admin session.
      const sessionMarker = readAdminSessionMarker();
      const markerFresh = !!sessionMarker && Date.now() - sessionMarker.ts < ADMIN_SESSION_TTL_MS;

      // AUTH + RTDB COMBO (1): wait briefly for Firebase Auth to restore its
      // persisted session (onAuthStateChanged always fires at least once; the
      // timeout guarantees this never hangs the app).
      const authUser = await new Promise<any>((resolve) => {
        let unsubscribe: () => void = () => {};
        const timeout = setTimeout(() => {
          unsubscribe();
          resolve(null);
        }, 2500);
        unsubscribe = onAuthStateChanged(getAuthInstance(), (user) => {
          clearTimeout(timeout);
          unsubscribe();
          resolve(user);
        });
      });

      let restored = false;

      if (authUser?.email) {
        // TTL + UID ENFORCEMENT for the Auth-backed restore: require a session
        // marker that exists, is inside the 7-day TTL and belongs to THIS auth
        // uid. Missing/expired/mismatched → revoke the Auth session, clear the
        // marker and do NOT restore.
        const markerMatchesAuth = !!sessionMarker && markerFresh && sessionMarker.uid === authUser.uid;
        if (!markerMatchesAuth) {
          signOut(getAuthInstance()).catch(() => {});
          clearAdminSessionMarker();
        }
        if (markerMatchesAuth) {
        // Resolve the RTDB admin profile: by auth uid first, then by email
        let profileId: string | null = null;
        let userData: any = await dbGet<any>(`/adminUsers/${authUser.uid}`).catch(() => null);
        if (userData) {
          profileId = authUser.uid;
        } else {
          const usersSnap = await dbGet<Record<string, any>>('/adminUsers').catch(() => null);
          const match = usersSnap
            ? Object.entries(usersSnap).find(([, u]) => (u as any).email === authUser.email)
            : null;
          if (match) {
            profileId = match[0];
            userData = match[1];
          }
        }
        if (userData && userData.isActive !== false) {
          const roleSnap = await dbGet<any>(`/adminRoles/${userData.roleId}`).catch(() => null);
          // RBAC: role deleted → deny everything (never fall back to full access)
          const permissions = roleSnap ? (roleSnap.permissions || []) : DENY_ALL;
          // NOTE: currentView is intentionally left untouched — restoration only
          // matters when the user is actually on /admin.
          persistAdminSessionMarker(profileId || authUser.uid, userData.username || authUser.email);
          set({
            isAdminLoggedIn: true,
            currentAdminUser: { ...userData, id: profileId } as AdminUser,
            adminPermissions: permissions,
          });
          restored = true;
        } else if (userData && userData.isActive === false) {
          // Deactivated admin — revoke the restored Firebase Auth session
          signOut(getAuthInstance()).catch(() => {});
        }
        }
      }

      // AUTH + RTDB COMBO (2): legacy localStorage marker (RTDB-only accounts +
      // super-admin fallback). The marker is NEVER trusted alone — always
      // re-validated against RTDB.
      if (!restored) {
        const marker = sessionMarker;
        if (marker && Date.now() - marker.ts < ADMIN_SESSION_TTL_MS) {
          if (marker.uid === 'super') {
            // Super-admin fallback: only restore while a fallback password still
            // exists in the database (hash or legacy plaintext).
            const [cfg, settings] = await Promise.all([
              dbGet<{ password?: string; passwordHash?: string }>('/config/adminAuth').catch(() => null),
              dbGet<{ password?: string; passwordHash?: string }>('/settings/adminAuth').catch(() => null),
            ]);
            const hasConfigPassword = !!(cfg && (cfg.passwordHash || cfg.password));
            const hasSettingsPassword = !!(settings && (settings.passwordHash || settings.password));
            if (hasConfigPassword || hasSettingsPassword) {
              set({
                isAdminLoggedIn: true,
                currentAdminUser: null,
                adminPermissions: [], // empty = full access (super admin)
              });
              persistAdminSessionMarker('super', marker.username);
              restored = true;
            }
          } else {
            const profile = await dbGet<any>(`/adminUsers/${marker.uid}`).catch(() => null);
            if (profile && profile.isActive !== false) {
              const roleSnap = await dbGet<any>(`/adminRoles/${profile.roleId}`).catch(() => null);
              // RBAC: role deleted → deny everything (never fall back to full access)
              const permissions = roleSnap ? (roleSnap.permissions || []) : DENY_ALL;
              persistAdminSessionMarker(marker.uid, profile.username || marker.username);
              set({
                isAdminLoggedIn: true,
                currentAdminUser: { ...profile, id: marker.uid } as AdminUser,
                adminPermissions: permissions,
              });
              restored = true;
            }
          }
        }
        // Marker exists but validation failed → it is stale, remove it
        if (!restored && marker) {
          clearAdminSessionMarker();
        }
      }

      // Attach admin-only data (/adminUsers, /activityLogs, …) exactly once for
      // this restored session.
      if (restored) {
        get().subscribeAdminData();
      }
    } catch (err) {
      // Restoration is best-effort — never break the app boot over it
      console.debug('Admin session restore skipped:', err);
    }
  },

  // Data
  siteInfo: null,
  notices: [],
  departments: [],
  teachers: [],
  students: [],
  exams: [],
  results: [],
  blogs: [],
  gallery: [],
  admission: [],
  donations: [],
  paymentMethods: [],
  classRoutine: [],
  syllabus: [],
  githubConfig: null,
  events: [],
  contactMessages: [],
  admissionApplications: [],
  activityLogs: [],
  hifzRecords: [],
  onlineExams: [],
  examSubmissions: [],
  libraryBooks: [],
  prayerConfig: null,
  calendarEvents: [],
  alumni: [],
  feeConfigs: [],
  feePayments: [],
  expenses: [],
  expenseCategories: [],
  salaryRecords: [],
  donationSubscriptions: [],
  vouchers: [],
  hostelRooms: [],
  hostelAllocations: [],
  hostelMeals: [],
  dawahPrograms: [],
  dawahJamats: [],
  studyMaterials: [],
  adminRoles: [],
  adminUsers: [],
  qrPaymentConfig: null,

  // Blog detail
  selectedBlogId: null,
  setSelectedBlogId: (id) => set({ selectedBlogId: id }),

  dataLoaded: false,
  loading: false,

  // Firebase connection status
  firebaseConnected: false,
  firebaseError: null as string | null,
  retryConnection: () => {
    get().unsubscribeAll();
    get().loadAllData();
  },

  // Log activity
  logActivity: (action, details) => {
    dbPush('/activityLogs', {
      action,
      details,
      timestamp: Date.now(),
    }).catch((e) => console.warn('Activity log failed:', e));
  },

  // Fetch the GitHub repo config on demand (admin upload features +
  // admission photo upload). Cached after the first successful fetch.
  loadGithubConfig: async () => {
    if (get().githubConfig) return;
    try {
      const val = await dbGet<GithubConfig>('/config/githubConfig');
      set({ githubConfig: val ?? defaultGithubConfig });
    } catch (e) {
      console.warn('GitHub config load failed:', e);
    }
  },

  loadAllData: () => {
    set({ loading: true, firebaseConnected: false, firebaseError: null });
    unsubscribers.forEach(fn => fn());
    unsubscribers = [];

    // Ensure anonymous auth is ready for any write operations
    anonymousSignIn().catch((err) => console.warn('Anonymous sign-in failed:', err));

    // Track subscription readiness — mark loaded when all have fired at least once
    // ⚠️ KEEP IN SYNC: TOTAL_SUBS MUST equal the exact number of sub() calls in
    // this function (currently 29). Admin-only collections (/adminUsers,
    // /activityLogs, /adminRoles, /contactMessages, /admissionApplications,
    // /examSubmissions, /expenses, /expenseCategories, /salaryRecords,
    // /donationSubscriptions, /vouchers, /hostelAllocations) are NOT subscribed
    // here — they live in subscribeAdminData() and only attach while an admin
    // session exists. If you add/remove a sub() call below, bump this constant
    // too — otherwise dataLoaded would only ever be set by the 3s safety timer
    // and every first paint would stall for 3 seconds.
    let readyCount = 0;
    let loaded = false;
    const TOTAL_SUBS = 29;
    let errorCount = 0;
    let successCount = 0;
    const markReady = () => {
      readyCount++;
      if (!loaded && readyCount >= TOTAL_SUBS) {
        loaded = true;
        clearTimeout(safetyTimer);
        set({ loading: false, dataLoaded: true });
      }
    };
    // Safety: force load complete after 3s even if some subscriptions don't fire
    const safetyTimer = setTimeout(() => {
      if (!loaded) {
        loaded = true;
        set({ loading: false, dataLoaded: true });
      }
    }, 3000);

    // Helper to wrap subscription callbacks with markReady + connection tracking
    const sub = (path: string, cb: (snap: any) => void) => {
      unsubscribers.push(
        dbSubscribe(
          path,
          (snap: any) => {
            cb(snap);
            markReady();
            successCount++;
            if (successCount === 1) set({ firebaseConnected: true, firebaseError: null });
          },
          (err: Error) => {
            markReady();
            errorCount++;
            // Firebase rejected this subscription (permission/network/config issue)
            if (successCount === 0 && errorCount >= 3) {
              set({ firebaseConnected: false, firebaseError: err.message });
            } else if (errorCount === 1) {
              set({ firebaseError: err.message });
            }
          }
        )
      );
    };

    // Site Info
    sub('/config/siteInfo', (snap) => {
      set({ siteInfo: snap.exists() ? snap.val() : null });
    });

    // GitHub config is NOT subscribed globally — it contains a repo write
    // token that must not be shipped to every anonymous visitor. It is loaded
    // on demand via loadGithubConfig() only by the admin upload features and
    // the admission photo upload.

    // Notices
    sub('/notices', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        })) as Notice[];
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        set({ notices: list });
      } else {
        set({ notices: [] });
      }
    });

    // Departments
    sub('/departments', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        })) as Department[];
        list.sort((a, b) => (a.order || 0) - (b.order || 0));
        set({ departments: list });
      } else {
        set({ departments: [] });
      }
    });

    // Teachers
    sub('/teachers', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        })) as Teacher[];
        list.sort((a, b) => (a.order || 0) - (b.order || 0));
        set({ teachers: list });
      } else {
        set({ teachers: [] });
      }
    });

    // Students
    sub('/students', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        })) as Student[];
        set({ students: list });
      } else {
        set({ students: [] });
      }
    });

    // Exams
    sub('/exams', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        })) as Exam[];
        set({ exams: list });
      } else {
        set({ exams: [] });
      }
    });

    // Results
    sub('/results', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        })) as ExamResult[];
        set({ results: list });
      } else {
        set({ results: [] });
      }
    });

    // Blogs
    sub('/blogs', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        })) as BlogPost[];
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        set({ blogs: list });
      } else {
        set({ blogs: [] });
      }
    });

    // Gallery
    sub('/gallery', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        })) as GalleryItem[];
        set({ gallery: list });
      } else {
        set({ gallery: [] });
      }
    });

    // Admission
    sub('/admission', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        })) as AdmissionInfo[];
        set({ admission: list });
      } else {
        set({ admission: [] });
      }
    });

    // Donations
    sub('/donations', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        })) as DonationFund[];
        set({ donations: list });
      } else {
        set({ donations: [] });
      }
    });

    // Payment Methods
    sub('/config/paymentMethods', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const arr = Array.isArray(data) ? data : Object.values(data);
        set({ paymentMethods: arr });
      } else {
        set({ paymentMethods: [] });
      }
    });

    // Class Routine
    sub('/config/classRoutine', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const arr = Array.isArray(data) ? data : Object.values(data);
        set({ classRoutine: arr });
      } else {
        set({ classRoutine: [] });
      }
    });

    // Syllabus
    sub('/config/syllabus', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const arr = Array.isArray(data) ? data : Object.values(data);
        set({ syllabus: arr });
      } else {
        set({ syllabus: [] });
      }
    });

    // Events
    sub('/events', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        })) as Event[];
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        set({ events: list });
      } else {
        set({ events: [] });
      }
    });

    // SECURITY: /contactMessages, /admissionApplications and /examSubmissions
    // are visitor SUBMISSION data (create-only under the RTDB rules) — they are
    // subscribed by subscribeAdminData() for admin sessions only.

    // Hifz Records
    sub('/hifzRecords', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        })) as HifzRecord[];
        set({ hifzRecords: list });
      } else {
        set({ hifzRecords: [] });
      }
    });

    // Online Exams
    sub('/onlineExams', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        })) as OnlineExam[];
        set({ onlineExams: list });
      } else {
        set({ onlineExams: [] });
      }
    });

    // Exam Submissions are visitor submission data (create-only under the RTDB
    // rules) — subscribed by subscribeAdminData() for admin sessions only.

    // Library Books
    sub('/libraryBooks', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        })) as LibraryBook[];
        set({ libraryBooks: list });
      } else {
        set({ libraryBooks: [] });
      }
    });

    // Prayer Config
    sub('/config/prayerConfig', (snap) => {
      set({ prayerConfig: snap.exists() ? snap.val() : null });
    });

    // Calendar Events
    sub('/calendarEvents', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        })) as CalendarEvent[];
        set({ calendarEvents: list });
      } else {
        set({ calendarEvents: [] });
      }
    });

    // Alumni
    sub('/alumni', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        })) as Alumni[];
        set({ alumni: list });
      } else {
        set({ alumni: [] });
      }
    });

    // Fee Configs
    sub('/feeConfigs', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        })) as FeeConfig[];
        set({ feeConfigs: list });
      } else {
        set({ feeConfigs: [] });
      }
    });

    // Fee Payments
    sub('/feePayments', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        })) as FeePayment[];
        set({ feePayments: list });
      } else {
        set({ feePayments: [] });
      }
    });

    // SECURITY: /expenses, /expenseCategories, /salaryRecords,
    // /donationSubscriptions, /vouchers and /hostelAllocations have no public
    // reader (financial/operational data) — they are admin-only under the RTDB
    // rules and therefore subscribed by subscribeAdminData() only.

    // Hostel Rooms
    sub('/hostelRooms', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        set({ hostelRooms: Object.entries(data).map(([id, item]: [string, any]) => ({ ...item, id })) as HostelRoom[] });
      } else { set({ hostelRooms: [] }); }
    });

    // Hostel Meals
    sub('/hostelMeals', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        set({ hostelMeals: Object.entries(data).map(([id, item]: [string, any]) => ({ ...item, id })) as HostelMeal[] });
      } else { set({ hostelMeals: [] }); }
    });

    // Dawah Programs
    sub('/dawahPrograms', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data).map(([id, item]: [string, any]) => ({ ...item, id })) as DawahProgram[];
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        set({ dawahPrograms: list });
      } else { set({ dawahPrograms: [] }); }
    });

    // Dawah Jamats
    sub('/dawahJamats', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data).map(([id, item]: [string, any]) => ({ ...item, id })) as DawahJamat[];
        set({ dawahJamats: list });
      } else { set({ dawahJamats: [] }); }
    });

    // Study Materials
    sub('/studyMaterials', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data).map(([id, item]: [string, any]) => ({ ...item, id })) as StudyMaterial[];
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        set({ studyMaterials: list });
      } else { set({ studyMaterials: [] }); }
    });

    // SECURITY: /adminRoles and /adminUsers (password hashes + emails) are
    // admin-only — subscribed by subscribeAdminData(), never at public mount.

    // QR Payment Config
    sub('/config/qrPaymentConfig', (snap) => {
      set({ qrPaymentConfig: snap.exists() ? snap.val() : null });
    });
  },

  // ============ Admin-only data subscriptions ============
  // Attached exactly once while an admin session exists (successful login,
  // first-admin registration, restored session, AdminLayout mount). Guarded by
  // the module-level adminDataSubscribed flag — repeated calls are no-ops.
  subscribeAdminData: () => {
    if (adminDataSubscribed) return;
    adminDataSubscribed = true;
    const adminSub = (path: string, cb: (snap: any) => void) => {
      adminDataUnsubscribers.push(dbSubscribe(path, cb));
    };

    // Activity Logs (last 100)
    adminSub('/activityLogs', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        })) as ActivityLog[];
        list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        set({ activityLogs: list.slice(0, 100) });
      } else {
        set({ activityLogs: [] });
      }
    });

    // Contact Messages
    adminSub('/contactMessages', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        })) as ContactMessage[];
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        set({ contactMessages: list });
      } else {
        set({ contactMessages: [] });
      }
    });

    // Admission Applications
    adminSub('/admissionApplications', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        })) as AdmissionApplication[];
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        set({ admissionApplications: list });
      } else {
        set({ admissionApplications: [] });
      }
    });

    // Exam Submissions
    adminSub('/examSubmissions', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        })) as ExamSubmission[];
        set({ examSubmissions: list });
      } else {
        set({ examSubmissions: [] });
      }
    });

    // Admin Roles
    adminSub('/adminRoles', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        set({ adminRoles: Object.entries(data).map(([id, item]: [string, any]) => ({ ...item, id })) as AdminRole[] });
      } else { set({ adminRoles: [] }); }
    });

    // Admin Users
    adminSub('/adminUsers', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        set({ adminUsers: Object.entries(data).map(([id, item]: [string, any]) => ({ ...item, id })) as AdminUser[] });
      } else { set({ adminUsers: [] }); }
    });

    // Financial / operations data with no public reader
    adminSub('/expenses', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data).map(([id, item]: [string, any]) => ({ ...item, id })) as Expense[];
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        set({ expenses: list });
      } else { set({ expenses: [] }); }
    });

    adminSub('/expenseCategories', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        set({ expenseCategories: Object.entries(data).map(([id, item]: [string, any]) => ({ ...item, id })) as ExpenseCategory[] });
      } else { set({ expenseCategories: [] }); }
    });

    adminSub('/salaryRecords', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data).map(([id, item]: [string, any]) => ({ ...item, id })) as SalaryRecord[];
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        set({ salaryRecords: list });
      } else { set({ salaryRecords: [] }); }
    });

    adminSub('/donationSubscriptions', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data).map(([id, item]: [string, any]) => ({ ...item, id })) as DonationSubscription[];
        set({ donationSubscriptions: list });
      } else { set({ donationSubscriptions: [] }); }
    });

    adminSub('/vouchers', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data).map(([id, item]: [string, any]) => ({ ...item, id })) as Voucher[];
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        set({ vouchers: list });
      } else { set({ vouchers: [] }); }
    });

    adminSub('/hostelAllocations', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data).map(([id, item]: [string, any]) => ({ ...item, id })) as HostelAllocation[];
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        set({ hostelAllocations: list });
      } else { set({ hostelAllocations: [] }); }
    });
  },

  unsubscribeAdminData: () => {
    adminDataUnsubscribers.forEach(fn => fn());
    adminDataUnsubscribers = [];
    adminDataSubscribed = false;
  },

  unsubscribeAll: () => {
    unsubscribers.forEach(fn => fn());
    unsubscribers = [];
    // Full teardown also drops the admin-only subscriptions (and resets their
    // one-shot guard) so a later admin mount re-subscribes them cleanly.
    get().unsubscribeAdminData();
  },
}));
