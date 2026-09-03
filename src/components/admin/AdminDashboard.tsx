'use client';

import {
  UserCheck,
  Users,
  Bell,
  FileText,
  Plus,
  Award,
  CalendarDays,
  ArrowRight,
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import type { AdminPage } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

/* ------------------------------------------------------------------ */
/*  Stat card component                                                */
/* ------------------------------------------------------------------ */

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  bgClass: string;
  iconColorClass: string;
}

function StatCard({ title, value, icon, bgClass, iconColorClass }: StatCardProps) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5 flex items-center gap-4">
        <div
          className={`w-14 h-14 rounded-xl ${bgClass} flex items-center justify-center shrink-0`}
        >
          <span className={iconColorClass}>{icon}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground truncate">{title}</p>
          <p className="text-3xl font-bold text-islamic-dark leading-tight mt-0.5">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Quick action card component                                        */
/* ------------------------------------------------------------------ */

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  page: AdminPage;
  onClick: (page: AdminPage) => void;
  accentClass: string;
}

function QuickAction({
  title,
  description,
  icon,
  page,
  onClick,
  accentClass,
}: QuickActionProps) {
  return (
    <Card
      className="group shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5"
      onClick={() => onClick(page)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(page);
        }
      }}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div
            className={`w-11 h-11 rounded-lg ${accentClass} flex items-center justify-center shrink-0`}
          >
            {icon}
          </div>
          <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
        </div>
        <h3 className="font-semibold text-islamic-dark mt-3 text-sm">{title}</h3>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Dashboard component                                           */
/* ------------------------------------------------------------------ */

export default function AdminDashboard() {
  const { students, teachers, notices, blogs, setAdminPage } = useAppStore();
  const { t } = useTranslation();

  /* Last 5 notices (already sorted by createdAt desc from store) */
  const recentNotices = notices.slice(0, 5);

  /* Format a date string for display */
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      return dateStr;
    } catch {
      return '—';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Welcome header */}
      <div>
        <h2 className="text-2xl font-bold text-islamic-dark">
          {t('admin.dashboard')}
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          {t('adminDashboard.subtitle')}
        </p>
      </div>

      {/* Stat cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title={t('about.totalStudents')}
          value={students.length}
          icon={<UserCheck className="size-7" />}
          bgClass="bg-islamic-lighter"
          iconColorClass="text-islamic"
        />
        <StatCard
          title={t('adminDashboard.totalTeachers')}
          value={teachers.length}
          icon={<Users className="size-7" />}
          bgClass="bg-golden-lighter"
          iconColorClass="text-golden"
        />
        <StatCard
          title={t('adminDashboard.statNotices')}
          value={notices.length}
          icon={<Bell className="size-7" />}
          bgClass="bg-green-50"
          iconColorClass="text-green-600"
        />
        <StatCard
          title={t('adminDashboard.statBlogs')}
          value={blogs.length}
          icon={<FileText className="size-7" />}
          bgClass="bg-emerald-50"
          iconColorClass="text-emerald-600"
        />
      </div>

      {/* Two-column layout: Recent Notices + Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent notices table */}
        <div className="xl:col-span-2">
          <Card className="shadow-sm hidden md:block">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-islamic-dark flex items-center gap-2">
                  <CalendarDays className="size-5 text-islamic" />
                  {t('adminDashboard.recentNotices')}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAdminPage('notices')}
                  className="text-islamic hover:bg-islamic-lighter gap-1 text-xs"
                >
                  {t('adminDashboard.viewAll')}
                  <ArrowRight className="size-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              {recentNotices.length > 0 ? (
                <div className="max-h-80 overflow-x-auto overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs font-semibold text-muted-foreground">
                          {t('common.title')}
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground w-28">
                          {t('common.date')}
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground w-24 text-center">
                          {t('common.status')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentNotices.map((notice) => (
                        <TableRow key={notice.id} className="cursor-pointer" onClick={() => setAdminPage('notices')}>
                          <TableCell className="font-medium text-sm text-islamic-dark py-3 max-w-xs truncate">
                            {notice.title}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground py-3">
                            {formatDate(notice.date)}
                          </TableCell>
                          <TableCell className="py-3 text-center">
                            {notice.important ? (
                              <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100 text-xs">
                                {t('notices.important')}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                {t('adminDashboard.general')}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Bell className="size-10 opacity-30 mb-3" />
                  <p className="text-sm">{t('adminDashboard.noNotices')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mobile Cards for Notices */}
          <div className="md:hidden">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-islamic-dark flex items-center gap-2">
                <CalendarDays className="size-4 text-islamic" />
                {t('adminDashboard.recentNotices')}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAdminPage('notices')}
                className="text-islamic hover:bg-islamic-lighter gap-1 text-xs"
              >
                {t('adminDashboard.viewAll')}
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
            {recentNotices.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recentNotices.map((notice) => (
                  <Card key={notice.id} className="shadow-sm border-gray-100 cursor-pointer" onClick={() => setAdminPage('notices')}>
                    <CardContent className="p-3">
                      <p className="font-bold text-sm text-islamic-dark truncate">{notice.title}</p>
                      {notice.content && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notice.content}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-[10px] text-muted-foreground">{formatDate(notice.date)}</p>
                        {notice.important ? (
                          <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100 text-[10px] px-1.5 py-0">
                            {t('notices.important')}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {t('adminDashboard.general')}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Bell className="size-10 opacity-30 mb-3" />
                  <p className="text-sm">{t('adminDashboard.noNotices')}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <Card className="shadow-sm">
          <CardHeader className="pb-0">
            <CardTitle className="text-lg text-islamic-dark flex items-center gap-2">
              <Plus className="size-5 text-islamic" />
              {t('adminDashboard.quickActions')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 space-y-3">
            <QuickAction
              title={t('adminDashboard.newNotice')}
              description={t('adminDashboard.newNoticeDesc')}
              icon={<Bell className="size-5 text-islamic" />}
              page="notices"
              onClick={setAdminPage}
              accentClass="bg-islamic-lighter"
            />
            <QuickAction
              title={t('adminDashboard.newStudent')}
              description={t('adminDashboard.newStudentDesc')}
              icon={<UserCheck className="size-5 text-green-600" />}
              page="students"
              onClick={setAdminPage}
              accentClass="bg-green-50"
            />
            <QuickAction
              title={t('adminDashboard.addResult')}
              description={t('adminDashboard.addResultDesc')}
              icon={<Award className="size-5 text-golden" />}
              page="results"
              onClick={setAdminPage}
              accentClass="bg-golden-lighter"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
