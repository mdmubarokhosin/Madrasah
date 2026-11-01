'use client';

import { hashPassword, verifyPassword } from '@/lib/password';
import { useState, useEffect } from 'react';
import { Globe, Lock, Github, Loader2, Save, Shield, Link, Map, Facebook, Youtube, MessageCircle, CreditCard, Plus, Trash2, CalendarDays, BookOpen, Image as ImageIcon, X, Archive, Film, Upload, ImagePlus, KeyRound, MessagesSquare, TriangleAlert, RefreshCw } from 'lucide-react';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import AdminBackup from './AdminBackup';
import { RecoveryKeyDialog } from './RecoveryKeyDialog';
import { useAppStore } from '@/store/app-store';
import { dbSet, dbGet, dbUpdate, uploadFileToGithub } from '@/lib/db-service';
import { getAuthInstance } from '@/lib/firebase';
import { saveSecurityQuestion, saveRecoveryKeyHash, generateRecoveryKey } from '@/lib/admin-recovery';
import { toML, type MLValue } from '@/lib/multilingual';
import { MLTextarea } from '@/components/admin/MLFields';
import type { SiteInfo, GithubConfig, ClassRoutineItem, SyllabusItem, PaymentMethod } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/lib/i18n-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/** Preset security questions (stored as i18n keys; custom questions store raw text). */
const RECOVERY_PRESET_QUESTIONS = ['adminRecovery.q1', 'adminRecovery.q2', 'adminRecovery.q3', 'adminRecovery.q4', 'adminRecovery.q5'];

interface RecoveryProfile {
  username?: string;
  email?: string;
  passwordHash?: string | null;
  password?: string | null;
  securityQuestion?: string | null;
  securityAnswerHash?: string | null;
  recoveryKeyHash?: string | null;
  recoverySetupAt?: number | null;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminSettings() {
  const { siteInfo, githubConfig, classRoutine, syllabus, loadGithubConfig } = useAppStore();
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

  /* ===== Recovery setup state (v2.3) ===== */
  const [recoveryProfile, setRecoveryProfile] = useState<RecoveryProfile | null>(null);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(false);
  const [qSelect, setQSelect] = useState('');
  const [qCustom, setQCustom] = useState('');
  const [qAnswer, setQAnswer] = useState('');
  const [savingRecovery, setSavingRecovery] = useState(false);
  const [confirmKeyGen, setConfirmKeyGen] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);

  /* GitHub form */
  const [githubForm, setGithubForm] = useState<GithubConfig>({ token: '', owner: '', repo: '', branch: 'main' });
  const [savingGithub, setSavingGithub] = useState(false);

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

  /* Media upload state (logo + cinematic background videos) */
  const [uploadingMedia, setUploadingMedia] = useState<string | null>(null);

  /* Upload logo/video to GitHub and bind it to a siteInfo field */
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'heroVideoUrl' | 'aboutVideoUrl' | 'bannerVideoUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (e.target) e.target.value = '';

    const isVideo = field !== 'logoUrl';
    if (isVideo && !file.type.startsWith('video/')) {
      toast({ title: t('common.error'), description: t('settings.videoFileOnly'), variant: 'destructive' });
      return;
    }
    if (!isVideo && !file.type.startsWith('image/')) {
      toast({ title: t('common.error'), description: t('adminGallery.imageOnly'), variant: 'destructive' });
      return;
    }
    const maxSize = isVideo ? 20 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ title: t('common.error'), description: isVideo ? t('adminGallery.videoSizeMax') : t('adminGallery.fileSizeMax'), variant: 'destructive' });
      return;
    }
    if (!githubConfig?.token || !githubConfig?.owner || !githubConfig?.repo) {
      toast({ title: t('common.error'), description: t('admission.githubNotConfigured'), variant: 'destructive' });
      return;
    }

    setUploadingMedia(field);
    try {
      const url = await uploadFileToGithub(file, {
        token: githubConfig.token,
        owner: githubConfig.owner,
        repo: githubConfig.repo,
        branch: githubConfig.branch || 'main',
      });
      setSiteForm((f) => ({ ...f, [field]: url }));
      toast({ title: t('common.success'), description: t('settings.mediaUploadSuccess') });
    } catch (err) {
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : t('settings.githubUploadFailed'),
        variant: 'destructive',
      });
    } finally {
      setUploadingMedia(null);
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
        logoUrl: (siteInfo as any).logoUrl || '',
        heroVideoUrl: (siteInfo as any).heroVideoUrl || '',
        aboutVideoUrl: (siteInfo as any).aboutVideoUrl || '',
        bannerVideoUrl: (siteInfo as any).bannerVideoUrl || '',
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

  /* Fetch GitHub config on demand (removed from the global visitor subscription) */
  useEffect(() => {
    loadGithubConfig();
  }, [loadGithubConfig]);

  /* ===== Password recovery (v2.3): load the fresh admin profile ===== */
  const currentAdminUid = useAppStore((s) => s.currentAdminUser?.id) || null;
  const loadRecoveryProfile = async () => {
    if (!currentAdminUid) return;
    setRecoveryLoading(true);
    try {
      const profile = await dbGet<RecoveryProfile>(`/adminUsers/${currentAdminUid}`);
      setRecoveryProfile(profile);
    } catch {
      setRecoveryProfile(null);
    } finally {
      setRecoveryLoading(false);
    }
  };
  useEffect(() => {
    loadRecoveryProfile();
  }, [currentAdminUid]);

  /** Resolve stored question text (i18n key → translated; raw → as-is). */
  const recoveryQuestionText = (() => {
    const q = recoveryProfile?.securityQuestion || '';
    if (!q) return '';
    return q.startsWith('adminRecovery.') ? t(q) : q;
  })();

  /** Save (or replace) the security question + answer. */
  const handleSaveSecurityQuestion = async () => {
    const question = qSelect === 'custom' ? qCustom.trim() : RECOVERY_PRESET_QUESTIONS.includes(qSelect) ? qSelect : '';
    if (!question || qAnswer.trim().length < 2) {
      toast({ title: t('common.error'), description: t('adminRegister.recoveryRequired'), variant: 'destructive' });
      return;
    }
    if (!currentAdminUid) return;
    const usernameForMirror = recoveryProfile?.username || useAppStore.getState().currentAdminUser?.username || '';
    setSavingRecovery(true);
    try {
      await saveSecurityQuestion(
        currentAdminUid,
        usernameForMirror,
        question,
        qAnswer.trim(),
        recoveryProfile?.recoveryKeyHash || null
      );
      toast({ title: t('common.success'), description: t('adminSettings.recoverySaved') });
      setEditingQuestion(false);
      setQSelect('');
      setQCustom('');
      setQAnswer('');
      await loadRecoveryProfile();
    } catch {
      toast({ title: t('common.error'), description: t('adminSettings.recoverySaveFailed'), variant: 'destructive' });
    } finally {
      setSavingRecovery(false);
    }
  };

  /** Generate a replacement one-time recovery key (after AlertDialog confirm). */
  const handleGenerateRecoveryKey = async () => {
    if (!currentAdminUid) return;
    const usernameForMirror = recoveryProfile?.username || useAppStore.getState().currentAdminUser?.username || '';
    setGeneratingKey(true);
    try {
      const key = generateRecoveryKey();
      await saveRecoveryKeyHash(
        currentAdminUid,
        usernameForMirror,
        key,
        recoveryProfile?.securityQuestion || null,
        recoveryProfile?.securityAnswerHash || null
      );
      // Surface the plaintext key exactly once via the shared dialog
      useAppStore.getState().setPendingRecoveryKey(key);
      setConfirmKeyGen(false);
      await loadRecoveryProfile();
    } catch {
      toast({ title: t('common.error'), description: t('adminSettings.recoverySaveFailed'), variant: 'destructive' });
    } finally {
      setGeneratingKey(false);
    }
  };


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
    if (!passwordForm.oldPassword) {
      toast({ title: t('common.error'), description: t('settings.oldPasswordRequired'), variant: 'destructive' });
      return;
    }
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
      // v2.3 FIX: the old implementation only rewrote /config/adminAuth — a node
      // that is no longer consulted at login (legacy Path C was removed). It
      // claimed success while the REAL login password stayed unchanged. Now the
      // change targets the live credential sources:
      //   1) verify the old password against the signed-in admin's profile hash
      //   2) update the Firebase Auth password (with re-authentication fallback)
      //   3) update the RTDB profile hash + keep the legacy nodes in sync
      const uid = useAppStore.getState().currentAdminUser?.id;
      if (!uid) throw new Error('no-admin-session');

      const profile = await dbGet<{
        username?: string;
        email?: string;
        passwordHash?: string | null;
        password?: string | null;
      }>(`/adminUsers/${uid}`);

      // 1) Verify the old password against the live profile hash (PBKDF2 /
      //    legacy SHA-256 / legacy plaintext are all handled by verifyPassword).
      let oldOk = profile ? (await verifyPassword(passwordForm.oldPassword, profile)).ok : false;
      if (!oldOk) {
        // Legacy fallback: old-site accounts may still authenticate against
        // /config/adminAuth.
        const legacy = await dbGet<{ passwordHash?: string | null; password?: string | null }>('/config/adminAuth').catch(() => null);
        oldOk = legacy ? (await verifyPassword(passwordForm.oldPassword, legacy)).ok : false;
      }
      if (!oldOk) {
        toast({ title: t('common.error'), description: t('settings.oldPasswordWrong'), variant: 'destructive' });
        setSavingPassword(false);
        return;
      }

      // 2) Firebase Auth password sync — only when the signed-in Auth user owns
      //    this profile (anonymous sessions skip: RTDB hash is the credential).
      let authSynced = false;
      const authUser = getAuthInstance().currentUser;
      if (authUser && !authUser.isAnonymous && profile?.email && authUser.email === profile.email) {
        try {
          await updatePassword(authUser, passwordForm.newPassword);
          authSynced = true;
        } catch (authErr) {
          if ((authErr as { code?: string })?.code === 'auth/requires-recent-login') {
            // Re-authenticate with the just-verified old password, then retry.
            const cred = EmailAuthProvider.credential(profile.email as string, passwordForm.oldPassword);
            await reauthenticateWithCredential(authUser, cred);
            await updatePassword(authUser, passwordForm.newPassword);
            authSynced = true;
          } else {
            throw authErr;
          }
        }
      }

      // 3) RTDB profile hash (a null `password` value strips any legacy plaintext)
      const newHash = await hashPassword(passwordForm.newPassword);
      await dbUpdate(`/adminUsers/${uid}`, { passwordHash: newHash, password: null });

      // Legacy parity (best-effort — registration seeds these too)
      dbSet('/config/adminAuth', { passwordHash: newHash, password: null }).catch(() => {});
      if (profile?.username) {
        dbSet('/settings/adminAuth', { username: profile.username, passwordHash: newHash, password: null }).catch(() => {});
      }

      toast({
        title: t('common.success'),
        description: authSynced ? t('adminSettings.passwordAuthSynced') : t('adminSettings.passwordRTDBOnly'),
      });
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
      // Keep the store in sync (no live subscription anymore)
      useAppStore.setState({ githubConfig: { ...githubForm } });
      toast({ title: t('common.success'), description: t('settings.githubSaved') });
    } catch {
      toast({ title: t('common.error'), description: t('common.saveFailed'), variant: 'destructive' });
    } finally {
      setSavingGithub(false);
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
        <TabsList className="grid w-full grid-cols-4 sm:grid-cols-8 h-auto gap-1 bg-surface-tertiary p-1 rounded-lg">
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
          <TabsTrigger
            value="recovery"
            className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Shield className="size-3.5" />
            {t('adminSettings.recoveryTab')}
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

              <Separator />

              {/* Logo & cinematic background videos (fully DB-driven) */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-islamic-dark flex items-center gap-2">
                  <Film className="size-4" />
                  {t('settings.mediaVideos')}
                </h3>
                <p className="text-xs text-muted-foreground">{t('settings.mediaVideosDesc')}</p>

                {/* Logo */}
                <div className="space-y-2">
                  <Label htmlFor="logo-url" className="flex items-center gap-2">
                    <ImagePlus className="w-4 h-4" />
                    {t('settings.logoUrl')}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="logo-url"
                      dir="ltr"
                      value={siteForm.logoUrl || ''}
                      onChange={(e) => setSiteForm((f) => ({ ...f, logoUrl: e.target.value }))}
                      placeholder="/logo.png"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="logo-upload-input"
                      onChange={(e) => handleMediaUpload(e, 'logoUrl')}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2 shrink-0 cursor-pointer"
                      disabled={uploadingMedia === 'logoUrl'}
                      onClick={() => document.getElementById('logo-upload-input')?.click()}
                    >
                      {uploadingMedia === 'logoUrl' ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                      <span className="hidden sm:inline">{t('settings.uploadLogo')}</span>
                    </Button>
                  </div>
                </div>

                {/* Background videos */}
                {([
                  { field: 'heroVideoUrl', labelKey: 'settings.heroVideoUrl' },
                  { field: 'aboutVideoUrl', labelKey: 'settings.aboutVideoUrl' },
                  { field: 'bannerVideoUrl', labelKey: 'settings.bannerVideoUrl' },
                ] as const).map(({ field, labelKey }) => (
                  <div key={field} className="space-y-2">
                    <Label htmlFor={field} className="flex items-center gap-2">
                      <Film className="w-4 h-4" />
                      {t(labelKey)}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id={field}
                        dir="ltr"
                        value={siteForm[field] || ''}
                        onChange={(e) => setSiteForm((f) => ({ ...f, [field]: e.target.value }))}
                        placeholder="https://...mp4"
                      />
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        id={`${field}-upload-input`}
                        onChange={(e) => handleMediaUpload(e, field)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2 shrink-0 cursor-pointer"
                        disabled={uploadingMedia === field}
                        onClick={() => document.getElementById(`${field}-upload-input`)?.click()}
                      >
                        {uploadingMedia === field ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                        <span className="hidden sm:inline">{t('settings.uploadVideo')}</span>
                      </Button>
                    </div>
                    {siteForm[field] ? (
                      <video
                        src={siteForm[field]}
                        muted
                        loop
                        autoPlay
                        playsInline
                        preload="metadata"
                        className="w-full max-w-xs h-28 rounded-lg border object-cover"
                      />
                    ) : null}
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">{t('settings.videoSizeMax20')}</p>
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
              <div className="rounded-lg border border-islamic/20 bg-islamic-lighter/60 p-3">
                <p className="text-xs text-islamic-dark">
                  {t('settings.socialHint')}
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="facebook" className="flex items-center gap-2">
                    <Facebook className="w-4 h-4 text-islamic-dark" />
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
                    <Youtube className="w-4 h-4 text-danger" />
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
                    <MessageCircle className="w-4 h-4 text-primary" />
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
                <div className="rounded-lg border border-warning/40 bg-warning/15 p-3">
                  <p className="text-xs text-warning-foreground">
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
                <div className="rounded-lg border border-islamic/20 bg-islamic-lighter/60 p-3">
                  <p className="text-xs text-islamic-dark">
                    {t('settings.paymentMethodsHint')}
                  </p>
                </div>

                {/* Payment Methods List */}
                {localPaymentMethods.map((pm, idx) => (
                  <div key={idx} className="border rounded-lg p-4 bg-surface-tertiary/50 space-y-4">
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
                        className="text-danger hover:text-danger hover:bg-danger/10 gap-1 cursor-pointer"
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
                                  ? pmt === 'bkash' ? 'bg-accent text-white border-accent'
                                    : pmt === 'nagad' ? 'bg-warning text-warning-foreground border-warning'
                                    : pmt === 'rocket' ? 'bg-golden text-white border-golden'
                                    : pmt === 'bank' ? 'bg-islamic text-white border-islamic'
                                    : 'bg-islamic text-white border-islamic'
                                  : 'bg-white text-muted-foreground border-border hover:border-islamic'
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
                        <ImageIcon className="size-4 text-islamic" />
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
                            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-white text-xs font-medium text-muted-foreground hover:border-islamic hover:text-islamic transition-all cursor-pointer">
                              <ImageIcon className="size-3.5" />
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
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-danger/40 bg-danger/10 text-xs font-medium text-danger hover:bg-danger/20 transition-all cursor-pointer"
                              >
                                <X className="size-3.5" />
                                {t('settings.iconRemove')}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Icon Preview */}
                        <div className="flex-shrink-0 w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-white">
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
                            <div className="flex flex-col items-center gap-1 text-muted-foreground/70">
                              <ImageIcon className="size-6" />
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

        {/* ========== Password Recovery Tab (v2.3) ========== */}
        <TabsContent value="recovery" className="space-y-4">
          {/* Setup hint */}
          <div className="flex items-start gap-2.5 rounded-xl border border-islamic/20 bg-islamic-lighter/60 px-4 py-3 text-sm text-islamic-dark">
            <TriangleAlert className="size-4 mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
            <span>{t('adminSettings.recoverySetupHint')}</span>
          </div>

          {/* Security question card */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-islamic-dark flex items-center gap-2">
                <MessagesSquare className="size-5" />
                {t('adminSettings.questionCardTitle')}
              </CardTitle>
              <CardDescription>{t('adminLogin.forgotMethodQuestionDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-xl">
              {recoveryLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="size-4 animate-spin" />
                  {t('common.loading')}
                </div>
              ) : (
                <>
                  {/* Status */}
                  <div className="flex items-center gap-2 text-sm">
                    {recoveryProfile?.securityQuestion && recoveryProfile?.securityAnswerHash ? (
                      <>
                        <Badge className="bg-green-100 text-green-800 border-green-300 rounded-full gap-1">
                          <Shield className="size-3" />
                          {t('adminSettings.questionSet')}
                        </Badge>
                      </>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-800 border-amber-300 rounded-full gap-1">
                        <TriangleAlert className="size-3" />
                        {t('adminSettings.questionNotSet')}
                      </Badge>
                    )}
                  </div>

                  {/* Current question (read-only) */}
                  {recoveryProfile?.securityQuestion && recoveryProfile?.securityAnswerHash && !editingQuestion && (
                    <div className="rounded-xl border bg-muted/50 px-4 py-3">
                      <p className="text-xs text-muted-foreground mb-1">{t('adminSettings.currentQuestion')}</p>
                      <p className="text-sm font-medium text-islamic-dark">{recoveryQuestionText}</p>
                    </div>
                  )}

                  {/* Edit form / edit button */}
                  {editingQuestion ? (
                    <div className="space-y-4 rounded-xl border border-islamic/20 p-4 bg-islamic-lighter/30">
                      {/* Question select */}
                      <div className="space-y-2">
                        <Label htmlFor="recovery-q-select">{t('adminRegister.securityQuestion')}</Label>
                        <select
                          id="recovery-q-select"
                          value={qSelect}
                          onChange={(e) => setQSelect(e.target.value)}
                          disabled={savingRecovery}
                          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-islamic/40 outline-none"
                        >
                          <option value="">{t('adminRegister.securityQuestionSelect')}</option>
                          {RECOVERY_PRESET_QUESTIONS.map((q) => (
                            <option key={q} value={q}>{t(q)}</option>
                          ))}
                          <option value="custom">{t('adminRecovery.qCustom')}</option>
                        </select>
                      </div>

                      {/* Custom question input */}
                      {qSelect === 'custom' && (
                        <div className="space-y-2">
                          <Label htmlFor="recovery-q-custom">{t('adminRegister.securityQuestionCustom')}</Label>
                          <Input
                            id="recovery-q-custom"
                            type="text"
                            value={qCustom}
                            onChange={(e) => setQCustom(e.target.value)}
                            placeholder={t('adminRecovery.qCustom')}
                            disabled={savingRecovery}
                            maxLength={120}
                          />
                        </div>
                      )}

                      {/* Answer */}
                      <div className="space-y-2">
                        <Label htmlFor="recovery-answer">{t('adminRegister.securityAnswer')}</Label>
                        <Input
                          id="recovery-answer"
                          type="text"
                          value={qAnswer}
                          onChange={(e) => setQAnswer(e.target.value)}
                          placeholder={t('adminRegister.securityAnswerPh')}
                          disabled={savingRecovery}
                          autoComplete="off"
                        />
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingQuestion(false);
                            setQSelect('');
                            setQCustom('');
                            setQAnswer('');
                          }}
                          disabled={savingRecovery}
                          className="cursor-pointer"
                        >
                          {t('adminSettings.cancelEdit')}
                        </Button>
                        <Button
                          onClick={handleSaveSecurityQuestion}
                          disabled={savingRecovery}
                          className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
                        >
                          {savingRecovery && <Loader2 className="size-4 animate-spin" />}
                          <Save className="size-4" />
                          {recoveryProfile?.securityQuestion ? t('adminSettings.changeQuestion') : t('adminSettings.setQuestion')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingQuestion(true);
                          setQSelect('');
                          setQCustom('');
                          setQAnswer('');
                        }}
                        className="gap-2 cursor-pointer"
                      >
                        <MessagesSquare className="size-4" />
                        {recoveryProfile?.securityQuestion ? t('adminSettings.changeQuestion') : t('adminSettings.setQuestion')}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Recovery key card */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-islamic-dark flex items-center gap-2">
                <KeyRound className="size-5" />
                {t('adminSettings.keyCardTitle')}
              </CardTitle>
              <CardDescription>{t('adminSettings.keyNotSetHint')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {recoveryProfile?.recoveryKeyHash ? (
                  <>
                    <Badge className="bg-green-100 text-green-800 border-green-300 rounded-full gap-1">
                      <Shield className="size-3" />
                      {t('adminSettings.keySet')}
                    </Badge>
                    {recoveryProfile.recoverySetupAt && (
                      <span className="text-xs text-muted-foreground">
                        {t('adminSettings.keySetAt')}:{' '}
                        {new Date(recoveryProfile.recoverySetupAt).toLocaleDateString(
                          useAppStore.getState().language === 'bn' ? 'bn-BD' : useAppStore.getState().language === 'ar' ? 'ar-EG' : 'en-US'
                        )}
                      </span>
                    )}
                  </>
                ) : (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-300 rounded-full gap-1">
                    <TriangleAlert className="size-3" />
                    {t('adminSettings.keyNotSet')}
                  </Badge>
                )}
              </div>

              <Button
                onClick={() => setConfirmKeyGen(true)}
                disabled={generatingKey || recoveryLoading}
                className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
              >
                {generatingKey ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                {t('adminSettings.generateKey')}
              </Button>
            </CardContent>
          </Card>

          {/* Confirm new key generation */}
          <AlertDialog open={confirmKeyGen} onOpenChange={setConfirmKeyGen}>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>{t('adminSettings.generateKeyConfirmTitle')}</AlertDialogTitle>
                <AlertDialogDescription>{t('adminSettings.generateKeyConfirmDesc')}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="cursor-pointer">{t('adminSettings.cancelEdit')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleGenerateRecoveryKey}
                  className="bg-islamic hover:bg-islamic-light text-white cursor-pointer"
                >
                  {generatingKey ? <Loader2 className="size-4 animate-spin" /> : t('adminSettings.confirmGenerate')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Shared one-time key display (also fires after registration) */}
          <RecoveryKeyDialog />
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
              <div className="rounded-lg border border-warning/40 bg-warning/15 p-3">
                <div className="flex items-start gap-2">
                  <Shield className="size-4 text-warning shrink-0 mt-0.5" />
                  <p className="text-xs text-warning-foreground">
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
                      className="h-9 text-danger hover:bg-danger/10 cursor-pointer"
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
                      className="h-9 text-danger hover:bg-danger/10 cursor-pointer"
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
