'use client';

import { useState } from 'react';
import { UserCheck, Search, Eye, CheckCircle, XCircle, Loader2, FileText } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { dbUpdate } from '@/lib/db-service';
import { useTranslation } from '@/lib/i18n-context';
import type { AdmissionApplication } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

// i18n keys for displaying the status in the UI (DB value stays English)
const STATUS_KEYS: Record<string, string> = {
  pending: 'admin.pending',
  approved: 'admin.approved',
  rejected: 'admin.rejected',
};

// i18n keys for the per-status success toast
const STATUS_TOAST_KEYS: Record<string, string> = {
  pending: 'adminApplications.setPendingToast',
  approved: 'adminApplications.approvedToast',
  rejected: 'adminApplications.rejectedToast',
};

// Bengali labels — used ONLY inside activity-log details written to Firebase
// (log data is stored in Bengali), never displayed directly in the UI.
const STATUS_LOG_LABELS: Record<string, string> = {
  pending: 'অপেক্ষমান',
  approved: 'অনুমোদিত',
  rejected: 'প্রত্যাখ্যাত',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
};

export default function AdminApplications() {
  const { admissionApplications, logActivity } = useAppStore();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [search, setSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState<AdmissionApplication | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const filtered = admissionApplications.filter((app) => {
    const q = search.toLowerCase();
    const matchSearch = app.studentName.toLowerCase().includes(q) || app.phone.includes(q);
    const matchFilter = filter === 'all' || app.status === filter;
    return matchSearch && matchFilter;
  });

  const handleUpdateStatus = async (id: string, status: string, name: string) => {
    setUpdating(id);
    try {
      await dbUpdate(`/admissionApplications/${id}`, { status });
      toast({
        title: t('common.success'),
        description: t(STATUS_TOAST_KEYS[status], { name }),
      });
      logActivity('ভর্তি আবেদন', `"${name}" এর ভর্তি আবেদন ${STATUS_LOG_LABELS[status]} করা হয়েছে`);
      if (selectedApp?.id === id) {
        setSelectedApp({ ...selectedApp, status: status as 'pending' | 'approved' | 'rejected' });
      }
    } catch {
      toast({ title: t('common.error'), description: t('common.operationFailed'), variant: 'destructive' });
    } finally {
      setUpdating(null);
    }
  };

  const formatDate = (timestamp: number) => {
    try {
      return new Date(timestamp).toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const pendingCount = admissionApplications.filter((a) => a.status === 'pending').length;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-islamic-dark">{t('admin.applications')}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t('adminApplications.subtitle')}
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-sm px-3 py-1">
            {t('adminApplications.pendingCount', { count: pendingCount })}
          </Badge>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('adminApplications.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'rejected'].map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className={`text-xs ${filter === f ? 'bg-islamic hover:bg-islamic-light' : ''}`}
            >
              {f === 'all' ? t('common.all') : t(STATUS_KEYS[f] ?? f)}
            </Button>
          ))}
        </div>
      </div>

      {/* Applications */}
      {filtered.length > 0 ? (
        <div className="grid gap-3">
          {filtered.map((app) => (
            <Card
              key={app.id}
              className="cursor-pointer hover:shadow-md transition-all border-gray-100"
              onClick={() => setSelectedApp(app)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-islamic-dark truncate">
                        {app.studentName}
                      </span>
                      <Badge className={`${statusColors[app.status]} text-xs`}>
                        {t(STATUS_KEYS[app.status] ?? app.status)}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>{t('common.phone')}: {app.phone}</span>
                      {app.desiredDepartment && <span>{t('about.departments')}: {app.desiredDepartment}</span>}
                      <span>{formatDate(app.createdAt)}</span>
                    </div>
                  </div>
                  <Eye className="w-4 h-4 text-gray-400 shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-muted-foreground">
            {search || filter !== 'all' ? t('adminApplications.noResults') : t('adminApplications.noApplications')}
          </p>
        </div>
      )}

      {/* Application Detail Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg text-islamic-dark flex items-center gap-2">
              {selectedApp?.studentName}
              <Badge className={`${statusColors[selectedApp?.status || 'pending']} text-xs`}>
                {t(STATUS_KEYS[selectedApp?.status || 'pending'])}
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {t('adminApplications.applicantDetails')}
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">{t('adminApplications.fatherName')}</p>
                  <p className="font-medium">{selectedApp.fatherName}</p>
                </div>
                {selectedApp.motherName && (
                  <div>
                    <p className="text-muted-foreground text-xs">{t('adminApplications.motherName')}</p>
                    <p className="font-medium">{selectedApp.motherName}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground text-xs">{t('common.phone')}</p>
                  <p className="font-medium">{selectedApp.phone}</p>
                </div>
                {selectedApp.guardianPhone && (
                  <div>
                    <p className="text-muted-foreground text-xs">{t('adminApplications.guardianPhone')}</p>
                    <p className="font-medium">{selectedApp.guardianPhone}</p>
                  </div>
                )}
                {selectedApp.dateOfBirth && (
                  <div>
                    <p className="text-muted-foreground text-xs">{t('adminApplications.dateOfBirth')}</p>
                    <p className="font-medium">{selectedApp.dateOfBirth}</p>
                  </div>
                )}
                {selectedApp.bloodGroup && (
                  <div>
                    <p className="text-muted-foreground text-xs">{t('adminApplications.bloodGroup')}</p>
                    <p className="font-medium">{selectedApp.bloodGroup}</p>
                  </div>
                )}
              </div>

              {selectedApp.address && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">{t('common.address')}</p>
                  <p className="text-sm">{selectedApp.address}</p>
                </div>
              )}

              {selectedApp.previousEducation && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">{t('adminApplications.previousEducation')}</p>
                  <p className="text-sm">{selectedApp.previousEducation}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {selectedApp.desiredDepartment && (
                  <div>
                    <p className="text-muted-foreground text-xs">{t('adminApplications.desiredDepartment')}</p>
                    <p className="font-medium">{selectedApp.desiredDepartment}</p>
                  </div>
                )}
                {selectedApp.desiredClass && (
                  <div>
                    <p className="text-muted-foreground text-xs">{t('adminApplications.desiredClass')}</p>
                    <p className="font-medium">{selectedApp.desiredClass}</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex gap-2">
                {selectedApp.status === 'pending' && (
                  <>
                    <Button
                      onClick={() => handleUpdateStatus(selectedApp.id, 'approved', selectedApp.studentName)}
                      disabled={updating === selectedApp.id}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                    >
                      {updating === selectedApp.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      {t('adminApplications.approve')}
                    </Button>
                    <Button
                      onClick={() => handleUpdateStatus(selectedApp.id, 'rejected', selectedApp.studentName)}
                      disabled={updating === selectedApp.id}
                      variant="destructive"
                      className="flex-1 gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      {t('adminApplications.reject')}
                    </Button>
                  </>
                )}
                {selectedApp.status !== 'pending' && (
                  <Button
                    onClick={() => handleUpdateStatus(selectedApp.id, 'pending', selectedApp.studentName)}
                    disabled={updating === selectedApp.id}
                    variant="outline"
                    className="flex-1 gap-1.5"
                  >
                    {t('adminApplications.backToPending')}
                  </Button>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t('common.close')}</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
