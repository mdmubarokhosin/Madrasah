import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "জামিয়া ইসলামিয়া দারুল উলূম - মাদরাসা ব্যবস্থাপনা",
  description: "জামিয়া ইসলামিয়া দারুল উলূম - ইলমে দ্বীনের আলোয় আলোকিত জীবন গড়ার প্রত্যয়ে। পরীক্ষার ফলাফল, সনদের আবেদন এবং আরও অনেক কিছু।",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
