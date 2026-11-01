'use client';

/**
 * AppShell — mobile "native Android app" chrome for the public site.
 *
 * BottomNav  : Material-3 style bottom navigation bar (mobile only, lg:hidden).
 *              Five destinations — Home, Notices, Results, Gallery, Menu.
 *              "Menu" opens the existing cinematic drawer via a CustomEvent
 *              so the Sheet state stays owned by <Header/>.
 *
 * FabCall    : Extended FAB (floating action button) for one-tap phone call,
 *              anchored above the bottom bar with safe-area awareness.
 *
 * Both are rendered only while the public website view is active — the admin
 * panel and student portal are full-screen portals and manage their own chrome.
 */

import { motion } from 'framer-motion';
import { Home, Bell, ClipboardList, Camera, Menu, Phone } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { navigateTo } from '@/lib/navigate';
import type { PublicPage } from '@/types/database';

/* Drawer-open broadcast — Header listens for this and opens its Sheet */
export const OPEN_DRAWER_EVENT = 'madrasa:open-drawer';

interface BottomNavItem {
  key: string;
  labelKey: string;
  page: PublicPage | 'menu';
  icon: typeof Home;
}

const bottomNavItems: BottomNavItem[] = [
  { key: 'home', labelKey: 'navShort.home', page: 'home', icon: Home },
  { key: 'notices', labelKey: 'navShort.notices', page: 'notices', icon: Bell },
  { key: 'results', labelKey: 'navShort.results', page: 'results', icon: ClipboardList },
  { key: 'gallery', labelKey: 'navShort.gallery', page: 'gallery', icon: Camera },
  { key: 'menu', labelKey: 'navShort.menu', page: 'menu', icon: Menu },
];

/* ============ Bottom Navigation (Material-3, mobile only) ============ */
export function BottomNav() {
  const { publicPage } = useAppStore();
  const { t } = useTranslation();

  const handleItem = (page: PublicPage | 'menu') => {
    if (page === 'menu') {
      window.dispatchEvent(new CustomEvent(OPEN_DRAWER_EVENT));
      return;
    }
    navigateTo('public', page);
  };

  return (
    <motion.nav
      initial={{ y: 72, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30, delay: 0.15 }}
      className="fixed inset-x-0 bottom-0 z-40 lg:hidden"
      aria-label={t('appShell.bottomNavAria')}
    >
      {/* Gold hairline on top — matches header/footer cinematic line */}
      <div className="gold-flow-line" aria-hidden="true" />

      <div
        className="bg-night/95 backdrop-blur-xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="mx-auto grid h-16 max-w-md grid-cols-5">
          {bottomNavItems.map((item) => {
            const isActive = item.page !== 'menu' && publicPage === item.page;
            const Icon = item.icon;
            return (
              <motion.button
                key={item.key}
                type="button"
                onClick={() => handleItem(item.page)}
                whileTap={{ scale: 0.88 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className="relative flex min-h-[44px] flex-col items-center justify-center gap-0.5 pt-1.5 outline-none"
                aria-label={t(item.labelKey)}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* M3 active pill — slides between tabs */}
                {isActive && (
                  <motion.span
                    layoutId="m3-bottom-pill"
                    className="absolute top-1.5 h-8 w-16 rounded-full bg-gold-soft/15 ring-1 ring-gold-soft/20"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    aria-hidden="true"
                  />
                )}
                <Icon
                  className={`relative size-5 transition-colors duration-200 ${
                    isActive ? 'text-gold-bright' : 'text-white/55'
                  }`}
                  aria-hidden="true"
                />
                <span
                  className={`relative text-[10.5px] font-semibold leading-none transition-colors duration-200 ${
                    isActive ? 'text-gold-bright' : 'text-white/55'
                  }`}
                >
                  {t(item.labelKey)}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}

/* ============ Extended FAB — quick call (mobile only) ============ */
export function FabCall() {
  const { siteInfo } = useAppStore();
  const { t } = useTranslation();

  // No phone configured in the admin panel → nothing to call
  if (!siteInfo?.phone) return null;

  return (
    <motion.a
      href={`tel:${siteInfo.phone}`}
      initial={{ opacity: 0, scale: 0.6, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.6, y: 12 }}
      transition={{ type: 'spring', stiffness: 380, damping: 26, delay: 0.3 }}
      whileTap={{ scale: 0.92 }}
      className="fixed end-4 z-40 lg:hidden"
      style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px) + 0.875rem)' }}
      aria-label={`${t('appShell.callNow')}: ${siteInfo.phone}`}
    >
      <span className="flex min-h-[48px] items-center gap-2 rounded-2xl bg-gradient-to-br from-gold-bright to-golden px-4 shadow-xl shadow-night/50 ring-1 ring-gold-soft/40">
        <Phone className="size-5 text-eclipse" aria-hidden="true" />
        <span className="text-[13px] font-bold text-eclipse">{t('appShell.callNow')}</span>
      </span>
    </motion.a>
  );
}
