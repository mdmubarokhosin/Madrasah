'use client';

import { motion } from 'framer-motion';
import { Calendar, Tag, ChevronRight, FolderOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SectionHeading from './SectionHeading';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { loc } from '@/lib/multilingual';

export default function Blog({ hideHeading }: { hideHeading?: boolean }) {
  const { blogs: storeBlogs, setSelectedBlogId } = useAppStore();
  const { t, language } = useTranslation();

  const blogPosts = storeBlogs.map((b) => ({
    id: b.id,
    title: loc(language, b, 'title'),
    date: b.date,
    category: b.category,
    excerpt: (loc(language, b, 'content') || '').substring(0, 200) + '...',
    imageUrl: b.imageUrl || '',
    color: b.category === 'ইসলামিক লেখা'
      ? 'bg-islamic'
      : b.category === 'ফতোয়া'
      ? 'bg-golden'
      : 'bg-emerald-600',
  }));

  return (
    <section id="blog" className="py-12 md:py-20 bg-white relative">
      <div className="absolute inset-0 islamic-pattern-bg pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {!hideHeading && (
          <SectionHeading
            title={t('blog.title')}
            subtitle={t('blog.subtitle')}
            arabicText={t('blog.arabic')}
          />
        )}

        {blogPosts.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {blogPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card
                  className="h-full hover:shadow-lg transition-shadow border border-gray-100 group cursor-pointer overflow-hidden"
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedBlogId(post.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedBlogId(post.id); } }}
                >
                  {post.imageUrl && (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <CardContent className={`p-6 ${post.imageUrl ? 'pt-4' : ''}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge
                        className={`${post.color} text-white text-xs border-0`}
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {post.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {post.date}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-islamic-dark mb-3 group-hover:text-islamic transition-colors leading-tight">
                      {post.title}
                    </h3>

                    <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center text-islamic text-sm font-medium group-hover:gap-2 transition-all">
                      {t('blog.readMore')}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FolderOpen className="size-12 opacity-20 mb-3" />
            <p className="text-sm">{t('blog.noData')}</p>
            <p className="text-xs mt-1">{t('blogPage.adminAddHint')}</p>
          </div>
        )}
      </div>
    </section>
  );
}
