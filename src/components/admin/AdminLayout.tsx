'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { RecoveryKeyDialog } from '@/components/admin/RecoveryKeyDialog';
import {
  LayoutDashboard,
  Bell,
  GraduationCap,
  Users,
  UserCheck,
  ClipboardList,
  Award,
  FileText,
  Camera,
  BookOpen,
  Heart,
  Settings,
  LogOut,
  Menu,
  ArrowLeft,
  Mail,
  CalendarPlus,
  FileCheck,
  History,
  BookHeart,
  Calendar,
  Clock,
  Library,
  DollarSign,
  UsersRound,
  Sun,
  MessageSquare,
  Database,
  BookCheck,
  Receipt,
  Wallet,
  BarChart3,
  ScrollText,
  Repeat,
  BedDouble,
  Megaphone,
  FolderOpen,
  Shield,
  QrCode,
  FileSpreadsheet,
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { navigateTo } from '@/lib/navigate';
import { useTranslation } from '@/lib/i18n-context';
import type { AdminPage } from '@/types/database';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

/* ------------------------------------------------------------------ */
/*  Navigation config                                                  */
/* ------------------------------------------------------------------ */

interface NavItem {
  label: string; // i18n key — resolved with t() at render time
  page: AdminPage;
  icon: ReactNode;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'admin.dashboard', page: 'dashboard', icon: <LayoutDashboard className="size-5" /> },
  { label: 'admin.notices', page: 'notices', icon: <Bell className="size-5" /> },
  { label: 'admin.departments', page: 'departments', icon: <GraduationCap className="size-5" /> },
  { label: 'admin.teachers', page: 'teachers', icon: <Users className="size-5" /> },
  { label: 'admin.students', page: 'students', icon: <UserCheck className="size-5" /> },
  { label: 'admin.exams', page: 'exams', icon: <ClipboardList className="size-5" /> },
  { label: 'admin.results', page: 'results', icon: <Award className="size-5" /> },
  { label: 'adminLayout.navHifz', page: 'hifz', icon: <BookHeart className="size-5" /> },
  { label: 'adminLayout.navMcqExams', page: 'exams-mcq', icon: <BookCheck className="size-5" /> },
  { label: 'adminLayout.navAttendance', page: 'attendance', icon: <Clock className="size-5" /> },
  { label: 'adminLayout.navLibrary', page: 'library', icon: <Library className="size-5" /> },
  { label: 'adminLayout.navCalendar', page: 'calendar', icon: <Calendar className="size-5" /> },
  { label: 'adminLayout.navFee', page: 'fee', icon: <DollarSign className="size-5" /> },
  { label: 'adminLayout.navAlumni', page: 'alumni', icon: <UsersRound className="size-5" /> },
  { label: 'adminLayout.navPrayer', page: 'prayer', icon: <Sun className="size-5" /> },
  { label: 'adminLayout.navHadith', page: 'hadith', icon: <BookOpen className="size-5" /> },
  { label: 'admin.blogs', page: 'blogs', icon: <FileText className="size-5" /> },
  { label: 'admin.gallery', page: 'gallery', icon: <Camera className="size-5" /> },
  { label: 'admin.admission', page: 'admission', icon: <BookOpen className="size-5" /> },
  { label: 'admin.events', page: 'events', icon: <CalendarPlus className="size-5" /> },
  { label: 'admin.donation', page: 'donation', icon: <Heart className="size-5" /> },
  { label: 'adminLayout.navSms', page: 'sms', icon: <MessageSquare className="size-5" /> },
  { label: 'admin.messages', page: 'messages', icon: <Mail className="size-5" />, badge: 'messages' },
  { label: 'admin.applications', page: 'applications', icon: <FileCheck className="size-5" />, badge: 'applications' },
  { label: 'admin.activityLog', page: 'activity-log', icon: <History className="size-5" /> },
  { label: 'adminLayout.navBackup', page: 'backup', icon: <Database className="size-5" /> },
  { label: 'admin.settings', page: 'settings', icon: <Settings className="size-5" /> },
  { label: 'adminLayout.navExpenses', page: 'expenses', icon: <Receipt className="size-5" /> },
  { label: 'adminLayout.navSalary', page: 'salary', icon: <Wallet className="size-5" /> },
  { label: 'adminLayout.navFinancialReports', page: 'financial-reports', icon: <BarChart3 className="size-5" /> },
  { label: 'adminLayout.navVouchers', page: 'vouchers', icon: <ScrollText className="size-5" /> },
  { label: 'adminLayout.navSubscriptions', page: 'subscriptions', icon: <Repeat className="size-5" /> },
  { label: 'adminLayout.navHostel', page: 'hostel', icon: <BedDouble className="size-5" /> },
  { label: 'adminLayout.navDawah', page: 'dawah', icon: <Megaphone className="size-5" /> },
  { label: 'adminLayout.navMaterials', page: 'materials', icon: <FolderOpen className="size-5" /> },
  { label: 'adminLayout.navRoles', page: 'roles', icon: <Shield className="size-5" /> },
  { label: 'adminLayout.navQrPayment', page: 'qr-payment', icon: <QrCode className="size-5" /> },
  { label: 'adminLayout.navReportBuilder', page: 'report-builder', icon: <FileSpreadsheet className="size-5" /> },
];

/* ------------------------------------------------------------------ */
/*  Page title map                                                     */
/* ------------------------------------------------------------------ */

const PAGE_TITLES: Record<AdminPage, string> = {
  dashboard: 'admin.dashboard',
  notices: 'admin.notices',
  departments: 'admin.departments',
  teachers: 'admin.teachers',
  students: 'admin.students',
  exams: 'admin.exams',
  results: 'admin.results',
  hifz: 'adminLayout.titleHifz',
  'exams-mcq': 'adminLayout.navMcqExams',
  attendance: 'adminLayout.navAttendance',
  library: 'adminLayout.navLibrary',
  calendar: 'adminLayout.navCalendar',
  fee: 'adminLayout.titleFee',
  alumni: 'adminLayout.navAlumni',
  prayer: 'adminLayout.navPrayer',
  hadith: 'adminLayout.titleHadith',
  blogs: 'admin.blogs',
  gallery: 'admin.gallery',
  admission: 'admin.admission',
  donation: 'admin.donation',
  sms: 'adminLayout.navSms',
  settings: 'admin.settings',
  messages: 'admin.messages',
  events: 'admin.events',
  applications: 'admin.applications',
  'activity-log': 'admin.activityLog',
  backup: 'adminLayout.navBackup',
  expenses: 'adminLayout.titleExpenses',
  salary: 'adminLayout.titleSalary',
  'financial-reports': 'adminLayout.navFinancialReports',
  vouchers: 'adminLayout.titleVouchers',
  subscriptions: 'adminLayout.titleSubscriptions',
  hostel: 'adminLayout.titleHostel',
  dawah: 'adminLayout.titleDawah',
  materials: 'adminLayout.navMaterials',
  roles: 'adminLayout.navRoles',
  'qr-payment': 'adminLayout.navQrPayment',
  'report-builder': 'adminLayout.navReportBuilder',
};

/* ------------------------------------------------------------------ */
/*  Sidebar content (shared between desktop & mobile sheet)            */
/* ------------------------------------------------------------------ */

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { adminPage, setAdminPage, adminLogout, setView, contactMessages, admissionApplications, currentAdminUser, adminPermissions } = useAppStore();
  const { t } = useTranslation();

  const unreadMessages = contactMessages.filter((m) => !m.isRead).length;
  const pendingApplications = admissionApplications.filter((a) => a.status === 'pending').length;

  // Filter nav items by permissions (super admin = empty permissions = sees all)
  const filteredNavItems = NAV_ITEMS.filter((item) => {
    if (adminPermissions.length === 0) return true; // super admin sees all
    return adminPermissions.includes(item.page);
  });

  const getBadgeCount = (badge?: string) => {
    if (badge === 'messages') return unreadMessages;
    if (badge === 'applications') return pendingApplications;
    return 0;
  };

  const handleNav = (page: AdminPage) => {
    setAdminPage(page);
    onNavigate?.();
  };

  const handleBackToSite = () => {
    // Keep the admin session — just switch to the public view
    navigateTo('public');
    onNavigate?.();
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Logo & Header */}
      <div className="p-4 sm:p-5 flex items-center gap-3 shrink-0">
        <div className="w-11 h-11 rounded-xl bg-white/5 border border-gold-soft/25 p-1 flex items-center justify-center shrink-0 shadow-lg shadow-black/30">
          <img
            src="/logo.png"
            alt={t('adminLayout.logoAlt')}
            className="w-full h-full object-contain"
          />
        </div>
        <div className="min-w-0">
          <h2 className="font-bold text-white text-base leading-tight truncate">
            {t('admin.adminPanel')}
          </h2>
          <p className="text-xs text-gold-soft/60 truncate">
            {t('adminLayout.subtitle')}
          </p>
        </div>
      </div>

      <div className="hairline-gold mx-4" aria-hidden="true" />

      {/* Navigation */}
      <ScrollArea className="flex-1 min-h-0 px-2 sm:px-3 py-2 sm:py-3">
        <nav className="space-y-0.5" role="navigation" aria-label="Admin navigation">
          {filteredNavItems.map((item) => {
            const isActive = adminPage === item.page;
            const badgeCount = getBadgeCount(item.badge);
            return (
              <button
                key={item.page}
                onClick={() => handleNav(item.page)}
                className={`
                  group relative w-full flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200 cursor-pointer
                  ${
                    isActive
                      ? 'bg-gradient-to-r from-islamic/80 to-islamic-dark/60 text-white shadow-lg shadow-black/30'
                      : 'text-white/60 hover:bg-white/5 hover:text-white active:bg-white/10'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive && (
                  <span aria-hidden="true" className="absolute inset-y-1.5 start-0 w-1 rounded-full bg-gold-bright" />
                )}
                <span className={isActive ? 'text-gold-soft' : 'text-white/45 group-hover:text-gold-soft/80 transition-colors'}>
                  {item.icon}
                </span>
                <span className="truncate">{t(item.label)}</span>
                {badgeCount > 0 && (
                  <Badge className="bg-danger/15 text-danger border border-danger/40 text-xs ms-auto rounded-full px-2 shrink-0">
                    {badgeCount}
                  </Badge>
                )}
                {isActive && !badgeCount && (
                  <span className="ms-auto w-1.5 h-1.5 rounded-full bg-gold-bright/80 shrink-0" />
                )}
              </button>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="hairline-gold mx-4" aria-hidden="true" />

      {/* Bottom actions */}
      <div className="p-2 sm:p-3 space-y-0.5 shrink-0">
        <button
          onClick={handleBackToSite}
          className="w-full flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-xl text-sm font-medium text-gold-soft/70 hover:text-gold-soft hover:bg-gold-soft/10 transition-all duration-200 cursor-pointer"
        >
          <ArrowLeft className="size-5 rtl:-scale-x-100" />
          <span>{t('admin.backToSiteShort')}</span>
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main AdminLayout component                                         */
/* ------------------------------------------------------------------ */

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { adminPage, adminLogout, setView, contactMessages, admissionApplications, currentAdminUser } = useAppStore();
  const { t, isRTL } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // SECURITY MOUNT GUARD: AdminLayout only renders while an admin session
  // exists, so this is the right place to attach the admin-only data
  // subscriptions (/adminUsers, /activityLogs, …). subscribeAdminData() is
  // idempotent (guarded) and is torn down again in adminLogout.
  useEffect(() => {
    useAppStore.getState().subscribeAdminData();
  }, []);

  const unreadMessages = contactMessages.filter((m) => !m.isRead).length;
  const pendingApplications = admissionApplications.filter((a) => a.status === 'pending').length;

  const pageTitle = t(PAGE_TITLES[adminPage]);

  const handleLogout = () => {
    adminLogout();
    navigateTo('public');
  };

  return (
    <div className="min-h-screen flex bg-paper">
      {/* ========== Desktop Sidebar (lg+) ========== */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:start-0 geo-dark border-e border-gold-soft/10 z-30">
        <SidebarContent />
      </aside>

      {/* ========== Main area ========== */}
      <div className="flex-1 lg:ps-64 flex flex-col min-h-screen">
        {/* ---- Top header bar ---- */}
        <header className="sticky top-0 z-20 glass border-b border-islamic/10 shadow-[inset_0_-1px_0_color-mix(in_oklab,var(--accent)_12%,transparent)] h-16 flex items-center px-4 md:px-6 gap-4">
          {/* Gold flow line at very top */}
          <div aria-hidden="true" className="gold-flow-line absolute top-0 inset-x-0" />
          {/* Mobile hamburger */}
          <div className="lg:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-islamic-dark hover:bg-islamic/10 hover:text-islamic-dark" aria-label={t('adminLayout.openMenu')}>
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent aria-describedby={undefined} side={isRTL ? 'right' : 'left'} className="w-[280px] max-w-[85vw] p-0 bg-night border-gold-soft/15 overflow-y-auto [&>button]:text-gold-soft">
                <SheetHeader className="sr-only">
                  <SheetTitle>{t('adminLayout.navigationTitle')}</SheetTitle>
                </SheetHeader>
                <SidebarContent onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>

          {/* Page title */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-islamic-dark truncate">
              {pageTitle}
            </h1>
          </div>

          {/* Right side: badges + admin info + logout */}
          <div className="flex items-center gap-3">
            {/* Unread messages badge */}
            {unreadMessages > 0 && (
              <Badge className="bg-danger/10 text-danger border-danger/40 rounded-full text-xs hidden sm:flex">
                {t('adminLayout.unreadMessages', { count: unreadMessages })}
              </Badge>
            )}

            {/* Pending applications badge */}
            {pendingApplications > 0 && (
              <Badge className="bg-golden-lighter text-warning-foreground border-golden/40 rounded-full text-xs hidden sm:flex">
                {t('adminLayout.pendingBadge', { count: pendingApplications })}
              </Badge>
            )}

            <div className="hidden sm:flex items-center gap-2.5">
              <Avatar className="size-8 bg-islamic-lighter ring-2 ring-gold-soft/50">
                <AvatarFallback className="bg-gradient-to-br from-islamic to-islamic-dark text-white text-xs font-bold">
                  {currentAdminUser ? currentAdminUser.name.charAt(0) : t('adminNav.superAdmin').charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-islamic-dark leading-tight">
                  {currentAdminUser ? currentAdminUser.name : t('adminNav.superAdmin')}
                </span>
                {currentAdminUser && currentAdminUser.roleName && (
                  <span className="text-[10px] text-muted-foreground leading-tight">{currentAdminUser.roleName}</span>
                )}
              </div>
            </div>
            <Separator orientation="vertical" className="h-6 hidden sm:block bg-islamic/15" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-islamic-dark/60 hover:text-danger hover:bg-danger/10 gap-1.5 cursor-pointer rounded-full"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">{t('admin.logout')}</span>
            </Button>
          </div>
        </header>

        {/* ---- Main content ---- */}
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* One-time recovery key dialog (fires after first-admin registration or
          after generating a replacement key in Settings → Recovery) */}
      <RecoveryKeyDialog />
    </div>
  );
}
