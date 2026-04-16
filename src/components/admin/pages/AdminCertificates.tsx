'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { authFetch } from '@/lib/api';
import type { CertificateApplication, Student, Result, ResultItem } from '@/types';
import {
  CheckCircle, XCircle, Printer, Eye, Clock, Award,
  FileText, GraduationCap, User, MapPin, Calendar, Hash,
  BookOpen, TrendingUp, ChevronLeft, ChevronRight
} from 'lucide-react';

const statusLabels: Record<string, string> = {
  pending: 'অপেক্ষমাণ',
  approved: 'অনুমোদিত',
  rejected: 'বাতিল',
  delivered: 'বিতরণকৃত',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  approved: 'default',
  rejected: 'destructive',
  delivered: 'outline',
};

const certTypeLabels: Record<string, string> = {
  provisional: 'অস্থায়ী সনদপত্র',
  certificate: 'সনদপত্র',
  transcript: 'ট্রান্সক্রিপ্ট',
  migration: 'মাইগ্রেশন সনদপত্র',
};

export function AdminCertificates() {
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  const [applications, setApplications] = useState<CertificateApplication[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  // Detail dialog
  const [selectedApp, setSelectedApp] = useState<CertificateApplication | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [resultData, setResultData] = useState<Result | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const limit = 20;

  const loadApplications = useCallback(async (p: number, f: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(limit) });
      if (f && f !== 'all') params.set('status', f);
      const res = await authFetch(`/api/certificates?${params}`);
      const data = await res.json();
      setApplications(data.applications || []);
      setTotal(data.total || 0);
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' });
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { loadApplications(page, statusFilter); }, [page, statusFilter, loadApplications]);

  const loadDetail = async (app: CertificateApplication) => {
    setSelectedApp(app);
    setDetailOpen(true);
    setDetailLoading(true);
    setStudentData(null);
    setResultData(null);
    try {
      const res = await authFetch(`/api/certificates/${app.id}`);
      const data = await res.json();
      if (res.ok) {
        setStudentData(data.application?.student || null);
        setResultData(data.result || null);
      }
    } catch {
      // silent
    }
    setDetailLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      const res = await authFetch(`/api/certificates/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast({ title: status === 'approved' ? 'অনুমোদিত হয়েছে' : status === 'rejected' ? 'বাতিল হয়েছে' : 'আপডেট হয়েছে' });
        loadApplications(page, statusFilter);
        // Update selected app if dialog open
        if (selectedApp && selectedApp.id === id) {
          setSelectedApp({ ...selectedApp, status: status as CertificateApplication['status'] });
        }
      } else {
        toast({ title: 'ত্রুটি', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' });
    }
    setUpdating(null);
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      toast({ title: 'প্রিন্ট উইন্ডো খুলতে সমস্যা', variant: 'destructive' });
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="bn">
      <head>
        <meta charset="UTF-8">
        <title>সনদপত্র - ${selectedApp?.studentName || ''}</title>
        <link href="https://fonts.maateen.me/kalpurush/font.css" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Kalpurush', 'Noto Sans Bengali', sans-serif;
            background: white;
            color: #1a1a1a;
            padding: 20mm;
            font-size: 13pt;
          }
          @page { size: A4; margin: 15mm; }
          .cert-container {
            border: 4px double #166534;
            padding: 20mm 25mm;
            position: relative;
            min-height: 250mm;
            background: linear-gradient(135deg, #fefefe 0%, #f0fdf4 100%);
          }
          .cert-header {
            text-align: center;
            border-bottom: 3px double #166534;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }
          .cert-header .madrasa-name {
            font-size: 18pt;
            font-weight: bold;
            color: #166534;
            margin-bottom: 4px;
          }
          .cert-header .madrasa-name-en {
            font-size: 11pt;
            color: #166534;
            font-style: italic;
          }
          .cert-header .cert-type {
            font-size: 22pt;
            font-weight: bold;
            color: #166534;
            margin-top: 8px;
            padding: 6px 20px;
            border: 2px solid #166534;
            display: inline-block;
            letter-spacing: 1px;
          }
          .cert-body { margin: 24px 0; }
          .cert-body .intro-text {
            text-align: center;
            font-size: 13pt;
            line-height: 2;
            color: #333;
            margin-bottom: 20px;
          }
          .cert-body .student-info {
            margin: 16px auto;
            max-width: 85%;
          }
          .cert-body .info-row {
            display: flex;
            align-items: baseline;
            padding: 6px 0;
            border-bottom: 1px dotted #ccc;
            font-size: 12pt;
          }
          .cert-body .info-label {
            font-weight: bold;
            color: #166534;
            min-width: 160px;
            flex-shrink: 0;
          }
          .cert-body .info-value {
            flex: 1;
            color: #222;
            font-weight: 500;
          }
          .cert-result-table {
            width: 100%;
            margin: 16px auto;
            max-width: 90%;
            border-collapse: collapse;
            font-size: 11pt;
          }
          .cert-result-table th {
            background: #166534;
            color: white;
            padding: 8px 12px;
            text-align: center;
            font-size: 11pt;
            border: 1px solid #166534;
          }
          .cert-result-table td {
            padding: 6px 12px;
            text-align: center;
            border: 1px solid #ddd;
            font-size: 10.5pt;
          }
          .cert-result-table tr:nth-child(even) td { background: #f0fdf4; }
          .cert-result-table .total-row td {
            font-weight: bold;
            background: #dcfce7 !important;
            border: 2px solid #166534;
          }
          .cert-footer {
            margin-top: 30px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding-top: 20px;
          }
          .cert-footer .issue-date {
            text-align: left;
            font-size: 11pt;
          }
          .cert-footer .issue-date .date-label { color: #166534; font-weight: bold; }
          .cert-footer .signatures { text-align: center; }
          .cert-footer .signature-box {
            margin-top: 50px;
            text-align: center;
            min-width: 140px;
          }
          .cert-footer .signature-line {
            border-top: 1px solid #333;
            margin-top: 4px;
            padding-top: 4px;
            font-size: 10pt;
            color: #555;
          }
          .cert-watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            font-size: 60pt;
            color: rgba(22, 101, 52, 0.04);
            font-weight: bold;
            pointer-events: none;
            white-space: nowrap;
          }
          .cert-id {
            position: absolute;
            bottom: 15mm;
            left: 25mm;
            font-size: 9pt;
            color: #888;
            font-family: monospace;
          }
          .gpa-badge {
            display: inline-block;
            background: #166534;
            color: white;
            padding: 4px 16px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 13pt;
          }
          .pass-status {
            display: inline-block;
            padding: 3px 14px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 12pt;
          }
          .pass-status.pass { background: #dcfce7; color: #166534; border: 1px solid #166534; }
          .pass-status.fail { background: #fee2e2; color: #991b1b; border: 1px solid #991b1b; }
          .ornament-top {
            text-align: center;
            font-size: 16pt;
            color: #166534;
            margin-bottom: 6px;
          }
          .ornament-bottom {
            text-align: center;
            font-size: 16pt;
            color: #166534;
            margin-top: 6px;
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const getGrade = (marks: number, totalMarks: number) => {
    const pct = (marks / totalMarks) * 100;
    if (pct >= 80) return 'A+';
    if (pct >= 70) return 'A';
    if (pct >= 60) return 'A-';
    if (pct >= 50) return 'B';
    if (pct >= 40) return 'C';
    if (pct >= 33) return 'D';
    return 'F';
  };

  const getGPAFromGrade = (grade: string) => {
    const gpaMap: Record<string, number> = { 'A+': 5.0, 'A': 4.0, 'A-': 3.5, 'B': 3.0, 'C': 2.5, 'D': 2.0, 'F': 0 };
    return gpaMap[grade] ?? 0;
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">সনদ ব্যবস্থাপনা</h2>
          <p className="text-sm text-muted-foreground">মোট: {total} টি আবেদন</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="স্ট্যাটাস ফিল্টার" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব</SelectItem>
              <SelectItem value="pending">অপেক্ষমাণ</SelectItem>
              <SelectItem value="approved">অনুমোদিত</SelectItem>
              <SelectItem value="rejected">বাতিল</SelectItem>
              <SelectItem value="delivered">বিতরণকৃত</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">আবেদন আইডি</TableHead>
                  <TableHead className="text-xs">শিক্ষার্থী</TableHead>
                  <TableHead className="text-xs text-center hidden md:table-cell">সনদ</TableHead>
                  <TableHead className="text-xs text-center hidden sm:table-cell">পরীক্ষা</TableHead>
                  <TableHead className="text-xs text-center">স্ট্যাটাস</TableHead>
                  <TableHead className="text-xs text-center">তারিখ</TableHead>
                  <TableHead className="text-xs text-right">কার্যক্রম</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">লোড হচ্ছে...</TableCell></TableRow>
                ) : applications.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">কোনো আবেদন নেই</TableCell></TableRow>
                ) : applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-mono text-[10px] sm:text-xs">{app.applicationId}</TableCell>
                    <TableCell>
                      <p className="text-xs sm:text-sm font-medium">{app.studentName}</p>
                      <p className="text-[10px] text-muted-foreground">রোল: {app.roll}</p>
                    </TableCell>
                    <TableCell className="text-center hidden md:table-cell text-xs">
                      {certTypeLabels[app.certificateType] || app.certificateType}
                    </TableCell>
                    <TableCell className="text-center hidden sm:table-cell text-xs">
                      {app.exam?.name || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={statusVariants[app.status] || 'secondary'} className="text-[10px]">
                        {statusLabels[app.status] || app.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-[10px] text-muted-foreground hidden sm:table-cell">
                      {new Date(app.createdAt).toLocaleDateString('bn-BD')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => loadDetail(app)} title="বিস্তারিত">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {app.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => updateStatus(app.id, 'approved')}
                              disabled={updating === app.id}
                              title="অনুমোদন"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => updateStatus(app.id, 'rejected')}
                              disabled={updating === app.id}
                              title="বাতিল"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        {app.status === 'approved' && (
                          <>
                            <Button
                              variant="ghost" size="icon" className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => updateStatus(app.id, 'delivered')}
                              disabled={updating === app.id}
                              title="বিতরণকৃত"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => { loadDetail(app); setTimeout(() => handlePrint(), 300); }}
                              title="প্রিন্ট"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        {app.status === 'delivered' && (
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            onClick={() => { loadDetail(app); setTimeout(() => handlePrint(), 300); }}
                            title="প্রিন্ট"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {(app.status === 'rejected') && (
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-muted"
                            onClick={() => { loadDetail(app); setTimeout(() => handlePrint(), 300); }}
                            title="প্রিন্ট"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">পৃষ্ঠা {page} / {totalPages}</span>
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={(open) => { if (!open) { setDetailOpen(false); setSelectedApp(null); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">আবেদনের বিস্তারিত</DialogTitle>
            <DialogDescription>সনদ আবেদনের সকল তথ্য</DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-4">
              {/* Status & Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariants[selectedApp.status]} className="text-sm px-3 py-1">
                    {statusLabels[selectedApp.status]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">আবেদন: {selectedApp.applicationId}</span>
                </div>
                <div className="flex gap-2">
                  {selectedApp.status === 'pending' && (
                    <>
                      <Button
                        size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => updateStatus(selectedApp.id, 'approved')}
                        disabled={updating === selectedApp.id}
                      >
                        <CheckCircle className="mr-1.5 h-4 w-4" />
                        {updating === selectedApp.id ? 'প্রক্রিয়াধীন...' : 'অনুমোদন'}
                      </Button>
                      <Button
                        size="sm" variant="destructive"
                        onClick={() => updateStatus(selectedApp.id, 'rejected')}
                        disabled={updating === selectedApp.id}
                      >
                        <XCircle className="mr-1.5 h-4 w-4" />
                        {updating === selectedApp.id ? 'প্রক্রিয়াধীন...' : 'বাতিল'}
                      </Button>
                    </>
                  )}
                  {selectedApp.status === 'approved' && (
                    <Button
                      size="sm" variant="outline"
                      onClick={() => updateStatus(selectedApp.id, 'delivered')}
                      disabled={updating === selectedApp.id}
                    >
                      বিতরণকৃত করুন
                    </Button>
                  )}
                  {(selectedApp.status === 'approved' || selectedApp.status === 'delivered') && (
                    <Button
                      size="sm" className="bg-primary hover:bg-primary/90"
                      onClick={handlePrint}
                    >
                      <Printer className="mr-1.5 h-4 w-4" />
                      সনদ প্রিন্ট
                    </Button>
                  )}
                </div>
              </div>

              {detailLoading ? (
                <div className="text-center py-8 text-muted-foreground">লোড হচ্ছে...</div>
              ) : (
                <>
                  {/* Student Info */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4" />
                        শিক্ষার্থীর তথ্য
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">নাম</p>
                          <p className="font-medium">{selectedApp.studentName}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">পিতার নাম</p>
                          <p className="font-medium">{studentData?.fatherName || '-'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">রোল নম্বর</p>
                          <p className="font-medium">{selectedApp.roll}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">রেজিস্ট্রেশন নম্বর</p>
                          <p className="font-medium">{selectedApp.regNo}</p>
                        </div>
                        {studentData?.dateOfBirth && (
                          <div>
                            <p className="text-muted-foreground text-xs">জন্ম তারিখ</p>
                            <p className="font-medium">{studentData.dateOfBirth}</p>
                          </div>
                        )}
                        {studentData?.address && (
                          <div>
                            <p className="text-muted-foreground text-xs">ঠিকানা</p>
                            <p className="font-medium">{studentData.address}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Exam Info */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        পরীক্ষার তথ্য
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">পরীক্ষা</p>
                          <p className="font-medium">{selectedApp.exam?.name || '-'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">মারহালা</p>
                          <p className="font-medium">{selectedApp.marhala?.name || '-'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">সনদের ধরন</p>
                          <p className="font-medium">{certTypeLabels[selectedApp.certificateType] || selectedApp.certificateType}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Result Info (if available) */}
                  {resultData && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          ফলাফল
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-4 mb-4">
                          <div>
                            <p className="text-xs text-muted-foreground">মোট নম্বর</p>
                            <p className="text-lg font-bold">{resultData.totalMarks}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">GPA</p>
                            <p className="text-lg font-bold text-primary">{resultData.gpa.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">মেধা</p>
                            <p className="text-lg font-bold">{resultData.merit ? `${resultData.merit} তম` : '-'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">ফলাফল</p>
                            <Badge className={resultData.isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}>
                              {resultData.isPassed ? 'পাশ' : 'ফেল'}
                            </Badge>
                          </div>
                        </div>
                        {resultData.items && resultData.items.length > 0 && (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-xs">বিষয়</TableHead>
                                <TableHead className="text-xs text-center">পূর্ণমান</TableHead>
                                <TableHead className="text-xs text-center">প্রাপ্ত নম্বর</TableHead>
                                <TableHead className="text-xs text-center">গ্রেড</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {resultData.items.map((item) => {
                                const grade = item.subject ? getGrade(item.marks, item.subject.totalMarks) : '-';
                                return (
                                  <TableRow key={item.id}>
                                    <TableCell className="text-xs">{item.subject?.name || '-'}</TableCell>
                                    <TableCell className="text-xs text-center">{item.subject?.totalMarks || '-'}</TableCell>
                                    <TableCell className="text-xs text-center font-medium">{item.marks}</TableCell>
                                    <TableCell className="text-xs text-center">
                                      <Badge variant={grade === 'F' ? 'destructive' : 'outline'} className="text-[10px]">
                                        {grade}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Application Timeline */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        আবেদনের সময়রেখা
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                          <span>আবেদন জমা: {new Date(selectedApp.createdAt).toLocaleString('bn-BD')}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${selectedApp.status !== 'pending' ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                          <span>আপডেট: {selectedApp.updatedAt !== selectedApp.createdAt ? new Date(selectedApp.updatedAt).toLocaleString('bn-BD') : 'এখনো হয়নি'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== CERTIFICATE PRINT TEMPLATE (hidden) ===== */}
      <div ref={printRef} style={{ display: 'none' }}>
        {selectedApp && (
          <div className="cert-container">
            <div className="cert-watermark">
              &#x2726; &#x2726; &#x2726; {selectedApp.exam?.name || 'মাদরাসা'} &#x2726; &#x2726; &#x2726;
            </div>

            {/* Ornament */}
            <div className="ornament-top">&#x2726; &#x2756; &#x2726; &#x2756; &#x2726;</div>

            {/* Header */}
            <div className="cert-header">
              <div className="madrasa-name">&#x2726; &#x099C;&#x09BE;&#x09AE;&#x09BF;&#x09AF;&#x09BC;&#x09BE; &#x0987;&#x09B8;&#x09B2;&#x09BE;&#x09AE;&#x09BF;&#x09AF;&#x09BC;&#x09BE; &#x09A6;&#x09BE;&#x09B0;&#x09C1;&#x09B2; &#x0989;&#x09B2;&#x09C2;&#x09AE; &#x2726;</div>
              <div className="madrasa-name-en">Jamia Islamia Darul Uloom</div>
              <div className="cert-type">{certTypeLabels[selectedApp.certificateType] || selectedApp.certificateType}</div>
            </div>

            {/* Body */}
            <div className="cert-body">
              <div className="intro-text">
                &#x098F;&#x09A4;&#x09A6;&#x09CD;&#x09AF;&#x09BE;&#x09A8;&#x09CD;&#x09A4;&#x09C7; &#x09AA;&#x09CD;&#x09B0;&#x09A4;&#x09BF;&#x09AF;&#x09BC;&#x09CB;&#x099C;&#x09BF;&#x09A4; &#x09B9;&#x09DF; &#x09AF;&#x09C7;,
                <br />
                <strong>{selectedApp.studentName}</strong>,
                &#x09AA;&#x09BF;&#x09A4;&#x09BE;/&#x09AA;&#x09BF;&#x09A4;&#x09BE;&#x09B0; &#x09A8;&#x09BE;&#x09AE;: <strong>{studentData?.fatherName || '-'}</strong>,
                &#x099C;&#x09A8;&#x09CD;&#x09AE;: <strong>{studentData?.gender === 'male' ? '&#x09AA;&#x09C1;&#x09B0;&#x09C1;&#x09B7;' : studentData?.gender === 'female' ? '&#x09AE;&#x09B9;&#x09BF;&#x09B2;&#x09BE;' : '-'}</strong>
                {studentData?.dateOfBirth && (
                  <>, &#x099C;&#x09A8;&#x09CD;&#x09AE; &#x09A4;&#x09BE;&#x09B0;&#x09BF;&#x0996;: <strong>{studentData.dateOfBirth}</strong></>
                )}
                <br />
                &#x0986;&#x09AE;&#x09BF; &#x09B8;&#x09A8;&#x09A6;&#x09BF;&#x09A4; &#x0985;&#x09A8;&#x09C1;&#x09B8;&#x09BE;&#x09B0;&#x09C7; &#x099C;&#x09BE;&#x09A8;&#x09BF;&#x09DF;&#x09C7; &#x09A5;&#x09C7;&#x0995;&#x09C7; &#x09AF;&#x09C7;, &#x0986;&#x09AA;&#x09A8;&#x09BF; <strong>{selectedApp.exam?.name || '-'}</strong>
                &#x09AA;&#x09B0;&#x09C0;&#x0995;&#x09CD;&#x09B7;&#x09BE;&#x09DF; <strong>{selectedApp.marhala?.name || '-'}</strong> &#x09AE;&#x09BE;&#x09B0;&#x09B9;&#x09BE;&#x09B2;&#x09BE;&#x09DF;
                &#x0985;&#x0982;&#x09B6;&#x0997;&#x09CD;&#x09B0;&#x09B9;&#x09A3; &#x0995;&#x09B0;&#x09C7;&#x099B;&#x09C7;&#x09A8;&#x0964;
              </div>

              {/* Student Info Table */}
              <div className="student-info">
                <div className="info-row">
                  <span className="info-label">&#x09B0;&#x09CB;&#x09B2; &#x09A8;&#x09AE;&#x09CD;&#x09AC;&#x09B0;:</span>
                  <span className="info-value">{selectedApp.roll}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">&#x09B0;&#x09C7;&#x099C;&#x09BF;&#x09B8;&#x09CD;&#x099F;&#x09CD;&#x09B0;&#x09C7;&#x09B6;&#x09A8; &#x09A8;&#x09AE;&#x09CD;&#x09AC;&#x09B0;:</span>
                  <span className="info-value">{selectedApp.regNo}</span>
                </div>
                {studentData?.address && (
                  <div className="info-row">
                    <span className="info-label">&#x09A0;&#x09BF;&#x0995;&#x09BE;&#x09A8;&#x09BE;:</span>
                    <span className="info-value">{studentData.address}</span>
                  </div>
                )}
              </div>

              {/* Result Table */}
              {resultData && resultData.items && resultData.items.length > 0 && (
                <>
                  <h3 style={{ textAlign: 'center', color: '#166534', fontSize: '14pt', marginTop: '20px', marginBottom: '10px' }}>
                    &#x09AA;&#x09B0;&#x09C0;&#x0995;&#x09CD;&#x09B7;&#x09BE;&#x09B0; &#x09AB;&#x09B2;&#x09BE;&#x09AB;&#x09B2;
                  </h3>
                  <table className="cert-result-table">
                    <thead>
                      <tr>
                        <th>ক্রমিক</th>
                        <th>বিষয়</th>
                        <th>পূর্ণমান</th>
                        <th>প্রাপ্ত নম্বর</th>
                        <th>গ্রেড</th>
                        <th>ফলাফল</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultData.items.map((item, idx) => {
                        const grade = item.subject ? getGrade(item.marks, item.subject.totalMarks) : '-';
                        const isPass = item.isPassed;
                        return (
                          <tr key={item.id}>
                            <td>{idx + 1}</td>
                            <td style={{ textAlign: 'left' }}>{item.subject?.name || '-'}</td>
                            <td>{item.subject?.totalMarks || '-'}</td>
                            <td>{item.marks}</td>
                            <td><strong>{grade}</strong></td>
                            <td>
                              <span className={`pass-status ${isPass ? 'pass' : 'fail'}`}>
                                {isPass ? 'পাশ' : 'ফেল'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="total-row">
                        <td colSpan={2} style={{ textAlign: 'left' }}>মোট</td>
                        <td>-</td>
                        <td><strong>{resultData.totalMarks}</strong></td>
                        <td><span className="gpa-badge">{resultData.gpa.toFixed(2)}</span></td>
                        <td>
                          <span className={`pass-status ${resultData.isPassed ? 'pass' : 'fail'}`}>
                            {resultData.isPassed ? 'পাশ' : 'ফেল'}
                          </span>
                        </td>
                      </tr>
                      {resultData.merit && (
                        <tr className="total-row">
                          <td colSpan={6} style={{ textAlign: 'center', fontSize: '11pt' }}>
                            &#x09AE;&#x09C7;&#x09A7;&#x09BE;: <strong>{resultData.merit} &#x09A4;&#x09AE;</strong>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </>
              )}

              {/* Result summary for non-result certificates */}
              {resultData && (!resultData.items || resultData.items.length === 0) && (
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <p>&#x09AE;&#x09CB;&#x099F; &#x09A8;&#x09AE;&#x09CD;&#x09AC;&#x09B0;: <strong>{resultData.totalMarks}</strong> | GPA: <span className="gpa-badge">{resultData.gpa.toFixed(2)}</span></p>
                  <p>&#x09AB;&#x09B2;&#x09BE;&#x09AB;&#x09B2;: <span className={`pass-status ${resultData.isPassed ? 'pass' : 'fail'}`}>{resultData.isPassed ? 'পাশ' : 'ফেল'}</span></p>
                  {resultData.merit && <p>&#x09AE;&#x09C7;&#x09A7;&#x09BE;: <strong>{resultData.merit} &#x09A4;&#x09AE;</strong></p>}
                </div>
              )}

              {/* No result case */}
              {!resultData && (
                <div style={{ textAlign: 'center', marginTop: '16px', padding: '12px', background: '#fef9c3', borderRadius: '4px' }}>
                  &#x09AB;&#x09B2;&#x09BE;&#x09AB;&#x09B2; &#x09A4;&#x09A5;&#x09CD;&#x09AF; &#x09AA;&#x09BE;&#x0993;&#x09DF;&#x09BE; &#x09AF;&#x09BE;&#x09DF; &#x09A8;&#x09BF;&#x0964;
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="cert-footer">
              <div className="issue-date">
                <p>&#x09AA;&#x09CD;&#x09B0;&#x09A6;&#x09BE;&#x09A8;&#x09C7;&#x09B0; &#x09A4;&#x09BE;&#x09B0;&#x09BF;&#x0996;:</p>
                <p className="date-label"><strong>{new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></p>
              </div>

              <div className="signatures">
                <div className="signature-box">
                  <div className="signature-line">&#x09AA;&#x09CD;&#x09B0;&#x09BF;&#x09A8;&#x09CD;&#x09B8;&#x09BF;&#x09AA;&#x09BE;&#x09B2;</div>
                </div>
              </div>
              <div className="signatures">
                <div className="signature-box">
                  <div className="signature-line">&#x09AA;&#x09B0;&#x09C0;&#x0995;&#x09CD;&#x09B7;&#x09BE; &#x09A8;&#x09BF;&#x09DF;&#x09A8;&#x09CD;&#x09A4;&#x09CD;&#x09B0;&#x09C0;</div>
                </div>
              </div>
              <div className="signatures">
                <div className="signature-box">
                  <div className="signature-line">&#x09AE;&#x09B9;&#x09BE;&#x09A4;&#x09BF;&#x09B0; &#x09AA;&#x09B0;&#x09BF;&#x099A;&#x09BE;&#x09B2;&#x0995;</div>
                </div>
              </div>
            </div>

            {/* Application ID */}
            <div className="cert-id">
              &#x0986;&#x09AC;&#x09C7;&#x09A6;&#x09A8; &#x0986;&#x0987;&#x09A1;&#x09BF;: {selectedApp.applicationId}
            </div>

            {/* Ornament */}
            <div className="ornament-bottom">&#x2726; &#x2756; &#x2726; &#x2756; &#x2726;</div>
          </div>
        )}
      </div>
    </div>
  );
}
