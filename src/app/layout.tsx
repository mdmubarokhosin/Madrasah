import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

// Fonts are self-hosted (public/fonts + @font-face in globals.css):
// zero build-time network dependency, same-origin immutable caching,
// font-display: swap — text paints instantly (superfast, no flash).

const SITE_URL = 'https://madrasahbd.pages.dev';
const SITE_DESCRIPTION =
  'কুরআন ও সুন্নাহর আলোকে পরিচালিত কওমি মাদরাসা — গুণগত ইসলামি ও সাধারণ শিক্ষা, ভর্তি তথ্য, পরীক্ষার ফলাফল, ক্লাস রুটিন এবং দান-অনুদানের সুযোগ।';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Static SEO defaults so crawlers (which never run the client-side updater)
  // always see real content; _client-page.tsx still overrides title/meta
  // description per page at runtime from the database (admin panel).
  title: {
    default: 'মাদরাসা — কওমি মাদরাসা ম্যানেজমেন্ট সিস্টেম',
    template: '%s | মাদরাসা',
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/logo.png',
  },
  // robots: intentionally omitted — the SPA manages the robots meta per-view
  // ('meta-robots' in _client-page.tsx / BlogDetail.tsx); default is index,follow.
  openGraph: {
    url: '/',
    siteName: 'মাদরাসা',
    images: [
      {
        url: '/videos/stills/hero.png',
        width: 1200,
        height: 630,
        alt: 'মাদরাসা — ইসলামি ও সাধারণ শিক্ষা প্রতিষ্ঠানের প্রধান ছবি',
      },
    ],
  },
  twitter: {
    images: ['/videos/stills/hero.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        {/* Preload the primary Bengali subset — superfast first paint */}
        <link rel="preload" href="/fonts/noto-serif-bengali-bengali.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <meta name="theme-color" content="#134e4a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="মাদরাসা" />
        <meta property="og:title" id="og-title" content="মাদরাসা" />
        <meta property="og:description" id="og-description" content={SITE_DESCRIPTION} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" id="twitter-title" content="মাদরাসা" />
        <meta name="twitter:description" id="twitter-description" content={SITE_DESCRIPTION} />
        <meta name="description" id="meta-description" content={SITE_DESCRIPTION} />
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var lang = localStorage.getItem("preferred-language") || "bn";
            if (lang !== "bn" && lang !== "en" && lang !== "ar") lang = "bn";
            document.documentElement.lang = lang;
            document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
            // Light/dark theme before first paint — no flash of wrong theme
            try {
              if (localStorage.getItem("madrasa-theme") === "dark") {
                document.documentElement.classList.add("dark");
              }
            } catch (e) {}
          })();
        ` }} />
        {/* Static structured data for search engines (literal only — never
            contains dynamic data, so dangerouslySetInnerHTML is safe here) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': ['EducationalOrganization'],
              name: 'মাদরাসা',
              url: 'https://madrasahbd.pages.dev/',
              logo: 'https://madrasahbd.pages.dev/logo.png',
            }),
          }}
        />
      </head>
      <body className="antialiased bg-background text-foreground">
          {children}
          <Toaster />
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              // Register only on https or non-localhost hosts. A dev-mode SW
              // intercepts dev-server responses and its offline fallback masks
              // real errors (the fake site-wide outage during audits).
              var host = window.location.hostname;
              if (window.location.protocol === 'https:' || (host !== 'localhost' && host !== '127.0.0.1')) {
                navigator.serviceWorker.register('/sw.js').catch(function () {});
              }
            });
          }
        `}} />
      </body>
    </html>
  );
}
