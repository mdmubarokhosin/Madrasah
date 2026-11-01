'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Tag,
  Share2,
  User,
  FileText,
  CheckCircle,
  Copy,
  Link2,
  Loader2,
  Clock3,
  BookOpen,
} from 'lucide-react';
import { HButton, HChip, IconMedallion, StarBurst } from '@/components/heroui/islamic';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { loc } from '@/lib/multilingual';

const EASE = [0.22, 1, 0.36, 1] as const;

/** Estimated reading time — word count / 200 wpm (≥ 1 minute). */
const readMinutesOf = (content: string) => {
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 200));
};

export default function BlogDetail() {
  const { blogs, selectedBlogId, setSelectedBlogId, siteInfo, dataLoaded } = useAppStore();
  const { t, language } = useTranslation();

  // Site name per selected language — Firebase only, no hardcoded fallback
  const siteName = language === 'ar' ? siteInfo?.nameAr || siteInfo?.name : language === 'en' ? siteInfo?.nameEn || siteInfo?.name : siteInfo?.name;
  const siteNameAr = siteInfo?.nameAr || siteName;

  const blog = blogs.find((b) => b.id === selectedBlogId);
  const blogTitle = blog ? loc(language, blog, 'title') : '';
  const blogContent = blog ? loc(language, blog, 'content') : '';
  const [copiedLink, setCopiedLink] = useState(false);

  // Share URL for the current article — derived from the selected blog id during
  // render (no setState-in-effect). Call sites fall back to window.location.href.
  const shareUrl = selectedBlogId
    ? (typeof window === 'undefined' ? '' : `${window.location.origin}/blog/${selectedBlogId}`)
    : '';

  // Update browser URL when viewing a blog article (side effect on history API).
  // Guarded: a deep link already loads AT /blog/<id> — pushing again would add
  // a second same-URL history entry (browser-back then needed two presses).
  useEffect(() => {
    if (!selectedBlogId) return;
    const target = '/blog/' + selectedBlogId;
    if (window.location.pathname.replace(/\/$/, '') !== target) {
      window.history.pushState({ blogId: selectedBlogId }, '', target);
    }
  }, [selectedBlogId]);

  // Listen for popstate (back/forward) to deselect blog
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const state = e.state as { blogId?: string } | null;
      if (!state?.blogId) {
        setSelectedBlogId(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setSelectedBlogId]);

  // Browser tab title follows the selected article ("title | site name",
  // language-aware via siteName). Unknown id → "404 | site name" so the
  // graceful not-found view is also reflected in the title. Navigation away
  // re-triggers the per-page title effect in _client-page.tsx (no cleanup).
  useEffect(() => {
    if (!selectedBlogId || !dataLoaded) return; // skip while the RTDB snapshot is still loading (no premature "404" title)
    if (blog) {
      document.title = siteName ? `${blogTitle} | ${siteName}` : blogTitle;
    } else {
      document.title = siteName ? `404 | ${siteName}` : '404';
    }
  }, [selectedBlogId, blog, blogTitle, siteName, dataLoaded]);

  // Robots meta — while the overlay is open, BlogDetail owns the robots tag
  // (the _client-page meta effect early-returns while selectedBlogId is set).
  // Same DOM helper pattern as _client-page.tsx: single '#meta-robots' element,
  // created once if missing. Unknown id (the not-found view renders) →
  // 'noindex, nofollow' (SEO soft-404 fix); a real article → 'index, follow'.
  // Navigating away re-triggers the per-page meta effect in _client-page.tsx
  // (no cleanup, mirroring the title effect above).
  useEffect(() => {
    if (!selectedBlogId || !dataLoaded) return; // skip while loading — unknown id can't be judged yet
    const setMeta = (id: string, attr: 'name' | 'property', key: string, value: string) => {
      let el = document.getElementById(id);
      if (!el) {
        el = document.createElement('meta');
        el.id = id;
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', value);
    };
    setMeta('meta-robots', 'name', 'robots', blog ? 'index, follow' : 'noindex, nofollow');
  }, [selectedBlogId, blog, dataLoaded]);

  // Loading gate: on a deep link /blog/<id> the RTDB snapshot has not arrived
  // at first paint — show a loading shell (same fixed overlay container the
  // article renders in) instead of flashing the not-found card. The not-found
  // branch below only renders once data is loaded and the id is truly unknown.
  // (When opened from the home overlay, dataLoaded is already true → no change.)
  if (!dataLoaded) {
    return (
      <div className="fixed inset-0 z-50 bg-background overflow-y-auto" role="status" aria-live="polite">
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="size-8 animate-spin text-islamic mb-4" />
          <p className="text-sm">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <div className="mb-4 grid size-20 place-items-center rounded-full bg-islamic-lighter/60 ring-1 ring-islamic/10">
          <FileText className="size-9 opacity-30" aria-hidden="true" />
        </div>
        <p className="text-base font-medium text-islamic-dark">{t('blog.noBlogFound')}</p>
        <HButton
          variant="outline"
          onPress={() => {
            setSelectedBlogId(null);
            window.history.pushState({}, '', '/blog');
          }}
          className="mt-4 min-h-11 gap-2 rounded-full text-sm"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
          {t('blog.backToList')}
        </HButton>
      </div>
    );
  }

  const categoryColor = blog.category === 'ইসলামিক লেখা'
    ? 'bg-islamic'
    : blog.category === 'ফতোয়া'
    ? 'bg-golden'
    : 'bg-primary';

  const readMinutes = readMinutesOf(blogContent);

  const handleBack = () => {
    setSelectedBlogId(null);
    window.history.pushState({}, '', '/blog');
  };

  const handleShare = async () => {
    // Share the FULL article content, not just a snippet
    const fullText = `${blogTitle}\n\n${blogContent}${siteName ? `\n\n— ${siteName}` : ''}`;
    const articleUrl = shareUrl || window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: blogTitle,
          text: fullText, // Full article content for sharing
          url: articleUrl,
        });
      } catch {
        // User cancelled or share failed, fall through to copy full text
        await copyFullText(fullText, articleUrl);
      }
    } else {
      await copyFullText(fullText, articleUrl);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  };

  const copyLinkToClipboard = async (url: string) => {
    await copyToClipboard(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const copyFullText = async (text: string, url: string) => {
    const textWithUrl = `${text}\n\n${url}`;
    await copyToClipboard(textWithUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed inset-0 z-50 bg-background overflow-y-auto"
      >
        {/* Header — sticky, deep-emerald surface that stays dark in both themes */}
        <div className="sticky top-0 z-10 border-b border-white/10 bg-night/95 px-4 py-2 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <button
              onClick={handleBack}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-3 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              aria-label={t('blog.backToList')}
            >
              <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
              {t('student.back')}
            </button>
            <div className="flex items-center gap-2">
              <HChip className={`${categoryColor} h-auto hidden rounded-full px-3 py-1.5 text-xs font-semibold text-white sm:inline-flex`}>
                <Tag className="me-1 size-3" aria-hidden="true" />
                {blog.category}
              </HChip>
              {/* Share button with copied feedback */}
              <button
                onClick={handleShare}
                className="relative grid size-11 cursor-pointer place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                aria-label={t('blogDetail.shareFullTitle')}
                title={t('blogDetail.shareFullTitle')}
              >
                {copiedLink ? (
                  <CheckCircle className="size-5 text-success" aria-hidden="true" />
                ) : (
                  <Share2 className="size-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Article */}
        <article className="mx-auto max-w-3xl px-4 pb-14 pt-6">
          {/* Cover — image / muted looping video / gradient fallback */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="relative mb-7 overflow-hidden rounded-3xl shadow-lg shadow-islamic/10"
          >
            {blog.videoUrl ? (
              <video
                src={blog.videoUrl}
                muted
                loop
                autoPlay
                playsInline
                preload="metadata"
                className="h-56 w-full object-cover md:h-80"
              />
            ) : blog.imageUrl ? (
              <img
                src={blog.imageUrl}
                alt={blogTitle || t('blog.title')}
                className="h-56 w-full object-cover md:h-80"
              />
            ) : (
              <div className="relative flex h-40 w-full items-center justify-center bg-gradient-to-br from-night via-emerald-deep to-night-2 md:h-52">
                <div className="islamic-pattern-overlay absolute inset-0 opacity-10" aria-hidden="true" />
                <StarBurst className="absolute -end-10 -top-10 size-40 text-gold-bright/15" aria-hidden="true" />
                <StarBurst className="absolute -bottom-12 -start-12 size-48 text-white/5" aria-hidden="true" />
                <IconMedallion
                  icon={BookOpen}
                  tone="gold"
                  className="relative size-14 bg-white/10 text-gold-bright ring-1 ring-white/25 backdrop-blur-sm"
                />
              </div>
            )}
          </motion.div>

          {/* Category + read time */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <HChip className={`${categoryColor} h-auto rounded-full px-3 py-1.5 text-xs font-semibold text-white sm:hidden`}>
              <Tag className="me-1 size-3" aria-hidden="true" />
              {blog.category}
            </HChip>
            <HChip
              variant="gold"
              className="h-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
            >
              <Clock3 className="size-3" aria-hidden="true" />
              {t('blog.readTime', { minutes: readMinutes })}
            </HChip>
          </div>

          {/* Title */}
          <h1 className="text-[1.65rem] font-black leading-tight tracking-tight text-islamic-dark md:text-4xl">
            {blogTitle}
          </h1>

          {/* Author / date meta */}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-4 text-gold-bright" aria-hidden="true" />
              {blog.date}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <User className="size-4 text-gold-bright" aria-hidden="true" />
              {t('blog.admin')}
            </span>
          </div>

          <div className="hairline-gold mt-5" aria-hidden="true" />

          {/* Body — complete content, preserved line breaks, immersive type scale */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1, ease: EASE }}
            className="mt-6 whitespace-pre-line text-[1.03rem] leading-[1.9] text-foreground/85 md:text-lg"
          >
            {blogContent}
          </motion.div>

          {/* Share section — full article sharing (dark-safe card) */}
          <div className="mt-10 rounded-2xl border border-border bg-card p-4 sm:p-5">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Share2 className="size-3.5 text-golden" aria-hidden="true" />
              {t('blogDetail.shareSection')}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <HButton
                onPress={handleShare}
                className="min-w-[120px] flex-1 gap-2 text-sm cursor-pointer"
              >
                <Share2 className="size-4" aria-hidden="true" />
                {t('blogDetail.share')}
              </HButton>
              <HButton
                variant="outline"
                size="sm"
                onPress={() => {
                  const fullText = `${blogTitle}\n\n${blogContent}${siteName ? `\n\n— ${siteName}` : ''}`;
                  copyFullText(fullText, shareUrl || window.location.href);
                }}
                className="gap-1.5 text-xs cursor-pointer"
              >
                {copiedLink ? (
                  <><CheckCircle className="size-3 text-success" aria-hidden="true" /> {t('blogDetail.textCopied')}</>
                ) : (
                  <><Copy className="size-3" aria-hidden="true" /> {t('blogDetail.copyText')}</>
                )}
              </HButton>
              <HButton
                variant="outline"
                size="sm"
                onPress={() => copyLinkToClipboard(shareUrl || window.location.href)}
                className="gap-1.5 text-xs cursor-pointer"
              >
                {copiedLink ? (
                  <><CheckCircle className="size-3 text-success" aria-hidden="true" /> {t('common.copied')}</>
                ) : (
                  <><Link2 className="size-3" aria-hidden="true" /> {t('blogDetail.copyLink')}</>
                )}
              </HButton>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
              <FileText className="size-4 shrink-0 text-golden" aria-hidden="true" />
              <span className="truncate">{siteNameAr}</span>
            </div>
            <HButton
              variant="outline"
              onPress={handleBack}
              className="min-h-11 shrink-0 gap-2 rounded-full text-sm cursor-pointer"
            >
              <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
              {t('blog.backToList')}
            </HButton>
          </div>
        </article>
      </motion.div>
    </AnimatePresence>
  );
}
