import { create } from 'zustand';
import { dbGet, dbSet, dbPush, dbSubscribe, dbUpdate } from '@/lib/db-service';
import { anonymousSignIn } from '@/lib/firebase';
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
  PaymentRecord,
  HifzRecord,
  OnlineExam,
  ExamSubmission,
  LibraryBook,
  PrayerConfig,
  CalendarEvent,
  Alumni,
  BohudurConfig,
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
  payments: PaymentRecord[];
  bohudurApiKey: string;
  bohudurConfig: BohudurConfig | null;
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

let unsubscribers: (() => void)[] = [];

export const useAppStore = create<AppState>((set, get) => ({
  // View
  currentView: 'public',
  publicPage: 'home' as PublicPage,
  adminPage: 'dashboard',
  setView: (view) => set({ currentView: view }),
  setPublicPage: (page) => { set({ publicPage: page }); window.scrollTo({ top: 0, behavior: 'smooth' }); },
  setAdminPage: (page) => set({ adminPage: page }),
  isAdminLoggedIn: false,

  // RBAC
  currentAdminUser: null as AdminUser | null,
  adminPermissions: [] as string[],

  // Language
  language: 'bn' as Language,
  setLanguage: (lang) => set({ language: lang }),

  isLoggingIn: false,

  adminLogin: async (username, password) => {
    set({ isLoggingIn: true });
    try {
      // CRITICAL: Sign in anonymously FIRST so all subsequent DB writes succeed
      await anonymousSignIn();

      // 1) Check RBAC users at /adminUsers first (only if username is provided)
      if (username.trim()) {
        const usersSnap = await dbGet<Record<string, any>>('/adminUsers');
        if (usersSnap) {
          const matchedUser = Object.entries(usersSnap).find(([id, u]) =>
            u.username === username.trim() && u.password === password
          );
          if (matchedUser) {
            const [uid, userData] = matchedUser;
            // Check if user is active
            if (userData.isActive === false) {
              set({ isLoggingIn: false });
              return false; // inactive user
            }
            // Get user's role permissions
            const roleSnap = await dbGet<any>(`/adminRoles/${userData.roleId}`);
            const permissions = roleSnap?.permissions || [];
            // Update last login
            dbUpdate(`/adminUsers/${uid}`, { lastLogin: Date.now() }).catch(() => {});
            get().logActivity('লগইন', `${userData.name} সফলভাবে লগইন করেছেন`);
            set({
              isAdminLoggedIn: true,
              currentView: 'admin',
              isLoggingIn: false,
              currentAdminUser: { ...userData, id: uid } as AdminUser,
              adminPermissions: permissions,
            });
            return true;
          }
        }
      }

      // 2) Fall back to super admin password at /config/adminAuth
      let stored = await dbGet<{ password: string }>('/config/adminAuth');
      if (!stored || !stored.password) {
        stored = await dbGet<{ password: string }>('/settings/adminAuth');
      }
      let passwordValid = false;
      if (stored && stored.password) {
        passwordValid = (stored.password === password);
      }
      // SECURITY: No hardcoded password fallback. If no password is set in DB,
      // admin must configure one via Firebase Console or seed data.
      if (passwordValid) {
        // Ensure password is persisted in DB
        if (!stored || !stored.password) {
          try {
            await dbSet('/config/adminAuth', { password });
          } catch (err1) {
            try {
              await dbSet('/settings/adminAuth', { password });
            } catch (err2) {
              console.warn('Failed to persist admin password:', err2);
            }
          }
        }
        get().logActivity('লগইন', 'সুপার এডমিন সফলভাবে লগইন করেছেন');
        set({
          isAdminLoggedIn: true,
          currentView: 'admin',
          isLoggingIn: false,
          currentAdminUser: null,
          adminPermissions: [], // empty = full access (super admin)
        });
        return true;
      }

      set({ isLoggingIn: false });
      return false;
    } catch (err) {
      // Network error - do NOT allow offline login for security
      console.warn('Admin login failed:', err);
      set({ isLoggingIn: false });
      return false;
    }
  },

  adminLogout: () => {
    get().logActivity('লগআউট', 'এডমিন লগআউট করেছেন');
    set({
      isAdminLoggedIn: false,
      currentView: 'public',
      publicPage: 'home',
      currentAdminUser: null,
      adminPermissions: [],
    });
    window.history.pushState({}, '', '/');
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
  payments: [],
  bohudurApiKey: '',
  bohudurConfig: null,
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

  loadAllData: () => {
    set({ loading: true, firebaseConnected: false, firebaseError: null });
    unsubscribers.forEach(fn => fn());
    unsubscribers = [];

    // Ensure anonymous auth is ready for any write operations
    anonymousSignIn().catch((err) => console.warn('Anonymous sign-in failed:', err));

    // Track subscription readiness — mark loaded when all have fired at least once
    let readyCount = 0;
    let loaded = false;
    const TOTAL_SUBS = 45;
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

    // Github Config
    sub('/config/githubConfig', (snap) => {
      set({ githubConfig: snap.exists() ? snap.val() : defaultGithubConfig });
    });

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

    // Contact Messages
    sub('/contactMessages', (snap) => {
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
    sub('/admissionApplications', (snap) => {
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

    // Activity Logs (last 100)
    sub('/activityLogs', (snap) => {
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

    // Payments
    sub('/payments', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        })) as PaymentRecord[];
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        set({ payments: list });
      } else {
        set({ payments: [] });
      }
    });

    // Bohudur API Key
    sub('/config/bohudurApiKey', (snap) => {
      set({ bohudurApiKey: snap.exists() ? snap.val() : '' });
    });

    // Bohudur Config
    sub('/config/bohudurConfig', (snap) => {
      set({ bohudurConfig: snap.exists() ? snap.val() : null });
    });

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

    // Exam Submissions
    sub('/examSubmissions', (snap) => {
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

    // Expenses
    sub('/expenses', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data).map(([id, item]: [string, any]) => ({ ...item, id })) as Expense[];
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        set({ expenses: list });
      } else { set({ expenses: [] }); }
    });

    // Expense Categories
    sub('/expenseCategories', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        set({ expenseCategories: Object.entries(data).map(([id, item]: [string, any]) => ({ ...item, id })) as ExpenseCategory[] });
      } else { set({ expenseCategories: [] }); }
    });

    // Salary Records
    sub('/salaryRecords', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data).map(([id, item]: [string, any]) => ({ ...item, id })) as SalaryRecord[];
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        set({ salaryRecords: list });
      } else { set({ salaryRecords: [] }); }
    });

    // Donation Subscriptions
    sub('/donationSubscriptions', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data).map(([id, item]: [string, any]) => ({ ...item, id })) as DonationSubscription[];
        set({ donationSubscriptions: list });
      } else { set({ donationSubscriptions: [] }); }
    });

    // Vouchers
    sub('/vouchers', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data).map(([id, item]: [string, any]) => ({ ...item, id })) as Voucher[];
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        set({ vouchers: list });
      } else { set({ vouchers: [] }); }
    });

    // Hostel Rooms
    sub('/hostelRooms', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        set({ hostelRooms: Object.entries(data).map(([id, item]: [string, any]) => ({ ...item, id })) as HostelRoom[] });
      } else { set({ hostelRooms: [] }); }
    });

    // Hostel Allocations
    sub('/hostelAllocations', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data).map(([id, item]: [string, any]) => ({ ...item, id })) as HostelAllocation[];
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        set({ hostelAllocations: list });
      } else { set({ hostelAllocations: [] }); }
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

    // Admin Roles
    sub('/adminRoles', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        set({ adminRoles: Object.entries(data).map(([id, item]: [string, any]) => ({ ...item, id })) as AdminRole[] });
      } else { set({ adminRoles: [] }); }
    });

    // Admin Users
    sub('/adminUsers', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        set({ adminUsers: Object.entries(data).map(([id, item]: [string, any]) => ({ ...item, id })) as AdminUser[] });
      } else { set({ adminUsers: [] }); }
    });

    // QR Payment Config
    sub('/config/qrPaymentConfig', (snap) => {
      set({ qrPaymentConfig: snap.exists() ? snap.val() : null });
    });
  },

  unsubscribeAll: () => {
    unsubscribers.forEach(fn => fn());
    unsubscribers = [];
  },
}));
