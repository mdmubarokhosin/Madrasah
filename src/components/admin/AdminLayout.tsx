'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/app';
import { authFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  LayoutDashboard, Users, BookOpen, ClipboardList, Bell, HelpCircle,
  FileText, MessageSquare, Settings, LogOut, GraduationCap, Menu, ChevronLeft,
  Calendar, Layers, UserCheck, DollarSign, TrendingUp, Wallet, Receipt, Banknote,
  GraduationCap as GraduationCapIcon, Printer
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import type { PageName, Stats } from '@/types';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminAcademicYears } from './pages/AdminAcademicYears';
import { AdminClasses } from './pages/AdminClasses';
import { AdminStudents } from './pages/AdminStudents';
import { AdminExams } from './pages/AdminExams';
import { AdminResults } from './pages/AdminResults';
import { AdminAttendance } from './pages/AdminAttendance';
import { AdminFinanceOverview } from './pages/AdminFinanceOverview';
import { AdminIncome } from './pages/AdminIncome';
import { AdminExpenses } from './pages/AdminExpenses';
import { AdminSalaries } from './pages/AdminSalaries';
import { AdminFees } from './pages/AdminFees';
import { AdminNotices } from './pages/AdminNotices';
import { AdminFaqs } from './pages/AdminFaqs';
import { AdminCertificates } from './pages/AdminCertificates';
import { AdminMessages } from './pages/AdminMessages';
import { AdminSettings } from './pages/AdminSettings';
import { AdminMarhalas } from './pages/AdminMarhalas';
import { AdminSubjects } from './pages/AdminSubjects';
import { AdminPrintCenter } from './pages/AdminPrintCenter';

const menuGroups = [
  {
    label: 'প্রধান',
    items: [
      { page: 'admin-dashboard' as PageName, label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
    ],
  },
  {
    label: 'শিক্ষা ব্যবস্থাপনা',
    items: [
      { page: 'admin-academic-years' as PageName, label: 'শিক্ষাবর্ষ', icon: Calendar },
      { page: 'admin-classes' as PageName, label: 'শ্রেণি', icon: Layers },
      { page: 'admin-students' as PageName, label: 'শিক্ষার্থী', icon: Users },
      { page: 'admin-exams' as PageName, label: 'পরীক্ষা', icon: BookOpen },
      { page: 'admin-marhalas' as PageName, label: 'মারহালা', icon: GraduationCapIcon },
      { page: 'admin-subjects' as PageName, label: 'বিষয়', icon: FileText },
      { page: 'admin-results' as PageName, label: 'ফলাফল', icon: ClipboardList },
      { page: 'admin-print-center' as PageName, label: 'প্রিন্ট সেন্টার', icon: Printer },
      { page: 'admin-attendance' as PageName, label: 'উপস্থিতি', icon: UserCheck },
    ],
  },
  {
    label: 'আর্থিক ব্যবস্থাপনা',
    items: [
      { page: 'admin-finance' as PageName, label: 'আর্থিক সারসংক্ষেপ', icon: TrendingUp },
      { page: 'admin-income' as PageName, label: 'আয়', icon: Wallet },
      { page: 'admin-expenses' as PageName, label: 'ব্যয়', icon: Receipt },
      { page: 'admin-salaries' as PageName, label: 'বেতন', icon: Banknote },
      { page: 'admin-fees' as PageName, label: 'শিক্ষার্থী ফি', icon: DollarSign },
    ],
  },
  {
    label: 'অন্যান্য',
    items: [
      { page: 'admin-notices' as PageName, label: 'নোটিশ', icon: Bell },
      { page: 'admin-faqs' as PageName, label: 'সাধারণ জিজ্ঞাসা', icon: HelpCircle },
      { page: 'admin-certificates' as PageName, label: 'সনদ', icon: FileText },
      { page: 'admin-messages' as PageName, label: 'বার্তা', icon: MessageSquare },
      { page: 'admin-settings' as PageName, label: 'সেটিংস', icon: Settings },
    ],
  },
];

export function AdminLayout() {
  const { currentPage, setCurrentPage, admin, clearAuth } = useAppStore();
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    authFetch('/api/stats').then((r) => r.json()).then(setStats).catch(() => {});
  }, []);

  const handleLogout = () => {
    clearAuth();
    toast({ title: 'লগআউট', description: 'সফলভাবে লগআউট হয়েছে' });
  };

  const handleNav = (page: PageName) => {
    setCurrentPage(page);
    setSidebarOpen(false);
  };

  const getPageLabel = () => {
    for (const group of menuGroups) {
      const item = group.items.find((i) => i.page === currentPage);
      if (item) return item.label;
    }
    return 'ড্যাশবোর্ড';
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'admin-dashboard': return <AdminDashboard stats={stats} />;
      case 'admin-academic-years': return <AdminAcademicYears />;
      case 'admin-classes': return <AdminClasses />;
      case 'admin-students': return <AdminStudents />;
      case 'admin-exams': return <AdminExams />;
      case 'admin-marhalas': return <AdminMarhalas />;
      case 'admin-subjects': return <AdminSubjects />;
      case 'admin-print-center': return <AdminPrintCenter />;
      case 'admin-results': return <AdminResults />;
      case 'admin-attendance': return <AdminAttendance />;
      case 'admin-finance': return <AdminFinanceOverview />;
      case 'admin-income': return <AdminIncome />;
      case 'admin-expenses': return <AdminExpenses />;
      case 'admin-salaries': return <AdminSalaries />;
      case 'admin-fees': return <AdminFees />;
      case 'admin-notices': return <AdminNotices />;
      case 'admin-faqs': return <AdminFaqs />;
      case 'admin-certificates': return <AdminCertificates />;
      case 'admin-messages': return <AdminMessages />;
      case 'admin-settings': return <AdminSettings />;
      default: return <AdminDashboard stats={stats} />;
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
          <GraduationCap className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="font-bold text-sm">প্রশাসনিক প্যানেল</h2>
          <p className="text-xs text-muted-foreground">{admin?.name}</p>
        </div>
      </div>
      <Separator />
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-4">
          {menuGroups.map((group) => (
            <div key={group.label}>
              <p className="px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <Button
                    key={item.page}
                    variant={currentPage === item.page ? 'secondary' : 'ghost'}
                    className="w-full justify-start gap-2 text-xs h-8"
                    onClick={() => handleNav(item.page)}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                    {item.page === 'admin-messages' && stats && stats.unreadMessages > 0 && (
                      <Badge className="ml-auto bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0">
                        {stats.unreadMessages}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <Separator />
      <div className="p-2 space-y-1">
        <Button variant="ghost" className="w-full justify-start gap-2 text-xs text-muted-foreground h-8" onClick={() => { clearAuth(); setSidebarOpen(false); }}>
          <ChevronLeft className="h-3.5 w-3.5" />
          ওয়েবসাইটে ফিরুন
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-2 text-xs text-destructive h-8" onClick={handleLogout}>
          <LogOut className="h-3.5 w-3.5" />
          লগআউট
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-muted/30">
      <aside className="hidden lg:flex w-60 border-r bg-card flex-col">
        {sidebarContent}
      </aside>
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="right" className="w-60 p-0">
          <VisuallyHidden>
            <SheetTitle>অ্যাডমিন মেনু</SheetTitle>
          </VisuallyHidden>
          {sidebarContent}
        </SheetContent>
      </Sheet>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b bg-card flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-sm font-semibold">{getPageLabel()}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:block">{admin?.name}</span>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <ScrollArea className="flex-1">
          <div className="p-4 md:p-6">{renderPage()}</div>
        </ScrollArea>
      </div>
    </div>
  );
}
