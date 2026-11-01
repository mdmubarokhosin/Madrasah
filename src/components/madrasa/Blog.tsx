'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowDownUp,
  BookOpen,
  Calendar,
  ChevronRight,
  Clock3,
  FolderOpen,
  Search,
  SearchX,
  User,
  X,
} from 'lucide-react';
import { Heading } from '@heroui/react/typography';
import SectionHeading from './SectionHeading';
import { HButton, HCard, HChip, IconMedallion, StarBurst } from '@/components/heroui/islamic';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { loc } from '@/lib/multilingual';
import type { BlogPost } from '@/types/database';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const EASE = [0.22, 1, 0.36, 1] as const;

/** Category → accent dot (unknown categories fall back to primary). */
const CATEGORY_DOT: Record<string, string> = {
  'ইসলামিক লেখা': 'bg-islamic',
  'ফতোয়া': 'bg-golden',
};
const dotFor = (category: string) => CATEGORY_DOT[category] || 'bg-primary';

/** Sort timestamp — creation time first, best-effort date-string parse second. */
const timestampOf = (b: BlogPost) => b.createdAt || Date.parse(b.date) || 0;

/** Estimated reading time — word count / 200 wpm (≥ 1 minute). */
const readMinutesOf = (content: string) => {
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 200));
};

interface BlogCardVM {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  imageUrl: string;
  videoUrl: string;
  minutes: number;
  ts: number;
  /** lower-cased haystack across every language variant for search */
  hay: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function Blog({ hideHeading }: { hideHeading?: boolean }) {
  const { blogs: storeBlogs, setSelectedBlogId } = useAppStore();
  const { t, language } = useTranslation();

  /* Toolbar state */
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null); // null = all
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  /* View models — localized + newest-first by creation time */
  const posts = useMemo<BlogCardVM[]>(() => {
    const list = storeBlogs.map<BlogCardVM>((b) => {
      const content = loc(language, b, 'content');
      const hay = [b.title, b.titleEn, b.titleAr, b.content, b.contentEn, b.contentAr, b.category]
        .filter((v): v is string => typeof v === 'string')
        .join(' ')
        .toLowerCase();
      return {
        id: b.id,
        title: loc(language, b, 'title'),
        excerpt: content.slice(0, 320),
        category: b.category || '',
        date: b.date || '',
        imageUrl: b.imageUrl || '',
        videoUrl: b.videoUrl || '',
        minutes: readMinutesOf(content),
        ts: timestampOf(b),
        hay,
      };
    });
    list.sort((a, b) => (sortOrder === 'newest' ? b.ts - a.ts : a.ts - b.ts));
    return list;
  }, [storeBlogs, language, sortOrder]);

  /* Category filter chips (derived from the posts themselves) */
  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of storeBlogs) {
      const c = (p.category || '').trim();
      if (c) counts.set(c, (counts.get(c) || 0) + 1);
    }
    return [...counts.entries()];
  }, [storeBlogs]);

  /* Search + tag filter */
  const filtered = useMemo<BlogCardVM[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q && !activeTag) return posts;
    return posts.filter((p) => {
      if (activeTag && p.category !== activeTag) return false;
      return !q || p.hay.includes(q);
    });
  }, [posts, query, activeTag]);

  const hasActiveFilters = query.trim() !== '' || activeTag !== null;
  const clearFilters = () => {
    setQuery('');
    setActiveTag(null);
  };

  const openPost = (id: string) => setSelectedBlogId(id);

  return (
    <section id="blog" className="relative overflow-hidden bg-background py-16 md:py-24">
      <div className="absolute inset-0 islamic-pattern-bg pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {!hideHeading && (
          <SectionHeading
            title={t('blog.title')}
            subtitle={t('blog.subtitle')}
            arabicText={t('blog.arabic')}
          />
        )}

        {posts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: EASE }}
            className="mb-8 space-y-4"
          >
            {/* Row 1 — count · search · sort */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-islamic-lighter/60 px-4 py-2 text-xs font-bold text-islamic-dark ring-1 ring-islamic/15">
                <BookOpen className="size-3.5 text-islamic" aria-hidden="true" />
                {hasActiveFilters
                  ? t('blog.filteredCount', { shown: filtered.length })
                  : t('blog.countPosts', { count: posts.length })}
              </span>

              <div className="flex items-center gap-2.5">
                {/* Search */}
                <div className="relative min-w-0 flex-1 sm:flex-none sm:w-64 md:w-72">
                  <Search
                    className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('blog.searchPlaceholder')}
                    aria-label={t('common.search')}
                    className="h-11 w-full rounded-full border border-islamic/15 bg-card ps-10 pe-10 text-sm text-foreground shadow-sm outline-none transition-all placeholder:text-muted-foreground focus:border-gold-bright/50 focus:ring-2 focus:ring-gold-bright/40"
                  />
                  {query !== '' && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="absolute end-2 top-1/2 grid size-7 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-muted-foreground transition-colors hover:bg-islamic-lighter hover:text-islamic"
                      aria-label={t('common.cancel')}
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>

                {/* Sort — newest first by default */}
                <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'newest' | 'oldest')}>
                  <SelectTrigger
                    aria-label={t('blog.sortNewest')}
                    className="h-11 w-40 shrink-0 rounded-full border-islamic/15 bg-card text-xs shadow-sm focus:ring-gold-bright/40"
                  >
                    <ArrowDownUp className="size-3.5 shrink-0 text-golden" aria-hidden="true" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">{t('blog.sortNewest')}</SelectItem>
                    <SelectItem value="oldest">{t('blog.sortOldest')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2 — category chips */}
            {tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('common.category')}>
                <button
                  type="button"
                  onClick={() => setActiveTag(null)}
                  aria-pressed={activeTag === null}
                  className={`inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full px-4 text-xs font-bold transition-all ${
                    activeTag === null
                      ? 'bg-islamic text-white shadow-md shadow-islamic/25'
                      : 'bg-card text-muted-foreground ring-1 ring-islamic/15 hover:bg-islamic-lighter hover:text-islamic-dark'
                  }`}
                >
                  {t('blog.filterAll')}
                </button>
                {tags.map(([tag, count]) => (
                  <button
                    key={tag || 'uncategorized'}
                    type="button"
                    onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                    aria-pressed={activeTag === tag}
                    className={`inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full px-4 text-xs font-bold transition-all ${
                      activeTag === tag
                        ? 'bg-islamic text-white shadow-md shadow-islamic/25'
                        : 'bg-card text-muted-foreground ring-1 ring-islamic/15 hover:bg-islamic-lighter hover:text-islamic-dark'
                    }`}
                  >
                    <span className={`size-1.5 rounded-full ${activeTag === tag ? 'bg-white' : dotFor(tag)}`} aria-hidden="true" />
                    {tag || t('blog.filterAll')}
                    <span
                      className={`rounded-full px-1.5 text-[10px] font-black ${
                        activeTag === tag ? 'bg-white/20' : 'bg-islamic-lighter text-islamic-dark'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {filtered.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
            {filtered.map((post, index) => {
              const featured = index === 0;
              const hasMedia = Boolean(post.videoUrl || post.imageUrl);
              const mediaBox = featured
                ? 'relative shrink-0 overflow-hidden h-64 md:h-auto md:w-1/2'
                : 'relative shrink-0 overflow-hidden h-52 md:h-60';
              const mediaClass = `w-full object-cover transition duration-700 group-hover:scale-105 ${
                featured ? 'absolute inset-0 h-full' : 'h-full'
              }`;

              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: Math.min(index * 0.07, 0.45), ease: EASE }}
                  className={featured ? 'md:col-span-2' : undefined}
                >
                  <HCard
                    role="button"
                    tabIndex={0}
                    onClick={() => openPost(post.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPost(post.id); } }}
                    className={`card-cinema group flex h-full cursor-pointer flex-col rounded-3xl ${featured ? 'md:flex-row' : ''}`}
                  >
                    {/* Media — image, muted looping video, or gradient fallback */}
                    <div className={mediaBox}>
                      {hasMedia ? (
                        post.videoUrl ? (
                          <video
                            src={post.videoUrl}
                            muted
                            loop
                            autoPlay
                            playsInline
                            preload="metadata"
                            className={mediaClass}
                          />
                        ) : (
                          <img src={post.imageUrl} alt={post.title} className={mediaClass} />
                        )
                      ) : (
                        <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-night via-emerald-deep to-night-2">
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

                      {/* Featured ribbon */}
                      {featured && (
                        <span className="absolute start-3 top-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-gold-bright to-golden px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-md">
                          <StarBurst className="size-3" aria-hidden="true" />
                          {t('blog.featured')}
                        </span>
                      )}

                      {/* Bottom scrim + overlaid meta chips */}
                      <div
                        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-night/70 via-night/25 to-transparent"
                        aria-hidden="true"
                      />
                      <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-2 p-4">
                        {post.category && (
                          <HChip
                            variant="soft"
                            className="h-auto inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-islamic-dark shadow-sm backdrop-blur"
                          >
                            <span className={`size-1.5 rounded-full ${dotFor(post.category)}`} aria-hidden="true" />
                            {post.category}
                          </HChip>
                        )}
                        {post.date && (
                          <HChip
                            variant="soft"
                            className="h-auto inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-islamic-dark shadow-sm backdrop-blur"
                          >
                            <Calendar className="size-3" aria-hidden="true" />
                            {post.date}
                          </HChip>
                        )}
                      </div>
                    </div>

                    {/* Body */}
                    <div className={`flex flex-1 flex-col p-6 ${featured ? 'md:p-8' : ''}`}>
                      <Heading
                        level={3}
                        className={`mb-2.5 line-clamp-2 font-bold leading-snug text-islamic-dark transition-colors group-hover:text-islamic ${
                          featured ? 'text-xl md:text-2xl' : 'text-lg'
                        }`}
                      >
                        {/* Real anchor → /blog/<id>: crawlable + keyboard
                            accessible (preflight keeps color/text-decoration
                            inherited, so visuals are unchanged). SPA handler
                            reused; default navigation is prevented. */}
                        <a
                          href={`/blog/${post.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openPost(post.id);
                          }}
                          className="hover:underline"
                        >
                          {post.title}
                        </a>
                      </Heading>

                      <p className="mb-5 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                        {post.excerpt}
                      </p>

                      <div className="mt-auto">
                        <div className="hairline-gold mb-4" aria-hidden="true" />
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          {/* Author + estimated read time */}
                          <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5">
                              <User className="size-3.5 text-gold-bright" aria-hidden="true" />
                              {t('blog.admin')}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Clock3 className="size-3.5 text-gold-bright" aria-hidden="true" />
                              {t('blog.readTime', { minutes: post.minutes })}
                            </span>
                          </div>
                          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-islamic">
                            {t('blog.readMore')}
                            <ChevronRight
                              className="size-4 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180"
                              aria-hidden="true"
                            />
                          </span>
                        </div>
                      </div>
                    </div>
                  </HCard>
                </motion.div>
              );
            })}
          </div>
        ) : hasActiveFilters ? (
          /* No search/filter match */
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-golden/30 bg-card/60 py-16 text-muted-foreground">
            <div className="mb-4 grid size-20 place-items-center rounded-full bg-golden-lighter/60 ring-1 ring-golden/25">
              <SearchX className="size-9 text-golden/80" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-islamic-dark">{t('blog.noMatch')}</p>
            <p className="mt-1 text-xs">{t('blog.noMatchHint')}</p>
            <HButton
              variant="outline"
              onPress={clearFilters}
              className="mt-5 min-h-11 gap-2 rounded-full text-sm"
            >
              <X className="size-4" aria-hidden="true" />
              {t('blog.clearFilters')}
            </HButton>
          </div>
        ) : (
          /* No posts published at all */
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-islamic/20 bg-card/60 py-16 text-muted-foreground">
            <div className="mb-4 grid size-20 place-items-center rounded-full bg-islamic-lighter/60 ring-1 ring-islamic/10">
              <FolderOpen className="size-9 opacity-30" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-islamic-dark">{t('blog.noData')}</p>
            <p className="mt-1 text-xs">{t('blogPage.adminAddHint')}</p>
          </div>
        )}
      </div>
    </section>
  );
}
