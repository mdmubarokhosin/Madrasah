'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  UserPlus, Loader2, CheckCircle, Send, AlertCircle, Upload, ImagePlus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import SectionHeading from './SectionHeading';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { dbPush, uploadFileToGithub } from '@/lib/db-service';
import { useToast } from '@/hooks/use-toast';

export default function OnlineAdmission({ hideHeading }: { hideHeading?: boolean }) {
  const { departments, githubConfig } = useAppStore();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
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
  });

  /* Image upload handler */
  const handleImageUpload = async (file: File): Promise<string> => {
    if (!githubConfig?.token || !githubConfig?.owner || !githubConfig?.repo) {
      toast({ title: t('common.error'), description: t('admission.githubNotConfigured'), variant: 'destructive' });
      return '';
    }
    try {
      const url = await uploadFileToGithub(file, githubConfig);
      return url;
    } catch {
      toast({ title: t('common.error'), description: t('admission.imageUploadFailed'), variant: 'destructive' });
      return '';
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.studentName.trim() || !formData.phone.trim() || !formData.fatherName.trim()) {
      toast({ title: t('common.error'), description: t('admission.requiredFields'), variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      await dbPush('/admissionApplications', {
        ...formData,
        status: 'pending',
        createdAt: Date.now(),
      });
      setSubmitted(true);
      setFormData({
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
      });
    } catch {
      toast({ title: t('common.error'), description: t('onlineAdmission.failed'), variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    return (
      <section id="online-admission" className="py-12 md:py-20 bg-gradient-to-b from-emerald-50 to-white relative">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-islamic-dark">{t('onlineAdmission.success')}</h3>
            <p className="text-gray-600">
              {t('onlineAdmission.subtitle')}
            </p>
            <Button
              onClick={() => setSubmitted(false)}
              variant="outline"
              className="mt-4 gap-2"
            >
              {t('onlineAdmission.title')}
            </Button>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="online-admission" className="py-12 md:py-20 bg-gradient-to-b from-emerald-50 to-white relative">
      <div className="absolute inset-0 islamic-pattern-bg pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {!hideHeading && (
          <SectionHeading
            title={t('onlineAdmission.title')}
            subtitle={t('onlineAdmission.subtitle')}
            arabicText={t('onlineAdmission.arabic')}
          />
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-lg border-emerald-100">
            <CardHeader>
              <CardTitle className="text-lg text-islamic-dark flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                {t('onlineAdmission.formTitle')}
              </CardTitle>
              <CardDescription>
                {t('onlineAdmission.formDesc')} <span className="text-red-500">*</span> {t('onlineAdmission.requiredField')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Student Info */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-islamic-dark flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-islamic text-white text-xs flex items-center justify-center">1</div>
                    {t('onlineAdmission.studentInfo')}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="studentName">{t('onlineAdmission.studentName')} *</Label>
                      <Input
                        id="studentName"
                        required
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
                        placeholder={t('onlineAdmission.fatherName')}
                        value={formData.fatherName}
                        onChange={(e) => handleChange('fatherName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="motherName">{t('onlineAdmission.motherName')}</Label>
                      <Input
                        id="motherName"
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
                        value={formData.dateOfBirth}
                        onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bloodGroup">{t('onlineAdmission.bloodGroup')}</Label>
                      <Input
                        id="bloodGroup"
                        placeholder={t('onlineAdmission.bloodGroup')}
                        value={formData.bloodGroup}
                        onChange={(e) => handleChange('bloodGroup', e.target.value)}
                      />
                    </div>

                    {/* Image Upload Section */}
                    <div className="space-y-2 sm:col-span-2">
                      <Label>{t('onlineAdmission.studentPhoto')}</Label>
                      <div className="flex items-center gap-3">
                        {formData.imageUrl ? (
                          <img
                            src={formData.imageUrl}
                            alt={t('common.preview')}
                            className="w-16 h-16 rounded-full object-cover border border-border"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border border-border">
                            <ImagePlus className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <Input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploading(true);
                            const url = await handleImageUpload(file);
                            if (url) {
                              setFormData((prev) => ({ ...prev, imageUrl: url }));
                            }
                            setUploading(false);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="gap-2 cursor-pointer"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                        >
                          {uploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          {uploading ? t('onlineAdmission.uploading') : t('onlineAdmission.uploadPhoto')}
                        </Button>
                      </div>
                      {!githubConfig?.token && (
                        <p className="text-xs text-amber-600">
                          {t('admission.githubNotConfigured')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-islamic-dark flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-islamic text-white text-xs flex items-center justify-center">2</div>
                    {t('onlineAdmission.contactInfo')}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t('onlineAdmission.phone')} *</Label>
                      <Input
                        id="phone"
                        required
                        placeholder="০১XXXXXXXXX"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="guardianPhone">{t('onlineAdmission.guardianPhone')}</Label>
                      <Input
                        id="guardianPhone"
                        placeholder="০১XXXXXXXXX"
                        value={formData.guardianPhone}
                        onChange={(e) => handleChange('guardianPhone', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="address">{t('onlineAdmission.address')}</Label>
                      <Textarea
                        id="address"
                        placeholder={t('onlineAdmission.address')}
                        rows={2}
                        value={formData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Education Info */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-islamic-dark flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-islamic text-white text-xs flex items-center justify-center">3</div>
                    {t('onlineAdmission.educationInfo')}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="previousEducation">{t('onlineAdmission.previousEducation')}</Label>
                      <Input
                        id="previousEducation"
                        placeholder={t('onlineAdmission.previousEducation')}
                        value={formData.previousEducation}
                        onChange={(e) => handleChange('previousEducation', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="desiredDepartment">{t('onlineAdmission.desiredDepartment')}</Label>
                      <select
                        id="desiredDepartment"
                        value={formData.desiredDepartment}
                        onChange={(e) => {
                          handleChange('desiredDepartment', e.target.value);
                          handleChange('desiredClass', '');
                        }}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">{t('onlineAdmission.desiredDepartment')}</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.name}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="desiredClass">{t('onlineAdmission.desiredClass')}</Label>
                      {formData.desiredDepartment && (() => {
                        const selectedDept = departments.find(d => d.name === formData.desiredDepartment);
                        const deptClasses = selectedDept?.classes || [];
                        if (deptClasses.length > 0) {
                          return (
                            <select
                              id="desiredClass"
                              value={formData.desiredClass}
                              onChange={(e) => handleChange('desiredClass', e.target.value)}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="">{t('onlineAdmission.desiredClass')}</option>
                              {deptClasses.map((cls, idx) => (
                                <option key={idx} value={cls}>
                                  {cls}
                                </option>
                              ))}
                            </select>
                          );
                        }
                        return (
                          <Input
                            id="desiredClass"
                            placeholder={t('onlineAdmission.desiredClass')}
                            value={formData.desiredClass}
                            onChange={(e) => handleChange('desiredClass', e.target.value)}
                          />
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={sending}
                    className="bg-islamic hover:bg-islamic-light text-white gap-2 font-semibold"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('onlineAdmission.submitting')}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        {t('onlineAdmission.submit')}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
