// i18n part file for multilingual (bn/en/ar) content controls.
// Used by: MLFields.tsx (admin trilingual inputs) and admin forms.

export const part: Record<'bn' | 'en' | 'ar', Record<string, string>> = {
  bn: {
    'ml.bn': 'বাংলা',
    'ml.en': 'English',
    'ml.ar': 'العربية',
    'ml.hint': 'প্রতিটি ভাষার ট্যাবে গিয়ে সেই ভাষায় লিখুন — ইউজার ওই ভাষাতেই দেখবে।',
    'ml.complete': 'তিন ভাষাতেই সম্পূর্ণ',
    'ml.missing': '{count} টি ভাষা বাকি',
    'settings.aboutSectionML': 'আমাদের পরিচয় (ত্রিভাষিক)',
    'settings.visionMissionML': 'দৃষ্টিভঙ্গি ও লক্ষ্য (ত্রিভাষিক)',
    'adminBlogs.titleML': 'শিরোনাম (ত্রিভাষিক)',
    'adminBlogs.contentML': 'লেখা (ত্রিভাষিক)',
  },
  en: {
    'ml.bn': 'বাংলা',
    'ml.en': 'English',
    'ml.ar': 'العربية',
    'ml.hint': 'Switch each language tab and write in that language — users will see it in their selected language.',
    'ml.complete': 'Complete in all languages',
    'ml.missing': '{count} language(s) left',
    'settings.aboutSectionML': 'Who We Are (trilingual)',
    'settings.visionMissionML': 'Vision & Mission (trilingual)',
    'adminBlogs.titleML': 'Title (trilingual)',
    'adminBlogs.contentML': 'Content (trilingual)',
  },
  ar: {
    'ml.bn': 'বাংলা',
    'ml.en': 'English',
    'ml.ar': 'العربية',
    'ml.hint': 'بدّل بين تبويبات اللغات واكتب بكل لغة — سيرى المستخدمون المحتوى باللغة المختارة.',
    'ml.complete': 'مكتمل بجميع اللغات',
    'ml.missing': 'باقي {count} لغة',
    'settings.aboutSectionML': 'من نحن (ثلاثي اللغات)',
    'settings.visionMissionML': 'الرؤية والرسالة (ثلاثي اللغات)',
    'adminBlogs.titleML': 'العنوان (ثلاثي اللغات)',
    'adminBlogs.contentML': 'المحتوى (ثلاثي اللغات)',
  },
};
