import type { Metadata } from "next";
import { Noto_Sans_Bengali, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const notoBengali = Noto_Sans_Bengali({
  variable: "--font-bengali",
  subsets: ["bengali"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const notoArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: 'মাহমুদপুর (উত্তর চন্দন পারুলিয়া) আশরাফুল ঊলূম মাদ্রাসা',
  description: 'কুরআন ও সুন্নাহর আলোকে পরিচালিত স্বনামধন্য কওমি মাদরাসা। হিফয, আলিম, ফাজিল, তাকমিলসহ বিভিন্ন বিভাগে পূর্ণাঙ্গ ইসলামী শিক্ষা।',
  keywords: ['কওমি মাদরাসা', 'ইসলামী শিক্ষা', 'হিফয', 'আলিম', 'ফাজিল', 'কুরআন', 'মাদরাসা', 'Qawmi Madrasa', 'Islamic Education'],
  authors: [{ name: 'মাহমুদপুর (উত্তর চন্দন পারুলিয়া) আশরাফুল ঊলূম মাদ্রাসা' }],
  icons: {
    icon: '/logo.png',
  },
  openGraph: {
    title: 'মাহমুদপুর (উত্তর চন্দন পারুলিয়া) আশরাফুল ঊলূম মাদ্রাসা',
    description: 'কুরআন ও সুন্নাহর আলোকে পরিচালিত স্বনামধন্য কওমি মাদরাসা',
    type: 'website',
    locale: 'bn_BD',
    siteName: 'মাহমুদপুর (উত্তর চন্দন পারুলিয়া) আশরাফুল ঊলূম মাদ্রাসা',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'মাহমুদপুর (উত্তর চন্দন পারুলিয়া) আশরাফুল ঊলূম মাদ্রাসা',
    description: 'কুরআন ও সুন্নাহর আলোকে পরিচালিত স্বনামধন্য কওমি মাদরাসা',
  },
  robots: {
    index: true,
    follow: true,
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
        <meta name="theme-color" content="#166534" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="মাদরাসা" />
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var lang = localStorage.getItem("preferred-language") || "bn";
            if (lang !== "bn" && lang !== "en" && lang !== "ar") lang = "bn";
            document.documentElement.lang = lang;
            document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
          })();
        ` }} />
      </head>
      <body className={`${notoBengali.variable} ${notoArabic.variable} antialiased bg-background text-foreground`}>
          {children}
          <Toaster />
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js');
            });
          }
        `}} />
      </body>
    </html>
  );
}
