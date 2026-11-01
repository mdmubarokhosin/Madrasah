# MASTER_GUIDE.md
# Editable AI Coding Agent Master Guide
# স্থায়ী নিয়ম + প্রজেক্ট কাস্টমাইজেশন টেমপ্লেট

> **কীভাবে ব্যবহার করবেন:** এই ফাইলটি প্রজেক্টের root folder-এ রাখুন। নতুন প্রজেক্টে ব্যবহার করার আগে `PROJECT CONFIGURATION` অংশটি পূরণ/সম্পাদনা করুন। `PERMANENT AGENT RULES` অংশে কেবল আপনার স্থায়ী কাজের নিয়ম পরিবর্তন করুন।
>
> **Template rule:** `[EDIT ME: ...]` লেখা মানে সেখানে আপনার প্রজেক্ট অনুযায়ী তথ্য বসাতে হবে। কোনো placeholder যাচাই না করে সত্য হিসেবে ধরে নেওয়া যাবে না।
>
> **File protection note:** নির্দেশনা এজেন্টকে ফাইলটি না মুছতে বলবে, কিন্তু শুধু Markdown দিয়ে প্রযুক্তিগতভাবে deletion আটকানো যায় না। Git permissions, protected branch ও review rules দিয়ে আলাদা সুরক্ষা দিন।

---

# PART A — PERMANENT AGENT RULES
# এই নিয়মগুলো প্রতিটি প্রজেক্টে প্রযোজ্য

## A1. Read This File First

প্রতিটি নতুন session, task, bug fix, redesign, refactor, test বা deployment-related কাজের আগে:

1. সম্পূর্ণ `MASTER_GUIDE.md` পড়ুন।
2. বর্তমান repository, project instructions এবং প্রাসঙ্গিক documentation পড়ুন।
3. Git status, current branch, recent changes এবং uncommitted user changes পরীক্ষা করুন।
4. কাজের scope, বিদ্যমান আচরণ, ঝুঁকি এবং verification plan বুঝে তারপর পরিবর্তন শুরু করুন।
5. এই ফাইলে লেখা পুরোনো তথ্যকে অন্ধভাবে সত্য ধরে নেবেন না; প্রকৃত code/configuration থেকে যাচাই করুন।

যদি ফাইলটি পড়তে না পারেন, কোড পরিবর্তন শুরু না করে সমস্যাটি জানান।

## A2. Preserve This Guide

- এই ফাইলটি project root-এ `MASTER_GUIDE.md` নামে সংরক্ষণ করুন।
- ব্যবহারকারী স্পষ্টভাবে অনুমোদন না দিলে ফাইলটি delete, rename, move, truncate, replace, বা version control থেকে remove করবেন না।
- কোনো task সহজ করার জন্য নিয়ম মুছবেন বা দুর্বল করবেন না।
- গাইড আপডেটের প্রয়োজন হলে বিদ্যমান তথ্য রেখে কেবল প্রয়োজনীয় পরিবর্তন করুন এবং শেষে diff পরীক্ষা করুন।
- নতুন session-এ আবার এই ফাইল পড়ুন; আগের conversation-এর ওপর নির্ভর করবেন না।
- এই গাইডের পাশাপাশি প্রজেক্টে থাকলে `README.md`, `PROJECT_AUDIT_REPORT.md`, `PROJECT_STATUS.md` এবং framework-specific instructions-ও পড়ুন।
- কোনো tool বা script এই ফাইল মুছতে/overwrite করতে চাইলে সেই operation থামিয়ে ফাইলটি সংরক্ষণ করুন।

**বাস্তব সীমাবদ্ধতা:** write permission থাকা এজেন্টকে শুধু Markdown দিয়ে ফাইল মুছতে প্রযুক্তিগতভাবে বাধা দেওয়া যায় না। GitHub/GitLab permissions, protected branch, required review এবং CI checks ব্যবহার করুন।

## A3. Inspect Before Editing — Never Guess

যেকোনো গুরুত্বপূর্ণ পরিবর্তনের আগে:

- Project tree, README, package manifest, lockfile, framework configuration, build scripts, tests, CI, hosting configuration এবং environment variable references পরীক্ষা করুন।
- বর্তমান framework, language, package manager, database, authentication, API, admin panel এবং deployment setup যাচাই করুন।
- গুরুত্বপূর্ণ routes/pages, shared components, forms, navigation, media assets, responsive states, loading/error/empty states এবং user flows পরীক্ষা করুন।
- বিদ্যমান কাজ করা features এবং data flow-এর inventory তৈরি করুন।
- সম্ভব হলে পরিবর্তনের আগে typecheck, lint, tests ও build চালিয়ে baseline result নথিভুক্ত করুন।
- repository access বা কোনো external service unavailable হলে সেটি স্পষ্টভাবে জানান; inspection হয়েছে বলে মিথ্যা দাবি করবেন না।

## A4. Audit-First Workflow

বড় redesign বা broad refactor-এর ক্ষেত্রে:

### Phase 1 — Audit

- UI/UX, routes, features, data flow, database, authentication, admin panel, integrations, security, accessibility, performance, SEO, responsiveness এবং deployment পরীক্ষা করুন।
- প্রতিটি issue-এর severity, evidence, affected file/route, impact এবং recommended fix লিখুন।
- verified defect, সম্ভাব্য ঝুঁকি এবং improvement suggestion আলাদা করুন।
- `PROJECT_AUDIT_REPORT.md` তৈরি করুন।
- ব্যবহারকারী যদি “শুধু audit” চান, application code পরিবর্তন করবেন না।

### Phase 2 — Plan

- Audit findings থেকে priority অনুযায়ী implementation plan তৈরি করুন।
- Critical security/data-integrity issue আগে ঠিক করুন।
- কাজকে ছোট, যাচাইযোগ্য ধাপে ভাগ করুন।
- কোন existing feature অক্ষত রাখতে হবে তা নির্দিষ্ট করুন।

### Phase 3 — Implement

- বর্তমান codebase বুঝে targeted change করুন।
- working features, routes, data, APIs, authentication, admin workflows এবং integrations সংরক্ষণ করুন।
- অপ্রয়োজনীয় full rewrite বা technology migration এড়িয়ে চলুন।
- প্রয়োজনীয় Skill/tool থাকলে ব্যবহার করুন; ইনস্টলেশন সম্ভব না হলে তা জানান এবং বিকল্প পদ্ধতি ব্যাখ্যা করুন।

### Phase 4 — Verify

- Relevant tests, typecheck, lint, production build, browser checks এবং responsive checks চালান।
- পরিবর্তিত routes ও end-to-end user flows পুনরায় পরীক্ষা করুন।
- নিজের পরিবর্তনে তৈরি regression ঠিক করুন।
- Documentation, audit report ও project status update করুন।
- Final report-এ বাস্তবে যা যাচাই করেছেন শুধু সেটিই দাবি করুন।

## A5. Use Skills and Tools Responsibly

- ব্যবহারকারী কোনো Skill install/use করতে বললে প্রথমে সেই Skill-এর official instructions ও compatibility যাচাই করুন।
- Skill-এর নির্দেশনা পড়ে project requirements অনুযায়ী প্রয়োগ করুন; অন্ধভাবে কোনো command চালাবেন না।
- Installation বা tool access-এর জন্য user permission প্রয়োজন হলে অনুমতি চান।
- অপ্রাসঙ্গিক Skill install করবেন না এবং কোনো Skill ব্যবহার না করেও ব্যবহার করেছেন বলে দাবি করবেন না।
- External asset, library, API বা service ব্যবহার করলে license, availability, compatibility, security ও performance বিবেচনা করুন।
- Project-specific Skill configuration নিচের `PROJECT CONFIGURATION` অংশে রাখুন।

## A6. Design Quality — Production Website, Not Just a Mockup

- আধুনিক, পরিপাটি, বিশ্বাসযোগ্য, consistent এবং brand-appropriate design তৈরি করুন।
- Typography, spacing, hierarchy, alignment, contrast, navigation, responsive layouts এবং reusable design tokens উন্নত করুন।
- ব্যবহারকারীর পুরোনো সাইট/reference থাকলে সেটি বিশ্লেষণ করুন; গুরুত্বপূর্ণ identity, content ও useful patterns সংরক্ষণ করে উন্নত করুন।
- শুধু screenshot সুন্দর করা নয়—বাস্তব content, loading, empty, success, validation ও error states-ও ডিজাইন করুন।
- Card, section, heading, form এবং navigation-এর alignment ধারাবাহিক রাখুন।
- Mobile, tablet, laptop এবং desktop-এ পরীক্ষা করুন; horizontal overflow বা clipped content যেন না থাকে।
- Accessible semantic HTML, keyboard navigation, visible focus, appropriate contrast, labels ও alt text নিশ্চিত করুন।
- `prefers-reduced-motion` সমর্থন করুন এবং অপ্রয়োজনীয় animation এড়িয়ে চলুন।
- Placeholder content, fake statistics, invented testimonials বা misleading claims production-এ রাখবেন না।
- Design reference থাকলে তার ব্যবহার অনুমোদিত কি না যাচাই করুন।

## A7. Functional Integrity — Every Control Must Work

- Buttons, links, forms, menus, search, filters, pagination, dialogs, charts, video controls এবং admin actions-এর বাস্তব আচরণ পরীক্ষা করুন।
- শুধু visual element বানিয়ে কার্যকর বলে দাবি করবেন না।
- Live data-এর জায়গায় hardcoded demo data বসাবেন না, যদি না ব্যবহারকারী স্পষ্টভাবে demo mode চান।
- Authentication, authorization, validation, persistence, API contracts ও database rules অকারণে পরিবর্তন করবেন না।
- প্রতিটি গুরুত্বপূর্ণ form-এর validation, loading, success ও failure behavior যাচাই করুন।
- Deep links, direct route load এবং refresh behavior পরীক্ষা করুন।
- কোনো feature বাদ দিতে হলে কারণ, প্রভাব এবং প্রয়োজনীয় অনুমোদন নিন।
- নতুন feature-এর জন্য প্রয়োজনীয় backend, database rules, error handling এবং tests-ও তৈরি করুন।

## A8. Architecture and Code Quality

- বর্তমান framework conventions ও architecture অনুসরণ করুন।
- Package manager এবং lockfile অকারণে পরিবর্তন করবেন না।
- Dependency যোগ/upgrade করার আগে compatibility, maintenance, security, license এবং bundle size যাচাই করুন।
- Type errors, lint failures বা tests এড়াতে rule disable, broad `any`, fake test বা unsafe suppression ব্যবহার করবেন না।
- Secrets client bundle-এ পাঠাবেন না।
- Server-only logic server-side-এ রাখুন।
- Input validation, meaningful error handling, reusable components এবং readable naming ব্যবহার করুন।
- Unrelated refactor এড়িয়ে চলুন।
- Architectural migration প্রয়োজন হলে কারণ ও impact নথিভুক্ত করুন।

## A9. Security, Privacy and Data Integrity

- Password, token, private key, production secret, private environment file বা ব্যক্তিগত তথ্য source code, Git, log, screenshot, report কিংবা ZIP-এ প্রকাশ করবেন না।
- `.env.example`-এ শুধু variable names এবং clearly fake example values রাখুন।
- Authentication ও authorization server-side এবং least-privilege principle অনুযায়ী যাচাই করুন।
- Client-side validation-কে একমাত্র security control হিসেবে ব্যবহার করবেন না।
- Database/security rules দুর্বল করে UI কাজ করাবেন না।
- Production data delete/overwrite, destructive migration, bulk operation, credential rotation বা production deployment-এর মতো high-impact কাজের আগে প্রয়োজনীয় authorization নিন।
- Backup/recovery plan ছাড়া irreversible change করবেন না।
- Secret leak পেলে secret-টি output-এ কপি করবেন না; নিরাপদভাবে location ও remediation জানান।
- Security concern যাচাই করা না গেলে “not verified” বলে জানান।

## A10. Images, Videos, Fonts and Other Media

- Media ব্যবহার করার আগে website-এর context, composition, aspect ratio, quality, license এবং performance বিবেচনা করুন।
- ব্যবহারকারী OpenArt বা অন্য নির্দিষ্ট generator ব্যবহার করতে নিষেধ করলে সেটি ব্যবহার করবেন না।
- User-এর নির্দেশ অনুযায়ী reputable source থেকে relevant image/video সংগ্রহ করা যায়, তবে license/usage rights যাচাই করতে হবে।
- Remote media link ব্যবহার করলে hotlinking, CORS, availability, bandwidth, domain restrictions ও fallback behavior পরীক্ষা করুন।
- কোনো নির্দিষ্ট domain বা absolute path-এর ওপর অপ্রয়োজনীয় নির্ভরতা তৈরি করবেন না; project requirement অনুযায়ী configurable base URL, relative asset path বা stable hosting strategy বেছে নিন।
- Video-এর জন্য poster, loading strategy, autoplay/muted/playsinline behavior, captions (যেখানে প্রয়োজন), reduced-motion/accessibility এবং mobile fallback বিবেচনা করুন।
- Video load ব্যর্থ হলে পুরো section ভেঙে পড়বে না; fallback image/color/content রাখুন।
- Remotion ব্যবহার করতে বলা হলে বাস্তবে renderable composition, render command, output asset এবং integration পরীক্ষা করুন।
- কোনো image/video তৈরি, download বা render না করেও তা সম্পন্ন হয়েছে বলে দাবি করবেন না।
- License অস্পষ্ট হলে asset-টি production-এর জন্য নিরাপদ বলে ঘোষণা করবেন না।

## A11. Database, Firebase and Admin Panel

যদি project-এ Firebase বা অন্য backend থাকে:

- বর্তমান schema, collections/tables, rules, indexes, auth flow, storage, functions এবং data dependencies বিশ্লেষণ করুন।
- Existing data structure অকারণে ভাঙবেন না; migration প্রয়োজন হলে পরিকল্পনা ও recovery approach লিখুন।
- Admin panel-এর প্রতিটি page/action-এর permission, loading, empty, success এবং error states পরীক্ষা করুন।
- Public site ও admin panel-এর access control যথাযথভাবে আলাদা রাখুন।
- UI থেকে admin route link লুকিয়ে রাখা security নয়; server/backend rules দিয়ে authorization enforce করুন।
- Backup & Sync feature থাকলে backup format, validation, restore preview, error handling, permission এবং destructive overwrite safeguards পরীক্ষা করুন।
- Production database write বা destructive test চালানোর আগে authorization ও safe test environment নিশ্চিত করুন।
- Firebase ব্যবহৃত হয়েছে বলে দাবি করার আগে actual configuration ও data flow যাচাই করুন।

## A12. Hosting and Deployment

- Hosting platform ও build configuration সবসময় actual repository এবং user-provided current settings থেকে যাচাই করুন।
- Build command, output directory, root directory, framework adapter, runtime compatibility, routing, redirects, environment bindings এবং asset paths পরীক্ষা করুন।
- এক project-এর configuration অন্য project-এ যাচাই ছাড়া কপি করবেন না।
- Local build success মানেই production deployment success নয়।
- User authorization ছাড়া production settings পরিবর্তন বা deployment করবেন না।
- Deployment সফল বলে দাবি করার আগে provider result এবং live URL যাচাই করুন।
- কোনো environment variable-এর secret value এই guide বা source control-এ রাখবেন না।
- Hosting platform বদলালে compatibility, server-side behavior, data persistence এবং rollback পরিকল্পনা যাচাই করুন।

## A13. Performance, Accessibility and SEO

- Image optimization, video loading, font loading, JavaScript bundle, render loops, caching এবং third-party scripts পরীক্ষা করুন।
- প্রয়োজন ছাড়া heavy library বা client-side code যোগ করবেন না।
- Core content দ্রুত দৃশ্যমান করার চেষ্টা করুন; layout shift ও blocking work কমান।
- Keyboard access, focus, semantic headings, labels, alt text, contrast, reduced motion এবং touch targets যাচাই করুন।
- SEO title, description, canonical, social metadata, sitemap, robots directives এবং route status প্রাসঙ্গিক হলে পরীক্ষা করুন।
- Existing content ও search visibility অকারণে নষ্ট করবেন না।
- Lighthouse, Core Web Vitals বা load-time numbers বাস্তবে না মেপে তৈরি করবেন না।

## A14. Git and User Changes

- Edit-এর আগে `git status` পরীক্ষা করুন।
- ব্যবহারকারীর uncommitted changes overwrite বা discard করবেন না।
- অনুমতি ছাড়া `git reset --hard`, force push, mass deletion বা destructive Git command চালাবেন না।
- পরিবর্তন শেষে `git diff` review করুন।
- শুধু task-এর সঙ্গে সম্পর্কিত ফাইল পরিবর্তন করুন।
- `MASTER_GUIDE.md` delete/rename/move বা version control থেকে remove করবেন না।
- GitHub branch protection, pull request review এবং repository permissions ব্যবহার করুন যেখানে উপলভ্য।

## A15. Verification Status Rules

প্রতিটি গুরুত্বপূর্ণ check-এর জন্য নিচের একটি status ব্যবহার করুন:

- **PASS** — check চালানো হয়েছে এবং সফল।
- **FAIL** — check চালানো হয়েছে এবং ব্যর্থ; সংক্ষিপ্ত error জানান।
- **BLOCKED** — environment, access বা dependency-এর কারণে চালানো যায়নি।
- **NOT RUN** — চালানো হয়নি; কারণ জানান।

“সব test pass” বলবেন না যদি কিছু test চালানো না হয়ে থাকে। আগে থেকেই থাকা failure এবং নিজের পরিবর্তনে তৈরি failure আলাদা করে উল্লেখ করুন।

## A16. Keep Project Memory Current

স্থায়ী সিদ্ধান্ত ও task progress সংরক্ষণ করুন, কিন্তু secrets বা অপ্রয়োজনীয় sensitive data নয়।

- বড় task-এর শেষে `PROJECT_STATUS.md` আপডেট করুন, যদি এই project-এ ব্যবহার করা হয়।
- Verified architecture/deployment changes এই guide-এর project configuration-এ update করুন।
- গুরুত্বপূর্ণ সিদ্ধান্ত `DECISION LOG`-এ লিখুন।
- অসমাপ্ত কাজ, blocker ও next step স্পষ্টভাবে লিখুন।
- Status update-এ date এবং verification evidence রাখুন।
- কোনো তথ্য যাচাই না হলে সেটিকে `UNVERIFIED` চিহ্নিত করুন।

## A17. Final Delivery and Honest Reporting

প্রতিটি substantial task-এর শেষে রিপোর্ট দিন:

1. কী পরিবর্তন করা হয়েছে এবং কেন।
2. কোন গুরুত্বপূর্ণ ফাইল পরিবর্তিত হয়েছে।
3. কোন feature যোগ/পরিবর্তন/সংরক্ষণ করা হয়েছে।
4. Tests/build/lint/typecheck-এর প্রকৃত ফলাফল।
5. Security ও deployment যাচাইয়ের ফলাফল।
6. বাকি সমস্যা, limitation এবং unverified behavior।
7. Deliverable-এর প্রকৃত file path এবং কাজ করা link।
8. Guide/status file update করা হয়েছে কি না।

ZIP deliverable চাওয়া হলে:

- Production-ready, ভবিষ্যতে সম্পাদনাযোগ্য source code অন্তর্ভুক্ত করুন।
- `.git`, `node_modules`, caches, build output এবং অপ্রয়োজনীয় temporary files বাদ দিন, যদি delivery requirements-এ দরকার না থাকে।
- প্রয়োজনীয় source, config, lockfile, documentation এবং safe example env file রাখুন।
- ZIP তৈরি করার পর archive listing ও integrity পরীক্ষা করুন।
- ব্যবহারকারী Gofile.io চাইলে সেখানে upload করে বাস্তব download URL যাচাই করুন।
- Upload/verification সম্ভব না হলে সরাসরি জানান; কোনো fake link তৈরি করবেন না।
- ZIP-এর মধ্যে secrets বা private environment values আছে কি না পরীক্ষা করুন।

## A18. Continue Until the Authorized Task Is Complete

- কাজ মাঝপথে থেমে গেলে বর্তমান অবস্থা, বাধা এবং পরবর্তী concrete step নথিভুক্ত করুন।
- ব্যবহারকারী “continue” বা “কাজ চালিয়ে যান” বললে আগের verified status থেকে কাজ চালিয়ে যান; শুরু থেকে অপ্রয়োজনীয়ভাবে পুনরাবৃত্তি করবেন না।
- Task scope-এর মধ্যে নিরাপদ ও সম্ভব কাজ বাকি থাকলে শুধু পরিকল্পনা দিয়ে থেমে যাবেন না—বাস্তব implementation ও verification চালিয়ে যান।
- Tool limitation, unavailable access, quota, missing authorization বা external outage থাকলে তা স্পষ্ট করে জানান।
- কোনো অনুমোদনহীন destructive action-এর জন্য কাজ চালিয়ে যাবেন না; নিরাপদ অংশ সম্পন্ন করে approval চাইুন।

---

# PART B — PROJECT CONFIGURATION
# এই অংশ প্রতিটি project অনুযায়ী সম্পাদনা করুন

> **Agent:** নিচের fields-গুলো ব্যবহারকারীর project configuration। `EDIT ME` placeholder থাকলে repository ও user input থেকে যাচাই করে পূরণ করুন। অনুমানকে fact হিসেবে লিখবেন না।

## B1. Project Identity

- **Project name:** `কওমি মাদরাসা ম্যানেজমেন্ট সিস্টেম` — প্রকৃত নাম: মাহমুদপুর (উত্তর চন্দন পারুলিয়া) আশরাফুল ঊলূম মাদ্রাসা (VERIFIED 2026-10-30: README.md, package.json name `qawmi-madrasa-website`)
- **Project type:** `কওমি মাদরাসা ম্যানেজমেন্ট সিস্টেম` — পূর্ণাঙ্গ ওয়েব ম্যানেজমেন্ট সিস্টেম: পাবলিক সাইট + অ্যাডমিন প্যানেল + স্টুডেন্ট পোর্টাল + পেমেন্ট (VERIFIED 2026-10-30)
- **Main repository URL:** `https://github.com/mdmubarokhosin/Madrasah.git` (VERIFIED 2026-10-30: cloned, branch `main`, HEAD `13c8fec`)
- **Reference/old website repository:** `[EDIT ME: URL or NONE — user input needed]`
- **Live website URL:** `https://madrasahbd.pages.dev/` (VERIFIED 2026-10-30: HTTP 200, Cloudflare, `lang="bn"` HTML)
- **Primary language(s):** `বাংলা (bn, ডিফল্ট), English (en), العربية (ar — RTL)` (VERIFIED 2026-10-30: layout.tsx `lang="bn"`, i18n.ts, README)
- **Target audience:** `কুরআন ও সুন্নাহর আলোকে` (user-provided; সাইট স্লোগান হিসেবে VERIFIED; প্রকৃত দর্শক কে — UNVERIFIED, user নিশ্চিত করুন)
- **Main objective:** মাদরাসার প্রশাসনিক, একাডেমিক ও আর্থিক কার্যক্রম ডিজিটালভাবে পরিচালনা (VERIFIED 2026-10-30: README.md প্রজেক্ট পরিচিতি; user-এর নিজের ভাষায় objective দিলে আরও ভালো)
- **Must preserve:** existing pages, features, data, brand, integrations — যাচাইকৃত inventory: ২৮ public পেজ, ৪১ admin পেজ, স্টুডেন্ট পোর্টাল, Firebase RTDB ডাটা, QR/manual payment methods (Bohudur gateway সম্পূর্ণ অপসারিত — session ৮, user নির্দেশে), GitHub media upload, PWA, ত্রিভাষিক ব্যবস্থা (VERIFIED 2026-10-30; হালনাগাদ 2026-10-30 session ৮)

## B2. Required Skills, Tools and Documentation

- **Required skills:** `10k-websites` — VERIFIED 2026-10-30: `skills/10k-websites`-এ ইনস্টল আছে এবং user-এর uploaded zip-এর সঙ্গে মিলে (installed copy-তে অতিরিক্ত `tools/usage.mjs`, যা SKILL.md নিজেই reference করে)। সতর্কতা: এই skill-এর scope হলো cinematic plain HTML/CSS/JS সাইট (OpenArt + Hostinger); বর্তমান প্রজেক্ট Next.js + Firebase + Cloudflare — তাই এটি শুধু user আলাদা cinematic সাইট workflow চাইলে প্রযোজ্য
- **UI component library (user-নির্দেশিত):** `HeroUI v3` (`@heroui/react` + `@heroui/styles`, peer: `react-aria-components`) — VERIFIED 2026-10-30 (session ৫): v3.2.7 ইনস্টল। **বাধ্যতামূলক নিয়ম — barrel import নিষিদ্ধ:** `import { X } from '@heroui/react'` লিখলে dev compile OOM হয় (555 exports); সবসময় sub-path import ব্যবহার করুন — `@heroui/react/button`, `/card`, `/chip`, `/typography`, `/input`, `/textarea`, `/close-button`। থিম: `globals.css`-এ selective CSS imports + Islamic oklch overrides। শেয়ার্ড কিট: `src/components/heroui/islamic.tsx` (HButton/HCard/HChip/StarBurst/GoldRule/IconMedallion)
- **Framework/docs to consult:** Next.js 16 (nextjs.org/docs), Firebase 12 RTDB+Auth (firebase.google.com/docs), Tailwind CSS 4 (tailwindcss.com/docs), HeroUI v3 (heroui.com/docs/react), shadcn/ui (ui.shadcn.com), Cloudflare Pages Functions (developers.cloudflare.com/pages/functions/) (VERIFIED 2026-10-30: package.json, next.config.ts; HeroUI session ৫)
- **Design tools:** `[NONE]`
- **Video generation/rendering:** Remotion — repo-তে নেই (VERIFIED 2026-10-30: package.json-এ remotion নেই); প্রয়োজন হলে user-এর সম্মতি নিয়ে যোগ করতে হবে
- **Image/video sourcing rules:** `[সব সময় আপনি ভিডিও ও ইমেজ নিজে নিজে থেকে তৈরি করবেন]` (user-এর স্থায়ী নিয়ম)
- **Required installation steps:** VERIFIED 2026-10-30: `npm install` (repo-তে package-lock.json আছে) বা `bun install`; `cp .env.example .env` করে Firebase config বসানো; dev: `npm run dev` / `bun run dev` (sandbox-এ `--webpack` প্রয়োজন — Turbopack dev-এ next/font/google ত্রুটি); build: `next build` (static export → `out/`)
- **If unavailable:** Explain the blocker and use an approved alternative only if appropriate.

Do not assume a named Skill exists or is already installed. Verify its exact name, official instructions, and availability.

## B3. Design and Brand Direction

- **Design goal:** `Islamic, modern, elegant; সবুজ-সোনালি (green-golden) থিম; mobile-first ম্যানেজমেন্ট সিস্টেম` — session ৫: HeroUI v3 ডিজাইন সিস্টেম + Islamic oklch থিম; public সেকশন HeroUI কম্পোনেন্টে রূপান্তরিত (VERIFIED 2026-10-30: README "ইসলামিক থিম, গ্রিন-গোল্ডেন কালার স্কিম" + browser test)
- **Reference website(s):** `[None — user নিশ্চিত করেননি]`
- **Reference images/files:** `public/logo.png` (লোগো), `public/islamic-pattern.png`, `public/videos/` (hero/about/banner seamless loops — hero-bg.png/classroom.png session ৩-এ ভিডিও দ্বারা প্রতিস্থাপিত) (VERIFIED 2026-10-30: public/ ফোল্ডার)
- **Existing brand elements to preserve:** লোগো, বাংলা সাইট নাম ও স্লোগান, সবুজ-সোনালি থিম, ত্রিভাষিক ভাষা সুইচার (VERIFIED 2026-10-30)
- **Primary color:** গাঢ় সবুজ `hsl(144, 100%, 18%)`; PWA theme `#166534` (VERIFIED 2026-10-30: globals.css `--primary`, manifest.json)
- **Secondary/accent color:** সোনালি `hsl(41, 65%, 67%)`; secondary হালকা সবুজ `hsl(129, 42%, 94%)` (VERIFIED 2026-10-30: globals.css)
- **Background color:** সাদা `hsl(0, 0%, 100%)` (VERIFIED 2026-10-30: globals.css)
- **Text color:** প্রায়-কালো `hsl(120, 4%, 9%)` (VERIFIED 2026-10-30: globals.css `--foreground`)
- **Card/surface color:** সাদা `hsl(0, 0%, 100%)`, border `hsl(129, 18%, 86%)` (VERIFIED 2026-10-30: globals.css)
- **Typography:** Noto Sans Bengali (bn) + Noto Sans Arabic (ar), weight 300–800, `next/font/google`, variables `--font-bengali`/`--font-arabic` (VERIFIED 2026-10-30: layout.tsx)
- **Icon library:** `lucide-react` (VERIFIED 2026-10-30: package.json) — নোট: পুরোনো লেখা "bootstrap icons" ছিল, repo-তে bootstrap icons নেই
- **Animation style:** Framer Motion (VERIFIED 2026-10-30: package.json + components) — নোট: পুরোনো লেখা "10k websites" ছিল; এই প্রজেক্ট 10k-websites engine ব্যবহার করে না
- **Card/content alignment preferences:** `[EDIT ME]`
- **Footer requirements:** `[EDIT ME]`
- **Mobile/tablet/desktop requirements:** Fully responsive (browser test 2026-10-30: 390px-এ horizontal overflow নেই); PWA: manifest.json + sw.js (VERIFIED 2026-10-30)
- **Do not use:** `[EDIT ME: unwanted colors, patterns, tools, visual styles, assets]`

### Example palette (edit or remove)

```css
:root {
  --background-color: #f8fafc;
  --text-color: #0f172a;
  --accent-color: #06b6d4;
  --card-bg: #ffffff;
}
```

Use these colors only if they are the selected project palette. Derive supporting colors with consistent contrast; do not assume this example is mandatory for every project.

## B4. Content, Media and Assets

- **Name/brand spelling:** বাংলা: মাহমুদপুর (উত্তর চন্দন পারুলিয়া) আশরাফুল ঊলূম মাদ্রাসা (VERIFIED 2026-10-30: layout.tsx metadata); English/Arabic রূপ Admin → Settings → Site Info-তে Firebase-এ সেট হয় (README v2.0)
- **Logo requirements:** `public/logo.png` (একটি PNG; PWA icons 192/512 এটিই ব্যবহার করে) (VERIFIED 2026-10-30: manifest.json); light/dark variant নেই — প্রয়োজন কি না UNVERIFIED
- **Images:** নিজস্ব ছবি public/-তে; ডাইনামিক ছবি (gallery ইত্যাদি) GitHub API দিয়ে user-এর repo-তে upload হয় (VERIFIED 2026-10-30: src/lib/db-service.ts `uploadToGithub`, Firebase `githubConfig`)
- **Videos:** বর্তমানে repo-তে কোনো video asset নেই (VERIFIED 2026-10-30: public/ inspection)
- **Generated video requirement:** নেই (VERIFIED 2026-10-30: package.json)
- **Video output formats:** `[EDIT ME: প্রয়োজন হলে]`
- **Avoid:** `[EDIT ME]`
- **Fallback behavior:** Provide appropriate poster/image/color fallback if media fails.
- **External asset dependency:** Firebase (ডাটা), GitHub (media hosting); নিজস্ব asset সব relative path-এ (VERIFIED 2026-10-30; Bohudur অপসারিত session ৮)

Do not force images to become videos everywhere. Use video where it adds value and does not harm performance, accessibility, usability, or mobile experience.

## B5. Pages, Features and User Flows

- **Required public pages:** VERIFIED 2026-10-30 (src/app/[[...slug]]/page.tsx generateStaticParams + README): `/`, `/about`, `/departments`, `/teachers`, `/admission`, `/notices`, `/events`, `/gallery`, `/donation`, `/blog`, `/contact`, `/results`, `/syllabus`, `/class-routine`, `/hifz`, `/exam`, `/calendar`, `/alumni`, `/prayer`, `/hadith`, `/quran`, `/fee-payment`, `/admission-track`, `/library`, `/attendance`, `/hostel`, `/dawah`, `/materials`, `/student`, `/payment/success`, `/payment/cancel` + URL aliases (student-portal, article, donate ইত্যাদি)
- **Required dynamic/detail pages:** SPA catch-all `[[...slug]]` রাউট; সব রাউটিং client-side (Zustand store); ডাটা Firebase RTDB থেকে (VERIFIED 2026-10-30: _client-page.tsx, app-store.ts)
- **Required admin pages:** `/admin` — ৪১টি পেজ (VERIFIED 2026-10-30: src/components/admin/ + README): dashboard, notices, teachers, departments, students, exams, results, blogs, gallery, admission, donation, settings, messages, events, applications, activity-log, hifz, exams-mcq, attendance, library, calendar, fee, alumni, prayer, hadith, sms, backup, payment-history, expenses, salary, financial-reports, vouchers, subscriptions, hostel, dawah, materials, roles, qr-payment, report-builder
- **Required user roles:** পাবলিক ভিজিটর + অ্যাডমিন (username/password) + ছাত্র (রোল নম্বর দিয়ে পোর্টাল) (VERIFIED 2026-10-30: AdminLogin, StudentPortal, adminRoles/adminUsers path)
- **Required forms/actions:** অনলাইন ভর্তি ফর্ম, যোগাযোগ ফর্ম, দান (ম্যানুয়াল পেমেন্ট পদ্ধতি প্রদর্শন — Bohudur অপসারিত), QR, MCQ পরীক্ষা, প্রতিটি সেকশনে admin CRUD (VERIFIED 2026-10-30: components)
- **Required charts/analytics:** Recharts (admin dashboard + financial reports) (VERIFIED 2026-10-30: package.json, AdminDashboard/AdminFinancialReports)
- **Required search/filter/pagination:** ছাত্র সার্চ, পেমেন্ট হিস্ট্রি ফিল্টার ইত্যাদি (VERIFIED 2026-10-30: README admin features)
- **Required backup/import/export/sync:** Admin → Backup (ডাটাবেস ব্যাকআপ ও রিস্টোর); marksheet PDF export (html2canvas + jsPDF); JSZip (VERIFIED 2026-10-30: AdminBackup.tsx, package.json)
- **Required contact/message flows:** যোগাযোগ ফর্ম → Firebase `contactMessages` → admin messages প্যানেল (VERIFIED 2026-10-30: README DB structure)
- **Other features:** PWA (manifest + sw.js), ত্রিভাষিক কনটেন্ট (v2.1), QR payment config, SMS ব্যবস্থা, GitHub media upload (VERIFIED 2026-10-30)

### Admin panel requirements (if applicable)

- Admin route: `/admin` (repo-তে public; README-তে documented) — অ্যাক্সেস নিয়ন্ত্রণ নিচের Authentication অংশে
- Authentication: username + password; ডাটা Firebase RTDB `adminAuth/` path-এ; ডিফল্ট username `admin` (VERIFIED 2026-10-30: README, AdminLogin)। **প্রথম-এডমিন রেজিস্ট্রেশন flow (২০২৬-১০-৩০ যোগ):** DB-তে কোনো এডমিন না থাকলে (adminUsers খালি + config/adminAuth + settings/adminAuth password নেই) `/admin` লোড হলে রেজিস্ট্রেশন ফর্ম দেখায়; প্রথম রেজিস্ট্রেশন স্বয়ংক্রিয়ভাবে সুপার এডমিন তৈরি করে (adminUsers + adminRoles/default + config/adminAuth + settings/adminAuth) এবং auto-login করে। এডমিন থাকলে লগইন পেজ দেখায়। DB read error-এ fail-safe: লগইন পেজই দেখায় (VERIFIED 2026-10-30 browser E2E)। ⚠️ সতর্কতা (A9 অনুযায়ী): verification বর্তমানে client-side — server-side enforcement নেই; RTDB rules দিয়ে শক্ত করা প্রয়োজন (README-তে test-mode open rules দেখানো আছে)
- Authorization model: Firebase RTDB rules-এর ওপর নির্ভরশীল; repo-তে rules ফাইল নেই (VERIFIED 2026-10-30: inspection); production-এ প্রকৃত rules UNVERIFIED (Firebase console-এ দেখতে হবে)
- Editable site settings: Site Info (ত্রিভাষিক নাম/স্লোগান), social links, payment config, GitHub API config, password — Admin → Settings (VERIFIED 2026-10-30: README, AdminSettings)
- Editable content sections: notices, departments, teachers, students, exams/results, blogs, gallery, events, donation, admission info, hadith, prayer, library, hostel, dawah, materials, calendar, fee — প্রতিটি ত্রিভাষিক ইনপুট ট্যাব সহ (VERIFIED 2026-10-30: README v2.1, MLFields.tsx)
- Backup/restore safeguards: AdminBackup component আছে; destructive overwrite safeguards-এর বিস্তারিত আচরণ UNVERIFIED (A11 অনুযায়ী পরীক্ষা প্রয়োজন)
- Audit logs: `activityLog/` path + AdminActivityLog component (VERIFIED 2026-10-30: README DB structure)

Do not treat a hidden admin link as access control. Enforce authorization at the server/backend layer.

## B6. Backend, Database and Integrations

- **Framework:** Next.js 16.1+ (App Router, `output: "export"` static export, `trailingSlash: true`, `images.unoptimized: true`) (VERIFIED 2026-10-30: package.json `next ^16.1.1`, next.config.ts)
- **Language:** TypeScript 5 (strict), React 19 (VERIFIED 2026-10-30: package.json, tsconfig.json)
- **Database:** Firebase Realtime Database (client-side SDK) — root-এ ২৬ path (config/, settings/, notices/, teachers/, students/ ইত্যাদি)। **বর্তমান সক্রিয় প্রজেক্ট: `madrasahbd`** (`https://madrasahbd-default-rtdb.asia-southeast1.firebasedatabase.app`) — ২০২৬-১০-৩০ তারিখে পুরোনো প্রজেক্ট `result-951c4` থেকে সম্পূর্ণ ডাটা মাইগ্রেট করা হয়েছে (REST PUT, ১:১ verified)। Config `src/lib/firebase.ts`-এ built-in default হিসেবে আছে; `NEXT_PUBLIC_FIREBASE_*` env vars দিয়ে override করা যায়। পুরোনো প্রজেক্টের পূর্ণ ব্যাকআপ: `db/old-firebase-result-951c4-backup.json`। Prisma/SQL ব্যবহৃত হয় না (.env-এর DATABASE_URL লেগাসি/unused)
- **Authentication:** Firebase Anonymous Auth (RTDB write-এর জন্য — নতুন `madrasahbd` প্রজেক্টে এখনো **disabled**; open rules-এর কারণে সব কাজ করে, কিন্তু rules hardening-এর আগে console-এ Anonymous sign-in enable করা উচিত) + admin credential RTDB-তে (B5 দেখুন) (VERIFIED 2026-10-30: firebase.ts `anonymousSignIn`; console error `auth/admin-restricted-operation` পর্যবেক্ষিত)
- **File/media storage:** GitHub API দিয়ে user-এর repo-তে upload (`uploads/<timestamp>_<filename>`) (VERIFIED 2026-10-30: db-service.ts)
- **Server/API/functions:** কোনো server API নেই — সম্পূর্ণ static export (session ৮-এ Bohudur/Payment Functions + Next API routes সম্পূর্ণ অপসারিত; `functions/` ও `src/app/api/` ফোল্ডারই নেই, `public/_routes.json` অপসারিত) (হালনাগাদ 2026-10-30 session ৮)
- **External integrations:** GitHub REST API (media upload), Firebase RTDB/Auth (VERIFIED 2026-10-30; Bohudur gateway সম্পূর্ণ অপসারিত session ৮)
- **Environment variable names:** `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_DATABASE_URL`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (analytics); লেগাসি/অপসারিত: `BOHUDUR_API_KEY` (session ৮), `DATABASE_URL` (VERIFIED 2026-10-30: .env.example; Firebase vars unset হলে firebase.ts-এর defaults ব্যবহৃত হয়)
- **Security rules/policies:** repo-তে RTDB rules ফাইল নেই; README-তে উদাহরণ হিসেবে open rules (".read": true, ".write": true) — প্রোডাকশন ঝুঁকি (A9)। Firebase console-এ প্রকৃত rules UNVERIFIED। public/_headers-এ security headers আছে (X-Frame-Options DENY, nosniff, Permissions-Policy) (VERIFIED 2026-10-30)
- **Data migration constraints:** বিদ্যমান RTDB structure (45+ path) ভাঙা যাবে না; v2.1 ত্রিভাষিক ফিল্ড optional (titleEn/titleAr) — পুরোনো এক-ভাষিক ডাটা স্বয়ংক্রিয়ভাবে কাজ করে, migration লাগে না (VERIFIED 2026-10-30: README v2.1, types/database.ts)
- **Demo mode vs production mode:** শুধু production mode; Firebase ছাড়া অ্যাপ চলে, ডাটা না এলে designed DataLoadErrorPage দেখায় (hardcoded demo data নেই) (VERIFIED 2026-10-30: browser test 2026-10-30, README v2.0)

## B7. Localization / Internationalization

- **Default language:** বাংলা (`bn`) (VERIFIED 2026-10-30: layout.tsx `lang="bn"`, localStorage `preferred-language` fallback "bn")
- **Available languages:** বাংলা (bn), English (en), العربية (ar) (VERIFIED 2026-10-30: i18n.ts, header switcher)
- **Language switch behavior:** The entire interface must switch, not only selected labels. — VERIFIED 2026-10-30 (browser test): UI, admin panel, error page, RTL সব বদলায়; `lang`/`dir` attribute-ও আপডেট হয়
- **Content translation source:** Firebase RTDB-তে admin-এর ত্রিভাষিক ফিল্ড (titleEn/titleAr, contentEn/contentAr) + UI অনুবাদ src/lib/i18n.ts + i18n-parts/ মডিউল (VERIFIED 2026-10-30)
- **Number/date/currency formatting:** bn-BD / en-US / ar-EG locale অনুযায়ী (VERIFIED 2026-10-30: README v2.0; src/lib/format.ts আছে)
- **RTL support if applicable:** আছে — ar নির্বাচনে `dir="rtl"`, layout সম্পূর্ণ উল্টায় (VERIFIED 2026-10-30: browser test, layout.tsx inline script)
- **Admin translation controls:** MLFields.tsx — প্রতিটি কনটেন্ট ফিল্ডে bn/en/ar ট্যাব, পূরণ হওয়া ভাষায় ✓ চিহ্ন (VERIFIED 2026-10-30: src/components/admin/MLFields.tsx, README v2.1)
- **Translation fallback:** নির্বাচিত ভাষা → বাংলা → English → Arabic চেইন (VERIFIED 2026-10-30: README v2.1, src/lib/multilingual.ts)

Verify navigation, page titles, buttons, forms, validation messages, statistics, charts, dates, footer, metadata and dynamically loaded content in every required language.

## B8. Hosting and Build Configuration

> Hosting settings may differ between projects. Verify them before changing anything.

- **Hosting provider:** Cloudflare Pages (VERIFIED 2026-10-30: next.config.ts static export comment, public/_headers/_redirects/_routes.json, functions/ Pages Functions, live URL madrasahbd.pages.dev)
- **Repository connection:** GitHub repo `mdmubarokhosin/Madrasah` (branch main) — Cloudflare Git integration বলে মনে হয়; ড্যাশবোর্ডের সঠিক settings UNVERIFIED (dashboard access নেই)
- **Root directory:** repo root (VERIFIED 2026-10-30: গঠন অনুযায়ী)
- **Build command:** README বলছে `npx next build`; প্রকৃত ড্যাশবোর্ড value UNVERIFIED — পরিবর্তনের আগে ড্যাশবোর্ড থেকে যাচাই করুন (A12: অন্য project থেকে copy নয়)
- **Build output directory:** static export আসলে `out/` তৈরি করে (VERIFIED 2026-10-30: local build); README বলছে `.next` — দুটোর মিল নেই, কিন্তু live সাইট কাজ করছে; ড্যাশবোর্ড যাচাই প্রয়োজন
- **Framework adapter/runtime:** কোনো adapter নেই — pure static export + Cloudflare Pages Functions (VERIFIED 2026-10-30)
- **Node/runtime version:** README: Node 18+; প্রকৃত Pages runtime UNVERIFIED (package.json-এ engines field নেই)
- **Environment bindings:** `NEXT_PUBLIC_FIREBASE_*` (৮টি) — নামমাত্র; values Cloudflare dashboard-এ; `BOHUDUR_API_KEY` আর নেই (হালনাগাদ 2026-10-30 session ৮)
- **Routing/redirect rules:** public/_redirects: `/_next/*` ও `/fonts/*` direct, বাকি সব `/* /index.html 200` (SPA); public/_headers: security headers + cache rules; `_routes.json` আর নেই (Functions নেই বলে অপ্রয়োজনীয় — session ৮) (হালনাগাদ 2026-10-30)
- **Custom domain requirements:** `[EDIT ME — user নিশ্চিত করুন]`
- **Other hosting targets:** static export — যেকোনো static host সম্ভব, তবে `/api/*` backend-এর জন্য Cloudflare Pages Functions (বা সমতুল্য serverless) লাগবে (VERIFIED 2026-10-30)

Never reuse a build command or output directory from another project without checking compatibility. If deployment portability is required, explicitly test asset paths and avoid unnecessary domain-specific assumptions.

## B9. Performance, Accessibility and SEO Targets

- **Performance priorities:** v2.0-তে ২৮টি অব্যবহৃত shadcn component ও ২৯টি অব্যবহৃত dependency সরানো (README); static export + immutable cache (VERIFIED 2026-10-30: _headers)
- **Accessibility requirements:** RTL support, ভাষা সুইচিং, semantic HTML (আংশিক VERIFIED 2026-10-30 browser test); পূর্ণাঙ্গ WCAG audit NOT RUN
- **SEO requirements:** layout.tsx-এ metadata (title, description, keywords, OG, twitter, robots); robots.txt আছে; _routes.json sitemap.xml exclude করে কিন্তু repo-তে sitemap.xml ফাইল নেই — ছোট গ্যাপ (VERIFIED 2026-10-30)
- **Analytics requirements:** repo-তে কোনো analytics পাওয়া যায়নি (VERIFIED 2026-10-30: inspection)
- **Browser support:** `[EDIT ME — UNVERIFIED]`
- **Mobile test widths/devices:** mobile-first (README); sandbox test 390×844 PASS (2026-10-30); বিস্তারিত device matrix `[EDIT ME]`
- **Reduced motion:** Respect user preference. (পূর্ণাঙ্গ যাচাই NOT RUN)
- **Performance budgets:** `[EDIT ME — কোনো পরিমাপ করা হয়নি]`

## B10. Delivery Requirements

- **Source code required:** Yes; maintainable and editable.
- **ZIP required:** `[EDIT ME — user যাচাই করবেন]`
- **ZIP excludes:** Secrets, private environment files, unnecessary dependencies, caches, temporary files and other explicitly excluded items.
- **Upload provider:** `[EDIT ME]`
- **Verified external link required:** `[EDIT ME]`
- **Git push required:** NO — এই session-এ user push authorization দেননি (2026-10-30); push চাইলে স্পষ্ট অনুমতি নিন
- **Deployment required:** NO — এই session-এ deployment authorization নেই (2026-10-30); সতর্কতা: GitHub-এ push করলেই Cloudflare Pages auto-deploy হয়
- **Final report language:** বাংলা (user-এর ভাষা অনুযায়ী; প্রয়োজনে English)
- **Other deliverables:** MASTER_GUIDE.md অক্ষত রাখা বাধ্যতামূলক; PROJECT_STATUS.md হালনাগাদ রাখা

If a requested external upload cannot be completed, do not invent a link. State the blocker and provide only real available deliverables.

## B11. Acceptance Criteria

- [ ] Repository and current deployment setup inspected.
- [ ] Existing important features inventoried and preserved.
- [ ] Audit report created when requested/appropriate.
- [ ] Requested design and feature changes implemented.
- [ ] All important buttons, links, forms and flows tested.
- [ ] Responsive behavior checked on mobile and desktop.
- [ ] Required languages checked across the whole site.
- [ ] Media loads correctly or has a graceful fallback.
- [ ] Security and secrets reviewed.
- [ ] Relevant lint, typecheck, tests and build run; results reported honestly.
- [ ] Hosting compatibility checked.
- [ ] Documentation and project status updated.
- [ ] ZIP validated if requested.
- [ ] External upload and download link verified if requested.
- [ ] Final report includes limitations and unfinished work.

---

# PART C — PROJECT MEMORY AND SESSION HANDOFF

## C1. Verified Repository Facts

Update only after inspecting the repository.

- Framework/version: `Next.js ^16.1.1 (App Router, static export), React ^19` — VERIFIED 2026-10-30
- Language/version: `TypeScript ^5 (strict), Tailwind CSS ^4, shadcn/ui subset` — VERIFIED 2026-10-30
- Package manager/lockfile: `repo-তে package-lock.json (npm); README bun-ও উল্লেখ করে` — VERIFIED 2026-10-30 (sandbox workspace bun.lock ব্যবহার করে, deps অভিন্ন)
- Build/lint/test commands: `build: next build (PASS 2026-10-30, 56 static pages; Next 16-তে build-এ ESLint চলে না); typecheck: tsc --noEmit (PASS 2026-10-30); lint: eslint . — ক্লোন অবস্থায় FAIL (config নেই); config যোগের পরেও FAIL: 22 errors + 9 warnings — সব pre-existing repo কোডে (setState-in-effect, components-created-during-render, alt-text); test suite নেই — NOT RUN` — VERIFIED 2026-10-30
- Database/authentication: `Firebase RTDB (client-side, root-এ ২৬ path) + admin credential RTDB-তে (client-side verification) + প্রথম-এডমিন রেজিস্ট্রেশন flow` — সক্রিয় প্রজেক্ট `madrasahbd` (পুরোনো `result-951c4` থেকে সম্পূর্ণ ডাটা মাইগ্রেটেড ২০২৬-১০-৩০, ১:১ verified; Anonymous Auth নতুন প্রজেক্টে disabled — open rules-এ কাজ চলে) — VERIFIED 2026-10-30
- Hosting/build configuration: `Cloudflare Pages static export; _redirects/_headers` — VERIFIED 2026-10-30 (ড্যাশবোর্ড build settings UNVERIFIED)
- Production URL: `https://madrasahbd.pages.dev/` — VERIFIED 2026-10-30 (HTTP 200)
- Important routes/features: `৩১টি public রুট + aliases, /admin-এ ৪০টি পেজ (payment-history অপসারিত), /student portal, কোনো API endpoint নেই (Bohudur অপসারিত), ত্রিভাষিক bn/en/ar + RTL, PWA, সাইট-ব্যাপী Noto Serif Bangla ফন্ট + ড্রপডাউন ভাষা সুইচার` — VERIFIED 2026-10-30
- Known risks: `(১) RTDB rules README-তে open দেখানো, প্রকৃত rules UNVERIFIED; (২) admin verification client-side; (৩) GitHub token Firebase-এ সংরক্ষিত (githubConfig); (৪) README-তে কিছু পুরোনো তথ্য (output: standalone, কিছু dependency, prisma ফোল্ডার — আসলে নেই); (৫) Contact component-এ React key warning; (৬) repo-তে eslint config নেই; (৭) sitemap.xml referenced কিন্তু নেই` — VERIFIED 2026-10-30

## C2. Current Task

- **Task name:** নতুন Firebase (`madrasahbd`) সেটআপ + পুরোনো ওয়েবসাইটের সব ডাটা মাইগ্রেশন + কন্ডিশনাল এডমিন রেজিস্ট্রেশন/লগইন সিস্টেম (2026-10-30 session ২)
- **User-approved scope:** user-প্রদত্ত নতুন Firebase config প্রজেক্টে সেটআপ; `https://madrasahbd.pages.dev/` (পুরোনো সাইট = এইই repo-র deployment, যার ডাটা পুরোনো Firebase `result-951c4`-এ) থেকে সব ডাটা নতুন Firebase-এ আনা; এডমিন না থাকলে রেজিস্ট্রেশন ফর্ম + অটো-এডমিন, থাকলে লগইন; পুরোনো অ্যাডমিন প্যানেলের সব কন্ট্রোল নতুন Firebase-এ কাজ করা নিশ্চিত করা
- **Status:** COMPLETED (সব কাজ সম্পন্ন ও browser-এ verified)
- **Current branch/commit:** `main` (workspace uncommitted — push authorization নেই)
- **Last verified checks:** `npx tsc --noEmit` src PASS; `bun run lint` baseline অপরিবর্তিত (22 errors + 9 warnings — সব pre-existing); মাইগ্রেশন integrity ১:১ verified (REST read-back তুলনা); browser E2E: home প্রকৃত ডাটায় render PASS, /admin লগইন PASS (super admin password), নোটিশ add→public পেজে দেখা→delete PASS, রেজিস্ট্রেশন flow (DB খালি করে টেস্ট→অটো-লগইন→restore) PASS, mobile 390px overflow নেই PASS — সব 2026-10-30
- **Completed:** পুরোনো Firebase config আবিষ্কার (live JS bundle থেকে `result-951c4`); সম্পূর্ণ DB REST-এ fetch + নতুন DB-তে PUT + read-back verify; `db/old-firebase-result-951c4-backup.json` ব্যাকআপ; `.env` ও `firebase.ts` নতুন config (defaults + env override) + Analytics lazy init; `checkAdminExists`/`registerAdmin` (app-store) + AdminLogin কন্ডিশনাল UI + adminRegister.* ত্রিভাষিক keys; sandbox-এ প্রথমবার প্রকৃত Firebase ডাটায় full site render সম্ভব হলো
- **In progress:** NONE
- **Blockers:** নতুন প্রজেক্টে Anonymous Auth disabled (console-এ enable করা user-এর কাজ — বর্তমান open rules-এ প্রভাব নেই); Cloudflare dashboard/env vars আপডেট access নেই (firebase.ts defaults থাকায় প্রয়োজনও নেই); GitHub push authorization নেই
- **Next concrete action:** user চাইলে (১) Firebase console-এ Anonymous Auth enable + RTDB rules hardening, (২) push → Cloudflare auto-deploy, (৩) পুরোনো প্রজেক্ট `result-951c4` decommission আগে নতুন সাইট যাচাই করে

## C2.1 Firebase Migration Details (2026-10-30)

- **উৎস:** `result-951c4` (config live site-এর JS bundle-এ baked ছিল — static export-এ NEXT_PUBLIC vars bundle-এ থাকে)। DB: `https://result-951c4-default-rtdb.asia-southeast1.firebasedatabase.app` — open rules, REST GET `/.json` = 51KB সম্পূর্ণ ডাটা
- **গন্তব্য:** `madrasahbd` (user-প্রদত্ত config) — শুরুতে `null` (খালি), open rules (test mode)
- **পদ্ধতি:** `PUT /.json` সম্পূর্ণ tree (26 paths) → HTTP 200 → read-back deep-compare = হুবহু অভিন্ন
- **মাইগ্রেটেড ডাটা:** activityLogs(139), adminRoles(2), adminUsers(1: mubarok/মোয়াজ্জিন), admission, alumni, attendance, backupHistory, blogs(2), calendarEvents, config(10: siteInfo, adminAuth, bohudurConfig+key, githubConfig, paymentMethods, prayerTimes, classRoutine, syllabus, qrPaymentConfig), departments(3), donations(3), events, exams(2), feeConfigs, gallery, hadithDuas, mcqExams, notices, payments(16), results(2), settings(adminAuth admin/admin123), students, studyMaterials, teachers, vouchers
- **ক্রেডেনশিয়াল অবস্থা (২০২৬-১০-৩১ আপডেট):** লগইন এখন শুধু **দুইভাবে** — (১) `adminUsers` প্রোফাইলের username/email + RTDB PBKDF2 hash বা Firebase Auth, (২) Firebase Auth ইমেইল লগইন। `config/adminAuth` fallback-দিয়ে লগইন (Path C) **সরানো হয়েছে** — RTDB rules ওই নোডে public read দেয় না বলে এটি লগইন-ভিজিটরের জন্য কখনোই কাজ করত না (dead code; কাজ ছাড়া শুধু PERMISSION_DENIED noise তৈরি করত)। `config/adminAuth` ও `settings/adminAuth` নোড এখন শুধু legacy hash-mirror (registration-এ লেখা হয়, পড়া হয় না)। RBAC user (mubarok) অপরিবর্তিত — adminUsers প্রোফাইল দিয়েই লগইন হবে

## C3. Decision Log

Add important lasting decisions in this format:

- `YYYY-MM-DD` — **Decision:** ... **Reason:** ... **Impact:** ... **Status:** Active / Superseded.
- `2026-10-30` — **Decision:** verification-এ npm ব্যবহার (repo-তে package-lock.json আছে)। **Reason:** A8 lockfile সংরক্ষণ নিয়ম। **Impact:** sandbox workspace-এ bun.lock আছে কিন্তু deps অভিন্ন; repo অপরিবর্তিত। **Status:** Active.
- `2026-10-30` — **Decision:** sandbox dev script-এ `--webpack` রাখা। **Reason:** Turbopack dev-এ next/font/google ত্রুটিতে server crash; repo-র নিজস্ব dev script-এও --webpack ছিল। **Impact:** sandbox preview স্থিতিশীল; production build (Turbopack) অপরিবর্তিত PASS। **Status:** Active.
- `2026-10-30` — **Decision:** sandbox workspace-এ eslint.config.mjs যোগ। **Reason:** ক্লোন করা repo-তে eslint config নেই, lint চলে না (pre-existing defect)। **Impact:** config যোগে lint চলে কিন্তু 22 errors + 9 warnings ধরা পড়ে — সব pre-existing repo কোডে; এগুলো ঠিক করা পৃথক task। **Status:** Active.
- `2026-10-30` — **Decision:** কোনো application code পরিবর্তন করা হয়নি। **Reason:** task ছিল audit/verification (A4 Phase 1)। **Impact:** repo অক্ষত। **Status:** Superseded (session ২-তে user-অনুমোদিত feature কাজ শুরু)।
- `2026-10-30` — **Decision:** নতুন Firebase `madrasahbd` config-কে `src/lib/firebase.ts`-এ built-in default রাখা (env vars override করবে), শুধু `.env`-এ সীমাবদ্ধ নয়। **Reason:** পুরোনো deployed bundle-ও config hardcoded রাখত; Cloudflare dashboard env vars ছাড়াই deploy কাজ করবে; Firebase web config নিরাপত্তা-সচেতন নয় (public client identifier, নিরাপত্তা RTDB rules দিয়ে)। **Impact:** যেকোনো static host-এ config ছাড়াই নতুন Firebase-এ চলবে; প্রজেক্ট বদলাতে চাইলে env vars বা defaults বদলানো যাবে। **Status:** Active.
- `2026-10-30` — **Decision:** পুরোনো `result-951c4` DB-র সম্পূর্ণ ডাটা (26 path) REST `PUT /.json` দিয়ে নতুন `madrasahbd` DB-তে ১:১ কপি। **Reason:** user-এর স্পষ্ট নির্দেশ — আগের সাইটের সব ডাটা নতুন Firebase-এ; নতুন DB নিশ্চিতভাবে খালি ছিল (`null`) তাই non-destructive। **Impact:** সব কনটেন্ট/কনফিগ/ক্রেডেনশিয়াল অক্ষত স্থানান্তর; পূর্ণ ব্যাকআপ `db/old-firebase-result-951c4-backup.json`-এ সংরক্ষিত। **Status:** Active.
- `2026-10-30` — **Decision:** প্রথম-এডমিন রেজিস্ট্রেশন flow যোগ (checkAdminExists + registerAdmin)। **Reason:** user-এর স্পষ্ট চাহিদা — DB-তে এডমিন না থাকলে রেজিস্ট্রেশন ফর্ম, থাকলে লগইন; প্রথম রেজিস্ট্রেশন অটো-সুপার-এডমিন। **Impact:** fresh DB-তেও সাইট self-setup সম্ভব; fail-safe (DB error-এ লগইনই দেখায়); race-safety re-check; প্রকৃত security এখনো RTDB rules-নির্ভর (client-side — B5 সতর্কতা প্রযোজ্য)। **Status:** Active.
- `2026-10-30` — **Decision:** sandbox dev server-এ `NODE_OPTIONS=--max-old-space-size=1100` cap + watchdog। **Reason:** next-server ২.৪GB RSS নিয়ে OOM-killed হচ্ছিল (dmesg verified, 4GB box)। **Impact:** dev সার্ভার স্থিতিশীল; production build অপ্রভাবিত। **Status:** Active (sandbox-only).

## C4. Change Log

- `YYYY-MM-DD` — Created editable master guide template. Project-specific configuration must be verified and customized before implementation.
- `2026-10-30` — Repository inspection সম্পন্ন; Part B (B1–B10) যাচাইকৃত তথ্য দিয়ে পূরণ, Part C1 সব UNVERIFIED → VERIFIED, C2 task status আপডেট, C3-এ সিদ্ধান্ত যোগ। এই গাইডের কোনো নিয়ম পরিবর্তন/মুছে ফেলা হয়নি (A2 মেনে)।
- `2026-10-30` — সংশোধন: workspace lint-এর প্রকৃত ফলাফল (22 errors + 9 warnings, সব pre-existing) নথিভুক্ত — আগের ভুল "config যোগে PASS" দাবি সংশোধিত (A17 সৎ রিপোর্টিং)।
- `2026-10-30` (session ২) — নতুন Firebase `madrasahbd` সেটআপ সম্পন্ন: B6/B5/C1/C2 আপডেট, C2.1 migration details যোগ, C3-এ ৫টি নতুন সিদ্ধান্ত। কোনো PERMANENT AGENT RULE (Part A) পরিবর্তন/মুছে ফেলা হয়নি (A2 মেনে)। কোড পরিবর্তন: `src/lib/firebase.ts` (config defaults + analytics), `src/store/app-store.ts` (checkAdminExists/registerAdmin + FIRST_ADMIN_PERMISSIONS), `src/components/admin/AdminLogin.tsx` (কন্ডিশনাল UI), `src/lib/i18n-parts/admin-layout.ts` (adminRegister.* ত্রিভাষিক), `src/app/[[...slug]]/_client-page.tsx` (initAnalytics call), `.env`/`.env.example`।

---

# PART D — TASK-SPECIFIC REQUEST
# প্রতিটি নতুন task-এ এই অংশটি সম্পাদনা করুন

- **Task:** নতুন Firebase (`madrasahbd`) সেটআপ + পুরোনো ওয়েবসাইট (madrasahbd.pages.dev) থেকে সব ডাটা নতুন Firebase-এ মাইগ্রেশন + কন্ডিশনাল এডমিন রেজিস্ট্রেশন/লগইন + সব অ্যাডমিন কন্ট্রোল নতুন Firebase-এ কাজ করার নিশ্চয়তা (2026-10-30 session ২)
- **Task mode:** `IMPLEMENT + VERIFY` (user-অনুমোদিত feature কাজ)
- **Priority:** High
- **Pages/features in scope:** Firebase config (firebase.ts, .env), admin login/registration (AdminLogin, app-store), i18n keys, Analytics; সম্পূর্ণ RTDB ডাটা
- **Must preserve:** MASTER_GUIDE.md (অক্ষত), বিদ্যমান সব feature/data/brand/integration, পুরোনো ক্রেডেনশিয়াল, ত্রিভাষিক ব্যবস্থা
- **Explicitly prohibited:** MASTER_GUIDE.md delete/rename/move/দুর্বলীকরণ; destructive git command; production deployment/push (authorization ছাড়া); পুরোনো Firebase `result-951c4`-তে কোনো write/delete (শুধু read)
- **References/assets:** user-প্রদত্ত Firebase config snippet (madrasahbd); live site https://madrasahbd.pages.dev/
- **Definition of success:** সব ডাটা নতুন Firebase-এ ১:১; খালি DB-তে রেজিস্ট্রেশন→অটো-এডমিন; এডমিন থাকলে লগইন; অ্যাডমিন প্যানেল CRUD নতুন Firebase-এ কাজ করে — সব browser-এ verified
- **Deployment/upload authorized?:** NO (2026-10-30) — push করলেই Cloudflare auto-deploy হবে

## Session 2 outcome (2026-10-30)

- সব কাজ সম্পন্ন ও verified — বিস্তারিত C2/C2.1 দেখুন। পরবর্তী user-সিদ্ধান্ত: Anonymous Auth enable, rules hardening, push/deploy।

## Final instruction to the coding agent

Read this entire file before beginning. Then inspect the real repository, verify every relevant project fact, and perform the authorized task using the workflow and rules above. Do not stop at a plan when implementation is requested and feasible. Do not perform destructive or unauthorized actions. Verify results, update project memory, and report honestly what is complete, what failed, what remains, and where the actual deliverables can be found.
