# 🚀 GitHub + Cloudflare Pages ডিপ্লয় গাইড

এই প্রজেক্ট **Next.js Static Export** ব্যবহার করে — `npm run build` চালালে `out/`
ফোল্ডারে সম্পূর্ণ static ওয়েবসাইট তৈরি হয়, যা Cloudflare Pages-এ সরাসরি হোস্ট করা যায়।

---

## 📋 ধাপ ১: লোকালি বিল্ড পরীক্ষা (ঐচ্ছিক কিন্তু সুপারিশকৃত)

```bash
npm install     # প্রথমবার (বা bun install)
npm run build   # out/ ফোল্ডার তৈরি হবে
npm start       # out/ ফোল্ডার লোকালি প্রিভিউ করুন
```

> ✅ `out/` ফোল্ডারে দেখবেন: `index.html`, `about/index.html`, `admin/index.html`,
> `404.html`, `_redirects`, `_headers`, `_next/` — এগুলোই আপনার সম্পূর্ণ সাইট।

---

## 📤 ধাপ ২: GitHub রিপোতে আপলোড

### উপায় ক — Git কমান্ড দিয়ে (সুপারিশকৃত)

```bash
# প্রজেক্ট ফোল্ডারে যান
cd madrasah-website-source

# Git শুরু করুন
git init
git add .
git commit -m "Madrasah website - initial commit"

# GitHub এ নতুন রিপো তৈরি করুন (https://github.com/new)
# রিপোর নাম যেমন: madrasah-website
# তারপর remote যোগ করে পুশ করুন:
git branch -M main
git remote add origin https://github.com/আপনার-ইউজারনেম/madrasah-website.git
git push -u origin main
```

### উপায় খ — GitHub ওয়েবসাইট দিয়ে (কমান্ড ছাড়া)

1. https://github.com/new এ যান → রিপো নাম দিন → **Create repository**
2. রিপো পেজে **"uploading an existing file"** লিংকে ক্লিক করুন
3. zip ফাইলের ভেতরের সব ফাইল/ফোল্ডার drag & drop করুন
4. **Commit changes** ক্লিক করুন

> ⚠️ খেয়াল রাখুন: zip এর ভেতরের `madrasah-website-source` ফোল্ডারের **ভেতরের** ফাইলগুলো
> আপলোড করবেন, যেন `package.json` রিপোর রুটে থাকে।

---

## ☁️ ধাপ ৩: Cloudflare Pages সেটআপ

1. https://dash.cloudflare.com এ লগইন করুন
2. বাম মেনু থেকে **Workers & Pages** → **Create** → **Pages** ট্যাব
3. **"Connect to Git"** → **GitHub** নির্বাচন করে রিপোটি সিলেক্ট করুন
4. **"Begin setup"** এর আগে নিচের কনফিগ দিন:

### Build configuration (আপনার নির্দিষ্ট সেটিং)

| ফিল্ড | মান |
|---|---|
| **Project name** | যেমন: `madrasah-website` (সাইটের URL হবে `madrasah-website.pages.dev`) |
| **Production branch** | `main` |
| **Framework preset** | `None` ⚠️ |
| **Build command** | `npm run build` |
| **Build output directory** | `out` |
| **Root directory** | (খালি রাখুন) |

> ⚠️ **গুরুত্বপূর্ণ:** Framework preset অবশ্যই `None` রাখবেন।
> "Next.js" প্রিসেট দিলে Cloudflare `@cloudflare/next-on-pages` চালায় যা এই
> static export প্রজেক্টের সাথে অসামঞ্জস্যপূর্ণ — বিল্ড ফেল করবে।

### Environment Variables (ঐচ্ছিক)

**Settings → Variables and Secrets** এ (Production ও Preview — দুটোতেই):

| Key | Value | প্রয়োজন |
|---|---|---|
| `NODE_VERSION` | `22` | সুপারিশকৃত (`.nvmrc` থাকায় ছাড়াও চলে) |
| `NEXT_PUBLIC_FIREBASE_*` | `.env.example` দেখুন | ঐচ্ছিক — না দিলে built-in ডিফল্ট Firebase ব্যবহৃত হবে |

5. **"Save and Deploy"** ক্লিক করুন

⏱️ বিল্ডে ৩–৬ মিনিট সময় লাগতে পারে। সফল হলে `https://<project-name>.pages.dev` লাইভ হবে।

---

## 🔄 ভবিষ্যতে আপডেট দেওয়া

GitHub রিপোতে নতুন commit পুশ করলেই Cloudflare Pages **স্বয়ংক্রিয়ভাবে** নতুন করে
বিল্ড ও ডিপ্লয় করবে:

```bash
# কোড এডিট করার পর:
git add .
git commit -m "আপডেট: কী পরিবর্তন করেছেন"
git push
```

---

## 🆘 সমস্যা হলে

| সমস্যা | সমাধান |
|---|---|
| Build fail: "Cannot find module" | Framework preset `None` কিনা ও Root directory খালি কিনা দেখুন |
| Build fail: Node version এরর | Environment variable `NODE_VERSION=22` যোগ করুন |
| সাইটে গভীর লিংক (যেমন `/about`) 404 দেয় | `out/_redirects` ফাইল আছে কিনা চেক করুন (রিপোর `public/_redirects` থেকে আসে) |
| ডাটা লোড হচ্ছে না | Firebase Realtime Database এর rules (`.read`/`.write`) ও `database.rules.json` যাচাই করুন |
| কাস্টম ডোমেইন | Pages প্রজেক্ট → **Custom domains** → ডোমেইন যোগ করুন (DNS Cloudflare-এ থাকলে অটো-কনফিগ) |

---

## 📁 ফাইল স্ট্রাকচার (ডিপ্লয় সংক্রান্ত)

```
madrasah-website-source/
├── src/                  # সম্পূর্ণ সোর্স কোড
├── public/               # Static অ্যাসেট (লোগো, ভিডিও, ফন্ট, _redirects, _headers)
├── next.config.ts        # output: "export" (প্রোডাকশনে) → out/ তৈরি হয়
├── package.json          # npm run build → next build --webpack
├── .nvmrc                # Node 22 (Cloudflare স্বয়ংক্রিয়ভাবে পড়ে)
├── .env.example          # Firebase env ভেরিয়েবলের টেমপ্লেট
├── database.rules.json   # Firebase Realtime Database rules
├── db/                   # ডাটা ব্যাকআপ (নিরাপত্তার জন্য)
└── README.md             # সম্পূর্ণ প্রজেক্ট ডকুমেন্টেশন
```
