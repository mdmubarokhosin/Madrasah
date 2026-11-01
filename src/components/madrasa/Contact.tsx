'use client';

import { useState, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Send, Facebook, Youtube, MessageCircle, User } from 'lucide-react';
import { Heading } from '@heroui/react/typography';
import { Input } from '@heroui/react/input';
import { TextArea } from '@heroui/react/textarea';
import { Label } from '@heroui/react/label';
import SectionHeading from './SectionHeading';
import MultiStepForm, { type FormStep } from '@/components/ui/multi-step-form';
import { HButton, HCard, IconMedallion } from '@/components/heroui/islamic';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { dbPush } from '@/lib/db-service';
import { useToast } from '@/hooks/use-toast';

/* Eight-point Islamic star ornament — pure SVG, decorative */
function StarOrnament({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} style={style} aria-hidden="true">
      <path d="M50 2 L59 26 L83 17 L74 41 L98 50 L74 59 L83 83 L59 74 L50 98 L41 74 L17 83 L26 59 L2 50 L26 41 L17 17 L41 26 Z" stroke="currentColor" strokeWidth="1" />
      <circle cx="50" cy="50" r="14" stroke="currentColor" strokeWidth="1" />
      <circle cx="50" cy="50" r="5" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

export default function Contact({ hideHeading }: { hideHeading?: boolean }) {
  const { siteInfo } = useAppStore();
  const { t } = useTranslation();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.phone.trim() || !formData.message.trim()) return;

    setSending(true);
    try {
      await dbPush('/contactMessages', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        message: formData.message.trim(),
        date: new Date().toISOString(),
        isRead: false,
        createdAt: Date.now(),
      });
      setSubmitted(true);
      setResetKey((k) => k + 1);
      setTimeout(() => {
        setSubmitted(false);
        setFormData({ name: '', email: '', phone: '', message: '' });
      }, 3000);
    } catch {
      toast({ title: t('contact.failed'), variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const contactInfo = [
    { icon: MapPin, label: t('common.location'), value: siteInfo?.address || t('contact.notSet') },
    { icon: Phone, label: t('contact.phone'), value: siteInfo?.phone || t('contact.notSet') },
    { icon: Mail, label: t('contact.email'), value: siteInfo?.email || t('contact.notSet') },
    { icon: Clock, label: t('contact.officeHours'), value: siteInfo?.officeHours || t('contact.notSet') },
  ];

  const socialLinks = [
    { icon: Facebook, label: t('footer.facebook'), url: siteInfo?.facebook },
    { icon: Youtube, label: t('footer.youtube'), url: siteInfo?.youtube },
    { icon: MessageCircle, label: t('footer.whatsapp'), url: siteInfo?.whatsapp },
  ];

  const handleSocialClick = (url: string | undefined) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const mapEmbedUrl = siteInfo?.mapEmbedUrl;

  return (
    <section id="contact" className="paper relative bg-paper py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {!hideHeading && (
          <SectionHeading
            title={t('contact.title')}
            subtitle={t('contact.subtitle')}
            arabicText={t('contact.arabic')}
          />
        )}

        <div className="grid gap-6 md:gap-8 lg:grid-cols-2">
          {/* Contact Info — dark geo panel + map */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            <div className="geo-dark relative overflow-hidden rounded-3xl p-6 md:p-8">
              {/* Decorative corner star */}
              <StarOrnament
                className="animate-spin-slow pointer-events-none h-40 w-40 text-gold-soft/10 md:h-52 md:w-52"
                style={{ position: 'absolute', top: '-2.5rem', insetInlineEnd: '-2.5rem' }}
              />

              {/* Contact rows — icon left, details right */}
              <div className="space-y-5">
                {contactInfo.map((info) => (
                  <div key={info.label} className="flex items-center gap-3.5">
                    <IconMedallion
                      icon={info.icon}
                      tone="gold"
                      className="bg-white/8 ring-white/12 text-gold-soft"
                    />
                    <div className="min-w-0">
                      <p className="mb-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-gold-soft/80">{info.label}</p>
                      <p className="break-words text-sm leading-relaxed text-white/85 text-start">{info.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hairline-gold my-6 opacity-70" aria-hidden="true" />

              {/* Socials — card-night circles */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <span className="me-1 text-xs font-semibold text-white/60">{t('contact.socialMedia')}</span>
                {socialLinks.map((social) => (
                  <button
                    key={social.label}
                    onClick={() => handleSocialClick(social.url)}
                    className={`card-night flex h-11 w-11 items-center justify-center rounded-full text-gold-soft transition-colors hover:text-gold-bright ${!social.url ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                    aria-label={social.label}
                    title={social.url ? t('contactPage.visitSocial', { label: social.label }) : t('contactPage.socialNotSet', { label: social.label })}
                  >
                    <social.icon className="size-5" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>

            {/* Google Map Embed */}
            <HCard className="rounded-3xl border border-islamic/10 bg-white shadow-sm">
              {mapEmbedUrl ? (
                <iframe
                  src={mapEmbedUrl}
                  width="100%"
                  className="h-[200px] md:h-[300px]"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={t('contactPage.googleMap')}
                />
              ) : (
                <div className="flex h-48 w-full items-center justify-center bg-islamic-lighter/60">
                  <div className="text-center">
                    <MapPin className="mx-auto mb-2 size-10 text-islamic" aria-hidden="true" />
                    <p className="text-sm text-gray-500">{t('contactPage.googleMap')}</p>
                    <p className="text-xs text-gray-400">{t('contactPage.setMapUrl')}</p>
                  </div>
                </div>
              )}
            </HCard>
          </motion.div>

          {/* Contact Form — cinema card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <HCard className="card-cinema rounded-3xl">
              <div className="p-6 md:p-8 w-full">
                <Heading level={3} className="mb-1 text-center text-lg font-bold text-islamic-dark">{t('contact.submit')}</Heading>
                <div className="hairline-gold mx-auto mb-6 w-24" aria-hidden="true" />

                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="py-10 text-center"
                  >
                    <IconMedallion
                      icon={Send}
                      tone="emerald"
                      className="mx-auto mb-4 size-16 bg-islamic-lighter ring-islamic/10 text-islamic [&>svg]:size-7"
                    />
                    <p className="text-lg font-semibold text-islamic-dark">{t('contact.success')}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{t('contact.subtitle')}</p>
                  </motion.div>
                ) : (
                  <MultiStepForm
                    resetKey={resetKey}
                    submitting={sending}
                    submitLabel={t('contact.submit')}
                    onSubmit={handleSubmit}
                    steps={[
                      {
                        title: t('contact.stepIdentity'),
                        shortTitle: t('contact.stepIdentityShort'),
                        icon: <User className="size-3.5" />,
                        validate: () =>
                          !formData.name.trim() || !formData.phone.trim()
                            ? t('contact.errIdentity')
                            : null,
                        content: (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="name" className="text-sm font-medium text-islamic-dark/90">
                                {t('contact.name')} *
                              </Label>
                              <Input
                                id="name"
                                required
                                fullWidth
                                placeholder={t('contact.name')}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="h-11 rounded-xl border-border bg-white focus:border-islamic"
                              />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium text-islamic-dark/90">
                                  {t('contact.email')}
                                </Label>
                                <Input
                                  id="email"
                                  type="email"
                                  fullWidth
                                  placeholder="example@email.com"
                                  value={formData.email}
                                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                  className="h-11 rounded-xl border-border bg-white focus:border-islamic"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="phone" className="text-sm font-medium text-islamic-dark/90">
                                  {t('contact.phone')} *
                                </Label>
                                <Input
                                  id="phone"
                                  required
                                  fullWidth
                                  placeholder="০১XXXXXXXXX"
                                  value={formData.phone}
                                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                  className="h-11 rounded-xl border-border bg-white focus:border-islamic"
                                />
                              </div>
                            </div>
                          </div>
                        ),
                      },
                      {
                        title: t('contact.stepMessage'),
                        shortTitle: t('contact.stepMessageShort'),
                        icon: <MessageCircle className="size-3.5" />,
                        validate: () =>
                          !formData.message.trim() ? t('contact.errMessage') : null,
                        content: (
                          <div className="space-y-2">
                            <Label htmlFor="message" className="text-sm font-medium text-islamic-dark/90">
                              {t('contact.message')} *
                            </Label>
                            <TextArea
                              id="message"
                              required
                              fullWidth
                              placeholder={t('contact.writeMessage')}
                              rows={5}
                              value={formData.message}
                              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                              className="resize-none rounded-xl border-border bg-white focus:border-islamic"
                            />
                          </div>
                        ),
                      },
                    ]}
                  />
                )}
              </div>
            </HCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
