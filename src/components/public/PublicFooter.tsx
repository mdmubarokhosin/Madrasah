'use client';

import { GraduationCap, Phone, Mail, MapPin } from 'lucide-react';
import { useAppStore } from '@/store/app';
import { Button } from '@/components/ui/button';

export function PublicFooter() {
  const { siteSettings, setCurrentPage } = useAppStore();

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-8 sm:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center shrink-0">
                <GraduationCap className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-base sm:text-lg">{siteSettings.siteName || 'জামিয়া ইসলামিয়া দারুল উলূম'}</h3>
            </div>
            <p className="text-primary-foreground/80 text-xs sm:text-sm leading-relaxed">
              {siteSettings.siteTagline || 'ইলমে দ্বীনের আলোয় আলোকিত জীবন গড়ার প্রত্যয়ে'}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-3 sm:mb-4 text-primary-foreground/90 text-sm sm:text-base">দ্রুত লিংক</h4>
            <div className="flex flex-col gap-1.5 sm:gap-2">
              {[
                { label: 'হোম', page: 'home' as const },
                { label: 'ফলাফল', page: 'result' as const },
                { label: 'সনদের আবেদন', page: 'certificate-apply' as const },
                { label: 'সনদের স্ট্যাটাস', page: 'certificate-status' as const },
              ].map((item) => (
                <Button
                  key={item.page}
                  variant="link"
                  className="justify-start p-0 h-auto text-xs sm:text-sm text-primary-foreground/80 hover:text-primary-foreground hover:underline"
                  onClick={() => setCurrentPage(item.page)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-3 sm:mb-4 text-primary-foreground/90 text-sm sm:text-base">যোগাযোগ</h4>
            <div className="flex flex-col gap-2.5 sm:gap-3 text-xs sm:text-sm text-primary-foreground/80">
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 mt-0.5 shrink-0" />
                <span>{siteSettings.address || 'ঢাকা, বাংলাদেশ'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span>{siteSettings.phone || '০১৭১২-৩৪৫৬৭৮'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span>{siteSettings.email || 'info@example.com'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-primary-foreground/20 text-center text-[10px] sm:text-xs sm:text-sm text-primary-foreground/60">
          &copy; {new Date().getFullYear()} {siteSettings.siteName || 'জামিয়া ইসলামিয়া দারুল উলূম'}। সর্বস্বত্ব সংরক্ষিত।
        </div>
      </div>
    </footer>
  );
}
