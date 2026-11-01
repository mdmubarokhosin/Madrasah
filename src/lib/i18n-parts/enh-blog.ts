// i18n part file — enh-blog enhancement batch (Task 8-e)
// New keys for the upgraded লেখা ও প্রবন্ধ (Blog / Articles) section:
// public list toolbar (count / search / sort / category filter chips),
// immersive reader (estimated read time, empty states) and the admin
// CRUD list (search, filter, grouped form). Existing blog.*, blogDetail.*,
// blogPage.* and adminBlogs.* keys are reused; only genuinely new strings
// live here.

export const part: Record<'bn' | 'en' | 'ar', Record<string, string>> = {
  bn: {
    // ===== Blog list toolbar (public) =====
    'blog.countPosts': 'মোট {count}টি লেখা',
    'blog.filteredCount': '{shown}টি লেখা মেলেছে',
    'blog.searchPlaceholder': 'শিরোনাম বা বিষয় দিয়ে খুঁজুন…',
    'blog.sortNewest': 'নতুন আগে',
    'blog.sortOldest': 'পুরনো আগে',
    'blog.filterAll': 'সবগুলো',
    'blog.featured': 'প্রধান লেখা',

    // ===== Reader =====
    'blog.readTime': '{minutes} মিনিট পড়া',

    // ===== Empty / no-match states =====
    'blog.noMatch': 'কোনো লেখা মেলেনি',
    'blog.noMatchHint': 'অন্য শব্দ দিয়ে খুঁজুন অথবা ফিল্টার সরিয়ে ফেলুন।',
    'blog.clearFilters': 'ফিল্টার মুছুন',

    // ===== AdminBlogs =====
    'adminBlogs.searchPlaceholder': 'শিরোনাম বা বিষয়বস্তু খুঁজুন…',
    'adminBlogs.filterAll': 'সব ক্যাটাগরি',
    'adminBlogs.showingCount': '{shown}/{total}টি দেখানো হচ্ছে',
    'adminBlogs.noSearchResults': 'কোনো মিল পাওয়া যায়নি',
    'adminBlogs.noSearchHint': 'সার্চ শব্দ বা ক্যাটাগরি ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।',
    'adminBlogs.sectionContent': 'লেখার বিষয়বস্তু',
    'adminBlogs.sectionContentDesc': 'শিরোনাম ও মূল লেখা — তিনটি ভাষায়ই লেখা যায়।',
    'adminBlogs.sectionMeta': 'ক্যাটাগরি ও প্রকাশকাল',
    'adminBlogs.sectionMetaDesc': 'প্রদর্শনের ক্যাটাগরি এবং পাঠকের জন্য দেখানো তারিখ।',
  },

  en: {
    // ===== Blog list toolbar (public) =====
    'blog.countPosts': '{count} articles',
    'blog.filteredCount': '{shown} articles found',
    'blog.searchPlaceholder': 'Search by title or topic…',
    'blog.sortNewest': 'Newest first',
    'blog.sortOldest': 'Oldest first',
    'blog.filterAll': 'All',
    'blog.featured': 'Featured',

    // ===== Reader =====
    'blog.readTime': '{minutes} min read',

    // ===== Empty / no-match states =====
    'blog.noMatch': 'No matching articles',
    'blog.noMatchHint': 'Try a different keyword or clear the filters.',
    'blog.clearFilters': 'Clear filters',

    // ===== AdminBlogs =====
    'adminBlogs.searchPlaceholder': 'Search by title or content…',
    'adminBlogs.filterAll': 'All categories',
    'adminBlogs.showingCount': 'Showing {shown} of {total}',
    'adminBlogs.noSearchResults': 'No matching posts',
    'adminBlogs.noSearchHint': 'Try adjusting the search term or the category filter.',
    'adminBlogs.sectionContent': 'Article content',
    'adminBlogs.sectionContentDesc': 'Title and body — can be written in all three languages.',
    'adminBlogs.sectionMeta': 'Category & date',
    'adminBlogs.sectionMetaDesc': 'Display category and the date shown to readers.',
  },

  ar: {
    // ===== Blog list toolbar (public) =====
    'blog.countPosts': '{count} مقالة',
    'blog.filteredCount': 'تم العثور على {shown} مقالة',
    'blog.searchPlaceholder': 'ابحث بالعنوان أو الموضوع…',
    'blog.sortNewest': 'الأحدث أولاً',
    'blog.sortOldest': 'الأقدم أولاً',
    'blog.filterAll': 'الكل',
    'blog.featured': 'مقال مميز',

    // ===== Reader =====
    'blog.readTime': 'قراءة {minutes} دقيقة',

    // ===== Empty / no-match states =====
    'blog.noMatch': 'لا توجد مقالات مطابقة',
    'blog.noMatchHint': 'جرّب كلمة بحث مختلفة أو امسح عوامل التصفية.',
    'blog.clearFilters': 'مسح التصفية',

    // ===== AdminBlogs =====
    'adminBlogs.searchPlaceholder': 'ابحث بالعنوان أو المحتوى…',
    'adminBlogs.filterAll': 'كل الفئات',
    'adminBlogs.showingCount': 'عرض {shown} من {total}',
    'adminBlogs.noSearchResults': 'لا توجد نتائج مطابقة',
    'adminBlogs.noSearchHint': 'جرّب تعديل كلمة البحث أو تصفية الفئة.',
    'adminBlogs.sectionContent': 'محتوى المقال',
    'adminBlogs.sectionContentDesc': 'العنوان والنص — يمكن كتابتهما بالثلاث لغات.',
    'adminBlogs.sectionMeta': 'الفئة والتاريخ',
    'adminBlogs.sectionMetaDesc': 'فئة العرض والتاريخ المعروض للقراء.',
  },
};
