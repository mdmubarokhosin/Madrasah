'use client';

import { useState } from 'react';
import { Menu, GraduationCap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useAppStore } from '@/store/app';
import type { PageName } from '@/types';

const navItems: { label: string; page: PageName }[] = [
  { label: 'হোম', page: 'home' },
  { label: 'ফলাফল', page: 'result' },
  { label: 'সনদের আবেদন', page: 'certificate-apply' },
  { label: 'সনদের স্ট্যাটাস', page: 'certificate-status' },
];

export function PublicNavbar() {
  const { currentPage, setCurrentPage, siteSettings } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (page: PageName) => {
    setCurrentPage(page);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex h-14 sm:h-16 items-center justify-between">
          {/* Logo */}
          <button onClick={() => handleNav('home')} className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
              <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xs sm:text-sm font-bold text-primary leading-tight">
                {siteSettings.siteName || 'জামিয়া ইসলামিয়া দারুল উলূম'}
              </h1>
              {siteSettings.siteNameEn && (
                <p className="text-[9px] sm:text-[10px] text-muted-foreground leading-tight">{siteSettings.siteNameEn}</p>
              )}
            </div>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Button
                key={item.page}
                variant={currentPage === item.page ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleNav(item.page)}
                className="text-sm"
              >
                {item.label}
              </Button>
            ))}
          </nav>

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <VisuallyHidden>
                <SheetTitle>নেভিগেশন মেনু</SheetTitle>
              </VisuallyHidden>
              <div className="mt-6 flex flex-col gap-2">
                {navItems.map((item) => (
                  <Button
                    key={item.page}
                    variant={currentPage === item.page ? 'default' : 'ghost'}
                    className="justify-start text-base"
                    onClick={() => handleNav(item.page)}
                  >
                    {item.label}
                  </Button>
                ))}
                <div className="my-2 border-t" />
                <Button
                  variant="outline"
                  className="justify-start text-base gap-2 text-muted-foreground"
                  onClick={() => { setMobileOpen(false); setCurrentPage('admin-login'); }}
                >
                  <Shield className="h-4 w-4" />
                  এডমিন প্যানেল
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
