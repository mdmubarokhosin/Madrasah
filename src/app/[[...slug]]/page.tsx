// Server component wrapper for catch-all SPA route
// generateStaticParams runs at build time to pre-render HTML for all routes
// The actual client-side SPA logic lives in ./_client-page.tsx

import ClientPage from './_client-page';

// Pre-render all SPA routes as static HTML files during build
export function generateStaticParams() {
  const routes = [
    '',
    'about',
    'admin',
    'departments',
    'admission',
    'teachers',
    'notices',
    'events',
    'gallery',
    'donation',
    'blog',
    'contact',
    'results',
    'syllabus',
    'class-routine',
    'hifz',
    'exam',
    'calendar',
    'alumni',
    'prayer',
    'hadith',
    'quran',
    'fee-payment',
    'admission-track',
    'library',
    'attendance',
    'hostel',
    'dawah',
    'materials',
    'student',
    'payment/success',
    'payment/cancel',
    // URL aliases - redirect to correct pages (handled client-side)
    'student-portal',
    'articles',
    'article',
    'students',
    'teachers-list',
    'teacher',
    'notice',
    'event',
    'photo',
    'photos',
    'donate',
    'contact-us',
    'result',
    'exam-results',
    'routine',
    'pay',
  ];

  return routes.map((slug) => ({ slug: slug ? slug.split('/') : undefined }));
}

export default function CatchAllPage() {
  return <ClientPage />;
}
