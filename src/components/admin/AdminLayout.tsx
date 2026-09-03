'use client';

import { useState, type ReactNode } from 'react';
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
  CreditCard,
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
  SheetClose,
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
  { label: 'adminLayout.navPaymentHistory', page: 'payment-history', icon: <CreditCard className="size-5" /> },
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
  'payment-history': 'adminLayout.navPaymentHistory',
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
    adminLogout();
    navigateTo('public');
    onNavigate?.();
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Logo & Header */}
      <div className="p-4 sm:p-5 flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-lg bg-islamic-lighter border border-islamic/20 flex items-center justify-center shrink-0">
          <img
            src="/logo.png"
            alt={t('adminLayout.logoAlt')}
            className="w-8 h-8 object-contain rounded"
          />
        </div>
        <div className="min-w-0">
          <h2 className="font-bold text-islamic-dark text-base leading-tight truncate">
            {t('admin.adminPanel')}
          </h2>
          <p className="text-xs text-muted-foreground truncate">
            {t('adminLayout.subtitle')}
          </p>
        </div>
      </div>

      <Separator />

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
                  w-full flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-150 cursor-pointer
                  ${
                    isActive
                      ? 'bg-islamic-lighter text-islamic-dark shadow-sm'
                      : 'text-muted-foreground hover:bg-islamic-lighter/60 hover:text-islamic-dark active:bg-islamic-lighter/80'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className={isActive ? 'text-islamic' : 'text-muted-foreground'}>
                  {item.icon}
                </span>
                <span className="truncate">{t(item.label)}</span>
                {badgeCount > 0 && (
                  <Badge className="bg-red-100 text-red-700 text-xs ml-auto border-0 px-1.5 shrink-0">
                    {badgeCount}
                  </Badge>
                )}
                {isActive && !badgeCount && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-islamic shrink-0" />
                )}
              </button>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />

      {/* Bottom actions */}
      <div className="p-2 sm:p-3 space-y-0.5 shrink-0">
        <button
          onClick={handleBackToSite}
          className="w-full flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-golden-lighter/60 hover:text-golden transition-all duration-150 cursor-pointer active:bg-golden-lighter/80"
        >
          <ArrowLeft className="size-5" />
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
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const unreadMessages = contactMessages.filter((m) => !m.isRead).length;
  const pendingApplications = admissionApplications.filter((a) => a.status === 'pending').length;

  const pageTitle = t(PAGE_TITLES[adminPage]);

  const handleLogout = () => {
    adminLogout();
    navigateTo('public');
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* ========== Desktop Sidebar (lg+) ========== */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-card border-r border-islamic/10 z-30">
        <SidebarContent />
      </aside>

      {/* ========== Main area ========== */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* ---- Top header bar ---- */}
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border h-16 flex items-center px-4 gap-4">
          {/* Mobile hamburger */}
          <div className="lg:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-islamic-dark" aria-label={t('adminLayout.openMenu')}>
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] max-w-[85vw] p-0 bg-card overflow-y-auto">
                <SheetHeader className="sr-only">
                  <SheetTitle>{t('adminLayout.navigationTitle')}</SheetTitle>
                </SheetHeader>
                <SidebarContent onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>

          {/* Page title */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-islamic-dark truncate">
              {pageTitle}
            </h1>
          </div>

          {/* Right side: badges + admin info + logout */}
          <div className="flex items-center gap-3">
            {/* Unread messages badge */}
            {unreadMessages > 0 && (
              <Badge className="bg-red-100 text-red-700 border-red-200 text-xs hidden sm:flex">
                {t('adminLayout.unreadMessages', { count: unreadMessages })}
              </Badge>
            )}

            {/* Pending applications badge */}
            {pendingApplications > 0 && (
              <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs hidden sm:flex">
                {t('adminLayout.pendingBadge', { count: pendingApplications })}
              </Badge>
            )}

            <div className="hidden sm:flex items-center gap-2.5">
              <Avatar className="size-8 bg-islamic-lighter border border-islamic/20">
                <AvatarFallback className="bg-islamic text-white text-xs font-bold">
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
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-red-600 hover:bg-red-50 gap-1.5 cursor-pointer"
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
    </div>
  );
}
