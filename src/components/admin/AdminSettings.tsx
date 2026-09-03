'use client';

import { useState, useEffect } from 'react';
import { Globe, Lock, Github, Loader2, CheckCircle, AlertCircle, Save, Shield, Link, Map, Facebook, Youtube, MessageCircle, CreditCard, Plus, Trash2, CalendarDays, BookOpen, Database, Calendar, Clock, User, Timer, Image, Smartphone, X, XCircle, ArrowRight, Archive } from 'lucide-react';
import AdminBackup from './AdminBackup';
import { useAppStore } from '@/store/app-store';
import { dbSet, dbGet, dbPush } from '@/lib/db-service';
import { toML, type MLValue } from '@/lib/multilingual';
import { MLInput, MLTextarea } from '@/components/admin/MLFields';
import type { SiteInfo, GithubConfig, BohudurConfig, ClassRoutineItem, SyllabusItem, PaymentMethod } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/lib/i18n-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminSettings() {
  const { siteInfo, githubConfig, bohudurConfig, classRoutine, syllabus } = useAppStore();
  const { toast } = useToast();
  const { t } = useTranslation();

  /* Site Info form (base fields) */
  const [siteForm, setSiteForm] = useState<Omit<SiteInfo, 'aboutText' | 'aboutText2' | 'aboutText3' | 'vision' | 'mission'>>({
    name: '',
    nameEn: '',
    nameAr: '',
    slogan: '',
    sloganEn: '',
    sloganAr: '',
    address: '',
    phone: '',
    email: '',
    established: '',
    totalStudents: '',
    totalTeachers: '',
    totalDepts: '',
    officeHours: '',
    facebook: '',
    youtube: '',
    whatsapp: '',
    mapEmbedUrl: '',
  });

  /* Site Info form (trilingual long texts) */
  const [aboutML, setAboutML] = useState<Record<'aboutText' | 'aboutText2' | 'aboutText3' | 'vision' | 'mission', MLValue>>({
    aboutText: { bn: '', en: '', ar: '' },
    aboutText2: { bn: '', en: '', ar: '' },
    aboutText3: { bn: '', en: '', ar: '' },
    vision: { bn: '', en: '', ar: '' },
    mission: { bn: '', en: '', ar: '' },
  });
  const [savingSite, setSavingSite] = useState(false);

  /* Password form */
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  /* GitHub form */
  const [githubForm, setGithubForm] = useState<GithubConfig>({ token: '', owner: '', repo: '', branch: 'main' });
  const [savingGithub, setSavingGithub] = useState(false);

  /* GitHub test */
  const [testingGithub, setTestingGithub] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'fail' | null>(null);

  /* Bohudur form */
  const [bohudurForm, setBohudurForm] = useState<BohudurConfig>({
    apiKey: '',
    enabled: false,
    currency: 'BDT',
    redirectUrl: '',
    cancelUrl: '',
    webhookSuccessUrl: '',
    webhookCancelUrl: '',
  });
  const [savingBohudur, setSavingBohudur] = useState(false);
  const [testingBohudur, setTestingBohudur] = useState(false);
  const [bohudurTestResult, setBohudurTestResult] = useState<'success' | 'fail' | null>(null);

  /* Payment Methods management */
  const { paymentMethods } = useAppStore();
  const [localPaymentMethods, setLocalPaymentMethods] = useState<PaymentMethod[]>([]);
  const [savingPaymentMethods, setSavingPaymentMethods] = useState(false);

  /* Class Routine management */
  const [localClassRoutine, setLocalClassRoutine] = useState<ClassRoutineItem[]>([]);
  const [localSyllabus, setLocalSyllabus] = useState<SyllabusItem[]>([]);
  const [savingTools, setSavingTools] = useState(false);

  /* Sync payment methods from store */
  useEffect(() => {
    if (paymentMethods.length > 0) {
      setLocalPaymentMethods([...paymentMethods]);
    }
  }, [paymentMethods]);

  const addPaymentMethod = () => {
    setLocalPaymentMethods(prev => [...prev, { name: '', number: '', type: 'default', iconUrl: '' }]);
  };

  const removePaymentMethod = (index: number) => {
    setLocalPaymentMethods(prev => prev.filter((_, i) => i !== index));
  };

  const updatePaymentMethod = (index: number, key: keyof PaymentMethod, value: string) => {
    setLocalPaymentMethods(prev => prev.map((item, i) => i === index ? { ...item, [key]: value } : item));
  };

  const handleSavePaymentMethods = async () => {
    setSavingPaymentMethods(true);
    try {
      const cleaned = localPaymentMethods.map(({ name, number, type, iconUrl }) => ({
        name: name.trim(),
        number: number.trim(),
        type: type.trim(),
        iconUrl: iconUrl?.trim() || '',
      }));
      await dbSet('/config/paymentMethods', cleaned);
      toast({ title: t('common.success'), description: t('settings.paymentMethodsUpdated') });
    } catch {
      toast({ title: t('common.error'), description: t('common.saveFailed'), variant: 'destructive' });
    } finally {
      setSavingPaymentMethods(false);
    }
  };

  const handlePaymentMethodIconUpload = async (index: number, file: File) => {
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        if (githubConfig?.token && githubConfig?.owner && githubConfig?.repo) {
          try {
            const fileName = `payment-icons/${file.name}`;
            const res = await fetch(`https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${fileName}`, {
              method: 'PUT',
              headers: {
                'Authorization': `token ${githubConfig.token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                message: `Upload payment icon: ${file.name}`,
                content: base64.split(',')[1],
                branch: githubConfig.branch || 'main',
              }),
            });
            if (res.ok) {
              const data = await res.json();
              const rawUrl = data.content.download_url;
              updatePaymentMethod(index, 'iconUrl', rawUrl);
              toast({ title: t('common.success'), description: t('settings.iconUploaded') });
            } else {
              toast({ title: t('common.error'), description: t('settings.iconUploadFailed'), variant: 'destructive' });
            }
          } catch {
            toast({ title: t('common.error'), description: t('settings.githubUploadFailed'), variant: 'destructive' });
          }
        } else {
          toast({ title: t('common.error'), description: t('settings.githubFirstConfig'), variant: 'destructive' });
        }
      };
      reader.readAsDataURL(file);
    } catch {
      toast({ title: t('common.error'), description: t('settings.fileReadError'), variant: 'destructive' });
    }
  };

  /* Sync class routine from store */
 useEffect(() => {
    if (classRoutine.length > 0) {
      setLocalClassRoutine([...classRoutine]);
 }
  }, [classRoutine]);

  /* Sync syllabus from store */
 useEffect(() => {
    if (syllabus.length > 0) {
      setLocalSyllabus([...syllabus]);
 }
  }, [syllabus]);

  const updateClassRoutineItem = (index: number, key: keyof ClassRoutineItem, value: string) => {
    setLocalClassRoutine(prev => prev.map((item, i) => i === index ? { ...item, [key]: value } : item));
  };

  const addClassRoutineItem = () => {
    setLocalClassRoutine(prev => [...prev, { time: '', subject: '', teacher: '', duration: '' }]);
  };

  const removeClassRoutineItem = (index: number) => {
    setLocalClassRoutine(prev => prev.filter((_, i) => i !== index));
  };

  const updateSyllabusItem = (index: number, key: keyof SyllabusItem, value: string) => {
    setLocalSyllabus(prev => prev.map((item, i) => i === index ? { ...item, [key]: value } : item));
  };

  const addSyllabusItem = () => {
    setLocalSyllabus(prev => [...prev, { name: '', year: '' }]);
  };

  const removeSyllabusItem = (index: number) => {
    setLocalSyllabus(prev => prev.filter((_, i) => i !== index));
 };

  const handleSaveClassRoutine = async () => {
    setSavingTools(true);
    try {
      await dbSet('/config/classRoutine', localClassRoutine);
      toast({ title: t('common.success'), description: t('settings.classRoutineUpdated') });
    } catch {
      toast({ title: t('common.error'), description: t('common.saveFailed'), variant: 'destructive' });
    } finally {
      setSavingTools(false);
    }
  };

  const handleSaveSyllabus = async () => {
    setSavingTools(true);
    try {
      await dbSet('/config/syllabus', localSyllabus);
      toast({ title: t('common.success'), description: t('settings.syllabusUpdated') });
    } catch {
      toast({ title: t('common.error'), description: t('common.saveFailed'), variant: 'destructive' });
    } finally {
      setSavingTools(false);
    }
  };

  /* Sync site info from store */
  useEffect(() => {
    if (siteInfo) {
      setSiteForm({ 
        name: siteInfo.name || '',
        nameEn: (siteInfo as any).nameEn || '',
        nameAr: siteInfo.nameAr || '',
        slogan: siteInfo.slogan || '',
        sloganEn: (siteInfo as any).sloganEn || '',
        sloganAr: (siteInfo as any).sloganAr || '',
        address: siteInfo.address || '',
        phone: siteInfo.phone || '',
        email: siteInfo.email || '',
        established: siteInfo.established || '',
        totalStudents: siteInfo.totalStudents || '',
        totalTeachers: siteInfo.totalTeachers || '',
        totalDepts: siteInfo.totalDepts || '',
        officeHours: siteInfo.officeHours || '',
        facebook: siteInfo.facebook || '',
        youtube: siteInfo.youtube || '',
        whatsapp: siteInfo.whatsapp || '',
        mapEmbedUrl: siteInfo.mapEmbedUrl || '',
      });
      setAboutML({
        aboutText: toML(siteInfo, 'aboutText'),
        aboutText2: toML(siteInfo, 'aboutText2'),
        aboutText3: toML(siteInfo, 'aboutText3'),
        vision: toML(siteInfo, 'vision'),
        mission: toML(siteInfo, 'mission'),
      });
    }
  }, [siteInfo]);

  /* Sync github config from store */
  useEffect(() => {
    if (githubConfig) {
      setGithubForm({ ...githubConfig });
    }
  }, [githubConfig]);

  /* Sync bohudur config from store */
  useEffect(() => {
    if (bohudurConfig) {
      setBohudurForm({ ...bohudurConfig });
    }
  }, [bohudurConfig]);

  /* Save Site Info */
  const handleSaveSite = async () => {
    if (!siteForm.name.trim()) {
      toast({ title: t('common.error'), description: t('settings.nameRequired'), variant: 'destructive' });
      return;
    }

    setSavingSite(true);
    try {
      const payload = {
        ...siteForm,
        aboutText: aboutML.aboutText.bn.trim(),
        aboutTextEn: aboutML.aboutText.en.trim(),
        aboutTextAr: aboutML.aboutText.ar.trim(),
        aboutText2: aboutML.aboutText2.bn.trim(),
        aboutText2En: aboutML.aboutText2.en.trim(),
        aboutText2Ar: aboutML.aboutText2.ar.trim(),
        aboutText3: aboutML.aboutText3.bn.trim(),
        aboutText3En: aboutML.aboutText3.en.trim(),
        aboutText3Ar: aboutML.aboutText3.ar.trim(),
        vision: aboutML.vision.bn.trim(),
        visionEn: aboutML.vision.en.trim(),
        visionAr: aboutML.vision.ar.trim(),
        mission: aboutML.mission.bn.trim(),
        missionEn: aboutML.mission.en.trim(),
        missionAr: aboutML.mission.ar.trim(),
      };
      await dbSet('/config/siteInfo', payload);
      toast({ title: t('common.success'), description: t('settings.siteInfoUpdated') });
    } catch {
      toast({ title: t('common.error'), description: t('common.saveFailed'), variant: 'destructive' });
    } finally {
      setSavingSite(false);
    }
  };

  /* Save Password */
  const handleSavePassword = async () => {
    if (!passwordForm.newPassword) {
      toast({ title: t('common.error'), description: t('settings.newPasswordRequired'), variant: 'destructive' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: t('common.error'), description: t('settings.passwordMismatch'), variant: 'destructive' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast({ title: t('common.error'), description: t('settings.passwordTooShort'), variant: 'destructive' });
      return;
    }

    setSavingPassword(true);
    try {
      if (passwordForm.oldPassword) {
        const stored = await dbGet<{ password: string }>('/config/adminAuth');
        if (stored && stored.password !== passwordForm.oldPassword) {
          toast({ title: t('common.error'), description: t('settings.oldPasswordWrong'), variant: 'destructive' });
          setSavingPassword(false);
          return;
        }
      }

      await dbSet('/config/adminAuth', { password: passwordForm.newPassword });
      toast({ title: t('common.success'), description: t('settings.passwordChanged') });
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      toast({ title: t('common.error'), description: t('settings.passwordChangeFailed'), variant: 'destructive' });
    } finally {
      setSavingPassword(false);
    }
  };

  /* Save GitHub Config */
  const handleSaveGithub = async () => {
    if (!githubForm.token || !githubForm.owner || !githubForm.repo) {
      toast({ title: t('common.error'), description: t('settings.githubFieldsRequired'), variant: 'destructive' });
      return;
    }

    setSavingGithub(true);
    try {
      await dbSet('/config/githubConfig', githubForm);
      toast({ title: t('common.success'), description: t('settings.githubSaved') });
      setTestResult(null);
    } catch {
      toast({ title: t('common.error'), description: t('common.saveFailed'), variant: 'destructive' });
    } finally {
      setSavingGithub(false);
    }
  };

  /* Test GitHub Connection */
  const handleTestGithub = async () => {
    if (!githubForm.token || !githubForm.owner || !githubForm.repo) {
      toast({ title: t('common.error'), description: t('settings.saveGithubFirst'), variant: 'destructive' });
      return;
    }

    setTestingGithub(true);
    setTestResult(null);
    try {
      const response = await fetch(
        `https://api.github.com/repos/${githubForm.owner}/${githubForm.repo}`,
        {
          headers: {
            'Authorization': `token ${githubForm.token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTestResult('success');
        toast({
          title: t('settings.connectSuccess'),
          description: `Repository: ${data.full_name || `${githubForm.owner}/${githubForm.repo}`}`,
        });
      } else {
        setTestResult('fail');
        toast({
          title: t('settings.connectFailed'),
          description: t('settings.repoNotFound', { status: response.status }),
          variant: 'destructive',
        });
      }
    } catch {
      setTestResult('fail');
      toast({
        title: t('settings.connectFailed'),
        description: t('payment.error.network'),
        variant: 'destructive',
      });
    } finally {
      setTestingGithub(false);
    }
  };

  /* Save Bohudur Config */
  const handleSaveBohudur = async () => {
    if (!bohudurForm.apiKey.trim()) {
      toast({ title: t('common.error'), description: t('settings.bohudurKeyRequired'), variant: 'destructive' });
      return;
    }

    setSavingBohudur(true);
    try {
      await dbSet('/config/bohudurConfig', bohudurForm);
      toast({ title: t('common.success'), description: t('settings.bohudurSaved') });
      setBohudurTestResult(null);
    } catch {
      toast({ title: t('common.error'), description: t('common.saveFailed'), variant: 'destructive' });
    } finally {
      setSavingBohudur(false);
    }
  };

  /* Test Bohudur Connection */
  const handleTestBohudur = async () => {
    if (!bohudurForm.apiKey.trim()) {
      toast({ title: t('common.error'), description: t('settings.enterApiKey'), variant: 'destructive' });
      return;
    }

    setTestingBohudur(true);
    setBohudurTestResult(null);
    try {
      // Call /api/bohudur/check — works via Next.js API routes (dev) or CF Functions (prod)
      let data: any;
      let responseOk = false;
      let responseStatus = 0;

      try {
        const response = await fetch('/api/bohudur/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey: bohudurForm.apiKey,
            redirect_url: typeof window !== 'undefined' ? window.location.origin : '',
          }),
        });

        responseStatus = response.status;
        responseOk = response.ok;

        if (!response.ok) {
          const errText = await response.text().catch(() => '');
          throw new Error(t('settings.serverErrorStatus', { status: response.status, detail: errText || t('settings.noInfo') }));
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          const errText = await response.text().catch(() => '');
          throw new Error(t('settings.jsonResponseError', { contentType }));
        }

        data = await response.json();
      } catch (fetchErr) {
        // Network error or non-JSON response
        const errMsg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);

        // Detect common issues
        if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError') || errMsg.includes('fetch failed')) {
          throw new Error(t('settings.networkCheck'));
        }
        if (errMsg.includes('Content-Type')) {
          throw new Error(errMsg);
        }
        throw fetchErr;
      }

      // Analyze the response — Bohudur v2 uses flat format
      // Success: { valid: true, success: true, testPaymentUrl: "..." }
      // Or raw Bohudur: { status: "success", payment_url: "..." }
      const paymentUrl = data?.testPaymentUrl || data?.payment_url || data?.data?.payment_url || '';
      const isApiValid = data?.valid === true || (data?.success === true && paymentUrl);

      if (isApiValid) {
        setBohudurTestResult('success');
        toast({
          title: t('settings.connectSuccess'),
          description: data.message || t('settings.bohudurKeyValid'),
        });
      } else if (data?.valid === false || data?.success === false) {
        setBohudurTestResult('fail');
        const responseCode = data.responseCode || data.data?.responseCode;
        const errorMsg = data.message || data.data?.message || t('settings.apiKeyVerifyFailed');

        let detailMsg = errorMsg;
        if (responseCode) {
          detailMsg += t('settings.codeSuffix', { code: responseCode });
        }

        // Bohudur v2 Create API error codes (3000-3019)
        if (responseCode === 3000) {
          detailMsg += t('settings.code3000');
        } else if (responseCode === 3001) {
          detailMsg += t('settings.code3001');
        } else if (responseCode === 3014) {
          detailMsg += t('settings.code3014');
        } else if (responseCode === 3015 || responseCode === 3018) {
          detailMsg += t('settings.code3015');
        } else if (responseCode === 3017) {
          detailMsg += t('settings.code3017');
        }

        toast({
          title: t('settings.apiKeyInvalid'),
          description: detailMsg,
          variant: 'destructive',
        });
      } else {
        // Unexpected response — log for debugging
        setBohudurTestResult('fail');
        const rawMsg = typeof data === 'string' ? data : JSON.stringify(data);
        console.warn('[Bohudur Test] Unexpected response:', data);
        toast({
          title: t('settings.unexpectedResponse'),
          description: t('settings.unexpectedResponseDesc', { response: rawMsg.substring(0, 200) }),
          variant: 'destructive',
        });
      }
    } catch (err) {
      setBohudurTestResult('fail');
      const msg = err instanceof Error ? err.message : t('settings.unknownError');
      toast({
        title: t('settings.connectFailed'),
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setTestingBohudur(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-islamic-dark">{t('settings.title')}</h2>
        <p className="text-muted-foreground text-sm mt-1">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Tabbed Layout */}
      <Tabs defaultValue="site-info" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 sm:grid-cols-7 h-auto gap-1 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger
            value="site-info"
            className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Globe className="size-3.5" />
            <span className="hidden sm:inline">{t('settings.siteInfo')}</span>
            <span className="sm:hidden">{t('settings.tabSite')}</span>
          </TabsTrigger>
          <TabsTrigger
            value="social"
            className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Link className="size-3.5" />
            <span className="hidden sm:inline">{t('settings.tabSocial')}</span>
            <span className="sm:hidden">{t('settings.tabSocialShort')}</span>
          </TabsTrigger>
          <TabsTrigger
            value="payment"
            className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <CreditCard className="size-3.5" />
            <span className="hidden sm:inline">{t('settings.tabPayment')}</span>
            <span className="sm:hidden">{t('settings.tabPayment')}</span>
          </TabsTrigger>
          <TabsTrigger
            value="password"
            className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Lock className="size-3.5" />
            {t('admin.password')}
          </TabsTrigger>
          <TabsTrigger
            value="github"
            className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Github className="size-3.5" />
            <span className="hidden sm:inline">GitHub</span>
          </TabsTrigger>
          <TabsTrigger
            value="tools"
            className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <CalendarDays className="size-3.5" />
            <span className="hidden sm:inline">{t('settings.tabTools')}</span>
          </TabsTrigger>
          <TabsTrigger
            value="backup"
            className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Archive className="size-3.5" />
            {t('settings.tabBackup')}
          </TabsTrigger>
        </TabsList>

        {/* ========== Site Info Tab ========== */}
        <TabsContent value="site-info">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-islamic-dark flex items-center gap-2">
                <Globe className="size-5" />
                {t('settings.siteInfo')}
              </CardTitle>
              <CardDescription>
                {t('settings.siteInfoDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-islamic-dark">{t('settings.basicInfo')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="site-name">{t('settings.name')}</Label>
                    <Input
                      id="site-name"
                      value={siteForm.name}
                      onChange={(e) => setSiteForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="site-name-en">{t('settings.nameEn')}</Label>
                    <Input
                      id="site-name-en"
                      dir="ltr"
                      placeholder="English name"
                      value={siteForm.nameEn}
                      onChange={(e) => setSiteForm((f) => ({ ...f, nameEn: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="site-name-ar">{t('settings.nameAr')}</Label>
                    <Input
                      id="site-name-ar"
                      dir="rtl"
                      value={siteForm.nameAr}
                      onChange={(e) => setSiteForm((f) => ({ ...f, nameAr: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="site-slogan">{t('settings.slogan')}</Label>
                    <Input
                      id="site-slogan"
                      value={siteForm.slogan}
                      onChange={(e) => setSiteForm((f) => ({ ...f, slogan: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="site-slogan-en">{t('settings.sloganEn')}</Label>
                    <Input
                      id="site-slogan-en"
                      dir="ltr"
                      placeholder="English slogan"
                      value={siteForm.sloganEn}
                      onChange={(e) => setSiteForm((f) => ({ ...f, sloganEn: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="site-slogan-ar">{t('settings.sloganAr')}</Label>
                    <Input
                      id="site-slogan-ar"
                      dir="rtl"
                      value={siteForm.sloganAr}
                      onChange={(e) => setSiteForm((f) => ({ ...f, sloganAr: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="site-address">{t('common.address')}</Label>
                    <Input
                      id="site-address"
                      value={siteForm.address}
                      onChange={(e) => setSiteForm((f) => ({ ...f, address: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="site-phone">{t('common.phone')}</Label>
                    <Input
                      id="site-phone"
                      value={siteForm.phone}
                      onChange={(e) => setSiteForm((f) => ({ ...f, phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="site-email">{t('common.email')}</Label>
                    <Input
                      id="site-email"
                      type="email"
                      value={siteForm.email}
                      onChange={(e) => setSiteForm((f) => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="site-office-hours">{t('settings.officeHours')}</Label>
                    <Input
                      id="site-office-hours"
                      placeholder={t('settings.officeHoursPh')}
                      value={siteForm.officeHours}
                      onChange={(e) => setSiteForm((f) => ({ ...f, officeHours: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Stats */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-islamic-dark">{t('settings.statistics')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="site-established">{t('settings.established')}</Label>
                    <Input
                      id="site-established"
                      value={siteForm.established}
                      onChange={(e) => setSiteForm((f) => ({ ...f, established: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="site-students">{t('settings.totalStudents')}</Label>
                    <Input
                      id="site-students"
                      value={siteForm.totalStudents}
                      onChange={(e) => setSiteForm((f) => ({ ...f, totalStudents: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="site-teachers">{t('settings.totalTeachers')}</Label>
                    <Input
                      id="site-teachers"
                      value={siteForm.totalTeachers}
                      onChange={(e) => setSiteForm((f) => ({ ...f, totalTeachers: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="site-depts">{t('settings.totalDepts')}</Label>
                    <Input
                      id="site-depts"
                      value={siteForm.totalDepts}
                      onChange={(e) => setSiteForm((f) => ({ ...f, totalDepts: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* About texts (trilingual) */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-islamic-dark">{t('settings.aboutSectionML')}</h3>
                <div className="space-y-3">
                  <MLTextarea
                    label={t('settings.about1')}
                    rows={3}
                    value={aboutML.aboutText}
                    onChange={(v) => setAboutML((m) => ({ ...m, aboutText: v }))}
                  />
                  <MLTextarea
                    label={t('settings.about2')}
                    rows={3}
                    value={aboutML.aboutText2}
                    onChange={(v) => setAboutML((m) => ({ ...m, aboutText2: v }))}
                  />
                  <MLTextarea
                    label={t('settings.about3')}
                    rows={3}
                    value={aboutML.aboutText3}
                    onChange={(v) => setAboutML((m) => ({ ...m, aboutText3: v }))}
                  />
                </div>
              </div>

              <Separator />

              {/* Vision & Mission (trilingual) */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-islamic-dark">{t('settings.visionMissionML')}</h3>
                <div className="space-y-3">
                  <MLTextarea
                    label={t('settings.vision')}
                    rows={3}
                    value={aboutML.vision}
                    onChange={(v) => setAboutML((m) => ({ ...m, vision: v }))}
                  />
                  <MLTextarea
                    label={t('settings.mission')}
                    rows={3}
                    value={aboutML.mission}
                    onChange={(v) => setAboutML((m) => ({ ...m, mission: v }))}
                  />
                </div>
              </div>

              {/* Save button */}
              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSaveSite}
                  disabled={savingSite}
                  className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
                >
                  {savingSite && <Loader2 className="size-4 animate-spin" />}
                  <Save className="size-4" />
                  {t('settings.save')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== Social Links Tab ========== */}
        <TabsContent value="social">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-islamic-dark flex items-center gap-2">
                <Link className="size-5" />
                {t('settings.socialTitle')}
              </CardTitle>
              <CardDescription>
                {t('settings.socialDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <p className="text-xs text-blue-700">
                  {t('settings.socialHint')}
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="facebook" className="flex items-center gap-2">
                    <Facebook className="w-4 h-4 text-blue-600" />
                    {t('settings.facebookUrl')}
                  </Label>
                  <Input
                    id="facebook"
                    placeholder="https://facebook.com/your-page"
                    value={siteForm.facebook}
                    onChange={(e) => setSiteForm((f) => ({ ...f, facebook: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="youtube" className="flex items-center gap-2">
                    <Youtube className="w-4 h-4 text-red-600" />
                    {t('settings.youtubeUrl')}
                  </Label>
                  <Input
                    id="youtube"
                    placeholder="https://youtube.com/@your-channel"
                    value={siteForm.youtube}
                    onChange={(e) => setSiteForm((f) => ({ ...f, youtube: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp" className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-green-600" />
                    {t('settings.whatsappUrl')}
                  </Label>
                  <Input
                    id="whatsapp"
                    placeholder="https://wa.me/880XXXXXXXXXX"
                    value={siteForm.whatsapp}
                    onChange={(e) => setSiteForm((f) => ({ ...f, whatsapp: e.target.value }))}
                  />
                </div>
              </div>

              <Separator />

              {/* Google Map */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-islamic-dark flex items-center gap-2">
                  <Map className="size-4" />
                  {t('settings.googleMap')}
                </h3>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs text-amber-700">
                    {t('settings.mapHint')}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="map-url">{t('settings.mapEmbedUrl')}</Label>
                  <Input
                    id="map-url"
                    placeholder="https://www.google.com/maps/embed?pb=..."
                    value={siteForm.mapEmbedUrl}
                    onChange={(e) => setSiteForm((f) => ({ ...f, mapEmbedUrl: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSaveSite}
                  disabled={savingSite}
                  className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
                >
                  {savingSite && <Loader2 className="size-4 animate-spin" />}
                  <Save className="size-4" />
                  {t('settings.save')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== Payment Tab ========== */}
        <TabsContent value="payment">
          <div className="space-y-6">
            {/* Payment Methods Management */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-islamic-dark flex items-center gap-2">
                  <CreditCard className="size-5" />
                  {t('settings.paymentMethods')}
                </CardTitle>
                <CardDescription>
                  {t('settings.paymentMethodsDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <p className="text-xs text-blue-700">
                    {t('settings.paymentMethodsHint')}
                  </p>
                </div>

                {/* Payment Methods List */}
                {localPaymentMethods.map((pm, idx) => (
                  <div key={idx} className="border rounded-lg p-4 bg-gray-50/50 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-islamic-dark flex items-center gap-2">
                        <span className="bg-islamic/10 text-islamic w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                        {t('settings.paymentMethodN', { n: idx + 1 })}
                      </h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePaymentMethod(idx)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 gap-1 cursor-pointer"
                      >
                        <Trash2 className="size-3.5" />
                        {t('common.delete')}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t('settings.pmName')}</Label>
                        <Input
                          placeholder={t('settings.pmNamePh')}
                          value={pm.name}
                          onChange={(e) => updatePaymentMethod(idx, 'name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('settings.pmNumber')}</Label>
                        <Input
                          placeholder={t('settings.pmNumberPh')}
                          value={pm.number}
                          onChange={(e) => updatePaymentMethod(idx, 'number', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('settings.pmType')}</Label>
                        <div className="flex gap-2 flex-wrap">
                          {['bkash', 'nagad', 'rocket', 'bank', 'default'].map((pmt) => (
                            <button
                              key={pmt}
                              type="button"
                              onClick={() => updatePaymentMethod(idx, 'type', pmt)}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                                pm.type === pmt
                                  ? pmt === 'bkash' ? 'bg-pink-500 text-white border-pink-500'
                                    : pmt === 'nagad' ? 'bg-orange-500 text-white border-orange-500'
                                    : pmt === 'rocket' ? 'bg-purple-500 text-white border-purple-500'
                                    : pmt === 'bank' ? 'bg-blue-500 text-white border-blue-500'
                                    : 'bg-islamic text-white border-islamic'
                                  : 'bg-white text-gray-600 border-gray-200 hover:border-islamic'
                              }`}
                            >
                              {pmt === 'default' ? t('settings.typeOther') : pmt === 'bkash' ? 'bKash' : pmt === 'nagad' ? 'Nagad' : pmt === 'rocket' ? 'Rocket' : pmt === 'bank' ? 'Bank' : pmt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Icon / Logo */}
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <Image className="size-4 text-islamic" />
                        {t('settings.iconLogo')}
                      </Label>

                      <div className="flex flex-col sm:flex-row gap-3">
                        {/* URL Input */}
                        <div className="flex-1 space-y-2">
                          <Input
                            placeholder={t('settings.iconUrlPh')}
                            value={pm.iconUrl || ''}
                            onChange={(e) => updatePaymentMethod(idx, 'iconUrl', e.target.value)}
                          />
                          <div className="flex gap-2">
                            {/* File Upload Button */}
                            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:border-islamic hover:text-islamic transition-all cursor-pointer">
                              <Image className="size-3.5" />
                              {t('settings.fileUpload')}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handlePaymentMethodIconUpload(idx, file);
                                }}
                              />
                            </label>
                            {/* Remove Icon Button */}
                            {pm.iconUrl && (
                              <button
                                type="button"
                                onClick={() => updatePaymentMethod(idx, 'iconUrl', '')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-xs font-medium text-red-600 hover:bg-red-100 transition-all cursor-pointer"
                              >
                                <X className="size-3.5" />
                                {t('settings.iconRemove')}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Icon Preview */}
                        <div className="flex-shrink-0 w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-white">
                          {pm.iconUrl ? (
                            <img
                              src={pm.iconUrl}
                              alt={pm.name || t('settings.iconAlt')}
                              className="w-full h-full object-contain p-1"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-1 text-gray-300">
                              <Image className="size-6" />
                              <span className="text-[9px]">{t('settings.noIcon')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add New Button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addPaymentMethod}
                  className="w-full gap-2 cursor-pointer border-dashed"
                >
                  <Plus className="size-4" />
                  {t('settings.addPaymentMethod')}
                </Button>

                {/* Save Button */}
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleSavePaymentMethods}
                    disabled={savingPaymentMethods}
                    className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
                  >
                    {savingPaymentMethods && <Loader2 className="size-4 animate-spin" />}
                    <Save className="size-4" />
                    {t('settings.savePaymentMethods')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Bohudur Payment Gateway */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-islamic-dark flex items-center gap-2">
                  <CreditCard className="size-5" />
                  Bohudur Payment Gateway
                </CardTitle>
                <CardDescription>
                  {t('settings.bohudurDesc')}
                </CardDescription>
              </CardHeader>
            <CardContent className="space-y-5">
              {/* Security Notice */}
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-start gap-2">
                  <Shield className="size-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    {t('settings.bohudurSecurityNote')}
                  </p>
                </div>
              </div>

              {/* Enable/Disable */}
              <div className="flex items-center justify-between p-4 rounded-lg border bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-islamic-dark">{t('settings.gatewayEnabled')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t('settings.gatewayEnabledDesc')}
                  </p>
                </div>
                <Switch
                  checked={bohudurForm.enabled}
                  onCheckedChange={(checked) => setBohudurForm((f) => ({ ...f, enabled: checked }))}
                />
              </div>

              {/* API Key */}
              <div className="space-y-2">
                <Label htmlFor="bohudur-api-key" className="flex items-center gap-2">
                  <CreditCard className="size-4 text-islamic" />
                  {t('settings.apiKey')}
                </Label>
                <Input
                  id="bohudur-api-key"
                  type="password"
                  placeholder={t('settings.apiKeyPh')}
                  value={bohudurForm.apiKey}
                  onChange={(e) => setBohudurForm((f) => ({ ...f, apiKey: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  {t('settings.apiKeyHelp')}
                </p>
              </div>

              {/* Currency */}
              <div className="space-y-2">
                <Label>{t('settings.currency')}</Label>
                <div className="flex gap-3">
                  {['BDT', 'USD', 'EUR', 'GBP'].map((cur) => (
                    <button
                      key={cur}
                      type="button"
                      onClick={() => setBohudurForm((f) => ({ ...f, currency: cur }))}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                        bohudurForm.currency === cur
                          ? 'bg-islamic text-white border-islamic'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-islamic'
                      }`}
                    >
                      {cur}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Redirect URLs */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-islamic-dark">Redirect URL</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
                      setBohudurForm((f) => ({
                        ...f,
                        redirectUrl: `${baseUrl}/payment/success`,
                        cancelUrl: `${baseUrl}/payment/cancel`,
                      }));
                      toast({ title: t('settings.autoTitle'), description: t('settings.redirectUrlSet') });
                    }}
                    className="gap-1 text-xs cursor-pointer h-7"
                  >
                    <Map className="size-3" />
                    {t('settings.autoSet')}
                  </Button>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-xs text-emerald-700 flex items-start gap-2">
                    <CheckCircle className="size-4 shrink-0 mt-0.5 text-emerald-500" />
                    <span>
                      {t('settings.redirectNote', { successUrl: '/payment/success', cancelUrl: '/payment/cancel' })}
                    </span>
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="redirect-url" className="flex items-center gap-1.5">
                    <CheckCircle className="size-3.5 text-emerald-500" />
                    {t('settings.redirectSuccessUrl')}
                  </Label>
                  <Input
                    id="redirect-url"
                    placeholder="https://your-site.com/payment/success"
                    value={bohudurForm.redirectUrl}
                    onChange={(e) => setBohudurForm((f) => ({ ...f, redirectUrl: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('settings.redirectSuccessUrlHelp')}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cancel-url" className="flex items-center gap-1.5">
                    <XCircle className="size-3.5 text-orange-500" />
                    {t('settings.cancelUrl')}
                  </Label>
                  <Input
                    id="cancel-url"
                    placeholder="https://your-site.com/payment/cancel"
                    value={bohudurForm.cancelUrl}
                    onChange={(e) => setBohudurForm((f) => ({ ...f, cancelUrl: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('settings.cancelUrlHelp')}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Webhook URLs */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-islamic-dark flex items-center gap-2">
                    <Link className="size-4 text-blue-500" />
                    Webhook URL
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
                      const webhookUrl = `${baseUrl}/api/payment/webhook`;
                      setBohudurForm((f) => ({
                        ...f,
                        webhookSuccessUrl: webhookUrl,
                        webhookCancelUrl: webhookUrl,
                      }));
                      toast({ title: t('settings.autoTitle'), description: t('settings.webhookUrlSet') });
                    }}
                    className="gap-1 text-xs cursor-pointer h-7"
                  >
                    <Map className="size-3" />
                    {t('settings.autoSet')}
                  </Button>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <p className="text-xs text-blue-700">
                    {t('settings.webhookInfo')}
                  </p>
                </div>

                {/* Webhook Status Indicator */}
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50">
                  <div className={`w-2.5 h-2.5 rounded-full ${bohudurForm.webhookSuccessUrl ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  <p className="text-xs text-muted-foreground">
                    Webhook: {bohudurForm.webhookSuccessUrl ? (
                      <span className="text-emerald-600 font-medium">{t('common.enabled')}</span>
                    ) : (
                      <span className="text-gray-500">{t('settings.webhookInactive')}</span>
                    )}
                    {bohudurForm.webhookSuccessUrl && bohudurForm.webhookCancelUrl && bohudurForm.webhookSuccessUrl === bohudurForm.webhookCancelUrl && (
                      <span className="ml-2 text-blue-600 font-medium">{t('settings.singleEndpoint')}</span>
                    )}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhook-success" className="flex items-center gap-1.5">
                    <CheckCircle className="size-3.5 text-emerald-500" />
                    Success Webhook URL
                  </Label>
                  <Input
                    id="webhook-success"
                    placeholder="https://your-site.com/api/payment/webhook"
                    value={bohudurForm.webhookSuccessUrl}
                    onChange={(e) => setBohudurForm((f) => ({ ...f, webhookSuccessUrl: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">{t('settings.webhookSuccessHelp')}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="webhook-cancel" className="flex items-center gap-1.5">
                    <XCircle className="size-3.5 text-orange-500" />
                    Cancel Webhook URL
                  </Label>
                  <Input
                    id="webhook-cancel"
                    placeholder="https://your-site.com/api/payment/webhook"
                    value={bohudurForm.webhookCancelUrl}
                    onChange={(e) => setBohudurForm((f) => ({ ...f, webhookCancelUrl: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">{t('settings.webhookCancelHelp')}</p>
                </div>

                {/* Webhook Flow Diagram */}
                <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-xs font-semibold text-islamic-dark mb-2">{t('settings.webhookHowTitle')}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <span className="bg-white px-2 py-1 rounded border">Bohudur</span>
                    <ArrowRight className="size-3 text-islamic" />
                    <span className="bg-blue-100 px-2 py-1 rounded border border-blue-200 text-blue-700">POST /webhook</span>
                    <ArrowRight className="size-3 text-islamic" />
                    <span className="bg-emerald-100 px-2 py-1 rounded border border-emerald-200 text-emerald-700">COMPLETED/CANCELLED</span>
                    <ArrowRight className="size-3 text-islamic" />
                    <span className="bg-white px-2 py-1 rounded border">{t('settings.firebaseUpdate')}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Test Connection & Save */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleTestBohudur}
                  disabled={testingBohudur || !bohudurForm.apiKey}
                  className="gap-2 cursor-pointer"
                >
                  {testingBohudur && <Loader2 className="size-4 animate-spin" />}
                  {t('settings.testConnection')}
                  {bohudurTestResult === 'success' && <CheckCircle className="size-4 text-emerald-500" />}
                  {bohudurTestResult === 'fail' && <AlertCircle className="size-4 text-red-500" />}
                </Button>
                <Button
                  onClick={handleSaveBohudur}
                  disabled={savingBohudur}
                  className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
                >
                  {savingBohudur && <Loader2 className="size-4 animate-spin" />}
                  <Save className="size-4" />
                  {t('settings.save')}
                </Button>
              </div>
            </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ========== Password Tab ========== */}
        <TabsContent value="password">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-islamic-dark flex items-center gap-2">
                <Lock className="size-5" />
                {t('settings.changePassword')}
              </CardTitle>
              <CardDescription>
                {t('settings.changePasswordDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="old-password">{t('settings.oldPassword')}</Label>
                <Input
                  id="old-password"
                  type="password"
                  placeholder={t('settings.oldPasswordPh')}
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, oldPassword: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  {t('settings.oldPasswordHint')}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">{t('settings.newPassword')}</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder={t('settings.newPasswordPh')}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">{t('settings.confirmPassword')}</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder={t('settings.confirmPasswordPh')}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSavePassword}
                  disabled={savingPassword}
                  className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
                >
                  {savingPassword && <Loader2 className="size-4 animate-spin" />}
                  <Shield className="size-4" />
                  {t('settings.changePasswordBtn')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== GitHub Config Tab ========== */}
        <TabsContent value="github">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-islamic-dark flex items-center gap-2">
                <Github className="size-5" />
                GitHub API Configuration
              </CardTitle>
              <CardDescription>
                {t('settings.githubDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-start gap-2">
                  <Shield className="size-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    {t('settings.githubSecurityNote')}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gh-token">Personal Access Token *</Label>
                <Input
                  id="gh-token"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxx"
                  value={githubForm.token}
                  onChange={(e) => setGithubForm((f) => ({ ...f, token: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gh-owner">Repository Owner *</Label>
                  <Input
                    id="gh-owner"
                    placeholder="username"
                    value={githubForm.owner}
                    onChange={(e) => setGithubForm((f) => ({ ...f, owner: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gh-repo">Repository Name *</Label>
                  <Input
                    id="gh-repo"
                    placeholder="repo-name"
                    value={githubForm.repo}
                    onChange={(e) => setGithubForm((f) => ({ ...f, repo: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gh-branch">Branch</Label>
                  <Input
                    id="gh-branch"
                    placeholder="main"
                    value={githubForm.branch}
                    onChange={(e) => setGithubForm((f) => ({ ...f, branch: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSaveGithub}
                  disabled={savingGithub}
                  className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
                >
                  {savingGithub && <Loader2 className="size-4 animate-spin" />}
                  <Save className="size-4" />
                  {t('settings.save')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== Class Routine & Syllabus Tab ========== */}
        <TabsContent value="tools">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-islamic-dark flex items-center gap-2">
                <CheckCircle className="size-5" />
                {t('settings.testConnection')}
              </CardTitle>
              <CardDescription>
                {t('settings.testConnectionDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* GitHub Status */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-islamic-dark flex items-center gap-2">
                  <Github className="size-4" />
                  GitHub API
                </h3>
                <div className="flex items-center gap-3 p-4 rounded-lg border bg-gray-50">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    testResult === 'success'
                      ? 'bg-emerald-100 text-emerald-600'
                      : testResult === 'fail'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-gray-100 text-gray-400'
                  }`}>
                    {testResult === 'success' ? (
                      <CheckCircle className="size-5" />
                    ) : testResult === 'fail' ? (
                      <AlertCircle className="size-5" />
                    ) : (
                      <Github className="size-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-islamic-dark">
                      {testResult === 'success'
                        ? t('settings.connectSuccess')
                        : testResult === 'fail'
                          ? t('settings.connectFailed')
                          : t('settings.notTested')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {githubConfig?.owner && githubConfig?.repo
                        ? `${githubConfig.owner}/${githubConfig.repo}`
                        : t('settings.githubNotConfigured')}
                    </p>
                  </div>
                  {testResult === 'success' && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Connected</Badge>
                  )}
                  {testResult === 'fail' && (
                    <Badge className="bg-red-100 text-red-700 border-red-200">Failed</Badge>
                  )}
                  <Button
                    onClick={handleTestGithub}
                    disabled={testingGithub || !githubForm.token || !githubForm.owner || !githubForm.repo}
                    size="sm"
                    className="gap-2 cursor-pointer"
                  >
                    {testingGithub && <Loader2 className="size-3.5 animate-spin" />}
                    {t('settings.test')}
                  </Button>
                </div>
              </div>

              {/* Bohudur Status */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-islamic-dark flex items-center gap-2">
                  <CreditCard className="size-4" />
                  Bohudur Payment API
                </h3>
                <div className="flex items-center gap-3 p-4 rounded-lg border bg-gray-50">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    bohudurTestResult === 'success'
                      ? 'bg-emerald-100 text-emerald-600'
                      : bohudurTestResult === 'fail'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-gray-100 text-gray-400'
                  }`}>
                    {bohudurTestResult === 'success' ? (
                      <CheckCircle className="size-5" />
                    ) : bohudurTestResult === 'fail' ? (
                      <AlertCircle className="size-5" />
                    ) : (
                      <CreditCard className="size-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-islamic-dark">
                      {bohudurTestResult === 'success'
                        ? t('settings.connectSuccess')
                        : bohudurTestResult === 'fail'
                          ? t('settings.connectFailed')
                          : t('settings.notTested')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {bohudurForm.apiKey
                        ? `API Key: ${bohudurForm.apiKey.substring(0, 8)}...`
                        : t('settings.bohudurKeyNotSet')}
                    </p>
                  </div>
                  {bohudurTestResult === 'success' && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Connected</Badge>
                  )}
                  {bohudurTestResult === 'fail' && (
                    <Badge className="bg-red-100 text-red-700 border-red-200">Failed</Badge>
                  )}
                  <Button
                    onClick={handleTestBohudur}
                    disabled={testingBohudur || !bohudurForm.apiKey}
                    size="sm"
                    className="gap-2 cursor-pointer"
                  >
                    {testingBohudur && <Loader2 className="size-3.5 animate-spin" />}
                    {t('settings.test')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== Tools Tab ========== */}
        <TabsContent value="tools">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Class Routine Management */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-islamic-dark flex items-center gap-2">
                  <CalendarDays className="size-5" />
                  {t('settings.routineManage')}
                </CardTitle>
                <CardDescription>
                  {t('settings.routineManageDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {classRoutine.map((item, index) => (
                  <div key={index} className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
                    <div className="space-y-1">
                      <Label className="text-xs">{t('classRoutine.time')}</Label>
                      <Input
                        value={item.time}
                        onChange={(e) => updateClassRoutineItem(index, 'time', e.target.value)}
                        placeholder={t('settings.routineTimePh')}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('classRoutine.subject')}</Label>
                      <Input
                        value={item.subject}
                        onChange={(e) => updateClassRoutineItem(index, 'subject', e.target.value)}
                        placeholder={t('settings.routineSubjectPh')}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('classRoutine.teacher')}</Label>
                      <Input
                        value={item.teacher}
                        onChange={(e) => updateClassRoutineItem(index, 'teacher', e.target.value)}
                        placeholder={t('settings.routineTeacherPh')}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('classRoutine.duration')}</Label>
                      <Input
                        value={item.duration}
                        onChange={(e) => updateClassRoutineItem(index, 'duration', e.target.value)}
                        placeholder={t('settings.routineDurationPh')}
                        className="h-9 text-sm"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeClassRoutineItem(index)}
                      className="h-9 text-red-500 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    onClick={addClassRoutineItem}
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs cursor-pointer"
                  >
                    <Plus className="size-3.5" />
                    {t('common.addNew')}
                  </Button>
                  <Button
                    onClick={handleSaveClassRoutine}
                    disabled={savingTools}
                    size="sm"
                    className="bg-islamic hover:bg-islamic-light text-white gap-1.5 text-xs cursor-pointer"
                  >
                    {savingTools ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                    {t('common.save')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Syllabus Management */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-islamic-dark flex items-center gap-2">
                  <BookOpen className="size-5" />
                  {t('settings.syllabusManage')}
                </CardTitle>
              <CardDescription>
                  {t('settings.syllabusManageDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {syllabus.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                    <div className="space-y-1">
                      <Label className="text-xs">{t('settings.syllabusName')}</Label>
                      <Input
                        value={item.name}
                        onChange={(e) => updateSyllabusItem(index, 'name', e.target.value)}
                        placeholder={t('settings.syllabusNamePh')}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('settings.syllabusYear')}</Label>
                      <Input
                        value={item.year}
                        onChange={(e) => updateSyllabusItem(index, 'year', e.target.value)}
                        placeholder={t('settings.syllabusYearPh')}
                        className="h-9 text-sm"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSyllabusItem(index)}
                      className="h-9 text-red-500 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    onClick={addSyllabusItem}
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs cursor-pointer"
                  >
                    <Plus className="size-3.5" />
                    {t('common.addNew')}
                  </Button>
                  <Button
                    onClick={handleSaveSyllabus}
                    disabled={savingTools}
                    size="sm"
                    className="bg-islamic hover:bg-islamic-light text-white gap-1.5 text-xs cursor-pointer"
                  >
                    {savingTools ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                    {t('common.save')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

        </TabsContent>
        {/* ========== Backup Tab ========== */}
        <TabsContent value="backup">
          <AdminBackup />
        </TabsContent>
      </Tabs>
    </div>
  );
}
