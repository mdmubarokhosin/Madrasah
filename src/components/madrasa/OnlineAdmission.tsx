'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  UserPlus, CheckCircle, Send, Camera, Info, ImagePlus, Trash2,
  Loader2, AlertTriangle, User, Phone, GraduationCap, ClipboardCheck,
} from 'lucide-react';
import { HButton } from '@/components/heroui/islamic';
import { Input } from '@heroui/react/input';
import { Label } from '@heroui/react/label';
import { TextArea } from '@heroui/react/textarea';
import { Select } from '@heroui/react/select';
import { ListBox } from '@heroui/react/list-box';
import MultiStepForm, { type FormStep } from '@/components/ui/multi-step-form';
import SectionHeading from './SectionHeading';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { dbGet, dbPush, uploadFileToGithub } from '@/lib/db-service';
import { useToast } from '@/hooks/use-toast';
import type { GithubConfig } from '@/types/database';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const EMPTY_FORM = {
  studentName: '',
  fatherName: '',
  motherName: '',
  dateOfBirth: '',
  phone: '',
  guardianPhone: '',
  address: '',
  previousEducation: '',
  desiredDepartment: '',
  desiredClass: '',
  bloodGroup: '',
  imageUrl: '',
};

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB before compression
const COMPRESS_MAX_DIM = 800;
const COMPRESS_QUALITY = 0.85;

/** Client-side image compression → keeps GitHub payload small & fast. */
async function compressImage(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, COMPRESS_MAX_DIM / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    return await new Promise<Blob>((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob && blob.size < file.size ? blob : file),
        'image/jpeg',
        COMPRESS_QUALITY
      );
    });
  } catch {
    return file;
  }
}

export default function OnlineAdmission({ hideHeading }: { hideHeading?: boolean }) {
  const { departments } = useAppStore();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [formData, setFormData] = useState(EMPTY_FORM);

  // Photo state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /* ── Photo selection + instant preview ── */
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: t('common.error'), description: t('onlineAdmission.photoInvalidType'), variant: 'destructive' });
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      toast({ title: t('common.error'), description: t('onlineAdmission.photoTooLarge'), variant: 'destructive' });
      return;
    }
    setPhotoFile(file);
    setPhotoPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return '';
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ── Submit: upload photo (GitHub repo API) → push application ── */
  const handleSubmit = async () => {
    if (!formData.studentName.trim() || !formData.phone.trim() || !formData.fatherName.trim()) {
      toast({ title: t('common.error'), description: t('admission.requiredFields'), variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      let imageUrl = '';

      // 1) Upload the student photo through the GitHub repo API (same system
      //    as every other upload on the site — config lives in /config/githubConfig)
      if (photoFile) {
        setUploadingPhoto(true);
        try {
          const cfg = await dbGet<GithubConfig>('/config/githubConfig');
          if (cfg?.token && cfg?.owner && cfg?.repo) {
            const blob = await compressImage(photoFile);
            const ext = (photoFile.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
            const safeName = `student-photo.${ext}`;
            const file = new File([blob], safeName, { type: blob.type || 'image/jpeg' });
            imageUrl = await uploadFileToGithub(file, {
              token: cfg.token,
              owner: cfg.owner,
              repo: cfg.repo,
              branch: cfg.branch || 'main',
            });
          } else {
            // Upload system not configured yet — the office copy covers the photo
            toast({ title: t('common.error'), description: t('onlineAdmission.photoNotConfigured'), variant: 'destructive' });
          }
        } finally {
          setUploadingPhoto(false);
        }
      }

      // 2) Save the application
      await dbPush('/admissionApplications', {
        ...formData,
        imageUrl,
        photoSubmittedOnline: Boolean(imageUrl),
        status: 'pending',
        createdAt: Date.now(),
      });
      setSubmitted(true);
      setFormData(EMPTY_FORM);
      removePhoto();
      setResetKey((k) => k + 1);
    } catch {
      toast({ title: t('common.error'), description: t('onlineAdmission.failed'), variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  /* ── Success screen ── */
  if (submitted) {
    return (
      <section id="online-admission" className="relative py-16 md:py-24 bg-white dark:bg-surface overflow-hidden">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="space-y-4"
          >
            <div className="w-20 h-20 rounded-full bg-success/10 border border-success/25 flex items-center justify-center mx-auto animate-breathe">
              <CheckCircle className="w-10 h-10 text-success" aria-hidden="true" />
            </div>
            <h3 className="text-2xl font-black text-islamic-dark">{t('onlineAdmission.success')}</h3>
            <p className="text-muted-foreground">
              {t('onlineAdmission.officeNote4')}
            </p>
            <HButton
              onPress={() => setSubmitted(false)}
              variant="outline"
              className="mt-4 gap-2 min-h-[44px] px-6 rounded-full"
            >
              {t('onlineAdmission.title')}
            </HButton>
          </motion.div>
        </div>
      </section>
    );
  }

  /* ── Step validators ── */
  const validateStep1 = () => {
    if (!formData.studentName.trim()) return t('onlineAdmission.errStudentName');
    if (!formData.fatherName.trim()) return t('onlineAdmission.errFatherName');
    return null;
  };
  const validateStep2 = () => {
    if (!photoFile) return t('onlineAdmission.errPhotoRequired');
    return null;
  };
  const validateStep3 = () => {
    if (!formData.phone.trim()) return t('onlineAdmission.errPhone');
    return null;
  };

  /* ── Step 2 content: photo upload ── */
  const photoStep = (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label={t('onlineAdmission.uploadPhoto')}
        onChange={handlePhotoChange}
      />

      {photoPreview ? (
        <div className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl border-2 border-dashed border-islamic/25 bg-islamic-lighter/20 dark:bg-white/5 p-4">
          <img
            src={photoPreview}
            alt={t('onlineAdmission.studentPhoto')}
            className="size-28 sm:size-32 rounded-xl object-cover ring-2 ring-islamic/20 shadow-md"
          />
          <div className="flex-1 min-w-0 text-center sm:text-start space-y-2">
            <p className="text-sm font-bold text-islamic-dark truncate max-w-full">{photoFile?.name}</p>
            <p className="text-xs text-muted-foreground">
              {photoFile ? `${Math.max(1, Math.round(photoFile.size / 1024))} KB` : ''}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <HButton
                variant="outline"
                size="sm"
                onPress={() => fileInputRef.current?.click()}
                className="rounded-full min-h-[40px] px-4 gap-1.5"
              >
                <ImagePlus className="size-4" aria-hidden="true" />
                {t('onlineAdmission.changePhoto')}
              </HButton>
              <HButton
                variant="danger"
                size="sm"
                onPress={removePhoto}
                className="rounded-full min-h-[40px] px-4 gap-1.5"
              >
                <Trash2 className="size-4" aria-hidden="true" />
                {t('onlineAdmission.removePhoto')}
              </HButton>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-islamic/30 bg-islamic-lighter/20 dark:bg-white/5 px-6 py-10 text-center transition-all hover:border-islamic/50 hover:bg-islamic-lighter/35 dark:hover:bg-white/10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-islamic/40"
          aria-label={t('onlineAdmission.uploadPhoto')}
        >
          <span className="grid size-14 place-items-center rounded-full bg-islamic/10 text-islamic">
            <Camera className="size-7" aria-hidden="true" />
          </span>
          <span className="text-sm font-bold text-islamic-dark">{t('onlineAdmission.choosePhoto')}</span>
          <span className="text-xs text-muted-foreground">{t('onlineAdmission.photoHint')}</span>
        </button>
      )}

      {/* Office note — 4 passport photos submitted directly at the office */}
      <div className="flex items-start gap-2.5 rounded-xl border border-gold-soft/40 bg-golden-lighter/40 dark:bg-golden-lighter px-4 py-3">
        <Info className="mt-0.5 w-4 h-4 shrink-0 text-gold-bright" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-foreground/85">
          {t('onlineAdmission.officeNote4')}
        </p>
      </div>
    </div>
  );

  /* ── Step 4 content: review + submit ── */
  const reviewRows: Array<{ label: string; value: string }> = [
    { label: t('onlineAdmission.studentName'), value: formData.studentName },
    { label: t('onlineAdmission.fatherName'), value: formData.fatherName },
    { label: t('onlineAdmission.motherName'), value: formData.motherName },
    { label: t('onlineAdmission.dateOfBirth'), value: formData.dateOfBirth },
    { label: t('onlineAdmission.bloodGroup'), value: formData.bloodGroup },
    { label: t('onlineAdmission.phone'), value: formData.phone },
    { label: t('onlineAdmission.guardianPhone'), value: formData.guardianPhone },
    { label: t('onlineAdmission.address'), value: formData.address },
    { label: t('onlineAdmission.previousEducation'), value: formData.previousEducation },
    { label: t('onlineAdmission.desiredDepartment'), value: formData.desiredDepartment },
    { label: t('onlineAdmission.desiredClass'), value: formData.desiredClass },
  ].filter((r) => r.value);

  const reviewStep = (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-bold text-islamic-dark">
        <ClipboardCheck className="size-4 text-islamic" aria-hidden="true" />
        {t('onlineAdmission.reviewTitle')}
      </div>
      <div className="rounded-2xl border border-islamic/10 bg-islamic-lighter/15 dark:bg-white/5 divide-y divide-islamic/10 dark:divide-white/10 overflow-hidden">
        {reviewRows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-3 px-4 py-2.5">
            <span className="text-xs font-semibold text-muted-foreground shrink-0">{row.label}</span>
            <span className="text-sm font-medium text-islamic-dark text-end min-w-0 break-words">{row.value}</span>
          </div>
        ))}
        <div className="flex items-center justify-between gap-3 px-4 py-2.5">
          <span className="text-xs font-semibold text-muted-foreground shrink-0">{t('onlineAdmission.studentPhoto')}</span>
          <span className="text-sm font-medium text-islamic-dark">{photoFile ? photoFile.name : '—'}</span>
        </div>
      </div>
      {(uploadingPhoto || sending) && photoFile && (
        <div className="flex items-center gap-2.5 rounded-xl bg-islamic-lighter/30 dark:bg-white/5 px-4 py-3 text-sm text-islamic-dark">
          <Loader2 className="size-4 animate-spin text-islamic" aria-hidden="true" />
          {uploadingPhoto ? t('onlineAdmission.photoUploading') : t('onlineAdmission.submitting')}
        </div>
      )}
      <div className="flex items-start gap-2.5 rounded-xl border border-gold-soft/40 bg-golden-lighter/40 dark:bg-golden-lighter px-4 py-3">
        <AlertTriangle className="mt-0.5 w-4 h-4 shrink-0 text-gold-bright" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-foreground/85">{t('onlineAdmission.officeNote4')}</p>
      </div>
    </div>
  );

  const steps: FormStep[] = [
    {
      title: t('onlineAdmission.studentInfo'),
      shortTitle: t('onlineAdmission.shortStudent'),
      icon: <User className="size-3.5" />,
      validate: validateStep1,
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="studentName">{t('onlineAdmission.studentName')} *</Label>
            <Input
              id="studentName"
              required
              fullWidth
              variant="secondary"
              placeholder={t('onlineAdmission.studentName')}
              value={formData.studentName}
              onChange={(e) => handleChange('studentName', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fatherName">{t('onlineAdmission.fatherName')} *</Label>
            <Input
              id="fatherName"
              required
              fullWidth
              variant="secondary"
              placeholder={t('onlineAdmission.fatherName')}
              value={formData.fatherName}
              onChange={(e) => handleChange('fatherName', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="motherName">{t('onlineAdmission.motherName')}</Label>
            <Input
              id="motherName"
              fullWidth
              variant="secondary"
              placeholder={t('onlineAdmission.motherName')}
              value={formData.motherName}
              onChange={(e) => handleChange('motherName', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">{t('onlineAdmission.dateOfBirth')}</Label>
            <Input
              id="dateOfBirth"
              type="date"
              fullWidth
              variant="secondary"
              value={formData.dateOfBirth}
              onChange={(e) => handleChange('dateOfBirth', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bloodGroup">{t('onlineAdmission.bloodGroup')}</Label>
            <Input
              id="bloodGroup"
              fullWidth
              variant="secondary"
              placeholder="A+ / B- / O+ …"
              value={formData.bloodGroup}
              onChange={(e) => handleChange('bloodGroup', e.target.value)}
            />
          </div>
        </div>
      ),
    },
    {
      title: t('onlineAdmission.studentPhoto'),
      shortTitle: t('onlineAdmission.shortPhoto'),
      icon: <Camera className="size-3.5" />,
      validate: validateStep2,
      content: photoStep,
    },
    {
      title: t('onlineAdmission.contactInfo'),
      shortTitle: t('onlineAdmission.shortContact'),
      icon: <Phone className="size-3.5" />,
      validate: validateStep3,
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">{t('onlineAdmission.phone')} *</Label>
            <Input
              id="phone"
              required
              inputMode="tel"
              fullWidth
              variant="secondary"
              placeholder="০১XXXXXXXXX"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardianPhone">{t('onlineAdmission.guardianPhone')}</Label>
            <Input
              id="guardianPhone"
              inputMode="tel"
              fullWidth
              variant="secondary"
              placeholder="০১XXXXXXXXX"
              value={formData.guardianPhone}
              onChange={(e) => handleChange('guardianPhone', e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">{t('onlineAdmission.address')}</Label>
            <TextArea
              id="address"
              fullWidth
              variant="secondary"
              placeholder={t('onlineAdmission.address')}
              rows={2}
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
            />
          </div>
        </div>
      ),
    },
    {
      title: t('onlineAdmission.educationInfo'),
      shortTitle: t('onlineAdmission.shortEducation'),
      icon: <GraduationCap className="size-3.5" />,
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="previousEducation">{t('onlineAdmission.previousEducation')}</Label>
            <Input
              id="previousEducation"
              fullWidth
              variant="secondary"
              placeholder={t('onlineAdmission.previousEducation')}
              value={formData.previousEducation}
              onChange={(e) => handleChange('previousEducation', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('onlineAdmission.desiredDepartment')}</Label>
            <Select
              aria-label={t('onlineAdmission.desiredDepartment')}
              placeholder={t('onlineAdmission.desiredDepartment')}
              value={formData.desiredDepartment || null}
              onChange={(value) => {
                const name = value == null ? '' : String(value);
                setFormData((prev) => ({ ...prev, desiredDepartment: name, desiredClass: '' }));
              }}
            >
              <Select.Trigger className="min-h-11 rounded-xl border border-islamic/15 bg-white dark:bg-field-background data-[focus-visible=true]:ring-2 data-[focus-visible=true]:ring-islamic/30">
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover className="rounded-xl border border-islamic/15 bg-white dark:bg-surface shadow-xl">
                <ListBox aria-label={t('onlineAdmission.desiredDepartment')}>
                  {departments.map((dept) => (
                    <ListBox.Item key={dept.id} id={dept.name} textValue={dept.name} className="rounded-lg px-3 py-2 text-sm data-[selected=true]:bg-islamic-lighter data-[selected=true]:font-semibold data-[hovered=true]:bg-islamic-lighter/60">
                      {dept.name}
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>{t('onlineAdmission.desiredClass')}</Label>
            {formData.desiredDepartment && (() => {
              const selectedDept = departments.find((d) => d.name === formData.desiredDepartment);
              const deptClasses = selectedDept?.classes || [];
              if (deptClasses.length > 0) {
                return (
                  <Select
                    aria-label={t('onlineAdmission.desiredClass')}
                    placeholder={t('onlineAdmission.desiredClass')}
                    value={formData.desiredClass || null}
                    onChange={(value) => {
                      handleChange('desiredClass', value == null ? '' : String(value));
                    }}
                  >
                    <Select.Trigger className="min-h-11 rounded-xl border border-islamic/15 bg-white dark:bg-field-background data-[focus-visible=true]:ring-2 data-[focus-visible=true]:ring-islamic/30">
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover className="rounded-xl border border-islamic/15 bg-white dark:bg-surface shadow-xl">
                      <ListBox aria-label={t('onlineAdmission.desiredClass')}>
                        {deptClasses.map((cls, idx) => (
                          <ListBox.Item key={idx} id={cls} textValue={cls} className="rounded-lg px-3 py-2 text-sm data-[selected=true]:bg-islamic-lighter data-[selected=true]:font-semibold data-[hovered=true]:bg-islamic-lighter/60">
                            {cls}
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                );
              }
              return (
                <Input
                  id="desiredClass"
                  fullWidth
                  variant="secondary"
                  placeholder={t('onlineAdmission.desiredClass')}
                  value={formData.desiredClass}
                  onChange={(e) => handleChange('desiredClass', e.target.value)}
                />
              );
            })()}
          </div>
        </div>
      ),
    },
    {
      title: t('onlineAdmission.reviewTitle'),
      shortTitle: t('onlineAdmission.shortReview'),
      icon: <ClipboardCheck className="size-3.5" />,
      content: reviewStep,
    },
  ];

  return (
    <section id="online-admission" className="relative py-16 md:py-24 bg-white dark:bg-surface overflow-hidden">
      <div className="absolute inset-0 islamic-pattern-bg pointer-events-none" aria-hidden="true" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {!hideHeading && (
          <SectionHeading
            title={t('onlineAdmission.title')}
            subtitle={t('onlineAdmission.subtitle')}
            arabicText={t('onlineAdmission.arabic')}
          />
        )}

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <div className="card-cinema rounded-3xl relative overflow-hidden">
            <div
              className="absolute inset-0 bg-gradient-to-br from-islamic-lighter/60 via-white to-golden-lighter/40 dark:from-islamic-lighter/20 dark:via-surface dark:to-golden-lighter/10 pointer-events-none"
              aria-hidden="true"
            />
            <div className="relative p-5 sm:p-8 md:p-10">
              {/* Form header */}
              <div className="flex flex-col items-center gap-3 pb-6 mb-8 border-b border-islamic/10 dark:border-white/10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-islamic to-primary flex items-center justify-center shadow-lg shadow-islamic/25 flex-shrink-0">
                  <UserPlus className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg md:text-xl font-black text-islamic-dark">{t('onlineAdmission.formTitle')}</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {t('onlineAdmission.formDesc')} <span className="text-danger">*</span> {t('onlineAdmission.requiredField')}
                  </p>
                </div>
              </div>

              <MultiStepForm
                steps={steps}
                onSubmit={handleSubmit}
                submitting={sending}
                submitLabel={t('onlineAdmission.submit')}
                onValidationError={(msg) => toast({ title: t('common.error'), description: msg, variant: 'destructive' })}
                resetKey={resetKey}
                hint={
                  <p className="text-[11px] leading-relaxed text-muted-foreground flex items-center gap-1.5">
                    <Send className="size-3 shrink-0 text-islamic" aria-hidden="true" />
                    {t('onlineAdmission.formDesc')}
                  </p>
                }
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
