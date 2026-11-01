// Static 404 page — emitted as 404.html in the static export.
// Server component only: no client hooks, no Firebase/store imports, so the
// file renders identically at build time (SEO-safe, dependency-light).
// SPA deep links with unknown URLs are still handled client-side by
// ./[[...slug]]/_client-page.tsx; this page covers framework-level 404s.

import type { Metadata } from 'next';

// Guarantees a real <title> and a noindex robots meta on the static 404.html
// (otherwise the shell's default title leaks onto every framework 404).
export const metadata: Metadata = {
  title: '404 | পৃষ্ঠা খুঁজে পাওয়া যায়নি',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="flex flex-col items-center text-center py-20">
        {/* Large gradient 404 — green/gold palette */}
        <p
          aria-hidden="true"
          className="select-none bg-gradient-to-r from-islamic via-golden-light to-golden bg-clip-text text-7xl md:text-9xl font-black leading-none text-transparent"
        >
          404
        </p>
        <h1 className="mt-6 text-2xl md:text-3xl font-bold text-islamic-dark">
          পৃষ্ঠা খুঁজে পাওয়া যায়নি
        </h1>
        <p className="mt-3 max-w-md text-sm md:text-base leading-relaxed text-muted-foreground">
          আপনি যে পৃষ্ঠাটি খুঁজছেন তা নেই বা সরিয়ে ফেলা হয়েছে।
        </p>
        <a
          href="/"
          className="btn-gold mt-8 inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-bold"
        >
          হোমপেজে ফিরুন
        </a>
        <p className="mt-6 text-xs text-muted-foreground/70">Page not found</p>
      </div>
    </div>
  );
}
