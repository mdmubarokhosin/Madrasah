import { useAppStore } from '@/store/app-store';
import type { PublicPage, AppView } from '@/types/database';

/**
 * Centralized navigation utility.
 * Updates both the Zustand store AND the browser URL in one call.
 *
 * Usage:
 *   navigateTo('public', 'about')
 *   navigateTo('admin')
 *   navigateTo('student')
 */

export function navigateTo(view: AppView, page?: PublicPage) {
  const store = useAppStore.getState();

  if (view === 'admin') {
    store.setView('admin');
    window.history.pushState({}, '', '/admin');
  } else if (view === 'student') {
    store.setView('student');
    window.history.pushState({}, '', '/student');
  } else {
    // CRITICAL: Must also switch currentView to 'public' so that
    // _client-page.tsx renders the public layout (Header/Footer) instead
    // of staying in admin/student/student-portal view.
    store.setView('public');
    const targetPage = page || 'home';
    store.setPublicPage(targetPage);
    // Use pageToUrlMap to ensure correct kebab-case URLs (e.g. classRoutine → /class-routine)
    const url = pageToUrlMap[targetPage] || '/';
    window.history.pushState({}, '', url);
  }

  // CRITICAL FIX: Dispatch a popstate event so that _client-page.tsx's
  // popstate handler updates currentPath state and re-evaluates routing.
  // Without this, payment/success, payment/cancel, student pages etc.
  // keep rendering even after navigateTo('public') is called because
  // currentPath state doesn't update when pushState is called programmatically.
  window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
}

/**
 * Page → URL mapping for building links.
 */
export const pageToUrlMap: Record<PublicPage, string> = {
  home: '/',
  about: '/about',
  departments: '/departments',
  teachers: '/teachers',
  admission: '/admission',
  notices: '/notices',
  events: '/events',
  gallery: '/gallery',
  donation: '/donation',
  blog: '/blog',
  contact: '/contact',
  results: '/results',
  syllabus: '/syllabus',
  classRoutine: '/class-routine',
  hifz: '/hifz',
  exam: '/exam',
  calendar: '/calendar',
  alumni: '/alumni',
  prayer: '/prayer',
  hadith: '/hadith',
  quran: '/quran',
  feePayment: '/fee-payment',
  admissionTrack: '/admission-track',
  library: '/library',
  attendance: '/attendance',
  hostel: '/hostel',
  dawah: '/dawah',
  materials: '/materials',
};
