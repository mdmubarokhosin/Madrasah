'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { I18nProvider } from '@/lib/i18n-context';
import type { PublicPage } from '@/types/database';

// Public components
import Header from '@/components/madrasa/Header';
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

// Admin components
import AdminLogin from '@/components/admin/AdminLogin';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminNotices from '@/components/admin/AdminNotices';
import AdminTeachers from '@/components/admin/AdminTeachers';
import AdminDepartments from '@/components/admin/AdminDepartments';
import AdminStudents from '@/components/admin/AdminStudents';
import AdminExams from '@/components/admin/AdminExams';
import AdminResults from '@/components/admin/AdminResults';
import AdminBlogs from '@/components/admin/AdminBlogs';
import AdminGallery from '@/components/admin/AdminGallery';
import AdminAdmission from '@/components/admin/AdminAdmission';
import AdminDonation from '@/components/admin/AdminDonation';
import AdminSettings from '@/components/admin/AdminSettings';
import AdminMessages from '@/components/admin/AdminMessages';
import AdminEvents from '@/components/admin/AdminEvents';
import AdminApplications from '@/components/admin/AdminApplications';
import AdminActivityLog from '@/components/admin/AdminActivityLog';
import AdminHifz from '@/components/admin/AdminHifz';
import AdminMCQExams from '@/components/admin/AdminMCQExams';
import AdminAttendance from '@/components/admin/AdminAttendance';
import AdminLibrary from '@/components/admin/AdminLibrary';
import AdminCalendar from '@/components/admin/AdminCalendar';
import AdminFee from '@/components/admin/AdminFee';
import AdminAlumni from '@/components/admin/AdminAlumni';
import AdminPrayer from '@/components/admin/AdminPrayer';
import AdminHadith from '@/components/admin/AdminHadith';
import AdminSMS from '@/components/admin/AdminSMS';
import AdminBackup from '@/components/admin/AdminBackup';
import AdminPaymentHistory from '@/components/admin/AdminPaymentHistory';
import AdminExpenses from '@/components/admin/AdminExpenses';
import AdminSalary from '@/components/admin/AdminSalary';
import AdminFinancialReports from '@/components/admin/AdminFinancialReports';
import AdminVouchers from '@/components/admin/AdminVouchers';
import AdminSubscriptions from '@/components/admin/AdminSubscriptions';
import AdminHostel from '@/components/admin/AdminHostel';
import AdminDawah from '@/components/admin/AdminDawah';
import AdminMaterials from '@/components/admin/AdminMaterials';
import AdminRoles from '@/components/admin/AdminRoles';
import AdminQRPayment from '@/components/admin/AdminQRPayment';
import AdminReportBuilder from '@/components/admin/AdminReportBuilder';

// Student component
import StudentPortal from '@/components/student/StudentPortal';
import PaymentCallback from '@/components/madrasa/PaymentCallback';
import PaymentSuccessPage from '@/components/madrasa/PaymentSuccessPage';
import PaymentCancelPage from '@/components/madrasa/PaymentCancelPage';
import IslamicLoader from '@/components/madrasa/IslamicLoader';
import DataLoadErrorPage from '@/components/pages/DataLoadErrorPage';
import { t as translate } from '@/lib/i18n';

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
    case 'payment-history': return <AdminPaymentHistory />;
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
  '/donate': '/donation',
  '/contact-us': '/contact',
  '/result': '/results',
  '/exam-results': '/results',
  '/routine': '/class-routine',
  '/pay': '/donation',
};

function Home() {
  const searchParams = useSearchParams();
  const paymentkey = searchParams.get('paymentkey');
  const paymentStatus = searchParams.get('status');
  const { currentView, isAdminLoggedIn, publicPage, selectedBlogId, loadAllData, loading, dataLoaded, siteInfo, setPublicPage, setView } = useAppStore();
  // Language for inline (non-provider) loading states
  const lang = useAppStore((s) => s.language);

  // Detect current pathname for payment success/cancel pages & SPA routing
  const [currentPath, setCurrentPath] = useState('');
  const [notFoundPath, setNotFoundPath] = useState('');
  useEffect(() => {
    const path = window.location.pathname.replace(/\/$/, '');
    setCurrentPath(path);

    // SPA routing: sync URL path to Zustand publicPage
    if (path === '/admin') {
      setView('admin');
      setNotFoundPath('');
    } else if (path === '/student') {
      setView('student');
      setNotFoundPath('');
    } else if (pathToPageMap[path]) {
      const page = pathToPageMap[path];
      if (page !== publicPage) {
        setPublicPage(page);
      }
      setNotFoundPath('');
    } else if (path !== '/' && path !== '') {
      // URL aliases: SPA redirect without full page reload
      const redirect = urlAliases[path];
      if (redirect) {
        window.history.replaceState({}, '', redirect);
        window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
        return;
      }
      // Unknown path — show 404
      setView('public');
      setNotFoundPath(path);
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
        setNotFoundPath('');
      } else if (path !== '/' && path !== '') {
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
        setNotFoundPath('');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    useAppStore.getState().loadAllData();
    return () => { useAppStore.getState().unsubscribeAll(); };
  }, []);

  // Dynamic document title — follows the selected language and Firebase site name
  useEffect(() => {
    const name =
      lang === 'en'
        ? siteInfo?.nameEn || siteInfo?.name
        : lang === 'ar'
          ? siteInfo?.nameAr || siteInfo?.name
          : siteInfo?.name;
    if (name) document.title = name;
  }, [lang, siteInfo]);

  if (loading) {
    return (
      <I18nProvider>
        <IslamicLoader />
      </I18nProvider>
    );
  }

  // Server data unavailable — no site info from Firebase (connection error or not set up).
  // Admin & student views stay reachable so the site can still be configured / results checked.
  if (
    dataLoaded &&
    !siteInfo &&
    (currentView === 'public') &&
    currentPath !== '/payment/success' &&
    currentPath !== '/payment/cancel'
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
        </div>
      </I18nProvider>
    );
  }

  // Payment Callback - if URL has paymentkey, show payment result page
  if (paymentkey && currentView === 'public') {
    return (
      <I18nProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <PaymentCallback paymentkey={paymentkey} urlStatus={paymentStatus} />
          </main>
          <Footer />
        </div>
      </I18nProvider>
    );
  }

  // Payment Success Page - dedicated route
  if (currentPath === '/payment/success') {
    return (
      <I18nProvider>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-emerald-600 text-sm">{translate('loading', lang)}</p>
            </div>
          </div>
        }>
          <PaymentSuccessPage />
        </Suspense>
      </I18nProvider>
    );
  }

  // Payment Cancel Page - dedicated route
  if (currentPath === '/payment/cancel') {
    return (
      <I18nProvider>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-orange-600 text-sm">{translate('loading', lang)}</p>
            </div>
          </div>
        }>
          <PaymentCancelPage />
        </Suspense>
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
      </div>
    </I18nProvider>
  );
}

// Wrap in Suspense boundary for useSearchParams
export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-islamic border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-islamic-dark text-sm">{translate('loading', 'bn')}</p>
        </div>
      </div>
    }>
      <Home />
    </Suspense>
  );
}
