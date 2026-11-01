// Server component wrapper for catch-all SPA route
// generateStaticParams runs at build time to pre-render HTML for all routes
// The actual client-side SPA logic lives in ./_client-page.tsx

import ClientPage from './_client-page';

// dynamicParams=false: only the slugs enumerated in generateStaticParams() are
// prerendered; the host's `/* /index.html 200` rewrite in public/_redirects
// serves every deep link. Unknown paths fall through to the styled app-root
// not-found.tsx (framework 404). NOTE: Next.js requires page segment config
// exports to be literal values — expressions like `process.env.NODE_ENV !==
// 'production'` fail the production build with "Unsupported node type
// BinaryExpression", so this must stay a plain boolean.
export const dynamicParams = false;

// Pre-render all SPA routes as static HTML files during build.
// The root route maps to `{ slug: [] }` — the Next 16-documented form for the
// `[[...slug]]` root segment; `{ slug: undefined }` is rejected by export
// validation and makes every request after the first 404 fail with HTTP 500.
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

  return routes.map((slug) => ({ slug: slug ? slug.split('/') : [] }));
}

export default function CatchAllPage() {
  return <ClientPage />;
}
