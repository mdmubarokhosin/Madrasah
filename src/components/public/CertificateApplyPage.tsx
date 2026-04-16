'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Search, FileText, ClipboardCheck, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/store/app';
import type { Exam, Marhala, Student } from '@/types';

const steps = [
  { id: 1, label: 'শনাক্তকরণ', icon: Search },
  { id: 2, label: 'সনদ নির্বাচন', icon: FileText },
  { id: 3, label: 'আবেদন সম্পন্ন', icon: ClipboardCheck },
];

const certificateTypes = [
  { value: 'provisional', label: 'অস্থায়ী সনদপত্র (প্রভিশনাল)' },
  { value: 'certificate', label: 'সনদপত্র (সার্টিফিকেট)' },
  { value: 'transcript', label: 'ট্রান্সক্রিপ্ট' },
  { value: 'migration', label: 'মাইগ্রেশন সনদপত্র' },
];

export function CertificateApplyPage() {
  const { toast } = useToast();
  const { setCurrentPage } = useAppStore();
  const [exams, setExams] = useState<Exam[]>([]);
  const [marhalas, setMarhalas] = useState<Marhala[]>([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedMarhala, setSelectedMarhala] = useState('');
  const [roll, setRoll] = useState('');
  const [regNo, setRegNo] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [verified, setVerified] = useState(false);
  const [selectedCert, setSelectedCert] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [applicationId, setApplicationId] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/exams/public')
      .then((r) => r.json())
      .then((d) => setExams(d.exams || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const loadMarhalas = () => {
      if (selectedExam) {
        fetch(`/api/marhalas?examId=${selectedExam}`)
          .then((r) => r.json())
          .then((d) => setMarhalas(d.marhalas || []))
          .catch(() => {});
      } else {
        setMarhalas([]);
      }
    };
    loadMarhalas();
  }, [selectedExam]);

  const verifyStudent = async () => {
    if (!selectedExam || !selectedMarhala || !roll || !regNo) {
      toast({ title: 'ত্রুটি', description: 'সব তথ্য পূরণ করুন', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/results/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId: selectedExam, marhalaId: selectedMarhala, roll, regNo }),
      });
      const data = await res.json();
      if (res.ok && data.result) {
        setStudent(data.result.student || null);
        setVerified(true);
        setCurrentStep(2);
        toast({ title: 'সনাক্ত হয়েছে', description: `${data.result.student?.name} এর তথ্য পাওয়া গেছে` });
      } else {
        toast({ title: 'ত্রুটি', description: 'শিক্ষার্থী পাওয়া যায়নি', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'সার্ভারে সমস্যা হয়েছে', variant: 'destructive' });
    }
    setLoading(false);
  };

  const submitApplication = async () => {
    if (!selectedCert) {
      toast({ title: 'ত্রুটি', description: 'সনদের ধরন নির্বাচন করুন', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/certificates/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: selectedExam,
          marhalaId: selectedMarhala,
          roll,
          regNo,
          studentName: student?.name || '',
          certificateType: selectedCert,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setApplicationId(data.application.applicationId);
        setCurrentStep(3);
        toast({ title: 'আবেদন সম্পন্ন', description: 'আপনার আবেদন গৃহীত হয়েছে' });
      } else {
        toast({ title: 'ত্রুটি', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'সার্ভারে সমস্যা হয়েছে', variant: 'destructive' });
    }
    setLoading(false);
  };

  const copyId = () => {
    navigator.clipboard.writeText(applicationId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setStudent(null);
    setVerified(false);
    setSelectedCert('');
    setCurrentStep(1);
    setApplicationId('');
    setRoll('');
    setRegNo('');
    setSelectedExam('');
    setSelectedMarhala('');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-center">সনদের আবেদন</h1>
        <p className="text-muted-foreground text-center mb-8">নিচের ধাপগুলো অনুসরণ করে সনদের জন্য আবেদন করুন</p>

        {/* Stepper */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    currentStep >= step.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {currentStep > step.id ? <CheckCircle className="h-5 w-5" /> : step.id}
                </div>
                <span className="text-xs mt-1 text-muted-foreground hidden sm:block">{step.label}</span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`w-16 sm:w-24 h-0.5 mx-2 transition-colors ${
                    currentStep > step.id ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Identification */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ধাপ ১: শনাক্তকরণ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>পরীক্ষা নির্বাচন করুন</Label>
                <Select value={selectedExam} onValueChange={setSelectedExam}>
                  <SelectTrigger><SelectValue placeholder="পরীক্ষা নির্বাচন করুন" /></SelectTrigger>
                  <SelectContent>
                    {exams.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>মারহালা নির্বাচন করুন</Label>
                <Select value={selectedMarhala} onValueChange={setSelectedMarhala}>
                  <SelectTrigger><SelectValue placeholder="মারহালা নির্বাচন করুন" /></SelectTrigger>
                  <SelectContent>
                    {marhalas.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>রোল নম্বর</Label>
                  <Input value={roll} onChange={(e) => setRoll(e.target.value)} placeholder="রোল" />
                </div>
                <div className="space-y-2">
                  <Label>রেজিস্ট্রেশন নম্বর</Label>
                  <Input value={regNo} onChange={(e) => setRegNo(e.target.value)} placeholder="রেজি. নং" />
                </div>
              </div>
              <Button onClick={verifyStudent} disabled={loading} className="w-full">
                <Search className="mr-2 h-4 w-4" />
                {loading ? 'যাচাই হচ্ছে...' : 'শিক্ষার্থী যাচাই করুন'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Certificate Selection */}
        {currentStep === 2 && student && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ধাপ ২: সনদ নির্বাচন</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground">শিক্ষার্থী</p>
                <p className="font-semibold">{student.name}</p>
                <p className="text-sm text-muted-foreground">রোল: {student.roll} | রেজি. নং: {student.regNo}</p>
              </div>
              <div className="space-y-2">
                <Label>সনদের ধরন নির্বাচন করুন</Label>
                <div className="space-y-2">
                  {certificateTypes.map((ct) => (
                    <label
                      key={ct.value}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedCert === ct.value ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="certType"
                        value={ct.value}
                        checked={selectedCert === ct.value}
                        onChange={(e) => setSelectedCert(e.target.value)}
                        className="accent-primary"
                      />
                      <span className="text-sm">{ct.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
                  পূর্ববর্তী
                </Button>
                <Button onClick={submitApplication} disabled={loading} className="flex-1">
                  {loading ? 'জমা হচ্ছে...' : 'আবেদন জমা দিন'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Confirmation */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                আবেদন সম্পন্ন
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">আপনার আবেদন আইডি</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-xl font-bold font-mono text-primary">{applicationId}</p>
                  <Button variant="ghost" size="icon" onClick={copyId} className="h-8 w-8">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">এই আইডিটি সংরক্ষণ করুন। সনদের স্ট্যাটাস জানতে এটি লাগবে।</p>
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  সনদের স্ট্যাটাস দেখতে &quot;সনদের স্ট্যাটাস&quot; পেজে যান
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={reset}>
                    নতুন আবেদন
                  </Button>
                  <Button onClick={() => setCurrentPage('certificate-status')}>
                    স্ট্যাটাস দেখুন
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
