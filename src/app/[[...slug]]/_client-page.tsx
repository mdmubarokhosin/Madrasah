'use client';

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { MotionConfig } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import { I18nProvider } from '@/lib/i18n-context';
import { t as translate } from '@/lib/i18n';
import { initAnalytics } from '@/lib/firebase';
import type { PublicPage } from '@/types/database';

// Public components
import Header from '@/components/madrasa/Header';
import { BottomNav, FabCall } from '@/components/madrasa/AppShell';
import Hero from '@/components/madrasa/Hero';
import About from '@/components/madrasa/About';
import Departments from '@/components/madrasa/Departments';
import Teachers from '@/components/madrasa/Teachers';
import Admission from '@/components/madrasa/Admission';
import NoticeBoard from '@/components/madrasa/NoticeBoard';
import Results from '@/components/madrasa/Results';
import Gallery from '@/components/madrasa/Gallery';
import Donation from '@/components/madrasa/Donation';
import Blog from '@/components/madrasa/Blog';
import BlogDetail from '@/components/madrasa/BlogDetail';
import Contact from '@/components/madrasa/Contact';
import Events from '@/components/madrasa/Events';
import OnlineAdmission from '@/components/madrasa/OnlineAdmission';
import Footer from '@/components/madrasa/Footer';

// Page components
import PageBanner from '@/components/pages/PageBanner';
import AboutPage from '@/components/pages/AboutPage';
import DepartmentsPage from '@/components/pages/DepartmentsPage';
import TeachersPage from '@/components/pages/TeachersPage';
import AdmissionPage from '@/components/pages/AdmissionPage';
import NoticesPage from '@/components/pages/NoticesPage';
import EventsPage from '@/components/pages/EventsPage';
import GalleryPage from '@/components/pages/GalleryPage';
import DonationPage from '@/components/pages/DonationPage';
import BlogPage from '@/components/pages/BlogPage';
import ContactPage from '@/components/pages/ContactPage';
import ResultsPage from '@/components/pages/ResultsPage';
import ClassRoutinePage from '@/components/pages/ClassRoutinePage';
import SyllabusPage from '@/components/pages/SyllabusPage';
import HifzPage from '@/components/pages/HifzPage';
import OnlineExamPage from '@/components/pages/OnlineExamPage';
import CalendarPage from '@/components/pages/CalendarPage';
import AlumniPage from '@/components/pages/AlumniPage';
import PrayerTimePage from '@/components/pages/PrayerTimePage';
import HadithPage from '@/components/pages/HadithPage';
import QuranPage from '@/components/pages/QuranPage';
import FeePaymentPage from '@/components/pages/FeePaymentPage';
import AdmissionTrackPage from '@/components/pages/AdmissionTrackPage';
import LibraryPage from '@/components/pages/LibraryPage';
import AttendancePage from '@/components/pages/AttendancePage';
import HostelPage from '@/components/pages/HostelPage';
import DawahPage from '@/components/pages/DawahPage';
import MaterialsPage from '@/components/pages/MaterialsPage';
import NotFoundPage from '@/components/pages/NotFoundPage';

// Admin shell + login — eager (instant admin URL render, zero loading screen)
import AdminLogin from '@/components/admin/AdminLogin';
import AdminLayout from '@/components/admin/AdminLayout';

// Admin page contents — LAZY (code-split): the public website never downloads
// admin code (superfast initial load + smaller hot-recompile memory, prevents
// dev OOM). Chunks are tiny and cached; they appear instantly on open.
// loading: () => null → NO spinner/progress, content just appears.
const mkAdmin = (loader: () => Promise<{ default: React.ComponentType<any> }>) =>
  dynamic(loader, { loading: () => null });

const AdminDashboard = mkAdmin(() => import('@/components/admin/AdminDashboard'));
const AdminNotices = mkAdmin(() => import('@/components/admin/AdminNotices'));
const AdminTeachers = mkAdmin(() => import('@/components/admin/AdminTeachers'));
const AdminDepartments = mkAdmin(() => import('@/components/admin/AdminDepartments'));
const AdminStudents = mkAdmin(() => import('@/components/admin/AdminStudents'));
const AdminExams = mkAdmin(() => import('@/components/admin/AdminExams'));
const AdminResults = mkAdmin(() => import('@/components/admin/AdminResults'));
const AdminBlogs = mkAdmin(() => import('@/components/admin/AdminBlogs'));
const AdminGallery = mkAdmin(() => import('@/components/admin/AdminGallery'));
const AdminAdmission = mkAdmin(() => import('@/components/admin/AdminAdmission'));
const AdminDonation = mkAdmin(() => import('@/components/admin/AdminDonation'));
const AdminSettings = mkAdmin(() => import('@/components/admin/AdminSettings'));
const AdminMessages = mkAdmin(() => import('@/components/admin/AdminMessages'));
const AdminEvents = mkAdmin(() => import('@/components/admin/AdminEvents'));
const AdminApplications = mkAdmin(() => import('@/components/admin/AdminApplications'));
const AdminActivityLog = mkAdmin(() => import('@/components/admin/AdminActivityLog'));
const AdminHifz = mkAdmin(() => import('@/components/admin/AdminHifz'));
const AdminMCQExams = mkAdmin(() => import('@/components/admin/AdminMCQExams'));
const AdminAttendance = mkAdmin(() => import('@/components/admin/AdminAttendance'));
const AdminLibrary = mkAdmin(() => import('@/components/admin/AdminLibrary'));
const AdminCalendar = mkAdmin(() => import('@/components/admin/AdminCalendar'));
const AdminFee = mkAdmin(() => import('@/components/admin/AdminFee'));
const AdminAlumni = mkAdmin(() => import('@/components/admin/AdminAlumni'));
const AdminPrayer = mkAdmin(() => import('@/components/admin/AdminPrayer'));
const AdminHadith = mkAdmin(() => import('@/components/admin/AdminHadith'));
const AdminSMS = mkAdmin(() => import('@/components/admin/AdminSMS'));
const AdminBackup = mkAdmin(() => import('@/components/admin/AdminBackup'));
const AdminExpenses = mkAdmin(() => import('@/components/admin/AdminExpenses'));
const AdminSalary = mkAdmin(() => import('@/components/admin/AdminSalary'));
const AdminFinancialReports = mkAdmin(() => import('@/components/admin/AdminFinancialReports'));
const AdminVouchers = mkAdmin(() => import('@/components/admin/AdminVouchers'));
const AdminSubscriptions = mkAdmin(() => import('@/components/admin/AdminSubscriptions'));
const AdminHostel = mkAdmin(() => import('@/components/admin/AdminHostel'));
const AdminDawah = mkAdmin(() => import('@/components/admin/AdminDawah'));
const AdminMaterials = mkAdmin(() => import('@/components/admin/AdminMaterials'));
const AdminRoles = mkAdmin(() => import('@/components/admin/AdminRoles'));
const AdminQRPayment = mkAdmin(() => import('@/components/admin/AdminQRPayment'));
const AdminReportBuilder = mkAdmin(() => import('@/components/admin/AdminReportBuilder'));

// Student portal — lazy (rare route, heavy deps)
const StudentPortal = mkAdmin(() => import('@/components/student/StudentPortal'));
import DataLoadErrorPage from '@/components/pages/DataLoadErrorPage';

// Admin page content map
function AdminPageContent() {
  const { adminPage } = useAppStore();
  switch (adminPage) {
    case 'dashboard': return <AdminDashboard />;
    case 'notices': return <AdminNotices />;
    case 'teachers': return <AdminTeachers />;
    case 'departments': return <AdminDepartments />;
    case 'students': return <AdminStudents />;
    case 'exams': return <AdminExams />;
    case 'results': return <AdminResults />;
    case 'blogs': return <AdminBlogs />;
    case 'gallery': return <AdminGallery />;
    case 'admission': return <AdminAdmission />;
    case 'donation': return <AdminDonation />;
    case 'settings': return <AdminSettings />;
    case 'messages': return <AdminMessages />;
    case 'events': return <AdminEvents />;
    case 'applications': return <AdminApplications />;
    case 'activity-log': return <AdminActivityLog />;
    case 'hifz': return <AdminHifz />;
    case 'exams-mcq': return <AdminMCQExams />;
    case 'attendance': return <AdminAttendance />;
    case 'library': return <AdminLibrary />;
    case 'calendar': return <AdminCalendar />;
    case 'fee': return <AdminFee />;
    case 'alumni': return <AdminAlumni />;
    case 'prayer': return <AdminPrayer />;
    case 'hadith': return <AdminHadith />;
    case 'sms': return <AdminSMS />;
    case 'backup': return <AdminBackup />;
    case 'expenses': return <AdminExpenses />;
    case 'salary': return <AdminSalary />;
    case 'financial-reports': return <AdminFinancialReports />;
    case 'vouchers': return <AdminVouchers />;
    case 'subscriptions': return <AdminSubscriptions />;
    case 'hostel': return <AdminHostel />;
    case 'dawah': return <AdminDawah />;
    case 'materials': return <AdminMaterials />;
    case 'roles': return <AdminRoles />;
    case 'qr-payment': return <AdminQRPayment />;
    case 'report-builder': return <AdminReportBuilder />;
    default: return <AdminDashboard />;
  }
}

// Page banner config
const pageBannerConfig: Record<string, { titleKey: string; arabicText: string; subtitleKey?: string }> = {
  about: { titleKey: 'about.title', arabicText: 'عن المدرسة', subtitleKey: 'about.subtitle' },
  departments: { titleKey: 'departments.title', arabicText: 'الأقسام', subtitleKey: 'departments.subtitle' },
  teachers: { titleKey: 'teachers.title', arabicText: 'المعلمون', subtitleKey: 'teachers.subtitle' },
  admission: { titleKey: 'onlineAdmission.title', arabicText: 'القبول', subtitleKey: 'onlineAdmission.subtitle' },
  notices: { titleKey: 'notices.title', arabicText: 'لوحة الإعلانات', subtitleKey: 'notices.subtitle' },
  events: { titleKey: 'events.title', arabicText: 'الفعاليات', subtitleKey: 'events.subtitle' },
  gallery: { titleKey: 'gallery.title', arabicText: 'معرض الصور', subtitleKey: 'gallery.subtitle' },
  donation: { titleKey: 'donation.title', arabicText: 'التبرعات', subtitleKey: 'donation.subtitle' },
  blog: { titleKey: 'blog.title', arabicText: 'المقالات', subtitleKey: 'blog.subtitle' },
  contact: { titleKey: 'contact.title', arabicText: 'اتصل بنا', subtitleKey: 'contact.subtitle' },
  results: { titleKey: 'results.title', arabicText: 'النتائج', subtitleKey: 'results.subtitle' },
  classRoutine: { titleKey: 'classRoutine.title', arabicText: 'جدول الحصص', subtitleKey: 'classRoutine.subtitle' },
  syllabus: { titleKey: 'syllabus.title', arabicText: 'المنهج الدراسي', subtitleKey: 'syllabus.subtitle' },
  hifz: { titleKey: 'hifz.title', arabicText: 'حفظ القرآن', subtitleKey: 'hifz.subtitle' },
  exam: { titleKey: 'exam.title', arabicText: 'الاختبار', subtitleKey: 'exam.subtitle' },
  calendar: { titleKey: 'calendar.title', arabicText: 'التقويم', subtitleKey: 'calendar.subtitle' },
  alumni: { titleKey: 'alumni.title', arabicText: 'الخريجون', subtitleKey: 'alumni.subtitle' },
  prayer: { titleKey: 'prayer.title', arabicText: 'أوقات الصلاة', subtitleKey: 'prayer.subtitle' },
  hadith: { titleKey: 'hadith.title', arabicText: 'الحديث', subtitleKey: 'hadith.subtitle' },
  quran: { titleKey: 'quran.title', arabicText: 'القرآن الكريم', subtitleKey: 'quran.subtitle' },
  feePayment: { titleKey: 'fee.title', arabicText: 'الرسوم', subtitleKey: 'fee.subtitle' },
  admissionTrack: { titleKey: 'tracking.title', arabicText: 'تتبع القبول', subtitleKey: 'tracking.subtitle' },
  library: { titleKey: 'library.title', arabicText: 'المكتبة', subtitleKey: 'library.subtitle' },
  attendance: { titleKey: 'attendance.title', arabicText: 'الحضور', subtitleKey: 'attendance.subtitle' },
  hostel: { titleKey: 'hostel.title', arabicText: 'المسكن', subtitleKey: 'hostel.subtitle' },
  dawah: { titleKey: 'dawah.title', arabicText: 'الدعوة والتبليغ', subtitleKey: 'dawah.subtitle' },
  materials: { titleKey: 'materials.title', arabicText: 'الدراسة', subtitleKey: 'materials.subtitle' },
};

// Pages that manage their own banner/heading internally
const PAGES_WITH_OWN_BANNER: string[] = [
  'donation', 'syllabus', 'blog', 'classRoutine',
  'hifz', 'exam', 'hadith', 'quran',
  'feePayment', 'admissionTrack', 'library',
  'attendance', 'calendar', 'alumni', 'prayer',
  'hostel', 'dawah', 'materials',
];

// Page content component
function PageContent({ page }: { page: PublicPage }) {
  const banner = pageBannerConfig[page];
  const hasOwnBanner = PAGES_WITH_OWN_BANNER.includes(page);

  if (page === 'home') {
    return (
      <>
        <Hero />
        <About />
        <Departments />
        <Teachers />
        <Admission />
        <OnlineAdmission />
        <NoticeBoard />
        <Results />
        <Events />
        <Gallery />
        <Donation />
        <Blog />
        <Contact />
      </>
    );
  }

  // Sub-pages with banner (only for pages that don't manage their own)
  return (
    <>
      {!hasOwnBanner && banner && (
        <PageBanner
          titleKey={banner.titleKey}
          arabicText={banner.arabicText}
          subtitleKey={banner.subtitleKey}
        />
      )}
      {page === 'about' && <AboutPage />}
      {page === 'departments' && <DepartmentsPage />}
      {page === 'teachers' && <TeachersPage />}
      {page === 'admission' && <AdmissionPage />}
      {page === 'notices' && <NoticesPage />}
      {page === 'events' && <EventsPage />}
      {page === 'gallery' && <GalleryPage />}
      {page === 'donation' && <DonationPage />}
      {page === 'blog' && <BlogPage />}
      {page === 'contact' && <ContactPage />}
      {page === 'results' && <ResultsPage />}
      {page === 'classRoutine' && <ClassRoutinePage />}
      {page === 'syllabus' && <SyllabusPage />}
      {page === 'hifz' && <HifzPage />}
      {page === 'exam' && <OnlineExamPage />}
      {page === 'calendar' && <CalendarPage />}
      {page === 'alumni' && <AlumniPage />}
      {page === 'prayer' && <PrayerTimePage />}
      {page === 'hadith' && <HadithPage />}
      {page === 'quran' && <QuranPage />}
      {page === 'feePayment' && <FeePaymentPage />}
      {page === 'admissionTrack' && <AdmissionTrackPage />}
      {page === 'library' && <LibraryPage />}
      {page === 'attendance' && <AttendancePage />}
      {page === 'hostel' && <HostelPage />}
      {page === 'dawah' && <DawahPage />}
      {page === 'materials' && <MaterialsPage />}
    </>
  );
}

// Map URL paths to PublicPage keys
const pathToPageMap: Record<string, PublicPage> = {
  '/about': 'about',
  '/departments': 'departments',
  '/teachers': 'teachers',
  '/admission': 'admission',
  '/notices': 'notices',
  '/events': 'events',
  '/gallery': 'gallery',
  '/donation': 'donation',
  '/blog': 'blog',
  '/contact': 'contact',
  '/results': 'results',
  '/syllabus': 'syllabus',
  '/class-routine': 'classRoutine',
  '/hifz': 'hifz',
  '/exam': 'exam',
  '/calendar': 'calendar',
  '/alumni': 'alumni',
  '/prayer': 'prayer',
  '/hadith': 'hadith',
  '/quran': 'quran',
  '/fee-payment': 'feePayment',
  '/admission-track': 'admissionTrack',
  '/library': 'library',
  '/attendance': 'attendance',
  '/hostel': 'hostel',
  '/dawah': 'dawah',
  '/materials': 'materials',
  '/admin': 'home', // admin is handled by currentView
  '/student': 'home', // student is handled by currentView
};

// URL aliases: redirect common wrong URLs to correct pages (DRY - single source)
const urlAliases: Record<string, string> = {
  '/online-admission': '/admission',
  '/notice-board': '/notices',
  '/student-portal': '/student',
  '/articles': '/blog',
  '/article': '/blog',
  '/students': '/student',
  '/teachers-list': '/teachers',
  '/teacher': '/teachers',
  '/notice': '/notices',
  '/event': '/events',
  '/photo': '/gallery',
  '/photos': '/gallery',
  // Legacy camelCase URLs (older links/bookmarks) → canonical kebab-case pages
  '/classRoutine': '/class-routine',
  '/feePayment': '/fee-payment',
  '/admissionTrack': '/admission-track',
  '/donate': '/donation',
  '/contact-us': '/contact',
  '/result': '/results',
  '/exam-results': '/results',
  '/routine': '/class-routine',
  '/pay': '/donation',
};

function Home() {
  const { currentView, isAdminLoggedIn, publicPage, selectedBlogId, loadAllData, dataLoaded, siteInfo, setPublicPage, setView } = useAppStore();
  // Language for inline (non-provider) states
  const lang = useAppStore((s) => s.language);

  // Detect current pathname for SPA routing
  const [currentPath, setCurrentPath] = useState('');
  const [notFoundPath, setNotFoundPath] = useState('');
  useEffect(() => {
    const path = window.location.pathname.replace(/\/$/, '');
    // Initial pathname sync deferred to a microtask — avoids calling setState
    // synchronously inside the effect (cascading renders) while applying the
    // same value before the next paint. It cannot be derived during render
    // because window.location is unavailable in the prerender/hydration pass.
    queueMicrotask(() => setCurrentPath(path));

    // SPA routing: sync URL path to Zustand publicPage
    if (path === '/admin') {
      setView('admin');
    } else if (path === '/student') {
      setView('student');
    } else if (pathToPageMap[path]) {
      const page = pathToPageMap[path];
      if (page !== publicPage) {
        setPublicPage(page);
      }
    } else if (path !== '/' && path !== '') {
      // Blog deep link: /blog/<id> opens the article overlay directly
      const blogMatch = path.match(/^\/blog\/(.+)$/);
      if (blogMatch) {
        const blogId = decodeURIComponent(blogMatch[1]);
        queueMicrotask(() => {
          setView('public');
          useAppStore.getState().setSelectedBlogId(blogId);
          setNotFoundPath('');
        });
        return;
      }
      // URL aliases: SPA redirect without full page reload
      const redirect = urlAliases[path];
      if (redirect) {
        window.history.replaceState({}, '', redirect);
        window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
        return;
      }
      // Unknown path — show 404 (deferred together with the pathname sync above)
      queueMicrotask(() => {
        setView('public');
        setNotFoundPath(path);
      });
    }
  }, []);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace(/\/$/, '');
      const state = useAppStore.getState();
      setCurrentPath(path);

      if (path === '/admin') {
        state.setView('admin');
        setNotFoundPath('');
      } else if (path === '/student') {
        state.setView('student');
        setNotFoundPath('');
      } else if (pathToPageMap[path]) {
        const page = pathToPageMap[path];
        if (page !== state.publicPage) {
          state.setPublicPage(pathToPageMap[path]);
        }
        // Leaving a /blog/<id> URL closes the article overlay
        if (state.selectedBlogId && path !== '/blog') {
          state.setSelectedBlogId(null);
        }
        setNotFoundPath('');
      } else if (path !== '/' && path !== '') {
        // Blog deep link: /blog/<id> opens the article overlay directly
        const blogMatch = path.match(/^\/blog\/(.+)$/);
        if (blogMatch) {
          state.setView('public');
          state.setSelectedBlogId(decodeURIComponent(blogMatch[1]));
          setNotFoundPath('');
          return;
        }
        // URL aliases: SPA redirect without full page reload
        const redirect = urlAliases[path];
        if (redirect) {
          window.history.replaceState({}, '', redirect);
          window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
          return;
        }
        // Unknown path — show 404
        state.setView('public');
        setNotFoundPath(path);
      } else {
        // Home ('/' or ''): leave any hidden portal (/admin, /student) view —
        // Back must land on the public site, not keep the panel rendered at '/'
        if (state.currentView !== 'public') state.setView('public');
        setNotFoundPath('');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    useAppStore.getState().loadAllData();
    useAppStore.getState().restoreAdminSession();
    // Firebase Analytics (browser-only, safe no-op when unsupported)
    initAnalytics();
    return () => { useAppStore.getState().unsubscribeAll(); };
  }, []);

  // Dynamic document title & meta — follows the selected language and Firebase site name.
  // No institution info is hardcoded anywhere; everything comes from the database.
  // notFoundPath is part of the closure so unknown URLs get a soft-404:
  // noindex, nofollow (the SPA view returns HTTP 200, which would otherwise be
  // a SEO soft-404); normal pages explicitly re-allow 'index, follow'.
  // selectedBlogId is a dep so closing the blog overlay via browser-back
  // (selectedBlogId → null) re-runs this effect and restores the normal/list
  // title; while a post is open, BlogDetail owns document.title.
  // currentView is a dep so entering/leaving the hidden portals (/admin,
  // /student) re-runs it and flips robots to noindex, nofollow.
  useEffect(() => {
    if (selectedBlogId) return;
    const setMeta = (id: string, attr: 'name' | 'property', key: string, value: string) => {
      let el = document.getElementById(id);
      if (!el) {
        el = document.createElement('meta');
        el.id = id;
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', value);
    };
    // Canonical follows the current SPA route (hreflang-safe absolute URL)
    const setCanonical = () => {
      let cEl = document.getElementById('meta-canonical') as HTMLLinkElement | null;
      if (!cEl) {
        cEl = document.createElement('link');
        cEl.id = 'meta-canonical';
        cEl.rel = 'canonical';
        document.head.appendChild(cEl);
      }
      cEl.href = new URL(window.location.pathname, window.location.origin).href;
    };
    // Static app-name fallback (existing i18n key, the same one Header/Footer/
    // Hero use) keeps per-page titles working while siteInfo is loading/null.
    const name =
      (lang === 'en'
        ? siteInfo?.nameEn || siteInfo?.name
        : lang === 'ar'
          ? siteInfo?.nameAr || siteInfo?.name
          : siteInfo?.name) || translate('common.appName', lang);
    const description =
      lang === 'en'
        ? siteInfo?.aboutTextEn || siteInfo?.aboutText || siteInfo?.sloganEn || siteInfo?.slogan
        : lang === 'ar'
          ? siteInfo?.aboutTextAr || siteInfo?.aboutText || siteInfo?.sloganAr || siteInfo?.slogan
          : siteInfo?.aboutText || siteInfo?.slogan;

    // Hidden portals (/admin, /student) must never be crawlable — even if
    // someone shares the URL. Checked before the 'index, follow' default
    // below; independent of siteInfo (name falls back to the static app name).
    if (currentView !== 'public') {
      document.title =
        currentView === 'admin'
          ? name
            ? `Admin | ${name}`
            : 'Admin'
          : name
            ? `Student Portal | ${name}`
            : 'Student Portal';
      setMeta('meta-robots', 'name', 'robots', 'noindex, nofollow');
      return;
    }

    // Unknown URL — 404 view: keep crawlers out (SEO soft-404 fix)
    if (notFoundPath) {
      document.title = name ? `404 | ${name}` : '404';
      setMeta('meta-robots', 'name', 'robots', 'noindex, nofollow');
      // Canonical still points at the current URL — harmless under noindex.
      setCanonical();
      return;
    }

    // Normal pages: explicitly allow indexing (re-allows it when navigating
    // back from a 404 view within the same SPA session)
    setMeta('meta-robots', 'name', 'robots', 'index, follow');
    if (name) {
      // Per-page title: "<Page> | <Site>" for inner pages, site name on home —
      // gives every SPA route a distinct, localized document.title.
      const banner = publicPage !== 'home' ? pageBannerConfig[publicPage] : undefined;
      const pageTitle = banner ? translate(banner.titleKey, lang) : '';
      document.title = pageTitle ? `${pageTitle} | ${name}` : name;
      setMeta('meta-description', 'name', 'description', description || '');
      setMeta('og-title', 'property', 'og:title', name);
      setMeta('og-description', 'property', 'og:description', description || '');
      setMeta('twitter-title', 'name', 'twitter:title', name);
      setMeta('twitter-description', 'name', 'twitter:description', description || '');
      setCanonical();
    }
  }, [lang, siteInfo, publicPage, notFoundPath, selectedBlogId, currentView]);

  // NOTE: No full-page loading/flash screen — the site renders instantly
  // and data appears seamlessly when it arrives from Firebase.

  // Server data unavailable — no site info from Firebase (connection error or not set up).
  // Admin & student views stay reachable so the site can still be configured / results checked.
  if (
    dataLoaded &&
    !siteInfo &&
    (currentView === 'public')
  ) {
    return (
      <I18nProvider>
        <DataLoadErrorPage />
      </I18nProvider>
    );
  }

  // Admin Login
  if (currentView === 'admin' && !isAdminLoggedIn) {
    return (
      <I18nProvider>
        <AdminLogin />
      </I18nProvider>
    );
  }

  // Admin Panel
  if (currentView === 'admin' && isAdminLoggedIn) {
    return (
      <I18nProvider>
        <AdminLayout>
          <AdminPageContent />
        </AdminLayout>
      </I18nProvider>
    );
  }

  // Student Portal
  if (currentView === 'student') {
    return (
      <I18nProvider>
        <StudentPortal />
      </I18nProvider>
    );
  }

  // Blog Detail View (overlay)
  if (selectedBlogId && currentView === 'public') {
    return (
      <I18nProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <BlogDetail />
          </main>
          <Footer />
          <BottomNav />
          <FabCall />
        </div>
      </I18nProvider>
    );
  }

  // 404 - Unknown page
  if (notFoundPath && currentView === 'public') {
    return (
      <I18nProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <NotFoundPage path={notFoundPath} />
          </main>
          <Footer />
          <BottomNav />
          <FabCall />
        </div>
      </I18nProvider>
    );
  }

  // Public Website with page-based navigation
  return (
    <I18nProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <PageContent page={publicPage} />
        </main>
        <Footer />
        {/* Native-app chrome: bottom navigation + call FAB (mobile only) */}
        <BottomNav />
        <FabCall />
      </div>
    </I18nProvider>
  );
}

// Wrap in Suspense boundary — plain background, no spinner/loading screen.
// MotionConfig honors prefers-reduced-motion for every framer-motion animation.
export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <MotionConfig reducedMotion="user">
        <Home />
      </MotionConfig>
    </Suspense>
  );
}
