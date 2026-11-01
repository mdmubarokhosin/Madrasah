'use client';

import PageBanner from '@/components/pages/PageBanner';
import Blog from '@/components/madrasa/Blog';
import BackToTop from '@/components/pages/BackToTop';
import { useTranslation } from '@/lib/i18n-context';

export default function BlogPage() {
  const { t } = useTranslation();
  return (
    <div className="pt-0">
      <PageBanner
        titleKey="blog.title"
        arabicText={t('blog.arabic')}
        subtitleKey="blog.subtitle"
      />
      <Blog hideHeading />
      <BackToTop />
    </div>
  );
}
