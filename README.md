<div align="center">

# 🕌 মাহমুদপুর (উত্তর চন্দন পারুলিয়া) আশরাফুল ঊলূম মাদ্রাসা

### কওমি মাদরাসা ম্যানেজমেন্ট সিস্টেম

**কুরআন ও সুন্নাহর আলোকে পরিচালিত স্বনামধন্য কওমি মাদরাসা**
**হিফয, আলিম, ফাজিল, তাকমিলসহ বিভিন্ন বিভাগে পূর্ণাঙ্গ ইসলামী শিক্ষা**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-12-ffca28?logo=firebase)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-Private-red)]()

</div>


---

## 🆕 v2.0 — প্রোডাকশন আপডেট (2026)

এই ভার্সনে নিম্নলিখিত গুরুত্বপূর্ণ উন্নয়ন ও সংস্করণ করা হয়েছে:

### ✅ সম্পূর্ণ বহুভাষিক (A to Z)
- **৪১টি এডমিন কম্পোনেন্ট** সহ পুরো ওয়েবসাইট এখন তিন ভাষায় (বাংলা / English / العربية) সম্পূর্ণ অনুবাদিত
- ভাষা পরিবর্তন করলেই **এডমিন প্যানেল, রেজাল্ট, স্টুডেন্ট পোর্টাল, মার্কশিট, প্রিন্ট/PDF ভিউ — সবকিছু** নির্বাচিত ভাষায় লোড হয়
- আরবি নির্বাচন করলে সাইট স্বয়ংক্রিয়ভাবে RTL (ডান থেকে বাম) হয়ে যায়
- তারিখ/সংখ্যা/কারেন্সি ফরম্যাটিং ভাষা অনুযায়ী পরিবর্তিত হয় (bn-BD / en-US / ar-EG)
- i18n সিস্টেম এখন `src/lib/i18n.ts` + `src/lib/i18n-parts/*.ts` মডুলার কাঠামোয় — নতুন ভাষা যোগ করা সহজ

### 🌐 সার্ভার ডাটা লোডিং স্ট্যাটাস
- Firebase থেকে ডাটা লোড না হলে হার্ডকোডেড ডাটার বদলে **সুন্দর এরর পেজ** দেখায়: "ডাটা লোড হচ্ছে না"
- ভাষা অনুযায়ী এরর মেসেজ + **"আবার চেষ্টা করুন"** রিট্রাই বাটন
- কানেকশন ট্র্যাকিং: প্রথম সফল ডাটার আগে পেজ লোড হয় না; পারমিশন/নেটওয়ার্ক এরর ধরা পড়ে

### 🗑️ হার্ডকোডেড ডাটা অপসারণ
- "জামিয়া ইসলামিয়া দারুল উলূম" এর সব হার্ডকোডেড ফলব্যাক ও **স্যাম্পল ডাটা সিডিং** বাটন সরানো হয়েছে
- সাইটের নাম/স্লোগান এখন শুধু Firebase থেকে আসে — Admin → Settings → Site Info
- নতুন ফিল্ড: **Name (English)**, **Slogan (English)**, **Slogan (Arabic)** — ভাষা অনুযায়ী আলাদা নাম/স্লোগান সেট করা যায়

### 🧹 প্রোডাকশন ক্লিনআপ
- ২৮টি অব্যবহৃত shadcn/ui কম্পোনেন্ট ও ২৯টি অব্যবহৃত npm ডিপেন্ডেন্সি সরানো (বান্ডেল সাইজ কমেছে)
- `out/` বিল্ড আউটপুট ও `bun.lock` রিপো থেকে সরানো — Cloudflare Pages নিজেই বিল্ড করে
- Firebase সাবস্ক্রিপশন এরর হ্যান্ডলিং ও মেমোরি লিক ফিক্স

---

## 🆕 v2.1 — ত্রিভাষিক কনটেন্ট সিস্টেম (2026)

v2.0-এ UI অনুবাদ ছিল; **v2.1-এ এডমিনের লেখা কনটেন্টও তিন ভাষায় লেখা যায়**:

### 🖊️ এডমিন প্যানেল — ত্রিভাষিক ইনপুট
- প্রতিটি কনটেন্ট ফিল্ডে এখন **বাংলা / English / العربية** ট্যাব — এক ফর্মেই তিন ভাষায় লেখা যায়
- সাপোর্টেড সেকশন: **Who We Are (আমাদের পরিচয়), Our Vision, Our Mission, Departments, Teachers (পদবি+যোগ্যতা), Admission Info (প্রয়োজনীয়তা/কাগজপত্র/সময়সূচি), Notice Board, Exam Results (পরীক্ষার নাম), Events, Donations, Articles, Gallery**
- পূরণ হওয়া ভাষার ট্যাবে সবুজ ✓ চিহ্ন — কোন ভাষা বাকি এক নজরে বোঝা যায়
- পুরনো এক-ভাষিক ডাটা স্বয়ংক্রিয়ভাবে কাজ করে (বাংলা ফলব্যাক) — মাইগ্রেশন লাগে না

### 👤 ইউজার সাইট — ভাষাভিত্তিক কনটেন্ট
- ইউজার ভাষা বদলালে **কনটেন্টও সেই ভাষায় দেখায়** (শুধু UI নয়): নোটিশ, ইভেন্ট, বিভাগ, শিক্ষক, ভর্তি তথ্য, দানের ফান্ড, লেখা, রেজাল্ট, গ্যালারি, হেডার/ফুটার
- কোনো ভাষায় কনটেন্ট না থাকলে → বাংলা → English → Arabic ফলব্যাক চেইন
- স্টুডেন্ট পোর্টালের মার্কশিট/ট্রান্সক্রিপ্টে পরীক্ষার নামও নির্বাচিত ভাষায়

### 🔧 অন্যান্য উন্নয়ন
- **হেডার:** মোবাইলেও লোগোর পাশে ওয়েবসাইটের নাম দেখায় (আগে শুধু লোগো ছিল) — ফুল রেসপন্সিভ, লম্বা নাম truncate হয়
- **ব্রাউজার ট্যাব টাইটেল** এখন নির্বাচিত ভাষার সাইট নাম অনুযায়ী বদলায়
- ডাটা মডেল: `titleEn/titleAr`, `contentEn/contentAr` ইত্যাদি অপশনাল ফিল্ড (`src/types/database.ts`)
- সাহায্যকারী: `src/lib/multilingual.ts` (`loc`, `locList`, `locSchedule`), `src/components/admin/MLFields.tsx`
- অপ্রয়োজনীয় ফাইল অপসারণ: `public/logo.svg`, `public/fonts/` (অব্যবহৃত)

---

## 📋 সূচিপত্র

| ক্রম | সেকশন | বিবরণ |
|---|---|---|
| ১ | [প্রজেক্ট পরিচিতি](#project-intro) | প্রজেক্ট সম্পর্কে বিস্তারিত |
| ২ | [বৈশিষ্ট্যসমূহ](#features) | সকল ফিচারের তালিকা |
| ৩ | [প্রযুক্তি](#tech-stack) | ব্যবহৃত প্রযুক্তি |
| ৪ | [প্রজেক্ট কাঠামো](#project-structure) | ফাইল স্ট্রাকচার |
| ৫ | [ইন্সটলেশন ও সেটআপ](#installation) | ইন্সটলেশন গাইড |
| ৬ | [এনভায়রনমেন্ট ভেরিয়েবল](#env-variables) | এনভায়রনমেন্ট কনফিগ |
| ৭ | [ফায়ারবেস সেটআপ](#firebase-setup) | Firebase সেটআপ গাইড |
| ৮ | [পেমেন্ট গেটওয়ে সেটআপ](#payment-setup) | পেমেন্ট সেটআপ |
| ৯ | [ডিপ্লয়মেন্ট](#deployment) | সাধারণ ডিপ্লয়মেন্ট |
| ১০ | [ক্লাউডফ্লেয়ার পেজেস ডিপ্লয়মেন্ট](#cloudflare-deployment) | Cloudflare Pages গাইড |
| ১১ | [স্ক্রিনশট ও ফিচার ওভারভিউ](#screenshots) | স্ক্রিনশট |
| ১২ | [পেজ তালিকা](#page-list) | সকল পেজের তালিকা |
| ১৩ | [ডাটাবেস স্ট্রাকচার](#database-structure) | Firebase DB স্ট্রাকচার |
| ১৪ | [বহুভাষিক সাপোর্ট](#multilingual) | ভাষা সাপোর্ট |
| ১৫ | [মোবাইল সাপোর্ট](#mobile-support) | মোবাইল ফিচার |
| ১৬ | [প্রজেক্ট পরিসংখ্যান](#statistics) | পরিসংখ্যান |
| ১৭ | [তৈরিকারক](#creator) | তৈরিকারক |

---

<a id="project-intro"></a>
## 📖 প্রজেক্ট পরিচিতি

এটি **"মাহমুদপুর (উত্তর চন্দন পারুলিয়া) আশরাফুল ঊলূম মাদ্রাসা"** নামের একটি কওমি মাদরাসার জন্য তৈরি পূর্ণাঙ্গ ওয়েব ভিত্তিক ম্যানেজমেন্ট সিস্টেম। এই সিস্টেমটি মাদরাসার সকল প্রশাসনিক, একাডেমিক ও আর্থিক কার্যক্রম ডিজিটাল পদ্ধতিতে পরিচালনা করতে সক্ষম। সার্বজনীন ওয়েবসাইট থেকে শুরু করে শক্তিশালী অ্যাডমিন প্যানেল, স্টুডেন্ট পোর্টাল, অনলাইন পেমেন্ট গেটওয়ে এবং আরবি, বাংলা ও ইংরেজি তিন ভাষায় সম্পূর্ণ বহুভাষিক সাপোর্ট সহ এটি একটি উৎপাদন-স্তরের অ্যাপ্লিকেশন।

প্রজেক্টটি **Next.js 16 (App Router)** আর্কিটেকচারে তৈরি, যা Firebase Realtime Database ব্যাকএন্ড, Tailwind CSS 4 স্টাইলিং এবং shadcn/ui কম্পোনেন্ট লাইব্রেরি ব্যবহার করে। মোবাইল-ফার্স্ট রেসপন্সিভ ডিজাইনে তৈরি এই সিস্টেমটি যেকোনো ডিভাইসে নিরবচ্ছিন্নভাবে কাজ করে।

### মূল বৈশিষ্ট্যসমূহ

- ২৮টি পাবলিক ওয়েবসাইট পেজ
- ৪১টি অ্যাডমিন প্যানেল পেজ
- স্টুডেন্ট পোর্টাল (রেজাল্ট দেখা, মার্কশিট ডাউনলোড)
- ৩টি ভাষায় বহুভাষিক সাপোর্ট (বাংলা, English, العربية)
- অনলাইন পেমেন্ট গেটওয়ে (Bohudur + QR পেমেন্ট)
- PWA (Progressive Web App) সাপোর্ট
- ১৬৫টি+ সোর্স ফাইল, ৪৫টি+ ডাটা মডেল

---

<a id="features"></a>
## ✨ বৈশিষ্ট্যসমূহ

### 🌐 সার্বজনীন ওয়েবসাইট (Public Website)
| ফিচার | বিবরণ |
|---|---|
| **হোম পেজ** | হিরো সেকশন, মাদরাসা পরিচিতি, বিভাগ সমূহ, শিক্ষক, ভর্তি, নোটিশ, ফলাফল, ইভেন্ট, গ্যালারি, দান, ব্লগ, যোগাযোগ |
| **বিভাগ সমূহ** | সকল একাডেমিক বিভাগের বিস্তারিত তথ্য ও আরবি নাম |
| **শিক্ষক পরিচিতি** | সকল শিক্ষকের পরিচিতি, যোগ্যতা ও বিভাগ |
| **অনলাইন ভর্তি** | সম্পূর্ণ অনলাইন ভর্তি ফর্ম ও আবেদন ট্র্যাকিং |
| **পরীক্ষার ফলাফল** | বিষয়ভিত্তিক নম্বর, গ্রেড ও শতকরা সহ ফলাফল দেখা |
| **নোটিশ বোর্ড** | গুরুত্বপূর্ণ নোটিশ ও ঘোষণা |
| **ইভেন্ট ক্যালেন্ডার** | একাডেমিক, ধর্মীয় ও সাংস্কৃতিক ইভেন্ট |
| **ফটো গ্যালারি** | বিভাগভিত্তিক ফটো গ্যালারি |
| **অনুদান/দান** | Bohudur পেমেন্ট গেটওয়ের মাধ্যমে অনলাইন দান |
| **ব্লগ** | মাদরাসার খবর ও প্রবন্ধ |
| **ক্লাস রুটিন** | বিভাগভিত্তিক ক্লাস রুটিন |
| **সিলেবাস** | বিভাগ ও শ্রেণিভিত্তিক সিলেবাস |
| **হিফয ট্র্যাকিং** | কুরআন হিফয অগ্রগতি ট্র্যাকিং |
| **অনলাইন MCQ পরীক্ষা** | টাইমড MCQ পরীক্ষা সিস্টেম |
| **লাইব্রেরি** | বই তালিকা ও পরিচালনা |
| **হোস্টেল** | রুম বরাদ্দ, খাবারের মেনু ও পরিচালনা |
| **দাওয়া ও তাবলীগ** | দাওয়া প্রোগ্রাম ও জামাত ট্র্যাকিং |
| **নামাজের সময়** | পাঁচ ওয়াক্ত নামাজের সময়সূচি |
| **হাদীস সংগ্রহ** | হাদীস প্রদর্শন ব্যবস্থা |
| **কুরআন** | কুরআন পড়ার ব্যবস্থা |
| **ফি পেমেন্ট** | বিভাগভিত্তিক ফি কাঠামো দেখা |
| **এলুমনাই/প্রাক্তন ছাত্র** | প্রাক্তন ছাত্রদের তথ্য |
| **স্টাডি ম্যাটেরিয়াল** | PDF, ভিডিও, অডিও স্টাডি ম্যাটেরিয়াল |
| **যোগাযোগ** | ফোন, ইমেইল, ম্যাপ সহ যোগাযোগ পেজ |

### 🛡️ অ্যাডমিন প্যানেল (Admin Panel)
| ক্যাটাগরি | ফিচার |
|---|---|
| **ড্যাশবোর্ড** | সারসংক্ষেপ, পরিসংখ্যান, চার্ট ও গ্রাফ |
| **শিক্ষক ব্যবস্থাপনা** | শিক্ষক যোগ, সম্পাদনা, ডিলিট, অর্ডারিং |
| **বিভাগ ব্যবস্থাপনা** | বিভাগ তৈরি, সম্পাদনা, আইকন ও ইমেজ |
| **ছাত্র ব্যবস্থাপনা** | ছাত্র তালিকা, যোগ, সম্পাদনা, সার্চ |
| **পরীক্ষা ও ফলাফল** | পরীক্ষা তৈরি, বিষয়ভিত্তিক নম্বর, গ্রেড দেওয়া |
| **নোটিশ বোর্ড** | নোটিশ তৈরি, সম্পাদনা, গুরুত্ব চিহ্নিতকরণ |
| **ব্লগ ব্যবস্থাপনা** | MDX এডিটর সহ ব্লগ লেখা |
| **গ্যালারি ব্যবস্থাপনা** | ছবি আপলোড, ক্যাটাগরি, অর্ডারিং |
| **ভর্তি ব্যবস্থাপনা** | অনলাইন আবেদন দেখা, অনুমোদন/প্রত্যাখ্যান |
| **অনুদান ব্যবস্থাপনা** | তহবিল তৈরি, দান ট্র্যাকিং |
| **ইভেন্ট ব্যবস্থাপনা** | ইভেন্ট তৈরি, ক্যালেন্ডার ভিউ |
| **মেসেজ ব্যবস্থাপনা** | যোগাযোগ মেসেজ দেখা, রিপ্লাই |
| **হিফয ব্যবস্থাপনা** | হিফজ রেকর্ড, পারা/সূরা ট্র্যাকিং |
| **MCQ পরীক্ষা** | পরীক্ষা তৈরি, প্রশ্ন ব্যাংক, ফলাফল |
| **অ্যাটেন্ডেন্স** | ছাত্র উপস্থিতি ব্যবস্থাপনা |
| **লাইব্রেরি** | বই ব্যবস্থাপনা, ইস্যু, রিটার্ন |
| **ক্যালেন্ডার** | একাডেমিক ক্যালেন্ডার, ছুটি ব্যবস্থাপনা |
| **ফি ব্যবস্থাপনা** | ফি কাঠামো তৈরি, ফি কালেকশন |
| **এলুমনাই** | প্রাক্তন ছাত্র ব্যবস্থাপনা |
| **নামাজের সময়** | পাঁচ ওয়াক্তের সময় কনফিগার |
| **হাদীস ব্যবস্থাপনা** | হাদীস যোগ ও প্রদর্শন |
| **SMS ব্যবস্থা** | SMS পাঠানোর ব্যবস্থা |
| **ব্যাকআপ** | ডাটাবেস ব্যাকআপ ও রিস্টোর |
| **পেমেন্ট হিস্ট্রি** | সকল অনুদানের তালিকা ও ফিল্টার |
| **খরচ ব্যবস্থাপনা** | খরচের হিসাব, ক্যাটাগরি, বাজেট |
| **বেতন ব্যবস্থাপনা** | শিক্ষক বেতন, ভাতা, কাটা |
| **আর্থিক রিপোর্ট** | আয়-ব্যয়ের সারসংক্ষেপ, চার্ট |
| **ভাউচার** | রিসিট, পেমেন্ট, জার্নাল ভাউচার |
| **সাবস্ক্রিপশন** | নিয়মিত দান সাবস্ক্রিপশন |
| **হোস্টেল** | রুম বরাদ্দ, খাবার মেনু |
| **দাওয়া** | দাওয়া প্রোগ্রাম ও জামাত |
| **স্টাডি ম্যাটেরিয়াল** | PDF/ভিডিও আপলোড ও ব্যবস্থাপনা |
| **রোল ও পারমিশন** | অ্যাডমিন রোল, পারমিশন ব্যবস্থা |
| **QR পেমেন্ট** | বিকাশ, নগদ, রকেট, ব্যাংক QR কনফিগ |
| **রিপোর্ট বিল্ডার** | কাস্টম রিপোর্ট তৈরি |
| **সেটিংস** | সাইট তথ্য, সোশ্যাল, পেমেন্ট, পাসওয়ার্ড, GitHub API, টুলস |
| **অ্যাক্টিভিটি লগ** | সকল অ্যাডমিন কার্যক্রমের লগ |

### 👨‍🎓 স্টুডেন্ট পোর্টাল
- রোল নম্বর দিয়ে ফলাফল দেখা
- বিষয়ভিত্তিক নম্বর, শতকরা ও গ্রেড
- মার্কশিট PDF ডাউনলোড (html2canvas + jsPDF)
- প্রিন্ট সুবিধা

---

<a id="tech-stack"></a>
## 🛠 প্রযুক্তি

### কোর টেক স্ট্যাক
| প্রযুক্তি | ভার্সন | ব্যবহার |
|---|---|---|
| **Next.js** | 16.1+ | React Framework (App Router) |
| **React** | 19 | UI Library |
| **TypeScript** | 5 | Type Safety |
| **Tailwind CSS** | 4 | Styling |
| **shadcn/ui** | Latest | UI Components (Radix UI) |
| **Firebase** | 12 | Realtime Database + Auth |
| **Zustand** | 5 | State Management |
| **Framer Motion** | 12 | Animations |
| **Recharts** | 2.15 | Charts & Graphs |
| **Bun** | Latest | JavaScript Runtime |

### অন্যান্য গুরুত্বপূর্ণ লাইব্রেরি
| লাইব্রেরি | ব্যবহার |
|---|---|
| `@mdxeditor/editor` | ব্লগ MDX এডিটর |
| `html2canvas` + `jspdf` | মার্কশিট PDF তৈরি |
| `@dnd-kit` | ড্র্যাগ অ্যান্ড ড্রপ |
| `@tanstack/react-table` | টেবিল ম্যানেজমেন্ট |
| `react-hook-form` + `zod` | ফর্ম ভ্যালিডেশন |
| `embla-carousel-react` | ক্যারোসেল/স্লাইডার |
| `lucide-react` | আইকন লাইব্রেরি |
| `next-themes` | ডার্ক/লাইট মোড |
| `recharts` | চার্ট ও গ্রাফ |
| `date-fns` | তারিখ ফরম্যাটিং |
| `cmdk` | কমান্ড প্যালেট |

---

<a id="project-structure"></a>
## 📁 প্রজেক্ট কাঠামো

```
madrasa-website/
├── public/                          # স্ট্যাটিক অ্যাসেট
│   ├── logo.png                     # মাদরাসা লোগো
│   ├── islamic-pattern.png          # ইসলামিক প্যাটার্ন
│   ├── manifest.json                # PWA ম্যানিফেস্ট
│   └── sw.js                        # Service Worker
│
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── layout.tsx               # রুট লেআউট (ফন্ট, মেটাডাটা)
│   │   ├── page.tsx                 # মূল পেজ (SPA এন্ট্রি)
│   │   ├── globals.css              # গ্লোবাল স্টাইল (CSS Variables)
│   │   ├── payment/
│   │   │   ├── success/page.tsx     # পেমেন্ট সফল পেজ
│   │   │   └── cancel/page.tsx      # পেমেন্ট বাতিল পেজ
│   │   └── api/
│   │       ├── route.ts             # বেস API রাউট
│   │       ├── bohudur/
│   │       │   ├── create/route.ts  # পেমেন্ট তৈরি
│   │       │   ├── execute/route.ts # পেমেন্ট এক্সিকিউট
│   │       │   ├── query/route.ts   # পেমেন্ট স্ট্যাটাস কোয়েরি
│   │       │   └── check/route.ts   # API কী যাচাই
│   │       └── payment/
│   │           ├── status/route.ts  # পেমেন্ট স্ট্যাটাস
│   │           └── webhook/route.ts # পেমেন্ট ওয়েবহুক
│   │
│   ├── components/
│   │   ├── ui/                      # shadcn/ui কম্পোনেন্ট (৩০+ ফাইল)
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   └── ...
│   │   ├── madrasa/                 # পাবলিক ওয়েবসাইট কম্পোনেন্ট
│   │   │   ├── Header.tsx
│   │   │   ├── Hero.tsx
│   │   │   ├── About.tsx
│   │   │   ├── Departments.tsx
│   │   │   ├── Teachers.tsx
│   │   │   ├── Admission.tsx
│   │   │   ├── OnlineAdmission.tsx
│   │   │   ├── NoticeBoard.tsx
│   │   │   ├── Results.tsx
│   │   │   ├── Events.tsx
│   │   │   ├── Gallery.tsx
│   │   │   ├── Donation.tsx
│   │   │   ├── DonatePayment.tsx
│   │   │   ├── PaymentCallback.tsx
│   │   │   ├── PaymentSuccessPage.tsx
│   │   │   ├── PaymentCancelPage.tsx
│   │   │   ├── Blog.tsx
│   │   │   ├── BlogDetail.tsx
│   │   │   ├── Contact.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── IslamicLoader.tsx
│   │   ├── pages/                   # পাবলিক সাব-পেজ কম্পোনেন্ট (২০+ ফাইল)
│   │   ├── admin/                   # অ্যাডমিন প্যানেল কম্পোনেন্ট (৩৯+ ফাইল)
│   │   │   ├── AdminLogin.tsx
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AdminNotices.tsx
│   │   │   ├── AdminTeachers.tsx
│   │   │   ├── AdminDepartments.tsx
│   │   │   ├── AdminStudents.tsx
│   │   │   ├── AdminExams.tsx
│   │   │   ├── AdminResults.tsx
│   │   │   ├── AdminBlogs.tsx
│   │   │   ├── AdminGallery.tsx
│   │   │   ├── AdminAdmission.tsx
│   │   │   ├── AdminDonation.tsx
│   │   │   ├── AdminSettings.tsx
│   │   │   ├── AdminMessages.tsx
│   │   │   ├── AdminEvents.tsx
│   │   │   ├── AdminApplications.tsx
│   │   │   ├── AdminActivityLog.tsx
│   │   │   ├── AdminHifz.tsx
│   │   │   ├── AdminMCQExams.tsx
│   │   │   ├── AdminAttendance.tsx
│   │   │   ├── AdminLibrary.tsx
│   │   │   ├── AdminCalendar.tsx
│   │   │   ├── AdminFee.tsx
│   │   │   ├── AdminAlumni.tsx
│   │   │   ├── AdminPrayer.tsx
│   │   │   ├── AdminHadith.tsx
│   │   │   ├── AdminSMS.tsx
│   │   │   ├── AdminBackup.tsx
│   │   │   ├── AdminPaymentHistory.tsx
│   │   │   ├── AdminExpenses.tsx
│   │   │   ├── AdminSalary.tsx
│   │   │   ├── AdminFinancialReports.tsx
│   │   │   ├── AdminVouchers.tsx
│   │   │   ├── AdminSubscriptions.tsx
│   │   │   ├── AdminHostel.tsx
│   │   │   ├── AdminDawah.tsx
│   │   │   ├── AdminMaterials.tsx
│   │   │   ├── AdminRoles.tsx
│   │   │   ├── AdminQRPayment.tsx
│   │   │   └── AdminReportBuilder.tsx
│   │   └── student/
│   │       └── StudentPortal.tsx     # স্টুডেন্ট পোর্টাল
│   │
│   ├── lib/
│   │   ├── db-service.ts            # Firebase সার্ভিস
│   │   ├── i18n-context.tsx         # বহুভাষিক কনটেক্সট
│   │   ├── utils.ts                 # Utility ফাংশন
│   │   └── ...
│   │
│   ├── store/
│   │   └── app-store.ts             # Zustand গ্লোবাল স্টোর
│   │
│   ├── types/
│   │   └── database.ts              # সকল TypeScript ইন্টারফেস (৪৫+)
│   │
│   └── hooks/
│       └── use-toast.ts             # Toast Notification Hook
│
├── .env.example                     # এনভায়রনমেন্ট ভেরিয়েবল টেমপ্লেট
├── .gitignore                       # Git ইগনোর রুলস
├── next.config.ts                   # Next.js কনফিগারেশন
├── tailwind.config.ts               # Tailwind CSS কনফিগারেশন
├── tsconfig.json                    # TypeScript কনফিগারেশন
├── package.json                     # প্যাকেজ ডিপেন্ডেন্সি
├── components.json                  # shadcn/ui কনফিগারেশন
└── prisma/
    └── schema.prisma                # Prisma স্কিমা (রিজার্ভ)
```

---

<a id="installation"></a>
## 🚀 ইন্সটলেশন ও সেটআপ

### প্রয়োজনীয়তা
- **Node.js** 18+ অথবা **Bun** (রিকমেন্ডেড)
- **Firebase** অ্যাকাউন্ট (ফ্রি প্ল্যানে যথেষ্ট)
- **Git**

### ধাপ ১: প্রজেক্ট ডাউনলোড

```bash
# ZIP ফাইল ডাউনলোড করুন
# অথবা গিট থেকে ক্লোন করুন
git clone <your-repo-url>
cd madrasa-website
```

### ধাপ ২: ডিপেন্ডেন্সি ইন্সটল

```bash
# Bun ব্যবহার করে (রিকমেন্ডেড)
bun install

# অথবা npm ব্যবহার করে
npm install
```

### ধাপ ৩: এনভায়রনমেন্ট ভেরিয়েবল সেটআপ

```bash
# .env.example কপি করুন
cp .env.example .env

# .env ফাইল এডিট করুন এবং Firebase কনফিগারেশন দিন
nano .env
```

### ধাপ ৪: ডেভেলপমেন্ট সার্ভার চালু

```bash
# Bun দিয়ে
bun run dev

# অথবা npm দিয়ে
npm run dev
```

ব্রাউজারে যান: **http://localhost:3000**

### ধাপ ৫: প্রোডাকশন বিল্ড

```bash
# বিল্ড করুন
bun run build

# প্রোডাকশন সার্ভার চালু করুন
bun run start
```

---

<a id="env-variables"></a>
## 🔑 এনভায়রনমেন্ট ভেরিয়েবল

### Firebase কনফিগারেশন (আবশ্যক)

Firebase Console থেকে প্রজেক্ট তৈরি করুন এবং Realtime Database + Anonymous Authentication সক্রিয় করুন।

| ভেরিয়েবল | বিবরণ | উদাহরণ |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API Key | `AIzaSy...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | Firebase RTDB URL | `https://your-project-default-rtdb.firebaseio.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID | `your-project-id` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | `your-project.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID | `123456789` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID | `1:123456789:web:abc123` |

### Bohudur পেমেন্ট গেটওয়ে (ঐচ্ছিক)

[Bohudur](https://bohudur.one) থেকে API Key নিন।

| ভেরিয়েবল | বিবরণ |
|---|---|
| `BOHUDUR_API_KEY` | Bohudur Payment Gateway API Key |

### ডাটাবেস (ব্যাকআপ)

| ভেরিয়েবল | মান |
|---|---|
| `DATABASE_URL` | `file:./db/custom.db` |

---

<a id="firebase-setup"></a>
## 🔥 ফায়ারবেস সেটআপ

### ১. Firebase প্রজেক্ট তৈরি
1. [Firebase Console](https://console.firebase.google.com/) এ যান
2. **"Create a project"** ক্লিক করুন
3. প্রজেক্টের নাম দিন
4. Google Analytics বন্ধ রাখতে পারেন

### ২. Realtime Database তৈরি
1. **Build > Realtime Database** এ যান
2. **"Create Database"** ক্লিক করুন
3. লোকেশন নির্বাচন করুন (Asia প্রেফারেবল)
4. **"Start in test mode"** নির্বাচন করুন
5. ডাটাবেস URL কপি করুন (`.env` এ `NEXT_PUBLIC_FIREBASE_DATABASE_URL` হিসেবে ব্যবহার হবে)

### ৩. Authentication সেটআপ
1. **Build > Authentication** এ যান
2. **"Get started"** ক্লিক করুন
3. **Sign-in method** ট্যাবে যান
4. **"Anonymous"** সক্রিয় করুন

### ৪. প্রজেক্ট সেটিংস থেকে কনফিগারেশন কপি
1. **Project settings** ( gear icon ) এ যান
2. **"General"** ট্যাবে আপনার Web App এর কনফিগারেশন পাবেন
3. সব `firebaseConfig` ভ্যালু `.env` ফাইলে কপি করুন

### ৫. Rules সেটআপ (প্রোডাকশনের জন্য)

```
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

> ⚠️ প্রোডাকশনে `".write": true` ব্যবহার না করে নির্দিষ্ট নিয়ম ব্যবহার করুন। এটি শুধু শুরুর জন্য।

---

<a id="payment-setup"></a>
## 💳 পেমেন্ট গেটওয়ে সেটআপ

### Bohudur Payment Gateway

1. [Bohudur](https://bohudur.one) এ রেজিস্ট্রেশন করুন
2. API Key নিন
3. `.env` ফাইলে যোগ করুন:
   ```
   BOHUDUR_API_KEY=your_api_key_here
   ```
4. অ্যাডমিন প্যানেল > **Settings > Payment** থেকে সেটিংস কনফিগার করুন
5. Redirect URLs সেট করুন:
   - Success URL: `https://your-domain.com/payment/success`
   - Cancel URL: `https://your-domain.com/payment/cancel`

### QR Payment (bKash, Nagad, Rocket, Bank)

অ্যাডমিন প্যানেল > **Settings > QR Payment** থেকে QR কোড ও নম্বর কনফিগার করুন।

---

<a id="deployment"></a>
## 🌐 ডিপ্লয়মেন্ট

### সাধারণ ডিপ্লয়মেন্ট

```bash
# বিল্ড করুন
bun run build

# বিল্ড আউটপুট .next/standalone/ ফোল্ডারে থাকবে
# এই ফোল্ডারটি যেকোনো Node.js সার্ভারে ডিপ্লয় করুন
```

---

<a id="cloudflare-deployment"></a>
## ☁️ ক্লাউডফ্লেয়ার পেজেস ডিপ্লয়মেন্ট

### ধাপ ১: GitHub এ পুশ

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/madrasa-website.git
git push -u origin main
```

### ধাপ ২: Cloudflare Pages সেটআপ

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Pages** এ যান
2. **"Create a project"** ক্লিক করুন
3. **"Connect to Git"** নির্বাচন করুন
4. GitHub রিপো কানেক্ট করুন

### ধাপ ৩: Build Settings

| Setting | Value |
|---|---|
| **Framework preset** | Next.js |
| **Build command** | `npx next build` |
| **Build output directory** | `.next` |
| **Node.js version** | `18` বা ঊর্ধ্ব |

### ধাপ ৪: Environment Variables সেটআপ

Cloudflare Pages > **Settings > Environment variables** এ নিচের ভেরিয়েবলগুলো যোগ করুন:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | আপনার Firebase API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | আপনার Firebase Auth Domain |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | আপনার Firebase RTDB URL |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | আপনার Firebase Project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | আপনার Firebase Storage Bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | আপনার Firebase Messaging Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | আপনার Firebase App ID |
| `BOHUDUR_API_KEY` | আপনার Bohudur API Key (ঐচ্ছিক) |

### ধাপ ৫: Deploy

**"Save and Deploy"** ক্লিক করুন। কিছু মিনিটের মধ্যে আপনার সাইট লাইভ হবে।

> ⚠️ `next.config.ts` এ `output: "standalone"` সেট করা আছে। Cloudflare Pages এ Next.js প্রিসেট ব্যবহার করলে এটি স্বয়ংক্রিয়ভাবে হ্যান্ডেল হবে।

---

<a id="screenshots"></a>
## 📸 স্ক্রিনশট ও ফিচার ওভারভিউ

### পাবলিক ওয়েবসাইট
- **হোম পেজ**: ইসলামিক থিম, গ্রিন-গোল্ডেন কালার স্কিম, হিরো সেকশন, বাংলা/ইংরেজি/আরবি ভাষা সুইচার
- **রেসপন্সিভ ডিজাইন**: মোবাইল, ট্যাবলেট ও ডেস্কটপে সমানভাবে কাজ করে
- **ডার্ক মোড**: স্বয়ংক্রিয় ও ম্যানুয়াল ডার্ক/লাইট মোড
- **PWA**: হোম স্ক্রিনে যোগ করে অ্যাপের মতো ব্যবহার

### অ্যাডমিন প্যানেল
- **ড্যাশবোর্ড**: সারসংক্ষেপ কার্ড, চার্ট, সাম্প্রতিক কার্যক্রম
- **মোবাইল নেভিগেশন**: Sheet-based সাইডবার, মোবাইলে সহজ নেভিগেশন
- **MDX ব্লগ এডিটর**: রিচ টেক্সট এডিটিং
- **আর্থিক রিপোর্ট**: ইন্টারঅ্যাক্টিভ চার্ট ও গ্রাফ

### স্টুডেন্ট পোর্টাল
- **ফলাফল দেখা**: রোল নম্বর দিয়ে সার্চ
- **মার্কশিট**: প্রফেশনাল A4 মার্কশিট PDF ডাউনলোড

---

<a id="page-list"></a>
## 📄 পেজ তালিকা

### পাবলিক ওয়েবসাইট (২৮টি পেজ)

| URL | পেজ | বিবরণ |
|---|---|---|
| `/` | হোম | মূল পেজ (সকল সেকশন সহ) |
| `/about` | পরিচিতি | মাদরাসা সম্পর্কে |
| `/departments` | বিভাগ সমূহ | সকল বিভাগের তালিকা |
| `/teachers` | শিক্ষকগণ | শিক্ষক পরিচিতি |
| `/admission` | ভর্তি | ভর্তি তথ্য |
| `/notices` | নোটিশ | নোটিশ বোর্ড |
| `/events` | ইভেন্ট | ইভেন্ট তালিকা |
| `/gallery` | গ্যালারি | ফটো গ্যালারি |
| `/donation` | দান | অনুদান পেজ |
| `/blog` | ব্লগ | ব্লগ তালিকা |
| `/contact` | যোগাযোগ | যোগাযোগ ফর্ম |
| `/results` | ফলাফল | পরীক্ষার ফলাফল |
| `/class-routine` | ক্লাস রুটিন | শ্রেণিভিত্তিক রুটিন |
| `/syllabus` | সিলেবাস | পাঠ্যক্রম |
| `/hifz` | হিফয | কুরআন হিফয |
| `/exam` | অনলাইন পরীক্ষা | MCQ পরীক্ষা |
| `/calendar` | ক্যালেন্ডার | একাডেমিক ক্যালেন্ডার |
| `/alumni` | এলুমনাই | প্রাক্তন ছাত্র |
| `/prayer` | নামাজ | নামাজের সময় |
| `/hadith` | হাদীস | হাদীস সংগ্রহ |
| `/quran` | কুরআন | কুরআন |
| `/fee-payment` | ফি | ফি কাঠামো |
| `/admission-track` | ভর্তি ট্র্যাকিং | আবেদন স্ট্যাটাস |
| `/library` | লাইব্রেরি | পাঠাগার |
| `/attendance` | উপস্থিতি | অ্যাটেন্ডেন্স |
| `/hostel` | হোস্টেল | ছাত্রাবাস |
| `/dawah` | দাওয়া | দাওয়া ও তাবলীগ |
| `/materials` | ম্যাটেরিয়াল | স্টাডি ম্যাটেরিয়াল |
| `/payment/success` | পেমেন্ট সফল | সফল পেমেন্ট পেজ |
| `/payment/cancel` | পেমেন্ট বাতিল | বাতিল পেমেন্ট পেজ |

### অ্যাডমিন প্যানেল (৪১টি পেজ)

`/admin` URL এ যান এবং পাসওয়ার্ড দিয়ে লগইন করুন।

| পেজ | বিবরণ |
|---|---|
| `dashboard` | ড্যাশবোর্ড ও পরিসংখ্যান |
| `notices` | নোটিশ ব্যবস্থাপনা |
| `teachers` | শিক্ষক ব্যবস্থাপনা |
| `departments` | বিভাগ ব্যবস্থাপনা |
| `students` | ছাত্র ব্যবস্থাপনা |
| `exams` | পরীক্ষা ব্যবস্থাপনা |
| `results` | ফলাফল ব্যবস্থাপনা |
| `blogs` | ব্লগ ব্যবস্থাপনা |
| `gallery` | গ্যালারি ব্যবস্থাপনা |
| `admission` | ভর্তি ব্যবস্থাপনা |
| `donation` | অনুদান ব্যবস্থাপনা |
| `settings` | সেটিংস (সাইট, সোশ্যাল, পেমেন্ট, GitHub) |
| `messages` | মেসেজ ব্যবস্থাপনা |
| `events` | ইভেন্ট ব্যবস্থাপনা |
| `applications` | ভর্তি আবেদন ব্যবস্থাপনা |
| `activity-log` | কার্যক্রম লগ |
| `hifz` | হিফয ব্যবস্থাপনা |
| `exams-mcq` | MCQ পরীক্ষা ব্যবস্থাপনা |
| `attendance` | উপস্থিতি ব্যবস্থাপনা |
| `library` | লাইব্রেরি ব্যবস্থাপনা |
| `calendar` | ক্যালেন্ডার ব্যবস্থাপনা |
| `fee` | ফি ব্যবস্থাপনা |
| `alumni` | এলুমনাই ব্যবস্থাপনা |
| `prayer` | নামাজের সময় কনফিগ |
| `hadith` | হাদীস ব্যবস্থাপনা |
| `sms` | SMS ব্যবস্থা |
| `backup` | ব্যাকআপ ও রিস্টোর |
| `payment-history` | পেমেন্ট হিস্ট্রি |
| `expenses` | খরচ ব্যবস্থাপনা |
| `salary` | বেতন ব্যবস্থাপনা |
| `financial-reports` | আর্থিক রিপোর্ট |
| `vouchers` | ভাউচার ব্যবস্থাপনা |
| `subscriptions` | সাবস্ক্রিপশন ব্যবস্থাপনা |
| `hostel` | হোস্টেল ব্যবস্থাপনা |
| `dawah` | দাওয়া ব্যবস্থাপনা |
| `materials` | স্টাডি ম্যাটেরিয়াল |
| `roles` | রোল ও পারমিশন |
| `qr-payment` | QR পেমেন্ট কনফিগ |
| `report-builder` | রিপোর্ট বিল্ডার |

### স্টুডেন্ট পোর্টাল

`/student` URL এ যান এবং রোল নম্বর দিয়ে ফলাফল দেখুন।

---

<a id="database-structure"></a>
## 🗄️ ডাটাবেস স্ট্রাকচার

Firebase Realtime Database এ নিচের পাথগুলো ব্যবহৃত হয়:

```
madrasa/
├── siteInfo/                    # মাদরাসার সাইট তথ্য
├── adminAuth/                   # অ্যাডমিন পাসওয়ার্ড
├── githubConfig/                # GitHub API কনফিগ
├── notices/                     # নোটিশ সমূহ
├── departments/                 # বিভাগ সমূহ
├── teachers/                    # শিক্ষক সমূহ
├── students/                    # ছাত্র সমূহ
├── exams/                       # পরীক্ষা সমূহ
├── results/                     # ফলাফল সমূহ
├── blogs/                       # ব্লগ পোস্ট
├── gallery/                     # গ্যালারি আইটেম
├── admissionInfo/               # ভর্তি তথ্য
├── admissionApplications/       # ভর্তি আবেদন
├── donationFunds/               # তহবিল সমূহ
├── paymentMethods/              # পেমেন্ট মেথড
├── payments/                    # পেমেন্ট রেকর্ড
├── events/                      # ইভেন্ট সমূহ
├── contactMessages/             # যোগাযোগ মেসেজ
├── activityLog/                 # কার্যক্রম লগ
├── hifzRecords/                 # হিফয রেকর্ড
├── onlineExams/                 # অনলাইন পরীক্ষা
├── examSubmissions/             # পরীক্ষার উত্তর
├── library/                     # লাইব্রেরি বই
├── prayerConfig/                # নামাজের সময়
├── calendarEvents/              # ক্যালেন্ডার ইভেন্ট
├── alumni/                      # এলুমনাই
├── bohudurConfig/               # Bohudur কনফিগ
├── feeConfigs/                  # ফি কাঠামো
├── feePayments/                 # ফি পেমেন্ট
├── expenses/                    # খরচ
├── expenseCategories/           # খরচের ক্যাটাগরি
├── salaryRecords/               # বেতন রেকর্ড
├── donationSubscriptions/      # সাবস্ক্রিপশন
├── vouchers/                    # ভাউচার
├── hostelRooms/                 # হোস্টেল রুম
├── hostelAllocations/           # হোস্টেল বরাদ্দ
├── hostelMeals/                 # হোস্টেল খাবার
├── dawahPrograms/               # দাওয়া প্রোগ্রাম
├── dawahJamats/                 # দাওয়া জামাত
├── studyMaterials/              # স্টাডি ম্যাটেরিয়াল
├── adminRoles/                  # অ্যাডমিন রোল
├── adminUsers/                  # অ্যাডমিন ইউজার
├── qrPaymentConfig/             # QR পেমেন্ট কনফিগ
├── classRoutines/               # ক্লাস রুটিন
├── syllabus/                    # সিলেবাস
└── hadiths/                     # হাদীস সংগ্রহ
```

---

<a id="multilingual"></a>
## 🌍 বহুভাষিক সাপোর্ট

| ভাষা | কোড | স্ট্যাটাস | বিশেষত্ব |
|---|---|---|---|
| **বাংলা** | `bn` | Default (ডিফল্ট) | প্রাথমিক ভাষা |
| **English** | `en` | সম্পূর্ণ | সম্পূর্ণ অনুবাদ |
| **العربية** | `ar` | সম্পূর্ণ | RTL সাপোর্ট সহ |

সকল তিনটি ভাষায় পাবলিক ওয়েবসাইট, অ্যাডমিন প্যানেল ও স্টুডেন্ট পোর্টালের সম্পূর্ণ অনুবাদ রয়েছে। ভাষা সুইচার Header এ উপরে ডানদিকে পাওয়া যাবে।

---

<a id="mobile-support"></a>
## 📱 মোবাইল সাপোর্ট

- **মোবাইল-ফার্স্ট ডিজাইন**: সকল পেজ মোবাইলে অপ্টিমাইজড
- **অ্যাডমিন প্যানেল**: Sheet-based মোবাইল নেভিগেশন
- **PWA সাপোর্ট**: হোম স্ক্রিনে যোগ করে নেটিভ অ্যাপের মতো ব্যবহার
- **Termux সাপোর্ট**: Android এ Termux দিয়ে ডেভেলপমেন্ট ও রান করা যায়
- **ডিফল্ট username**: admin
- **ডিফল্ট পাসওয়ার্ড**: your_set_password

---

<a id="statistics"></a>
## 📊 প্রজেক্ট পরিসংখ্যান

| মেট্রিক | মান |
|---|---|
| মোট সোর্স ফাইল | ১৬৫+ |
| পাবলিক পেজ | ২৮টি |
| অ্যাডমিন পেজ | ৪১টি |
| API রাউট | ৭টি |
| ডাটা মডেল (Interface) | ৪৫+ টি |
| সাপোর্টেড ভাষা | ৩টি (বাংলা, English, العربية) |
| কম্পোনেন্ট | ৯০+ টি |
| Dependencies | ৬৯টি |
| DevDependencies | ৯টি |

---

<a id="creator"></a>
## 🤝 তৈরিকারক

**মাহমুদপুর (উত্তর চন্দন পারুলিয়া) আশরাফুল ঊলূম মাদ্রাসা**

এই প্রজেক্টটি কওমি মাদরাসার জন্য একটি পূর্ণাঙ্গ ওয়েব ভিত্তিক ম্যানেজমেন্ট সিস্টেম হিসেবে তৈরি করা হয়েছে।

---

<div align="center">

**بسم الله الرحمن الرحيم**

**মাহমুদপুর (উত্তর চন্দন পারুলিয়া) আশরাফুল ঊলূম মাদ্রাসা**
কুরআন ও সুন্নাহর আলোকে পরিচালিত স্বনামধন্য কওমি মাদরাসা

</div>
