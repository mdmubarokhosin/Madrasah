'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, Tag, Share2, User, FileText, CheckCircle, Copy, Link2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { loc } from '@/lib/multilingual';

export default function BlogDetail() {
  const { blogs, selectedBlogId, setSelectedBlogId, siteInfo } = useAppStore();
  const { t, language } = useTranslation();

  // Site name per selected language — Firebase only, no hardcoded fallback
  const siteName = language === 'ar' ? siteInfo?.nameAr || siteInfo?.name : language === 'en' ? siteInfo?.nameEn || siteInfo?.name : siteInfo?.name;
  const siteNameAr = siteInfo?.nameAr || siteName;
  
  const blog = blogs.find((b) => b.id === selectedBlogId);
  const blogTitle = blog ? loc(language, blog, 'title') : '';
  const blogContent = blog ? loc(language, blog, 'content') : '';
  const [shareUrl, setShareUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Update browser URL when viewing a blog article
  useEffect(() => {
    if (selectedBlogId) {
      const blogUrl = `/blog/${selectedBlogId}`;
      window.history.pushState({ blogId: selectedBlogId }, '', blogUrl);
      setShareUrl(window.location.origin + blogUrl);
    } else {
      setShareUrl('');
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

  if (!blog) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <FileText className="size-16 opacity-15 mb-4" />
        <p className="text-base font-medium">{t('blog.noBlogFound')}</p>
        <Button
          variant="outline"
          onClick={() => {
            setSelectedBlogId(null);
            window.history.pushState({}, '', '/blog');
          }}
          className="mt-4 gap-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('blog.backToList')}
        </Button>
      </div>
    );
  }

  const categoryColor = blog.category === 'ইসলামিক লেখা'
    ? 'bg-islamic'
    : blog.category === 'ফতোয়া'
    ? 'bg-golden'
    : 'bg-emerald-600';

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
        {/* Header */}
        <div className="bg-islamic-dark text-white py-4 px-4 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors cursor-pointer"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('student.back')}
            </button>
            <div className="flex items-center gap-2">
              <Badge className={`${categoryColor} text-white text-xs`}>
                <Tag className="w-3 h-3 mr-1" />
                {blog.category}
              </Badge>
              {/* Share Button with feedback */}
              <button
                onClick={handleShare}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer relative"
                aria-label="Share article"
                title={t('blogDetail.shareFullTitle')}
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Card className="border-0 shadow-none">
            <CardHeader className="p-0 mb-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <Calendar className="w-4 h-4" />
                <span>{blog.date}</span>
                <span className="mx-1">&bull;</span>
                <User className="w-4 h-4" />
                <span>{t('blog.admin')}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-islamic-dark leading-tight">
                {blogTitle}
              </h1>
              <Separator className="mt-4" />
            </CardHeader>
            <CardContent className="p-0">
              {/* Article body - complete content */}
              <div className="prose prose-sm md:prose max-w-none">
                {blogContent.split('\n').map((paragraph, idx) => (
                  <motion.p
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className="text-gray-700 leading-relaxed mb-4 text-base"
                  >
                    {paragraph}
                  </motion.p>
                ))}
              </div>

              {/* Share Section - full article sharing */}
              <Separator className="my-8" />
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
                <p className="text-xs font-medium text-slate-500 mb-3 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5" />
                  {t('blogDetail.shareSection')}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    onClick={handleShare}
                    className="flex-1 min-w-[120px] gap-2 text-sm cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    {t('blogDetail.share')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const fullText = `${blogTitle}\n\n${blogContent}${siteName ? `\n\n— ${siteName}` : ''}`;
                      copyFullText(fullText, shareUrl || window.location.href);
                    }}
                    className="gap-1.5 text-xs cursor-pointer"
                  >
                    {copiedLink ? (
                      <><CheckCircle className="w-3 h-3 text-emerald-500" /> {t('blogDetail.textCopied')}</>
                    ) : (
                      <><Copy className="w-3 h-3" /> {t('blogDetail.copyText')}</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyLinkToClipboard(shareUrl || window.location.href)}
                    className="gap-1.5 text-xs cursor-pointer"
                  >
                    {copiedLink ? (
                      <><CheckCircle className="w-3 h-3 text-emerald-500" /> {t('common.copied')}</>
                    ) : (
                      <><Link2 className="w-3 h-3" /> {t('blogDetail.copyLink')}</>
                    )}
                  </Button>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span>{siteNameAr}</span>
                </div>
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="gap-2 text-sm cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('blog.backToList')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
